import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { API } from '../lib/ai';
import { ingest } from '../lib/browserIntake';
import { useStore } from '../store';

interface Patient { id: number; pid: string; name: string; birth: string; exams: number; last: string }
interface Exam { id: number; series_uid: string; date: string; modality: string; description: string; rows: number; cols: number; n_files: number; kind: 'volume' | 'image' }
const fmtDate = (d: string) => (d && d.length === 8 ? `${d.slice(6)}.${d.slice(4, 6)}.${d.slice(0, 4)}` : d || '—');

/** Patient -> timeline of exams -> open. Shown only when the local backend (and its inbox watcher) is running. */
export default function Library() {
  const { t } = useTranslation();
  const [online, setOnline] = useState(false); const [q, setQ] = useState(''); const [patients, setPatients] = useState<Patient[]>([]);
  const [sel, setSel] = useState<Patient | null>(null); const [exams, setExams] = useState<Exam[]>([]); const [waiting, setWaiting] = useState(0); const [inbox, setInbox] = useState('');
  const [opened, setOpened] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const st = await (await fetch(`${API}/api/library/status`)).json();
      const list = (await (await fetch(`${API}/api/library/patients?q=${encodeURIComponent(q)}`)).json()).patients as Patient[];
      setOnline(true); setWaiting(st.waiting); setInbox(st.inbox); setPatients(list);
    } catch { setOnline(false); }
  }, [q]);
  // new exports appear on their own: the list is refreshed while the page is open
  useEffect(() => { refresh(); const id = setInterval(refresh, 5000); return () => clearInterval(id); }, [refresh]);
  useEffect(() => {
    if (!sel) { setExams([]); return; }
    let dead = false;
    const load = () => fetch(`${API}/api/library/patients/${sel.id}/exams`).then(r => r.json()).then(r => { if (!dead) setExams(r.exams); }).catch(() => undefined);
    load(); const id = setInterval(load, 5000);
    return () => { dead = true; clearInterval(id); };
  }, [sel]);

  const openExam = async (e: Exam) => {
    const { say, setBusy } = useStore.getState();
    try {
      setBusy({ label: t('reading'), pct: null }); setOpened(e.id);
      const r = await fetch(`${API}/api/library/series/${e.id}/zip`); if (!r.ok) throw new Error(String(r.status));
      await ingest([{ name: `exam-${e.id}.zip`, blob: await r.blob() }]);
      const { studies, open } = useStore.getState();
      const hit = studies.flatMap(s => s.series).find(s => s.instances[0].seriesUid === e.series_uid) || studies.flatMap(s => s.series).at(-1);
      if (hit) open(hit);
    } catch (err) { say(t('err_open', { msg: (err as Error).message }), true); } finally { setBusy(null); }
  };

  if (!online) return null;
  const days = [...new Set(exams.map(e => e.date))];
  return (
    <section id="library" className="flex flex-col gap-2">
      <h2 className="text-muted text-[11px] font-medium tracking-widest uppercase">{t('lib_patients')}</h2>
      {!sel ? <>
        <input id="lib-q" aria-label={t('lib_search')} placeholder={t('lib_search')} value={q} onChange={e => setQ(e.target.value)} className="border-line rounded border bg-bg px-2 py-1" />
        {!patients.length && <p className="text-muted text-xs">{t('lib_empty', { folder: inbox })}</p>}
        <ul className="flex flex-col gap-1">{patients.map(p => (
          <li key={p.id}><button onClick={() => setSel(p)} className="border-line hover:border-muted w-full rounded-lg border px-2 py-1.5 text-left">
            <span className="block break-words">{p.name}</span>
            <span className="text-muted block text-xs tabular-nums">{[p.pid, `${p.exams} ${t('lib_exams')}`, fmtDate(p.last)].filter(Boolean).join(' · ')}</span>
          </button></li>
        ))}</ul>
      </> : <>
        <button className="btn self-start" onClick={() => setSel(null)}>← {t('lib_patients')}</button>
        <div><div className="font-medium break-words">{sel.name}</div><div className="text-muted text-xs">{[sel.pid, fmtDate(sel.birth)].filter(v => v && v !== '—').join(' · ')}</div></div>
        <ol id="lib-timeline" className="border-line ml-1 flex flex-col gap-3 border-l pl-3">{days.map(d => (
          <li key={d}><div className="text-muted mb-1 text-xs tabular-nums">{fmtDate(d)}</div>
            <ul className="flex flex-col gap-1">{exams.filter(e => e.date === d).map(e => (
              <li key={e.id}><button onClick={() => openExam(e)} className={`w-full rounded-lg border px-2 py-1.5 text-left ${opened === e.id ? 'border-accent bg-[#10222c]' : 'border-line hover:border-muted'}`}>
                <span className={`mr-1 rounded px-1 font-mono text-[10px] ${e.kind === 'volume' ? 'bg-[#173a4c] text-accent' : 'bg-[#23323b]'}`}>{e.kind === 'volume' ? '3D' : e.modality || '2D'}</span>
                <span className="break-words">{e.description || (e.kind === 'volume' ? 'CBCT' : t('lib_image'))}</span>
                <span className="text-muted block text-xs tabular-nums">{e.rows ? `${e.cols}×${e.rows}` : ''}{e.n_files > 1 ? ` · ${e.n_files} ${t('slices')}` : ''}</span>
              </button></li>
            ))}</ul>
          </li>
        ))}</ol>
      </>}
      {waiting > 0 && <p className="text-warn text-xs" role="status">{t('lib_waiting', { n: waiting })}</p>}
    </section>
  );
}
