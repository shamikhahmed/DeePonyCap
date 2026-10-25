Track your collection, shelves and wishlist.

# DeePonyCap

Offline PWA by Capricorn Systems. Photos, shelves, wishlist and series logs stay on your device.

**Version:** 4.0.0 · **SW cache:** `deeponycap-v400` · **Live:** https://shamikhahmed.github.io/DeePonyCap/

Design: Apple HIG–aligned shell (`DESIGN.md`) with tint derived from the user’s accent theme.

## Run

```bash
npm run serve   # http://127.0.0.1:8770
npm test && npm run verify
npm run ios:check   # after serve (WebKit)
```

Prod-ready audit (reviewer, outside sandbox):

```bash
python3 -m http.server 8880
node scripts/prod-ready-audit.mjs http://127.0.0.1:8880/
```

DeePonyCap is an independent collection tracker and isn't affiliated with or endorsed by any toy company.

Publisher: Capricorn Systems · Karachi, Pakistan

## Example stories

Illustrative day-in-the-life stories (fictional personas) with screenshots and captions:

- App stories: https://shamikhahmed.github.io/apps/deeponycap/
- All Cap stories: https://shamikhahmed.github.io/stories/
