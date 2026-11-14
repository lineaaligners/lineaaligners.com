// Cornerstone3D setup: one rendering engine, three tool groups (2D stack, MPR, 3D).
import * as cs from '@cornerstonejs/core';
import * as csTools from '@cornerstonejs/tools';
import dicomLoader from '@cornerstonejs/dicom-image-loader';
import vtkPlane from '@kitware/vtk.js/Common/DataModel/Plane';
import type { Series } from './intake';
import { percentile, type Vol, type Voxels } from './pano';

export const ENGINE = 'main';
export const TG = { stack: 'tg-stack', mpr: 'tg-mpr', v3d: 'tg-3d' } as const;
export type ToolKey = 'wl' | 'pan' | 'zoom' | 'length' | 'angle' | 'probe' | 'note' | 'cross' | 'brush' | 'eraser' | 'grow' | 'canal';

const T = csTools;
export const TOOL_NAME: Record<ToolKey, string> = {
  wl: T.WindowLevelTool.toolName, pan: T.PanTool.toolName, zoom: T.ZoomTool.toolName, length: T.LengthTool.toolName,
  angle: T.AngleTool.toolName, probe: T.ProbeTool.toolName, note: T.ArrowAnnotateTool.toolName, cross: T.CrosshairsTool.toolName,
  brush: 'Brush', eraser: 'Eraser', grow: '', canal: '', // grow and canal are handled by the AI panel's own click handler
};
const { MouseBindings, KeyboardBindings } = T.Enums;
// Which tool sits on the right and the middle mouse button whatever the active tool is. The user can change both;
// the defaults follow what dental imaging programs do: right-drag changes contrast, wheel scrolls, Ctrl + wheel zooms.
export interface Bindings { secondary: 'wl' | 'zoom' | 'pan'; auxiliary: 'wl' | 'zoom' | 'pan' }
const DEFAULT_BINDINGS: Bindings = { secondary: 'wl', auxiliary: 'pan' };
export function loadBindings(): Bindings { try { return { ...DEFAULT_BINDINGS, ...JSON.parse(localStorage.getItem('bindings') || '{}') }; } catch { return DEFAULT_BINDINGS; } }
const TOOL_OF = { wl: T.WindowLevelTool.toolName, zoom: T.ZoomTool.toolName, pan: T.PanTool.toolName };
let FIXED: Record<string, number> = {};
function fixedFrom(b: Bindings) { const f: Record<string, number> = {}; f[TOOL_OF[b.secondary]] = MouseBindings.Secondary; if (b.auxiliary !== b.secondary) f[TOOL_OF[b.auxiliary]] = MouseBindings.Auxiliary; return f; }
const CTRL_WHEEL = { mouseButton: MouseBindings.Wheel, modifierKey: KeyboardBindings.Ctrl };
function bindingsFor(name: string, primary: boolean) {
  const b: { mouseButton: number; modifierKey?: number }[] = [];
  if (primary) b.push({ mouseButton: MouseBindings.Primary });
  if (name in FIXED) b.push({ mouseButton: FIXED[name] });
  if (name === T.ZoomTool.toolName) b.push(CTRL_WHEEL);
  return b;
}
// Cornerstone merges new bindings into the old ones, so clear them before activating.
function activate(g: NonNullable<ReturnType<typeof T.ToolGroupManager.getToolGroup>>, name: string, b: unknown[]) {
  const o = (g as unknown as { toolOptions: Record<string, { bindings: unknown[] }> }).toolOptions[name];
  if (o) o.bindings = [];
  if (b.length) g.setToolActive(name, { bindings: b as never }); else g.setToolPassive(name);
}
function applyFixed() {
  for (const id of [TG.stack, TG.mpr]) {
    const g = T.ToolGroupManager.getToolGroup(id); if (!g) continue;
    for (const name of Object.values(TOOL_OF)) {
      const primary = current != null && TOOL_NAME[current] === name, b = bindingsFor(name, primary);
      activate(g, name, b);
    }
  }
}
export function saveBindings(b: Bindings) { try { localStorage.setItem('bindings', JSON.stringify(b)); } catch { /* storage unavailable */ } FIXED = fixedFrom(b); if (ready) ready.then(applyFixed); }

// Plane geometry for volumes whose files carry no per-slice position (some multi-frame exports).
const synthPlane = new Map<string, Record<string, unknown>>();

