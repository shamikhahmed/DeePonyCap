# DeePonyCap ✨

DeePonyCap by Capricorn Systems — your magical **My Little Pony collection tracker**, soft, sparkly, and child-friendly.

🔗 **Live:** https://shamikhahmed.github.io/DeePonyCap/  
📁 **Repo:** https://github.com/shamikhahmed/DeePonyCap

**Version:** 3.7.0 · SW `deeponycap-v55` · see [VERSION.json](VERSION.json) · [CHANGELOG.md](CHANGELOG.md)

---

## Features (v3.7.0)

- 🏠 **Stable** — goals, backup nudge, anniversaries, generation rainbow
- 🦄 **Collection** — photos, filters, pony DB autocomplete, duplicate warnings
- 💫 **Wishlist** — priorities, target prices, reference photos
- 🗂️ **Shelves** — organise + share shelf summaries
- 🌈 **Stats** — achievements, PNG share card, generation checklist
- 🔒 **Parent lock** — optional PIN for export/import/delete
- 📊 **Collector mode** — sold comps, values, catalog view
- ♿ **Accessibility** — focus-managed sheets, keyboard roles, live regions, system dark mode
- ✨ **Demo:** append `?demo=1` to the live URL

## Recent highlights

- **3.7.0** — Capricorn OS brand lock (assets, PWA icons, favicon); SW cache `deeponycap-v55`
- **3.6.x** — Cap Standard CI/verify, install banner, a11y/mobile/UX polish to 100-score pass
- Full history: [CHANGELOG.md](CHANGELOG.md)

## Install on iPhone

1. Open the live URL in **Safari**
2. Tap **Share → Add to Home Screen**
3. Launch from home screen for full-screen native feel

## iPhone test checklist

- [ ] Splash and onboarding complete
- [ ] Add pony with photo saves correctly
- [ ] Collection filters by generation work
- [ ] Wishlist priority borders display (Must/Want/Someday)
- [ ] Stats generation checklist renders
- [ ] App works offline after first load
- [ ] Safe area: nav and FAB clear home indicator

## App Store readiness (v3.7.0)

```bash
npm run preflight   # tests + asset checks
```

**Done in code:** privacy policy, parent lock, offline PWA, Cap Standard icons, iOS templates, Playwright suite.

**You still need on your Mac:**
1. `brew install cocoapods`
2. `npx cap add ios` → copy `ios-templates/` into `ios/App/App/`
3. Xcode Archive → App Store Connect
4. Screenshots + listing copy from `docs/APP_STORE_CONNECT.md`

## Local dev

```bash
cd DeePonyCap
python3 -m http.server 8765
# → http://localhost:8765
```

## Deploy (GitHub Pages)

Push to `main` — Pages serves from repo root with `.nojekyll`.

## Documentation

| Resource | Path |
|----------|------|
| User guide | [docs/GUIDE.md](docs/GUIDE.md) |
| App Store checklist | [docs/APP_STORE.md](docs/APP_STORE.md) |
| App Store Connect copy | [docs/APP_STORE_CONNECT.md](docs/APP_STORE_CONNECT.md) |
| Capacitor build | [docs/CAPACITOR_BUILD.md](docs/CAPACITOR_BUILD.md) |
| Presentation | [docs/PRESENTATION.md](docs/PRESENTATION.md) |
| Landing page | [landing.html](landing.html) |

## Ideas for later

- Wishlist reference photos + target price polish
- Accessory gallery with multi-pony linking
- Smart duplicate / variant tracking
- Trade/swap log between collectors
- QR labels for physical shelf boxes

---

Built by Shamikh Ahmed.
