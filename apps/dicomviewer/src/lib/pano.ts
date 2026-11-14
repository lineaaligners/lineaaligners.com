// Curved reconstruction along the dental arch: panoramic image and cross-sections.
// Pure math on a voxel array, so it can be tested without a browser.
export type Voxels = Int16Array | Uint16Array | Uint8Array | Float32Array;
export interface Vol { nx: number; ny: number; nz: number; dx: number; dy: number; dz: number; data: Voxels; zUp: boolean; air: number }
export interface Pt { x: number; y: number }
export interface Curve { cx: Float32Array; cy: Float32Array; nxv: Float32Array; nyv: Float32Array; W: number; st: number; hw: number }
export interface Slice { data: Float32Array; w: number; h: number; sx: number; sy: number }

export function percentile(data: ArrayLike<number>, p: number): number {
  const step = Math.max(1, (data.length / 200000) | 0) | 1, a = new Float32Array(Math.ceil(data.length / step));
  let j = 0; for (let i = 0; i < data.length; i += step) a[j++] = data[i];
  const b = a.subarray(0, j).sort(); return b[Math.min(j - 1, (j * p) | 0)];
}

/** Arch curve through the dense (tooth) voxels of a z-range, as control points from the patient's right to left.
 *
 * Seen from a point at the back of the arch, the teeth are sorted by angle and the middle of the tooth row is
 * taken every few degrees. Unlike a parabola this follows a deep U-shaped arch along the molars, and it also works
 * when a small field of view shows only part of the arch.
 */
export function fitArch(vol: Vol, zlo: number, zhi: number, thr: number): Pt[] {
  const { nx, ny, data } = vol, nxy = nx * ny, zs = Math.max(1, ((zhi - zlo) / 40) | 0);
  const mask = new Uint8Array(nxy);
  for (let k = zlo; k <= zhi; k += zs) for (let y = 0; y < ny; y += 2) for (let x = 0; x < nx; x += 2) if (data[k * nxy + y * nx + x] >= thr) mask[y * nx + x]++;
  // a tooth is dense over many slices; a thin bright streak (metal artefact, noise) is not
  const need = Math.max(1, Math.round(((zhi - zlo) / zs + 1) * 0.12));
  const X: number[] = [], Y: number[] = [];
  for (let y = 0; y < ny; y += 2) for (let x = 0; x < nx; x += 2) if (mask[y * nx + x] >= need) { X.push(x); Y.push(y); }
  const n = X.length;
  const fallback = () => Array.from({ length: 7 }, (_, i) => { const t = -1 + i / 3; return { x: nx / 2 + t * nx * 0.28, y: ny * 0.25 + ny * 0.45 * t * t }; });
  if (n < 50) return fallback();
  const q = (a: number[], p: number) => a.slice().sort((u, v) => u - v)[Math.min(a.length - 1, (a.length * p) | 0)];
  const cx = (q(X, 0.03) + q(X, 0.97)) / 2, cy = q(Y, 0.97), sx = vol.dx, sy = vol.dy;
  const BIN = 7.5, NB = Math.round(180 / BIN), bins: number[][] = Array.from({ length: NB }, () => []);
  for (let i = 0; i < n; i++) {
    const dxm = (X[i] - cx) * sx, dym = (cy - Y[i]) * sy; if (dym < 0) continue;
    const th = (Math.atan2(dym, dxm) * 180) / Math.PI; bins[Math.min(NB - 1, (th / BIN) | 0)].push(Math.hypot(dxm, dym));
  }
  const most = Math.max(...bins.map(b => b.length));
  let pts: { th: number; r: number }[] = [];
  bins.forEach((b, i) => { if (b.length >= Math.max(4, most * 0.08)) pts.push({ th: (i + 0.5) * BIN, r: q(b, 0.5) }); });
  if (pts.length < 4) return fallback();
  pts = pts.map((p, i) => ({ th: p.th, r: (pts[Math.max(0, i - 1)].r + p.r * 2 + pts[Math.min(pts.length - 1, i + 1)].r) / 4 }));
  const want = Math.min(11, pts.length), out: Pt[] = [];
  for (let i = 0; i < want; i++) {
    const p = pts[Math.round((i * (pts.length - 1)) / (want - 1))], a = (p.th * Math.PI) / 180;
    out.push({ x: Math.max(1, Math.min(nx - 2, cx + (p.r * Math.cos(a)) / sx)) + 0.5, y: Math.max(1, Math.min(ny - 2, cy - (p.r * Math.sin(a)) / sy)) + 0.5 });
  }
  return out[0].x > out[out.length - 1].x ? out.reverse() : out;
}

