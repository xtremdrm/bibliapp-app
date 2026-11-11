import { cpSync, rmSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const out = resolve(root, 'dist/site');
const appDir = resolve(root, 'dist/app/browser');
const webDir = resolve(root, '../web');

if (!existsSync(appDir)) {
  console.error('Missing dist/app/browser. Run "npm run build:web" first.');
  process.exit(1);
}
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(webDir, out, { recursive: true });
cpSync(appDir, resolve(out, 'app'), { recursive: true });
console.log('Site written to', out);
