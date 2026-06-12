// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('DeePonyCap smoke', () => {
  test('loads shell without fatal errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toBeVisible();
    await page.waitForTimeout(800);
    const fatal = errors.filter(e => !/serviceWorker|ResizeObserver|favicon/i.test(e));
    expect(fatal).toEqual([]);
  });

  test('manifest link present', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
  });

  test('accessories gallery loads', async ({ page }) => {
    await page.goto('/?demo=1');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => document.getElementById('app')?.style.display === 'flex', { timeout: 15000 });
    await page.locator('[onclick*="Nav.go(\'accessories\')"]').click();
    await expect(page.locator('#tab-accessories.on')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Accessory Gallery/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /Add Accessory/i })).toBeVisible();
  });
});
