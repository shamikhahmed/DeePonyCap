// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('DeePonyCap v2.8', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=1');
    await page.waitForFunction(() => document.getElementById('app')?.style.display === 'flex', { timeout: 15000 });
  });

  test('IndexedDB DataStore loads', async ({ page }) => {
    const hasStore = await page.evaluate(() => !!window.DataStore);
    expect(hasStore).toBe(true);
    await page.waitForTimeout(500);
    const pointer = await page.evaluate(() => localStorage.getItem('deeponycap_idb_pointer'));
    expect(pointer).toBeTruthy();
  });

  test('parent PIN opens sheet not prompt', async ({ page }) => {
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('button', { name: /Set Parent PIN/i }).click();
    await expect(page.locator('#sheet.on')).toBeVisible();
    await expect(page.locator('#pinInput')).toBeVisible();
    await expect(page.getByText(/Parents only/i)).toBeVisible();
  });

  test('storybook has print PDF button', async ({ page }) => {
    await page.getByRole('button', { name: /Stats/i }).click();
    await page.getByRole('button', { name: /Storybook Mode/i }).click();
    await expect(page.getByRole('button', { name: /Print \/ Save as PDF/i })).toBeVisible();
  });

  test('settings has G4 bulk import', async ({ page }) => {
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('button', { name: /G4 bulk photo import/i })).toBeVisible();
  });

  test('storage shows IndexedDB messaging', async ({ page }) => {
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.waitForTimeout(600);
    await expect(page.getByText(/IndexedDB/i).first()).toBeVisible({ timeout: 8000 });
  });
});
