// Anonymised export: blanks identifying tags in place (file size and offsets stay the same), then zips.
import dicomParser from 'dicom-parser';
import { zipSync } from 'fflate';

// Patient, institution and staff identifiers at the top level of the dataset. UIDs and dates are kept.
const BLANK = ['x00100010', 'x00100020', 'x00100030', 'x00100032', 'x00101000', 'x00101001', 'x00101040', 'x00102154', 'x00102160', 'x00104000',
  'x00080050', 'x00080080', 'x00080081', 'x00080090', 'x00080092', 'x00080094', 'x00081010', 'x00081040', 'x00081048', 'x00081050', 'x00081060', 'x00081070', 'x00200010', 'x00321032', 'x00380010'];

export function anonymizeBytes(src: Uint8Array): Uint8Array {
  const out = src.slice();
  const ds = dicomParser.parseDicom(src, { untilTag: 'x7fe00010' });
  for (const tag of BLANK) {
    const e = ds.elements[tag];
    if (!e || !e.length || e.items) continue;
    out.fill(0x20, e.dataOffset, e.dataOffset + e.length);
    if (tag === 'x00100010' || tag === 'x00100020') { const mark = 'ANONIM'; for (let i = 0; i < Math.min(mark.length, e.length); i++) out[e.dataOffset + i] = mark.charCodeAt(i); }
  }
  return out;
}

export async function anonymizedZip(blobs: Blob[], onProgress?: (done: number, total: number) => void): Promise<Uint8Array> {
  const files: Record<string, Uint8Array> = {};
  for (let i = 0; i < blobs.length; i++) {
    files[`IM${String(i + 1).padStart(5, '0')}.dcm`] = anonymizeBytes(new Uint8Array(await blobs[i].arrayBuffer()));
    if (i % 16 === 0) onProgress?.(i, blobs.length);
  }
  return zipSync(files, { level: 0 });
}
