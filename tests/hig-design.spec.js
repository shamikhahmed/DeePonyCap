// @ts-check
/**
 * HIG design gate — Stable (collection), add pony sheet, Logs, Wishlist, Settings; light + dark; iPad sidebar.
 * Captures before/after evidence when HIG_SHOTS=<label> (writes build/qa/hig/<label>/).
 */
const { test, expect } = require('@playwright/test');
const path = require('path');

const LABEL = process.env.HIG_SHOTS || '';
const OUT = path.join(__dirname, '..', 'build', 'qa', 'hig', LABEL || 'tmp');

async function shot(page, name) {
  if (!LABEL) return;
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join(OUT, name + '.png') });
}

async function boot(page, dark) {
  await page.goto('/?demo=1');
  await page.waitForFunction(() => document.getElementById('app')?.style.display === 'flex' && typeof Nav !== 'undefined', { timeout: 30000 });
  await page.evaluate((d) => {
    document.getElementById('proUpgradeModal')?.classList.remove('on');
    if (typeof UI !== 'undefined' && UI.closeSheet) UI.closeSheet();
    S.settings.darkMode = d;
    Theme.apply();
    Render.all();
  }, dark);
  await page.waitForTimeout(600);
}

async function go(page, tab) {
  await page.evaluate((t) => { if (typeof UI !== 'undefined' && UI.closeSheet) UI.closeSheet(); Nav.go(t); }, tab);
  await page.waitForTimeout(600);
}

for (const theme of ['light', 'dark']) {
  test.describe(`HIG phone · ${theme}`, () => {
    test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });

    test(`stable, add, logs, wishlist, settings (${theme})`, async ({ page }) => {
      await boot(page, theme === 'dark');
      await go(page, 'stable');
      await shot(page, `phone-${theme}-01-stable`);

      const tabs = page.locator('#nav .nav-btn');
      await expect(tabs).toHaveCount(5);
      for (const h of await tabs.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height))) {
        expect.soft(h).toBeGreaterThanOrEqual(44);
      }

      await page.evaluate(() => UI.openAdd());
      await page.waitForTimeout(600);
      await shot(page, `phone-${theme}-02-add`);
      await page.evaluate(() => UI.closeSheet());

      await go(page, 'logs');
      await shot(page, `phone-${theme}-03-logs`);
      await go(page, 'wishlist');
      await shot(page, `phone-${theme}-04-wishlist`);
      await go(page, 'settings');
      await shot(page, `phone-${theme}-05-settings`);
    });
  });
}

test.describe('HIG iPad · sidebar', () => {
  test.use({ viewport: { width: 1180, height: 820 } });

  test('sidebar shell + stable', async ({ page }) => {
    await boot(page, false);
    await go(page, 'stable');
    await expect(page.locator('#cap-nav-sidebar')).toBeVisible();
    await shot(page, 'ipad-light-01-stable');
    await go(page, 'logs');
    await shot(page, 'ipad-light-02-logs');
  });
});
