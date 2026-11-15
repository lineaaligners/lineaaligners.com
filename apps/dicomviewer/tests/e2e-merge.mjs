// Two separately exported scans of one patient (lower and upper part, with a gap) open as one volume.
import { chromium } from 'playwright-core'; import { preview } from 'vite'; import fs from 'node:fs';
const server = await preview({ preview: { port: 4185 }, logLevel: 'silent' });
const b = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1500, height: 900 } });
const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message.slice(0, 300)));
const checks = []; const check = (name, ok, info = '') => checks.push({ name, ok: !!ok, info: String(info).slice(0, 90) });
const idle = async () => { await p.waitForFunction(() => !document.querySelector('[role=status]'), null, { timeout: 120000 }); await p.waitForTimeout(2500); };
const lit = sel => p.evaluate(s => { const c = document.querySelector(s + ' canvas'); const t = document.createElement('canvas'); t.width = 200; t.height = 120; const x = t.getContext('2d'); x.drawImage(c, 0, 0, 200, 120); const d = x.getImageData(0, 0, 200, 120).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 60) n++; return n / (d.length / 4); }, sel);
try {
  await p.goto('http://localhost:4185/');
  const all = fs.readdirSync('testdata/jawsplit').map(f => 'testdata/jawsplit/' + f);
  await p.setInputFiles('#pick-files', all); await idle();
  const rows = (await p.locator('aside ul ul > li > button').allInnerTexts()).filter(Boolean);
  check('one joined entry shown, parts tucked away', rows.length === 1 && /Krejt bashkë/.test(rows[0]) && /2 pjesë/.test(rows[0]), rows.join(' | ').replace(/\n/g, ' '));
  check('parts listed under it', (await p.locator('aside details summary').innerText()).includes('(2)'));
  const vol = await p.evaluate(() => { const id = [...__cs.cs.cache._volumeCache.keys()].find(k => k.startsWith('merged:')); const v = __cs.cs.cache.getVolume(id); const d = v.voxelManager.getCompleteScalarDataArray(); const [nx, ny, nz] = v.dimensions; const bright = z => { let n = 0; for (let i = z * nx * ny; i < (z + 1) * nx * ny; i++) if (d[i] > 1000) n++; return n; }; return { dims: v.dimensions, gap: bright(35), low: bright(15), high: bright(56) }; });
  check('joined volume spans both scans with the true gap', vol.dims[2] === 72 && vol.gap === 0 && vol.low > 100 && vol.high > 100, JSON.stringify(vol));
  const m = [await lit('.vp:nth-child(1)'), await lit('.vp:nth-child(2)'), await lit('.vp:nth-child(3)'), await lit('.vp:nth-child(4)')]; await p.screenshot({ path: 'tests/shots/merged-mpr.png' });
  check('MPR and 3D drawn', m[1] > 0.02 && m[2] > 0.02 && m[3] > 0.005, m.map(v => v.toFixed(3)).join(' '));
  await p.getByRole('button', { name: 'Dentare', exact: true }).click(); await p.waitForTimeout(3000);
  // panoramic: teeth of both jaws, i.e. bright columns in the upper and in the lower half
  const halves = await p.evaluate(() => { const c = document.querySelector('.vp:nth-child(1) canvas'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let top = 0, bot = 0; for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x += 3) if (d[(y * c.width + x) * 4] > 150) (y < c.height / 2 ? top++ : bot++); return [top, bot]; });
  check('panoramic shows upper and lower jaw', halves[0] > 500 && halves[1] > 500, halves.join(' / '));
  await p.screenshot({ path: 'tests/shots/merged.png' });
  // a single scan is never joined
  await p.evaluate(() => window.__reset()); await p.setInputFiles('#pick-files', all.filter(f => /\/a/.test(f))); await idle();
  check('one scan alone stays as it is', (await p.locator('aside details').count()) === 0 && /Pjesa A/.test(await p.locator('aside ul ul > li > button').first().innerText()));
  await p.setInputFiles('#pick-files', all.filter(f => /\/b/.test(f))); await idle();
  check('adding the second scan later joins them', /Krejt bashkë/.test(await p.locator('aside ul ul > li > button').first().innerText()) && (await p.locator('aside ul ul > li > button[class*=border-accent]').innerText()).includes('Krejt'));
  check('no page errors', !errs.length, errs.join(' ; '));
} catch (e) { check('test ran', false, e.message); }
console.table(checks); await b.close(); await server.close(); process.exit(checks.every(c => c.ok) ? 0 : 1);
