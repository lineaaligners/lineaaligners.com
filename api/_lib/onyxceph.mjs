// OnyxCeph WebViewer integration helpers (server side only).
//
// Verified 2026-10-09 against a real export from this clinic:
//   https://www.image-instruments.de/webviewer/index.html
//     ?mlink=https://erm.scarletsystems.com:2011/<client>/<case>/<guid>.iiwgl
//     &fg=fff&bg=000&p=WCSTBC
// - The page renders the 3D plan with step animation inside an <iframe> on
//   lineaaligners.com (no X-Frame-Options / frame-ancestors block observed).
// - No password or session was required to open it.
// - The model file (.iiwgl) is fetched by the viewer straight from the
//   clinic's export server; whoever has the full URL can load the model.
// Nothing here fetches the URL from the server (no SSRF surface): we only
// parse, check against allowlists, and rebuild a canonical URL.

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const DEFAULT_VIEWER_HOSTS = 'www.image-instruments.de';
const DEFAULT_VIEWER_PATHS = '/webviewer/index.html';
const DEFAULT_MODEL_HOSTS = 'erm.scarletsystems.com:2011';
export const MAX_URL_LENGTH = 2048;

const list = (v, d) =>
  String(v ?? d).split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

export function onyxConfig(env = process.env) {
  return {
    viewerHosts: list(env.ONYX_VIEWER_HOSTS, DEFAULT_VIEWER_HOSTS),
    viewerPaths: list(env.ONYX_VIEWER_PATHS, DEFAULT_VIEWER_PATHS),
    modelHosts: list(env.ONYX_MODEL_HOSTS, DEFAULT_MODEL_HOSTS),
  };
}

// host[:port] exactly as the URL addresses it; default ports omitted
const hostKey = u => (u.port ? `${u.hostname}:${u.port}` : u.hostname).toLowerCase();

/**
 * Validate an OnyxCeph WebViewer URL and return a canonical version that
 * only carries parameters we understand. Returns { ok:true, url } or
 * { ok:false, error } with a short, non-sensitive error code.
 */
