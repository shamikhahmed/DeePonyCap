# DeePonyCap ✨

DeePonyCap by Capricorn Systems — your magical **My Little Pony collection tracker**, soft, sparkly, and child-friendly.

🔗 **Live:** https://shamikhahmed.github.io/DeePonyCap/  
📁 **Repo:** https://github.com/shamikhahmed/DeePonyCap

---

## Features

- 🏠 **Stable** — greeting, pony counter, generation rainbow, collection anniversaries
- 🦄 **Collection** — photos, filters, search, 5 generations (G1–G5)
- 💫 **Wishlist** — dream ponies with Must / Want / Someday priority
- 🗂️ **Shelves** — organise by physical shelf location
- 🌈 **Stats** — bubbles, achievements, generation checklist, collection health
- 🌙 **Modes** — default child-friendly, Collector mode, dark mode

## New in v2.2

- **Generation checklist** — unique names owned vs pony name database per gen
- **Anniversary banner** — ponies acquired on this day in prior years show on Stable

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
| Presentation | [docs/PRESENTATION.md](docs/PRESENTATION.md) |
| Landing page | [landing.html](landing.html) |

## Ideas for later

- Wishlist reference photos + target price
- Accessory gallery with multi-pony linking
- Smart duplicate / variant tracking
- Trade/swap log between collectors
- QR labels for physical shelf boxes

---

Built by Shamikh Ahmed.
