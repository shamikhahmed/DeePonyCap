#!/usr/bin/env bash
# DeePonyCap App Store preflight — run before Archive upload
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Version sync"
node -e "const v=require('./VERSION.json'); console.log('App', v.version, '| SW', v.swCache)"
node -e "const v=require('./VERSION.json'); const fs=require('fs'); const sw=fs.readFileSync('sw.js','utf8'); const ver=fs.readFileSync('js/version.js','utf8'); if(!sw.includes(v.swCache)||!ver.includes(v.swCache)||!ver.includes(v.version)){console.error('SW/version mismatch'); process.exit(1);} console.log('SW cache OK', v.swCache);"

echo "==> Playwright smoke"
npm test

echo "==> Required assets"
for f in assets/icon-1024.png assets/icon-512.png assets/icon-192.png assets/icon-maskable-512.png assets/favicon.svg assets/apple-touch-icon-180.png privacy.html manifest.json PRIVACY.md; do
  test -f "$f" && echo "  ✓ $f" || { echo "  ✗ missing $f"; exit 1; }
done

echo "==> iOS templates"
test -f ios-templates/PrivacyInfo.xcprivacy && echo "  ✓ Privacy manifest template"
test -f ios-templates/Info.plist.snippet.xml && echo "  ✓ Info.plist snippet"

if [ -d ios/App ]; then
  echo "==> iOS project present"
  npx cap sync ios
else
  echo "==> iOS project not generated yet"
  echo "    Install CocoaPods: brew install cocoapods"
  echo "    Then: npx cap add ios && cp ios-templates/PrivacyInfo.xcprivacy ios/App/App/"
  echo "    Merge ios-templates/Info.plist.snippet.xml into Info.plist"
fi

echo ""
echo "Ready for:"
echo "  • GitHub Pages deploy (PWA)"
echo "  • App Store Connect metadata: docs/APP_STORE_CONNECT.md"
echo "  • Native build: docs/CAPACITOR_BUILD.md"
