/**
 * Capture axe-core results for finish-loop (C-32).
 * Usage: npm run axe
 */
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const PORT = process.env.PORT || '8770';
const BASE = process.env.BASE_URL || `http://127.0.0.1:${PORT}`;
const OUT = path.join('qa', 'finish-loop', 'axe');
const ROUTES = [{ id: 'home-demo', path: '/?demo=1' }];
const THEMES = ['light', 'dark'];

async function waitReady(page) {
  await page.waitForFunction(
    () => window.__APP_READY__ === true || document.documentElement.dataset.appReady === 'true',
    null,
    { timeout: 20000 },
  );
}

fs.mkdirSync(OUT, { recursive: true });

let server;
if (!process.env.BASE_URL) {
  server = spawn('python3', ['-m', 'http.server', PORT], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 600));
}

const browser = await chromium.launch();
const results = [];

try {
  for (const route of ROUTES) {
    for (const theme of THEMES) {
      const context = await browser.newContext({ viewport: { width: 393, height: 852 } });
      const page = await context.newPage();
      await page.addInitScript((t) => {
        try {
          localStorage.setItem('dp_theme', t);
          document.documentElement.classList.toggle('dark-mode', t === 'dark');
          document.documentElement.setAttribute('data-theme', t);
        } catch (_) {}
      }, theme);
      await page.goto(BASE + route.path, { waitUntil: 'domcontentloaded' });
      await waitReady(page).catch(async () => {
        await page.waitForTimeout(2000);
      });
      await page.evaluate((t) => {
        document.documentElement.classList.toggle('dark-mode', t === 'dark');
        document.documentElement.setAttribute('data-theme', t);
      }, theme);
      await page.waitForTimeout(400);

      const axe = await new AxeBuilder({ page }).analyze();
      const outName = `${route.id}-${theme}.json`;
      fs.writeFileSync(
        path.join(OUT, outName),
        JSON.stringify(
          {
            url: page.url(),
            route: route.id,
            theme,
            timestamp: new Date().toISOString(),
            violations: axe.violations,
            passes: axe.passes?.length ?? 0,
            incomplete: axe.incomplete?.length ?? 0,
            inapplicable: axe.inapplicable?.length ?? 0,
          },
          null,
          2,
        ),
      );
      const serious = axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      results.push({ file: outName, violations: axe.violations.length, serious: serious.length, ids: serious.map((v) => v.id) });
      await context.close();
    }
  }
} finally {
  await browser.close();
  if (server) server.kill('SIGTERM');
}

console.log(JSON.stringify(results, null, 2));
process.exit(results.some((r) => r.serious > 0) ? 1 : 0);
