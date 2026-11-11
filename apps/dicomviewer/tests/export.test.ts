import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import dicomParser from 'dicom-parser';
import { unzipSync } from 'fflate';
import UTIF from 'utif2';
import { anonymizeBytes, anonymizedZip } from '../src/lib/anonymize';
import { rasterToDicom, tiffToRaster } from '../src/lib/dicomWrite';
import { readHeader } from '../src/lib/intake';
import { buildReport } from '../src/lib/report';

describe('anonymised export', () => {
  const src = new Uint8Array(readFileSync('testdata/2d/io.dcm'));
  it('blanks identifying tags and leaves the image untouched', () => {
    const out = anonymizeBytes(src), a = dicomParser.parseDicom(src), b = dicomParser.parseDicom(out);
    expect(a.string('x00100010')).toBe('Test^Pacient');
    expect(b.string('x00100010')).toBe('ANONIM'); expect(b.string('x00100020')).toBe('AN');
    expect((b.string('x00100030') || '').trim()).toBe(''); expect((b.string('x00080080') || '').trim()).toBe(''); expect((b.string('x00080090') || '').trim()).toBe('');
    expect(b.string('x0020000d')).toBe(a.string('x0020000d'));
    expect(out.length).toBe(src.length);
    const pa = a.elements.x7fe00010, pb = b.elements.x7fe00010;
    expect(Buffer.from(out.subarray(pb.dataOffset, pb.dataOffset + pb.length)).equals(Buffer.from(src.subarray(pa.dataOffset, pa.dataOffset + pa.length)))).toBe(true);
  });
  it('zips the series with neutral file names', async () => {
    const zip = unzipSync(await anonymizedZip([new Blob([src]), new Blob([src])]));
    expect(Object.keys(zip)).toEqual(['IM00001.dcm', 'IM00002.dcm']);
  });
});

describe('TIFF import', () => {
  it('keeps 16-bit grey depth', () => {
    const file = readFileSync('testdata/gray16.tif'), buf = file.buffer.slice(file.byteOffset, file.byteOffset + file.length) as ArrayBuffer, ifd = UTIF.decode(buf)[0];
    UTIF.decodeImage(buf, ifd);
    const r = tiffToRaster(ifd as never, () => UTIF.toRGBA8(ifd));
    expect(r).toMatchObject({ samples: 1, bits: 16 });
    const bytes = rasterToDicom({ width: ifd.width, height: ifd.height, ...r, name: 'gray16.tif', studyUid: '1.2.3' }) as Uint8Array<ArrayBuffer>;
    expect(readHeader(bytes.buffer, new Blob(), 'gray16.tif')).toMatchObject({ rows: 90, cols: 130 });
    const ds = dicomParser.parseDicom(bytes), px = ds.elements.x7fe00010;
    expect(ds.uint16('x00280100')).toBe(16);
    expect(new DataView(bytes.buffer, px.dataOffset).getUint16((5 * 130 + 7) * 2, true)).toBe((5 + 7) * 200);
  });
});

describe('PDF report', () => {
  it('builds a PDF with patient block, notes and a second page when views overflow', () => {
    const px = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
    const shots = [1, 2, 3].map(i => ({ url: px, caption: `Pamja ${i}`, w: 4, h: 3 }));
    const doc = buildReport({ clinic: 'Medident', title: 'Raporti', disclaimer: 'Jo për përdorim diagnostik.', patient: [['Pacienti', 'Test Pacient']], notesLabel: 'Shënime', notes: 'Kockë e mjaftueshme në regjionin 36.', shots });
    expect(doc.getNumberOfPages()).toBe(2);
    expect(doc.output().startsWith('%PDF-')).toBe(true);
  });
});
