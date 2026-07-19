# DeePonyCap — Handover

> Read this + `ROADMAP.md` + `~/Capricorn-Brain/01 Projects/DeePonyCap.md` before working here.
> Last updated: 2026-07-11 · Fleet-wide standard: `capricorn-tooling/shared/CAP-STANDARD.md`

## What this is
My Little Pony collection tracker PWA — generation logs, pony map, McDonald's & other brands.

## Facts
**Version:** 3.6.4
**Live:** https://shamikhahmed.github.io/DeePonyCap/
**Repo:** https://github.com/shamikhahmed/DeePonyCap
**Stack:** Vanilla JS PWA. IndexedDB storage, user-controlled updates, Playwright e2e.
**Data:** IndexedDB. Local-only, no accounts.

## Run & verify
```bash
npm install
npm run test:e2e
npm run capture:screenshots   # regen gallery shots
npm run gallery               # capture + serve hint
npm run gallery:view          # http://127.0.0.1:8770/screen-gallery.html
```

## Architecture
- `js/` — app modules; `js/demo-seed.js` — demo data
- `tests/` — Playwright: e2e, demo-unlock, screenshots.spec.js (gallery capture)
- `screen-gallery.html` — browsable gallery (root)
- `sw.js` — user-controlled update flow (update-control e2e guards it)

## Cap Standard status (2026-07-11)
| Cap Standard item | Status |
|---|---|
| Docs pack | ✅ |
| Screen gallery | ✅ |
| Version discipline | ✅ |
| QA / e2e | ✅ |
| CI gate | ❌ |
| PWA polish | ✅ |
| Demo mode | ✅ |

Gaps are tracked as tasks in `ROADMAP.md`.

## Gotchas — read before coding
- Update flow is user-controlled by design (v3.0 decision) — SW must never auto-activate; e2e guards this.
- assets/screenshots is ~20 MB of committed PNGs; regenerate rather than hand-edit.

## Where decisions live
- Dated decisions: Capricorn-Brain project note (path above)
- Release history: `CHANGELOG.md`
- Fleet-level events: `Cap-Apps/docs/CHANGELOG.md` (master)
