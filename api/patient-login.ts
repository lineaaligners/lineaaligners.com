import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Admin-only: create (or reset) a patient's portal login with a generated password.
// POST { patient_id } -> { email, username, phone, password }

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://edlkuctthlutcelyukoh.supabase.co';
const ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_k2rMFCJWaVU5aGLKKqI97w_UH0qFtxS';
const fail = (res: any, s: number, error: string) => res.status(s).json({ error });
const genPass = () => 'linea' + String(crypto.randomInt(1000, 10000));
const clean = (s: string) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return fail(res, 405, 'method_not_allowed');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return fail(res, 500, 'server_not_configured');
  const token = String(req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
  if (!token) return fail(res, 401, 'not_signed_in');
  const uc = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const { data: u, error: ue } = await uc.auth.getUser(token);
  if (ue || !u?.user) return fail(res, 401, 'not_signed_in');
  const { data: isAdmin } = await uc.rpc('is_admin');
  if (isAdmin !== true) return fail(res, 403, 'admins_only');

  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const id = String(b.patient_id || '');
  if (!id) return fail(res, 400, 'missing_patient');
  const db = createClient(SUPABASE_URL, serviceKey, { auth: { persistSession: false } });
  const { data: p, error: pe } = await db.from('patients').select('id,first_name,last_name,phone,email,username,user_id').eq('id', id).single();
  if (pe || !p) return fail(res, 404, 'patient_not_found');

  const password = genPass();
  let email = (p.email || '').trim().toLowerCase();
  let username = p.username || '';
  if (!username) username = (clean(p.first_name) + clean(p.last_name)) || ('pacient' + crypto.randomInt(1000, 9999));
  if (!email) email = username + '@patient.lineaaligners.local';

  try {
    if (p.user_id) {
      const { error } = await db.auth.admin.updateUserById(p.user_id, { password });
      if (error) throw error;
    } else {
      let { data: cu, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
      if (error && /already|registered|exists/i.test(error.message)) {
        // an auth user with this email exists already: find it and reset its password
        const { data: list } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const ex = list?.users?.find((x: any) => (x.email || '').toLowerCase() === email);
        if (!ex) throw error;
        const r = await db.auth.admin.updateUserById(ex.id, { password });
        if (r.error) throw r.error;
        cu = { user: ex } as any; error = null as any;
      }
      if (error || !cu?.user) throw error || new Error('create_failed');
      const upd: any = { user_id: cu.user.id, email };
      if (!p.username) upd.username = username;
      let { error: ee } = await db.from('patients').update(upd).eq('id', id);
      if (ee && /username/i.test(ee.message)) { upd.username = username + crypto.randomInt(10, 99); username = upd.username; ({ error: ee } = await db.from('patients').update(upd).eq('id', id)); }
      if (ee) throw ee;
    }
    return res.json({ email, username, phone: p.phone, password });
  } catch (e: any) { return fail(res, 500, e?.message || 'error'); }
}
