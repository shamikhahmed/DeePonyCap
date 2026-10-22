# DeePonyCap — iOS simulator pass (v7 §7.4)

Date: 2026-10-22 · Capacitor/PWA · Safari via simctl openurl

## Devices (one at a time)

| Device | Light | Dark | Larger Text AX3 | VoiceOver (10 controls) |
|---|---|---|---|---|
| iPhone SE (3rd gen) | ✅ | ✅ | ✅ | ✅ spot (a11y tree) |
| iPhone 16 Pro | ✅ | ✅ | ✅ | ✅ spot (a11y tree) |
| iPad Air 11" (M2) | ✅ | ✅ | ✅ | ✅ spot (a11y tree) |

## Evidence (gitignored)

Screenshots: `DeePonyCap/build/qa/v7/sim/*.png` (10 PNGs)
Run log: `DeePonyCap/build/qa/v7/sim/sim-run.jsonl`
Script: `capricorn-tooling/scripts/v7-sim-pass.mjs` + `run-v7-sim-fleet.sh`

## VoiceOver spot-check (honest — live page a11y tree / aria labels)

Native VoiceOver not automated in CI; labels pulled from live demo via Playwright accessibility tree (https://shamikhahmed.github.io/DeePonyCap/?demo=1).

| # | Role | Label |
|---|---|---|
| 1 | `a` | Skip to content |
| 2 | `button` | Settings |
| 3 | `button` | Dismiss demo banner |
| 4 | `button` | 💜 Dawn Line 5 |
| 5 | `button` | 💜 Meadow Line 6 |
| 6 | `button` | 💜 Starlight Line 4 |
| 7 | `button` | 💜 Vintage Line 3 |
| 8 | `button` | Promo 5 |
| 9 | `button` | Series logs |
| 10 | `button` | Pony Map |

## Notes

- Demo URL: `https://shamikhahmed.github.io/DeePonyCap/?demo=1`
- Matrix: 3 devices × light / dark / Larger Text AX3 (`--larger-text`).
- Dynamic Type AX3 via Simulator Accessibility prefs; appearance via `simctl ui`.
