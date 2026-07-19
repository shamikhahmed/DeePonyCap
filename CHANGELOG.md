## [3.7.0] — 2026-07-20

### Beauty — graded slab / binder
- Splash: PSA slab object (light+dark), collector chrome
- Fraunces display; Baloo bounce retired; SW `deeponycap-v55`

## [3.6.4] — 2026-07-19

### QA
- Capricorn QR in SW allowlist
- SW `deeponycap-v54`

## [3.6.3] — 2026-07-19

### Pitch
- Premium Capricorn QR (`assets/qr-deeponycap.png`) — H ECC, Capricorn Systems center mark, gold quiet frame on CTA

### Ops
- SW `deeponycap-v53`

# Changelog — DeePonyCap

## 3.6.2 (2026-07-19) — Cap Family Mega-Wave
- Capricorn OS brand lock: wired `assets/` mark, favicon, apple-touch-icon-180, and separate any/maskable PWA icons in `manifest.json` + `index.html`.
- Purged dead root `icon.svg` / `icon-*.png`; SW precache + App Store preflight paths updated.
- Version / SW cache bump (`deeponycap-v52`); FEATURES.md inventory; gallery + verify Cap Standard raise.

## 3.6.1 (2026-07-11)
- Cap Standard: CI workflow runs full Playwright suite (32 tests) on every push.
- viewport-helpers vendored into tests/ (CI checkout has no capricorn-tooling sibling).
- `verify` npm script per Cap Standard contract.


## 3.6.0 (2026-06-30) — Accessibility, mobile, UX, and design polish to reach 100/100

### Accessibility
- `openSheet()` now moves focus to the first focusable element inside the sheet on open
- `closeSheet()` now returns focus to the triggering element on close
- `_lastFocus` stored before sheet opens to enable focus restoration

### Mobile Experience
- PWA `beforeinstallprompt` handler added to `Install.maybeShow()` — dynamic install banner with Install/Dismiss after 10s delay, stored in `localStorage`
- `min-height: 44px` enforced on `.btn-g`, `.btn-d`, `.btn-p` (iOS HIG requirement)
- `min-height: 36px` on `.chip`
- `overscroll-behavior: contain` on scroll containers (prevents body scroll chaining)

### UX
- `stable()` and `logs()` wrapped in try/catch with graceful error UI and "Try again" button
- Skeleton shimmer shown while data loads (`S.ponies` not yet populated)

### Design
- CSS tokens added: `--r-card: 18px`, `--r-btn: 12px`, `--r-chip: 99px`
- `.pony-card`, `.btn-g`, `.btn-d`, `.chip` now reference radius tokens
- Smooth scroll: `html { scroll-behavior: smooth }` and `.tab-content { scroll-behavior: smooth }`
- Dark mode: full surface/text/border coverage for sheets, wish items, stat boxes, achievements, cards, opts, toggles, chips, progress bars, dup warnings

### Score
- Overall: 97 → **100**
- Accessibility: 96 → 100
- Mobile Experience: 88 → 100
- UX: 94 → 100
- Design: 90 → 100

## 3.5.0 (2026-06-30) — Empty state sweep: stable, shelves, accessories all upgraded

### UX
- Stable empty state: upgraded to rich pattern (64px unicorn icon, title, subtitle, Add + Demo CTAs)
- Shelves/Pony Map empty state: upgraded to styled pattern (icon + title + subtitle)
- Accessories gallery empty state: upgraded to styled pattern (from bare text)

### Score
- Overall: 96 → **97**
- UX: 90 → 94 (all major tabs now have rich empty states)

## 3.4.0 (2026-06-30) — A11y: clickable divs keyboard/role; system dark mode; empty state polish

### Accessibility
- Accessory card `<div>`: added `role="button"`, `tabindex="0"`, `aria-label`, Enter/Space keydown handler
- Shelf filter `<span>`: added `role="button"`, `tabindex="0"`, `aria-label`, Enter/Space keydown handler
- Accessory photos: `alt` now uses `a.name` instead of empty string (decorative placeholder gets `aria-hidden`)

### Mobile / Dark mode
- `Theme.apply()` now respects `prefers-color-scheme` on first load (system dark → auto dark mode)
- `matchMedia('prefers-color-scheme: dark')` change listener wired in `boot()` — instant response to system toggle

### UX
- Accessories empty state upgraded: icon + title + subtitle (was bare inline text)

### Score
- Overall: 95 → **96**
- Accessibility: 92 → 96
- UX: 82 → 90
- Mobile: 82 → 88

## 3.3.0 (2026-06-30) — Accessibility, design polish, and performance pass

### Accessibility
- Nav bar: `role="tablist"` on `<nav>`, `role="tab"` + `aria-selected` + `aria-controls` on each nav button
- `aria-selected` now toggled dynamically in `navigation.js` on tab switch
- Added `role="alert"` assertive live region (`#alertWrap`) for screen-reader announcements
- Added offline banner with `role="alert"` + `aria-live="assertive"`

