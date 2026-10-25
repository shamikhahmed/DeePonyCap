#!/usr/bin/env node
/**
 * DeePonyCap post-deploy live smoke (WebKit · iPhone 15 Pro).
 * Reviewer runs outside the sandbox after Pages deploy:
 *
 *   node qa/release/live-smoke.mjs https://shamikhahmed.github.io/DeePonyCap/
 *
 * Asserts: app-ready, no console/pageerrors, no HTTP ≥400, VERSION 4.0.1,
 * core ios checks (tab bar tappable, document scrolls, sheet lock/restore,
 * swipe at top does not reload). Exit 1 on any FAIL.
 */
import { webkit, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const EXPECTED_VERSION = '4.0.1';
const LIVE_DEFAULT = 'https://shamikhahmed.github.io/DeePonyCap/';

const rawUrl = process.argv[2] || LIVE_DEFAULT;
let liveUrl;
try {
  liveUrl = new URL(rawUrl).href;
} catch {
  console.error('Usage: node qa/release/live-smoke.mjs <url>');
  process.exit(2);
}

function cacheBust(href) {
  const u = new URL(href);
  u.searchParams.set('smoke', String(Date.now()));
  return u.href;
}

function versionJsonUrl(href) {
  const u = new URL(href);
  const base = u.pathname.endsWith('/') ? u.pathname : `${u.pathname.replace(/\/?$/, '/')}`;
  u.pathname = `${base}VERSION.json`;
  u.search = '';
  u.hash = '';
  return u.href;
}

const rows = [];
const check = (name, ok, detail = '') => {
  rows.push({ name, status: ok ? 'PASS' : 'FAIL', detail: detail || '' });
};

const consoleErrors = [];
const pageErrors = [];
const httpBad = [];

let browser;
try {
  browser = await webkit.launch();
} catch (e) {
  console.error('WebKit launch failed (run outside sandbox):', String(e.message || e).split('\n')[0]);
  process.exit(2);
}

const iphone = devices['iPhone 15 Pro'];
const { defaultBrowserType: _omit, ...device } = iphone;
const ctx = await browser.newContext({ ...device, serviceWorkers: 'allow' });
const page = await ctx.newPage();
page.setDefaultTimeout(30000);

const pageOrigin = new URL(liveUrl).origin;
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => pageErrors.push(String(err.message || err)));
page.on('response', (res) => {
  try {
    if (res.status() < 400) return;
    const u = new URL(res.url());
    if (u.origin === pageOrigin) httpBad.push({ status: res.status(), url: res.url() });
  } catch {
    /* ignore */
  }
});

const smokeUrl = cacheBust(liveUrl);

try {
  await page.goto(smokeUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.__APP_READY__ === true, null, { timeout: 60000 });
  check('load + __APP_READY__', true, 'ready');
} catch (e) {
  check('load + __APP_READY__', false, String(e.message || e).split('\n')[0]);
}

check(
  'console errors',
  consoleErrors.length === 0,
  consoleErrors.length ? `${consoleErrors.length}: ${consoleErrors[0].slice(0, 100)}` : '0',
);
check(
  'pageerrors',
  pageErrors.length === 0,
  pageErrors.length ? `${pageErrors.length}: ${pageErrors[0].slice(0, 100)}` : '0',
);
check(
  'HTTP ≥400 same-origin',
  httpBad.length === 0,
  httpBad.length ? `${httpBad.length}: ${httpBad[0].status} ${httpBad[0].url}` : '0',
);

// VERSION.json + in-app
let jsonVer = null;
let jsonErr = null;
try {
  const res = await page.request.get(versionJsonUrl(liveUrl), { timeout: 15000 });
  if (res.ok()) {
    const body = await res.json();
    jsonVer = body?.version != null ? String(body.version) : null;
  } else {
    jsonErr = `HTTP ${res.status()}`;
  }
} catch (e) {
  jsonErr = String(e.message || e).split('\n')[0];
}
const appVer = await page.evaluate(() => window.APP_VERSION || null).catch(() => null);
const verOk = jsonVer === EXPECTED_VERSION && appVer === EXPECTED_VERSION;
check(
  `VERSION === ${EXPECTED_VERSION}`,
  verOk,
  `json=${jsonVer ?? jsonErr ?? 'n/a'} app=${appVer ?? 'n/a'}`,
);

// Dismiss overlays that block taps
await page
  .evaluate(() => {
    document.getElementById('splash')?.remove();
    document.getElementById('onboard')?.classList.add('hide');
    document.getElementById('proUpgradeModal')?.classList.remove('on');
    if (typeof UI !== 'undefined' && UI.closeSheet) UI.closeSheet();
  })
  .catch(() => {});
await page.waitForTimeout(400);

