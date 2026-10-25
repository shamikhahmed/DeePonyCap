# DeePonyCap — screen inventory (from router / nav code)

Source: `index.html` screens, `js/modules/navigation.js`, `js/modules/render-core.js`, `js/modules/ui-core.js`, `js/excellence.js`, `js/modules/onboarding.js`, `js/modules/parent-gate.js`, `js/dialogs.js`, `manifest.json` shortcuts.

## Primary tabs (`Nav.go` · `#nav` · sidebar)

| Id | Label | DOM | Entry |
|---|---|---|---|
| `stable` | Stable | `#tab-stable` | Default / tab / sidebar |
| `logs` | Logs | `#tab-logs` | Tab / sidebar / Stable “Series logs” (`Nav.goLog`) |
| `map` | Map | `#tab-map` | Tab / sidebar / Stable “Pony Map” |
| `wishlist` | Wishlist | `#tab-wishlist` | Tab / sidebar / Stable tools |
| `accessories` | Extras | `#tab-accessories` | Tab / sidebar |

Aliases: `collection` → `logs`, `shelves` → `map` (`Nav.go`). Hidden shells `#tab-collection`, `#tab-shelves` remain but stay `hidden`.

## Secondary screens (no tab chrome)

| Id | DOM / surface | Entry |
|---|---|---|
| `settings` | `#tab-settings` | `.app-settings-btn` → `Nav.go('settings')` |
| `stats` | `#tab-stats` | Stable tools / mobile nudge → `Nav.go('stats')` |
| `stats` / storybook | `#tab-stats` (replaces body) | Stats → Storybook / `?tab=stats&view=storybook` |
| `stats` / timeline | `#tab-stats` | Stats → Timeline / `?view=timeline` |

## Sheets (`#sheet` · `UI.openSheet` / `Render.sheetHdr`)

| Sheet | Opener |
|---|---|
| Add pony | `.app-add-btn`, FAB (CSS-hidden), Stable “+ Add Pony”, `?action=add` |
| Edit pony | Detail / Passport → Edit |
| Pony detail | Log rows / cards (also Excellence passport) |
| Detail photo | Detail gallery thumb |
| Move shelf | Shelf organize / move control |
| Accessory detail | Extras card |
| Parent PIN setup / verify / confirm | Settings Parent Lock; gated export/import/delete |
| CapConfirm / CapPrompt | `#` dialog root in `js/dialogs.js` (not `#sheet`) |

## First-run / chrome overlays

| Surface | Id / class | Notes |
|---|---|---|
| Splash | `#splash` | Skipped / shortened on `?demo=1` |
| Onboarding | `#onboard` · `#ob1`–`#ob3` | First empty profile; Settings → Replay |
| Install hint | `#installHint` | iOS A2HS tip |
| Demo banner | `#demoBanner` | `?demo=1` / DemoSeed |
| Offline banner | `#offlineBanner` | `navigator.onLine` |
| Update card | Settings (`AppUpdate.settingsHtml`) | Waiting SW → user reload |
| Desktop sidebar | `#cap-nav-sidebar` | ≥700px |

## Manifest shortcuts

- `./?action=add` — Add Pony  
- `./?tab=wishlist` — Wishlist  
- `./?tab=stats&view=storybook` — Storybook  

## Audit profiles

1. **Demo** — `?demo=1` (sample · fictional data banner).  
2. **Empty** — fresh origin / cleared storage, skip or complete onboarding, zero ponies.
