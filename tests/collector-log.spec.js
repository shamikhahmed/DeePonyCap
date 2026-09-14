// @ts-check
const { test, expect } = require('@playwright/test');
const { navTab } = require('./nav-helpers');

test.describe('DeePonyCap collector logs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=1');
    await page.waitForFunction(() => document.getElementById('app')?.style.display === 'flex', { timeout: 15000 });
  });

  test('series log has print register button', async ({ page }) => {
    await navTab(page, 'logs').click();
    await page.locator('.log-chips .chip').filter({ hasText: 'Dawn Line' }).click();
    await expect(page.getByRole('button', { name: /Print \/ Save PDF/i })).toBeVisible();
  });

  test('Promo log groups by country and year', async ({ page }) => {
    await navTab(page, 'logs').click();
    await page.locator('.log-chips .chip').filter({ hasText: 'Promo toys' }).click();
    await expect(page.locator('.mcd-country-chips .chip').filter({ hasText: 'USA' })).toBeVisible();
    await expect(page.locator('.mcd-country-hdr').filter({ hasText: 'USA' })).toBeVisible();
    await expect(page.locator('.mcd-year-hdr').filter({ hasText: '2014' })).toBeVisible();
    await page.locator('.mcd-country-chips .chip').filter({ hasText: 'UK' }).click();
    await expect(page.locator('.mcd-country-hdr').filter({ hasText: 'UK' })).toBeVisible();
    await expect(page.locator('.mcd-country-hdr').filter({ hasText: 'USA' })).toHaveCount(0);
  });

  test('print register builds printable HTML', async ({ page }) => {
    await navTab(page, 'logs').click();
    await page.locator('.log-chips .chip').filter({ hasText: 'Dawn Line' }).click();
    const result = await page.evaluate(() => {
      let written = '';
      const orig = window.open;
      window.open = () => ({
        document: { write: (s) => { written = s; }, close: () => {} },
        onload: null,
        print: () => {},
      });
      const id = CollectorSuite.logSections().find(s => s.label === 'Dawn Line')?.id;
      logFilter.logSection = id;
      CollectorSuite.exportGenerationLogPrint(id);
      window.open = orig;
      return written;
    });
    expect(result).toContain('Dawn Line Collection Log');
    expect(result).toContain('<table>');
    expect(result).toContain('Clover Gleam');
  });
});
