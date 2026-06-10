# DeePonyCap — App Store / TestFlight Prep

## Current state
- **Shipped as PWA** on GitHub Pages (Add to Home Screen).
- **Capacitor scaffold (planned):** wrap static build in `@capacitor/core` iOS shell.

## Capacitor plan
1. `npm init` + `@capacitor/cli` in repo root (webDir: `.`)
2. `npx cap add ios` — copy `index.html` entry, icons from `icon-512.png`
3. Configure `Info.plist`: `NSPhotoLibraryUsageDescription` if photos (DeePonyCap)
4. Disable third-party cookies; keep localStorage/IndexedDB

## TestFlight checklist
- [ ] App icons 1024×1024 from `icon-512.png`
- [ ] Privacy nutrition labels: **Data Not Collected** (local-only)
- [ ] Screenshots: iPhone 6.7" + 6.1"
- [ ] Review notes: offline PWA, no account required
- [ ] Export compliance: no encryption beyond standard iOS APIs

## Disclaimers (MLP collection tracker)
- Fan collection tool; not affiliated with Hasbro or MLP brand owners.

## Version
See `VERSION.json` — current `2.2.0`.

## Phase 4 scaffold (June 2026)

- [x] `capacitor.config.json` — appId configured
- [x] `package.json` — `@capacitor/core`, `@capacitor/ios`, `@capacitor/cli`
- [x] Scripts: `npm run cap:sync`, `npm run cap:ios`
- [x] `icon-1024.png` for App Store Connect (from `icon-512.png` upscale or generate-icons)
- [ ] `npx cap add ios` — run after Xcode installed (`npm run cap:init`)
- [ ] TestFlight upload — requires Apple Developer account

### Xcode setup (when ready)

```bash
npm install
npm run cap:init    # cap add ios + sync (first time)
npm run cap:ios     # open Xcode
```

**You do NOT need Swift Playgrounds** — use **Xcode.app** from the Mac App Store for Capacitor iOS builds.

### Privacy policy URL
Use hosted: `https://shamikhahmed.github.io/<AppName>/privacy.html`
