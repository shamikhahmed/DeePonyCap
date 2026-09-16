# DeePonyCap finish-loop LOG

## 2026-09-15 — v3.8.0 Tier 1 product (P0/P1)
IP removal, series model, P1 UX — see APP-REPORT.

## 2026-09-15 — C-14 / C-16
SW cache aligned `deeponycap-v61`→`v62`; self-hosted fonts; `__APP_READY__` after splash.

## 2026-09-15 — §14 #13 TIER1 close (3.8.3)
- Kill-list: DPBrand (`js/brand/colors.js`); CapConfirm/CapPrompt; console.log removed; SINKS.md
- Records: BASELINE · LOG · APP-REPORT · DOCS-INVENTORY · LH stub · finish-matrix spec
- SW `deeponycap-v63` + brand/dialogs precache
- VO remains ⛔ BLOCKED-EXTERNAL — fleet Tier 1 not claimed

## 2026-09-15 — Tier 1 close
- Automated TIER1 PASS at 3.8.3 / deeponycap-v63 (tag v3.8.3).
- CI: https://github.com/shamikhahmed/DeePonyCap/actions/runs/34974097403
- Warn: matrix:shots. VO BLOCKED-EXTERNAL.

## 2026-09-15 — TIER1 PASS close
- CI https://github.com/shamikhahmed/DeePonyCap/actions/runs/34974097403 success
- `npm run tier1` → PASS · tag `v3.8.3` · main `022253c`
- VO ⛔ BLOCKED-EXTERNAL

## 2026-09-16 — C-39
### §15 mini-plan
- Problem: sidebar HOME/LOG collide with labels; emoji in controls; magical ponies copy; USD hardcode.
- Root cause: dual mark+label in sidebar; emoji in button text; toLocaleString \$ only.
- Files: navigation.js, constants.js, render-core.js, ui-core.js, app.css
- Change: label-only sidebar; uiIcon SVG in controls; "N in your collection"; formatEstValue Intl USD.
- Risks: decorative emoji remain with aria-hidden.
- Verification: desktop sidebar readable; control buttons SVG; currency formatted.

### 2026-09-16 C-57 Pages allowlist
- **Problem:** Pages published repo-root internals (HANDOVER/CLAUDE/qa/worker/package.json).
- **Root cause:** deploy copied (nearly) the whole tree.
- **Change:** `scripts/stage-pages-site.sh` + `verify-pages-artifact.cjs`; workflow stages allowlisted paths only.
- **Verification:** local stage dry-run + SW precache check; live curl after deploy.

## 2026-09-16 — Finish Review 3 follow-up (finish/deeponycap-stepR)
- Committed: C-29 tokens.css + CSS var migration; C-31 finish-matrix CI + test:matrix; capture-axe.mjs; screenshot/gallery-manifest refresh; CI-WORKFLOW; skip-allowlist; honest TIER1 FAIL (was stale PASS).
- Left uncommitted: none.
- Not merging (Tier1 FAIL: matrix-results / empty LH / axe / kill:raw-hex=3).
