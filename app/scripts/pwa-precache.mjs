// Post-build step for the web / installed web app.
// Writes files.json (the list the service worker precaches) and stamps a build id into sw.js.
// Usage: node scripts/pwa-precache.mjs <output dir containing index.html>
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const dir = process.argv[2];
if (!dir) {
  console.error('Usage: node scripts/pwa-precache.mjs <dir>');
  process.exit(1);
}

const SKIP = new Set(['sw.js', 'files.json', '3rdpartylicenses.txt', 'prerendered-routes.json']);
const files = [];
(function walk(d) {
  for (const name of readdirSync(d)) {
    const p = join(d, name);
    if (statSync(p).isDirectory()) walk(p);
    else files.push(relative(dir, p).split(sep).join('/'));
  }
})(dir);

const list = files.filter((f) => !SKIP.has(f) && !f.endsWith('.pdf')).sort();
const hash = createHash('sha256');
for (const f of list) hash.update(f).update(readFileSync(join(dir, f)));
const build = hash.digest('hex').slice(0, 12);

writeFileSync(join(dir, 'files.json'), JSON.stringify(list));
const swPath = join(dir, 'sw.js');
writeFileSync(swPath, readFileSync(swPath, 'utf8').replace('__BUILD__', build));
console.log(`PWA: ${list.length} files listed, build ${build}`);
