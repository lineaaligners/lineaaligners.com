// Dental workspace: axial slice with the arch curve, panoramic reconstruction and cross-sections.
// Imperative canvas code; the React component only hosts the canvases and the side panel.
import { axialSlice, buildCurve, fdiToUniversal, findJaws, fitArch, percentile, reslicePano, resliceCross, type Curve, type Pt, type Slice, type Vol } from './pano';

export type DTool = 'nav' | 'len' | 'box' | 'wl';
export type Jaw = 'both' | 'max' | 'man';
type Kind = 'ax' | 'pan' | 'xs';
interface Measure { type: 'len' | 'box'; a: Pt; b: Pt; key: string }
const COL = { ax: '#5cc8ff', pan: '#c9a7ff', xs: '#ff8fa3', measure: '#ffd166', tooth: '#7ee081' };
const dpr = () => window.devicePixelRatio || 1;

class Pane {
  zoom = 1; panX = 0; panY = 0; base = 1; img: Slice | null = null; key = ''; title = ''; hover = '';
  measures: Measure[] = []; draft: Measure | null = null;
  private ctx: CanvasRenderingContext2D; private off = document.createElement('canvas');
  constructor(public canvas: HTMLCanvasElement, public kind: Kind, private host: Dental) { this.ctx = canvas.getContext('2d')!; this.bind(); }

  matrix(): DOMMatrix {
    const g = this.img!, cw = this.canvas.width, ch = this.canvas.height;
    this.base = Math.min(cw / (g.w * g.sx), ch / (g.h * g.sy)) * 0.96;
    return new DOMMatrix().translate(cw / 2 + this.panX, ch / 2 + this.panY).scale(this.base * this.zoom).scale(g.sx, g.sy).translate(-g.w / 2, -g.h / 2);
  }
  toImage(ev: { clientX: number; clientY: number }): Pt {
    const r = this.canvas.getBoundingClientRect(), k = dpr();
    const p = this.matrix().inverse().transformPoint(new DOMPoint((ev.clientX - r.left) * k, (ev.clientY - r.top) * k));
    return { x: p.x, y: p.y };
  }
  /** image units covered by `px` screen pixels, for hit testing */
  reach(px: number) { return (px * dpr()) / (this.base * this.zoom * this.img!.sx); }

