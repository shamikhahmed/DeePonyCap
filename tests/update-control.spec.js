// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('DeePonyCap v2.9 update control', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=1');
    await page.waitForFunction(() => document.getElementById('app')?.style.display === 'flex', { timeout: 15000 });
  });

  test('settings shows app version and update controls', async ({ page }) => {
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.locator('.section-title').filter({ hasText: 'App version' })).toBeVisible();
    await expect(page.getByText(/Running v3\.0/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Check for updates/i })).toBeVisible();
    await expect(page.getByText(/Auto-update/i)).toBeVisible();
  });

  test('AppUpdate module registered', async ({ page }) => {
    const ok = await page.evaluate(() => typeof window.AppUpdate?.register === 'function');
    expect(ok).toBe(true);
  });

  test('service worker waits for user consent before activating', async ({ page }) => {
    const res = await page.request.get('/sw.js');
    const body = await res.text();
    const installBlock = body.slice(body.indexOf("addEventListener('install'"), body.indexOf("addEventListener('message'"));
    expect(installBlock).not.toContain('skipWaiting');
    expect(body).toContain('SKIP_WAITING');
  });

  test('migrations module present', async ({ page }) => {
    const ok = await page.evaluate(() => window.Migrations?.CURRENT >= 4);
    expect(ok).toBe(true);
  });
});