// --- Core ios checks ---
try {
  const covered = await page.evaluate(() =>
    [...document.querySelectorAll('#nav .nav-btn, .app-add-btn, .app-settings-btn')]
      .filter((t) => t.offsetParent !== null)
      .filter((t) => {
        const r = t.getBoundingClientRect();
        if (t.matches('.app-add-btn, .app-settings-btn')) {
          const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return !t.contains(h);
        }
        const bar = document.querySelector('#nav')?.getBoundingClientRect();
        if (t.closest('#nav') === null && (r.bottom > (bar ? bar.top : innerHeight) || r.top < 0)) return false;
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return !t.contains(hit);
      })
      .map((t) => t.getAttribute('aria-label') || t.textContent.trim()),
  );
  check('tab bar + top bar tappable', covered.length === 0, covered.join(',') || 'ok');
} catch (e) {
  check('tab bar + top bar tappable', false, String(e.message || e).split('\n')[0]);
}

try {
  const m = await page.evaluate(() => {
    if (typeof Nav !== 'undefined') Nav.go('stable');
    return {
      sw: document.documentElement.scrollWidth,
      iw: innerWidth,
      docScroll: document.scrollingElement.scrollHeight > innerHeight,
      inner: getComputedStyle(document.getElementById('main')).overflowY,
    };
  });
  await page.waitForTimeout(400);
  check('document scrolls (no inner scroller)', m.docScroll && m.inner === 'visible', JSON.stringify(m));
  check('no sideways overflow', m.sw <= m.iw + 1, `${m.sw} vs ${m.iw}`);
} catch (e) {
  check('document scrolls (no inner scroller)', false, String(e.message || e).split('\n')[0]);
}

// Sheet lock / restore
try {
  await page.evaluate(() => {
    if (typeof Nav !== 'undefined') Nav.go('stable');
    window.scrollTo(0, 300);
  });
  await page.waitForTimeout(400);
  const before = await page.evaluate(() => scrollY);
  await page.locator('.app-add-btn').tap({ timeout: 8000 });
  await page.locator('#sheet.on .sheet-bar-cancel').waitFor({ timeout: 8000 });
  await page.waitForTimeout(300);
  const locked = await page.evaluate(() => document.body.style.position);
  await page.locator('#sheet .sheet-bar-cancel').tap();
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => scrollY);
  check('sheet locks body', locked === 'fixed', `position=${locked}`);
  check('sheet restores scroll', Math.abs(after - before) < 4, `before ${before} after ${after}`);
} catch (e) {
  check('sheet lock/restore', false, String(e.message || e).split('\n')[0]);
}

// Swipe at top must not reload
try {
  await page.evaluate(() => {
    window.__smokeNoReload = 1;
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(200);
  const touched = await page.evaluate(async () => {
    let makeTouch;
    try {
      makeTouch = (y) => new Touch({ identifier: 1, target: document.body, clientX: 200, clientY: y });
      makeTouch(0);
    } catch {
      return false;
    }
    const fire = (type, y) => {
      document.body.dispatchEvent(
        new TouchEvent(type, {
          bubbles: true,
          cancelable: true,
          touches: type === 'touchend' ? [] : [makeTouch(y)],
          changedTouches: [makeTouch(y)],
        }),
      );
    };
    fire('touchstart', 80);
    for (let y = 100; y <= 380; y += 20) fire('touchmove', y);
    fire('touchend', 380);
    await new Promise((r) => setTimeout(r, 600));
    return true;
  });
  if (!touched) {
    await page.mouse.move(200, 80);
    await page.mouse.down();
    await page.mouse.move(200, 380, { steps: 16 });
    await page.mouse.up();
    await page.waitForTimeout(600);
  }
  const marker = await page.evaluate(() => window.__smokeNoReload);
  check('swipe at top does not reload', marker === 1, marker === 1 ? (touched ? 'touch' : 'mouse-drag') : `marker=${marker}`);
} catch (e) {
  check('swipe at top does not reload', false, String(e.message || e).split('\n')[0]);
}

await browser.close().catch(() => {});

const w = Math.max(4, ...rows.map((r) => r.status.length));
for (const r of rows) {
  console.log(`${r.status.padEnd(w)}  ${r.name}${r.detail ? `  (${r.detail})` : ''}`);
}

const passed = rows.every((r) => r.status === 'PASS');
const out = {
  url: liveUrl,
  smokeUrl,
  expectedVersion: EXPECTED_VERSION,
  consoleErrors,
  pageErrors,
  httpBad,
  checks: rows,
  passed,
  at: new Date().toISOString(),
};
const outPath = path.join(ROOT, 'qa/release/logs', 'live-smoke.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`);
console.log(`\nWrote ${path.relative(ROOT, outPath)}`);
process.exit(passed ? 0 : 1);
