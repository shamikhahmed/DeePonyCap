# DeePonyCap 4.0.0 — Release

| | |
|---|---|
| **Version** | 4.0.0 |
| **SW cache** | `deeponycap-v400` |
| **Previous** | 3.9.13 / tag `v3.9.13` |
| **Branch** | `design/hig-3` |
| **PR** | [#1](https://github.com/shamikhahmed/DeePonyCap/pull/1) — HIG design (ScentCap 3.0 system) + iPhone fixes + prod-ready audit |
| **Live** | https://shamikhahmed.github.io/DeePonyCap/ |
| **Date** | 2026-10-25 |

## What changed

User-facing redesign to the Cap HIG system: floating glass tab bar, Add + Settings top-right, Cancel/Title/Save sheets, accent tint on controls only, document scrolling and sheet scroll lock on iPhone, and a more complete offline shell. Production-readiness fixes (wishlist XSS escape, linked-pony a11y, storybook alts, manifest colours, quota toast, privacy `noopener`).

## Rollback

Revert the squash commit; previous tag **v3.9.13**.

## Reviewer commands

```bash
# Pre-merge gate (outside sandbox):
bash qa/release/run-checks.sh

# After merge + Pages deploy:
node qa/release/live-smoke.mjs https://shamikhahmed.github.io/DeePonyCap/
```
