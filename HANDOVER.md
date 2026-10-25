# DeePonyCap — Handover

> Read this + `ROADMAP.md` + `~/Capricorn-Brain/01 Projects/DeePonyCap.md` before working here.  
> Last updated: 2026-10-25 · Branch: `design/hig-3`

## What this is
Track your collection, shelves and wishlist. Offline PWA by Capricorn Systems. Independent collectible tracker (D-04 — no third-party IP).

## Facts
**Version:** 4.0.0  
**SW cache:** `deeponycap-v400`  
**Live:** https://shamikhahmed.github.io/DeePonyCap/  
**Repo:** https://github.com/shamikhahmed/DeePonyCap  
**Branch (active):** `design/hig-3` (HIG 3 design + iPhone behaviour)  
**Stack:** Vanilla JS PWA. IndexedDB storage, Playwright e2e.  
**Data:** IndexedDB / localStorage. Local-only, no accounts. Storage key `deeponycap_v2` unchanged.  
**Design:** `DESIGN.md` — ScentCap 3.0 tokens/primitives; accent = user theme; tint via `color-mix` for AA.

## Run & verify
```bash
npm install   # only if node_modules missing; worktree may symlink
npm test && npm run verify
npm run serve   # :8770
npm run ios:check   # WebKit; needs serve
# Prod-ready (outside sandbox):
python3 -m http.server 8880
node scripts/prod-ready-audit.mjs http://127.0.0.1:8880/
```

Perfection state: `qa/perfection/STATE.md`. Prod-ready: `qa/prod-ready/REPORT.md`.

## Architecture
- `css/design/*` + `css/cascade.css` — HIG tokens / system / DeePony reskin; 3.x CSS in `@layer legacy`
- `js/pony-db.js` — user series helpers (no bundled character catalog)
- `js/modules/*` — UI, store, render, navigation, haptics (userActivation-gated)
- `js/scroll-lock.js` — sheet body lock + restore
- `tests/ip-fixture.spec.js` — D-04 IP + user-data integrity
- `privacy.html` — network honesty (same-origin / GitHub Pages only)

## Decisions
- D-04 independent collectible tracker; never modify user-entered names
- Non-affiliation: "DeePonyCap is an independent collection tracker and isn't affiliated with or endorsed by any toy company."
- Audience 13+; no COPPA/child-targeting wording
- HIG: document scroll (no inner `.main` scroller); FAB hidden; Add/Settings top-right; SW no `clients.claim`
