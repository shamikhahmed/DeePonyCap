'use strict';
/**
 * C-10.10 / C-14 — SW file CACHE fallback must equal VERSION.json.swCache
 * (and js/version.js must match version + swCache).
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const version = JSON.parse(fs.readFileSync(path.join(root, 'VERSION.json'), 'utf8'));
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const verJs = fs.readFileSync(path.join(root, 'js/version.js'), 'utf8');

const fallbackMatch = sw.match(
  /const\s+CACHE\s*=\s*self\.SW_CACHE\s*\|\|\s*['"]([^'"]+)['"]/
);
if (!fallbackMatch) {
  console.error('SW-truth FAIL: could not parse `const CACHE = self.SW_CACHE || …` in sw.js');
  process.exit(1);
}

const fallback = fallbackMatch[1];
const failures = [];

if (fallback !== version.swCache) {
  failures.push(`sw.js CACHE fallback "${fallback}" !== VERSION.json.swCache "${version.swCache}"`);
}
if (!verJs.includes(`'${version.swCache}'`) && !verJs.includes(`"${version.swCache}"`)) {
  failures.push(`js/version.js missing SW_CACHE ${version.swCache}`);
}
if (!verJs.includes(`'${version.version}'`) && !verJs.includes(`"${version.version}"`)) {
  failures.push(`js/version.js missing APP_VERSION ${version.version}`);
}

if (failures.length) {
  console.error('SW-truth FAIL:');
  for (const f of failures) console.error('  -', f);
  process.exit(1);
}

console.log('SW-truth OK', version.version, version.swCache);
