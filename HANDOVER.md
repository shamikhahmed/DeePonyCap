# DeePonyCap — Handover

> Read this + `ROADMAP.md` + `~/Capricorn-Brain/01 Projects/DeePonyCap.md` before working here.  
> Last updated: 2026-10-14 · Fleet: `capricorn-tooling/docs/perfection-2026-10/CURSOR-PERFECTION-LOOP.md`

## What this is
Track your collection, shelves and wishlist. Offline PWA by Capricorn Systems. Independent collectible tracker (D-04 — no third-party IP).

## Facts
**Version:** 3.9.6  
**SW cache:** `deeponycap-v64`  
**Live:** https://shamikhahmed.github.io/DeePonyCap/  
**Repo:** https://github.com/shamikhahmed/DeePonyCap  
**Branch (active):** `main` (tag `v3.9.0`)  
**Stack:** Vanilla JS PWA. IndexedDB storage, Playwright e2e.  
**Data:** IndexedDB / localStorage. Local-only, no accounts. Storage key `deeponycap_v2` unchanged.

## Run & verify
```bash
npm install
npm test && npm run verify
npm run serve   # :8770
# Device QA (fleet):
# PW_CORE=…/MasteryCap/node_modules/playwright-core \
# PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright \
# node ../capricorn-tooling/scripts/device-qa.mjs qa/perfection/check \
#   --apps=DeePonyCap --url=DeePonyCap=http://127.0.0.1:8770/?demo=1
```

Perfection state: `qa/perfection/STATE.md`.

## Architecture
- `js/pony-db.js` — user series helpers (no bundled character catalog)
- `js/modules/*` — UI, store, render, navigation, haptics (userActivation-gated)
- `tests/ip-fixture.spec.js` — D-04 IP + user-data integrity
- `privacy.html` — network honesty (same-origin / GitHub Pages only)

## Decisions
- D-04 independent collectible tracker; never modify user-entered names
- Non-affiliation: "DeePonyCap is an independent collection tracker and isn't affiliated with or endorsed by any toy company."
- Audience 13+; no COPPA/child-targeting wording
- DPY-V3-1/2 FIXED on `perfection/deeponycap-v3` (stars ≥16px; vibrate after user activation)
