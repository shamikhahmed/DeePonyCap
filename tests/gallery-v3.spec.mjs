/**
 * DeePonyCap gallery v3 — schema-v2 primary screens (Perfection Loop §9).
 */
import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync, readFileSync, existsSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import {
  GALLERY_VIEWPORTS,
  GALLERY_FREEZE_CSS,
  galleryClockInitScript,
  isGalleryCapture,
  shotEntry,
  shotRelativePath,
} from './helpers/gallery-capture-helpers.mjs';

const require = createRequire(import.meta.url);
const { fastGalleryUnlock, dismissOverlays, hideDemoBanner } = require('./demo-unlock.js');

const GALLERY_DIR = join(process.cwd(), 'docs', 'screenshots', 'gallery');
const MANIFEST = join(GALLERY_DIR, 'gallery-manifest.json');
const ACCENT = '#ff6eb4';

const SCREENS = [
  { nav: 'stable', group: 'Collection', screen: 'Stable', state: 'demo', caption: 'Your pony collection home.' },
  { nav: 'logs', group: 'Collection', screen: 'Logs', state: 'demo', caption: 'Series logs and history.' },
  { nav: 'map', group: 'Organize', screen: 'Map', state: 'demo', caption: 'Shelf map and organization.' },
  { nav: 'wishlist', group: 'Wishlist', screen: 'Wishlist', state: 'demo', caption: 'Must, want, and someday ponies.' },
  { nav: 'accessories', group: 'Extras', screen: 'Accessories', state: 'demo', caption: 'Accessories and playsets.' },
  { nav: 'settings', group: 'System', screen: 'Settings', state: 'demo', caption: 'Theme, haptics, parent lock, export.' },
];

const DEVICES = ['iphone', 'ipad', 'mac'];
const THEMES = ['light', 'dark'];

test.describe('DeePonyCap gallery v3', () => {
  test.skip(!isGalleryCapture(), 'Run via CAPTURE_GALLERY=1 (npm run gallery:v3)');

  test.beforeEach(async ({ context }) => {
    await context.addInitScript(galleryClockInitScript());
  });

  test('primary screens × light/dark × iphone/ipad/mac', async ({ page }) => {
    test.setTimeout(600_000);
    await fastGalleryUnlock(page);
    const shots = [];

    for (const device of DEVICES) {
      const vp = GALLERY_VIEWPORTS[device];
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.evaluate(() => {
        if (typeof Nav !== 'undefined' && Nav._renderSidebar) {
          const tab = document.querySelector('.nav-btn.on')?.dataset.tab || 'stable';
          Nav._renderSidebar(tab);
        }
        window.dispatchEvent(new Event('resize'));
      });
      await page.waitForTimeout(200);

      for (const theme of THEMES) {
        await prepareShot(page, theme);
        for (const screen of SCREENS) {
          await dismissOverlays(page);
          await hideDemoBanner(page);
          await page.evaluate((id) => Nav.go(id), screen.nav);
          await expect(page.locator(`#tab-${screen.nav}.on`)).toBeVisible({ timeout: 12000 });
          await page.waitForTimeout(150);
          await prepareShot(page, theme);

          const rel = shotRelativePath({
            theme,
            device,
            group: screen.group,
            screen: screen.screen,
            state: screen.state,
            ext: 'webp',
          });
          const webpPath = join(GALLERY_DIR, rel);
          const pngPath = webpPath.replace(/\.webp$/, '.png');
          mkdirSync(dirname(pngPath), { recursive: true });
          await page.screenshot({ path: pngPath, fullPage: false, animations: 'disabled' });
          pngToWebp(pngPath, webpPath);

          shots.push(
            shotEntry({
              id: `${screen.group}--${screen.screen}--${screen.state}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
              group: screen.group,
              screen: screen.screen,
              state: screen.state,
              theme,
              device,
              file: rel,
              route: `#${screen.nav}`,
              caption: screen.caption,
              w: vp.width * vp.deviceScaleFactor,
              h: vp.height * vp.deviceScaleFactor,
            }),
          );
        }
      }
    }

    writeManifest(shots);
    expect(shots.length).toBe(SCREENS.length * DEVICES.length * THEMES.length);
  });
});

async function setAppTheme(page, theme) {
  await page.evaluate((t) => {
    S.settings.darkMode = t === 'dark';
    Theme.apply();
    Store.save();
  }, theme);
}

async function prepareShot(page, theme) {
  await page.emulateMedia({ colorScheme: theme });
  await page.addStyleTag({ content: GALLERY_FREEZE_CSS }).catch(() => {});
  await setAppTheme(page, theme);
  await page.waitForTimeout(60);
}

function pngToWebp(pngPath, webpPath) {
  const cwebp = spawnSync('cwebp', ['-q', '82', pngPath, '-o', webpPath], { encoding: 'utf8' });
  if (cwebp.status === 0 && existsSync(webpPath)) {
    try {
      unlinkSync(pngPath);
    } catch {
      /* ok */
    }
    return;
  }
  spawnSync('cp', [pngPath, webpPath]);
}

function writeManifest(shots) {
  mkdirSync(GALLERY_DIR, { recursive: true });
  const version = JSON.parse(readFileSync(join(process.cwd(), 'VERSION.json'), 'utf8')).version;
  writeFileSync(
    MANIFEST,
    JSON.stringify(
      { app: 'DeePonyCap', version, capturedAt: '2026-10-14T09:41:00Z', accent: ACCENT, schema: 2, shots: shots.sort((a, b) => String(a.file).localeCompare(String(b.file))) },
      null,
      2,
    ),
  );
}
