// Browser-only half of intake: dropped folders, raster images, and the store update.
import { expandZips, groupInstances, isRaster, readDicomFiles, readHeader, type Instance, type SourceFile } from './intake';
import UTIF from 'utif2';
import { newUid, rasterToDicom, rgbaToRaster, tiffToRaster } from './dicomWrite';
import { useStore } from '../store';
import i18n from '../i18n';

export async function filesFromDrop(dt: DataTransfer): Promise<SourceFile[]> {
  const entries = [...dt.items].map(i => i.webkitGetAsEntry?.()).filter(Boolean) as FileSystemEntry[];
  if (!entries.length) return [...dt.files].map(f => ({ name: f.name, blob: f }));
  const out: SourceFile[] = [];
  const walk = async (e: FileSystemEntry): Promise<void> => {
    if (e.isFile) { await new Promise<void>(res => (e as FileSystemFileEntry).file(f => { out.push({ name: e.fullPath.replace(/^\//, ''), blob: f }); res(); }, () => res())); return; }
    const reader = (e as FileSystemDirectoryEntry).createReader();
    for (;;) {
      const batch = await new Promise<FileSystemEntry[]>(res => reader.readEntries(res, () => res([])));
      if (!batch.length) break;
      for (const child of batch) await walk(child);
    }
  };
  for (const e of entries) await walk(e);
  return out;
}

async function rasterInstance(f: SourceFile, studyUid: string): Promise<Instance | null> {
  try {
    const name = f.name.split('/').pop() || f.name;
    let bytes: Uint8Array<ArrayBuffer>;
    if (/\.tiff?$/i.test(f.name)) {
      const buf = await f.blob.arrayBuffer(), ifd = UTIF.decode(buf)[0];
      UTIF.decodeImage(buf, ifd);
      const r = tiffToRaster(ifd as never, () => UTIF.toRGBA8(ifd));
      bytes = rasterToDicom({ width: ifd.width, height: ifd.height, ...r, name, studyUid }) as Uint8Array<ArrayBuffer>;
    } else {
      const bmp = await createImageBitmap(f.blob);
      const canvas = new OffscreenCanvas(bmp.width, bmp.height);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(bmp, 0, 0);
      const { samples, pixels } = rgbaToRaster(ctx.getImageData(0, 0, bmp.width, bmp.height).data, bmp.width, bmp.height);
      bytes = rasterToDicom({ width: bmp.width, height: bmp.height, samples, pixels, name, studyUid }) as Uint8Array<ArrayBuffer>;
    }
    return readHeader(bytes.buffer, new Blob([bytes]), f.name);
  } catch { return null; }
}

export async function ingest(input: SourceFile[]) {
  const { setBusy, say, addStudies, open, active } = useStore.getState();
  const t = i18n.t.bind(i18n);
  try {
    setBusy({ label: t('reading'), pct: null });
    const files = await expandZips(input);
    const { instances, skipped } = await readDicomFiles(files, (d, n) => setBusy({ label: `${t('reading')} ${d}/${n}`, pct: d / n }));
    const rasters = files.filter(f => isRaster(f.name));
    const rasterStudy = newUid(); let bad = skipped;
    for (const r of rasters) { const inst = await rasterInstance(r, rasterStudy); if (inst) instances.push(inst); else bad++; }
    if (!instances.length) { say(t('none_found'), true); return; }
    const studies = groupInstances(instances);
    addStudies(studies);
    if (!active) open(studies[0].series.find(s => s.kind === 'volume') || studies[0].series[0]);
    if (bad) say(t('skipped', { n: bad }));
  } catch (e) { say(String((e as Error).message || e), true); } finally { setBusy(null); }
}
