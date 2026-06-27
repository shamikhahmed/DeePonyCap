# App Store Connect — DeePonyCap

Use this when creating the iOS listing. Privacy URL must match:  
https://shamikhahmed.github.io/DeePonyCap/privacy.html

## App Information

| Field | Value |
|-------|--------|
| **Name** | DeePonyCap |
| **Subtitle** | Magical pony collection tracker |
| **Bundle ID** | com.shamikhahmed.DeePonyCap |
| **SKU** | deeponycap-ios-001 |
| **Primary category** | Lifestyle |
| **Secondary** | Entertainment |
| **Age rating** | 4+ (no restricted content) |
| **Copyright** | © 2026 Shamikh Ahmed |

## Description (App Store)

DeePonyCap is a sparkly, child-friendly My Little Pony collection tracker — built for young collectors and their parents.

**Organize your stable**
- Add ponies with photos, generation (G1–G5), shelf, and condition
- Search and filter your whole collection
- Track wishlist ponies with Must / Want / Someday priorities

**Made for families**
- 100% on-device — no accounts, no ads, no tracking
- Optional Parent Lock PIN for export and delete
- Works offline after first launch

**Collector tools**
- Stats, achievements, and shareable collection cards
- Collection goals (G4 Mane Six, G1 Babies)
- Export backup to move to a new device

Built by Capricorn Systems. Not affiliated with Hasbro or My Little Pony.

## Promotional Text (170 chars)

Track your MLP ponies with photos, wishlists & shelves — offline, private, and kid-safe. Optional parent lock included.

## Keywords (100 chars max)

pony,collection,MLP,wishlist,kids,offline,photos,toys,organizer,stable

## Support URL

https://github.com/shamikhahmed/DeePonyCap/issues

## Marketing URL

https://shamikhahmed.github.io/DeePonyCap/landing.html

## Privacy Nutrition Labels

Answer in App Store Connect:

| Question | Answer |
|----------|--------|
| Data collected | **No** — Data Not Collected |
| Tracking | **No** |
| Third-party advertising | **No** |

## Age Rating Questionnaire (typical)

- Cartoon/fantasy violence: None
- User-generated content: Yes (photos user adds locally — not shared in-app)
- Unrestricted web access: No (WKWebView loads bundled app only in native build)
- Made for Kids: Consider **Kids Category** if targeting under 13; otherwise 4+ with parental guidance note

## Screenshots

See [APP_STORE.md](APP_STORE.md). Required sizes: 6.7", 6.5", 5.5" (or use Xcode automatic sizing).

## Build & upload

```bash
brew install cocoapods   # one-time
cd DeePonyCap
npm install
npx cap add ios          # first time
cp ios-templates/PrivacyInfo.xcprivacy ios/App/App/
# Merge ios-templates/Info.plist.snippet.xml into Info.plist
npx cap sync ios
npx cap open ios
# Xcode → Product → Archive → Distribute
```

## Versioning

Keep in sync:

| File | Field |
|------|--------|
| `VERSION.json` | version + swCache |
| `ios/.../Info.plist` | CFBundleShortVersionString + CFBundleVersion |
| App Store Connect | Version + Build number |

Build number (`CFBundleVersion`) = major*100 + minor*10 + patch → `260` for 2.6.0
