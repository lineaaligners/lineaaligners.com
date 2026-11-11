// Phase 2 end-to-end: starts the Python backend, segments the jaw phantom through the UI and exercises every AI control.
import { chromium } from 'playwright-core'; import { preview } from 'vite'; import { spawn } from 'node:child_process'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'medident-'));
const api = spawn('python3', ['-m', 'uvicorn', 'app.main:app', '--port', '8000', '--log-level', 'warning'], { cwd: 'backend', env: { ...process.env, DATA_DIR: data }, stdio: 'inherit' });
for (let i = 0; i < 60; i++) { try { if ((await fetch('http://127.0.0.1:8000/api/engines')).ok) break; } catch { /* starting */ } await new Promise(r => setTimeout(r, 500)); }
const server = await preview({ preview: { port: 4181 }, logLevel: 'silent' });
const b = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message.slice(0, 300))); p.on('console', m => { if (m.type() === 'error' && !/Invalid vr/.test(m.text())) errs.push('CON ' + m.text().slice(0, 300)); });
const checks = []; const check = (name, ok, info = '') => checks.push({ name, ok: !!ok, info: String(info).slice(0, 80) });
const btn = name => p.getByRole('button', { name, exact: true });
// share of clearly coloured (non-grey) pixels in a viewport: the label overlay
const coloured = sel => p.evaluate(s => { const c = document.querySelector(s + ' canvas'); const t = document.createElement('canvas'); t.width = t.height = 96; const x = t.getContext('2d'); x.drawImage(c, 0, 0, 96, 96); const d = x.getImageData(0, 0, 96, 96).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]) > 40) n++; return +(n / 9216).toFixed(3); }, sel);
const volumeOf = async label => { const row = p.locator('#ai-panel label', { hasText: label }).first(); return (await row.count()) ? parseFloat((await row.innerText()).match(/([\d.]+) cm/)[1]) : 0; };
const voxels = label => p.evaluate(l => { const vm = __cs.cs.cache.getVolume('ai-seg').voxelManager; vm.invalidateCachedScalarExpansion?.(); const a = vm.getCompleteScalarDataArray(); let c = 0; for (let i = 0; i < a.length; i++) if (a[i] === l) c++; return c; }, label);
const clickAt = async (sel, x, y) => { const r = await p.locator(sel).boundingBox(); await p.mouse.click(r.x + r.width * x, r.y + r.height * y); await p.waitForTimeout(400); };
try {
  await p.goto('http://localhost:4181/');
  await p.setInputFiles('#pick-folder', 'testdata/jaw');
  await p.waitForSelector('.vp'); await p.waitForFunction(() => !document.querySelector('[role=status]'), null, { timeout: 90000 }); await p.waitForTimeout(2500);
  await btn('AI').click(); await p.waitForSelector('#ai-run');
  const opts = await p.locator('#ai-engine option').evaluateAll(o => o.map(x => [x.value, x.disabled]));
  check('engines listed, models without weights disabled', opts.length === 4 && opts.find(o => o[0] === 'dentalsegmentator')[1] && !opts.find(o => o[0] === 'classical')[1], JSON.stringify(opts));
  const before = await coloured('.vp:nth-child(1)');
  await p.locator('#ai-run').click();
  await p.waitForSelector('#ai-summary', { timeout: 120000 }); await p.waitForTimeout(1500);
  check('summary shows engine, device and time', /CPU · [\d.]+ s/.test(await p.locator('#ai-summary').innerText()), await p.locator('#ai-summary').innerText());
  await p.locator('#ai-missing button').click(); await p.waitForTimeout(800); // axial view moves to the upper teeth
  const after = await coloured('.vp:nth-child(1)');
  check('labels overlaid on MPR', before < 0.002 && after > 0.01, `${before} -> ${after}`);
  check('jaws listed with volume', (await volumeOf('Maxilla')) > 1 && (await volumeOf('Mandibula')) > 1, `${await volumeOf('Maxilla')} / ${await volumeOf('Mandibula')} cm3`);
  check('missing tooth 16 reported', (await p.locator('#ai-missing').innerText()).trim() === '16', await p.locator('#ai-missing').innerText());
  await p.locator('#ai-panel summary').click();
  check('27 teeth numbered', (await p.locator('#ai-panel details label').count()) === 27, await p.locator('#ai-panel details label').count());
  await p.screenshot({ path: 'tests/shots/ai-mpr.png' });
  // hide everything visible in the axial slice, then show again
  const boxes = p.locator('#ai-panel input[type=checkbox]'); const nBoxes = await boxes.count();
  for (let i = 0; i < nBoxes; i++) await boxes.nth(i).uncheck();
  await p.waitForTimeout(500); const hiddenAll = await coloured('.vp:nth-child(1)'); await p.screenshot({ path: 'tests/shots/ai-hidden.png' });
  for (let i = 0; i < nBoxes; i++) await boxes.nth(i).check();
  await p.waitForTimeout(500); check('visibility toggles', hiddenAll < 0.002 && (await coloured('.vp:nth-child(1)')) > 0.01, `${hiddenAll}`);
  await p.locator('#ai-opacity').fill('0.9'); await p.waitForTimeout(300);
  // brush: paint mandible label into soft tissue; eraser removes it again
  await p.selectOption('#ai-active', '2'); const v0 = await voxels(2);
  await btn('Furça').click(); await p.locator('#ai-brush').fill('6');
  const r = await p.locator('.vp:nth-child(1)').boundingBox();
  const stroke = async () => { await p.mouse.move(r.x + r.width * 0.5, r.y + r.height * 0.72); await p.mouse.down(); await p.mouse.move(r.x + r.width * 0.56, r.y + r.height * 0.74, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(700); };
  await stroke(); await p.screenshot({ path: 'tests/shots/ai-brush.png' });
  const v1 = await voxels(2); check('brush adds to the active structure', v1 > v0, `${v0} -> ${v1}`);
  await btn('Goma').click(); await stroke(); const v2 = await voxels(2); check('eraser removes', v2 < v1, `${v1} -> ${v2}`);
  // region grow a sinus label into the soft tissue
  await p.selectOption('#ai-active', '5'); await btn('Rrit regjionin').click(); await p.locator('#ai-tol').fill('100');
  await clickAt('.vp:nth-child(1)', 0.5, 0.8); check('region grow fills similar tissue', (await volumeOf('Sinusi maksilar majtas')) > 0.5, `${await volumeOf('Sinusi maksilar majtas')} cm3`);
  // canal: three points on the axial view become a tube
  await p.selectOption('#ai-active', '3'); await btn('Rregullo kanalin').click();
  for (const [x, y] of [[0.42, 0.6], [0.45, 0.5], [0.5, 0.45]]) await clickAt('.vp:nth-child(1)', x, y);
  await p.locator('#ai-canal-done').click(); await p.waitForTimeout(500);
  const canal = await volumeOf('Kanali mandibular majtas'); check('canal drawn as a tube', canal > 0.02 && canal < 1, `${canal} cm3`);
  // renumber a tooth
  await p.selectOption('#ai-from', '17'); await p.selectOption('#ai-to', '18'); await btn('OK').click(); await p.waitForTimeout(500);
  const teeth = await p.locator('#ai-panel details label').allInnerTexts(); check('tooth renumbered 17 -> 18', teeth.some(t => /18/.test(t.split('\n')[0])) && !teeth.some(t => /Dhëmbi 17/.test(t)));
  await p.locator('#ai-save').click(); await p.waitForTimeout(1500); check('corrections saved', await p.locator('#ai-save').isDisabled());
  const job = fs.readdirSync(path.join(data, 'jobs'))[0];
  check('edited labels stored for retraining', fs.existsSync(path.join(data, 'jobs', job, 'labels.nii.gz')) && fs.existsSync(path.join(data, 'jobs', job, 'image.nii.gz')));
  await btn('Modelet').click(); await p.waitForSelector('[data-mesh] canvas'); await p.waitForTimeout(6000);
  const lit = await p.evaluate(() => { const c = document.querySelector('[data-mesh] canvas'); const t = document.createElement('canvas'); t.width = t.height = 64; const x = t.getContext('2d'); x.drawImage(c, 0, 0, 64, 64); const d = x.getImageData(0, 0, 64, 64).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 120) n++; return n / 4096; });
  check('3D surface models rendered', lit > 0.03, lit.toFixed(3));
  await p.screenshot({ path: 'tests/shots/ai-mesh.png' });
  const stl = await fetch(`http://127.0.0.1:8000/api/jobs/${job}/mesh/2.stl`); check('STL export', stl.ok && (await stl.arrayBuffer()).byteLength > 10000);
  await btn('Dentare').click(); await p.waitForTimeout(2000); await btn('MPR + 3D').click(); await p.waitForTimeout(3000);
  check('no page errors', errs.length === 0, errs[0] || '');
} catch (e) { check('test run completed', false, e.message); await p.screenshot({ path: 'tests/shots/ai-fail.png' }).catch(() => {}); }
console.table(checks); if (errs.length) console.log([...new Set(errs)].slice(0, 6).join('\n'));
await b.close(); await server.close(); api.kill(); fs.rmSync(data, { recursive: true, force: true });
process.exit(checks.some(c => !c.ok) ? 1 : 0);
