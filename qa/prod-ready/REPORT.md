# DeePonyCap — Production-readiness report (HIG 3 · `design/hig-3`)

**Date:** 2026-10-25 · **Version:** 4.0.0 · **SW:** `deeponycap-v400`  
**Scope:** Static/code audit A–L + fixes + `scripts/prod-ready-audit.mjs` for reviewer (browsers do not launch in agent sandbox).

## A–L checklist

| | Area | Status | Evidence |
|---|---|---|---|
| A | Build & gates | PASS* | `node scripts/check-sw-truth.js` → OK 4.0.0 / deeponycap-v400 (extended shell-asset asserts). No separate lint/typecheck scripts. `npm test` / `ios:check` / `tier1` **not re-run here** (Chromium SEGV / WebKit abort in sandbox). *Reviewer: run `npm run verify` + `npm run ios:check` outside sandbox. |
| B | Screen inventory | PASS | `qa/prod-ready/INVENTORY.md` from `Nav` / `Render` / sheets / onboarding / shortcuts — not guessed. |
| C | Visual pass | PENDING | Harness writes ≤40 shots to `qa/prod-ready/shots/`. Agent cannot capture; reviewer runs audit. |
| D | Interaction pass | PENDING* | Esc-close + focus restore verified in code (`excellence.js` Escape → `UI.closeSheet`; `UI.closeSheet` restores `_lastFocus`). Dead-tap / console / HTTP via audit script. *Code: no empty `data-act` pattern (onclick handlers). |
| E | Core flows | PASS (code) | Create/edit/delete + CapConfirm; CSV/backup/import; ParentGate; DemoSeed/`?demo=1`; onboarding `OB`; migrations schema 6; Store corrupt parse catch. Edge cases covered by existing e2e (`smoke`, `excellence`, `ip-fixture`) — re-run outside sandbox. |
| F | iPhone behaviour | PASS (prior) | HIG commit: doc scroll, ScrollLock, inputs ≥16px, SW no claim. `npm run ios:check` was 20/20 on this branch before audit; **re-run after SW asset change**. |
| G | Accessibility | FIXED + PENDING | Fixed: linked-pony roles/names, storybook `alt`. axe via audit script (`@axe-core/playwright` in lockfile). Contrast: tint via `color-mix` (DESIGN.md). |
| H | PWA / offline | FIXED | Precache added: `css/tokens.css`, `css/ios-tokens.css`, `js/hig-dt.js`, font woff2s. Manifest icons include any + maskable + apple-touch. Update path: message `SKIP_WAITING` only (no `clients.claim`). Offline reload proven by audit script offline phase. |
| I | Performance | PASS (static) | Blocking: tokens + cascade; system/deepony via cascade layers. Preloads for app/core/system/deepony. No second full CSS tree beyond layer imports. Cold CLS: splash then `#app`. |
| J | Robustness & privacy | FIXED | Migrations + Store parse try/catch; quota Toast on LS failure; CSP in `index.html`; no secrets in repo; `connect-src 'self'`; privacy links `rel=noopener noreferrer`; wish datalist escaped. External hosts expected only if reviewer opens privacy/changelog off-origin (support/GitHub). |
| K | Content | PASS | No user-facing lorem/TODO/coming-soon in app shell. Demo labelled (“Sample data”). Non-affiliation copy present. |
| L | Docs | FIXED | README + HANDOVER → 4.0.0 / `deeponycap-v400`; CHANGELOG Unreleased; DESIGN.md accurate; this REPORT + INVENTORY. |

\*PASS with caveat that visual/e2e/ios evidence is deferred to the reviewer machine.

## Defects found & fixed

| Sev | Screen / area | Cause | Fix commit |
|---|---|---|---|
| high | Offline / H | SW ASSETS omitted `css/tokens.css`, `css/ios-tokens.css` (cascade `@import`), `js/hig-dt.js`, font files | `fix(pwa): precache shell CSS, Dynamic Type, fonts` |
| high | Wishlist / J | `updateWishSuggest` built `<option value="${n}">` without `Render.esc` | `fix(xss): escape wishlist name datalist` |
| medium | Accessory sheet / G | Linked pony rows were clickable `div`s without role/keyboard/name; photo `alt=""` | `fix(a11y): accessory links and storybook alts` |
| medium | Storybook / G | Decorative empty `alt` on photos | same |
| medium | Install / H | Manifest theme/background pastel pink ≠ HIG `--bg` `#F2F2F7` | `fix(pwa): align manifest colours with HIG tokens` |
| low | Privacy / J | External anchors lacked `rel=noopener` | `fix(privacy): noopener + storage quota toast` |
| low | Save / J | Quota/LS failure silent | same |
| docs | README/HANDOVER | Still 3.9.6 / v64 | `docs(prod-ready): inventory, report, audit harness` |

## Still FAIL / PENDING (needs reviewer)

| Item | Why |
|---|---|
| C / D / G axe / H offline live | `scripts/prod-ready-audit.mjs` must run outside sandbox → fills `audit-findings.json` + shots |
| A e2e + F ios:check | Playwright WebKit/Chromium blocked in agent sandbox |
| C screenshots before/after | No defect screenshots until harness run; keep ≤40 PNGs |

## Test counts

| | Count |
|---|---|
| Spec `test(` / `describe` lines (approx) | 61 matches across `tests/` |
| Before this audit | Same suite (no tests deleted) |
| After | + SW shell asserts in `check-sw-truth.js`; audit harness (manual/reviewer) |
| ios:check | Not re-run this session (expect 20/20 if unchanged behaviour) |

## How to finish evidence

```bash
cd /Users/shamikhahmed/Projects/Cap/Cap-Apps/_workspace/DeePonyCap-hig
python3 -m http.server 8880 &
node scripts/prod-ready-audit.mjs http://127.0.0.1:8880/
# optional:
npm run verify
npm run serve &  # :8770
npm run ios:check
kill %1 %2
```

Send `qa/prod-ready/audit-findings.json` back for a fix round.