let current: ToolKey | null = null;
let ready: Promise<void> | null = null;
export function initCs(): Promise<void> {
  ready ??= (async () => {
    await cs.init();
    dicomLoader.init({ maxWebWorkers: Math.max(1, Math.min(6, (navigator.hardwareConcurrency || 4) - 1)) });
    await T.init();
    for (const tool of [T.WindowLevelTool, T.PanTool, T.ZoomTool, T.StackScrollTool, T.LengthTool, T.AngleTool, T.ProbeTool, T.ArrowAnnotateTool, T.CrosshairsTool, T.TrackballRotateTool, T.BrushTool]) T.addTool(tool);
    for (const id of [TG.stack, TG.mpr]) {
      const g = T.ToolGroupManager.createToolGroup(id)!;
      for (const key of ['wl', 'pan', 'zoom', 'length', 'angle', 'probe', 'note', 'cross'] as ToolKey[]) if (key !== 'cross' || id === TG.mpr) g.addTool(TOOL_NAME[key]);
      if (id === TG.mpr) {
        g.addToolInstance('Brush', T.BrushTool.toolName, { activeStrategy: 'FILL_INSIDE_CIRCLE' });
        g.addToolInstance('Eraser', T.BrushTool.toolName, { activeStrategy: 'ERASE_INSIDE_CIRCLE' });
      }
      g.addTool(T.StackScrollTool.toolName);
      g.setToolActive(T.StackScrollTool.toolName, { bindings: [{ mouseButton: MouseBindings.Wheel }] });
    }
    const g3 = T.ToolGroupManager.createToolGroup(TG.v3d)!;
    for (const tool of [T.TrackballRotateTool, T.ZoomTool, T.PanTool]) g3.addTool(tool.toolName);
    g3.setToolActive(T.TrackballRotateTool.toolName, { bindings: [{ mouseButton: MouseBindings.Primary }] });
    g3.setToolActive(T.ZoomTool.toolName, { bindings: [{ mouseButton: MouseBindings.Secondary }] });
    g3.setToolActive(T.PanTool.toolName, { bindings: [{ mouseButton: MouseBindings.Auxiliary }] });
    FIXED = fixedFrom(loadBindings()); applyFixed();
    cs.metaData.addProvider((type: string, imageId: string) => (type === 'imagePlaneModule' ? synthPlane.get(imageId) : undefined), 20000);
    new cs.RenderingEngine(ENGINE);
  })();
  return ready;
}
export const engine = () => cs.getRenderingEngine(ENGINE)!;

export function setPrimaryTool(key: ToolKey) {
  for (const id of [TG.stack, TG.mpr]) {
    const g = T.ToolGroupManager.getToolGroup(id);
    if (!g) continue;
    if (current && TOOL_NAME[current] && g.hasTool(TOOL_NAME[current])) {
      const prev = TOOL_NAME[current], b = bindingsFor(prev, false);
      activate(g, prev, b);
    }
    if (key === 'grow' || key === 'canal') continue; // no Cornerstone tool on the left button while picking points
    const name = g.hasTool(TOOL_NAME[key]) ? TOOL_NAME[key] : TOOL_NAME.wl;
    activate(g, name, bindingsFor(name, true));
  }
  current = key;
}

const idCache = new WeakMap<Blob, string>();
export function imageIdsFor(series: Series): string[] {
  const out: string[] = [];
  for (const inst of series.instances) {
    let base = idCache.get(inst.blob);
    if (!base) { base = dicomLoader.wadouri.fileManager.add(inst.blob); idCache.set(inst.blob, base); }
    if (inst.frames > 1) for (let f = 1; f <= inst.frames; f++) out.push(`${base}?frame=${f}`); else out.push(base);
  }
  return out;
}

const volumes = new Map<string, Promise<string>>();
/** Loads a series as a volume once; later callers (MPR, dental view) share the same promise. */
export function loadVolume(series: Series, onProgress: (done: number, total: number) => void): Promise<string> {
  let p = volumes.get(series.id);
  if (!p) { p = buildVolume(series, onProgress); volumes.set(series.id, p); p.catch(() => volumes.delete(series.id)); }
  return p;
}
export function releaseVolumes() { volumes.clear(); cs.cache.purgeCache(); }

