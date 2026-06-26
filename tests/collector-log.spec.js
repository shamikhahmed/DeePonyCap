// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('DeePonyCap collector logs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=1');
    await page.waitForFunction(() => document.getElementById('app')?.style.display === 'flex', { timeout: 15000 });
  });

  test('generation log has print register button', async ({ page }) => {
    await page.locator('[data-tab="logs"]').click();
    await page.locator('.log-chips .chip').filter({ hasText: 'G4' }).click();
    await expect(page.getByRole('button', { name: /Print \/ Save PDF/i })).toBeVisible();
  });

  test('McDonald\'s log groups by country and year', async ({ page }) => {
    await page.locator('[data-tab="logs"]').click();
    await page.locator('.log-chips .chip').filter({ hasText: "McDonald's" }).click();
    await expect(page.locator('.mcd-country-chips .chip').filter({ hasText: 'USA' })).toBeVisible();
    await expect(page.locator('.mcd-country-hdr').filter({ hasText: 'USA' })).toBeVisible();
    await expect(page.locator('.mcd-year-hdr').filter({ hasText: '2014' })).toBeVisible();
    await page.locator('.mcd-country-chips .chip').filter({ hasText: 'UK' }).click();
    await expect(page.locator('.mcd-country-hdr').filter({ hasText: 'UK' })).toBeVisible();
    await expect(page.locator('.mcd-country-hdr').filter({ hasText: 'USA' })).toHaveCount(0);
  });

  test('print register builds printable HTML', async ({ page }) => {
    await page.locator('[data-tab="logs"]').click();
    await page.locator('.log-chips .chip').filter({ hasText: 'G1' }).click();
    const result = await page.evaluate(() => {
      let written = '';
      const orig = window.open;
      window.open = () => ({
        document: { write: (s) => { written = s; }, close: () => {} },
        onload: null,
        print: () => {},
      });
      logFilter.logSection = 'g1';
      CollectorSuite.exportGenerationLogPrint('g1');
      window.open = orig;
      return written;
    });
    expect(result).toContain('G1 Collection Log');
    expect(result).toContain('<table>');
    expect(result).toContain('Baby Cotton Candy');
  });
});
