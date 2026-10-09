# OnyxCeph treatment plans — passwordless patient links

## What was verified (9 Oct 2026, with a real export from this clinic)
| Question | Result |
|---|---|
| Viewer | `https://www.image-instruments.de/webviewer/index.html?mlink=<model>&fg=…&bg=…&p=…` |
| Model file | `.iiwgl` on the clinic's export server `erm.scarletsystems.com:2011` |
| Password / login needed? | **No** — opened with no prompt |
| Embeddable in an iframe on lineaaligners.com? | **Yes** — 3D model, 13-step animation and controls all worked |
| Expiry | Not observed. Unknown whether OnyxCeph removes exports — Linea links expire independently |

Not yet verified: the final acceptance test (publish → open the Linea link in a private window
on a phone). Do that once with a real plan before sending links to patients.

## How it works
1. Admin → patient → **Orthodontic Treatment Plan → Import from OnyxCeph**.
2. Paste the WebViewer link from OnyxCeph Web Export, press **Check it loads**, fill in what you know.
3. **Save & publish** → copy the link (`https://lineaaligners.com/patient/#…`) → send it.
4. Patient taps the link → Linea page, "Mirë se erdhe, {emri}!", summary + embedded 3D plan. No login.

Edit → plan becomes "Unpublished changes" (patient still sees the old version) → **Republish**.
**Revoke access** kills the link instantly. **New patient link** replaces it (old one stops working).
**History** lists every published version and every action.

## Security model (read this)
- The link is a bearer link: anyone who has it can see that one plan. It is 256-bit random,
  stored only as a SHA-256 hash, expires after ~18 months, and can be revoked.
- The token sits after `#`, so browsers never send it to any server or log; the page posts it
  to `/api/patient-plan`, which answers with the same generic 404 for unknown/revoked/expired.
- Patient pages: `noindex`, `no-store`, `no-referrer`, CSP that only allows the OnyxCeph viewer in frames.
- **OnyxCeph's own URL is not secret-protected**: anyone who obtains the raw WebViewer/model URL
  can load the model, independently of Linea. Revoking a Linea link does not delete the OnyxCeph
  export — remove it in OnyxCeph if needed. The raw URL is necessarily present in the patient's
  browser (iframe source).
- **Name cases with a code in OnyxCeph** (e.g. `LIN-0123`), not the patient's name: the case name is
  shown inside the viewer and is part of the model address.
- Rate limiting is per serverless instance (best effort). For stronger limits add a Vercel Firewall rule on `/api/patient-plan`.
- Not a compliance claim (GDPR etc.) — review with your DPO.

## Configuration (Vercel env)
`APP_URL`, `ONYX_VIEWER_HOSTS`, `ONYX_VIEWER_PATHS`, `ONYX_MODEL_HOSTS` (exact `host[:port]`, comma-separated),
`SUPABASE_SERVICE_ROLE_KEY` (server only). If OnyxCeph exports start coming from another server, add
its host to `ONYX_MODEL_HOSTS` — links from unlisted hosts are refused.

## Database
`supabase/migrations/20261009_treatment_plans.sql` (additive; already applied):
`treatment_plans` (one per patient), `plan_access` (token hashes, max one active per plan),
`plan_versions` (immutable published snapshots), `plan_audit`. Admin read via RLS; writes only via the API.

## Tests
`node --experimental-strip-types --experimental-test-module-mocks --test tests/*.test.mjs` (needs `@supabase/supabase-js` installed).
Covers URL validation (schemes, hosts, ports, credentials, length), field validation, token
generation/hashing, rate limiting, and the patient endpoint (valid / revoked / expired / draft /
unknown / malformed, cross-patient isolation, no leaked fields, no-store headers, GET refused).
Mocks do not prove the real viewer works — that was checked manually in a browser (above).
