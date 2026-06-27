// @ts-check
const { test, expect } = require('@playwright/test');
const { navTab } = require('./nav-helpers');

test.describe('DeePonyCap excellence v2.7', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=1');
    await page.waitForFunction(() => document.getElementById('app')?.style.display === 'flex', { timeout: 15000 });
  });

  test('fuzzy search finds pony by partial name', async ({ page }) => {
    await navTab(page, 'logs').click();
    await page.locator('.log-chips .chip').filter({ hasText: 'G4' }).click();
    await page.locator('#tab-logs .search').fill('twil');
    await page.waitForTimeout(300);
    await expect(page.locator('#tab-logs').getByText('Twilight Sparkle').first()).toBeVisible({ timeout: 5000 });
  });

  test('stats shows insights and premium views', async ({ page }) => {
    await page.getByRole('button', { name: /Stats/i }).click();
    await expect(page.getByText('Collection insights')).toBeVisible();
    await expect(page.getByRole('button', { name: /Collection Timeline/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Storybook Mode/i })).toBeVisible();
  });

  test('storybook mode renders album pages', async ({ page }) => {
    await page.getByRole('button', { name: /Stats/i }).click();
    await page.getByRole('button', { name: /Storybook Mode/i }).click();
    await expect(page.getByRole('heading', { name: /Collection Storybook/i })).toBeVisible();
    await expect(page.locator('.storybook-page').first()).toBeVisible();
  });

  test('timeline shows acquisition journey', async ({ page }) => {
    await page.getByRole('button', { name: /Stats/i }).click();
    await page.getByRole('button', { name: /Collection Timeline/i }).click();
    await expect(page.getByRole('heading', { name: /Collection Timeline/i })).toBeVisible();
  });

  test('pony passport opens from collection card', async ({ page }) => {
    await navTab(page, 'logs').click();
    await page.locator('.log-chips .chip').filter({ hasText: 'G4' }).click();
    await page.locator('.view-toggle .opt').filter({ hasText: 'Cards' }).click();
    await page.locator('#tab-logs .pony-card').first().click();
    await expect(page.locator('#sheet.on')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#sheet').getByText(/Passport/i).first()).toBeVisible();
    await expect(page.locator('#sheet').getByRole('button', { name: /Clone/i })).toBeVisible();
  });

  test('accessory gallery has search and categories', async ({ page }) => {
    await navTab(page, 'accessories').click();
    await expect(page.locator('.search[aria-label="Search accessories"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'playset' })).toBeVisible();
  });

  test('sheet closes with Escape', async ({ page }) => {
    await navTab(page, 'logs').click();
    await page.locator('.log-chips .chip').filter({ hasText: 'G4' }).click();
    await page.locator('.view-toggle .opt').filter({ hasText: 'Cards' }).click();
    await page.locator('#tab-logs .pony-card').first().click();
    await expect(page.locator('#sheet.on')).toBeVisible({ timeout: 5000 });
    await page.keyboard.press('Escape');
    await expect(page.locator('#sheet.on')).toHaveCount(0, { timeout: 3000 });
  });

  test('settings has collection tools and recovery', async ({ page }) => {
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByText('Collection tools')).toBeVisible();
    await expect(page.getByRole('button', { name: /Recover auto-snapshot/i })).toBeVisible();
  });

  test('stable shows smart suggestions', async ({ page }) => {
    await navTab(page, 'stable').click();
    await expect(page.getByText(/Smart suggestions|Collection goals/i).first()).toBeVisible();
  });

  test('manifest shortcuts defined', async ({ page }) => {
    const res = await page.request.get('/manifest.json');
    const manifest = await res.json();
    expect(manifest.shortcuts?.length).toBeGreaterThanOrEqual(2);
  });
});
