// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('PONY-P0-01 IP + user data integrity', () => {
  test('bundled shell has no third-party IP strings', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const html = await page.content();
    const banned = [
      'My Little Pony', 'Hasbro', 'Rainbow Dash', 'Twilight Sparkle',
      'Fluttershy', 'Pinkie Pie', 'Applejack', 'COPPA', 'Mane Six',
    ];
    for (const b of banned) {
      expect(html, `banned string in document: ${b}`).not.toContain(b);
    }
  });

  test('demo uses invented names only', async ({ page }) => {
    await page.goto('/?demo=1');
    await page.waitForFunction(() => document.getElementById('app')?.style.display === 'flex', { timeout: 15000 });
    await expect(page.getByText('Clover Gleam').first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Twilight Sparkle')).toHaveCount(0);
    await expect(page.getByText('Rainbow Dash')).toHaveCount(0);
  });

  test('user-entered official-looking name is preserved on save/reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof Store !== 'undefined' && typeof UI !== 'undefined', { timeout: 15000 });
    await page.evaluate(async () => {
      document.getElementById('splash')?.classList.add('hide');
      document.getElementById('onboard')?.classList.add('hide');
      const app = document.getElementById('app');
      if (app) app.style.display = 'flex';
      S.onboardingDone = true;
      S.ponies = [];
      S.seriesList = ['Dawn Line'];
      S.ponies.push(normalizePony({
        id: 'user_keep_1',
        name: 'Rainbow Dash',
        series: 'Dawn Line',
        generation: 1,
        type: 'mlp',
        category: 'mlp',
        colour: 'Blue',
        size: 'standard',
        shelf: 'Shelf 1',
        isOriginal: true,
        condition: 'mint',
        photos: [],
        photo: null,
        acquiredDate: '2020-01-01',
        notes: 'User typed this name',
        createdAt: Date.now(),
      }));
      await Store.save();
      await Store.load();
    });
    const kept = await page.evaluate(() => {
      const p = S.ponies.find(x => x.id === 'user_keep_1');
      return p ? { name: p.name, notes: p.notes, series: p.series } : null;
    });
    expect(kept).toEqual({
      name: 'Rainbow Dash',
      notes: 'User typed this name',
      series: 'Dawn Line',
    });
  });

  test('About shows non-affiliation line', async ({ page }) => {
    await page.goto('/?demo=1');
    await page.waitForFunction(() => document.getElementById('app')?.style.display === 'flex', { timeout: 15000 });
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByText(/independent collection tracker and isn't affiliated/i)).toBeVisible();
  });

  test('settings uses switches and FAB hidden on settings', async ({ page }) => {
    await page.goto('/?demo=1');
    await page.waitForFunction(() => document.getElementById('app')?.style.display === 'flex', { timeout: 15000 });
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.locator('#tab-settings.on')).toBeVisible();
    await expect(page.locator('.cap-switch[role="switch"]').first()).toBeVisible();
    await expect(page.locator('.fab')).toBeHidden();
  });
});
