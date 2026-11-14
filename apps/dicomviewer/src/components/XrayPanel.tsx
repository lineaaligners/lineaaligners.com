import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { cs, engine } from '../lib/cs';
import { percentile } from '../lib/pano';
import { API } from '../lib/ai';
import type { Series } from '../lib/intake';
import { useStore } from '../store';

interface Finding { id: number; kind: string; fdi: number | null; box: number[]; confidence: number }
interface Result { engine: string; seconds: number; numbering: string; findings: Finding[] }
interface EngineInfo { name: string; title: string; classes: string[] }
const COLORS: Record<string, string> = { caries: '#ff5c5c', deep_caries: '#ff2d2d', periapical_lesion: '#ff9f43', bone_loss: '#f368e0', restoration: '#54a0ff', root_canal_filling: '#00d2d3', implant: '#c8d6e5', crown: '#feca57', impacted_tooth: '#a29bfe' };
const colorOf = (k: string) => COLORS[k] || '#ffd166';

/** The displayed radiograph as an 8-bit grey PNG, bright = dense, independent of zoom and window. */
async function currentImagePng(): Promise<{ blob: Blob; imageId: string; w: number; h: number }> {
  const vp = engine().getViewport('stack') as cs.StackViewport, imageId = vp.getCurrentImageId()!;
  const image = cs.cache.getImage(imageId) as unknown as { getPixelData: () => ArrayLike<number>; rows: number; columns: number; invert?: boolean };
  const px = image.getPixelData(), w = image.columns, h = image.rows, n = w * h, step = Math.round(px.length / n);
  const lo = percentile(px, 0.005), hi = Math.max(lo + 1, percentile(px, 0.995)), f = 255 / (hi - lo);
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!, id = ctx.createImageData(w, h), out = new Uint32Array(id.data.buffer);
  for (let i = 0; i < n; i++) { let v = (px[i * step] - lo) * f; v = v < 0 ? 0 : v > 255 ? 255 : v | 0; if (image.invert) v = 255 - v; out[i] = 0xff000000 | (v << 16) | (v << 8) | v; }
  ctx.putImageData(id, 0, 0);
  const blob = await new Promise<Blob>((res, rej) => canvas.toBlob(b => (b ? res(b) : rej(new Error('PNG'))), 'image/png'));
  return { blob, imageId, w, h };
}

