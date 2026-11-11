import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { buildReport } from '../lib/report';
import { useStore } from '../store';

const load = (k: string) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
const save = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } };
const fmtDate = (d: string) => (d.length === 8 ? `${d.slice(6)}.${d.slice(4, 6)}.${d.slice(0, 4)}` : d);
const sizeOf = (url: string) => new Promise<{ w: number; h: number }>(res => { const i = new Image(); i.onload = () => res({ w: i.naturalWidth, h: i.naturalHeight }); i.onerror = () => res({ w: 4, h: 3 }); i.src = url; });

export default function ReportDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { shots, removeShot, active, studies, say, accepted } = useStore();
  const [clinic, setClinic] = useState(() => load('clinic') || 'Medident'); const [logo, setLogo] = useState(() => load('logo')); const [notes, setNotes] = useState('');
  const study = studies.find(s => s.series.some(x => x.id === active?.id));

  const pickLogo = (f?: File) => { if (!f) return; const r = new FileReader(); r.onload = () => { setLogo(String(r.result)); save('logo', String(r.result)); }; r.readAsDataURL(f); };
  const make = async () => {
    try {
      const sized = await Promise.all(shots.map(async s => ({ ...s, ...(await sizeOf(s.url)) })));
      const doc = buildReport({
        clinic, logo: logo || undefined, title: t('report'), disclaimer: t('disclaimer'), notesLabel: t('notes'), notes, shots: sized, findingsLabel: t('x_accepted'), findings: accepted.map(a => a.text),
        patient: [[t('patient'), study?.patient || ''], [t('patient_id'), study?.patientId || ''], [t('study_date'), fmtDate(study?.date || '')], [t('study'), study?.desc || ''], [t('printed'), new Date().toLocaleDateString('sq-AL')]],
      });
      doc.save(`raport-${(study?.patient || 'pacient').replace(/\s+/g, '-')}.pdf`);
    } catch (e) { say(String((e as Error).message || e), true); }
  };
  return (
    <div className="absolute inset-0 z-20 flex flex-col gap-3 overflow-auto bg-panel/95 p-4">
      <div className="flex items-center gap-2"><h2 className="text-base font-semibold">{t('report')}</h2><button className="btn ml-auto" onClick={onClose}>{t('close')}</button></div>
      <div className="grid max-w-3xl grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2">
        <label htmlFor="r-clinic" className="text-muted">{t('clinic')}</label>
        <input id="r-clinic" value={clinic} onChange={e => { setClinic(e.target.value); save('clinic', e.target.value); }} className="border-line rounded border bg-bg px-2 py-1" />
        <label htmlFor="r-logo" className="text-muted">{t('logo')}</label>
        <div className="flex items-center gap-2">{logo && <img src={logo} alt="" className="h-8 rounded bg-white p-0.5" />}<input id="r-logo" type="file" accept="image/png,image/jpeg" onChange={e => pickLogo(e.target.files?.[0])} />{logo && <button className="btn" onClick={() => { setLogo(''); save('logo', ''); }}>{t('remove')}</button>}</div>
        <label htmlFor="r-notes" className="text-muted self-start">{t('notes')}</label>
        <textarea id="r-notes" rows={5} value={notes} onChange={e => setNotes(e.target.value)} className="border-line rounded border bg-bg px-2 py-1" />
      </div>
      {accepted.length > 0 && <><h3 className="text-muted text-[11px] font-medium tracking-widest uppercase">{t('x_accepted')}</h3><ul id="r-findings" className="list-disc pl-5">{accepted.map(a => <li key={a.key}>{a.text}</li>)}</ul></>}
      <h3 className="text-muted text-[11px] font-medium tracking-widest uppercase">{t('views')}</h3>
      {!shots.length && <p className="text-muted">{t('no_views')}</p>}
      <div className="flex flex-wrap gap-3">{shots.map((s, i) => (
        <figure key={i} className="border-line m-0 w-56 rounded border p-1.5"><img src={s.url} alt={s.caption} className="w-full" /><figcaption className="mt-1 flex items-center gap-2 text-xs"><span className="min-w-0 flex-1 break-words">{s.caption}</span><button className="btn" onClick={() => removeShot(i)}>{t('remove')}</button></figcaption></figure>
      ))}</div>
      <div><button id="make-pdf" className="btn primary" onClick={make}>{t('make_pdf')}</button></div>
    </div>
  );
}
