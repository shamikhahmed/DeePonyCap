# PWA Deployment & Data Preservation — DeePonyCap

How to ship updates via GitHub Pages without losing user collections, and how users control when they update.

---

## The golden rule

**App shell** (HTML, JS, CSS, service worker) and **user data** (ponies, photos, settings) are separate:

| Layer | Where it lives | Survives app update? |
|-------|----------------|----------------------|
| App shell | Service worker cache + static files | Replaced when user updates |
| Collection data | IndexedDB (`deeponycap-data-v1`) | **Yes — always** |
| Photos | IndexedDB (`deepony-photos-v1`) | **Yes — always** |
| Recovery snapshots | IndexedDB recovery store | **Yes — last 3 saves** |

As long as you deploy to the **same GitHub Pages origin** (e.g. `https://you.github.io/DeePonyCap/`), users keep their data across every release.

---

## Deploying a new version to GitHub

1. Bump `js/version.js` and `VERSION.json` (version + SW cache id).
2. Update `CHANGELOG.md`.
3. Run tests: `npm test`.
4. Commit and push to GitHub (Pages deploys from `main` or `gh-pages`).
5. **Archive the release** (optional, for users who want old UI):

```bash
./scripts/archive-version.sh 3.0.0
git add releases/v3.0.0 && git commit -m "Archive v3.0.0 for pinned installs"
```

This copies the current app into `/releases/v3.0.0/` so users can bookmark this release. Archives start from v3.0.0 — earlier versions are not archived.

---

## User-controlled updates (built in)

DeePonyCap **does not** auto-activate new service workers.

| User action | What happens |
|-------------|--------------|
| **Update now** (banner or Settings) | Optional backup prompt → new version loads |
| **Not now** | Stays on current version; banner hidden until they tap **Check for updates** |
| **Auto-update OFF** (default) | User always chooses |
| **Auto-update ON** | Applies pending update when detected |

Settings → **App version** shows current version, check for updates, and auto-update toggle.

---

## Staying on an old version permanently

Because GitHub Pages serves one “live” URL, when **all app tabs are closed** the browser may eventually activate a waiting service worker on next visit. Users who want the **old UI indefinitely** should:

1. Use an **archived URL**:  
   `https://you.github.io/DeePonyCap/releases/v3.0.0/`
2. Add that URL to Home Screen (separate PWA install from latest).

**Data is shared** — archived and latest URLs are the same origin, so IndexedDB collection data is the same. Only the app shell differs.

---

## Schema migrations

`js/migrations.js` runs on every load. When stored `version` < current schema:

- Settings defaults are merged (never wipe parent PIN, etc.)
- New fields get safe defaults
- `Store.save()` writes migrated schema back to IndexedDB

Always add a migration step when changing stored shape — never assume fresh installs only.

---

## Pre-release checklist

- [ ] Bump `version.js` + `VERSION.json` + SW cache name
- [ ] Add migration if schema changed
- [ ] Run `npm test`
- [ ] Run `./scripts/archive-version.sh X.Y.Z`
- [ ] Verify backup export/import on a device with existing data
- [ ] Document changes in `CHANGELOG.md`

---

## What users should do before major updates

1. **Export backup** (Settings → Export Backup) — optional but recommended.
2. Tap **Update now** when ready.
3. If anything looks wrong: Settings → **Recover auto-snapshot**.

---

## FAQ

**Q: Will GitHub deploy erase my users’ data?**  
No. Data never lives on GitHub — only on each user’s device.

**Q: What if I change IndexedDB structure?**  
Add a migration in `migrations.js`. Test import from an older backup file.

**Q: Can two versions run at once?**  
Yes — latest at `/` and archived at `/releases/vX.Y.Z/`, same collection data.

**Q: App Store later?**  
Same data principles apply; native Capacitor build uses WebView + same IDB layer. See `docs/APP_STORE.md`.