  draw() {
    const g = this.img; if (!g) return;
    const r = this.canvas.getBoundingClientRect(), k = dpr(), w = Math.max(2, Math.round(r.width * k)), h = Math.max(2, Math.round(r.height * k));
    if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; }
    if (this.off.width !== g.w || this.off.height !== g.h) { this.off.width = g.w; this.off.height = g.h; }
    const octx = this.off.getContext('2d')!, id = octx.createImageData(g.w, g.h), out = new Uint32Array(id.data.buffer);
    const { c, w: ww } = this.host.win, lo = c - ww / 2, f = 255 / ww, inv = this.host.invert;
    for (let i = 0; i < out.length; i++) { let v = (g.data[i] - lo) * f; v = v < 0 ? 0 : v > 255 ? 255 : v | 0; if (inv) v = 255 - v; out[i] = 0xff000000 | (v << 16) | (v << 8) | v; }
    octx.putImageData(id, 0, 0);
    const ctx = this.ctx, M = this.matrix();
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
    ctx.setTransform(M); ctx.imageSmoothingEnabled = this.base * this.zoom * g.sx < 4; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(this.off, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const P = (x: number, y: number) => M.transformPoint(new DOMPoint(x, y));
    ctx.font = `${12 * k}px ui-monospace, Menlo, monospace`; ctx.textBaseline = 'middle';
    this.host.overlay(this, ctx, P, k);
    for (const m of this.draft ? [...this.measures, this.draft] : this.measures) {
      if (m.key !== this.key) continue;
      const a = P(m.a.x, m.a.y), b = P(m.b.x, m.b.y), wmm = Math.abs(m.b.x - m.a.x) * g.sx, hmm = Math.abs(m.b.y - m.a.y) * g.sy;
      ctx.strokeStyle = ctx.fillStyle = COL.measure; ctx.lineWidth = 1.5 * k; let label: string;
      if (m.type === 'len') { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); for (const q of [a, b]) { ctx.beginPath(); ctx.arc(q.x, q.y, 3 * k, 0, 6.3); ctx.fill(); } label = `${Math.hypot(wmm, hmm).toFixed(2)} mm`; }
      else { ctx.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y)); label = `${this.host.labels.width} ${wmm.toFixed(1)} × ${this.host.labels.height} ${hmm.toFixed(1)} mm`; }
      const tx = Math.max(a.x, b.x) + 8 * k, ty = m.type === 'len' ? b.y : Math.min(a.y, b.y) - 12 * k, tw = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(0,0,0,.72)'; ctx.fillRect(tx, ty - 10 * k, tw + 10 * k, 20 * k); ctx.fillStyle = COL.measure; ctx.fillText(label, tx + 5 * k, ty);
    }
    // 10 mm ruler with 1 mm ticks
    const pxmm = this.base * this.zoom, mm = pxmm * 10 > w * 0.5 ? 1 : 10, L = pxmm * mm, x0 = 14 * k, y0 = h - 14 * k;
    ctx.strokeStyle = ctx.fillStyle = '#e8edf0'; ctx.lineWidth = 1.5 * k; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + L, y0);
    for (let i = 0; i <= 10; i++) { const x = x0 + (L * i) / 10; ctx.moveTo(x, y0); ctx.lineTo(x, y0 - (i % 5 ? 3 : 6) * k); }
    ctx.stroke(); ctx.fillText(`${mm} mm`, x0 + L + 6 * k, y0 - 3 * k);
    ctx.fillStyle = COL[this.kind]; ctx.fillText(this.title, 10 * k, 14 * k);
    if (this.hover) { ctx.fillStyle = '#8a9aa3'; ctx.fillText(this.hover, w - ctx.measureText(this.hover).width - 10 * k, 14 * k); }
  }

  private bind() {
    const cv = this.canvas, host = this.host;
    cv.addEventListener('contextmenu', e => e.preventDefault());
    cv.addEventListener('wheel', e => {
      if (!this.img) return; e.preventDefault();
      if (!e.ctrlKey && !e.metaKey) { host.wheel(this, e.deltaY > 0 ? -1 : 1); return; }
      const r = cv.getBoundingClientRect(), k = dpr(), px = (e.clientX - r.left) * k - cv.width / 2, py = (e.clientY - r.top) * k - cv.height / 2;
      const z = Math.max(0.3, Math.min(40, this.zoom * Math.exp(-e.deltaY * 0.004))), q = z / this.zoom;
      this.panX = px - q * (px - this.panX); this.panY = py - q * (py - this.panY); this.zoom = z; this.draw();
    }, { passive: false });
    cv.addEventListener('pointerdown', e => {
      if (!this.img) return; cv.setPointerCapture(e.pointerId);
      const tool = e.button === 1 ? 'pan' : e.button === 2 ? 'wl' : host.tool, sx = e.clientX, sy = e.clientY;
      const w0 = { ...host.win }, p0 = { x: this.panX, y: this.panY };
      if (tool === 'nav') host.press(this, this.toImage(e));
      if (tool === 'len' || tool === 'box') this.draft = { type: tool, a: this.toImage(e), b: this.toImage(e), key: this.key };
      const move = (ev: PointerEvent) => {
        const dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (tool === 'wl') { const f = host.range / 700; host.win = { c: w0.c + dy * f, w: Math.max(1, w0.w + dx * f) }; host.redraw(); }
        else if (tool === 'pan') { this.panX = p0.x + dx * dpr(); this.panY = p0.y + dy * dpr(); this.draw(); }
        else if (tool === 'nav') host.dragTo(this, this.toImage(ev));
        else if (this.draft) { this.draft.b = this.toImage(ev); this.draw(); }
      };
      const up = () => {
        cv.removeEventListener('pointermove', move); cv.removeEventListener('pointerup', up); cv.removeEventListener('pointercancel', up);
        if (this.draft) { const { a, b } = this.draft; if (Math.hypot(a.x - b.x, a.y - b.y) > 1) this.measures.push(this.draft); this.draft = null; this.draw(); }
        host.release();
      };
      cv.addEventListener('pointermove', move); cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    });
    cv.addEventListener('pointermove', e => {
      if (!this.img || e.buttons) return;
      const p = this.toImage(e), x = Math.floor(p.x), y = Math.floor(p.y), g = this.img;
      const h = x >= 0 && y >= 0 && x < g.w && y < g.h ? `${host.labels.value} ${Math.round(g.data[y * g.w + x])}` : '';
      if (h !== this.hover) { this.hover = h; this.draw(); }
    });
    cv.addEventListener('pointerleave', () => { if (this.hover) { this.hover = ''; this.draw(); } });
    cv.addEventListener('dblclick', () => host.finishDrawing());
  }
}

