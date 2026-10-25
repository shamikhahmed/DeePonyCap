#!/usr/bin/env node
/**
 * DeePonyCap prod-ready audit (reviewer runs outside sandbox).
 * Visits every screen at listed viewports/themes, taps controls, axe,
 * console errors, HTTP ≥400, offline reload.
 *
 * Usage:
 *   python3 -m http.server 8880
 *   node scripts/prod-ready-audit.mjs http://127.0.0.1:8880/
 *
 * Writes: qa/prod-ready/audit-findings.json + qa/prod-ready/shots/*.png (≤40)
 * Does NOT alter playwright.config / ios-check / shipped browser launch flags.
 */
import { chromium, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'qa', 'prod-ready');
const SHOTS = path.join(OUT, 'shots');
const BASE = (process.argv[2] || 'http://127.0.0.1:8880/').replace(/\/?$/, '/');
const MAX_SHOTS = 40;

const VIEWPORTS = [
  { w: 375, h: 812, name: '375x812', phone: true },
  { w: 390, h: 844, name: '390x844', phone: true },
  { w: 430, h: 932, name: '430x932', phone: true },
  { w: 744, h: 1133, name: '744x1133', sidebar: true },
  { w: 1180, h: 820, name: '1180x820', sidebar: true },
  { w: 1440, h: 900, name: '1440x900', sidebar: true },
];

const TABS = ['stable', 'logs', 'map', 'wishlist', 'accessories'];
const EXTRA = ['settings', 'stats'];

let shotCount = 0;
const findings = [];
const shots = [];
const consoleErrors = [];
const httpBad = [];
const externalHosts = new Set();

function find(severity, area, screen, message, extra) {
  findings.push({
    severity,
    area,
    screen,
    message,
    ...(extra || {}),
    at: new Date().toISOString(),
  });
}

const require = createRequire(import.meta.url);
let AxeBuilder = null;
try {
  AxeBuilder = require('@axe-core/playwright').default;
} catch {
  AxeBuilder = null;
}

fs.mkdirSync(SHOTS, { recursive: true });
for (const f of fs.readdirSync(SHOTS)) {
  if (f.endsWith('.png')) fs.unlinkSync(path.join(SHOTS, f));
}

async function waitReady(page) {
  await page.waitForFunction(
    () =>
      document.getElementById('app')?.style.display === 'flex' &&
      typeof Nav !== 'undefined' &&
      typeof Render !== 'undefined',
    null,
    { timeout: 60000 },
  );
  await page.evaluate(() => {
    document.getElementById('splash')?.remove();
    document.getElementById('onboard')?.classList.add('hide');
    document.getElementById('proUpgradeModal')?.classList.remove('on');
    if (typeof UI !== 'undefined' && UI.closeSheet) UI.closeSheet();
  });
  await page.waitForTimeout(400);
}

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    S.settings.darkMode = t === 'dark';
    Theme.apply();
  }, theme);
  await page.waitForTimeout(200);
}

async function goTab(page, tab) {
  await page.evaluate((t) => {
    if (typeof UI !== 'undefined' && UI.closeSheet) UI.closeSheet();
    Nav.go(t);
  }, tab);
  await page.waitForTimeout(500);
}

async function closeOverlays(page) {
  await page.evaluate(() => {
    if (typeof UI !== 'undefined' && UI.closeSheet) UI.closeSheet();
    document.querySelectorAll('.cap-confirm-backdrop, .cap-dialog-backdrop').forEach((el) => el.remove());
  });
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(150);
}

