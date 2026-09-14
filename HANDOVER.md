# DeePonyCap — Handover

> Read this + `ROADMAP.md` + `~/Capricorn-Brain/01 Projects/DeePonyCap.md` before working here.
> Last updated: 2026-09-15 · Fleet finish: Tier 1 v3.8.0

## What this is
Track your collection, shelves and wishlist. Offline PWA by Capricorn Systems.

## Facts
**Version:** 3.8.0
**SW cache:** deeponycap-v60
**Live:** https://shamikhahmed.github.io/DeePonyCap/
**Repo:** https://github.com/shamikhahmed/DeePonyCap
**Stack:** Vanilla JS PWA. IndexedDB storage, Playwright e2e.
**Data:** IndexedDB / localStorage. Local-only, no accounts. Storage key `deeponycap_v2` unchanged.

## Run & verify
```bash
npm install
npm test && npm run verify
npm run serve   # :8770
```

## Architecture
- `js/pony-db.js` — user series helpers (no bundled character catalog)
- `js/modules/*` — UI, store, render, navigation
- `tests/ip-fixture.spec.js` — D-04 IP + user-data integrity
- `releases/` removed (P-PONY-1); history keeps archives

## Decisions
- D-04 independent collectible tracker; never modify user-entered names
- Non-affiliation: "DeePonyCap is an independent collection tracker and isn't affiliated with or endorsed by any toy company."
- Audience 13+; no COPPA/child-targeting wording