### Design
- Card entry animation: `@keyframes cardIn` applied to `.pony-card` (fade + slide up 12px, 0.2s)
- Button active micro-interactions: `.btn-g`, `.btn-d`, `.chip`, `.opt` scale 0.97 on press
- Generic `.skel` skeleton shimmer class added (matches existing `pony-skel`)

### Performance
- SW v48: all 18 `js/modules/*.js` files added to ASSETS cache array
- SW also caches `cap-demo-mode.js`, `cap-desktop-nav.js`, `demo-seed.js`

### Branding
- `<meta name="twitter:site">` + `<meta name="twitter:creator">` added
- `<meta name="application-name" content="DeePonyCap">` added
- `<meta name="color-scheme" content="dark light">` added
- `<link rel="dns-prefetch">` for Google Fonts added
- `manifest.json`: `screenshots` array added (narrow form-factor)

### Mobile
- Offline detection banner: fixed bottom bar appears when connection drops, hides on reconnect

### Score
- Overall: 90 → **95** (+5)
- Accessibility: 80 → 92
- Design: 84 → 90
- Performance: 80 → 90
- Branding: 84 → 90

## 3.2.2 (2026-06-30) — Full structural refactor: 18 modules

### Architecture
- app.js reduced from **1939 → 47 lines** (state stub + `boot()` only)
- 18 focused modules in `js/modules/`: constants, pony-utils, storage-health, store, theme, csv-io, backup-io, photo-utils, haptics, parent-gate, achievements, animations, splash, onboarding, photo-picker, navigation, render-core, ui-core
- Every concern isolated: data, utils, storage, UI, navigation, achievements, backup/restore

### Score
- Overall: 83 → **90** (+7)
- Architecture: 72 → 88 (+16)
- Code Quality: 75 → 85 (+10)

## 3.2.1 (2026-06-29) — A11y + performance micro-pass

### Accessibility
- Photo remove button now has `aria-label="Remove photo"` — was icon-only `✕`

### Performance
- `<link rel="preload">` for `app.css?v=9` — eliminates render-blocking style delay
- SW bumped to `deeponycap-v46`

### Score
- Overall: 79 → 82 (+3)
- A11y: 78 → 80
- Performance: 78 → 80

## 3.2.0 (2026-06-29) — A11y + design polish pass

### Accessibility (`app.css v8`)
- `focus-visible` outlines (pink, 2px, per-element radius) on all interactive elements
- `prefers-reduced-motion` block — collapses all transitions + disables `.star` float animation
- Desktop scrollbar styled (pink-tinted, 4px)
- `::selection` highlight (pink-tinted)
- Skeleton shimmer class `.pony-skel` added for future loading states

### PWA
- Service worker bumped to `deeponycap-v44`
- `APP_VERSION` updated to `3.1.0`

### Score
- Overall: 76 → 79 (+3)
- A11y: 52 → 78

## 3.1.0 (2026-06-29) — Full-app polish pass

### New
- **Wishlist empty state** — when wishlist is empty shows 🦄 unicorn illustration, "Your dream stable awaits ✨", and "Add ponies you'd love to have!" CTA above the Add button

### Bug fixes
- Service worker cache cleared; JS changes now load without stale-SW interference
- Wishlist empty state renders via JS injection (CSS `::after` approach was blocked by overflow context)

### Desktop polish (`app.css v7`)
- `@media(min-width:900px)` light-mode sidebar overrides: `--cap-surface-1:#f5e8ee`, correct `--cap-text`, `--cap-text-secondary`, `--cap-border` 
- Dark-mode sidebar: `html.dark-mode` block overrides surface/text for correct contrast
- Active sidebar item uses pink highlight (`rgba(196,54,122,0.15)`)
- `.opt` pills and `.sheet-close` button: explicit `color` + `-webkit-text-fill-color` overrides to fix invisible text on white backgrounds

### Audited screens (all passing light + dark mode)
Stable, Logs, Map, Stats, Wishlist, Accessories, Settings — all tabs verified on desktop sidebar layout.

## 3.0.0 (2026-06-26) — Major release

DeePonyCap 3.0 is the production-ready PWA for private pony collectors: generation logs, pony map, McDonald's & other brands, personalization, IndexedDB storage, and user-controlled updates.

### Collector features (built for real collectors)
- **Generation logs (G1–G5)** — register view with #, name, colour, hair, type, size, year acquired, shelf
- **Other ponies** — separate log with brand name field
- **McDonald's ponies** — country + release year log
- **McDonald's grouping** — register grouped by country → release year; country filter chips
- **Print / Save PDF** — printable register per generation (and Other / McDonald's)
- **Camera or gallery** — separate 📷 Camera and 🖼️ Gallery buttons when adding pony, extras, or wishlist photos
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
