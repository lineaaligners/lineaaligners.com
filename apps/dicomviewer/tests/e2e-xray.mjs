// Phase 3 end-to-end: backend with the fixed-output test detector; suggestions are drawn, accepted, rejected and reported.
import { chromium } from 'playwright-core'; import { preview } from 'vite'; import { spawn, execSync } from 'node:child_process'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'medident-x-'));
execSync(`python3 backend/scripts/make_test_xray_model.py ${path.join(tmp, 'models')}`);
const api = spawn('python3', ['-m', 'uvicorn', 'app.main:app', '--port', '8000', '--log-level', 'warning'], { cwd: 'backend', env: { ...process.env, DATA_DIR: path.join(tmp, 'data'), MODELS_DIR: path.join(tmp, 'models') }, stdio: 'inherit' });
for (let i = 0; i < 60; i++) { try { if ((await fetch('http://127.0.0.1:8000/api/xray/engines')).ok) break; } catch { /* starting */ } await new Promise(r => setTimeout(r, 500)); }
const server = await preview({ preview: { port: 4182 }, logLevel: 'silent' });
const b = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1600, height: 950 }, acceptDownloads: true });
const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message.slice(0, 300))); p.on('console', m => { if (m.type() === 'error' && !/Invalid vr/.test(m.text())) errs.push('CON ' + m.text().slice(0, 300)); });
const checks = []; const check = (name, ok, info = '') => checks.push({ name, ok: !!ok, info: String(info).slice(0, 90) });
const btn = name => p.getByRole('button', { name, exact: true });
try {
  await p.goto('http://localhost:4182/');
  await p.setInputFiles('#pick-files', ['testdata/opg/opg.dcm']); await p.waitForSelector('.vp'); await p.waitForTimeout(2500);
  await btn('AI').click(); await p.waitForSelector('#x-run');
  check('image recognised as panoramic', (await p.locator('#x-view').inputValue()) === 'pano');
  await p.locator('#x-run').click(); await p.waitForSelector('#x-summary', { timeout: 30000 }); await p.waitForTimeout(500);
  check('summary: 8 teeth, 3 findings, rule-based numbers', /^8 .* 3 .*rregull/.test(await p.locator('#x-summary').innerText()), await p.locator('#x-summary').innerText());
  const svg = p.locator('svg[data-xray]');
  check('tooth boxes with FDI numbers', (await svg.locator('text').evaluateAll(n => n.map(x => x.textContent))).filter(t => /^\d\d$/.test(t)).sort().join() === '11,12,13,21,22,23,31,41');
  check('three suggestions drawn dashed', (await svg.locator('g[data-finding] rect[stroke-dasharray]').count()) === 3);
  // the test image is a checkerboard of 40 px squares; the caries box (image x 300-340) must straddle the edge at x = 320
  const edge = await p.evaluate(() => { const r = document.querySelector('svg[data-xray] g[data-finding=caries] rect').getBoundingClientRect(), c = document.querySelector('.vp canvas'), cr = c.getBoundingClientRect(); const t = document.createElement('canvas'); t.width = cr.width; t.height = cr.height; const x = t.getContext('2d'); x.drawImage(c, 0, 0, cr.width, cr.height); const cx = r.left + r.width / 2 - cr.left, cy = r.top + r.height / 2 - cr.top, q = r.width / 4; return [x.getImageData(cx - q, cy, 1, 1).data[0], x.getImageData(cx + q, cy, 1, 1).data[0]]; });
  check('box placed on the right pixels', Math.abs(edge[0] - edge[1]) > 150, edge.join(' | '));
  const items = p.locator('#x-findings li');
  check('findings list with tooth and confidence', /Karies · 12/.test(await items.nth(0).innerText()) && /81%/.test(await items.nth(0).innerText()), (await items.nth(0).innerText()).replace(/\n/g, ' '));
  await items.nth(0).getByRole('button', { name: 'Prano' }).click(); await items.nth(1).getByRole('button', { name: 'Refuzo' }).click(); await p.waitForTimeout(300);
  check('accepted is solid, rejected disappears', (await svg.locator('g[data-finding]').count()) === 2 && (await svg.locator('g[data-finding] rect[stroke-dasharray]').count()) === 1);
  // zoom: boxes follow the image
  const before = await svg.locator('g[data-finding=caries] rect').boundingBox();
  await p.evaluate(() => { const vp = __cs.cs.getRenderingEngine('main').getViewport('stack'); vp.setZoom(2); vp.render(); }); await p.waitForTimeout(500);
  const after = await svg.locator('g[data-finding=caries] rect').boundingBox();
  check('boxes follow zoom', after.width > before.width * 1.3, `${before.width.toFixed(0)} -> ${after.width.toFixed(0)}`);
  await p.screenshot({ path: 'tests/shots/xray.png' });
  await p.selectOption('#export', 'report'); await p.waitForSelector('#r-findings');
  const lines = await p.locator('#r-findings li').allInnerTexts();
  check('only the accepted finding is in the report', lines.length === 1 && /Karies · dhëmbi 12 \(81%\) · OPG test/.test(lines[0]), lines.join(' | '));
  const [d] = await Promise.all([p.waitForEvent('download'), p.locator('#make-pdf').click()]);
  const pdf = fs.readFileSync(await d.path()).toString('latin1');
  check('PDF created with findings section', pdf.startsWith('%PDF-') && pdf.includes('Gjetjet e pranuara'));
  check('no page errors', errs.length === 0, errs[0] || '');
} catch (e) { check('test run completed', false, e.message); }
console.table(checks); if (errs.length) console.log([...new Set(errs)].slice(0, 5).join('\n'));
await b.close(); await server.close(); api.kill(); fs.rmSync(tmp, { recursive: true, force: true });
process.exit(checks.some(c => !c.ok) ? 1 : 0);