async function buildVolume(series: Series, onProgress: (done: number, total: number) => void): Promise<string> {
  const ids = imageIdsFor(series), a = series.instances[0];
  const multi = series.instances.length === 1 && a.frames > 1;
  const positioned = multi ? a.hasFrameGroups : series.instances.every(i => i.ipp?.length === 3) && a.iop?.length === 6;
  if (!positioned) {
    const sp = a.spacing || [1, 1], dz = a.thickness || sp[0];
    ids.forEach((id, k) => synthPlane.set(id, {
      frameOfReferenceUID: a.seriesUid, rows: a.rows, columns: a.cols, imageOrientationPatient: [1, 0, 0, 0, 1, 0], rowCosines: [1, 0, 0], columnCosines: [0, 1, 0],
      imagePositionPatient: [0, 0, k * dz], sliceThickness: dz, sliceLocation: k * dz, pixelSpacing: sp, rowPixelSpacing: sp[0], columnPixelSpacing: sp[1],
    }));
  }
  // Every slice has to be read once before the volume exists: geometry comes from the file headers.
  let done = 0;
  for (let i = 0; i < ids.length; i += 8) {
    await Promise.all(ids.slice(i, i + 8).map(id => cs.imageLoader.loadAndCacheImage(id)));
    done = Math.min(ids.length, i + 8); onProgress(done, ids.length);
  }
  const volumeId = `cornerstoneStreamingImageVolume:${series.id}`;
  const volume = await cs.volumeLoader.createAndCacheVolume(volumeId, { imageIds: ids }) as unknown as { load: () => void; loadStatus?: { loaded?: boolean } };
  volume.load();
  for (let i = 0; i < 1200 && !volume.loadStatus?.loaded; i++) await new Promise(r => setTimeout(r, 100));
  return volumeId;
}

/** Raw voxel grid of a loaded volume for the dental reconstructions. Assumes an axis-aligned scan, as CBCT exports are. */
export function extractVol(volumeId: string): Vol {
  const v = cs.cache.getVolume(volumeId) as unknown as { dimensions: number[]; spacing: number[]; direction: number[]; voxelManager: { getCompleteScalarDataArray: () => Voxels } };
  const data = v.voxelManager.getCompleteScalarDataArray(), [nx, ny, nz] = v.dimensions, [dx, dy, dz] = v.spacing;
  return { nx, ny, nz, dx, dy, dz, data, zUp: v.direction[8] >= 0, air: percentile(data, 0.001) };
}

/** Crops the 3D rendering to a box; each range is [from, to] as fractions of the volume extent. */
export function clip3d(ranges: [number, number][]) {
  const vp = engine().getViewport('v3d') as cs.VolumeViewport3D | undefined, entry = vp?.getDefaultActor?.();
  if (!vp || !entry) return;
  const actor = entry.actor as unknown as { getMapper: () => { removeAllClippingPlanes: () => void; addClippingPlane: (p: unknown) => void; getInputData: () => { getBounds: () => number[] } } };
  const mapper = actor.getMapper(), b = mapper.getInputData().getBounds();
  mapper.removeAllClippingPlanes();
  ranges.forEach(([lo, hi], ax) => {
    const min = b[ax * 2], size = b[ax * 2 + 1] - min, n = [0, 0, 0], o1 = [b[0], b[2], b[4]], o2 = [b[0], b[2], b[4]];
    if (lo > 0) { n[ax] = 1; o1[ax] = min + size * lo; mapper.addClippingPlane(vtkPlane.newInstance({ origin: o1, normal: [...n] } as never)); }
    if (hi < 1) { n[ax] = -1; o2[ax] = min + size * hi; mapper.addClippingPlane(vtkPlane.newInstance({ origin: o2, normal: [...n] } as never)); }
  });
  vp.render();
}

// Measurements survive switching between series: saved when a view closes, restored when it reopens.
const savedAnnotations = new Map<string, unknown[]>();
export function saveAnnotations(seriesId: string) {
  const all = T.annotation.state.getAllAnnotations().filter(a => a.metadata?.toolName !== T.CrosshairsTool.toolName);
  savedAnnotations.set(seriesId, all);
  T.annotation.state.removeAllAnnotations();
}
export function restoreAnnotations(seriesId: string, element: HTMLDivElement) {
  for (const a of savedAnnotations.get(seriesId) || []) { try { T.annotation.state.addAnnotation(a as never, element); } catch (e) { console.warn(e); } }
  savedAnnotations.delete(seriesId);
}

export const WL_PRESETS = { bone: { c: 500, w: 2500 }, soft: { c: 40, w: 400 }, enamel: { c: 2200, w: 4500 } } as const;
export const R3D_PRESETS = { r_bone: 'CT-Bone', r_teeth: 'CT-Cropped-Volume-Bone', r_skin: 'CT-Soft-Tissue' } as const;
export { cs, csTools };

// Debug/test hook.
(window as unknown as { __cs: unknown }).__cs = { cs, csTools };
