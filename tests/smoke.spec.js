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

  test('demo mode loads collection and wishlist', async ({ page }) => {
    await page.goto('/?demo=1');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => document.getElementById('app')?.style.display === 'flex', { timeout: 15000 });
    await expect(page.locator('#demoBanner')).toBeVisible();
    await page.locator('[data-tab="collection"]').click();
    await expect(page.locator('#tab-collection.on')).toBeVisible();
    await expect(page.locator('#tab-collection .pony-card').first()).toBeVisible({ timeout: 8000 });
    await page.locator('[data-tab="wishlist"]').click();
    await expect(page.getByText(/Must Have|on your list/i).first()).toBeVisible({ timeout: 8000 });
  });

  test('settings shows privacy and parent lock', async ({ page }) => {
    await page.goto('/?demo=1');
    await page.waitForFunction(() => document.getElementById('app')?.style.display === 'flex', { timeout: 15000 });
    await page.locator('[data-tab="settings"]').click();
    await expect(page.locator('#tab-settings.on')).toBeVisible();
    await expect(page.getByText('Parent Lock 🔒')).toBeVisible();
    await expect(page.getByRole('link', { name: /Privacy Policy/i })).toHaveAttribute('href', 'privacy.html');
    await expect(page.getByText(/100% on-device/i)).toBeVisible();
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

  test('privacy policy page is valid', async ({ page }) => {
    await page.goto('/privacy.html');
    await expect(page.getByRole('heading', { name: /Privacy Policy/i })).toBeVisible();
    await expect(page.getByText(/Nothing/i).first()).toBeVisible();
    await expect(page.getByText(/VaultCap|LedgerCap/i)).toHaveCount(0);
  });
});
