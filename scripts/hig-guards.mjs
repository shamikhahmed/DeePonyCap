#!/usr/bin/env node
/**
 * Static HIG guards (no browser, no deps). Rules 1–4 from standing acceptance criteria.
 * Exits non-zero with file:line on any hit.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hits = [];

function walk(dir, pred, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === '_site') continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, pred, out);
    else if (pred(p)) out.push(p);
  }
  return out;
}

function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join('/');
}

function eachLine(file, fn) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => fn(line, i + 1, text, lines));
}

function add(file, line, msg) {
  hits.push(`${rel(file)}:${line}: ${msg}`);
}

const cssFiles = walk(path.join(ROOT, 'css'), (p) => p.endsWith('.css'));
const jsFiles = walk(path.join(ROOT, 'js'), (p) => /\.(js|mjs)$/.test(p));
const sw = path.join(ROOT, 'sw.js');
const indexHtml = path.join(ROOT, 'index.html');

const PAGE_SEL =
  /(^|[,{\s])(html|body|\.page|\.main|\.screen|\.view|\.pb|#view|#main|\.ui-page)(?=[\s,{.#:[>+~]|$)/;

/** Rule 3: html/body must not use overflow:hidden; scroll-behavior must be auto when set. */
for (const file of cssFiles) {
  eachLine(file, (line, n) => {
    const t = line.trim();
    if (t.startsWith('/*') || t.startsWith('*') || t.startsWith('//')) return;
    if (/^(html|body|html\s*,\s*body|body\s*,\s*html)\b/.test(t) || /}\s*(html|body)\b/.test(t)) {
      /* handled via block scan below */
    }
  });

  const text = fs.readFileSync(file, 'utf8');
  // Strip comments for block matching
  const bare = text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  const re =
    /(^|})\s*((?:html|body)(?:\s*,\s*(?:html|body))*)\s*\{([^}]*)\}/gim;
  let m;
  while ((m = re.exec(bare))) {
    const sel = m[2];
    const body = m[3];
    const start = m.index;
    const line = bare.slice(0, start).split('\n').length;
    if (/overflow\s*:\s*hidden\b/i.test(body) || /overflow-(x|y)\s*:\s*hidden\b/i.test(body)) {
      add(file, line, `html/body overflow:hidden (document must scroll)`);
    }
    if (/scroll-behavior\s*:\s*smooth\b/i.test(body)) {
      add(file, line, `html/body scroll-behavior:smooth (must be auto)`);
    }
    void sel;
  }
}

/** Rule 1: page-level containers must not scroll themselves. */
for (const file of cssFiles) {
  const text = fs.readFileSync(file, 'utf8');
  const bare = text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  const re = /([^{}]+)\{([^}]*)\}/gm;
  let m;
  while ((m = re.exec(bare))) {
    const sel = m[1].replace(/\s+/g, ' ').trim();
    const body = m[2];
    if (!PAGE_SEL.test(sel)) continue;
    // Allow documented exceptions: sheets / book leaves (listed in DESIGN.md)
    if (/\.sheet\b|\.ui-sheet\b|#cap-nav-sidebar\b/.test(sel)) continue;
    if (/overflow(-(x|y))?\s*:\s*(auto|scroll)\b/i.test(body)) {
      const line = bare.slice(0, m.index).split('\n').length;
      add(file, line, `page-level scroller (${sel.slice(0, 80)})`);
    }
  }
}

/** Rule 2: input/select/textarea font-size must compute ≥16px. */
function fontSizeTooSmall(val) {
  const v = val.trim().toLowerCase();
  if (/^max\s*\(\s*16px\b/.test(v)) return false;
  const px = v.match(/^(\d+(?:\.\d+)?)\s*px$/);
  if (px) return parseFloat(px[1]) < 16;
  const rem = v.match(/^(\d+(?:\.\d+)?)\s*rem$/);
  if (rem) return parseFloat(rem[1]) < 1;
  const em = v.match(/^(\d+(?:\.\d+)?)\s*em$/);
  if (em) return parseFloat(em[1]) < 1;
  return false;
}

for (const file of [...cssFiles, indexHtml].filter((p) => fs.existsSync(p))) {
  const text = fs.readFileSync(file, 'utf8');
  const bare = text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  const re = /([^{}]+)\{([^}]*)\}/gm;
  let m;
  while ((m = re.exec(bare))) {
    const sel = m[1];
    if (!/\b(input|select|textarea)\b/i.test(sel)) continue;
    const fsMatch = m[2].match(/font-size\s*:\s*([^;!}]+)/i);
    if (!fsMatch) continue;
    if (fontSizeTooSmall(fsMatch[1])) {
      const line = bare.slice(0, m.index).split('\n').length;
      add(file, line, `form control font-size < 16px (${fsMatch[1].trim()})`);
    }
  }
}

/** Inline style font-size on inputs in JS templates / HTML */
for (const file of [...jsFiles, indexHtml].filter((p) => fs.existsSync(p))) {
  eachLine(file, (line, n) => {
    if (!/<(input|select|textarea)\b/i.test(line) && !/\b(input|select|textarea)\b/i.test(line)) return;
    const m = line.match(/font-size\s*:\s*([^;'"`]+)/i);
    if (m && fontSizeTooSmall(m[1])) {
      add(file, n, `inline form control font-size < 16px (${m[1].trim()})`);
    }
  });
}

/** Rule 4: no auto skipWaiting / clients.claim outside user message handler. */
if (fs.existsSync(sw)) {
  const text = fs.readFileSync(sw, 'utf8');
  const lines = text.split(/\r?\n/);
  let inMessage = false;
  let braceDepth = 0;
  let messageDepth = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/addEventListener\s*\(\s*['"]message['"]/.test(line)) {
      inMessage = true;
      messageDepth = braceDepth;
    }
    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;
    braceDepth += opens - closes;
    if (inMessage && braceDepth <= messageDepth && closes > 0) {
      inMessage = false;
    }
    if (/skipWaiting\s*\(/.test(line) && !inMessage) {
      add(sw, i + 1, 'skipWaiting outside user message handler');
    }
    if (/clients\.claim\s*\(/.test(line) && !inMessage) {
      add(sw, i + 1, 'clients.claim outside user message handler');
    }
  }
}

if (hits.length) {
  console.error('hig-guards FAIL');
  for (const h of hits) console.error(h);
  process.exit(1);
}
console.log('hig-guards PASS');
process.exit(0);
