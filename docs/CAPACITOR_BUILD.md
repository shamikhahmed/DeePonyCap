# DeePonyCap — Capacitor Native Build

## Prerequisites

- Node.js 18+
- Xcode (iOS) or Android Studio (Android)
- Apple Developer account for device testing / App Store

## Setup

```bash
cd DeePonyCap
npm install
npx cap sync
```

## iOS

```bash
npx cap open ios
```

In Xcode:

1. Select your Team under Signing & Capabilities
2. Set bundle ID: `com.shamikhahmed.DeePonyCap` (matches `capacitor.config.json`)
3. Run on simulator or device
4. Archive → Distribute for TestFlight / App Store

## Android

```bash
npx cap add android   # first time only
npx cap sync
npx cap open android
```

Build signed APK/AAB from Android Studio.

## Notes

- `webDir` is `.` — the PWA root is the Capacitor web assets folder
- Service worker works in WebView; offline cache is `deeponycap-v37`
- Photos use inline base64 in localStorage (5 MB quota) — warn users on native too
- No server required; all APIs are local

## Smoke test after build

1. Fresh install → onboarding → add pony with photo
2. `?demo=1` not used in native; use Settings → demo instructions or ship seed in TestFlight notes
3. Parent PIN → export backup → re-import
4. Haptics on supported devices (toggle in Settings)
