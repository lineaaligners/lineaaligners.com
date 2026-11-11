// AI segmentation client: talks to the local backend, shows labels in the MPR views and edits them.
import { gunzipSync, gzipSync, zipSync } from 'fflate';
import { cs, csTools, engine } from './cs';
import type { Series } from './intake';

const T = csTools, seg = T.segmentation;
export const SEG_ID = 'ai-seg';
// Where the AI backend lives. Empty = same origin (local install); the hosted viewer points at the clinic PC itself.
export const API: string = import.meta.env.VITE_API_BASE || '';
const MPR_IDS = ['ax', 'sag', 'cor'];

export interface Structure { label: number; name: string; volume_mm3: number; confidence: number | null }
export interface Site { fdi: number; world: number[] | null; gap_mm?: number | null }
export interface AiMeta {
  engine: string; engine_title: string; is_ai: boolean; device: string; seconds: number; inference_seconds: number; numbering: string;
  geometry: { size: number[]; spacing: number[]; origin: number[]; direction: number[] };
  structures: Structure[]; teeth: Site[]; missing: Site[];
}
export interface EngineInfo { name: string; title: string; is_ai: boolean; available: boolean; reason: string }
export interface AiResult { jobId: string; meta: AiMeta; volumeId: string; flipZ: boolean; dirty: boolean }

// Fixed colours per structure; teeth alternate so neighbours stay distinguishable.
const BASE: Record<number, [number, number, number]> = { 1: [240, 220, 170], 2: [150, 200, 240], 3: [255, 70, 70], 4: [255, 150, 40], 5: [120, 230, 200], 6: [80, 190, 160], 7: [200, 160, 255], 8: [255, 120, 200], 9: [255, 255, 255], 10: [220, 220, 220] };
const TOOTH: [number, number, number][] = [[255, 241, 118], [129, 212, 250], [174, 213, 129], [255, 183, 77], [240, 98, 146], [149, 117, 205], [77, 208, 225], [255, 138, 101]];
export const colorOf = (label: number): [number, number, number] => BASE[label] || TOOTH[label % 10 % 8];
export const isTooth = (label: number) => label >= 11 && label <= 48 && label % 10 >= 1 && label % 10 <= 8;

export async function listEngines(): Promise<{ engines: EngineInfo[]; gpu: string | null }> {
  const r = await fetch(API + '/api/engines'); if (!r.ok) throw new Error(String(r.status)); return r.json();
}

const labelVolume = () => cs.cache.getVolume(SEG_ID) as unknown as { voxelManager: { getCompleteScalarDataArray: () => Uint8Array; invalidateCachedScalarExpansion?: () => void; setCompleteScalarDataArray?: (a: Uint8Array) => void; setAtIndex: (i: number, v: number) => void; getAtIndex: (i: number) => number }; dimensions: number[]; imageData: unknown; spacing: number[] };
/** All label voxels as one array. Brush strokes write per slice, so the cached whole-volume copy is dropped first. */
function allVoxels(): Uint8Array { const vm = labelVolume().voxelManager; vm.invalidateCachedScalarExpansion?.(); return vm.getCompleteScalarDataArray(); }
export function refresh() { seg.triggerSegmentationEvents.triggerSegmentationDataModified(SEG_ID); engine().renderViewports(MPR_IDS); }

function flipSlices(a: Uint8Array, nxy: number, nz: number): Uint8Array {
  const out = new Uint8Array(a.length);
  for (let k = 0; k < nz; k++) out.set(a.subarray(k * nxy, (k + 1) * nxy), (nz - 1 - k) * nxy);
  return out;
}

export async function segment(series: Series, volumeId: string, engineName: string, onProgress: (stage: string, pct: number, elapsed: number) => void): Promise<AiResult> {
  onProgress('upload', 0, 0);
  const files: Record<string, Uint8Array> = {};
  for (let i = 0; i < series.instances.length; i++) files[`${i}.dcm`] = new Uint8Array(await series.instances[i].blob.arrayBuffer());
  const body = new FormData(); body.append('file', new Blob([zipSync(files, { level: 0 }) as Uint8Array<ArrayBuffer>]), 'series.zip');
  const start = await fetch(API + `/api/segment?engine=${encodeURIComponent(engineName)}`, { method: 'POST', body });
  if (!start.ok) throw new Error(await start.text());
  const { id } = await start.json();
  for (;;) {
    await new Promise(r => setTimeout(r, 700));
    const st = await (await fetch(API + `/api/jobs/${id}`)).json();
    if (st.status === 'error') throw new Error(st.error || 'error');
    onProgress(st.stage, st.progress, st.elapsed);
    if (st.status === 'done') break;
  }
  return show(id, volumeId);
}

