import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as ai from '../lib/ai';
import { cs, engine, loadVolume, TG } from '../lib/cs';
import type { Series } from '../lib/intake';
import { useStore } from '../store';
import MeshView from './MeshView';

const H = ({ children }: { children: React.ReactNode }) => <h3 className="text-muted mt-3 mb-1 text-[11px] font-medium tracking-widest uppercase first:mt-0">{children}</h3>;
const rgb = (l: number) => `rgb(${ai.colorOf(l).join(',')})`;

export default function AiPanel({ series, meshHost }: { series: Series; meshHost: HTMLElement | null }) {
  const { t } = useTranslation();
  const { tool, setTool, view3d, setView3d, say } = useStore();
  const [engines, setEngines] = useState<ai.EngineInfo[] | null>(null); const [gpu, setGpu] = useState<string | null>(null); const [down, setDown] = useState(false);
  const [engineName, setEngineName] = useState(''); const [run, setRun] = useState<{ stage: string; pct: number; elapsed: number } | null>(null);
  const [res, setRes] = useState<ai.AiResult | null>(null); const [hidden, setHidden] = useState<number[]>([]); const [opacity, setOpacity] = useState(0.45);
  const [counts, setCounts] = useState<Map<number, number>>(new Map()); const [active, setActive] = useState(1); const [brush, setBrush] = useState(3);
  const [tol, setTol] = useState(250); const [radius, setRadius] = useState(1.2); const [pts, setPts] = useState<number[][]>([]); const [version, setVersion] = useState(0);
  const [dirty, setDirty] = useState(false); const [from, setFrom] = useState(0); const [to, setTo] = useState(11);
  const ptsRef = useRef(pts); ptsRef.current = pts;

  useEffect(() => {
    ai.listEngines().then(r => { setEngines(r.engines); setGpu(r.gpu); setEngineName((r.engines.find(e => e.available && e.is_ai) || r.engines.find(e => e.available))?.name || ''); }).catch(() => setDown(true));
    return () => { ai.clear(); useStore.getState().setView3d('volume'); };
  }, [series]);

  const labels = useMemo(() => [...counts.keys()].sort((a, b) => a - b), [counts]);
  const vox = res ? res.meta.geometry.spacing.reduce((a, b) => a * b, 1) : 0;
  const conf = (l: number) => res?.meta.structures.find(s => s.label === l)?.confidence;
  const name = (l: number) => (ai.isTooth(l) ? `${t('ai_tooth')} ${l}` : t('ai_s_' + l));
  const touched = () => { setCounts(ai.census()); setDirty(true); };

  const start = async () => {
    try {
      setRun({ stage: 'upload', pct: 0, elapsed: 0 });
      const volumeId = await loadVolume(series, () => undefined);
      const r = await ai.segment(series, volumeId, engineName, (stage, pct, elapsed) => setRun({ stage, pct, elapsed }));
      setRes(r); setCounts(ai.census()); setHidden([]); setDirty(false); setVersion(v => v + 1);
      const first = r.meta.structures[0]?.label || 1; setActive(first); ai.setActiveLabel(first); ai.setBrushSize(brush, TG.mpr);
    } catch (e) { say(t('ai_failed', { msg: (e as Error).message }), true); } finally { setRun(null); }
  };

  // brush strokes change the labels without going through this panel: recount when a stroke ends
  useEffect(() => {
    if (!res || (tool !== 'brush' && tool !== 'eraser')) return;
    const up = () => setTimeout(touched, 50);
    window.addEventListener('pointerup', up); return () => window.removeEventListener('pointerup', up);
  }, [res, tool]);

  // region grow and canal points: plain clicks on the MPR views, converted to patient coordinates
  useEffect(() => {
    if (!res || (tool !== 'grow' && tool !== 'canal')) return;
    const handlers: [HTMLElement, (e: MouseEvent) => void][] = [];
    for (const id of ['ax', 'sag', 'cor']) {
      const vp = engine().getViewport(id) as cs.VolumeViewport | undefined; if (!vp) continue;
      const h = (e: MouseEvent) => {
        if (e.button !== 0) return; e.stopPropagation(); e.preventDefault();
        const r = vp.element.getBoundingClientRect(), world = [...vp.canvasToWorld([e.clientX - r.left, e.clientY - r.top])];
        if (tool === 'grow') { const n = ai.regionGrow(world, active, res.volumeId, tol); touched(); say(t('ai_grown', { n })); }
        else setPts([...ptsRef.current, world]);
      };
      vp.element.addEventListener('mousedown', h, true); handlers.push([vp.element, h]);
    }
    return () => handlers.forEach(([el, h]) => el.removeEventListener('mousedown', h, true));
  }, [res, tool, active, tol, say, t]);

  const pickLabel = (l: number) => { setActive(l); ai.setActiveLabel(l); };
  const toggle = (l: number) => { const on = hidden.includes(l); setHidden(on ? hidden.filter(x => x !== l) : [...hidden, l]); ai.setVisible(l, on); };
  const save = async () => { try { await ai.saveEdits(res!); setDirty(false); setVersion(v => v + 1); say(t('ai_saved')); } catch (e) { say(String((e as Error).message), true); } };
  const Btn = (p: { on?: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean }) => <button className="btn" disabled={p.disabled} aria-pressed={p.on} onClick={p.onClick}>{p.children}</button>;
  const row = (l: number) => (
    <label key={l} className="flex items-center gap-1.5">
      <input type="checkbox" checked={!hidden.includes(l)} onChange={() => toggle(l)} /><span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: rgb(l) }} />
      <span className="min-w-0 flex-1 truncate">{name(l)}</span>
      <span className="text-muted tabular-nums">{((counts.get(l) || 0) * vox / 1000).toFixed(1)} cm³</span>
      <span className="text-muted w-9 text-right tabular-nums" title={t('ai_conf')}>{conf(l) != null ? `${Math.round(conf(l)! * 100)}%` : '—'}</span>
    </label>
  );
  const visible = labels.filter(l => !hidden.includes(l));

  return (
    <div id="ai-panel" className="flex w-[304px] shrink-0 flex-col gap-1.5 overflow-y-auto rounded-xl border border-line bg-panel p-3 text-[13px]">
      <H>{t('ai_title')}</H>
      {down && <p className="text-warn text-xs">{t('ai_down')}</p>}
      {engines && <>
        <select id="ai-engine" aria-label={t('ai_engine')} className="btn" value={engineName} onChange={e => setEngineName(e.target.value)}>
          {engines.map(e => <option key={e.name} value={e.name} disabled={!e.available} title={e.reason}>{e.title}{e.available ? '' : ` (${t('ai_missing')})`}</option>)}
        </select>
        <p className="text-muted text-xs">{gpu ? `GPU: ${gpu}` : t('ai_cpu')}</p>
        <button id="ai-run" className="btn primary" disabled={!engineName || !!run} onClick={start}>{t('ai_run')}</button>
      </>}
      {run && <div role="status" className="text-xs"><div>{t('ai_stage')}: {run.stage} · {run.elapsed.toFixed(0)} s</div><div className="bg-line mt-1 h-1.5 overflow-hidden rounded"><div className="h-full bg-accent" style={{ width: `${run.pct * 100}%` }} /></div></div>}
      {res && <>
        <p className="text-xs" id="ai-summary">{res.meta.engine_title} · {res.meta.device.toUpperCase()} · {res.meta.seconds} s{!res.meta.is_ai && <span className="text-warn"> · {t('ai_not_ai')}</span>}</p>
        <H>{t('ai_structures')}</H>
        <div className="flex flex-col gap-0.5" id="ai-structures">{labels.filter(l => !ai.isTooth(l)).map(row)}</div>
        <details><summary className="cursor-pointer">{t('ai_teeth')} ({labels.filter(ai.isTooth).length}){res.meta.numbering !== 'model' && <span className="text-warn text-xs"> · {t('ai_rule')}</span>}</summary><div className="mt-1 flex flex-col gap-0.5">{labels.filter(ai.isTooth).map(row)}</div></details>
        <label htmlFor="ai-opacity" className="flex items-center gap-2"><span className="text-muted">{t('ai_opacity')}</span><input id="ai-opacity" type="range" min={0} max={1} step={0.05} value={opacity} onChange={e => { setOpacity(+e.target.value); ai.setOpacity(+e.target.value); }} className="w-full accent-[#5cc8ff]" /></label>
        <H>{t('ai_missing_teeth')}</H>
        <div className="flex flex-wrap gap-1" id="ai-missing">{res.meta.missing.length ? res.meta.missing.map(m => <button key={m.fdi} className="btn" disabled={!m.world} title={m.gap_mm ? `${m.gap_mm} mm` : ''} onClick={() => ai.jumpTo(m.world!)}>{m.fdi}</button>) : <span className="text-muted">{t('ai_none_missing')}</span>}</div>
        <H>{t('ai_edit')}</H>
        <select id="ai-active" aria-label={t('ai_active')} className="btn" value={active} onChange={e => pickLabel(+e.target.value)}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(l => <option key={l} value={l}>{name(l)}</option>)}{labels.filter(ai.isTooth).map(l => <option key={l} value={l}>{name(l)}</option>)}
        </select>
        <div className="flex flex-wrap gap-1">{(['brush', 'eraser', 'grow', 'canal'] as const).map(k => <Btn key={k} on={tool === k} onClick={() => { setTool(tool === k ? 'cross' : k); setPts([]); }}>{t('ai_t_' + k)}</Btn>)}</div>
        {(tool === 'brush' || tool === 'eraser') && <label htmlFor="ai-brush" className="flex items-center gap-2"><span className="text-muted">{t('ai_size')} {brush} mm</span><input id="ai-brush" type="range" min={0.5} max={10} step={0.5} value={brush} onChange={e => { setBrush(+e.target.value); ai.setBrushSize(+e.target.value, TG.mpr); }} className="w-full accent-[#5cc8ff]" /></label>}
        {tool === 'grow' && <><p className="text-warn text-xs">{t('ai_grow_hint')}</p><label htmlFor="ai-tol" className="flex items-center gap-2"><span className="text-muted">{t('ai_tol')} {tol}</span><input id="ai-tol" type="range" min={20} max={1000} step={10} value={tol} onChange={e => setTol(+e.target.value)} className="w-full accent-[#5cc8ff]" /></label></>}
        {tool === 'canal' && <>
          <p className="text-warn text-xs">{t('ai_canal_hint')}</p>
          <label htmlFor="ai-radius" className="flex items-center gap-2"><span className="text-muted">{t('ai_radius')} {radius} mm</span><input id="ai-radius" type="range" min={0.5} max={3} step={0.1} value={radius} onChange={e => setRadius(+e.target.value)} className="w-full accent-[#5cc8ff]" /></label>
          <div className="flex gap-1"><button id="ai-canal-done" className="btn primary" disabled={pts.length < 2 || (active !== 3 && active !== 4)} onClick={() => { ai.canalTube(pts, active, radius); setPts([]); touched(); }}>{t('ai_canal_done', { n: pts.length })}</button><Btn onClick={() => setPts([])}>{t('d_cancel')}</Btn></div>
          {active !== 3 && active !== 4 && <p className="text-muted text-xs">{t('ai_canal_pick')}</p>}
        </>}
        <div className="flex items-center gap-1"><span className="text-muted">{t('ai_renumber')}</span>
          <select id="ai-from" aria-label={t('ai_renumber')} className="btn" value={from} onChange={e => setFrom(+e.target.value)}><option value={0}>…</option>{labels.filter(ai.isTooth).map(l => <option key={l} value={l}>{l}</option>)}</select>→
          <select id="ai-to" aria-label={t('ai_renumber')} className="btn" value={to} onChange={e => setTo(+e.target.value)}>{[1, 2, 3, 4].flatMap(q => [1, 2, 3, 4, 5, 6, 7, 8].map(p => q * 10 + p)).map(l => <option key={l} value={l}>{l}</option>)}</select>
          <Btn disabled={!from || from === to} onClick={() => { ai.relabel(from, to); setFrom(0); touched(); }}>OK</Btn></div>
        <button id="ai-save" className={`btn ${dirty ? 'primary' : ''}`} disabled={!dirty} onClick={save}>{t('ai_save')}</button>
        <H>{t('ai_3d')}</H>
        <div className="flex gap-1"><Btn on={view3d === 'volume'} onClick={() => setView3d('volume')}>{t('ai_3d_volume')}</Btn><Btn on={view3d === 'mesh'} onClick={() => setView3d('mesh')}>{t('ai_3d_mesh')}</Btn></div>
        {dirty && view3d === 'mesh' && <p className="text-warn text-xs">{t('ai_mesh_stale')}</p>}
        <div className="flex flex-wrap gap-1">{[1, 2].filter(l => counts.has(l)).map(l => <a key={l} className="btn" href={ai.meshUrl(res, l, 'stl')} download={`${res.meta.structures.find(s => s.label === l)?.name || l}.stl`}>STL: {name(l)}</a>)}</div>
        {view3d === 'mesh' && meshHost && <MeshPortal host={meshHost}><MeshView result={res} visible={visible} opacity={Math.max(0.15, 1 - opacity)} version={version} /></MeshPortal>}
      </>}
    </div>
  );
}

import { createPortal } from 'react-dom';
function MeshPortal({ host, children }: { host: HTMLElement; children: React.ReactNode }) { return createPortal(children, host); }
