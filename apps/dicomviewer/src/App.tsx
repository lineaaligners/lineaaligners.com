import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import StudyList from './components/StudyList';
import Toolbar from './components/Toolbar';
import TagBrowser from './components/TagBrowser';
import ReportDialog from './components/ReportDialog';
import Viewer from './components/Viewer';
import { filesFromDrop, ingest } from './lib/browserIntake';
import { useStore } from './store';

export default function App() {
  const { t, i18n } = useTranslation();
  const { active, busy, toast } = useStore();
  const [drag, setDrag] = useState(false); const [tags, setTags] = useState(false); const [report, setReport] = useState(false);
  const files = useRef<HTMLInputElement>(null), folder = useRef<HTMLInputElement>(null);
  const pick = (e: React.ChangeEvent<HTMLInputElement>) => { const list = [...(e.target.files || [])].map(f => ({ name: f.webkitRelativePath || f.name, blob: f })); e.target.value = ''; if (list.length) ingest(list); };
  const setLang = (lng: string) => { i18n.changeLanguage(lng); document.documentElement.lang = lng; try { localStorage.setItem('lang', lng); } catch { /* ignore */ } };

  return (
    <div className="grid h-full grid-cols-[270px_1fr] grid-rows-[auto_auto_1fr]"
      onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={e => { if (!e.relatedTarget) setDrag(false); }}
      onDrop={async e => { e.preventDefault(); setDrag(false); ingest(await filesFromDrop(e.dataTransfer)); }}>
      <div role="note" className="col-span-2 bg-warn px-3 py-1 text-center text-[12.5px] font-medium text-black">{t('disclaimer')}</div>
      <header className="border-line col-span-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b bg-panel px-3 py-2">
        <div className="font-semibold whitespace-nowrap">Medident <span className="text-accent">DICOM</span></div>
        <div className="flex gap-1">
          <button className="btn primary" onClick={() => files.current?.click()}>{t('open_files')}</button>
          <button className="btn" onClick={() => folder.current?.click()}>{t('open_folder')}</button>
          <input ref={files} id="pick-files" type="file" multiple hidden onChange={pick} />
          <input ref={folder} id="pick-folder" type="file" multiple hidden onChange={pick} {...({ webkitdirectory: '' } as object)} />
        </div>
        <Toolbar onTags={() => setTags(true)} onReport={() => setReport(true)} />
        <select id="lang" aria-label="Language" className="btn ml-auto" value={i18n.language} onChange={e => setLang(e.target.value)}><option value="sq">Shqip</option><option value="en">English</option></select>
      </header>
      <aside className="border-line flex min-h-0 flex-col gap-3 overflow-y-auto border-r bg-panel p-3">
        <h2 className="text-muted text-[11px] font-medium tracking-widest uppercase">{t('studies')}</h2>
        <StudyList />
        {busy && <div role="status" className="text-muted text-xs">{busy.label}<div className="bg-line mt-1 h-1 overflow-hidden rounded"><div className="h-full bg-accent" style={{ width: `${(busy.pct ?? 0.15) * 100}%` }} /></div></div>}
      </aside>
      <main className="relative min-h-0 min-w-0 bg-black">
        {active ? <Viewer key={active.id} series={active} /> : (
          <div className="absolute inset-0 grid place-items-center p-6"><div className="flex max-w-[46ch] flex-col items-start gap-3">
            <h1 className="text-[22px] font-semibold text-balance">{t('welcome_title')}</h1><p className="text-muted">{t('welcome_body')}</p>
            <button className="btn primary" onClick={() => files.current?.click()}>{t('open_files')}</button>
          </div></div>
        )}
        {report && <ReportDialog onClose={() => setReport(false)} />}
        {tags && active && <TagBrowser series={active} onClose={() => setTags(false)} />}
        {drag && <div className="border-accent pointer-events-none absolute inset-2.5 z-30 grid place-items-center rounded-xl border-2 border-dashed bg-[#081c26]/85 text-lg">{t('drop_here')}</div>}
      </main>
      {toast && <div role="alert" className={`border-line fixed bottom-5 left-1/2 z-40 max-w-[min(90vw,560px)] -translate-x-1/2 rounded-md border border-l-[3px] bg-panel px-3.5 py-2 ${toast.bad ? 'border-l-bad' : 'border-l-accent'}`}>{toast.msg}</div>}
    </div>
  );
}
