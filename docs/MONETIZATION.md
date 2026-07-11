# DeePonyCap — Monetization Plan

## Model: Freemium → One-time Pro ($4.99)

### Why someone pays
MLP collectors are deeply invested hobbyists — many have hundreds of ponies worth thousands of dollars. Free tier (1 shelf, 20 ponies) creates real friction for serious collectors. $4.99 one-time is a no-brainer for someone tracking a $2,000 collection. No subscription fatigue — lifetime unlock feels fair for a catalog app.

### Revenue logic
- Target: 100 purchases/mo × $4.99 = **$499/mo** (after Apple's 30% cut: ~$350/mo net)
- Hobbyist app with rabid niche — low CAC via community forums (MLP Arena, Reddit r/mylittlepony)
- One-time purchase = higher App Store conversion than subscriptions for catalog apps

---

## Free vs Pro

| Feature | Free | Pro ($4.99 one-time) |
|---------|------|----------------------|
| Shelves | 1 shelf, up to 20 ponies | ✅ Unlimited shelves |
| Photos per pony | ✅ 1 photo | ✅ Full gallery |
| Condition tracking | ✅ | ✅ |
| Offline PWA | ✅ | ✅ |
| Wishlist tracker | ❌ | ✅ |
| Export collection (JSON/CSV) | ❌ | ✅ |
| Accessories tracker | ❌ | ✅ |
| Collection stats & value est. | ❌ | ✅ |
| Backup / restore | ❌ | ✅ |

---

## Implementation gates
- `window.DeePonyPro.isPro()` — reads `localStorage.getItem('dp_pro_active') === '1'`
- Demo mode: `isPro() = true` (full collection shown)
- Gates at: 21st pony add, 2nd shelf create, photo gallery (>1), export, wishlist tab
- Gate copy: "Unlimited shelves — Pro feature →" + `openProUpgrade()`

## Demo seed fix (2026-06-28)
- `js/demo-seed.js` created — 9 sample ponies across 4 shelves
- `boot()` already called `DemoSeed.load()` if `DemoSeed` existed — now it does
- Previously `DemoSeed` was undefined, so demo showed empty stable

## Payment path (current)
- Waitlist via `openProUpgrade()` modal in-app
- Next: App Store IAP (Capacitor) or Stripe one-time checkout for web PWA

---

*Last updated: 2026-06-28*