export class Dental {
  tool: DTool = 'nav'; win: { c: number; w: number }; auto: { c: number; w: number }; range: number; invert = false;
  z: number; jaw: Jaw = 'both'; split: number; thick = 10; mode: 'avg' | 'mip' = 'avg'; step = 1; xsThick = 1;
  pts: Record<'both' | 'lo' | 'hi', Pt[]>; curve!: Curve; s = -1; ver = 0;
  teeth: Record<number, { mm: number; z: number }> = {}; placing: number | null = null; numbering: 'fdi' | 'uni' = 'fdi';
  drawing: Pt[] | null = null; labels = { value: 'vlera', width: 'G', height: 'L', axial: 'Aksial', pano: 'Panoramik', cross: 'Prerja', lingual: 'L', buccal: 'B' };
  onChange: () => void = () => undefined;
  private panes: Record<Kind, Pane>; private dirtyCurve = true; private dirtyPano = true; private pano!: Slice; private dragPt = -1; private zUp0: boolean;

  constructor(public vol: Vol, canvases: Record<Kind, HTMLCanvasElement>) {
    const lo = percentile(vol.data, 0.02), hi = percentile(vol.data, 0.9995);
    this.auto = { c: (lo + hi) / 2, w: Math.max(1, hi - lo) }; this.win = { ...this.auto }; this.range = Math.max(1, hi - lo);
    const j = findJaws(vol); this.split = j.split; this.z = vol.zUp ? Math.round((j.split + j.zB) / 2) : Math.round((j.zA + j.split) / 2); this.zUp0 = vol.zUp;
    this.pts = { both: fitArch(vol, j.zA, j.zB, j.thr), lo: fitArch(vol, j.zA, j.split, j.thr), hi: fitArch(vol, j.split, j.zB, j.thr) };
    this.panes = { ax: new Pane(canvases.ax, 'ax', this), pan: new Pane(canvases.pan, 'pan', this), xs: new Pane(canvases.xs, 'xs', this) };
    this.refresh();
  }
  get flipped() { return this.vol.zUp !== this.zUp0; }
  key(): 'both' | 'lo' | 'hi' { return this.jaw === 'both' ? 'both' : (this.jaw === 'max') === this.vol.zUp ? 'hi' : 'lo'; }
  zRange(): [number, number] { const k = this.key(); return k === 'both' ? [0, this.vol.nz - 1] : k === 'lo' ? [0, this.split] : [this.split, this.vol.nz - 1]; }
  private row(z: number) { const [z0, z1] = this.zRange(); return this.vol.zUp ? z1 - z : z - z0; }
  private zOf(r: number) { const [z0, z1] = this.zRange(); return Math.max(z0, Math.min(z1, Math.floor(this.vol.zUp ? z1 - r + 1 : z0 + r))); }
  get posMm() { return this.s * this.curve.st; }
  get lengthMm() { return (this.curve.W - 1) * this.curve.st; }
  toothLabel(fdi: number) { return this.numbering === 'fdi' ? fdi : fdiToUniversal(fdi); }

  refresh() {
    const [z0, z1] = this.zRange(), P = this.panes;
    if (this.dirtyCurve) {
      this.curve = buildCurve(this.vol, this.pts[this.key()]); this.s = this.s < 0 ? this.curve.W >> 1 : Math.min(this.curve.W - 1, this.s);
      this.ver++; this.dirtyCurve = false; this.dirtyPano = true; P.pan.measures = []; P.xs.measures = [];
    }
    if (this.dirtyPano) { this.pano = reslicePano(this.vol, this.curve, z0, z1, this.thick, this.mode); this.dirtyPano = false; }
    P.ax.img = axialSlice(this.vol, this.z); P.ax.key = `z${this.z}`; P.ax.title = `${this.labels.axial} ${this.z + 1}/${this.vol.nz}`;
    P.pan.img = this.pano; P.pan.key = `v${this.ver}`; P.pan.title = this.labels.pano;
    P.xs.img = resliceCross(this.vol, this.curve, this.s, z0, z1, this.xsThick); P.xs.key = `v${this.ver}s${this.s}`; P.xs.title = `${this.labels.cross} ${this.posMm.toFixed(1)} / ${this.lengthMm.toFixed(0)} mm`;
    this.redraw(); this.onChange();
  }
  redraw() { for (const p of Object.values(this.panes)) p.draw(); }
  private touchCurve() { this.dirtyCurve = true; this.refresh(); }
  private touchPano() { this.dirtyPano = true; this.refresh(); }

