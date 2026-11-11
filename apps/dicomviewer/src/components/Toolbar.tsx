import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clip3d, cs, csTools, engine, R3D_PRESETS, WL_PRESETS, type ToolKey } from '../lib/cs';
import { anonymizedZip } from '../lib/anonymize';
import { captureRoot, captureView, download } from '../lib/capture';
import { useStore } from '../store';

const planar = () => engine().getViewports().filter(v => v.id !== 'v3d') as (cs.StackViewport | cs.VolumeViewport)[];
const TOOLS: ToolKey[] = ['cross', 'wl', 'pan', 'zoom', 'length', 'angle', 'probe', 'note'];
const FULL: [number, number][] = [[0, 1], [0, 1], [0, 1]];

export default function Toolbar({ onTags, onReport }: { onTags: () => void; onReport: () => void }) {
  const { t } = useTranslation();
  const { active, tool, setTool, volMode, setVolMode, compare, setCompare, addShot, shots, say, setBusy, aiOpen, setAiOpen } = useStore();
  const [slab, setSlab] = useState('0'); const [blend, setBlend] = useState<'mip' | 'avg'>('mip');
  const [sharp, setSharp] = useState(false); const [clip, setClip] = useState(FULL);
  const isVol = active?.kind === 'volume', dental = isVol && volMode === 'dental';
  const off = !active;

  const voi = (key: string) => {
    for (const v of planar()) {
      if (key === 'auto') v.resetProperties(); else { const p = WL_PRESETS[key as keyof typeof WL_PRESETS]; v.setProperties({ voiRange: { lower: p.c - p.w / 2, upper: p.c + p.w / 2 } }); }
      v.render();
    }
  };
  const applySlab = (mm: string, mode: 'mip' | 'avg') => {
    setSlab(mm); setBlend(mode);
    const { BlendModes } = cs.Enums;
    for (const v of planar() as cs.VolumeViewport[]) {
      if (+mm > 0) { v.setBlendMode(mode === 'mip' ? BlendModes.MAXIMUM_INTENSITY_BLEND : BlendModes.AVERAGE_INTENSITY_BLEND); v.setSlabThickness(+mm); }
      else { v.setBlendMode(BlendModes.COMPOSITE); v.resetSlabThickness(); }
      v.render();
    }
  };
  const setClipAxis = (ax: number, end: 0 | 1, v: number) => {
    const next = clip.map(r => [...r] as [number, number]);
    next[ax][end] = v; if (next[ax][0] > next[ax][1] - 0.05) next[ax][end] = end ? next[ax][0] + 0.05 : next[ax][1] - 0.05;
    setClip(next); clip3d(next);
  };
  const act = {
    reset: () => { for (const v of engine().getViewports()) { v.resetCamera(); if (v.id !== 'v3d') (v as cs.StackViewport).resetProperties(); v.render(); } if (isVol) { applySlab('0', blend); setClip(FULL); clip3d(FULL); } setSharp(false); },
    invert: () => { for (const v of planar()) { v.setProperties({ invert: !v.getProperties()?.invert }); v.render(); } },
    rotate: () => { for (const v of planar()) { const r = (v.getViewPresentation() as { rotation?: number } | undefined)?.rotation || 0; v.setViewPresentation({ rotation: (r + 90) % 360 }); v.render(); } },
    flip: () => { for (const v of planar()) { v.setCamera({ flipHorizontal: !v.getCamera().flipHorizontal }); v.render(); } },
    sharpen: () => { const on = !sharp; setSharp(on); for (const v of planar() as cs.StackViewport[]) { v.setProperties({ sharpening: on ? 1 : 0 } as never); v.render(); } },
    clear: () => { csTools.annotation.state.removeAllAnnotations(); engine().render(); },
  };
  const exportAs = async (kind: string) => {
    const root = captureRoot();
    try {
      if (kind === 'png' && root) { const c = await captureView(root); c.toBlob(b => b && download(b, `medident-${Date.now()}.png`), 'image/png'); }
      else if (kind === 'shot' && root) { const c = await captureView(root); addShot({ url: c.toDataURL('image/jpeg', 0.9), caption: active!.label }); say(t('shot_added', { n: shots.length + 1 })); }
      else if (kind === 'report') onReport();
      else if (kind === 'anon' && active) {
        setBusy({ label: t('anon_busy'), pct: null });
        const zip = await anonymizedZip(active.instances.map(i => i.blob), (d, n) => setBusy({ label: `${t('anon_busy')} ${d}/${n}`, pct: d / n }));
        download(new Blob([zip as Uint8Array<ArrayBuffer>], { type: 'application/zip' }), `anonim-${Date.now()}.zip`);
      }
    } catch (e) { say(String((e as Error).message || e), true); } finally { setBusy(null); }
  };
  const B = (p: { on?: boolean; onClick: () => void; children: React.ReactNode; title?: string }) => <button className="btn" disabled={off} aria-pressed={p.on} title={p.title} onClick={p.onClick}>{p.children}</button>;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {isVol && <div className="flex gap-1" role="group"><B on={!dental} onClick={() => setVolMode('mpr')}>{t('mode_mpr')}</B><B on={dental} onClick={() => setVolMode('dental')}>{t('mode_dental')}</B>{!dental && <B on={aiOpen} onClick={() => setAiOpen(!aiOpen)}>{t('ai_button')}</B>}</div>}
      {!dental && <>
        <div className={`flex gap-1 ${isVol ? 'border-l border-line pl-3' : ''}`} role="group">
          {TOOLS.filter(k => k !== 'cross' || isVol).map(k => <B key={k} on={tool === k} onClick={() => setTool(k)}>{t('tool_' + k)}</B>)}
        </div>
        <div className="flex items-center gap-1 border-l border-line pl-3">
          <select id="voi" aria-label={t('preset')} className="btn" disabled={off} value="" onChange={e => e.target.value && voi(e.target.value)}>
            <option value="" disabled>{t('preset')}</option>
            <option value="auto">{t('preset_auto')}</option>
            {isVol && Object.keys(WL_PRESETS).map(k => <option key={k} value={k}>{t('preset_' + k)}</option>)}
          </select>
          <B onClick={act.invert}>{t('invert')}</B>
          {!isVol && <><B onClick={act.rotate}>{t('rotate')}</B><B onClick={act.flip}>{t('flip')}</B><B on={sharp} onClick={act.sharpen}>{t('sharpen')}</B>{compare && <B onClick={() => setCompare(null)}>{t('compare_off')}</B>}<B on={aiOpen} onClick={() => setAiOpen(!aiOpen)}>{t('ai_button')}</B></>}
        </div>
        {isVol && (
          <div className="flex items-center gap-1 border-l border-line pl-3">
            <select id="slab" aria-label={t('slab')} className="btn" value={slab} onChange={e => applySlab(e.target.value, blend)}>
              <option value="0">{t('slab_off')}</option>{[2, 5, 10, 20].map(n => <option key={n} value={n}>{t('slab')} {n} mm</option>)}
            </select>
            <select id="blend" aria-label={t('slab')} className="btn" value={blend} disabled={slab === '0'} onChange={e => applySlab(slab, e.target.value as 'mip' | 'avg')}>
              <option value="mip">{t('mip')}</option><option value="avg">{t('avg')}</option>
            </select>
            <select id="r3d" aria-label={t('render3d')} className="btn" defaultValue="r_bone" onChange={e => { const v = engine().getViewport('v3d') as cs.VolumeViewport3D; v.setProperties({ preset: R3D_PRESETS[e.target.value as keyof typeof R3D_PRESETS] }); v.render(); }}>
              {Object.keys(R3D_PRESETS).map(k => <option key={k} value={k}>3D: {t(k)}</option>)}
            </select>
            <details className="relative">
              <summary className="btn list-none">{t('clip')}</summary>
              <div className="border-line absolute top-full right-0 z-30 mt-1 flex w-64 flex-col gap-2 rounded-md border bg-panel p-3">
                {(['clip_x', 'clip_y', 'clip_z'] as const).map((k, ax) => (
                  <div key={k}><div className="text-muted mb-0.5 text-xs">{t(k)}</div>
                    <div className="flex gap-1">{([0, 1] as const).map(end => <input key={end} id={`${k}-${end}`} aria-label={`${t(k)} ${end ? 'max' : 'min'}`} type="range" min={0} max={1} step={0.01} value={clip[ax][end]} onChange={e => setClipAxis(ax, end, +e.target.value)} className="w-full accent-[#5cc8ff]" />)}</div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </>}
      <div className="flex gap-1 border-l border-line pl-3">
        {!dental && <><B onClick={act.clear}>{t('clear')}</B><B onClick={act.reset}>{t('reset')}</B></>}
        <B onClick={onTags}>{t('tags')}</B>
        <select id="export" aria-label={t('export')} className="btn" disabled={off} value="" onChange={e => exportAs(e.target.value)}>
          <option value="" disabled>{t('export')}</option>
          <option value="png">{t('ex_png')}</option><option value="shot">{t('ex_shot')}</option><option value="report">{t('ex_report')}</option><option value="anon">{t('ex_anon')}</option>
        </select>
      </div>
    </div>
  );
}