/** Loads a finished job's labels into a labelmap on top of the MPR views. */
export async function show(jobId: string, volumeId: string): Promise<AiResult> {
  const meta: AiMeta = await (await fetch(API + `/api/jobs/${jobId}/meta`)).json();
  let data: Uint8Array = gunzipSync(new Uint8Array(await (await fetch(API + `/api/jobs/${jobId}/labels`)).arrayBuffer()));
  const vol = cs.cache.getVolume(volumeId) as unknown as { dimensions: number[]; origin: number[]; spacing: number[] };
  const [nx, ny, nz] = vol.dimensions;
  if (data.length !== nx * ny * nz) throw new Error('Label size does not match the open volume');
  // The backend and the viewer may order slices from opposite ends; compare where slice 0 sits.
  const flipZ = Math.abs(vol.origin[2] - meta.geometry.origin[2]) > vol.spacing[2] / 2;
  if (flipZ) data = flipSlices(data, nx * ny, nz);
  clear();
  cs.volumeLoader.createAndCacheDerivedLabelmapVolume(volumeId, { volumeId: SEG_ID });
  const vm = labelVolume().voxelManager;
  if (vm.setCompleteScalarDataArray) vm.setCompleteScalarDataArray(data); else for (let i = 0; i < data.length; i++) if (data[i]) vm.setAtIndex(i, data[i]);
  // every label we may ever paint is registered up front, so visibility and colour apply to all of them
  const segments = Object.fromEntries(Array.from({ length: 48 }, (_, i) => [i + 1, { segmentIndex: i + 1, label: String(i + 1), locked: false, active: i === 0, cachedStats: {} }]));
  seg.addSegmentations([{ segmentationId: SEG_ID, config: { segments }, representation: { type: T.Enums.SegmentationRepresentations.Labelmap, data: { volumeId: SEG_ID } } } as never]);
  await seg.addLabelmapRepresentationToViewportMap(Object.fromEntries(MPR_IDS.map(id => [id, [{ segmentationId: SEG_ID }]])));
  for (const id of MPR_IDS) for (let l = 1; l <= 48; l++) seg.config.color.setSegmentIndexColor(id, SEG_ID, l, [...colorOf(l), 255] as never);
  for (const id of MPR_IDS) seg.activeSegmentation.setActiveSegmentation(id, SEG_ID);
  setOpacity(0.45); refresh();
  return { jobId, meta, volumeId, flipZ, dirty: false };
}

export function clear() {
  try { for (const id of MPR_IDS) seg.removeSegmentationRepresentations(id, { segmentationId: SEG_ID } as never); } catch { /* none shown */ }
  try { seg.state.removeSegmentation(SEG_ID); } catch { /* none */ }
  try { cs.cache.removeVolumeLoadObject(SEG_ID); } catch { /* none */ }
}
/** Re-attaches the labelmap after the MPR views were rebuilt (for example on return from the dental view). */
export async function reattach() {
  if (!seg.state.getSegmentation(SEG_ID)) return;
  await seg.addLabelmapRepresentationToViewportMap(Object.fromEntries(MPR_IDS.map(id => [id, [{ segmentationId: SEG_ID }]])));
  for (const id of MPR_IDS) for (let l = 1; l <= 48; l++) seg.config.color.setSegmentIndexColor(id, SEG_ID, l, [...colorOf(l), 255] as never);
  for (const id of MPR_IDS) seg.activeSegmentation.setActiveSegmentation(id, SEG_ID);
  refresh();
}

export function setVisible(label: number, on: boolean) {
  for (const id of MPR_IDS) {
    seg.config.visibility.setSegmentIndexVisibility(id, { segmentationId: SEG_ID, type: T.Enums.SegmentationRepresentations.Labelmap }, label, on);
    // alpha 0 also removes the outline, which the visibility flag alone leaves drawn
    seg.config.color.setSegmentIndexColor(id, SEG_ID, label, [...colorOf(label), on ? 255 : 0] as never);
  }
  refresh();
}
export function setOpacity(a: number) {
  seg.config.style.setStyle({ type: T.Enums.SegmentationRepresentations.Labelmap }, { fillAlpha: a, fillAlphaInactive: a, outlineWidth: 1, outlineWidthInactive: 1 } as never);
  try { engine().renderViewports(MPR_IDS); } catch { /* views not mounted */ }
}
export function setActiveLabel(label: number) { seg.segmentIndex.setActiveSegmentIndex(SEG_ID, label); }
export function setBrushSize(mm: number, toolGroupId: string) { for (const n of ['Brush', 'Eraser']) T.utilities.segmentation.setBrushSizeForToolGroup(toolGroupId, mm, n); }

const worldToIndex = (world: number[]) => (cs.utilities.transformWorldToIndex(labelVolume().imageData as never, world as never) as number[]).map(Math.round);

