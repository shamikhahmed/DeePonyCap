# Changelog — DeePonyCap

## 3.0.0 (2026-06-26) — Major release

DeePonyCap 3.0 is the production-ready PWA for private pony collectors: generation logs, pony map, McDonald's & other brands, personalization, IndexedDB storage, and user-controlled updates.

### Collector features (built for real collectors)
- **Generation logs (G1–G5)** — register view with #, name, colour, hair, type, size, year acquired, shelf
- **Other ponies** — separate log with brand name field
- **McDonald's ponies** — country + release year log
- **Cutie mark & photos** — every pony supports cutie mark description and up to 5 photos
- **Pony Map** — see every shelf/divider; tap pony for passport with whereabouts
- **Extras tab** — playsets & accessories with photos
- **Personalisation** — colourful accent themes in Settings
- **iPhone polish** — safe areas, floating nav, shelf drag-and-drop

### Platform
- IndexedDB-first storage, schema migrations (v5), user-controlled PWA updates
- Parent PIN, G4 bulk import, backup/recovery, 25+ automated tests
- First version archive at `/releases/v3.0.0/`

See entries below for incremental 2.7–2.9 development notes.

## 2.9.0 (2026-06-26) — PWA update control & data preservation
- **User-controlled updates** — no forced `skipWaiting`; banner + Settings with Update now / Not now.
- **Auto-update toggle** — default OFF; users choose when to apply new versions.
- **Pre-update backup prompt** — optional export before applying update.
- **Schema migrations** (`js/migrations.js`) — safe upgrades from older stored data.
- **IndexedDB-first** documented in `docs/PWA_DEPLOYMENT.md`.
- **Version archives** — `scripts/archive-version.sh` for `/releases/vX.Y.Z/` pinned installs.
- CSV import now parent-gated.
- Service worker cache `deeponycap-v40`.

## 2.8.0 (2026-06-26) — Storage & Roadmap
- **IndexedDB-first storage** — full collection in IDB; no 5 MB localStorage ceiling.
- **Storage health** — shows IndexedDB quota via `navigator.storage.estimate()`.
- **Parent PIN sheet** — polished modal replaces `prompt()` for setup & verify.
- **G4 bulk photo import** — complete: filename matching, DB lookup, create/update ponies.
- **Storybook Print/PDF** — A4 print layout via browser print dialog.
- Recovery snapshots now stored in IndexedDB when available.
- Service worker cache `deeponycap-v39`.

## 2.7.0 (2026-06-26) — Product Excellence
- **Collection Timeline** — visual acquisition journey in Stats.
- **Pony Passport** — rich profile sheet with milestones, accessories, share card, clone.
- **Storybook Mode** — scrapbook album browse for kids.
- **Fuzzy search** + pony DB aliases (DJ Pon-3 / Vinyl Scratch, etc.).
- **Smart suggestions** on Stable (missing Mane Six, wishlist hints).
- **Collection insights** — top gen, fave gen, shelf distribution, wishlist %.
- **12 new achievements** (First Favourite, Mane Six, Shelf Organizer, …).
- **Accessory gallery** — categories, search, sort, linked pony counts.
- **Collection tools** — bulk shelf move, favorite shelf, mark extras.
- **Data safety** — backup validation, auto recovery snapshots (last 3).
- **Accessibility** — skip link, dialog semantics, Escape to close, keyboard cards, reduced motion.
- **PWA** — manifest shortcuts (Add Pony, Wishlist, Storybook); SW `deeponycap-v38`.
- **Tests** — 10 new Playwright excellence scenarios.

## 2.6.0 (2026-06-26)
- **App Store readiness:** privacy policy rewrite, `icon-1024` in manifest, iOS templates (`PrivacyInfo.xcprivacy`, Info.plist snippet).
- **App Store Connect copy:** `docs/APP_STORE_CONNECT.md`, preflight script `npm run preflight`.
- Expanded Playwright tests (demo, privacy, parent lock).
- **P0–P4 polish pass:** demo wishlist + banner, sheet close fix, generation emojis on cards/detail.
- **Collection goals** on Stable (G4 Mane Six, G1 Babies) with progress bars.
- **Backup nudge** when storage ≥ 75%.
- **Achievements** unlock confetti + haptic; Dreamer fires on demo load.
- **Parent PIN** for export, import, delete (optional).
- **Haptic toggle** in Settings; success vibration on wishlist → collection.
- **Market comps** — log manual sold prices per pony (Collector Mode detail).
- **Pony DB** validation hints on add/wishlist forms.
- **Seasonal themes** — winter/spring accents + birthday sparkle on anniversaries.
- **Privacy & Safety** card with links to privacy/changelog.
- Service worker cache `deeponycap-v37`; docs for App Store screenshots + Capacitor build.

## 2.5.1 (2026-06-15)
- Restore pre–Capricorn identity home-screen icons; service worker cache bump.

## 2.5.0 (2026-06-15)
- Extract inline styles to `css/app.css` for faster loads and easier maintenance.
- Shelf **Share** button — copy or native-share a shelf summary with pony names.
- Richer empty states on Stable, Collection, and Shelves (with optional demo collection).
- Service worker precaches `app.css` + `identity.css`; cache bump `deeponycap-v34`.

## 2.4.1 (2026-06-12)
- Phase P4: Playwright test for accessories gallery tab; service worker cache bump.

## 2.2.0 (2026-06-10)
- Portfolio CTO pass: PWA icons (192/512 maskable), service worker cache bump (`deepony-v6`)
- Truth sprint: docs aligned with shipped features
- IndexedDB photo store, legacy cleanup, pitch expansion

### Phase 2 — Quality (2026-06-10)
- Playwright smoke tests (2/2 pass after template literal fix in app.js)
- Pitch expanded: parent safety, backup, market, roadmap, OS family
- Landing footer with privacy/changelog HTML pages
