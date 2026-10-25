# DeePonyCap 4.0.0 — Release report

**Date:** 2026-10-25 · **Branch:** `design/hig-3` · **PR:** [#1](https://github.com/shamikhahmed/DeePonyCap/pull/1)

## Version

| Field | Value |
|---|---|
| App | **4.0.0** |
| SW cache | `deeponycap-v400` |
| Previous tag | `v3.9.13` |
| Coherence | `VERSION.json` · `package.json` · `js/version.js` · `sw.js` fallback — verified equal |

No 4.0.1 bump: release prep did not change shipped app shell after the 4.0.0 line (audit harness exit code + release scripts/docs only).

## Step 1 — Audit leftovers

Non-browser FIXABLE items from `qa/prod-ready/REPORT.md` were already landed on this branch (SW precache, XSS datalist, a11y, manifest colours, privacy/quota). Browser evidence (axe live, ios:check, e2e, offline) is deferred to `qa/release/run-checks.sh`.

## Artifacts

| Path | Role |
|---|---|
| `CHANGELOG.md` | User-facing 4.0.0 + Under the hood |
| `qa/release/RELEASE.md` | Version / PR / rollback (`v3.9.13`) |
| `qa/release/run-checks.sh` | One-command pre-merge gate |
| `qa/release/live-smoke.mjs` | Post-deploy WebKit smoke |
| `qa/release/SUMMARY.md` | Written by run-checks (reviewer) |
| `qa/release/logs/` | Raw step logs (gitignored contents) |

## Reviewer must run

```bash
cd /Users/shamikhahmed/Projects/Cap/Cap-Apps/_workspace/DeePonyCap-hig
bash qa/release/run-checks.sh
# after merge + Pages deploy:
node qa/release/live-smoke.mjs https://shamikhahmed.github.io/DeePonyCap/
```

Paste `qa/release/SUMMARY.md` (or the stdout table) back if any step FAILs for a fix round.

## Commits (this release-prep pass)

- `df531bb` docs(changelog): finalize 4.0.0 user-facing entry
- `9387afb` docs(release): 4.0.0 RELEASE.md and ignore stage/audit artifacts
- `5c91b03` test(release): one-command gate and live-smoke for 4.0.0
- `f774620`+ docs(release): REPORT (+ SHA list amend)
