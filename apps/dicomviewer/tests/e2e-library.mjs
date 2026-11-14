// Phase 1B end-to-end: exports dropped into the inbox become patients with a timeline; mouse buttons are configurable.
import { chromium } from 'playwright-core'; import { preview } from 'vite'; import { spawn } from 'node:child_process'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'medident-lib-')), inbox = path.join(tmp, 'inbox');
fs.cpSync('testdata/jaw', path.join(inbox, 'Sidexis', 'DICOMRM'), { recursive: true }); fs.copyFileSync('testdata/2d/io.dcm', path.join(inbox, 'io.dcm'));
const old = new Date(Date.now() - 60000); for (const f of fs.readdirSync(inbox, { recursive: true })) { const p = path.join(inbox, f); if (fs.statSync(p).isFile()) fs.utimesSync(p, old, old); }
const api = spawn('python3', ['-m', 'uvicorn', 'app.main:app', '--port', '8000', '--log-level', 'warning'], { cwd: 'backend', env: { ...process.env, DATA_DIR: path.join(tmp, 'data'), INBOX_DIR: inbox }, stdio: 'inherit' });
for (let i = 0; i < 60; i++) { try { const r = await (await fetch('http://127.0.0.1:8000/api/library/patients')).json(); if (r.patients.length >= 2) break; } catch { /* starting */ } await new Promise(r => setTimeout(r, 500)); }
const server = await preview({ preview: { port: 4183 }, logLevel: 'silent' });
const b = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message.slice(0, 300))); p.on('console', m => { if (m.type() === 'error' && !/Invalid vr/.test(m.text())) errs.push('CON ' + m.text().slice(0, 300)); });
const checks = []; const check = (name, ok, info = '') => checks.push({ name, ok: !!ok, info: String(info).slice(0, 90) });
const lit = sel => p.evaluate(s => { const c = document.querySelector(s + ' canvas'); if (!c) return -1; const t = document.createElement('canvas'); t.width = t.height = 64; const x = t.getContext('2d'); x.drawImage(c, 0, 0, 64, 64); const d = x.getImageData(0, 0, 64, 64).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 30) n++; return n / 4096; }, sel);
const vp = fn => p.evaluate(f => { const v = __cs.cs.getRenderingEngine('main').getViewport('ax'); return new Function('v', 'return ' + f)(v); }, fn);
const rdrag = async (button, dx, dy) => { const r = await p.locator('.vp').first().boundingBox(); await p.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await p.mouse.down({ button }); await p.mouse.move(r.x + r.width / 2 + dx, r.y + r.height / 2 + dy, { steps: 6 }); await p.mouse.up({ button }); await p.waitForTimeout(400); };
try {
  await p.goto('http://localhost:4183/'); await p.waitForSelector('#library');
  const names = () => p.locator('#library li button').allInnerTexts();
  check('inbox exports listed as patients', (await names()).some(t => /Fantom Dentar/.test(t) && /F1/.test(t)) && (await names()).some(t => /Test Pacient/.test(t)), (await names()).join(' | ').replace(/\n/g, ' '));
  check('inbox emptied, index file set aside', fs.readdirSync(inbox).filter(f => f !== '_ignored').length === 0);
  await p.locator('#lib-q').fill('fantom'); await p.waitForTimeout(700); check('search narrows the list', (await names()).length === 1);
  await p.locator('#library li button').first().click(); await p.waitForSelector('#lib-timeline button');
  check('timeline shows the CBCT with date', /3D/.test(await p.locator('#lib-timeline').innerText()) && /72/.test(await p.locator('#lib-timeline').innerText()), (await p.locator('#lib-timeline').innerText()).replace(/\n/g, ' '));
  await p.locator('#lib-timeline button').first().click();
  await p.waitForSelector('.vp'); await p.waitForFunction(() => !document.querySelector('[role=status]'), null, { timeout: 90000 }); await p.waitForTimeout(3000);
  check('exam opens from the timeline', (await lit('.vp:nth-child(1)')) > 0.1 && (await lit('.vp:nth-child(4)')) > 0.02);
  // mouse: right-drag = contrast by default
  const voi0 = await vp('JSON.stringify(v.getProperties().voiRange)'); await rdrag('right', 80, 40); const voi1 = await vp('JSON.stringify(v.getProperties().voiRange)');
  check('right-drag changes contrast', voi0 !== voi1, `${voi0} -> ${voi1}`);
  const z0 = await vp('v.getZoom()'); const r = await p.locator('.vp').first().boundingBox(); await p.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
  await p.keyboard.down('Control'); await p.mouse.wheel(0, -300); await p.keyboard.up('Control'); await p.waitForTimeout(500); const z1 = await vp('v.getZoom()');
  check('Ctrl + wheel zooms', Math.abs(z1 - z0) > 0.05, `${z0.toFixed(2)} -> ${z1.toFixed(2)}`);
  const s0 = await vp('v.getSliceIndex()'); await p.mouse.wheel(0, 300); await p.waitForTimeout(400); const s1 = await vp('v.getSliceIndex()');
  check('plain wheel changes the slice', s0 !== s1, `${s0} -> ${s1}`);
  await p.locator('summary', { hasText: 'Miu' }).click(); await p.selectOption('#bind-secondary', 'zoom'); await p.locator('summary', { hasText: 'Miu' }).click(); await p.waitForTimeout(400);
  const z2 = await vp('v.getZoom()'), voi2 = await vp('JSON.stringify(v.getProperties().voiRange)'); await rdrag('right', 0, -80);
  const z3 = await vp('v.getZoom()'), voi3 = await vp('JSON.stringify(v.getProperties().voiRange)');
  check('right button can be set to zoom', Math.abs(z3 - z2) > 0.05 && voi3 === voi2, `zoom ${z2.toFixed(2)} -> ${z3.toFixed(2)}; voi same: ${voi3 === voi2}; saved: ${await p.evaluate(() => localStorage.getItem('bindings'))}`);
  // a new export arrives while the page is open
  fs.copyFileSync('testdata/2d/io2.dcm', path.join(inbox, 'new.dcm')); fs.utimesSync(path.join(inbox, 'new.dcm'), old, old);
  await p.locator('#library button', { hasText: 'Pacientët' }).click(); await p.locator('#lib-q').fill('');
  await p.waitForFunction(() => [...document.querySelectorAll('#library li button')].some(b => /Test Pacient/.test(b.innerText) && /2 ekzaminime/.test(b.innerText)), null, { timeout: 20000 }).then(() => check('new export appears on its own', true)).catch(() => check('new export appears on its own', false));
  check('no page errors', errs.length === 0, errs[0] || '');
} catch (e) { check('test run completed', false, e.message); }
console.table(checks); if (errs.length) console.log([...new Set(errs)].slice(0, 5).join('\n'));
await b.close(); await server.close(); api.kill(); fs.rmSync(tmp, { recursive: true, force: true });
process.exit(checks.some(c => !c.ok) ? 1 : 0);