/** Finds the tooth-bearing z-range and the slice between the jaws (middle of that range). */
export function findJaws(vol: Vol): { thr: number; zA: number; zB: number; split: number } {
  const { nx, ny, nz, data } = vol, nxy = nx * ny, floor = percentile(data, 0.02) + 300;
  const step = Math.max(1, (data.length / 400000) | 0) | 1, tissue: number[] = [];
  for (let i = 0; i < data.length; i += step) if (data[i] > floor) tissue.push(data[i]);
  const thr = tissue.length > 500 ? percentile(tissue, 0.965) : percentile(data, 0.993);
  const cnt = new Uint32Array(nz); let mx = 0;
  for (let k = 0; k < nz; k++) { let c = 0; const o = k * nxy; for (let y = 0; y < ny; y += 2) for (let x = 0; x < nx; x += 2) if (data[o + y * nx + x] >= thr) c++; cnt[k] = c; if (c > mx) mx = c; }
  let zA = 0, zB = nz - 1;
  if (mx > 0) { while (zA < nz - 1 && cnt[zA] < mx * 0.25) zA++; while (zB > 0 && cnt[zB] < mx * 0.25) zB--; }
  if (zB <= zA) { zA = 0; zB = nz - 1; }
  return { thr, zA, zB, split: (zA + zB) >> 1 };
}