async function shot(page, name) {
  if (shotCount >= MAX_SHOTS) return null;
  const file = `${String(shotCount + 1).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path: path.join(SHOTS, file), fullPage: false });
  shotCount++;
  shots.push(file);
  return file;
}

async function layoutScan(page, label) {
  const m = await page.evaluate(() => {
    const sw = document.documentElement.scrollWidth;
    const iw = window.innerWidth;
    const bar = document.querySelector('#nav');
    const barTop = bar?.getBoundingClientRect().top ?? innerHeight;
    const unnamed = [...document.querySelectorAll('button, a, [role="button"], input, select, textarea')]
      .filter((el) => el.offsetParent !== null)
      .filter((el) => {
        const name =
          el.getAttribute('aria-label') ||
          el.getAttribute('aria-labelledby') ||
          el.getAttribute('title') ||
          (el.labels && el.labels[0] && el.labels[0].textContent) ||
          el.textContent ||
          el.getAttribute('placeholder') ||
          '';
        return !String(name).trim();
      })
      .map((el) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}`)
      .slice(0, 10);
    const smallInputs = [...document.querySelectorAll('input, textarea, select')]
      .filter((el) => el.offsetParent !== null && el.type !== 'hidden' && el.type !== 'file' && el.type !== 'checkbox')
      .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 16)
      .map((el) => el.id || el.className || el.type)
      .slice(0, 8);
    const underBar = [...document.querySelectorAll('.screen.on button, .screen.on a, .screen.on [role="button"]')]
      .filter((el) => el.offsetParent !== null && !el.closest('#nav'))
      .filter((el) => {
        const r = el.getBoundingClientRect();
        if (r.height < 8 || r.width < 8) return false;
        const midY = r.top + r.height / 2;
        if (midY < barTop || midY > innerHeight) return false;
        const hit = document.elementFromPoint(
          Math.min(r.left + r.width / 2, iw - 2),
          Math.min(midY, innerHeight - 2),
        );
        return hit && bar && bar.contains(hit) && !el.contains(hit);
      })
      .map((el) => (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40))
      .slice(0, 6);
    const main = document.getElementById('main');
    const innerScroll = main ? getComputedStyle(main).overflowY : '';
    return {
      sw,
      iw,
      overflow: sw > iw + 1,
      unnamed,
      smallInputs,
      underBar,
      innerScroll,
    };
  });
  if (m.overflow) find('high', 'C', label, `Horizontal overflow ${m.sw} > ${m.iw}`);
  for (const u of m.unnamed) find('medium', 'G', label, `Unnamed control: ${u}`);
  for (const s of m.smallInputs) find('high', 'F', label, `Input font <16px (zoom risk): ${s}`);
  for (const u of m.underBar) find('high', 'C', label, `Control under tab bar: ${u}`);
  if (m.innerScroll && m.innerScroll !== 'visible' && m.innerScroll !== 'clip') {
    find('medium', 'F', label, `Unexpected #main overflowY=${m.innerScroll}`);
  }
  return m;
}

async function runAxe(page, label, theme) {
  if (!AxeBuilder) {
    find('info', 'G', label, 'axe skipped — @axe-core/playwright not in node_modules');
    return [];
  }
  try {
    const axe = await new AxeBuilder({ page }).analyze();
    const bad = (axe.violations || []).filter((v) => v.impact === 'serious' || v.impact === 'critical');
    for (const v of bad) {
      find(v.impact === 'critical' ? 'critical' : 'high', 'G', `${label}:${theme}`, `axe ${v.impact}: ${v.id} — ${v.help}`, {
        nodes: (v.nodes || []).slice(0, 3).map((n) => n.target),
      });
    }
    return bad;
  } catch (e) {
    find('low', 'G', label, `axe failed: ${String(e.message || e).split('\n')[0]}`);
    return [];
  }
}

