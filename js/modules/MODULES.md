# DeePonyCap Module Load Order

## Layer 0 — Constants (no deps)
- constants.js

## Layer 1 — Utilities
- pony-utils.js (depends on constants)

## Layer 2 — Storage
- storage-health.js
- store.js (depends on pony-utils, storage-health)

## Layer 3 — Core Services
- theme.js (depends on store)
- haptics.js (standalone)
- photo-utils.js (depends on store)

## Layer 4 — Feature Modules
- csv-io.js, backup-io.js (depends on store)
- parent-gate.js (depends on store)
- achievements.js (depends on store)
- animations.js (standalone)
- splash.js (depends on animations)
- onboarding.js (depends on store, theme)
- photo-picker.js (depends on photo-utils)
- navigation.js (depends on render-core)
- render-core.js (depends on store, pony-utils)
- ui-core.js (depends on all above)

## Layer 5 — Bootstrap
- app.js (entry point, depends on all)
