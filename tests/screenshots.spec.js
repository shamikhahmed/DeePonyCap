// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { dismissOverlays, hideDemoBanner, fastGalleryUnlock } = require('./demo-unlock');

const SHOT_ROOT = path.join(__dirname, '..', 'assets', 'screenshots');
const THEMES = ['dark', 'light'];
const VIEWPORTS = ['mobile', 'desktop'];
const VIEWPORT_SIZES = {
  mobile: { width: 390, height: 844 },
  desktop: { width: 1280, height: 900 },
};
const SCROLL_MIN = 180;

const MAIN_TABS = [
  { id: 'stable', label: 'Stable' },
  { id: 'logs', label: 'Collection log' },
  { id: 'map', label: 'Shelf map' },
  { id: 'wishlist', label: 'Wishlist' },
  { id: 'accessories', label: 'Extras & playsets' },
  { id: 'stats', label: 'Stats hub' },
  { id: 'settings', label: 'Settings' },
];

const ONBOARDING_STEPS = [
  { id: 'step-1', label: 'Onboarding — welcome', step: 1 },
  { id: 'step-2', label: 'Onboarding — collection', step: 2 },
  { id: 'step-3', label: 'Onboarding — ready', step: 3 },
];

const SHEET_SHOTS = [
  { id: 'add-pony', label: 'Sheet — add pony', call: 'UI.openAdd()' },
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function shot(page, filePath) {
  ensureDir(path.dirname(filePath));
  await page.screenshot({ path: filePath, fullPage: false });
}

function ensureItem(section, id, label) {
  let item = section.items.find((i) => i.id === id);
  if (!item) {
    item = { id, label, files: {}, scroll: {} };
    section.items.push(item);
  }
  return item;
}

function setShotRef(item, theme, viewport, relPath, scroll = false) {
  const field = scroll ? 'scroll' : 'files';
  const cur = item[field][theme];
  if (!cur || typeof cur === 'string') {
    item[field][theme] = typeof cur === 'string' ? { mobile: cur } : {};
  }
  item[field][theme][viewport] = relPath;
}

function pickThemePath(files, theme, viewport = 'mobile') {
  const bucket = files?.[theme];
  if (!bucket) return '';
  if (typeof bucket === 'string') return bucket;
  return bucket[viewport] || bucket.mobile || '';
}

async function setGalleryViewport(page, viewport) {
  await page.setViewportSize(VIEWPORT_SIZES[viewport]);
  await page.evaluate(() => {
    if (typeof Nav !== 'undefined' && Nav._renderSidebar) {
      const tab = document.querySelector('.nav-btn.on')?.dataset.tab || 'stable';
      Nav._renderSidebar(tab);
    }
    window.dispatchEvent(new Event('resize'));
  });
  await page.waitForTimeout(300);
  if (viewport === 'desktop') {
    await expect(page.locator('#cap-nav-sidebar')).toBeVisible({ timeout: 8000 }).catch(() => {});
  }
}

async function applyTheme(page, theme) {
  await page.evaluate((t) => {
    S.settings.darkMode = t === 'dark';
    Theme.apply();
    Store.save();
  }, theme);
  await page.waitForFunction(
    (t) => document.documentElement.classList.contains('dark-mode') === (t === 'dark'),
    theme,
    { timeout: 5000 },
  );
  await page.waitForTimeout(200);
}

async function verifyThemeBeforeShot(page, theme) {
  const ok = await page.evaluate(
    (t) => document.documentElement.classList.contains('dark-mode') === (t === 'dark'),
    theme,
  );
  if (!ok) throw new Error(`Theme mismatch before shot: wanted ${theme}`);
}

async function scrollMainTop(page) {
  await page.evaluate(() => {
    const el = document.querySelector('.main');
    if (el) el.scrollTop = 0;
  });
}

async function maybeScrollShot(page, relPath, item, theme, viewport) {
  const overflow = await page.evaluate(() => {
    const el = document.querySelector('.main');
    if (!el) return 0;
    return el.scrollHeight - el.clientHeight;
  });
  if (overflow < SCROLL_MIN) return null;
  await page.evaluate(() => {
    const el = document.querySelector('.main');
    if (el) el.scrollTop = el.scrollHeight;
  });
  await page.waitForTimeout(250);
  const scrollRel = relPath.replace(/\.png$/, '-scroll.png');
  await shot(page, path.join(SHOT_ROOT, scrollRel));
  setShotRef(item, theme, viewport, scrollRel, true);
  return scrollRel;
}

async function goTab(page, tabId) {
  await dismissOverlays(page);
  await page.evaluate((id) => Nav.go(id), tabId);
  await expect(page.locator(`#tab-${tabId}.on`)).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(400);
}

async function showOnboardingStep(page, step) {
  await hideDemoBanner(page);
  await page.evaluate((targetStep) => {
    document.getElementById('splash')?.classList.add('hide');
    document.getElementById('app').style.display = 'none';
    const ob = document.getElementById('onboard');
    if (ob) {
      ob.classList.remove('hide');
      ob.style.display = 'flex';
    }
    ['ob1', 'ob2', 'ob3'].forEach((id, i) => {
      const el = document.getElementById(id);
      if (el) el.style.display = i + 1 === targetStep ? 'block' : 'none';
    });
  }, step);
}

async function captureViewport(page, theme, viewport, section, id, label, relPath, allowScroll = true) {
  await scrollMainTop(page);
  await verifyThemeBeforeShot(page, theme);
  await page.waitForTimeout(200);
  await shot(page, path.join(SHOT_ROOT, relPath));
  const item = ensureItem(section, id, label);
  setShotRef(item, theme, viewport, relPath, false);
  if (allowScroll) await maybeScrollShot(page, relPath, item, theme, viewport);
}

test.describe('DeePonyCap screen gallery', () => {
  test.skip(() => process.env.CAPTURE_SCREENSHOTS !== '1', 'set CAPTURE_SCREENSHOTS=1 to regenerate');

  test('capture all screens for gallery', async ({ page }) => {
    test.setTimeout(1200000);

    const manifest = { generatedAt: new Date().toISOString(), themes: THEMES, viewports: VIEWPORTS, sections: [] };
    const sectionMap = {};
    const getSection = (id, title) => {
      if (!sectionMap[id]) {
        sectionMap[id] = { id, title, label: title, items: [] };
        manifest.sections.push(sectionMap[id]);
      }
      return sectionMap[id];
    };

    for (const theme of THEMES) {
      for (const viewport of VIEWPORTS) {
        await page.goto('/?demo=1');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForFunction(() => typeof Theme !== 'undefined', { timeout: 30000 });
        await setGalleryViewport(page, viewport);
        await applyTheme(page, theme);

        const onboardSection = getSection('onboarding', 'Onboarding');
        for (const step of ONBOARDING_STEPS) {
          await showOnboardingStep(page, step.step);
          await page.waitForTimeout(300);
          await captureViewport(page, theme, viewport, onboardSection, step.id, step.label, `${theme}/${viewport}/onboarding/${step.id}.png`, false);
        }
      }
    }

    await fastGalleryUnlock(page);
    await hideDemoBanner(page);

    for (const theme of THEMES) {
      for (const viewport of VIEWPORTS) {
        await setGalleryViewport(page, viewport);
        await applyTheme(page, theme);
        await hideDemoBanner(page);

        const tabsSection = getSection('tabs', 'Main tabs');
        for (const tab of MAIN_TABS) {
          await goTab(page, tab.id);
          if (tab.id === 'logs') {
            await page.locator('.log-chips .chip').filter({ hasText: 'G4' }).click().catch(() => {});
            await page.waitForTimeout(300);
          }
          await captureViewport(page, theme, viewport, tabsSection, tab.id, tab.label, `${theme}/${viewport}/tabs/${tab.id}.png`);
        }

        await goTab(page, 'stats');
        await page.evaluate(() => { if (typeof Excellence !== 'undefined') Excellence.renderStorybook(); });
        await page.waitForTimeout(500);
        await captureViewport(page, theme, viewport, tabsSection, 'storybook', 'Storybook', `${theme}/${viewport}/tabs/storybook.png`);

        const sheetsSection = getSection('sheets', 'Sheets');
        await goTab(page, 'stable');
        for (const sheet of SHEET_SHOTS) {
          await dismissOverlays(page);
          await page.evaluate((call) => { eval(call); }, sheet.call);
          await expect(page.locator('#sheet.on')).toBeVisible({ timeout: 10000 });
          await page.waitForTimeout(300);
          const rel = `${theme}/${viewport}/sheets/${sheet.id}.png`;
          await verifyThemeBeforeShot(page, theme);
          await shot(page, path.join(SHOT_ROOT, rel));
          setShotRef(ensureItem(sheetsSection, sheet.id, sheet.label), theme, viewport, rel, false);
          await dismissOverlays(page);
        }
      }
    }

    fs.writeFileSync(path.join(SHOT_ROOT, 'manifest.json'), JSON.stringify(manifest, null, 2));

    const stable = manifest.sections.find((s) => s.id === 'tabs')?.items.find((i) => i.id === 'stable');
    const stableDark = pickThemePath(stable?.files, 'dark', 'mobile');
    const stableLight = pickThemePath(stable?.files, 'light', 'mobile');
    if (stableDark) fs.copyFileSync(path.join(SHOT_ROOT, stableDark), path.join(SHOT_ROOT, 'deeponycap-1-dark.png'));
    if (stableLight) fs.copyFileSync(path.join(SHOT_ROOT, stableLight), path.join(SHOT_ROOT, 'deeponycap-1-light.png'));
  });
});
