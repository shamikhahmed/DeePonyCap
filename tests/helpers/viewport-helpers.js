// @ts-check
/** Shared Playwright helpers — 375px mobile + 1280px desktop contract checks */

const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  desktop: { width: 1280, height: 800 },
  ultraWide: { width: 1680, height: 900 },
};

/** @param {import('@playwright/test').Page} page */
async function resize(page, name) {
  const vp = VIEWPORTS[name];
  if (!vp) throw new Error(`Unknown viewport: ${name}`);
  await page.setViewportSize(vp);
  // Cap fleet shell breakpoint is ≥700 (iPad mini → sidebar), not 900
  await page.evaluate(() => {
    if (window.CapDesktopNav && typeof window.CapDesktopNav.sync === 'function') {
      window.CapDesktopNav.sync();
    }
  });
  await page.waitForFunction(
    (w) => {
      const desktop = w >= 700;
      if (typeof window.CapDesktopNav !== 'undefined') {
        return document.body.classList.contains('cap-desktop-nav') === desktop;
      }
      if (document.getElementById('nav-sidebar')) {
        return document.body.classList.contains('lc-desktop-nav') === desktop;
      }
      return true;
    },
    vp.width,
    { timeout: 5000 },
  ).catch(() => {});
  await page.waitForTimeout(120);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Expect} ex
 */
async function assertCapSharedMobile(page, ex) {
  await page.waitForFunction(() => {
    const side = document.getElementById('cap-nav-sidebar');
    return side && getComputedStyle(side).display === 'none';
  }, null, { timeout: 8000 });
  await ex(page.locator('#nav')).toBeVisible();
  await ex(page.locator('body')).not.toHaveClass(/cap-desktop-nav/);
  const app = page.locator('#app');
  const box = await app.boundingBox();
  ex(box?.width ?? 0).toBeLessThanOrEqual(430);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Expect} ex
 */
async function assertCapSharedDesktop(page, ex) {
  await ex(page.locator('#cap-nav-sidebar')).toBeVisible();
  await ex(page.locator('#nav')).toBeHidden();
  await ex(page.locator('body')).toHaveClass(/cap-desktop-nav/);
  const shell = page.locator('.cap-desktop-shell');
  const box = await shell.boundingBox();
  ex(box?.width ?? 0).toBeGreaterThan(900);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Expect} ex
 */
async function assertLedgerCapMobile(page, ex) {
  await ex(page.locator('#nav-sidebar')).toBeHidden();
  const navBtn = page.locator('#nav .psx-nav-btn, #nav .nav-tab').first();
  await ex(navBtn).toBeVisible();
  await ex(page.locator('#nav')).toBeVisible();
  await ex(page.locator('body')).not.toHaveClass(/lc-desktop-nav/);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Expect} ex
 */
async function assertLedgerCapDesktop(page, ex) {
  await ex(page.locator('#nav-sidebar')).toBeVisible();
  await ex(page.locator('#nav')).toBeHidden();
  await ex(page.locator('body')).toHaveClass(/lc-desktop-nav/);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Expect} ex
 */
async function assertVaultCapMobile(page, ex) {
  await ex(page.locator('#sidebar')).toBeHidden();
  await ex(page.locator('.btabs')).toBeVisible();
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Expect} ex
 */
async function assertVaultCapDesktop(page, ex) {
  await ex(page.locator('#sidebar')).toBeVisible();
  await ex(page.locator('.btabs')).toBeHidden();
}

/** @param {import('@playwright/test').Locator} gridLocator */
async function gridColumnCount(gridLocator) {
  return gridLocator.evaluate((el) => {
    const cols = getComputedStyle(el).gridTemplateColumns.trim();
    if (!cols || cols === 'none') return 0;
    return cols.split(/\s+/).length;
  });
}

module.exports = {
  VIEWPORTS,
  resize,
  assertCapSharedMobile,
  assertCapSharedDesktop,
  assertLedgerCapMobile,
  assertLedgerCapDesktop,
  assertVaultCapMobile,
  assertVaultCapDesktop,
  gridColumnCount,
};