  // ---- settings ----
  setJaw(j: Jaw) { this.jaw = j; if (j !== 'both') { const [z0, z1] = this.zRange(); this.z = Math.round(z0 + (z1 - z0) * (this.key() === 'hi' ? 0.3 : 0.7)); } this.touchCurve(); }
  setSplitHere() { this.split = Math.max(1, Math.min(this.vol.nz - 2, this.z)); this.touchCurve(); }
  setThick(mm: number) { this.thick = mm; this.touchPano(); }
  setMode(m: 'avg' | 'mip') { this.mode = m; this.touchPano(); }
  setStep(mm: number) { this.step = mm; this.onChange(); }
  setXsThick(mm: number) { this.xsThick = mm; this.refresh(); }
  setWindow(c: number, w: number) { this.win = { c, w }; this.redraw(); }
  toggleInvert() { this.invert = !this.invert; this.redraw(); }
  flipZ() { this.vol.zUp = !this.vol.zUp; this.touchCurve(); }
  autoCurve() { const j = findJaws(this.vol), k = this.key(); this.pts[k] = fitArch(this.vol, k === 'hi' ? this.split : j.zA, k === 'lo' ? this.split : j.zB, j.thr); this.drawing = null; this.touchCurve(); }
  startDrawing() { this.drawing = []; this.tool = 'nav'; this.redraw(); this.onChange(); }
  finishDrawing() {
    if (!this.drawing) return;
    if (this.drawing.length >= 3) { const d = this.drawing; if (d[0].x > d[d.length - 1].x) d.reverse(); this.pts[this.key()] = d; this.drawing = null; this.touchCurve(); }
    else { this.drawing = null; this.refresh(); }
  }
  clearMeasures() { for (const p of Object.values(this.panes)) p.measures = []; this.redraw(); }
  resetView() { for (const p of Object.values(this.panes)) { p.zoom = 1; p.panX = p.panY = 0; } this.win = { ...this.auto }; this.invert = false; this.redraw(); }
  move(steps: number) { const n = Math.max(1, Math.round(this.step / this.curve.st)); this.s = Math.max(0, Math.min(this.curve.W - 1, this.s + steps * n)); this.refresh(); }
  // ---- teeth ----
  pickTooth(fdi: number) {
    const t = this.teeth[fdi];
    if (t && this.placing !== fdi) { this.s = Math.max(0, Math.min(this.curve.W - 1, Math.round(t.mm / this.curve.st))); const [z0, z1] = this.zRange(); if (t.z >= z0 && t.z <= z1) this.z = t.z; this.placing = null; this.refresh(); }
    else { this.placing = this.placing === fdi ? null : fdi; this.onChange(); }
  }
  removeTooth(fdi: number) { delete this.teeth[fdi]; this.placing = null; this.refresh(); }

