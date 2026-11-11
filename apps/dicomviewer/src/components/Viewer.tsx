import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DentalView from './DentalView';
import AiPanel from './AiPanel';
import XrayPanel from './XrayPanel';
import { reattach } from '../lib/ai';
import { cs, csTools, engine, ENGINE, imageIdsFor, initCs, loadVolume, releaseVolumes, restoreAnnotations, saveAnnotations, setPrimaryTool, TG } from '../lib/cs';
import type { Series } from '../lib/intake';
import { useStore } from '../store';

const MPR = [
  { id: 'ax', key: 'axial', color: '#5cc8ff', o: cs.Enums.OrientationAxis.AXIAL },
  { id: 'sag', key: 'sagittal', color: '#7ee081', o: cs.Enums.OrientationAxis.SAGITTAL },
  { id: 'cor', key: 'coronal', color: '#ffc857', o: cs.Enums.OrientationAxis.CORONAL },
] as const;

export default function Viewer({ series }: { series: Series }) {
  const { t } = useTranslation();
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const [big, setBig] = useState<string | null>(null);
  const { tool, volMode, compare, aiOpen } = useStore();
  const [meshHost, setMeshHost] = useState<HTMLElement | null>(null);
  const isVol = series.kind === 'volume', dental = isVol && volMode === 'dental';

  useEffect(() => {
    if (dental) return;
    let dead = false;
    const ids: string[] = [];
    const { setBusy, say } = useStore.getState();
    (async () => {
      try {
        await initCs();
        if (dead) return;
        const e = engine(), { ViewportType } = cs.Enums;
        if (!isVol) {
          const stacks: [string, Series][] = [['stack', series]]; if (compare) stacks.push(['stack2', compare]);
          for (const [id, s] of stacks) {
            e.enableElement({ viewportId: id, type: ViewportType.STACK, element: refs.current[id]! }); ids.push(id);
            csTools.ToolGroupManager.getToolGroup(TG.stack)!.addViewport(id, ENGINE);
            const vp = e.getViewport(id) as cs.StackViewport;
            await vp.setStack(imageIdsFor(s), 0); vp.render();
          }
        } else {
          for (const m of MPR) { e.enableElement({ viewportId: m.id, type: ViewportType.ORTHOGRAPHIC, element: refs.current[m.id]!, defaultOptions: { orientation: m.o } }); ids.push(m.id); csTools.ToolGroupManager.getToolGroup(TG.mpr)!.addViewport(m.id, ENGINE); }
          e.enableElement({ viewportId: 'v3d', type: ViewportType.VOLUME_3D, element: refs.current.v3d!, defaultOptions: { background: [0.02, 0.03, 0.04] } });
          ids.push('v3d'); csTools.ToolGroupManager.getToolGroup(TG.v3d)!.addViewport('v3d', ENGINE);
          const volumeId = await loadVolume(series, (d, n) => !dead && setBusy({ label: `${t('loading_volume')} ${d}/${n}`, pct: d / n }));
          if (dead) return;
          await cs.setVolumesForViewports(e, [{ volumeId }], ids);
          (e.getViewport('v3d') as cs.VolumeViewport3D).setProperties({ preset: 'CT-Bone' });
          e.renderViewports(ids);
          await reattach();
        }
        if (dead) return;
        restoreAnnotations(series.id, refs.current[ids[0]]!);
        setPrimaryTool(useStore.getState().tool);
        e.renderViewports(ids);
      } catch (err) {
        console.error(err);
        if (!dead) say(t('err_open', { msg: (err as Error).message || String(err) }), true);
      } finally { if (!dead) setBusy(null); }
    })();
    return () => {
      dead = true;
      // Each step is isolated: one failing step must not leave stale viewports behind.
      const step = (fn: () => void) => { try { fn(); } catch (err) { console.warn(err); } };
      step(() => saveAnnotations(series.id));
      for (const id of ids) {
        for (const g of Object.values(TG)) step(() => csTools.ToolGroupManager.getToolGroup(g)?.removeViewports(ENGINE, id));
        step(() => engine().disableElement(id));
      }
    };
  }, [series, isVol, dental, compare, t]);

  // Declared after the viewport effect so viewports close first; pixels are released only when the series
  // itself closes, which lets MPR and the dental view share one load.
  useEffect(() => () => { try { releaseVolumes(); } catch { /* nothing loaded */ } }, [series]);

  useEffect(() => { initCs().then(() => setPrimaryTool(tool)); }, [tool]);
  useEffect(() => { try { engine()?.resize(true, true); } catch { /* not ready */ } }, [big]);
  useEffect(() => {
    const ro = new ResizeObserver(() => { try { engine()?.resize(true, true); } catch { /* not ready */ } });
    for (const el of Object.values(refs.current)) if (el) ro.observe(el);
    return () => ro.disconnect();
  }, [series, dental, compare, aiOpen]);

  if (dental) return <DentalView series={series} />;
  const el = (id: string) => <div className="el" ref={n => { refs.current[id] = n; }} onContextMenu={e => e.preventDefault()} />;
  if (!isVol) return (
    <div className="absolute inset-0 flex gap-0.5 bg-line">
      <div data-capture className={`relative grid min-w-0 flex-1 gap-0.5 bg-line ${compare ? 'grid-cols-2' : ''}`}>
        <div className="vp" ref={setMeshHost}>{el('stack')}{compare && <div className="lbl text-accent">{series.label}</div>}</div>
        {compare && <div className="vp">{el('stack2')}<div className="lbl text-warn">{compare.label}</div></div>}
      </div>
      {aiOpen && <XrayPanel series={series} host={meshHost} />}
    </div>
  );
  const cell = (id: string, label: string, color: string) => (
    <div key={id} ref={id === 'v3d' ? setMeshHost : undefined} className="vp" style={big && big !== id ? { display: 'none' } : big === id ? { gridArea: '1 / 1 / 3 / 3' } : undefined} onDoubleClick={() => setBig(big === id ? null : id)}>
      {el(id)}<div className="lbl z-[4]" style={{ color }}>{label}</div>
    </div>
  );
  return (
    <div className="absolute inset-0 flex gap-0.5 bg-line">
      <div data-capture className="relative grid min-w-0 flex-1 grid-cols-2 grid-rows-2 gap-0.5 bg-line">
        {MPR.map(m => cell(m.id, t(m.key), m.color))}
        {cell('v3d', t('v3d'), '#c9a7ff')}
      </div>
      {aiOpen && <AiPanel series={series} meshHost={meshHost} />}
    </div>
  );
}
