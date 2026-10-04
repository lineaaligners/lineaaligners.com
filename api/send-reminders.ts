import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

async function pushToPatient(supabase: any, patientId: string, payload: any) {
  const { data: subs } = await supabase.from('push_subscriptions').select('*').eq('patient_id', patientId);
  let sent = 0, failed = 0;
  for (const sub of subs || []) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      );
      sent++;
    } catch (err: any) {
      failed++;
      if (err.statusCode === 410 || err.statusCode === 404) {
        await supabase.from('push_subscriptions').delete().eq('id', sub.id);
      }
    }
  }
  return { sent, failed, hadSubs: (subs || []).length > 0 };
}

export default async function handler(req: any, res: any) {
  // Vercel sends Authorization: Bearer $CRON_SECRET on scheduled runs.
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

    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

    let sent = 0, failed = 0, skipped = 0, alignerDue = 0, apptDue = 0;

    // 1) Aligner change due today / tomorrow
    const { data: duePatients, error: dueErr } = await supabase
      .from('patients')
      .select('id, first_name, next_change_date')
      .in('next_change_date', [today, tomorrow])
      .eq('status', 'active');
    if (dueErr) throw dueErr;

    for (const p of duePatients || []) {
      alignerDue++;
      const isToday = p.next_change_date === today;
      const body = isToday
        ? `Hi ${p.first_name}! Today's the day to change to your next aligner. 🦷`
        : `Hi ${p.first_name}! Tomorrow it's time to change your aligner — get ready.`;
      const r = await pushToPatient(supabase, p.id, { title: 'Linea Aligners', body, url: '/portal/' });
      sent += r.sent; failed += r.failed; if (!r.hadSubs) skipped++;
    }

    // 2) Appointments happening tomorrow
    const start = new Date(); start.setUTCHours(0, 0, 0, 0); start.setUTCDate(start.getUTCDate() + 1);
    const end = new Date(start); end.setUTCDate(end.getUTCDate() + 1);
    const { data: appts, error: apptErr } = await supabase
      .from('appointments')
      .select('patient_id, appointment_date')
      .eq('status', 'scheduled')
      .gte('appointment_date', start.toISOString())
      .lt('appointment_date', end.toISOString());
    if (apptErr) throw apptErr;

    const ids = [...new Set((appts || []).map((a: any) => a.patient_id))];
    const names: Record<string, string> = {};
    if (ids.length) {
      const { data: pts } = await supabase.from('patients').select('id, first_name').in('id', ids);
      for (const p of pts || []) names[p.id] = p.first_name;
    }
    for (const a of appts || []) {
      apptDue++;
      const time = new Date(a.appointment_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Belgrade' });
      const body = `Hi ${names[a.patient_id] || ''}! Reminder: you have an appointment tomorrow at ${time}.`.replace('Hi !', 'Hi!');
      const r = await pushToPatient(supabase, a.patient_id, { title: 'Linea Aligners', body, url: '/portal/' });
      sent += r.sent; failed += r.failed; if (!r.hadSubs) skipped++;
    }

    res.status(200).json({ ok: true, alignerDue, apptDue, sent, failed, skipped });
  } catch (err: any) {
    console.error('send-reminders error:', err);
    res.status(500).json({ error: err.message });
  }
}
