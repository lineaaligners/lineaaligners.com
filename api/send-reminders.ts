import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  // Vercel automatically sends Authorization: Bearer $CRON_SECRET on scheduled cron invocations.
  // Require the same secret on any manual call so the endpoint can't be triggered publicly.
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || req.headers['authorization'] !== expected) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://edlkuctthlutcelyukoh.supabase.co';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const vapidPublic = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

    if (!serviceKey || !vapidPublic || !vapidPrivate) {
      res.status(500).json({ error: 'Server not configured — missing env vars' });
      return;
    }

    webpush.setVapidDetails('mailto:info@lineaaligners.com', vapidPublic, vapidPrivate);
    const supabase = createClient(supabaseUrl, serviceKey);

    // Patients whose aligner change is due today or tomorrow
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

    const { data: duePatients, error: dueErr } = await supabase
      .from('patients')
      .select('id, first_name, next_change_date')
      .in('next_change_date', [today, tomorrow])
      .eq('status', 'active');

    if (dueErr) throw dueErr;

    let sent = 0, failed = 0, skipped = 0;
    const results: any[] = [];

    for (const patient of duePatients || []) {
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('patient_id', patient.id);

      if (!subs || subs.length === 0) { skipped++; continue; }

      const isToday = patient.next_change_date === today;
      const title = 'Linea Aligners';
      const body = isToday
        ? `Hi ${patient.first_name}! Today's the day to change to your next aligner. 🦷`
        : `Hi ${patient.first_name}! Tomorrow it's time to change your aligner — get ready.`;

      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({ title, body, url: '/portal/' })
          );
          sent++;
        } catch (err: any) {
          failed++;
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          }
          results.push({ patient: patient.first_name, error: err.message });
        }
      }
    }

    res.status(200).json({ ok: true, patientsChecked: (duePatients || []).length, sent, failed, skipped, results });
  } catch (err: any) {
    console.error('send-reminders error:', err);
    res.status(500).json({ error: err.message });
  }
}