async function tapVisible(page, label, limit) {
  const handles = await page.evaluate((lim) => {
    const els = [
      ...document.querySelectorAll(
        '.screen.on button, .screen.on a[href], .screen.on [role="button"], .screen.on .pill, .screen.on .chip, .app-add-btn, .app-settings-btn, #nav .nav-btn',
      ),
    ]
      .filter((el) => el.offsetParent !== null)
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight;
      })
      .slice(0, lim);
    return els.map((el, i) => {
      el.setAttribute('data-audit-i', String(i));
      return {
        i,
        text: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40),
        dangerous: /delete|reset|import|export|remove|clear|purge|replay/i.test(
          (el.getAttribute('aria-label') || el.textContent || '') + (el.getAttribute('onclick') || ''),
        ),
      };
    });
  }, limit);
  const results = [];
  for (const h of handles) {
    if (h.dangerous) continue;
    try {
      const before = await page.evaluate(() => ({
        tab: document.querySelector('.screen.on')?.id,
        sheet: document.getElementById('sheet')?.classList.contains('on'),
        y: scrollY,
      }));
      await page.locator(`[data-audit-i="${h.i}"]`).first().click({ timeout: 1500 });
      await page.waitForTimeout(180);
      const after = await page.evaluate(() => ({
        tab: document.querySelector('.screen.on')?.id,
        sheet: document.getElementById('sheet')?.classList.contains('on'),
        y: scrollY,
      }));
      const changed = JSON.stringify(before) !== JSON.stringify(after);
      results.push({ label: h.text, changed });
      if (after.sheet) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(120);
      }
    } catch (e) {
      results.push({ label: h.text, error: String(e.message || e).split('\n')[0] });
    }
  }
  const dead = results.filter((r) => r.changed === false);
  if (dead.length) {
    find('low', 'D', label, `${dead.length}/${results.length} taps appeared no-op (may be toggles/selected)`, {
      samples: dead.slice(0, 5).map((d) => d.label),
    });
  }
  for (const e of results.filter((r) => r.error)) {
    find('medium', 'D', label, `Tap failed: ${e.label} — ${e.error}`);
  }
  return results;
}

