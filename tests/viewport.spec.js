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
});
