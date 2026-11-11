// End-to-end smoke test: serves the production build, opens each sample, checks pixels are drawn.
import { chromium } from 'playwright-core';
import { preview } from 'vite';
import fs from 'node:fs'; import path from 'node:path';
const server = await preview({ preview: { port: 4179 }, logLevel: 'silent' });
const b = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1500, height: 900 }, acceptDownloads: true });
const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('CON ' + m.text().slice(0, 300)); });
await p.goto('http://localhost:4179/');
const walk = d => fs.readdirSync(d).flatMap(f => { const q = path.join(d, f); return fs.statSync(q).isDirectory() ? walk(q) : [q]; });
// fraction of non-black pixels in a viewport's canvas
const lit = sel => p.evaluate(async s => { const c = document.querySelector(s + ' canvas'); if (!c) return -1; const t = document.createElement('canvas'); t.width = 64; t.height = 64; const x = t.getContext('2d'); x.drawImage(c, 0, 0, 64, 64); const d = x.getImageData(0, 0, 64, 64).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 30) n++; return +(n / 4096).toFixed(2); }, sel);
const results = [];
async function open(label, files, sels) {
  await p.evaluate(() => window.__reset?.());
  await p.setInputFiles('#pick-files', files);
  await p.waitForFunction(() => !document.querySelector('[role=status]'), null, { timeout: 90000 }).catch(() => {});
  await p.waitForTimeout(2500);
  const toast = await p.evaluate(() => document.querySelector('[role=alert]')?.textContent || '');
  const out = {}; for (const s of sels) out[s] = await lit(s);
  results.push({ label, toast, ...out });
  await p.screenshot({ path: `tests/shots/${label}.png` });
}
fs.mkdirSync('tests/shots', { recursive: true });
const V = ['.vp:nth-child(1)', '.vp:nth-child(2)', '.vp:nth-child(3)', '.vp:nth-child(4)'];
await open('cbct-folder', walk('testdata/cbct'), V);
await open('multiframe', walk('testdata/mf'), V);
await open('zip', ['testdata/export.zip'], V);
await open('dicomdir', walk('testdata/dicomdir'), V);
await open('intraoral', walk('testdata/2d'), ['.vp']);
await open('png', ['testdata/gray.png'], ['.vp']);
await open('jpg', ['testdata/color.jpg'], ['.vp']);
for (const f of fs.readdirSync('testdata/codecs')) await open('codec-' + f.replace('.dcm', ''), ['testdata/codecs/' + f], ['.vp']);
await open('tiff16', ['testdata/gray16.tif'], ['.vp']);

