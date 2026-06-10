# DeePonyOS — Security Notes

## Local-only data

- Pony catalog, wishlist, and collector profile live in **localStorage**.
- **Photos** are stored in **IndexedDB** via `PhotoIDB` — metadata in localStorage, binary blobs in IDB. No cloud photo sync.
- **No accounts**, analytics, or telemetry.

## COPPA-friendly design

- DeePonyOS is designed for **child-friendly collection tracking** with large tap targets and simple language.
- **Parents should supervise** device use, photo uploads, and backup exports.
- No social features, chat, or data collection from children — all data stays on the family device.
- Not affiliated with Hasbro or MLP brand owners — fan collection tool only.

## Photo storage

- Photos never leave the device unless you export a `.deepony` backup.
- Clearing site data removes IDB photos — export before uninstalling.

## PWA / supply chain

- Static assets served from GitHub Pages; verify `sw.js` cache version (`deepony-v6`) when updating.
- Do not commit `.env` or API keys to the repository.

## Reporting

Open a private security issue on the [DeePonyOS GitHub repo](https://github.com/shamikhahmed/DeePonyOS) for vulnerabilities.
