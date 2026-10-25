# DeePonyCap — Design system

Sober, Apple HIG-aligned, ported from the ScentCap 3.0 system (`ScentCap/src/design/system.css`, `DESIGN.md`) via VaultCap.
Content first; chrome stays quiet. DeePonyCap keeps its own accent: the **user's accent theme** (Classic Pink by default).

Source of truth:

| File | Role | Loading |
|---|---|---|
| `css/design/tokens.css` | Semantic tokens (light / dark / increased contrast) + legacy bridge | render-blocking, unlayered |
| `css/design/system.css` | `ui-*` primitives (ScentCap port) | `@layer components` via `css/app.css` |
| `css/design/deepony.css` | Reskin of 3.x shell + shared classes (`.nav`, `.nav-btn`, `.card`, `.btn-p/-g`, `.chip`, `.sheet`) | `@layer components` |
| `css/cascade.css` | Declares `@layer legacy, components` only — sheets are `<link>`ed from `index.html` (no `@import`; SW-cached `@import` was resolving to `/` and 404ing on Pages) | render-blocking |

## Principles

1. **Content first.** Numbers and names carry the screen; surfaces are grey/white (light) or black/graphite (dark).
2. **One accent.** Gold (`--tint`) marks the single primary action per screen, selection and links. Never decorative.
3. **System type.** SF (`--font-ui`) at 17pt body; SF Rounded (`--font-rounded`) only for hero amounts. Tabular figures for money.
4. **Native patterns.** Large titles on top-level screens, inset-grouped lists for settings and records, segmented controls,
   sheets with grabber + Cancel / Title / Done, floating glass tab bar (phone) / glass sidebar (≥700px).
5. **Accessible by default.** 44pt targets, AA contrast in light / dark / increased contrast, reduced motion + transparency honoured,
   colour never the only signal, every icon button has `aria-label`.

## Accent

The accent is the user's choice (`CollectorSuite.applyAccent` sets `--pink`). The tint is derived from it so it stays AA:
`color-mix(in oklab, accent 65%, black)` on light, `accent 72% + white` on dark (`--on-tint` white / black).
`applyAccent` no longer paints pastel page backgrounds; pages use the HIG grouped background. Dark mode = `html.dark-mode`.

## Tokens

Same names as ScentCap: `--bg`, `--surface(-2|-elevated)`, `--fill(-2)`, `--separator`, `--label(-2|-3|-4)`,
`--tint(-hover|-soft)`, `--on-tint`, `--success/--warning/--danger`, `--t-large … --t-caption2`, `--r-sm/md/lg/xl`,
`--shadow-1/2/3`, `--ease`, `--hit`, `--gutter`, `--tabbar-h`. The glass material is `--glass-material`
(`--glass` is a legacy name, bridged to `--surface`).

**Do not** use hex values or legacy tokens (`--bg-card`, `--text*`, `--pink-light*`, `--pc-*`, `--shadow*`) in new code.
They are bridged in `tokens.css` so 3.x screens inherit the palette.

## Primitives (`ui-*`)

Identical to ScentCap minus the bottle-specific classes (`ui-plinth`, `ui-bottle*`, `ui-grid`, `ui-tabbar`, `ui-sidebar`):
`ui-page`, `ui-header`, `ui-eyebrow`, `ui-largetitle`, `ui-section(-head|-title|-link)`, `ui-card(--lg)`, `ui-list`,
`ui-row(--media|--icon)`, `ui-row__main/__title/__sub/__value/__icon`, `ui-chevron`, `ui-list-header/-footer`,
`ui-btn` + `--primary/--secondary/--gray/--plain/--danger/--sm/--block`, `ui-icon-btn(--tint)`, `ui-chip`, `ui-tag(--tint)`,
`ui-segmented`, `ui-search`, `ui-field(--left)`, `ui-switch`, `ui-widgets`, `ui-widget(__label|__value|__unit)`, `ui-meter`,
`ui-scroller`, `ui-skeleton`, `ui-rise`, `ui-sheet*`, plus `.num` (tabular figures).

## Shell

- Phone (<700px): floating glass tab bar — Stable · Logs · Map · Wishlist · Extras. The document scrolls (no inner `.main`
  scroller); a new screen opens at the top. Add and Settings are glass buttons top-right (no FAB).
- ≥700px: sticky glass sidebar via CSS (`js/cap-desktop-nav.js` is generated from `shared/design-system`, still 900px).
- Add / edit pony sheet: grabber, Cancel / Title / Save bar (`Render.sheetHdr(title, close, done)`); focus lands on the title.
- SF type, SF Rounded for titles (friendly, still system). Check with `npm run ios:check`.

### Documented scroll exceptions (HIG rule 1)

Inner `overflow: auto|scroll` is allowed only on:

- `.sheet` / `.ui-sheet` — sheet body (modal leaf; document stays locked via `position: fixed` while open)
- `#cap-nav-sidebar` — desktop sidebar when nav items exceed the viewport height

No `.page` / `.main` / `.screen` / `.view` / `.pb` / `#view` scrollers.

## Copy

Plain, warm, short. Sentence case. No exclamation marks. Fictional data is always labelled ("Sample · Fictional data only").
