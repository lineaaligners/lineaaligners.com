import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expandZips, groupInstances, readDicomFiles, readHeader, type SourceFile } from '../src/lib/intake';
import { rasterToDicom, rgbaToRaster } from '../src/lib/dicomWrite';

const walk = (dir: string): string[] => readdirSync(dir).flatMap(f => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const load = (paths: string[]): SourceFile[] => paths.map(p => ({ name: p, blob: new Blob([readFileSync(p)]) }));
const open = async (paths: string[]) => { const r = await readDicomFiles(await expandZips(load(paths))); return { ...r, studies: groupInstances(r.instances) }; };

describe('DICOM intake', () => {
  it('groups a multi-file CBCT into one volume sorted by slice position', async () => {
    const { studies } = await open(walk('testdata/cbct'));
    expect(studies).toHaveLength(1);
    const s = studies[0].series[0];
    expect(s.kind).toBe('volume'); expect(s.count).toBe(60);
    const z = s.instances.map(i => i.ipp![2]);
    expect(z).toEqual([...z].sort((a, b) => a - b));
    expect(studies[0].patient).toBe('Test Pacient');
  });
  it('treats a single multi-frame file as a volume', async () => {
    const { studies } = await open(walk('testdata/mf'));
    expect(studies[0].series[0]).toMatchObject({ kind: 'volume', count: 60, rows: 80, cols: 96 });
  });
  it('opens a ZIP export and skips the non-DICOM file silently', async () => {
    const { studies, skipped } = await open(['testdata/export.zip']);
    expect(studies[0].series[0]).toMatchObject({ kind: 'volume', count: 60 });
    expect(skipped).toBe(0);
  });
  it('opens a DICOMDIR media export without counting the index as an error', async () => {
    const { studies, skipped } = await open(walk('testdata/dicomdir'));
    expect(studies[0].series[0]).toMatchObject({ kind: 'volume', count: 20 });
    expect(skipped).toBe(0);
  });
  it('keeps a 2D intraoral image as a stack with sensor spacing', async () => {
    const { studies } = await open(walk('testdata/2d'));
    const s = studies[0].series[0];
    expect(s.kind).toBe('stack'); expect(s.modality).toBe('IO'); expect(s.instances[0].spacing).toEqual([0.02, 0.02]);
  });
  it('reads headers of compressed transfer syntaxes', async () => {
    const { instances, skipped } = await open(walk('testdata/codecs'));
    expect(skipped).toBe(0);
    expect(new Set(instances.map(i => i.ts)).size).toBeGreaterThanOrEqual(6);
  });
  it('rejects files that are not DICOM', () => {
    expect(readHeader(new TextEncoder().encode('x'.repeat(500)).buffer as ArrayBuffer, new Blob(), 'a.bin')).toBeNull();
  });
});

describe('raster wrapping', () => {
  it('wraps a grey PNG-style bitmap as 8-bit MONOCHROME2 DICOM', () => {
    const rgba = new Uint8Array(4 * 6); for (let i = 0; i < 6; i++) rgba.set([i * 40, i * 40, i * 40, 255], i * 4);
    const r = rgbaToRaster(rgba, 3, 2);
    expect(r.samples).toBe(1);
    const bytes = rasterToDicom({ ...r, width: 3, height: 2, name: 'x.png', studyUid: '1.2.3' }) as Uint8Array<ArrayBuffer>;
    const h = readHeader(bytes.buffer, new Blob(), 'x.png')!;
    expect(h).toMatchObject({ rows: 2, cols: 3, frames: 1, studyUid: '1.2.3', ts: '1.2.840.10008.1.2.1' });
  });
  it('keeps colour images as RGB', () => {
    const r = rgbaToRaster(new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]), 2, 1);
    expect(r.samples).toBe(3); expect([...r.pixels]).toEqual([255, 0, 0, 0, 255, 0]);
  });
});