function wirePage(page, origin) {
  page.on('pageerror', (e) => consoleErrors.push(e.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('response', (res) => {
    try {
      const u = new URL(res.url());
      if (u.origin !== origin && !u.protocol.startsWith('blob') && u.protocol !== 'data:') {
        externalHosts.add(u.host);
      }
      if (res.status() >= 400) httpBad.push({ url: res.url().replace(origin, ''), status: res.status() });
    } catch (_) {}
  });
}

async function main() {
  const origin = new URL(BASE).origin;
  const iphone = devices['iPhone 15 Pro'];
  const { defaultBrowserType: _omit, ...metrics } = iphone;

  let browser;
  try {
    browser = await chromium.launch();
  } catch (e) {
    console.error('Chromium launch failed (run outside sandbox):', e.message || e);
    process.exit(2);
  }

  const ctx = await browser.newContext({
    ...metrics,
    viewport: { width: 390, height: 844 },
    colorScheme: 'light',
    serviceWorkers: 'allow',
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  wirePage(page, origin);

  // --- Demo warm ---
  await page.goto(BASE + '?demo=1', { waitUntil: 'domcontentloaded' });
  await waitReady(page);
  const ver = await page.evaluate(() => ({ v: window.APP_VERSION, sw: window.SW_CACHE }));
  find('info', 'A', 'boot', `APP_VERSION=${ver.v} SW_CACHE=${ver.sw}`);

  for (const theme of ['light', 'dark']) {
    await setTheme(page, theme);
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.w, height: vp.h });
      const tabsHere =
        vp.name === '390x844' || vp.name === '1180x820'
          ? [...TABS, ...EXTRA]
          : ['stable', 'logs', 'settings'];
      for (const tab of tabsHere) {
        await closeOverlays(page);
        await goTab(page, tab);
        const label = `${tab}:${theme}:${vp.name}`;
        await layoutScan(page, label);
        if (vp.name === '390x844') await runAxe(page, tab, theme);
        if (
          (vp.name === '390x844' && (tab === 'stable' || tab === 'logs' || tab === 'settings' || tab === 'wishlist')) ||
          (vp.name === '375x812' && tab === 'stable' && theme === 'light') ||
          (vp.name === '430x932' && tab === 'stable' && theme === 'dark') ||
          (vp.name === '744x1133' && tab === 'stable' && theme === 'light') ||
          (vp.name === '1180x820' && tab === 'stable') ||
          (vp.name === '1440x900' && tab === 'stable' && theme === 'light')
        ) {
          await shot(page, `${tab}-${theme}-${vp.name}`);
        }
      }
    }
  }

  // Sheets @ 390 light
  await page.setViewportSize({ width: 390, height: 844 });
  await setTheme(page, 'light');
  await goTab(page, 'stable');
  await page.evaluate(() => UI.openAdd());
  await page.waitForTimeout(500);
  await layoutScan(page, 'sheet:add');
  await runAxe(page, 'sheet:add', 'light');
  await shot(page, 'sheet-add-light-390');
  // Esc closes
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  const sheetClosed = await page.evaluate(() => !document.getElementById('sheet')?.classList.contains('on'));
  if (!sheetClosed) find('high', 'D', 'sheet:esc', 'Escape did not close add sheet');
  else find('info', 'D', 'sheet:esc', 'Escape closed add sheet');

  // Open first pony passport/detail if any
  const opened = await page.evaluate(() => {
    const p = S.ponies && S.ponies[0];
    if (!p) return false;
    if (window.Excellence && Excellence.openPassport) Excellence.openPassport(p.id);
    else UI.openDetail(p.id);
    return true;
  });
  await page.waitForTimeout(500);
  if (opened) {
    await layoutScan(page, 'sheet:detail');
    await shot(page, 'sheet-detail-light-390');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }

  // Interaction pass
  await goTab(page, 'stable');
  await tapVisible(page, 'stable:taps', 20);
  await closeOverlays(page);
  await goTab(page, 'logs');
  await tapVisible(page, 'logs:taps', 16);
  await closeOverlays(page);
  await goTab(page, 'wishlist');
  await tapVisible(page, 'wishlist:taps', 12);
  await closeOverlays(page);

  // Storybook sub-view
  await goTab(page, 'stats');
  await page.evaluate(() => {
    if (window.Excellence && Excellence.renderStorybook) Excellence.renderStorybook();
    else {
      const btn = [...document.querySelectorAll('button')].find((b) => /storybook/i.test(b.textContent || ''));
      btn?.click();
    }
  });
  await page.waitForTimeout(500);
  await layoutScan(page, 'stats:storybook');
  await shot(page, 'stats-storybook-light-390');

  // --- Empty profile pass (isolated context) ---
  const emptyCtx = await browser.newContext({
    ...metrics,
    viewport: { width: 390, height: 844 },
    colorScheme: 'light',
    serviceWorkers: 'block',
  });
  const empty = await emptyCtx.newPage();
  wirePage(empty, origin);
  await empty.goto(BASE, { waitUntil: 'domcontentloaded' });
  await empty.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (_) {}
  });
  await empty.reload({ waitUntil: 'domcontentloaded' });
  try {
    await empty.waitForFunction(
      () => document.getElementById('onboard') && !document.getElementById('onboard').classList.contains('hide'),
      null,
      { timeout: 20000 },
    );
    await shot(empty, 'onboard-empty-390');
    find('info', 'E', 'empty', 'Onboarding visible on fresh profile');
    await empty.evaluate(() => {
      if (typeof OB !== 'undefined' && OB.finish) OB.finish(true);
    });
    await empty.waitForTimeout(800);
    await empty.waitForFunction(() => document.getElementById('app')?.style.display === 'flex', null, {
      timeout: 30000,
    }).catch(() => {});
    await empty.evaluate(() => {
      document.getElementById('splash')?.remove();
      if (typeof Nav !== 'undefined') Nav.go('stable');
    });
    await empty.waitForTimeout(500);
    await layoutScan(empty, 'empty:stable');
    await shot(empty, 'empty-stable-light-390');
  } catch (e) {
    find('medium', 'E', 'empty', `Empty profile flow: ${String(e.message || e).split('\n')[0]}`);
  }
  await emptyCtx.close();

  // --- Offline reload (demo, SW allow) ---
  const offCtx = await browser.newContext({
    ...metrics,
    viewport: { width: 390, height: 844 },
    serviceWorkers: 'allow',
  });
  const off = await offCtx.newPage();
  wirePage(off, origin);
  await off.goto(BASE + '?demo=1', { waitUntil: 'networkidle' }).catch(() =>
    off.goto(BASE + '?demo=1', { waitUntil: 'domcontentloaded' }),
  );
  await waitReady(off);
  // Wait for SW controller
  await off
    .waitForFunction(() => navigator.serviceWorker?.controller, null, { timeout: 20000 })
    .catch(() => find('medium', 'H', 'offline', 'No SW controller after warm load'));
  await off.waitForTimeout(1500);
  await off.context().setOffline(true);
  await off.reload({ waitUntil: 'domcontentloaded' }).catch((e) => {
    find('critical', 'H', 'offline', `Offline reload failed: ${String(e.message || e).split('\n')[0]}`);
  });
  try {
    await waitReady(off);
    const ok = await off.evaluate(() => document.getElementById('tab-stable')?.innerHTML?.length > 20);
    if (ok) find('info', 'H', 'offline', 'Offline reload: Stable rendered');
    else find('high', 'H', 'offline', 'Offline reload: Stable empty/missing');
    await shot(off, 'offline-stable-390');
  } catch (e) {
    find('critical', 'H', 'offline', `Offline ready failed: ${String(e.message || e).split('\n')[0]}`);
  }
  await off.context().setOffline(false);
  await offCtx.close();

  // Console / HTTP summary
  const noise = /serviceWorker|ResizeObserver|favicon|Download the React/i;
  for (const e of consoleErrors.filter((x) => !noise.test(x)).slice(0, 30)) {
    find('high', 'D', 'console', e);
  }
  for (const h of httpBad.slice(0, 40)) {
    find('high', 'J', 'http', `${h.status} ${h.url}`);
  }
  if (externalHosts.size) {
    find('info', 'J', 'network', `External hosts: ${[...externalHosts].join(', ')}`);
  } else {
    find('info', 'J', 'network', 'No external hosts observed during audit');
  }

  const summary = {
    base: BASE,
    engine: 'chromium+iPhone15Pro-metrics',
    version: ver,
    shotCount,
    shots,
    findingsCount: findings.length,
    bySeverity: findings.reduce((a, f) => {
      a[f.severity] = (a[f.severity] || 0) + 1;
      return a;
    }, {}),
    externalHosts: [...externalHosts],
    httpBadCount: httpBad.length,
    consoleErrorCount: consoleErrors.filter((x) => !noise.test(x)).length,
    axePresent: !!AxeBuilder,
    findings,
  };

  fs.writeFileSync(path.join(OUT, 'audit-findings.json'), JSON.stringify(summary, null, 2));
  const axeBad = findings.filter(
    (x) => x.area === 'G' && (x.severity === 'critical' || x.severity === 'high') && /axe/i.test(x.message || ''),
  ).length;
  const offlineBad = findings.filter(
    (x) =>
      x.area === 'H' &&
      /offline/i.test(`${x.screen || ''} ${x.message || ''}`) &&
      (x.severity === 'critical' || x.severity === 'high'),
  ).length;
  const gateOk =
    axeBad === 0 &&
    summary.consoleErrorCount === 0 &&
    summary.httpBadCount === 0 &&
    offlineBad === 0;
  console.log(
    JSON.stringify(
      {
        ok: gateOk,
        gate: { axeBad, consoleN: summary.consoleErrorCount, httpN: summary.httpBadCount, offlineBad },
        findings: summary.findingsCount,
        bySeverity: summary.bySeverity,
        shots: shotCount,
        out: 'qa/prod-ready/audit-findings.json',
      },
      null,
      2,
    ),
  );

  await browser.close();
  if (!gateOk) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