export function validateViewerUrl(input, cfg = onyxConfig()) {
  if (typeof input !== 'string') return { ok: false, error: 'url_required' };
  const raw = input.trim();
  if (!raw) return { ok: false, error: 'url_required' };
  if (raw.length > MAX_URL_LENGTH) return { ok: false, error: 'url_too_long' };

  let u;
  try { u = new URL(raw); } catch { return { ok: false, error: 'url_invalid' }; }
  if (u.protocol !== 'https:') return { ok: false, error: 'https_required' };
  if (u.username || u.password) return { ok: false, error: 'credentials_not_allowed' };
  if (!cfg.viewerHosts.includes(hostKey(u))) return { ok: false, error: 'viewer_host_not_allowed' };
  if (!cfg.viewerPaths.includes(u.pathname.toLowerCase())) return { ok: false, error: 'viewer_path_not_allowed' };

  const mlinkRaw = u.searchParams.get('mlink');
  if (!mlinkRaw) return { ok: false, error: 'model_link_missing' };
  let m;
  try { m = new URL(mlinkRaw); } catch { return { ok: false, error: 'model_link_invalid' }; }
  if (m.protocol !== 'https:') return { ok: false, error: 'model_https_required' };
  if (m.username || m.password) return { ok: false, error: 'credentials_not_allowed' };
  if (!cfg.modelHosts.includes(hostKey(m))) return { ok: false, error: 'model_host_not_allowed' };
  if (!/\.iiwgl$/i.test(m.pathname)) return { ok: false, error: 'model_file_unsupported' };
  if (m.search || m.hash) return { ok: false, error: 'model_link_invalid' };

  // Rebuild with known display parameters only; anything else is dropped.
  // The OnyxCeph viewer reads `mlink` literally (as OnyxCeph exports it), so
  // it must NOT be percent-encoded again — that broke model loading.
  // m.href is already normalised by URL(); it may not contain characters
  // that would split or alter the outer query string.
  if (/[&#?+\s"'<>\\]/.test(m.href)) return { ok: false, error: 'model_link_invalid' };
  const parts = [`mlink=${m.href}`];
  const fg = u.searchParams.get('fg'), bg = u.searchParams.get('bg'), p = u.searchParams.get('p');
  if (fg && /^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(fg)) parts.push(`fg=${fg}`);
  if (bg && /^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(bg)) parts.push(`bg=${bg}`);
  if (p && /^[A-Za-z]{1,16}$/.test(p)) parts.push(`p=${p}`);
  const url = `https://${hostKey(u)}${u.pathname}?${parts.join('&')}`;
  if (url.length > MAX_URL_LENGTH) return { ok: false, error: 'url_too_long' };
  return { ok: true, url };
}

// ---- access tokens -------------------------------------------------------
// 32 random bytes -> 43-char base64url string. Only the SHA-256 is stored.
export const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
export function newToken() { return randomBytes(32).toString('base64url'); }
export function hashToken(token) { return createHash('sha256').update(token, 'utf8').digest('hex'); }
export function sameHash(a, b) {
  const x = Buffer.from(String(a), 'hex'), y = Buffer.from(String(b), 'hex');
  return x.length === y.length && x.length > 0 && timingSafeEqual(x, y);
}

// ---- plan field validation ----------------------------------------------
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isDate = s => DATE_RE.test(s) && !Number.isNaN(Date.parse(s + 'T00:00:00Z'));
const cleanText = (s, max) => {
  if (s == null || s === '') return null;
  const t = String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
  return t ? t.slice(0, max) : null;
};

/** Validate and normalise editable plan metadata. Returns { ok, plan } or { ok:false, error, field }. */
export function validatePlanFields(body, cfg = onyxConfig()) {
  const v = validateViewerUrl(body?.viewer_url, cfg);
  if (!v.ok) return { ok: false, error: v.error, field: 'viewer_url' };
  const plan = { viewer_url: v.url, case_ref: cleanText(body.case_ref, 120), notes: cleanText(body.notes, 4000) };

  const num = (k, min, max, int) => {
    const x = body[k];
    if (x == null || x === '') { plan[k] = null; return true; }
    const n = Number(x);
    if (!Number.isFinite(n) || n < min || n > max || (int && !Number.isInteger(n))) return false;
    plan[k] = n; return true;
  };
  if (!num('duration_months', 0.5, 60, false)) return { ok: false, error: 'invalid_number', field: 'duration_months' };
  if (!num('total_aligners', 1, 200, true)) return { ok: false, error: 'invalid_number', field: 'total_aligners' };
  if (!num('change_interval_days', 1, 60, true)) return { ok: false, error: 'invalid_number', field: 'change_interval_days' };

  for (const k of ['start_date', 'est_completion_date']) {
    const x = body[k];
    if (x == null || x === '') { plan[k] = null; continue; }
    if (!isDate(String(x))) return { ok: false, error: 'invalid_date', field: k };
    plan[k] = String(x);
  }
  if (plan.start_date && plan.est_completion_date && plan.est_completion_date <= plan.start_date)
    return { ok: false, error: 'completion_before_start', field: 'est_completion_date' };
  return { ok: true, plan };
}

// What the patient is allowed to see (internal notes / case ref excluded).
export function snapshotOf(p) {
  return {
    viewer_url: p.viewer_url,
    start_date: p.start_date ?? null,
    duration_months: p.duration_months ?? null,
    total_aligners: p.total_aligners ?? null,
    change_interval_days: p.change_interval_days ?? null,
    est_completion_date: p.est_completion_date ?? null,
  };
}

// ---- tiny best-effort rate limiter (per serverless instance) -------------
const buckets = new Map();
export function rateLimited(key, limit = 30, windowMs = 60_000, now = Date.now()) {
  const b = buckets.get(key);
  if (!b || now - b.start > windowMs) { buckets.set(key, { start: now, n: 1 }); return false; }
  b.n += 1;
  if (buckets.size > 5000) buckets.clear();
  return b.n > limit;
}

export function clientIp(req) {
  const f = String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
  return f || String(req.headers?.['x-real-ip'] || 'unknown');
}
