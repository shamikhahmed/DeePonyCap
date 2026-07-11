# DeePonyCap — Roadmap

> Updated 2026-07-11. Fleet order & standard: `capricorn-tooling/shared/CAP-STANDARD.md`.

## Now — v3.6.0
Current shipped state. See `CHANGELOG.md` for how we got here.

## Cap Standard gaps
| Cap Standard item | Status |
|---|---|
| Docs pack | ✅ |
| Screen gallery | ✅ |
| Version discipline | ✅ |
| QA / e2e | ✅ |
| CI gate | ❌ |
| PWA polish | ✅ |
| Demo mode | ✅ |

## Next (ordered)
1. CI: add deploy workflow with test gate (copy ScentCap deploy.yml; currently NO workflows — deploys are manual pushes)
2. Add `verify` npm script per Cap Standard contract
3. Write gallery-manifest.json like ScentCap so gallery page is data-driven

## Later
- Collector value estimates
- Export/import collection backup

## Ground rules
- No dirty trees: commit or discard before ending a session.
- CI green before tag; tag `vX.Y.Z` per release.
- Bump SW cache with any asset change (PWA apps).
- Never commit `.env` / secrets.
