// Run: node --experimental-strip-types --experimental-test-module-mocks --test tests/*.test.mjs
import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { hashToken, newToken } from '../api/_lib/onyxceph.mjs';

// ---- in-memory fake of the three tables the endpoint reads (synthetic data)
const VIEWER = 'https://www.image-instruments.de/webviewer/index.html?mlink=https%3A%2F%2Ferm.scarletsystems.com%3A2011%2FC%2FT%2F0.iiwgl';
const tok = { ok: newToken(), revoked: newToken(), expired: newToken(), unpublished: newToken(), other: newToken() };
const day = 86400000;
const db = {
  plan_access: [
    { id: 'a1', plan_id: 'p1', token_hash: hashToken(tok.ok), expires_at: new Date(Date.now() + day).toISOString(), revoked_at: null },
    { id: 'a2', plan_id: 'p1', token_hash: hashToken(tok.revoked), expires_at: null, revoked_at: new Date().toISOString() },
    { id: 'a3', plan_id: 'p1', token_hash: hashToken(tok.expired), expires_at: new Date(Date.now() - day).toISOString(), revoked_at: null },
    { id: 'a4', plan_id: 'p2', token_hash: hashToken(tok.unpublished), expires_at: null, revoked_at: null },
    { id: 'a5', plan_id: 'p3', token_hash: hashToken(tok.other), expires_at: null, revoked_at: null },
  ],
  treatment_plans: [
    { id: 'p1', patient_id: 'pat1', status: 'published', published_at: '2026-10-09T10:00:00Z', notes: 'INTERNAL NOTE', case_ref: 'CASE-1',
      published_snapshot: { viewer_url: VIEWER, total_aligners: 24, duration_months: 6, change_interval_days: 7, start_date: '2026-10-01', est_completion_date: '2027-04-09' } },
    { id: 'p2', patient_id: 'pat1', status: 'draft', published_snapshot: null },
    { id: 'p3', patient_id: 'pat2', status: 'published', published_at: '2026-10-09T10:00:00Z', published_snapshot: { viewer_url: VIEWER, total_aligners: 10 } },
  ],
  patients: [
    { id: 'pat1', first_name: 'Erdo', current_aligner: 1, next_change_date: '2026-10-16', doctor: 'Dr. Test', phone: '+38300000000', email: 'x@y.z' },
    { id: 'pat2', first_name: 'Other', current_aligner: 5, next_change_date: null, doctor: null },
  ],
};
function from(table) {
  const filters = [];
  const q = {
    select() { return q; },
    eq(k, v) { filters.push(r => r[k] === v); return q; },
    update() { return { eq: () => Promise.resolve({ error: null }) }; },
    maybeSingle() { const row = db[table].find(r => filters.every(f => f(r))); return Promise.resolve({ data: row ? { ...row } : null }); },
  };
  return q;
}
mock.module('@supabase/supabase-js', { namedExports: { createClient: () => ({ from }) } });
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only';
const { default: handler } = await import('../api/patient-plan.ts');

function call(body, method = 'POST', ip = '10.0.0.' + Math.floor(Math.random() * 250)) {
  return new Promise(resolve => {
    const res = { headers: {}, statusCode: 200,
      setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
      status(c) { this.statusCode = c; return this; },
      json(b) { resolve({ status: this.statusCode, body: b, headers: this.headers }); return this; } };
    handler({ method, body, headers: { 'x-forwarded-for': ip }, query: {} }, res);
  });
}

test('valid link returns the right plan, passwordless', async () => {
  const r = await call({ token: tok.ok });
  assert.equal(r.status, 200);
  assert.equal(r.body.first_name, 'Erdo');
  assert.equal(r.body.total_aligners, 24);
  assert.equal(r.body.current_aligner, 1);
  assert.equal(r.body.progress_pct, 4); // 1 / 24 aligners, not calendar time
  assert.equal(r.body.viewer_url, VIEWER);
});

test('response carries no internal notes, ids, case ref or contact data', async () => {
  const r = await call({ token: tok.ok });
  const s = JSON.stringify(r.body);
  for (const leak of ['INTERNAL NOTE', 'CASE-1', 'pat1', 'p1', '+38300000000', 'x@y.z', 'token_hash']) assert.equal(s.includes(leak), false, leak);
});

test('sensitive responses are not cached or indexed', async () => {
  const r = await call({ token: tok.ok });
  assert.match(r.headers['cache-control'], /no-store/);
  assert.match(r.headers['x-robots-tag'], /noindex/);
  assert.equal(r.headers['referrer-policy'], 'no-referrer');
});

for (const [label, body] of [
  ['revoked link', { token: tok.revoked }],
  ['expired link', { token: tok.expired }],
  ['unpublished draft', { token: tok.unpublished }],
  ['unknown token', { token: newToken() }],
  ['malformed token', { token: '12345' }],
  ['missing token', {}],
]) test(`${label} gets the same generic 404`, async () => {
  const r = await call(body);
  assert.equal(r.status, 404);
  assert.deepEqual(r.body, { error: 'unavailable' });
});

test('a link only ever opens its own patient', async () => {
  const a = await call({ token: tok.ok }), b = await call({ token: tok.other });
  assert.equal(a.body.first_name, 'Erdo');
  assert.equal(b.body.first_name, 'Other');
  assert.equal(b.body.progress_pct, 50);
});

test('missing data is reported as missing, not invented', async () => {
  const r = await call({ token: tok.other });
  assert.equal(r.body.duration_months, null);
  assert.equal(r.body.est_completion_date, null);
  assert.equal(r.body.next_change_date, null);
  assert.equal(r.body.doctor, null);
});

test('GET is refused (token must not travel in a URL)', async () => {
  assert.equal((await call({ token: tok.ok }, 'GET')).status, 405);
});

test('rate limiting kicks in on rapid guessing from one address', async () => {
  let last;
  for (let i = 0; i < 35; i++) last = await call({ token: newToken() }, 'POST', '10.9.9.9');
  assert.equal(last.status, 429);
});
