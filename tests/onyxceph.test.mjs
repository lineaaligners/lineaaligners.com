// Run: node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateViewerUrl, validatePlanFields, snapshotOf, newToken, hashToken,
  sameHash, TOKEN_RE, rateLimited, onyxConfig, imagePathOk,
} from '../api/_lib/onyxceph.mjs';

const cfg = onyxConfig({}); // defaults = hosts verified from the real export
// Synthetic case: no real patient data
const MODEL = 'https://erm.scarletsystems.com:2011/Client0000/TEST-CASE/00000000000000000000000000000000.iiwgl';
const VALID = `https://www.image-instruments.de/webviewer/index.html?mlink=${MODEL}&fg=fff&bg=000&p=WCSTBC`;

test('accepts the real WebViewer URL shape and canonicalises it', () => {
  const r = validateViewerUrl(VALID, cfg);
  assert.equal(r.ok, true);
  const u = new URL(r.url);
  assert.equal(u.host, 'www.image-instruments.de');
  assert.equal(u.searchParams.get('mlink'), MODEL);
  assert.equal(u.searchParams.get('p'), 'WCSTBC');
});

test('accepts an mlink with an encoded space in the path', () => {
  const r = validateViewerUrl(VALID.replace('TEST-CASE', 'TEST%20CASE'), cfg);
  assert.equal(r.ok, true);
});

test('keeps mlink literal exactly as OnyxCeph exports it (viewer needs it unencoded)', () => {
  const src = VALID.replace('TEST-CASE', 'TEST%20CASE');
  const r = validateViewerUrl(src, cfg);
  assert.equal(r.url, src); // canonical form of a clean export is the export itself
  assert.equal(r.url.includes('%2F'), false);
  assert.equal(r.url.includes('%2520'), false);
});

test('rejects an mlink that would smuggle extra query parameters', () => {
  assert.equal(validateViewerUrl(VALID.replace('.iiwgl', '.iiwgl%26p%3DX'), cfg).ok, false);
});

test('drops unknown / unsafe display parameters', () => {
  const r = validateViewerUrl(VALID + '&evil=<script>&fg=zzz', cfg);
  assert.equal(r.ok, true);
  const u = new URL(r.url);
  assert.equal(u.searchParams.get('evil'), null);
  assert.equal(u.searchParams.get('fg'), 'fff'); // first fg kept, invalid ignored by get()
});

const reject = (label, url, code) => test(`rejects ${label}`, () => {
  const r = validateViewerUrl(url, cfg);
  assert.equal(r.ok, false); if (code) assert.equal(r.error, code);
});
reject('empty input', '', 'url_required');
reject('non-string input', 42, 'url_required');
reject('garbage', 'not a url', 'url_invalid');
reject('http viewer', VALID.replace('https://www.', 'http://www.'), 'https_required');
reject('javascript: scheme', 'javascript:alert(1)', 'https_required');
reject('data: scheme', 'data:text/html,<h1>x</h1>', 'https_required');
reject('file: scheme', 'file:///etc/passwd', 'https_required');
reject('credentials in viewer URL', VALID.replace('https://', 'https://user:pass@'), 'credentials_not_allowed');
reject('unapproved viewer host', VALID.replace('www.image-instruments.de', 'evil.example'), 'viewer_host_not_allowed');
reject('look-alike viewer host', VALID.replace('www.image-instruments.de', 'www.image-instruments.de.evil.example'), 'viewer_host_not_allowed');
reject('other path on viewer host', VALID.replace('/webviewer/index.html', '/download/x.exe'), 'viewer_path_not_allowed');
reject('missing model link', 'https://www.image-instruments.de/webviewer/index.html?fg=fff', 'model_link_missing');
reject('http model link', VALID.replace('mlink=https://', 'mlink=http://'), 'model_https_required');
reject('unapproved model host', VALID.replace('erm.scarletsystems.com:2011', 'attacker.example'), 'model_host_not_allowed');
reject('model host on another port', VALID.replace(':2011', ':8443'), 'model_host_not_allowed');
reject('credentials in model link', VALID.replace('mlink=https://', 'mlink=https://u:p@'), 'credentials_not_allowed');
reject('non-iiwgl model file', VALID.replace('.iiwgl', '.html'), 'model_file_unsupported');
reject('overlong URL', VALID + '&p=' + 'A'.repeat(2100), 'url_too_long');

test('host allowlist comes from environment configuration', () => {
  const custom = onyxConfig({ ONYX_VIEWER_HOSTS: 'viewer.example', ONYX_MODEL_HOSTS: 'models.example' });
  assert.equal(validateViewerUrl(VALID, custom).ok, false);
  const r = validateViewerUrl('https://viewer.example/webviewer/index.html?mlink=https://models.example/a/b.iiwgl', custom);
  assert.equal(r.ok, true);
});

