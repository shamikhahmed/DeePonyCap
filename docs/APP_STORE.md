# DeePonyCap — App Store Readiness

## Demo URL

`https://shamikhahmed.github.io/DeePonyCap/?demo=1`

## Screenshot checklist (iPhone 6.7" / 6.5")

Capture these tabs with demo mode loaded:

| # | Screen | What to show |
|---|--------|----------------|
| 1 | **Stable** | Counter, collection goals, generation pills |
| 2 | **Collection** | Grid with generation emojis (no photos) |
| 3 | **Wishlist** | Must / Want / Someday groups with target prices |
| 4 | **Stats** | Bubble chart + achievements + share card button |
| 5 | **Add Pony sheet** | Form with pony name autocomplete |
| 6 | **Settings** | Parent lock + privacy + offline messaging |

Export at 1290×2796 or use Xcode Simulator → Screenshot.

## App Store copy hooks

- **Subtitle:** Magical pony collection tracker
- **Keywords:** MLP, pony, collection, kids, offline, photos, wishlist
- **Privacy:** No data collected — see `privacy.html`

## Child safety (shipped)

- No accounts or sign-in
- No analytics or third-party SDKs in the kid flow
- No external links inside the main app shell (privacy/changelog are same-origin)
- Optional parent PIN for export / import / delete
- All photos and data stay on device (localStorage + optional IndexedDB)

## Pre-submission

- [x] Playwright smoke tests (`npm test` or `scripts/app-store-preflight.sh`)
- [x] `?demo=1` loads 18 ponies + 7 wishlist items
- [x] Parent PIN for export/delete
- [x] `VERSION.json` + `sw.js` cache synced (`deeponycap-v37`)
- [x] Privacy policy (no third-party tracking claims)
- [x] `assets/icon-1024.png` for App Store
- [x] `ios-templates/PrivacyInfo.xcprivacy` + Info.plist snippet
- [ ] **You:** Install CocoaPods → `npx cap add ios` → Archive in Xcode
- [ ] **You:** Capture screenshots (checklist above)
- [ ] **You:** Create App Store Connect listing (`docs/APP_STORE_CONNECT.md`)
