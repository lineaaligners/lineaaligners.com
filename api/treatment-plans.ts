import { createClient } from '@supabase/supabase-js';
// @ts-ignore - plain ESM helper shared with the public endpoint and tests
import { validatePlanFields, snapshotOf, newToken, hashToken, rateLimited } from './_lib/onyxceph.mjs';

// Admin-only management of OnyxCeph treatment plans.
// POST { action: 'list' | 'save' | 'publish' | 'revoke' | 'regenerate' | 'history', ... }

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://edlkuctthlutcelyukoh.supabase.co';
const ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_k2rMFCJWaVU5aGLKKqI97w_UH0qFtxS';
const APP_URL = (process.env.APP_URL || 'https://lineaaligners.com').replace(/\/+$/, '');
const DEFAULT_LINK_DAYS = 548; // ~18 months, covers a typical treatment + retention start

const fail = (res: any, status: number, error: string, extra: object = {}) => res.status(status).json({ error, ...extra });

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return fail(res, 405, 'method_not_allowed');

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return fail(res, 500, 'server_not_configured');

  // 1) authenticate + authorise: caller must be a signed-in Linea admin
  const token = String(req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
  if (!token) return fail(res, 401, 'not_signed_in');
  const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const { data: userData, error: userErr } = await userClient.auth.getUser(token);
  if (userErr || !userData?.user) return fail(res, 401, 'not_signed_in');
  const { data: isAdmin } = await userClient.rpc('is_admin');
  if (isAdmin !== true) return fail(res, 403, 'admins_only');
  const actor = userData.user.id;
  if (rateLimited('admin:' + actor, 120)) return fail(res, 429, 'too_many_requests');

  const body = typeof req.body === 'string' ? safeJson(req.body) : (req.body || {});
  const db = createClient(SUPABASE_URL, serviceKey, { auth: { persistSession: false } });
  const audit = (plan_id: string, action: string) => db.from('plan_audit').insert({ plan_id, action, actor });

  try {
    switch (body.action) {
      case 'list': {
        let q = db.from('treatment_plans').select('id,patient_id,case_ref,status,version,total_aligners,duration_months,start_date,est_completion_date,change_interval_days,viewer_url,notes,created_at,updated_at,published_at,revoked_at');
        if (body.patient_id) q = q.eq('patient_id', String(body.patient_id));
        const { data: plans, error } = await q.order('updated_at', { ascending: false }).limit(500);
        if (error) throw error;
        const ids = (plans || []).map(p => p.id);
        const access: Record<string, any> = {};
        if (ids.length) {
          const { data: acc } = await db.from('plan_access').select('plan_id,created_at,expires_at,revoked_at,last_access_at').in('plan_id', ids).is('revoked_at', null);
          for (const a of acc || []) access[a.plan_id] = a;
        }
        const now = Date.now();
        return res.status(200).json({
          plans: (plans || []).map(p => {
            const a = access[p.id];
            const link = !a ? 'none' : (a.expires_at && Date.parse(a.expires_at) < now ? 'expired' : 'active');
            return { ...p, link_status: link, link_expires_at: a?.expires_at ?? null, link_last_access_at: a?.last_access_at ?? null };
          }),
        });
      }

      case 'save': {
        const patientId = String(body.patient_id || '');
        if (!/^[0-9a-f-]{36}$/i.test(patientId)) return fail(res, 400, 'patient_required');
        const { data: patient } = await db.from('patients').select('id').eq('id', patientId).maybeSingle();
        if (!patient) return fail(res, 404, 'patient_not_found');
        const v = validatePlanFields(body);
        if (!v.ok) return fail(res, 400, v.error, { field: v.field });

        const { data: existing } = await db.from('treatment_plans').select('id,status').eq('patient_id', patientId).maybeSingle();
        const now = new Date().toISOString();
        if (existing) {
          const status = existing.status === 'published' || existing.status === 'updated' ? 'updated' : existing.status === 'revoked' ? 'revoked' : 'draft';
          const { data, error } = await db.from('treatment_plans').update({ ...v.plan, status, updated_at: now }).eq('id', existing.id).select().single();
          if (error) throw error;
          await audit(data.id, 'save');
          return res.status(200).json({ plan: data });
        }
        const { data, error } = await db.from('treatment_plans').insert({ ...v.plan, patient_id: patientId, status: 'draft', created_by: actor }).select().single();
        if (error) throw error;
        await audit(data.id, 'create');
        return res.status(200).json({ plan: data });
      }

      case 'publish': {
        const plan = await loadPlan(db, body.plan_id);
        if (!plan) return fail(res, 404, 'plan_not_found');
        const v = validatePlanFields(plan); // re-check what is stored before it becomes visible
        if (!v.ok) return fail(res, 400, v.error, { field: v.field });
        const snapshot = snapshotOf(v.plan);
        const version = (plan.version || 0) + 1;
        const now = new Date().toISOString();
        const { error: verErr } = await db.from('plan_versions').insert({ plan_id: plan.id, version, snapshot, published_by: actor, published_at: now });
        if (verErr) { if (verErr.code === '23505') return fail(res, 409, 'already_published_retry'); throw verErr; }
        const { error: upErr } = await db.from('treatment_plans').update({ published_snapshot: snapshot, version, status: 'published', published_by: actor, published_at: now, revoked_at: null, updated_at: now }).eq('id', plan.id);
        if (upErr) throw upErr;
        await audit(plan.id, 'publish_v' + version);

        // keep the existing active link if there is one; otherwise issue one
        const { data: active } = await db.from('plan_access').select('id,expires_at').eq('plan_id', plan.id).is('revoked_at', null).maybeSingle();
        const activeValid = active && !(active.expires_at && Date.parse(active.expires_at) < Date.now());
        if (activeValid) return res.status(200).json({ version, link: null, link_kept: true });
        if (active) await db.from('plan_access').update({ revoked_at: now }).eq('id', active.id);
        const link = await issueLink(db, plan.id, actor, body.expires_in_days);
        await audit(plan.id, 'link_issue');
        return res.status(200).json({ version, link, link_kept: false });
      }

      case 'regenerate': {
        const plan = await loadPlan(db, body.plan_id);
        if (!plan) return fail(res, 404, 'plan_not_found');
        if (!plan.published_snapshot) return fail(res, 400, 'publish_first');
        const now = new Date().toISOString();
        await db.from('plan_access').update({ revoked_at: now }).eq('plan_id', plan.id).is('revoked_at', null);
        const link = await issueLink(db, plan.id, actor, body.expires_in_days);
        if (plan.status === 'revoked') await db.from('treatment_plans').update({ status: 'published', revoked_at: null, updated_at: now }).eq('id', plan.id);
        await audit(plan.id, 'link_regenerate');
        return res.status(200).json({ link });
      }

      case 'revoke': {
        const plan = await loadPlan(db, body.plan_id);
        if (!plan) return fail(res, 404, 'plan_not_found');
        const now = new Date().toISOString();
        await db.from('plan_access').update({ revoked_at: now }).eq('plan_id', plan.id).is('revoked_at', null);
        await db.from('treatment_plans').update({ status: 'revoked', revoked_at: now, updated_at: now }).eq('id', plan.id);
        await audit(plan.id, 'revoke');
        return res.status(200).json({ ok: true });
      }

      case 'history': {
        const plan = await loadPlan(db, body.plan_id);
        if (!plan) return fail(res, 404, 'plan_not_found');
        const [{ data: versions }, { data: events }] = await Promise.all([
          db.from('plan_versions').select('version,published_at,snapshot').eq('plan_id', plan.id).order('version', { ascending: false }).limit(50),
          db.from('plan_audit').select('action,created_at').eq('plan_id', plan.id).order('created_at', { ascending: false }).limit(100),
        ]);
        return res.status(200).json({ versions: versions || [], events: events || [] });
      }

      default:
        return fail(res, 400, 'unknown_action');
    }
  } catch (e: any) {
    console.error('treatment-plans error:', e?.code || '', e?.message ? String(e.message).slice(0, 200) : '');
    return fail(res, 500, 'server_error');
  }
}

function safeJson(s: string) { try { return JSON.parse(s); } catch { return {}; } }

async function loadPlan(db: any, id: any) {
  if (!/^[0-9a-f-]{36}$/i.test(String(id || ''))) return null;
  const { data } = await db.from('treatment_plans').select('*').eq('id', String(id)).maybeSingle();
  return data;
}

async function issueLink(db: any, planId: string, actor: string, days: any) {
  const d = Number(days);
  const lifeDays = Number.isInteger(d) && d >= 1 && d <= 1095 ? d : DEFAULT_LINK_DAYS;
  for (let i = 0; i < 3; i++) {
    const token = newToken();
    const { error } = await db.from('plan_access').insert({
      plan_id: planId, token_hash: hashToken(token), created_by: actor,
      expires_at: new Date(Date.now() + lifeDays * 86400000).toISOString(),
    });
    if (!error) return `${APP_URL}/patient/#${token}`; // fragment: never sent to servers or logs
    if (error.code !== '23505') throw error;
  }
  throw new Error('could_not_issue_link');
}
