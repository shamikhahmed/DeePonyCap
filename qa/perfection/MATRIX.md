# DeePonyCap — Perfection v3 MATRIX
Updated: 2026-10-14 · Builder-DeePonyCap · §15.2 core **100%**

**§15.2 v3 core matrix contract:** S-STABLE demo (`?demo=1`, light) × device-qa 7-pack + gallery v3 primary (dark × iphone/ipad/mac). Logs/Map/Wishlist secondary routes → L ITEMS (not counted).

Columns: theme × device × engine. Legend: ✅ evidence path · N/A reason

Evidence root: `qa/perfection/baseline/` (before) · `qa/perfection/device/` (after). PNG local-only; JSON committed.

## S-STABLE / demo default (light)

| Cell | Status | Evidence |
|---|---|---|
| light×iPhone SE 375×webkit | ✅ | `device/DeePonyCap-webkit-iphone-se.png` + device-qa.json |
| light×iPhone 390×webkit | ✅ | `device/DeePonyCap-webkit-iphone.png` |
| light×iPad port 820×webkit | ✅ | `device/DeePonyCap-webkit-ipad-portrait.png` |
| light×iPad land 1180×webkit | ✅ | `device/DeePonyCap-webkit-ipad-landscape.png` |
| light×MacBook 1440×webkit | ✅ | `device/DeePonyCap-webkit-macbook.png` |
| light×MacBook 1440×chromium | ✅ | `device/DeePonyCap-chromium-macbook.png` (post-fix: 0 vibrate) |
| light×Android 412×chromium | ✅ | `device/DeePonyCap-chromium-android.png` (post-fix: 0 vibrate) |
| dark×iPhone 390×* | ✅ | `docs/screenshots/gallery/dark/iphone/*` (v3 Wave G) |
| dark×iPad 1180×* | ✅ | `docs/screenshots/gallery/dark/ipad/*` |
| dark×MacBook 1440×* | ✅ | `docs/screenshots/gallery/dark/mac/*` |
| light×gallery v3 primary | ✅ | `docs/screenshots/gallery/gallery-manifest.json` (24 shots) |
| wide 1920×* | N/A | §15.2 core — mac 1440 + gallery mac cover desktop break |

## N/A (justified · counted)
| Item | Reason |
|---|---|
| Chromium per gallery cell | device-qa exercises Chromium on home |
| iPhone SE / iPad-P gallery duplicates | §9.1 |

## L ITEMS (out of §15.2 core)
| Item | Tracker |
|---|---|
| Logs / Map / Wishlist / Extras / Stats / Settings × empty/demo/dark/reduce-motion full grid | DPC-V3-L |

## Hard-gate summary (Stable demo, local `/DeePonyCap/?demo=1`)

| Metric | Baseline | Post-fix |
|---|---|---|
| hard failures | **0 / 7** | **0 / 7** |
| overflowX | false | false |
| tap&lt;32px | 0 | 0 |
| text&lt;11px | 0 | 0 |
| page errors | 0 | 0 |
| hub-console / vibrate | 4 (2×2 Chromium) | **0** |

## Coverage rollup (§15.2 core)
| Bucket | ✅ | N/A | ⏳ |
|---|---:|---:|---:|
| Device-qa home (7) | 7 | 0 | 0 |
| Gallery primary rows | 4 | 0 | 0 |
| wide 1920 | 0 | 1 | 0 |
| Justified N/A | 0 | 2 | 0 |
| **Matrix %** | | | **100%** |
