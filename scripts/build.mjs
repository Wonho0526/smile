import { readFile, mkdir, cp, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = await readFile(resolve(root, 'index.html'), 'utf8');
const css = await readFile(resolve(root, 'assets/css/style.css'), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
if (new Set(ids).size !== ids.length) throw new Error('Duplicate HTML IDs.');
for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) {
  if (!ids.includes(id)) throw new Error(`Missing anchor: #${id}`);
}
for (const [, path] of html.matchAll(/(?:src|href)="(assets\/[^"?#]+)"/g)) {
  await access(resolve(root, path));
}
for (const [, path] of css.matchAll(/url\(['"]?(\.\.\/[^)'"\s]+)/g)) {
  await access(resolve(root, 'assets/css', path));
}
execFileSync(process.execPath, ['--check', resolve(root, 'assets/js/main.js')], { stdio: 'inherit' });
await mkdir(resolve(root, 'dist'), { recursive: true });
await cp(resolve(root, 'index.html'), resolve(root, 'dist/index.html'));
await cp(resolve(root, 'assets'), resolve(root, 'dist/assets'), { recursive: true });
console.log(`Build complete: dist/ — ${ids.length} anchor targets, all local assets, and JavaScript syntax verified.`);