/** Catmull-Rom spline through the control points, resampled at equal arc length (one in-plane voxel). */
export function buildCurve(vol: Vol, pts: Pt[], halfWidthMm = 15): Curve {
  const { dx, dy } = vol, st = Math.min(dx, dy), M = pts.map(p => [p.x * dx, p.y * dy]), L = M.length, dense: number[][] = [];
  for (let i = 0; i < L - 1; i++) {
    const p0 = M[Math.max(i - 1, 0)], p1 = M[i], p2 = M[i + 1], p3 = M[Math.min(i + 2, L - 1)];
    for (let j = 0; j < 24; j++) {
      const t = j / 24, t2 = t * t, t3 = t2 * t;
      dense.push([0, 1].map(a => 0.5 * (2 * p1[a] + (p2[a] - p0[a]) * t + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t2 + (3 * p1[a] - p0[a] - 3 * p2[a] + p3[a]) * t3)));
    }
  }
  dense.push(M[L - 1]);
  const cum = [0]; for (let i = 1; i < dense.length; i++) cum.push(cum[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
  const total = cum[cum.length - 1], n = Math.max(2, Math.floor(total / st) + 1), X = new Float32Array(n), Y = new Float32Array(n);
  for (let i = 0, j = 0; i < n; i++) {
    const d = Math.min(i * st, total); while (j < dense.length - 2 && cum[j + 1] < d) j++;
    const f = (d - cum[j]) / (cum[j + 1] - cum[j] || 1); X[i] = dense[j][0] + (dense[j + 1][0] - dense[j][0]) * f; Y[i] = dense[j][1] + (dense[j + 1][1] - dense[j][1]) * f;
  }
  let gx = 0, gy = 0; for (const m of M) { gx += m[0] / L; gy += m[1] / L; }
  const c: Curve = { cx: new Float32Array(n), cy: new Float32Array(n), nxv: new Float32Array(n), nyv: new Float32Array(n), W: n, st, hw: Math.round(halfWidthMm / st) };
  const normalAt = (i: number) => { const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1); const tx = X[b] - X[a], ty = Y[b] - Y[a], l = Math.hypot(tx, ty) || 1; return [-ty / l, tx / l]; };
  // normals point away from the arch centre, so the right side of a cross-section is buccal
  const mid = n >> 1, nm = normalAt(mid), sign = (X[mid] - gx) * nm[0] + (Y[mid] - gy) * nm[1] < 0 ? -1 : 1;
  for (let i = 0; i < n; i++) { const [ax, ay] = normalAt(i); c.cx[i] = X[i] / dx; c.cy[i] = Y[i] / dy; c.nxv[i] = (ax * sign * st) / dx; c.nyv[i] = (ay * sign * st) / dy; }
  return c;
}

function column(vol: Vol, x: number, y: number, z0: number, z1: number, acc: Float32Array, max: boolean): boolean {
  const { nx, ny, data } = vol, nxy = nx * ny;
  if (x < 0 || y < 0 || x >= nx - 1 || y >= ny - 1) return false;
  const x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0, w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy, base = y0 * nx + x0, H = z1 - z0 + 1;
  for (let r = 0; r < H; r++) {
    const o = (vol.zUp ? z1 - r : z0 + r) * nxy + base, v = data[o] * w00 + data[o + 1] * w10 + data[o + nx] * w01 + data[o + nx + 1] * w11;
    if (max) { if (v > acc[r]) acc[r] = v; } else acc[r] += v;
  }
  return true;
}

export function reslicePano(vol: Vol, c: Curve, z0: number, z1: number, thickMm: number, mode: 'avg' | 'mip'): Slice {
  const H = z1 - z0 + 1, W = c.W, T = Math.round(thickMm / 2 / c.st), out = new Float32Array(W * H), acc = new Float32Array(H), max = mode === 'mip';
  for (let i = 0; i < W; i++) {
    acc.fill(max ? -Infinity : 0); let n = 0;
    for (let t = -T; t <= T; t++) if (column(vol, c.cx[i] - 0.5 + c.nxv[i] * t, c.cy[i] - 0.5 + c.nyv[i] * t, z0, z1, acc, max)) n++;
    for (let r = 0; r < H; r++) out[r * W + i] = n ? (max ? acc[r] : acc[r] / n) : vol.air;
  }
  return { data: out, w: W, h: H, sx: c.st, sy: vol.dz };
}

export function resliceCross(vol: Vol, c: Curve, s: number, z0: number, z1: number, thickMm: number): Slice {
  const H = z1 - z0 + 1, W = 2 * c.hw + 1, T = Math.round(thickMm / 2 / c.st), out = new Float32Array(W * H), acc = new Float32Array(H);
  // tangent in voxel units is the normal rotated by 90 degrees
  const tx = -c.nyv[s] * (vol.dy / vol.dx), ty = c.nxv[s] * (vol.dx / vol.dy);
  for (let j = 0; j < W; j++) {
    acc.fill(0); let n = 0;
    for (let t = -T; t <= T; t++) if (column(vol, c.cx[s] - 0.5 + c.nxv[s] * (j - c.hw) + tx * t, c.cy[s] - 0.5 + c.nyv[s] * (j - c.hw) + ty * t, z0, z1, acc, false)) n++;
    for (let r = 0; r < H; r++) out[r * W + j] = n ? acc[r] / n : vol.air;
  }
  return { data: out, w: W, h: H, sx: c.st, sy: vol.dz };
}

export function axialSlice(vol: Vol, z: number): Slice {
  const n = vol.nx * vol.ny, out = new Float32Array(n), o = z * n;
  for (let i = 0; i < n; i++) out[i] = vol.data[o + i];
  return { data: out, w: vol.nx, h: vol.ny, sx: vol.dx, sy: vol.dy };
}

// FDI two-digit numbers in chart order, and their Universal (1-32) equivalents.
export const FDI_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
export const FDI_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
export function fdiToUniversal(fdi: number): number {
  const q = (fdi / 10) | 0, t = fdi % 10;
  return q === 1 ? 9 - t : q === 2 ? 8 + t : q === 3 ? 25 - t : 24 + t;
}
