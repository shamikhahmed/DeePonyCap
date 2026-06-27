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
    await page.locator('#cap-nav-sidebar .cap-side-btn[data-tab="logs"], nav.nav .nav-btn[data-tab="logs"]').first().click();
    await expect(page.locator('#tab-logs.on')).toBeVisible();
    await page.locator('.log-chips .chip').filter({ hasText: 'G4' }).click();
    await expect(page.locator('#tab-logs .log-table').first()).toBeVisible({ timeout: 8000 });
    await page.locator('#cap-nav-sidebar .cap-side-btn[data-tab="wishlist"], nav.nav .nav-btn[data-tab="wishlist"]').first().click();
    await expect(page.getByText(/Must Have|on your list/i).first()).toBeVisible({ timeout: 8000 });
  });

  test('settings shows privacy and parent lock', async ({ page }) => {
    await page.goto('/?demo=1');
    await page.waitForFunction(() => document.getElementById('app')?.style.display === 'flex', { timeout: 15000 });
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.locator('#tab-settings.on')).toBeVisible();
    await expect(page.getByText('Parent Lock 🔒')).toBeVisible();
    await expect(page.getByRole('link', { name: /Privacy Policy/i })).toHaveAttribute('href', 'privacy.html');
    await expect(page.getByText(/100% on-device/i)).toBeVisible();
  });

  test('add pony sheet shows camera and gallery options', async ({ page }) => {
    await page.goto('/?demo=1');
    await page.waitForFunction(() => document.getElementById('app')?.style.display === 'flex', { timeout: 15000 });
    await page.evaluate(() => UI.openAdd());
    await expect(page.locator('#sheet.on')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /Camera/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Gallery/i })).toBeVisible();
  });

  test('accessories gallery loads', async ({ page }) => {
    await page.goto('/?demo=1');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => document.getElementById('app')?.style.display === 'flex', { timeout: 15000 });
    await page.locator('#cap-nav-sidebar .cap-side-btn[data-tab="accessories"], nav.nav .nav-btn[data-tab="accessories"]').first().click();
    await expect(page.locator('#tab-accessories.on')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Extras & Playsets/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /Add Accessory/i })).toBeVisible();
  });

  test('privacy policy page is valid', async ({ page }) => {
    await page.goto('/privacy.html');
    await expect(page.getByRole('heading', { name: /Privacy Policy/i })).toBeVisible();
    await expect(page.getByText(/Nothing/i).first()).toBeVisible();
    await expect(page.getByText(/VaultCap|LedgerCap/i)).toHaveCount(0);
  });
});
