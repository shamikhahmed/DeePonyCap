# DeePonyCap — Perfection v3 INVENTORY
Seeded from §13.6 + `index.html` / `js/modules/navigation.js` / Render · 2026-10-14

Live entry: `/DeePonyCap/?demo=1` · Stack: static JS PWA · own Pages  
**D-04:** independent tracker — no third-party IP in bundled content or screenshots.

## Primary tabs
| ID | Screen | Nav |
|---|---|---|
| S-STABLE | Stable (collection home) | tab `stable` |
| S-LOGS | Series logs | tab `logs` (alias `collection`) |
| S-MAP | Pony Map / shelf organize | tab `map` (alias `shelves`) |
| S-WISH | Wishlist (Must / Want / Someday) | tab `wishlist` |
| S-EXTRAS | Accessories & playsets | tab `accessories` |
| S-STATS | Stats · achievements · insights | via Stable tools / direct `stats` |
| S-SET | Settings | gear → `settings` |

## Secondary / overlays
| ID | Surface | Notes |
|---|---|---|
| S-DETAIL | Item detail sheet | photo, series, condition, price, date |
| S-ADD | Add / edit pony sheet | camera + gallery photo pick |
| S-SERIES | Series manager | define / rename series |
| S-ONBOARD | Onboarding carousel | first launch |
| S-SPLASH | Splash | ≤1.6s then `__APP_READY__` |
| D-DEMO | Demo banner | `?demo=1` |
| D-INSTALL | Install hint / banner | iOS/Android / beforeinstallprompt |
| D-TOAST | Toast | confirmations |
| D-CONFIRM | CapConfirm / CapPrompt | destructive / PIN |
| D-CONFETTI | Confetti layer | celebrations |

## Forms
| Form | Fields | Keyboard |
|---|---|---|
| Add/edit pony | name, series, generation, type, colour, condition, price, date, shelf, notes, photos | text, select, date, number, file/camera |
| Wishlist item | name, series, priority tier, target price, notes | text, select, number |
| Series define | label | text |
| Accessory | name, category | text |
| PIN setup | parent lock PIN | number / password |
| CSV import/export | file | file |
| Collector profile | name, since | text, date |
| Settings toggles | dark, compact, haptics, collector mode, parent lock | switches |

## States (§7.9)
empty Stable · demo (`?demo=1`) · lots-of-data · dark · collector-mode · reduce-motion · season-* · onboarding · locked (parent PIN) · offline (SW) · import fail · photo denied

## Settings
Dark mode · compact view · haptics · collector mode · parent lock PIN · export/import · CSV · recovery · privacy · changelog · try demo note

## Network / privacy
- On-device only (IndexedDB / localStorage) — no Cap analytics servers
- Optional: service worker same-origin assets
- Privacy page: `privacy.html` (must stay D-04 clean)

## External links
- `privacy.html` · `changelog.html` · hub support (if linked)