export default function XrayPanel({ series, host }: { series: Series; host: HTMLElement | null }) {
  const { t } = useTranslation();
  const { say, accepted, setAccepted } = useStore();
  const [engines, setEngines] = useState<EngineInfo[] | null>(null); const [down, setDown] = useState(false); const [name, setName] = useState('');
  const [view, setView] = useState<'pano' | 'intraoral'>(series.modality === 'PX' || series.cols / series.rows > 1.7 ? 'pano' : 'intraoral');
  const [busy, setBusy] = useState(false); const [res, setRes] = useState<Result | null>(null); const [imageId, setImageId] = useState('');
  const [status, setStatus] = useState<Record<number, 'accepted' | 'rejected'>>({}); const [, redraw] = useState(0); const [showTeeth, setShowTeeth] = useState(true);
  const [minConf, setMinConf] = useState(() => { try { return +(localStorage.getItem('xMinConf') || 30); } catch { return 30; } }); const [tooth, setTooth] = useState<number | null>(null);

  useEffect(() => { fetch(API + '/api/xray/engines').then(r => r.json()).then(r => { setEngines(r.engines); setName(r.engines[0]?.name || ''); }).catch(() => setDown(true)); }, []);
  // boxes follow zoom, pan, rotation and resizing of the view
  useEffect(() => {
    if (!host || !res) return;
    const el = host.querySelector<HTMLElement>('.el'); if (!el) return;
    const tick = () => redraw(n => n + 1), ro = new ResizeObserver(tick);
    el.addEventListener(cs.Enums.Events.CAMERA_MODIFIED, tick); ro.observe(el);
    return () => { el.removeEventListener(cs.Enums.Events.CAMERA_MODIFIED, tick); ro.disconnect(); };
  }, [host, res]);

  const label = (f: Finding) => t('x_k_' + f.kind, { defaultValue: f.kind.replace(/_/g, ' ') });
  const text = (f: Finding) => `${label(f)}${f.fdi ? ` · ${t('ai_tooth').toLowerCase()} ${f.fdi}` : ''} (${Math.round(f.confidence * 100)}%) · ${series.label}`;
  const key = (f: Finding) => `${series.id}#${f.id}`;
  const run = async () => {
    try {
      setBusy(true);
      const img = await currentImagePng(), body = new FormData(); body.append('file', img.blob, 'x.png');
      const r = await fetch(API + `/api/xray/analyze?engine=${encodeURIComponent(name)}&view=${view}`, { method: 'POST', body });
      if (!r.ok) throw new Error(await r.text());
      setAccepted(accepted.filter(a => !a.key.startsWith(series.id + '#')));
      setRes(await r.json()); setImageId(img.imageId); setStatus({});
    } catch (e) { say(t('ai_failed', { msg: (e as Error).message }), true); } finally { setBusy(false); }
  };
  const decide = (f: Finding, s: 'accepted' | 'rejected' | null) => {
    const next = { ...status }; if (s) next[f.id] = s; else delete next[f.id]; setStatus(next);
    const rest = accepted.filter(a => a.key !== key(f)); setAccepted(s === 'accepted' ? [...rest, { key: key(f), text: text(f), kind: f.kind, fdi: f.fdi }] : rest);
  };

  const vp = res && host ? (engine().getViewport('stack') as cs.StackViewport | undefined) : undefined;
  const toCanvas = (x: number, y: number) => vp!.worldToCanvas(cs.utilities.imageToWorldCoords(imageId, [x, y]) as never);
  const rect = (f: Finding) => { const a = toCanvas(f.box[0], f.box[1]), b = toCanvas(f.box[2], f.box[3]); return { x: Math.min(a[0], b[0]), y: Math.min(a[1], b[1]), w: Math.abs(b[0] - a[0]), h: Math.abs(b[1] - a[1]) }; };
  const teeth = res?.findings.filter(f => f.kind === 'tooth') || [], confident = res?.findings.filter(f => f.kind !== 'tooth' && f.confidence * 100 >= minConf) || [];
  const findings = tooth ? confident.filter(f => f.fdi === tooth) : confident;
  const present = new Set(teeth.map(f => f.fdi)), worst = new Map<number, Finding>();
  for (const f of confident) if (f.fdi && status[f.id] !== 'rejected' && (!worst.has(f.fdi) || worst.get(f.fdi)!.confidence < f.confidence)) worst.set(f.fdi, f);
  const acceptAll = () => {
    const next = { ...status }, add = findings.filter(f => !status[f.id]); for (const f of add) next[f.id] = 'accepted'; setStatus(next);
    setAccepted([...accepted, ...add.map(f => ({ key: key(f), text: text(f), kind: f.kind, fdi: f.fdi }))]);
  };
  const ROWS = [[18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28], [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]];

  return (
    <div id="xray-panel" className="flex w-[304px] shrink-0 flex-col gap-1.5 overflow-y-auto rounded-xl border border-line bg-panel p-3 text-[13px]">
      <h3 className="text-muted text-[11px] font-medium tracking-widest uppercase">{t('x_title')}</h3>
      {down && <p className="text-warn text-xs">{t('ai_down')}</p>}
      {engines && !engines.length && <p className="text-warn text-xs">{t('x_no_model')}</p>}
      {engines && engines.length > 0 && <>
        <select id="x-engine" aria-label={t('ai_engine')} className="btn" value={name} onChange={e => setName(e.target.value)}>{engines.map(e => <option key={e.name} value={e.name}>{e.title}</option>)}</select>
        <select id="x-view" aria-label={t('x_view')} className="btn" value={view} onChange={e => setView(e.target.value as 'pano' | 'intraoral')}><option value="pano">{t('x_pano')}</option><option value="intraoral">{t('x_intraoral')}</option></select>
        <button id="x-run" className="btn primary" disabled={busy || !name} onClick={run}>{busy ? '…' : t('x_run')}</button>
      </>}
      {res && <>
        <p className="text-xs" id="x-summary">{teeth.length} {t('ai_teeth').toLowerCase()} · {findings.length} {t('x_findings').toLowerCase()} · {res.seconds} s{res.numbering === 'rule-based' && <span className="text-warn"> · {t('ai_rule')}</span>}{res.numbering === 'none' && teeth.length > 0 && <span className="text-warn"> · {t('x_unnumbered')}</span>}</p>
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={showTeeth} onChange={e => setShowTeeth(e.target.checked)} />{t('x_show_teeth')}</label>
        <label className="flex items-center gap-2 text-xs">{t('x_min_conf')}<input id="x-conf" type="range" min={0} max={95} step={5} value={minConf} onChange={e => { setMinConf(+e.target.value); try { localStorage.setItem('xMinConf', e.target.value); } catch { /* storage unavailable */ } }} className="min-w-0 flex-1 accent-[#5cc8ff]" /><span className="tabular-nums">{minConf}%</span></label>
        <div id="x-chart" aria-label={t('x_chart')} className="flex flex-col gap-0.5">{ROWS.map((row, i) => (
          <div key={i} className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-px">{row.map((n, j) => { const w = worst.get(n); return (
            <button key={n} data-fdi={n} data-state={w ? 'finding' : present.has(n) ? 'present' : 'absent'} title={w ? `${n}: ${label(w)}` : String(n)} aria-pressed={tooth === n} onClick={() => setTooth(tooth === n ? null : n)}
              className={`rounded-sm border py-0.5 text-[9px] leading-none tabular-nums ${j === 8 ? 'ml-0.5' : ''} ${tooth === n ? 'border-white' : 'border-line'} ${present.has(n) || w ? '' : 'opacity-35'}`} style={w ? { background: colorOf(w.kind), color: '#000' } : present.has(n) ? { color: '#7ee081' } : undefined}>{n}</button>); })}</div>
        ))}</div>
        {tooth && <button className="btn" onClick={() => setTooth(null)}>{t('x_tooth_filter', { n: tooth })} ✕</button>}
        <p className="text-warn text-xs">{t('x_suggestions')}</p>
        {findings.some(f => !status[f.id]) && <button id="x-accept-all" className="btn" onClick={acceptAll}>{t('x_accept_all')}</button>}
        <ul className="flex flex-col gap-1.5" id="x-findings">{findings.map(f => (
          <li key={f.id} className={`border-line rounded border p-1.5 ${status[f.id] === 'rejected' ? 'opacity-45' : ''}`} style={{ borderLeft: `3px solid ${colorOf(f.kind)}` }}>
            <div className="flex justify-between gap-2"><span>{label(f)}{f.fdi ? ` · ${f.fdi}` : ''}</span><span className="text-muted tabular-nums">{Math.round(f.confidence * 100)}%</span></div>
            <div className="mt-1 flex gap-1">
              <button className="btn" aria-pressed={status[f.id] === 'accepted'} onClick={() => decide(f, status[f.id] === 'accepted' ? null : 'accepted')}>{t('x_accept')}</button>
              <button className="btn" aria-pressed={status[f.id] === 'rejected'} onClick={() => decide(f, status[f.id] === 'rejected' ? null : 'rejected')}>{t('x_reject')}</button>
            </div>
          </li>
        ))}</ul>
        {!findings.length && <p className="text-muted">{t('x_none')}</p>}
        <p className="text-muted text-xs">{t('x_report_hint', { n: accepted.length })}</p>
      </>}
      {vp && host && createPortal(
        <svg data-xray className="pointer-events-none absolute inset-0 z-[3] h-full w-full">
          {showTeeth && teeth.map(f => { const r = rect(f); return <g key={f.id}><rect x={r.x} y={r.y} width={r.w} height={r.h} fill="none" stroke="#7ee081" strokeOpacity={0.55} strokeWidth={1} />{f.fdi && <text x={r.x + r.w / 2} y={r.y - 4} fill="#7ee081" fontSize={12} textAnchor="middle" style={{ paintOrder: 'stroke', stroke: '#000', strokeWidth: 3 }}>{f.fdi}</text>}</g>; })}
          {findings.filter(f => status[f.id] !== 'rejected').map(f => { const r = rect(f), ok = status[f.id] === 'accepted'; return <g key={f.id} data-finding={f.kind}><rect x={r.x} y={r.y} width={r.w} height={r.h} fill={colorOf(f.kind)} fillOpacity={ok ? 0.18 : 0.06} stroke={colorOf(f.kind)} strokeWidth={ok ? 2.5 : 1.5} strokeDasharray={ok ? undefined : '5 4'} /><text x={r.x} y={r.y + r.h + 14} fill={colorOf(f.kind)} fontSize={12} style={{ paintOrder: 'stroke', stroke: '#000', strokeWidth: 3 }}>{label(f)} {Math.round(f.confidence * 100)}%</text></g>; })}
        </svg>, host)}
    </div>
  );
}