  // ---- pointer handling from panes ----
  press(p: Pane, pt: Pt) {
    if (p.kind === 'ax') {
      if (this.drawing) { if (this.drawing.length < 10) this.drawing.push(pt); this.redraw(); this.onChange(); return; }
      const reach = p.reach(10); this.dragPt = this.pts[this.key()].findIndex(q => Math.hypot(q.x - pt.x, q.y - pt.y) < reach);
    } else if (p.kind === 'pan' && this.placing != null) { this.teeth[this.placing] = { mm: Math.max(0, Math.min(this.curve.W - 1, pt.x)) * this.curve.st, z: this.zOf(pt.y) }; this.placing = null; this.s = Math.max(0, Math.min(this.curve.W - 1, Math.floor(pt.x))); this.refresh(); return; }
    this.dragTo(p, pt);
  }
  dragTo(p: Pane, pt: Pt) {
    if (this.drawing) return;
    const c = this.curve;
    if (p.kind === 'ax') {
      if (this.dragPt >= 0) { this.pts[this.key()][this.dragPt] = { x: Math.max(1, Math.min(this.vol.nx - 1, pt.x)), y: Math.max(1, Math.min(this.vol.ny - 1, pt.y)) }; this.touchCurve(); return; }
      let best = 0, bd = Infinity; for (let i = 0; i < c.W; i++) { const d = (c.cx[i] - pt.x) ** 2 + (c.cy[i] - pt.y) ** 2; if (d < bd) { bd = d; best = i; } }
      this.s = best;
    } else { this.z = this.zOf(pt.y); if (p.kind === 'pan') this.s = Math.max(0, Math.min(c.W - 1, Math.floor(pt.x))); }
    this.refresh();
  }
  release() { this.dragPt = -1; }
  wheel(p: Pane, d: number) { if (p.kind === 'ax') { this.z = Math.max(0, Math.min(this.vol.nz - 1, this.z + d)); this.refresh(); } else this.move(d); }

  overlay(p: Pane, ctx: CanvasRenderingContext2D, P: (x: number, y: number) => DOMPoint, k: number) {
    const c = this.curve, g = p.img!, [z0, z1] = this.zRange();
    const line = (x1: number, y1: number, x2: number, y2: number, col: string, wd = 1) => { const a = P(x1, y1), b = P(x2, y2); ctx.strokeStyle = col; ctx.lineWidth = wd * k; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); };
    const dot = (x: number, y: number, col: string) => { const q = P(x, y); ctx.beginPath(); ctx.arc(q.x, q.y, 5 * k, 0, 6.3); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = k; ctx.stroke(); };
    const zLine = () => { if (this.z >= z0 && this.z <= z1) { ctx.globalAlpha = 0.7; const r = this.row(this.z) + 0.5; line(0, r, g.w, r, COL.ax); ctx.globalAlpha = 1; } };
    if (p.kind === 'ax') {
      if (this.drawing) { ctx.strokeStyle = COL.pan; ctx.lineWidth = 1.5 * k; ctx.setLineDash([6 * k, 4 * k]); ctx.beginPath(); this.drawing.forEach((q, i) => { const a = P(q.x, q.y); if (i) ctx.lineTo(a.x, a.y); else ctx.moveTo(a.x, a.y); }); ctx.stroke(); ctx.setLineDash([]); for (const q of this.drawing) dot(q.x, q.y, COL.pan); return; }
      ctx.globalAlpha = 0.9; ctx.strokeStyle = COL.pan; ctx.lineWidth = 1.5 * k; ctx.beginPath();
      for (let i = 0; i < c.W; i++) { const q = P(c.cx[i], c.cy[i]); if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); }
      ctx.stroke(); const s = this.s; line(c.cx[s] - c.nxv[s] * c.hw, c.cy[s] - c.nyv[s] * c.hw, c.cx[s] + c.nxv[s] * c.hw, c.cy[s] + c.nyv[s] * c.hw, COL.xs, 2); ctx.globalAlpha = 1;
      for (const q of this.pts[this.key()]) dot(q.x, q.y, COL.pan);
    } else if (p.kind === 'pan') {
      zLine(); ctx.globalAlpha = 0.8; line(this.s + 0.5, 0, this.s + 0.5, g.h, COL.xs); ctx.globalAlpha = 1;
      for (const [fdi, t] of Object.entries(this.teeth)) {
        if (t.z < z0 || t.z > z1) continue;
        const q = P(t.mm / c.st, this.row(t.z) + 0.5), label = String(this.toothLabel(+fdi)), tw = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(q.x - tw / 2 - 4 * k, q.y - 9 * k, tw + 8 * k, 18 * k); ctx.fillStyle = COL.tooth; ctx.fillText(label, q.x - tw / 2, q.y);
      }
    } else {
      zLine(); ctx.globalAlpha = 0.35; line(c.hw + 0.5, 0, c.hw + 0.5, g.h, COL.pan); ctx.globalAlpha = 1;
      ctx.fillStyle = '#e8edf0'; ctx.fillText(this.labels.lingual, 10 * k, 36 * k); ctx.fillText(this.labels.buccal, p.canvas.width - 20 * k, 36 * k);
    }
  }
}