/** Flood fill from a clicked point over voxels whose grey value is close to the seed's. Returns voxels written. */
export function regionGrow(world: number[], label: number, volumeId: string, tolerance: number, maxVoxels = 400000): number {
  const img = (cs.cache.getVolume(volumeId) as unknown as { voxelManager: { getAtIndex: (i: number) => number } }).voxelManager, lab = labelVolume().voxelManager;
  const [nx, ny, nz] = labelVolume().dimensions, [x0, y0, z0] = worldToIndex(world);
  if (x0 < 0 || y0 < 0 || z0 < 0 || x0 >= nx || y0 >= ny || z0 >= nz) return 0;
  const nxy = nx * ny, seedI = z0 * nxy + y0 * nx + x0, seed = img.getAtIndex(seedI);
  const seen = new Set<number>([seedI]), queue = [seedI]; let n = 0;
  while (queue.length && n < maxVoxels) {
    const i = queue.pop()!; lab.setAtIndex(i, label); n++;
    const x = i % nx, y = ((i / nx) | 0) % ny, z = (i / nxy) | 0;
    for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
      const X = x + dx, Y = y + dy, Z = z + dz; if (X < 0 || Y < 0 || Z < 0 || X >= nx || Y >= ny || Z >= nz) continue;
      const j = Z * nxy + Y * nx + X; if (seen.has(j)) continue; seen.add(j);
      if (Math.abs(img.getAtIndex(j) - seed) <= tolerance) queue.push(j);
    }
  }
  refresh(); return n;
}

/** Replaces a canal by a tube of the given radius along a smooth curve through the clicked points. */
export function canalTube(points: number[][], label: number, radiusMm: number): number {
  if (points.length < 2) return 0;
  const lab = labelVolume().voxelManager, [nx, ny, nz] = labelVolume().dimensions, sp = labelVolume().spacing, nxy = nx * ny;
  const data = allVoxels();
  for (let i = 0; i < data.length; i++) if (data[i] === label) lab.setAtIndex(i, 0);
  const P = points, at = (i: number) => P[Math.max(0, Math.min(P.length - 1, i))]; let n = 0;
  const r = [0, 1, 2].map(a => Math.ceil(radiusMm / sp[a]));
  for (let s = 0; s < P.length - 1; s++) for (let k = 0; k <= 30; k++) {
    const t = k / 30, t2 = t * t, t3 = t2 * t, p0 = at(s - 1), p1 = at(s), p2 = at(s + 1), p3 = at(s + 2);
    const w = [0, 1, 2].map(a => 0.5 * (2 * p1[a] + (p2[a] - p0[a]) * t + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t2 + (3 * p1[a] - p0[a] - 3 * p2[a] + p3[a]) * t3));
    const [cx, cy, cz] = worldToIndex(w);
    for (let dz = -r[2]; dz <= r[2]; dz++) for (let dy = -r[1]; dy <= r[1]; dy++) for (let dx = -r[0]; dx <= r[0]; dx++) {
      if ((dx * sp[0]) ** 2 + (dy * sp[1]) ** 2 + (dz * sp[2]) ** 2 > radiusMm * radiusMm) continue;
      const X = cx + dx, Y = cy + dy, Z = cz + dz; if (X < 0 || Y < 0 || Z < 0 || X >= nx || Y >= ny || Z >= nz) continue;
      lab.setAtIndex(Z * nxy + Y * nx + X, label); n++;
    }
  }
  refresh(); return n;
}

export function relabel(from: number, to: number) {
  const lab = labelVolume().voxelManager, data = allVoxels();
  for (let i = 0; i < data.length; i++) if (data[i] === from) lab.setAtIndex(i, to);
  refresh();
}
/** Voxel counts per label, for the structure list after an edit. */
export function census(): Map<number, number> {
  const data = allVoxels(), counts = new Uint32Array(256);
  for (let i = 0; i < data.length; i++) counts[data[i]]++;
  const m = new Map<number, number>(); counts.forEach((c, l) => { if (l && c) m.set(l, c); }); return m;
}
export async function saveEdits(r: AiResult) {
  let data: Uint8Array = Uint8Array.from(allVoxels());
  const [nx, ny, nz] = labelVolume().dimensions;
  if (r.flipZ) data = flipSlices(data, nx * ny, nz);
  const res = await fetch(API + `/api/jobs/${r.jobId}/labels`, { method: 'PUT', body: gzipSync(data, { level: 1 }) as Uint8Array<ArrayBuffer> });
  if (!res.ok) throw new Error(await res.text());
}
export function jumpTo(world: number[]) {
  for (const id of MPR_IDS) {
    const vp = engine().getViewport(id) as cs.VolumeViewport, cam = vp.getCamera(), n = cam.viewPlaneNormal!, f = cam.focalPoint!, p = cam.position!;
    const d = (world[0] - f[0]) * n[0] + (world[1] - f[1]) * n[1] + (world[2] - f[2]) * n[2];
    vp.setCamera({ focalPoint: [f[0] + n[0] * d, f[1] + n[1] * d, f[2] + n[2] * d], position: [p[0] + n[0] * d, p[1] + n[1] * d, p[2] + n[2] * d] });
    vp.render();
  }
}
export const meshUrl = (r: AiResult, label: number, ext: 'glb' | 'stl' = 'glb') => API + `/api/jobs/${r.jobId}/mesh/${label}.${ext}`;
