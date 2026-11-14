import { useEffect, useReducer, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { extractVol, initCs, loadVolume, WL_PRESETS } from '../lib/cs';
import { Dental, type DTool, type Jaw } from '../lib/dental';
import { FDI_LOWER, FDI_UPPER } from '../lib/pano';
import type { Series } from '../lib/intake';
import { useStore } from '../store';

const H = ({ children }: { children: React.ReactNode }) => <h3 className="text-muted mt-3 mb-1 text-[11px] font-medium tracking-widest uppercase first:mt-0">{children}</h3>;

export default function DentalView({ series }: { series: Series }) {
  const { t, i18n } = useTranslation();
  const ax = useRef<HTMLCanvasElement>(null), pan = useRef<HTMLCanvasElement>(null), xs = useRef<HTMLCanvasElement>(null);
  const ctl = useRef<Dental | null>(null);
  const [, tick] = useReducer((n: number) => n + 1, 0);
  const [sel, setSel] = useState<number | null>(null);
  const d = ctl.current;

  useEffect(() => {
    let dead = false, ro: ResizeObserver | null = null;
    const { setBusy, say } = useStore.getState();
    (async () => {
      try {
        await initCs();
        const id = await loadVolume(series, (a, n) => !dead && setBusy({ label: `${t('loading_volume')} ${a}/${n}`, pct: a / n }));
        if (dead) return;
        const dental = new Dental(extractVol(id), { ax: ax.current!, pan: pan.current!, xs: xs.current! });
        dental.onChange = tick; ctl.current = dental;
        ro = new ResizeObserver(() => dental.redraw()); for (const c of [ax, pan, xs]) ro.observe(c.current!);
        tick();
      } catch (e) { console.error(e); if (!dead) say(t('err_open', { msg: (e as Error).message || String(e) }), true); } finally { if (!dead) setBusy(null); }
    })();
    return () => { dead = true; ro?.disconnect(); ctl.current = null; };
  }, [series, t]);

  // canvas labels follow the UI language
  useEffect(() => {
    if (!d) return;
    d.labels = { value: t('d_value'), width: t('d_w'), height: t('d_h'), axial: t('axial'), pano: t('d_pano'), cross: t('d_cross'), lingual: 'L', buccal: 'B' };
    d.refresh();
  }, [d, t, i18n.language]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const c = ctl.current, tag = (e.target as HTMLElement).tagName;
      if (!c || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); c.move(e.key === 'ArrowRight' ? 1 : -1); }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); c.setDepth(c.depth + (e.key === 'ArrowUp' ? 0.5 : -0.5)); }
      if (e.key === 'Escape' && c.drawing) { c.drawing = null; c.refresh(); }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, []);

  const Btn = (p: { on?: boolean; onClick: () => void; children: React.ReactNode; title?: string }) => <button className="btn" disabled={!d} aria-pressed={p.on} title={p.title} onClick={p.onClick}>{p.children}</button>;
  const Sel = (p: { id: string; label: string; value: number | string; opts: [number | string, string][]; onChange: (v: string) => void }) => (
    <label htmlFor={p.id} className="flex items-center justify-between gap-2"><span className="text-muted">{p.label}</span>
      <select id={p.id} className="btn" disabled={!d} value={p.value} onChange={e => p.onChange(e.target.value)}>{p.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
  );
  const tooth = (n: number) => {
    const placed = !!d?.teeth[n], arming = d?.placing === n;
    return <button key={n} disabled={!d} onClick={() => { d!.pickTooth(n); setSel(n); }} aria-pressed={arming}
      className={`h-6 min-w-0 rounded-sm border px-0 text-[10px] tabular-nums ${arming ? 'border-accent bg-accent text-black' : placed ? 'border-[#7ee081] text-[#7ee081]' : 'border-line text-muted hover:border-muted'}`}>{d ? d.toothLabel(n) : n}</button>;
  };

  return (
    <div className="absolute inset-0 grid grid-cols-[1fr_1fr_304px] grid-rows-[46fr_54fr] gap-1.5 p-1.5">
      <div data-capture className="relative col-span-2 row-span-2 grid grid-cols-2 grid-rows-[46fr_54fr] gap-1.5 p-1.5">
        <div className="vp col-span-2"><canvas ref={pan} className="absolute inset-0 h-full w-full touch-none" /></div>
        <div className="vp"><canvas ref={ax} className="absolute inset-0 h-full w-full touch-none" /></div>
        <div className="vp"><canvas ref={xs} className="absolute inset-0 h-full w-full touch-none" /></div>
      </div>
      <div className="row-span-2 flex flex-col gap-1.5 overflow-y-auto rounded-xl border border-line bg-panel p-3 text-[13px]">
        <H>{t('d_tools')}</H>
        <div className="flex flex-wrap gap-1">{(['nav', 'len', 'box', 'wl'] as DTool[]).map(k => <Btn key={k} on={d?.tool === k} onClick={() => { d!.tool = k; tick(); }}>{t('d_' + k)}</Btn>)}</div>
        <div className="flex flex-wrap gap-1">
          <select id="d-voi" aria-label={t('preset')} className="btn" disabled={!d} value="" onChange={e => { const k = e.target.value; if (k === 'auto') d!.setWindow(d!.auto.c, d!.auto.w); else { const p = WL_PRESETS[k as keyof typeof WL_PRESETS]; d!.setWindow(p.c, p.w); } }}>
            <option value="" disabled>{t('preset')}</option><option value="auto">{t('preset_auto')}</option>{Object.keys(WL_PRESETS).map(k => <option key={k} value={k}>{t('preset_' + k)}</option>)}
          </select>
          <Btn onClick={() => d!.toggleInvert()}>{t('invert')}</Btn><Btn onClick={() => d!.clearMeasures()}>{t('clear')}</Btn><Btn onClick={() => d!.resetView()}>{t('reset')}</Btn>
        </div>
        <H>{t('d_curve')}</H>
        {d?.drawing ? (<>
          <p className="text-warn text-xs">{t('d_draw_hint')}</p>
          <div className="flex gap-1"><button className="btn primary" disabled={d.drawing.length < 3} onClick={() => d.finishDrawing()}>{t('d_done', { n: d.drawing.length })}</button><Btn onClick={() => { d.drawing = null; d.refresh(); }}>{t('d_cancel')}</Btn></div>
        </>) : <div className="flex flex-wrap gap-1"><Btn onClick={() => d!.startDrawing()}>{t('d_draw')}</Btn><Btn onClick={() => d!.autoCurve()}>{t('d_auto')}</Btn></div>}
        <H>{t('d_jaw')}</H>
        <div className="flex flex-wrap gap-1">{(['both', 'max', 'man'] as Jaw[]).map(j => <Btn key={j} on={d?.jaw === j} onClick={() => d!.setJaw(j)}>{t('d_' + j)}</Btn>)}</div>
        <div className="flex flex-wrap gap-1"><Btn onClick={() => d!.setSplitHere()}>{t('d_split')}</Btn><Btn on={d?.flipped} onClick={() => d!.flipZ()}>{t('d_flip')}</Btn></div>
        <H>{t('d_pano')}</H>
        <Sel id="d-thick" label={t('d_thick')} value={d?.thick ?? 10} opts={[0, 5, 10, 15, 20, 30].map(n => [n, `${n} mm`])} onChange={v => d!.setThick(+v)} />
        <label htmlFor="d-depth" className="flex items-center gap-2"><span className="text-muted">{t('d_depth')}</span>
          <input id="d-depth" type="range" disabled={!d} min={-(d?.depthMax ?? 14)} max={d?.depthMax ?? 14} step={0.5} value={d?.depth ?? 0} onChange={e => d!.setDepth(+e.target.value)} className="min-w-0 flex-1 accent-[#c9a7ff]" />
          <span className="w-14 text-right tabular-nums">{(d?.depth ?? 0).toFixed(1)} mm</span></label>
        <div className="flex gap-1"><Btn onClick={() => d!.setDepth(d!.depth - 0.5)}>◀ {t('d_lingual')}</Btn><Btn onClick={() => d!.setDepth(0)}>0</Btn><Btn onClick={() => d!.setDepth(d!.depth + 0.5)}>{t('d_buccal')} ▶</Btn></div>
        <p className="text-muted text-xs">{t('d_depth_hint')}</p>
        <Sel id="d-mode" label={t('slab')} value={d?.mode ?? 'avg'} opts={[['avg', t('avg')], ['mip', t('mip')]]} onChange={v => d!.setMode(v as 'avg' | 'mip')} />
        <H>{t('d_cross')}</H>
        <Sel id="d-step" label={t('d_step')} value={d?.step ?? 1} opts={[0.5, 1, 1.5, 2].map(n => [n, `${n} mm`])} onChange={v => d!.setStep(+v)} />
        <Sel id="d-xsthick" label={t('d_thick')} value={d?.xsThick ?? 1} opts={[0, 1, 2, 3].map(n => [n, `${n} mm`])} onChange={v => d!.setXsThick(+v)} />
        <div className="flex gap-1"><Btn onClick={() => d!.move(-1)}>◀ {t('d_prev')}</Btn><Btn onClick={() => d!.move(1)}>{t('d_next')} ▶</Btn></div>
        <H>{t('d_teeth')}</H>
        <div className="flex gap-1">{(['fdi', 'uni'] as const).map(n => <Btn key={n} on={d?.numbering === n} onClick={() => { d!.numbering = n; d!.refresh(); }}>{t('d_' + n)}</Btn>)}</div>
        <div data-teeth className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-px">{FDI_UPPER.map(tooth)}{FDI_LOWER.map(tooth)}</div>
        <p className={`text-xs ${d?.placing != null ? 'text-warn' : 'text-muted'}`}>{d?.placing != null ? t('d_place', { n: d.toothLabel(d.placing) }) : t('d_teeth_hint')}</p>
        {d && sel != null && d.teeth[sel] && <Btn onClick={() => { d.removeTooth(sel); setSel(null); }}>{t('d_remove_tooth', { n: d.toothLabel(sel) })}</Btn>}
      </div>
    </div>
  );
}
