// @ts-check

/** @param {import('@playwright/test').Page} page */
async function dismissOverlays(page) {
  await page.evaluate(() => {
    if (typeof UI !== 'undefined' && UI.closeSheet) UI.closeSheet();
    document.getElementById('proUpgradeModal')?.classList.remove('on');
  });
  await page.locator('#sheet.on').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
}

/** @param {import('@playwright/test').Page} page */
async function hideDemoBanner(page) {
  await page.evaluate(() => {
    const banner = document.getElementById('demoBanner');
    if (banner) banner.hidden = true;
  });
}

/** Fast demo unlock for screenshot gallery */
/** @param {import('@playwright/test').Page} page */
async function fastGalleryUnlock(page) {
  await page.goto('/?demo=1');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(
    () => document.getElementById('app')?.style.display === 'flex' && typeof Nav !== 'undefined',
    { timeout: 30000 },
  );
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    document.getElementById('splash')?.classList.add('hide');
    document.getElementById('onboard')?.classList.add('hide');
    Nav.go('stable');
  });
  await page.waitForSelector('#tab-stable.on', { timeout: 15000 });
  await dismissOverlays(page);
}

module.exports = { dismissOverlays, hideDemoBanner, fastGalleryUnlock };
