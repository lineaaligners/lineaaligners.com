// File intake: expands ZIPs, reads DICOM headers and groups instances into studies and series.
// Pure logic (no DOM, no Cornerstone) so it can be tested in Node.
import dicomParser from 'dicom-parser';
import { unzipSync } from 'fflate';

export interface SourceFile { name: string; blob: Blob }
export interface Instance {
  blob: Blob; name: string; sop: string; studyUid: string; seriesUid: string;
  patient: string; patientId: string; date: string; modality: string; seriesDesc: string; studyDesc: string;
  manufacturer: string; model: string; ts: string;
  rows: number; cols: number; frames: number; instance: number;
  ipp?: number[]; iop?: number[]; spacing?: number[]; thickness?: number; hasFrameGroups: boolean;
}
export type SeriesKind = 'volume' | 'stack';
export interface Series { id: string; kind: SeriesKind; instances: Instance[]; label: string; modality: string; count: number; rows: number; cols: number }
export interface Study { uid: string; patient: string; patientId: string; date: string; desc: string; series: Series[] }
export interface IntakeResult { studies: Study[]; skipped: number }

const RASTER = /\.(png|jpe?g|bmp|webp|tiff?)$/i;
const IGNORE = /(^|\/)(\.DS_Store|Thumbs\.db|desktop\.ini)$|\.(txt|xml|html?|pdf|exe|dll|ini|inf|css|js|json|log|lnk|ico|chm)$/i;
export const isRaster = (name: string) => RASTER.test(name);
export const isZip = (name: string) => /\.zip$/i.test(name);

export async function expandZips(files: SourceFile[]): Promise<SourceFile[]> {
  const out: SourceFile[] = [];
  for (const f of files) {
    if (!isZip(f.name)) { out.push(f); continue; }
    const entries = unzipSync(new Uint8Array(await f.blob.arrayBuffer()));
    for (const [path, data] of Object.entries(entries)) {
      if (path.endsWith('/') || !data.length) continue;
      const bytes = data as Uint8Array<ArrayBuffer>;
      const item = { name: path, blob: new Blob([bytes]) };
      if (isZip(path)) out.push(...await expandZips([item])); else out.push(item);
    }
  }
  return out;
}

const nums = (s?: string) => (s ? s.split('\\').map(Number).filter(n => !Number.isNaN(n)) : undefined);

export function readHeader(buf: ArrayBuffer, blob: Blob, name: string): Instance | null {
  let ds: dicomParser.DataSet;
  try { ds = dicomParser.parseDicom(new Uint8Array(buf), { untilTag: 'x7fe00010' }); } catch { return null; }
  const rows = ds.uint16('x00280010'), cols = ds.uint16('x00280011');
  if (!rows || !cols) return null; // DICOMDIR, reports, structured data: no image
  const s = (t: string) => (ds.string(t) || '').trim();
  return {
    blob, name, sop: s('x00080018'), studyUid: s('x0020000d') || 'study', seriesUid: s('x0020000e') || 'series',
    patient: s('x00100010').replace(/\^+/g, ' ').trim(), patientId: s('x00100020'), date: s('x00080020'),
    modality: s('x00080060'), seriesDesc: s('x0008103e'), studyDesc: s('x00081030'),
    manufacturer: s('x00080070'), model: s('x00081090'), ts: s('x00020010'),
    rows, cols, frames: Math.max(1, parseInt(s('x00280008') || '1', 10) || 1), instance: parseInt(s('x00200013') || '0', 10) || 0,
    ipp: nums(ds.string('x00200032')), iop: nums(ds.string('x00200037')), spacing: nums(ds.string('x00280030')) || nums(ds.string('x00181164')),
    thickness: parseFloat(s('x00180050')) || undefined, hasFrameGroups: !!ds.elements.x52009230,
  };
}

const normal = (o: number[]) => [o[1] * o[5] - o[2] * o[4], o[2] * o[3] - o[0] * o[5], o[0] * o[4] - o[1] * o[3]];
const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export function groupInstances(list: Instance[]): Study[] {
  const studies = new Map<string, Study>();
  const buckets = new Map<string, Instance[]>();
  for (const i of list) {
    // a multi-frame file is always its own series; single frames group by series and matrix size
    const key = [i.studyUid, i.seriesUid, i.rows, i.cols, i.frames > 1 ? i.sop || i.name : ''].join('|');
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(i);
  }
  for (const [key, g] of buckets) {
    const a = g[0];
    const positioned = g.every(i => i.ipp?.length === 3) && a.iop?.length === 6;
    const isVolume = (g.length === 1 && a.frames >= 8) || (g.length >= 8 && a.frames === 1 && (positioned || /^(CT|MR)$/.test(a.modality)));
    if (isVolume && positioned && g.length > 1) { const n = normal(a.iop!); g.sort((p, q) => dot(p.ipp!, n) - dot(q.ipp!, n)); }
    else g.sort((p, q) => p.instance - q.instance || p.name.localeCompare(q.name));
    if (!studies.has(a.studyUid)) studies.set(a.studyUid, { uid: a.studyUid, patient: a.patient, patientId: a.patientId, date: a.date, desc: a.studyDesc, series: [] });
    const count = isVolume ? (g.length === 1 ? a.frames : g.length) : g.reduce((n, i) => n + i.frames, 0);
    studies.get(a.studyUid)!.series.push({ id: key, kind: isVolume ? 'volume' : 'stack', instances: g, label: a.seriesDesc || a.name.split('/').pop() || a.modality, modality: a.modality, count, rows: a.rows, cols: a.cols });
  }
  return [...studies.values()];
}

/** Reads headers of every non-raster file. Raster files are handled by the caller (needs a canvas). */
export async function readDicomFiles(files: SourceFile[], onProgress?: (done: number, total: number) => void): Promise<{ instances: Instance[]; skipped: number }> {
  const instances: Instance[] = []; let skipped = 0, done = 0;
  const todo = files.filter(f => !IGNORE.test(f.name) && !isRaster(f.name) && f.blob.size > 132);
  for (const f of todo) {
    const inst = readHeader(await f.blob.arrayBuffer(), f.blob, f.name);
    if (inst) instances.push(inst); else if (!/DICOMDIR$/i.test(f.name)) skipped++;
    if (++done % 16 === 0) onProgress?.(done, todo.length);
  }
  return { instances, skipped };
}
