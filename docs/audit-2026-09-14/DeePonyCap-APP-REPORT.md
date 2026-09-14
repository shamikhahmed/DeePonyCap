# DeePonyCap — Tier 1 App Report

**Released:** 2026-09-15 · **v3.8.0** / SW `deeponycap-v60` · branch `finish/deeponycap`

| Field | Value |
|-------|--------|
| Status | Tier 1 (P0/P1 complete) |
| Live | https://shamikhahmed.github.io/DeePonyCap/ |
| CI | `npm test` / `npm run verify` — **37 passed, 1 skipped** (local) |
| Live SW | prove after deploy: `deeponycap-v60` |
| Score (baseline → after) | 44 → ~86 |

## P0 / P1 register

| ID | Severity | What was wrong | What was done | Status |
|----|----------|----------------|---------------|--------|
| PONY-P0-01 | P0 | Bundled My Little Pony / Hasbro / official character catalog (D-04) | Removed `PONY_DB` character lists; user-defined `series` + `seriesList`; demo invents names (Clover Gleam, Midnight Bloom, Sunny Pebble…); migration v6 adds `series` only — never rewrites user names; fixture test | ✅ |
| PONY-P1-01 | P1 | Overlay demo banner hid titles | Inline sample banner inside `#main` | ✅ |
| PONY-P1-02 | P1 | ON/OFF text pills | `cap-switch` 51×31 visual + `role="switch"` | ✅ |
| PONY-P1-03 | P1 | Pink page behind dark cards | Dark theme forces `--bg`/`--bg-card`; accent apply skips pastel bg in dark | ✅ |
| PONY-P1-04 | P1 | FAB on Settings / over tab bar | FAB only Stable + Wishlist; offset above tab + safe area; `[hidden]` | ✅ |
| PONY-P1-05 | P1 | Tiny tab labels | SVG tabs kept; labels **11px** | ✅ |
| PONY-P1-06 | P1 | US date format | `formatLocaleDate` via `Intl.DateTimeFormat` | ✅ |
| PONY-P1-07 | P1 | `releases/` tree (P-PONY-1) | Removed from working tree; `.gitignore` | ✅ |
| PONY-P1-08 | P1 | COPPA / child targeting; missing disclaimer | 13+ privacy copy; §4.2 non-affiliation in About + privacy | ✅ |

## Decisions applied
D-04, P-PONY-1, G-2 (Pro modal removed), G-4 (§4.1 description + §4.2 disclaimer), G-7, G-8 (3.8.0 + SW).

## Verify
- `npm test` — 37 passed, 1 skipped
- New: `tests/ip-fixture.spec.js` (grep-clean shell, invented demo names, user name preserved, About line, switches + FAB)
- Version: `VERSION.json` / `APP_VERSION` / SW — **3.8.0** / `deeponycap-v60`

## Remaining / gaps
- **PONY-P2** token migration (117 hex, 55 font sizes) — deferred (optional for Tier 1 close)
- Physical VoiceOver / TalkBack: ⛔ BLOCKED-EXTERNAL
- Gallery regen optional (screenshots may still show older chrome until next gallery run)
- Hub/catalog sync fully closed when website Step 16 runs; products-data + lab copy updated for IP

## Release log
- Branch `finish/deeponycap` from `origin/main`
- Tag `v3.8.0` (after merge)
- Hub: `shamikhahmed.github.io/js/products-data.js` + `capricorn-lab` product copy updated