// ---- feature checks ----
const checks = [];
const check = (name, ok, info = '') => checks.push({ name, ok: !!ok, info: String(info).slice(0, 70) });
const btn = name => p.getByRole('button', { name, exact: true });
const drag = async (sel, x1, y1, x2, y2) => { const r = await p.locator(sel).first().boundingBox(); await p.mouse.move(r.x + r.width * x1, r.y + r.height * y1); await p.mouse.down(); await p.mouse.move(r.x + r.width * x2, r.y + r.height * y2, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(350); };
const labels = () => p.evaluate(() => [...document.querySelectorAll('.vp svg text')].map(t => t.textContent).join(' | '));
const dl = async fn => { const [d] = await Promise.all([p.waitForEvent('download', { timeout: 20000 }), fn()]); const f = await d.path(); return { name: d.suggestedFilename(), size: fs.statSync(f).size, head: fs.readFileSync(f).subarray(0, 5).toString('latin1') }; };
p.on('dialog', d => d.accept('shënim'));

// 2D: mm on a sensor image, sharpen, compare, measurement survives switching series
await p.evaluate(() => window.__reset()); await p.setInputFiles('#pick-files', ['testdata/2d/io.dcm', 'testdata/2d/io2.dcm']); await p.waitForTimeout(3000);
await btn('Gjatësi').click(); await drag('.vp', 0.4, 0.5, 0.6, 0.5);
const l1 = await labels(); check('2D length in mm on sensor image', /mm/.test(l1), l1);
await btn('Mpreh').click(); await p.waitForTimeout(400); check('sharpen toggles', await btn('Mpreh').getAttribute('aria-pressed') === 'true');
await btn('Krahaso').click(); await p.waitForTimeout(2500);
check('compare shows two images', (await p.locator('.vp').count()) === 2 && (await lit('.vp:nth-child(2)')) > 0);
check('measurement survives layout change', /mm/.test(await labels()), await labels());
let d = await dl(() => p.selectOption('#export', 'png')); check('PNG export', d.head.includes('PNG') && d.size > 5000, `${d.name} ${d.size}`);
d = await dl(() => p.selectOption('#export', 'anon')); check('anonymised ZIP export', d.head.startsWith('PK') && d.size > 200000, `${d.name} ${d.size}`);
await p.selectOption('#export', 'shot'); await p.waitForTimeout(600);

// CBCT: MPR, 3D crop, then the dental workspace
await p.setInputFiles('#pick-files', walk('testdata/jaw'));
await p.waitForTimeout(1500); await p.getByText('Fantom nofulle').click();
await p.waitForFunction(() => !document.querySelector('[role=status]'), null, { timeout: 90000 }); await p.waitForTimeout(3000);
const before3d = await lit('.vp:nth-child(4)');
await p.locator('summary').click(); await p.locator('#clip_x-1').fill('0.3'); await p.waitForTimeout(800);
const after3d = await lit('.vp:nth-child(4)'); check('3D crop reduces rendering', after3d < before3d, `${before3d} -> ${after3d}`);
await p.screenshot({ path: 'tests/shots/mpr-crop.png' });
await btn('Dentare').click(); await p.waitForTimeout(2500);
const ctl = () => p.evaluate(() => { const c = [...document.querySelectorAll('[data-capture] canvas')]; return c.map(x => x.width > 10); });
check('dental panes drawn', (await lit('.vp:nth-child(1)')) > 0.05 && (await lit('.vp:nth-child(2)')) > 0.05 && (await lit('.vp:nth-child(3)')) > 0.05, (await ctl()).join());
await p.screenshot({ path: 'tests/shots/dental-both.png' });
await btn('Maxilla').click(); await p.waitForTimeout(500);
await btn('Kocka G × L').click(); await drag('.vp:nth-child(3)', 0.42, 0.3, 0.58, 0.7);
await btn('Navigo').click(); await btn('16').click(); const pr = await p.locator('.vp:nth-child(1)').boundingBox(); await p.mouse.click(pr.x + pr.width * 0.3, pr.y + pr.height * 0.5); await p.waitForTimeout(400);
check('tooth 16 placed', (await btn('16').getAttribute('class')).includes('7ee081'));
await btn('Universal').click(); check('universal numbering', (await p.locator('[data-teeth] button').first().innerText()) === '1');
await btn('FDI').click();
await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(300);
await p.screenshot({ path: 'tests/shots/dental-max.png' });
await btn('Vizato kurbën').click(); const ar = await p.locator('.vp:nth-child(2)').boundingBox();
for (const [x, y] of [[0.36, 0.75], [0.4, 0.5], [0.45, 0.33], [0.5, 0.27], [0.55, 0.33], [0.6, 0.5], [0.64, 0.75]]) { await p.mouse.click(ar.x + ar.width * x, ar.y + ar.height * y); await p.waitForTimeout(80); }
await p.getByRole('button', { name: /Kryej/ }).click(); await p.waitForTimeout(600);
check('manual curve accepted', (await p.getByRole('button', { name: 'Vizato kurbën' }).count()) === 1 && (await lit('.vp:nth-child(1)')) > 0.05);
await p.screenshot({ path: 'tests/shots/dental-drawn.png' });
await p.selectOption('#export', 'shot'); await p.waitForTimeout(600);
await p.selectOption('#export', 'report'); await p.locator('#r-notes').fill('Kockë e mjaftueshme në regjionin 16.');
check('report lists two views', (await p.locator('figure').count()) === 2);
d = await dl(() => p.locator('#make-pdf').click()); check('PDF report', d.head === '%PDF-' && d.size > 20000, `${d.name} ${d.size}`);
await btn('Mbyll').click(); await btn('MPR + 3D').click(); await p.waitForTimeout(2500);
check('back to MPR without reload error', (await lit('.vp:nth-child(1)')) > 0.05);
console.table(checks);
console.table(results);
console.log([...new Set(errs)].slice(0, 12).join('\n'));
await b.close(); await server.close();
process.exit(checks.some(c => !c.ok) || results.some(r => r.toast.match(/nuk u hap|could not/) || Object.values(r).some(v => v === 0 || v === -1)) ? 1 : 0);
