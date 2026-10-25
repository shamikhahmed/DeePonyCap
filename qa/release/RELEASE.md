# DeePonyCap 4.0.1 — Release

| | |
|---|---|
| **Version** | 4.0.1 |
| **SW cache** | `deeponycap-v401` |
| **Previous** | 4.0.0 / (unreleased on `design/hig-3`) · fleet previous tag `v3.9.13` |
| **Branch** | `design/hig-3` |
| **PR** | [#1](https://github.com/shamikhahmed/DeePonyCap/pull/1) — HIG design + release-gate fixes |
| **Live** | https://shamikhahmed.github.io/DeePonyCap/ |
| **Date** | 2026-10-25 |

## What changed

HIG 4.0.0 plus release-gate fixes: finish-matrix primary Add control, staged CSS no longer 404s via broken cascade `@import`, axe label/contrast fixes. See `CHANGELOG.md` §4.0.1.

## Rollback

Revert the squash commit; previous tag **v3.9.13**.

## Reviewer commands

```bash
# Pre-merge gate (outside sandbox):
bash qa/release/run-checks.sh

# After merge + Pages deploy:
node qa/release/live-smoke.mjs https://shamikhahmed.github.io/DeePonyCap/
```
