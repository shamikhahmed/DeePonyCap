#!/usr/bin/env node
/**
 * iPhone/WebKit behaviour check (Cap fleet mobile bugs), adapted from ScentCap scripts/ios-behaviour-check.mjs.
 * Usage: npm run serve  →  node scripts/ios-behaviour-check.mjs [baseUrl]   (default http://127.0.0.1:8770/)
 * Checks: tab bar + header tappable, no sideways overflow, the document (not an inner box) scrolls,
 * navigation opens at top without reloading, sheets keep the page position, inputs ≥16px, SW doesn't self-activate.
 */
import { webkit, devices } from '@playwright/test';
import fs from 'node:fs';

const BASE = process.argv[2] || 'http://127.0.0.1:8770/';
const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok, detail });
const step = async (name, fn) => {
  try {
    await fn();
  } catch (e) {
    check(name, false, String(e.message || e).split('\n')[0]);
  }
};

const browser = await webkit.launch();
const ctx = await browser.newContext({ ...devices['iPhone 15 Pro'], serviceWorkers: 'block' });
const page = await ctx.newPage();
page.setDefaultTimeout(8000);
await page.goto(BASE + '?demo=1');
await page.waitForFunction(() => document.getElementById('app')?.style.display === 'flex' && typeof Nav !== 'undefined', { timeout: 45000 });
await page.evaluate(() => { document.getElementById('proUpgradeModal')?.classList.remove('on'); if (typeof UI !== 'undefined') UI.closeSheet(); });
await page.waitForTimeout(1200);
await page.evaluate(() => { window.__noReload = 1; });

// 1. Tabs + top-bar controls are the topmost element at their centre, ≥44pt
const covered = await page.evaluate(() =>
  [...document.querySelectorAll('#nav .nav-btn, .app-add-btn, .app-settings-btn')]
    .filter((t) => t.offsetParent !== null)
    .filter((t) => {
      const r = t.getBoundingClientRect();
      const bar = document.querySelector('#nav')?.getBoundingClientRect();
      if (t.matches('.app-add-btn, .app-settings-btn')) { const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !t.contains(h); }
      // Only controls on screen above the floating bar (the rest scroll into view first)
      if (t.closest('#nav') === null && (r.bottom > (bar ? bar.top : innerHeight) || r.top < 0)) return false;
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !t.contains(hit);
    })
    .map((t) => t.getAttribute('aria-label') || t.textContent.trim()),
);
check('tab bar + top bar tappable', covered.length === 0, covered.join(','));
const small = await page.evaluate(() =>
  [...document.querySelectorAll('#nav .nav-btn, .app-add-btn, .app-settings-btn')]
    .filter((t) => t.offsetParent !== null)
    .filter((t) => { const r = t.getBoundingClientRect(); return r.width < 44 || r.height < 34; })
    .map((t) => t.getAttribute('aria-label') || t.textContent.trim()),
);
check('hit areas (tabs ≥44pt, pills ≥34pt + slop)', small.length === 0, small.join(','));

// 2. The document scrolls; no sideways overflow
for (const tab of ['stable', 'logs', 'map', 'wishlist', 'accessories']) {
  await page.evaluate((t) => Nav.go(t), tab);
  await page.waitForTimeout(600);
  const m = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    iw: innerWidth,
    docScroll: document.scrollingElement.scrollHeight > innerHeight,
    inner: getComputedStyle(document.getElementById('main')).overflowY,
  }));
  check(`no sideways overflow · ${tab}`, m.sw <= m.iw + 1, `${m.sw} > ${m.iw}`);
  check(`document scrolls (no inner scroller) · ${tab}`, m.docScroll && m.inner === 'visible', JSON.stringify(m));
}

// 2b. The document really scrolls (and instantly — no smooth-scroll animation)
check('programmatic scroll lands instantly', await page.evaluate(() => { window.scrollTo(0, 300); const y = window.scrollY; window.scrollTo(0, 0); return y >= 250; }));

// 3. Tab tap: new screen at top, no reload
await step('navigation by tapping', async () => {
  await page.evaluate(() => Nav.go('stable'));
  await page.waitForTimeout(500);
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(200);
  await page.locator('#nav .nav-btn[data-tab="logs"]').tap();
  await page.waitForTimeout(700);
  const nav = await page.evaluate(() => ({ y: scrollY, tab: document.querySelector('.screen.on')?.id, marker: window.__noReload }));
  check('tab tap navigates (no reload)', nav.tab === 'tab-logs' && nav.marker === 1, JSON.stringify(nav));
  check('new screen opens at top', nav.y === 0, `scrollY ${nav.y}`);
});

// 4. Sheet keeps the page position (Stable → + → Cancel)
let smallInputs = 0;
await step('sheet flow', async () => {
  await page.evaluate(() => Nav.go('stable'));
  await page.waitForTimeout(500);
  await page.evaluate(() => window.scrollTo(0, 300));
  await page.waitForTimeout(300);
  const before = await page.evaluate(() => scrollY);
  await page.locator('.app-add-btn').tap();
  await page.locator('#sheet.on .sheet-bar-cancel').waitFor();
  await page.waitForTimeout(300);
  const locked = await page.evaluate(() => document.body.style.position);
  smallInputs = await page.evaluate(() =>
    [...document.querySelectorAll('#sheet input, #sheet select, #sheet textarea')]
      .filter((el) => el.offsetParent !== null && parseFloat(getComputedStyle(el).fontSize) < 16).length,
  );
  await page.locator('#sheet .sheet-bar-cancel').tap();
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => scrollY);
  check('page locked behind sheet', locked === 'fixed', `body position "${locked}"`);
  check('sheet keeps scroll position', Math.abs(after - before) < 4, `before ${before} after ${after}`);
});
check('inputs ≥16px (no zoom-on-focus)', smallInputs === 0, `${smallInputs} small`);
check('no reload during session', (await page.evaluate(() => window.__noReload)) === 1);

// 6. Service worker never self-activates over a running app
const sw = fs.readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
check('SW: no auto skipWaiting/clients.claim', !/^\s*self\.skipWaiting\(\);|clients\.claim\(\)|\.then\(\(\) => self\.skipWaiting\(\)\)/m.test(sw));

await browser.close();
let fail = 0;
for (const r of results) {
  if (!r.ok) fail++;
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok || !r.detail ? '' : `  (${r.detail})`}`);
}
process.exit(fail ? 1 : 0);
