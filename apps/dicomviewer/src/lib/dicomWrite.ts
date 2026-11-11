// Wraps an 8-bit raster (PNG/JPG export from a sensor) in a minimal DICOM Secondary Capture
// so it goes through the same loader, tools and measurements as real DICOM.
const enc = new TextEncoder();
const LONG = new Set(['OB', 'OW', 'UN', 'SQ', 'UT']);

function el(tag: number, vr: string, value: Uint8Array): Uint8Array {
  const pad = value.length & 1;
  const long = LONG.has(vr);
  const out = new Uint8Array((long ? 12 : 8) + value.length + pad);
  const dv = new DataView(out.buffer);
  dv.setUint16(0, tag >>> 16, true); dv.setUint16(2, tag & 0xffff, true);
  out[4] = vr.charCodeAt(0); out[5] = vr.charCodeAt(1);
  if (long) dv.setUint32(8, value.length + pad, true); else dv.setUint16(6, value.length + pad, true);
  out.set(value, long ? 12 : 8);
  if (pad && vr !== 'UI' && vr !== 'OB') out[out.length - 1] = 0x20;
  return out;
}
const str = (tag: number, vr: string, s: string) => el(tag, vr, enc.encode(s));
const us = (tag: number, v: number) => el(tag, 'US', new Uint8Array(new Uint16Array([v]).buffer));
const cat = (parts: Uint8Array[]) => { const o = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)); let i = 0; for (const p of parts) { o.set(p, i); i += p.length; } return o; };

export function newUid(): string {
  const r = crypto.getRandomValues(new Uint32Array(3));
  return `2.25.${Date.now()}${r[0]}${r[1]}${r[2]}`.slice(0, 60);
}

export interface RasterInput { width: number; height: number; samples: 1 | 3; pixels: Uint8Array; name: string; studyUid: string; date?: string; bits?: 8 | 16; inverted?: boolean }

export function rasterToDicom(r: RasterInput): Uint8Array {
  const bits = r.bits || 8, sop = newUid(), SC = '1.2.840.10008.5.1.4.1.1.7';
  const metaBody = cat([
    el(0x00020001, 'OB', new Uint8Array([0, 1])), str(0x00020002, 'UI', SC), str(0x00020003, 'UI', sop),
    str(0x00020010, 'UI', '1.2.840.10008.1.2.1'), str(0x00020012, 'UI', '2.25.80302813137786398554742050926734630921'),
  ]);
  const meta = cat([el(0x00020000, 'UL', new Uint8Array(new Uint32Array([metaBody.length]).buffer)), metaBody]);
  const ds = cat([
    str(0x00080016, 'UI', SC), str(0x00080018, 'UI', sop), str(0x00080020, 'DA', r.date || ''), str(0x00080060, 'CS', 'OT'),
    str(0x0008103e, 'LO', r.name.slice(0, 64)), str(0x00100010, 'PN', ''), str(0x00100020, 'LO', ''),
    str(0x0020000d, 'UI', r.studyUid), str(0x0020000e, 'UI', newUid()), str(0x00200013, 'IS', '1'),
    us(0x00280002, r.samples), str(0x00280004, 'CS', r.samples === 3 ? 'RGB' : r.inverted ? 'MONOCHROME1' : 'MONOCHROME2'),
    ...(r.samples === 3 ? [us(0x00280006, 0)] : []),
    us(0x00280010, r.height), us(0x00280011, r.width), us(0x00280100, bits), us(0x00280101, bits), us(0x00280102, bits - 1), us(0x00280103, 0),
    el(0x7fe00010, bits === 16 ? 'OW' : 'OB', r.pixels),
  ]);
  const pre = new Uint8Array(132); pre.set(enc.encode('DICM'), 128);
  return cat([pre, meta, ds]);
}

export function rgbaToRaster(rgba: Uint8ClampedArray | Uint8Array, width: number, height: number): { samples: 1 | 3; pixels: Uint8Array } {
  const n = width * height; let gray = true;
  for (let i = 0; i < n * 4; i += 4) if (rgba[i] !== rgba[i + 1] || rgba[i] !== rgba[i + 2]) { gray = false; break; }
  const pixels = new Uint8Array(gray ? n : n * 3);
  if (gray) for (let i = 0; i < n; i++) pixels[i] = rgba[i * 4];
  else for (let i = 0; i < n; i++) { pixels[i * 3] = rgba[i * 4]; pixels[i * 3 + 1] = rgba[i * 4 + 1]; pixels[i * 3 + 2] = rgba[i * 4 + 2]; }
  return { samples: gray ? 1 : 3, pixels };
}

/** Decoded TIFF page (from UTIF) to raster input: keeps 16-bit grey depth, otherwise falls back to 8-bit. */
export function tiffToRaster(ifd: { width: number; height: number; data: Uint8Array; t258?: number[]; t277?: number[]; t262?: number[] }, rgba: () => Uint8Array): { samples: 1 | 3; pixels: Uint8Array; bits: 8 | 16; inverted: boolean } {
  const bps = ifd.t258?.[0] || 8, spp = ifd.t277?.[0] || 1, photo = ifd.t262?.[0] ?? 1;
  if (spp === 1 && bps === 16 && photo <= 1) return { samples: 1, bits: 16, inverted: photo === 0, pixels: ifd.data.subarray(0, ifd.width * ifd.height * 2) };
  return { ...rgbaToRaster(rgba(), ifd.width, ifd.height), bits: 8, inverted: false };
}
