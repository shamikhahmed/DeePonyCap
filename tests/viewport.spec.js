// @ts-check
const { test, expect } = require('@playwright/test');
const {
  resize,
  assertCapSharedMobile,
  assertCapSharedDesktop,
  gridColumnCount,
} = require('./helpers/viewport-helpers');

test.describe('DeePonyCap viewport contract', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=1');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => document.getElementById('app')?.style.display === 'flex', { timeout: 15000 });
  });

  test('375px — phone shell and bottom nav', async ({ page }) => {
    await resize(page, 'mobile');
    await assertCapSharedMobile(page, expect);
  });

  test('1280px — sidebar and full-width main', async ({ page }) => {
    await resize(page, 'desktop');
    await assertCapSharedDesktop(page, expect);
  });

  test('1680px — ultra-wide type grid expands', async ({ page }) => {
    await resize(page, 'ultraWide');
    await assertCapSharedDesktop(page, expect);
    const typeGrid = page.locator('#tab-stable .type-grid');
    await expect(typeGrid).toBeVisible({ timeout: 10000 });
    const cols = await gridColumnCount(typeGrid);
    expect(cols).toBeGreaterThanOrEqual(6);
  });

  test('375px — no content clipped behind bottom nav on primary tabs', async ({ page }) => {
    await resize(page, 'mobile');
    for (const tab of ['stable', 'logs', 'map', 'wishlist', 'accessories']) {
      await page.locator(`nav.nav .nav-btn[data-tab="${tab}"]`).click();
      await page.waitForTimeout(400);
      const ok = await page.evaluate(() => {
        const main = document.querySelector('.main');
        const nav = document.querySelector('nav.nav');
        if (!main || !nav) return false;
        main.scrollTop = main.scrollHeight;
        // .main padding-bottom (var(--main-pad-b)) is the anti-clip contract.
        const pad = parseFloat(getComputedStyle(main).paddingBottom) || 0;
        const navH = nav.getBoundingClientRect().height;
        if (pad + 1 < navH) return false;
        const contentBottom = main.getBoundingClientRect().bottom - pad;
        return contentBottom <= nav.getBoundingClientRect().top + 2;
      });
      expect(ok, `tab ${tab}: content clear of bottom nav`).toBe(true);
    }
  });
});
