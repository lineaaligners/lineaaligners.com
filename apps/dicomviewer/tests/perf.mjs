// Load-time check for a clinic-sized CBCT. Usage: node tests/perf.mjs <folder with DICOM slices>
import { chromium } from 'playwright-core'; import { preview } from 'vite'; import fs from 'node:fs'; import path from 'node:path';
const dir = process.argv[2]; if (!dir) { console.error('folder required'); process.exit(2); }
const server = await preview({ preview: { port: 4180 }, logLevel: 'silent' });
const b = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-precise-memory-info'] });
const p = await b.newPage({ viewport: { width: 1500, height: 900 } });
const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
await p.goto('http://localhost:4180/');
const files = fs.readdirSync(dir).map(f => path.join(dir, f));
const t0 = Date.now();
await p.setInputFiles('#pick-folder', dir);
await p.waitForSelector('.vp', { timeout: 300000 }); const tParsed = Date.now();
await p.waitForFunction(() => !document.querySelector('[role=status]'), null, { timeout: 600000 }); const tLoaded = Date.now();
await p.waitForTimeout(3000);
const scroll = await p.evaluate(async () => {
  const vp = window.__cs.cs.getRenderingEngine('main').getViewport('ax'); const t = performance.now(); let n = 0;
  for (let i = 0; i < 60; i++) { vp.scroll(i < 30 ? 1 : -1); vp.render(); await new Promise(r => requestAnimationFrame(r)); n++; }
  return (performance.now() - t) / n;
});
const t1 = Date.now(); await p.getByRole('button', { name: 'Dentare', exact: true }).click();
await p.waitForFunction(() => { const c = document.querySelector('[data-capture] canvas'); return c && c.width > 300; }, null, { timeout: 120000 }); const tDental = Date.now() - t1;
const heap = await p.evaluate(() => Math.round(performance.memory.usedJSHeapSize / 1048576));
console.log(JSON.stringify({ slices: files.length, headersSec: (tParsed - t0) / 1000, volumeSec: (tLoaded - tParsed) / 1000, totalSec: (tLoaded - t0) / 1000, msPerScrolledSlice: +scroll.toFixed(1), dentalOpenSec: tDental / 1000, jsHeapMB: heap, errors: errs }));
await p.screenshot({ path: 'tests/shots/perf-dental.png' });
await b.close(); await server.close();
