// Screenshot of a view: flattens every canvas and SVG overlay inside `root` into one image.
export async function captureView(root: HTMLElement): Promise<HTMLCanvasElement> {
  const R = root.getBoundingClientRect(), k = window.devicePixelRatio || 1;
  const out = document.createElement('canvas'); out.width = Math.round(R.width * k); out.height = Math.round(R.height * k);
  const ctx = out.getContext('2d')!; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, out.width, out.height);
  for (const el of root.querySelectorAll<HTMLCanvasElement | SVGSVGElement>('canvas, svg')) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const x = (r.left - R.left) * k, y = (r.top - R.top) * k, w = r.width * k, h = r.height * k;
    if (el instanceof HTMLCanvasElement) { ctx.drawImage(el, x, y, w, h); continue; }
    const clone = el.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); clone.setAttribute('width', String(r.width)); clone.setAttribute('height', String(r.height));
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }));
    try { const img = new Image(); img.src = url; await img.decode(); ctx.drawImage(img, x, y, w, h); } catch { /* overlay could not be rasterised; keep the image */ } finally { URL.revokeObjectURL(url); }
  }
  return out;
}
export function download(blob: Blob, name: string) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
export const captureRoot = () => document.querySelector<HTMLElement>('[data-capture]');