test('plan fields: only the viewer URL is required', () => {
  const r = validatePlanFields({ viewer_url: VALID }, cfg);
  assert.equal(r.ok, true);
  assert.equal(r.plan.total_aligners, null);
});

test('plan fields: valid full record', () => {
  const r = validatePlanFields({ viewer_url: VALID, case_ref: 'C-1', start_date: '2026-10-01', duration_months: '6', total_aligners: '24', change_interval_days: 7, est_completion_date: '2027-04-09', notes: 'ok' }, cfg);
  assert.equal(r.ok, true);
  assert.equal(r.plan.total_aligners, 24);
  assert.equal(r.plan.duration_months, 6);
});

test('plan fields: missing viewer URL', () => {
  const r = validatePlanFields({ total_aligners: 24 }, cfg);
  assert.deepEqual([r.ok, r.field], [false, 'viewer_url']);
});
test('plan fields: completion before start', () => {
  const r = validatePlanFields({ viewer_url: VALID, start_date: '2027-01-01', est_completion_date: '2026-01-01' }, cfg);
  assert.equal(r.error, 'completion_before_start');
});
test('plan fields: impossible date', () => {
  assert.equal(validatePlanFields({ viewer_url: VALID, start_date: '2026-13-45' }, cfg).error, 'invalid_date');
});
test('plan fields: bad numbers', () => {
  assert.equal(validatePlanFields({ viewer_url: VALID, total_aligners: 0 }, cfg).field, 'total_aligners');
  assert.equal(validatePlanFields({ viewer_url: VALID, total_aligners: 2.5 }, cfg).field, 'total_aligners');
  assert.equal(validatePlanFields({ viewer_url: VALID, change_interval_days: -7 }, cfg).field, 'change_interval_days');
  assert.equal(validatePlanFields({ viewer_url: VALID, duration_months: 'abc' }, cfg).field, 'duration_months');
});
test('plan fields: control characters stripped from notes', () => {
  const r = validatePlanFields({ viewer_url: VALID, notes: 'a\u0000b\u0007c' }, cfg);
  assert.equal(r.plan.notes, 'abc');
});

test('patient snapshot never contains internal notes or case reference', () => {
  const s = snapshotOf({ viewer_url: VALID, case_ref: 'INTERNAL', notes: 'private', total_aligners: 24 });
  assert.equal('notes' in s, false);
  assert.equal('case_ref' in s, false);
  assert.equal(s.total_aligners, 24);
});

test('tokens are 43-char base64url, unique, and hashed with SHA-256', () => {
  const seen = new Set();
  for (let i = 0; i < 2000; i++) { const t = newToken(); assert.match(t, TOKEN_RE); seen.add(t); }
  assert.equal(seen.size, 2000);
  const t = newToken();
  assert.match(hashToken(t), /^[0-9a-f]{64}$/);
  assert.equal(hashToken(t), hashToken(t));
  assert.notEqual(hashToken(t), hashToken(newToken()));
  assert.equal(sameHash(hashToken(t), hashToken(t)), true);
  assert.equal(sameHash(hashToken(t), 'ab'), false);
});

test('token format rejects sequential ids and junk', () => {
  for (const bad of ['1', '42', 'a'.repeat(42), 'a'.repeat(44), '../../etc/passwd', 'x'.repeat(40) + '%2F']) assert.equal(TOKEN_RE.test(bad), false);
});

test('rate limiter blocks after the limit within the window', () => {
  const key = 'test-' + Math.random();
  for (let i = 0; i < 5; i++) assert.equal(rateLimited(key, 5, 60000, 1000), false);
  assert.equal(rateLimited(key, 5, 60000, 1000), true);
  assert.equal(rateLimited(key, 5, 60000, 70000), false); // new window
});

test('before/after image paths must belong to the plan and be plain jpgs', () => {
  const id = '0f8b2c1e-1234-4abc-9def-0123456789ab', other = '1f8b2c1e-1234-4abc-9def-0123456789ab';
  assert.equal(imagePathOk(id, `${id}/before-1791545000000.jpg`), true);
  assert.equal(imagePathOk(id, `${id}/after-1791545000000.jpg`), true);
  for (const bad of [`${other}/before-1791545000000.jpg`, `${id}/../x.jpg`, `${id}/before-1791545000000.png`, `${id}/before-1791545000000xjpg`, `${id}/evil-1791545000000.jpg`, ''])
    assert.equal(imagePathOk(id, bad), false, bad);
  assert.equal(imagePathOk('not-a-uuid', 'not-a-uuid/before-1791545000000.jpg'), false);
});

test('patient snapshot carries image paths only when set', () => {
  assert.equal(snapshotOf({ viewer_url: VALID }).before_image, null);
  assert.equal(snapshotOf({ viewer_url: VALID, before_image: 'x', after_image: 'y' }).after_image, 'y');
});
