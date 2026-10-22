import { createClient } from '@supabase/supabase-js';

// Linea Menager (retainer-cleaner sales ERP) storage.
// Admin-only. One private JSON file per collection in the "erp" storage bucket (no SQL needed).
// POST { action: 'get'|'set'|'delete'|'list', collection, id?, data? }

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://edlkuctthlutcelyukoh.supabase.co';
const ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_k2rMFCJWaVU5aGLKKqI97w_UH0qFtxS';
const BUCKET = 'erp';
const COLS = new Set(['shitjet', 'shpenzimet', 'stoku', 'log']);
const fail = (res: any, s: number, error: string) => res.status(s).json({ error });

async function readCol(db: any, col: string): Promise<Record<string, any>> {
  const { data, error } = await db.storage.from(BUCKET).download(col + '.json');
  if (error || !data) {
    // first run: seed from env (migrated data from the old artifact)
    try { const seed = JSON.parse(process.env.ERP_SEED || '{}'); if (seed[col]) return seed[col]; } catch {}
    return {};
  }
  try { return JSON.parse(await data.text()) || {}; } catch { return {}; }
}
async function writeCol(db: any, col: string, obj: Record<string, any>) {
  const body = new Blob([JSON.stringify(obj)], { type: 'application/json' });
  const { error } = await db.storage.from(BUCKET).upload(col + '.json', body, { upsert: true, contentType: 'application/json' });
  if (error) throw new Error(error.message);
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return fail(res, 405, 'method_not_allowed');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return fail(res, 500, 'server_not_configured');
  const token = String(req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
  if (!token) return fail(res, 401, 'not_signed_in');
  const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const { data: u, error: ue } = await userClient.auth.getUser(token);
  if (ue || !u?.user) return fail(res, 401, 'not_signed_in');
  const { data: isAdmin } = await userClient.rpc('is_admin');
  if (isAdmin !== true) return fail(res, 403, 'admins_only');

  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const col = String(b.collection || '');
  if (!COLS.has(col)) return fail(res, 400, 'bad_collection');
  const id = b.id != null ? String(b.id).slice(0, 100) : '';
  const db = createClient(SUPABASE_URL, serviceKey, { auth: { persistSession: false } });
  await db.storage.createBucket(BUCKET, { public: false }).catch(() => {});
  try {
    const all = await readCol(db, col);
    if (b.action === 'list') return res.json({ docs: Object.entries(all).map(([k, v]) => ({ id: k, data: v })) });
    if (!id) return fail(res, 400, 'missing_id');
    if (b.action === 'get') return res.json({ data: all[id] ?? null });
    if (b.action === 'set') { if (typeof b.data !== 'object' || !b.data) return fail(res, 400, 'bad_data'); all[id] = b.data; await writeCol(db, col, all); return res.json({ ok: true }); }
    if (b.action === 'delete') { delete all[id]; await writeCol(db, col, all); return res.json({ ok: true }); }
    return fail(res, 400, 'bad_action');
  } catch (e: any) { return fail(res, 500, e?.message || 'error'); }
}
