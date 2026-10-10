import { createClient } from '@supabase/supabase-js';
// @ts-ignore - plain ESM helper
import { TOKEN_RE, hashToken, rateLimited, clientIp } from './_lib/onyxceph.mjs';

// Public, passwordless: POST /api/patient-plan  { token, action?: 'accept' }
// The token travels in the body (not the URL) so it never lands in access logs.
// Possession of the link = access to exactly one published plan.
// Every failure returns the same generic 404 so the endpoint can't be used
// to tell revoked, expired and non-existent links apart.

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://edlkuctthlutcelyukoh.supabase.co';
const unavailable = (res: any) => res.status(404).json({ error: 'unavailable' });

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  if (rateLimited('plan:' + clientIp(req), 30)) return res.status(429).json({ error: 'too_many_requests' });

  const body = typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body); } catch { return {}; } })() : (req.body || {});
  const token = String(body.token || '');
  if (!TOKEN_RE.test(token)) return unavailable(res);
  const action = body.action === 'accept' ? 'accept' : 'view';

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return res.status(500).json({ error: 'server_not_configured' });
  const db = createClient(SUPABASE_URL, serviceKey, { auth: { persistSession: false } });

  try {
    const { data: access } = await db.from('plan_access')
      .select('id,plan_id,expires_at,revoked_at,last_access_at')
      .eq('token_hash', hashToken(token)).maybeSingle();
    if (!access || access.revoked_at) return unavailable(res);
    if (access.expires_at && Date.parse(access.expires_at) < Date.now()) return unavailable(res);

    const { data: plan } = await db.from('treatment_plans')
      .select('id,patient_id,status,published_snapshot,published_at,version,accepted_at,accepted_version')
      .eq('id', access.plan_id).maybeSingle();
    if (!plan || plan.status === 'revoked' || !plan.published_snapshot) return unavailable(res);

    // ---- patient accepts the currently published version ------------------
    if (action === 'accept') {
      const version = Number.isInteger(plan.version) ? plan.version : null;
      if (plan.accepted_at && plan.accepted_version === version) {
        return res.status(200).json({ accepted_at: plan.accepted_at, accepted_version: version, already: true });
      }
      const now = new Date().toISOString();
      const { error } = await db.from('treatment_plans').update({ accepted_at: now, accepted_version: version }).eq('id', plan.id);
      if (error) throw error;
      await db.from('plan_audit').insert({ plan_id: plan.id, action: 'patient_accept_v' + (version ?? '?') });
      // shows up in the admin "Messages" tab and the patient's chat, using the existing realtime flow
      await db.from('messages').insert({ patient_id: plan.patient_id, sender: 'patient', content: '✅ E pranoj planin e trajtimit' + (version ? ' (versioni ' + version + ')' : '') + '.' });
      return res.status(200).json({ accepted_at: now, accepted_version: version, already: false });
    }

    const { data: p } = await db.from('patients')
      .select('first_name,current_aligner,next_change_date,doctor')
      .eq('id', plan.patient_id).maybeSingle();
    if (!p) return unavailable(res);

    // access log without the token: at most one write per hour per link
    if (!access.last_access_at || Date.now() - Date.parse(access.last_access_at) > 3600000) {
      db.from('plan_access').update({ last_access_at: new Date().toISOString() }).eq('id', access.id).then(() => {}, () => {});
    }

    const s = plan.published_snapshot || {};
    const total = Number.isInteger(s.total_aligners) ? s.total_aligners : null;
    const current = Number.isInteger(p.current_aligner) && p.current_aligner > 0 ? p.current_aligner : null;
    // Progress = aligner stage recorded in Linea / total aligners in the
    // published plan. Never derived from calendar time.
    const progress = total && current ? Math.min(100, Math.round((Math.min(current, total) / total) * 100)) : null;
    const version = Number.isInteger(plan.version) ? plan.version : null;
    const acceptedCurrent = !!plan.accepted_at && plan.accepted_version === version;

    return res.status(200).json({
      first_name: p.first_name || null,
      doctor: p.doctor || null,
      viewer_url: s.viewer_url,
      duration_months: s.duration_months ?? null,
      total_aligners: total,
      change_interval_days: s.change_interval_days ?? null,
      start_date: s.start_date ?? null,
      est_completion_date: s.est_completion_date ?? null,
      current_aligner: current,
      next_change_date: p.next_change_date || null,
      progress_pct: progress,
      published_at: plan.published_at,
      accepted_at: acceptedCurrent ? plan.accepted_at : null,
    });
  } catch {
    return unavailable(res);
  }
}
