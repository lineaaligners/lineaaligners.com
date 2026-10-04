import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// Admin-only: send a push to one patient or to everyone who enabled notifications.
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  try {
    const url = process.env.SUPABASE_URL || 'https://edlkuctthlutcelyukoh.supabase.co';
    const anonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_k2rMFCJWaVU5aGLKKqI97w_UH0qFtxS';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const vapidPublic = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
    if (!serviceKey || !vapidPublic || !vapidPrivate) {
      res.status(500).json({ error: 'Server not configured — missing env vars' });
      return;
    }

    // Verify the caller is a signed-in admin (uses their own JWT + the is_admin() DB function)
    const token = String(req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
    if (!token) { res.status(401).json({ error: 'Not signed in' }); return; }
    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: isAdmin, error: adminErr } = await userClient.rpc('is_admin');
    if (adminErr || isAdmin !== true) { res.status(403).json({ error: 'Admins only' }); return; }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const title = String(body.title || 'Linea Aligners').slice(0, 80);
    const message = String(body.body || '').slice(0, 300);
    const link = typeof body.url === 'string' && body.url.startsWith('/') ? body.url : '/portal/';
    if (!message.trim()) { res.status(400).json({ error: 'Message is required' }); return; }
    if (!body.all && !body.patient_id) { res.status(400).json({ error: 'patient_id or all is required' }); return; }

    webpush.setVapidDetails('mailto:info@lineaaligners.com', vapidPublic, vapidPrivate);
    const supabase = createClient(url, serviceKey);

    let q = supabase.from('push_subscriptions').select('*');
    if (!body.all) q = q.eq('patient_id', body.patient_id);
    const { data: subs, error } = await q;
    if (error) throw error;

    let sent = 0, failed = 0;
    for (const sub of subs || []) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title, body: message, url: link })
        );
        sent++;
      } catch (err: any) {
        failed++;
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
      }
    }
    res.status(200).json({ ok: true, sent, failed });
  } catch (err: any) {
    console.error('send-push error:', err);
    res.status(500).json({ error: err.message });
  }
}
