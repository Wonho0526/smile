import { readFile, mkdir, cp, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = await readFile(resolve(root, 'index.html'), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
if (new Set(ids).size !== ids.length) throw new Error('Duplicate HTML IDs.');
for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) {
  if (!ids.includes(id)) throw new Error(`Missing anchor: #${id}`);
}
const assets = new Set([...html.matchAll(/(?:src|href)="(assets\/[^"?#]+)"/g)].map(match => match[1]));
for (const asset of assets) {
  const assetPath = resolve(root, asset);
  await access(assetPath);
  if (asset.endsWith('.css')) {
    const css = await readFile(assetPath, 'utf8');
    for (const [, path] of css.matchAll(/url\(['"]?(\.\.\/[^)'"\s]+)/g)) {
      await access(resolve(dirname(assetPath), path));
    }
  }
  if (asset.endsWith('.js')) execFileSync(process.execPath, ['--check', assetPath], { stdio: 'inherit' });
}
await mkdir(resolve(root, 'dist'), { recursive: true });
await cp(resolve(root, 'index.html'), resolve(root, 'dist/index.html'));
await cp(resolve(root, 'assets'), resolve(root, 'dist/assets'), { recursive: true });
console.log(`Build complete: dist/ — ${ids.length} anchor targets, ${assets.size} local assets, all stylesheets and JavaScript syntax verified.`);
