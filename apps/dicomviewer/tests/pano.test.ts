import { describe, expect, it } from 'vitest';
import { buildCurve, fdiToUniversal, findJaws, fitArch, reslicePano, resliceCross, type Vol } from '../src/lib/pano';

// Phantom: 14 "teeth" (dense cylinders) on a parabola, in two jaws separated by a gap.
const N = 12, tooth = (i: number) => { const t = -0.9 + (i * 1.8) / (N - 1); return [80 + t * 50, 30 + 70 * t * t]; };
function phantom(): Vol {
  const nx = 160, ny = 160, nz = 60, data = new Int16Array(nx * ny * nz).fill(-1000);
  for (let i = 0; i < N; i++) {
    const [cx, cy] = tooth(i);
    for (let z = 8; z < 52; z++) { if (z >= 28 && z < 32) continue;
      for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) if (x * x + y * y <= 9) data[z * nx * ny + Math.round(cy + y) * nx + Math.round(cx + x)] = 2500; }
  }
  return { nx, ny, nz, dx: 0.4, dy: 0.4, dz: 0.4, data, zUp: true, air: -1000 };
}

describe('panoramic reconstruction', () => {
  const vol = phantom(), jaws = findJaws(vol);
  it('finds the occlusal split between the jaws', () => { expect(jaws.split).toBeGreaterThanOrEqual(27); expect(jaws.split).toBeLessThanOrEqual(32); });
  it('fits the arch through the teeth', () => {
    const pts = fitArch(vol, jaws.zA, jaws.zB, jaws.thr);
    expect(pts.length).toBeGreaterThanOrEqual(7); expect(pts[0].x).toBeLessThan(pts[pts.length - 1].x);
    for (const p of pts) { const t = (p.x - 80) / 50; expect(Math.abs(p.y - (30 + 70 * t * t))).toBeLessThan(7); }
  });
  const curve = buildCurve(vol, fitArch(vol, jaws.zA, jaws.zB, jaws.thr));
  it('samples the curve at one voxel of arc length', () => {
    for (let i = 1; i < curve.W; i += 17) expect(Math.hypot((curve.cx[i] - curve.cx[i - 1]) * 0.4, (curve.cy[i] - curve.cy[i - 1]) * 0.4)).toBeCloseTo(0.4, 1);
    expect(curve.hw).toBe(Math.round(15 / 0.4));
  });
  it('moving the layer off the curve leaves the teeth behind', () => {
    const on = reslicePano(vol, curve, 0, vol.nz - 1, 1, 'mip', 0), off = reslicePano(vol, curve, 0, vol.nz - 1, 1, 'mip', 12);
    const bright = (d: Float32Array) => d.reduce((n, v) => n + (v > 1000 ? 1 : 0), 0);
    expect(bright(on.data)).toBeGreaterThan(500); expect(bright(off.data)).toBeLessThan(bright(on.data) * 0.2);
  });
  it('shows every tooth in the panoramic and the gap between the jaws', () => {
    const p = reslicePano(vol, curve, 0, vol.nz - 1, 4, 'mip');
    expect(p.w).toBe(curve.W); expect(p.h).toBe(60);
    const row = (r: number) => Array.from({ length: p.w }, (_, i) => p.data[r * p.w + i]);
    let teeth = 0, inside = false;
    for (const v of row(15)) { if (v > 1000 && !inside) teeth++; inside = v > 1000; }
    expect(teeth).toBeGreaterThanOrEqual(N - 2); expect(teeth).toBeLessThanOrEqual(N);
    expect(Math.max(...row(59 - 29))).toBeLessThan(0); // z = 29 is inside the gap
  });
  it('centres the tooth in a cross-section and measures its true width', () => {
    const [tx, ty] = tooth(5);
    let s = 0, best = 1e9; for (let i = 0; i < curve.W; i++) { const d = Math.hypot(curve.cx[i] - tx, curve.cy[i] - ty); if (d < best) { best = d; s = i; } }
    const x = resliceCross(vol, curve, s, 0, vol.nz - 1, 0), r = 15;
    let lo = -1, hi = -1; for (let j = 0; j < x.w; j++) if (x.data[r * x.w + j] > 750) { if (lo < 0) lo = j; hi = j; }
    expect(Math.abs((lo + hi) / 2 - curve.hw)).toBeLessThan(6);
    expect((hi - lo + 1) * x.sx).toBeGreaterThan(2); expect((hi - lo + 1) * x.sx).toBeLessThan(3.4); // 7 voxels = 2.8 mm
  });
});

describe('tooth numbering', () => {
  it('converts FDI to Universal', () => {
    expect([18, 11, 21, 28, 38, 31, 41, 48].map(fdiToUniversal)).toEqual([1, 8, 9, 16, 17, 24, 25, 32]);
  });
});

describe('arch curve on harder scans', () => {
  // a deep U-shaped arch: the molars run straight back, which a parabola cannot follow
  const N2 = 200, teeth: number[][] = [];
  for (let i = 0; i <= 20; i++) { const a = (Math.PI * i) / 20; teeth.push([100 - 55 * Math.cos(a), 80 - 50 * Math.sin(a)]); }
  for (let k = 1; k <= 5; k++) { teeth.push([45, 80 + k * 12]); teeth.push([155, 80 + k * 12]); }
  const make = (keep: (t: number[]) => boolean): Vol => {
    const data = new Int16Array(N2 * N2 * 30).fill(-1000);
    for (const [cx, cy] of teeth.filter(keep)) for (let z = 4; z < 26; z++) for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) if (x * x + y * y <= 16) data[z * N2 * N2 + Math.round(cy + y) * N2 + Math.round(cx + x)] = 2400;
    return { nx: N2, ny: N2, nz: 30, dx: 0.3, dy: 0.3, dz: 0.3, data, zUp: true, air: -1000 };
  };
  const worst = (vol: Vol, kept: number[][]) => { const j = findJaws(vol), c = buildCurve(vol, fitArch(vol, j.zA, j.zB, j.thr)); return Math.max(...kept.map(([tx, ty]) => { let d = 1e9; for (let i = 0; i < c.W; i++) d = Math.min(d, Math.hypot(c.cx[i] - tx, c.cy[i] - ty)); return d; })); };
  it('follows a deep U-shaped arch through every tooth', () => { expect(worst(make(() => true), teeth)).toBeLessThan(5); });
  it('follows a partial arch from a small field of view', () => { const keep = (t: number[]) => t[0] < 100 && t[1] < 100; expect(worst(make(keep), teeth.filter(keep))).toBeLessThan(5); });
});
