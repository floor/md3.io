// After the build, copy every asset the HTML links to a content-hashed name and
// write dist/asset-manifest.json. Templates keep the logical path (`/dist/site.js`);
// the server rewrites it from this file. The unhashed file stays, so a page cached
// before hashed names still has a URL that answers.
//
// Hashed copies that are no longer in the manifest are left in dist until 2027-01-03.
// A deploy rebuilds into the same dist, and a browser can still hold yesterday's HTML
// (Cloudflare's default Browser Cache TTL is 4 hours, which is longer than the
// origin's 60 seconds unless the owner sets Respect Existing Headers). Delete the
// leftovers after 2027-01-03: any file under dist whose name matches
// `.[0-9a-f]{10}.(js|css|svg)` and is not a value in asset-manifest.json.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { minifyCss } from '../src/server/css';

const root = resolve(import.meta.dir, '..');
const dist = resolve(root, 'dist');
const manifestPath = resolve(dist, 'asset-manifest.json');

const hashOf = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex').slice(0, 10);
const hashedBase = (name: string, hash: string) => {
  const ext = extname(name);
  return `${name.slice(0, -ext.length)}.${hash}${ext}`;
};
/** A copy this script already wrote. Walking it again would hash the hash. */
const alreadyHashed = (name: string) => /\.[a-f0-9]{10}\.(?:js|css|svg)$/.test(name);

const manifest: Record<string, string> = {};

/** Bytes the server will send for the hashed URL, written beside `destDir`. */
async function publish(logicalUrl: string, bytes: Buffer, destDir: string, filename: string, urlDir: string) {
  const name = hashedBase(filename, hashOf(bytes));
  await mkdir(destDir, { recursive: true });
  await writeFile(join(destDir, name), bytes);
  manifest[logicalUrl] = `${urlDir}${name}`;
}

function walk(dir: string, accept: (name: string) => boolean): string[] {
  if (!existsSync(dir)) return [];
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...walk(path, accept));
    else if (entry.isFile() && accept(entry.name) && !alreadyHashed(entry.name)) found.push(path);
  }
  return found;
}

// Built JS: the entries at dist/*.js and every example bundle. Chunks are already
// named chunk-<hash>.js; they are not copied.
for (const file of walk(dist, name => name.endsWith('.js') && !name.startsWith('chunk-'))) {
  const rel = relative(dist, file).split('\\').join('/');
  // Skip JS that is material's own module graph. The browser loads our bundles,
  // which already contain it; rewriting those relative imports would break them.
  if (rel.startsWith('material/')) continue;
  const logical = `/dist/${rel.split('\\').join('/')}`;
  await publish(logical, readFileSync(file), dirname(file), basename(file), logical.slice(0, logical.lastIndexOf('/') + 1));
}

// Built CSS, including material's styles and themes. Already-minified page bundles
// are copied as they are; material's sheets are minified the way the server minifies
// them on the unhashed path, so both URLs are the same text.
for (const file of walk(resolve(dist, 'css'), name => name.endsWith('.css'))) {
  const logical = `/dist/css/${basename(file)}`;
  await publish(logical, readFileSync(file), dirname(file), basename(file), '/dist/css/');
}
for (const file of walk(resolve(dist, 'material'), name => name.endsWith('.css'))) {
  const rel = relative(resolve(dist, 'material'), file).split('\\').join('/');
  const logical = `/dist/material/${rel}`;
  const minified = Buffer.from(minifyCss(readFileSync(file, 'utf8')));
  await publish(logical, minified, dirname(file), basename(file), logical.slice(0, logical.lastIndexOf('/') + 1));
}

// Stylesheets the frames link from /styles/, not from a bundle. Fonts in them are
// absolute (/fonts/…), so the hashed copy can live under dist/styles/.
const stylesDir = resolve(root, 'styles');
for (const name of readdirSync(stylesDir)) {
  if (!name.endsWith('.css')) continue;
  const logical = `/styles/${name}`;
  const minified = Buffer.from(minifyCss(readFileSync(join(stylesDir, name), 'utf8')));
  await publish(logical, minified, resolve(dist, 'styles'), name, '/dist/styles/');
}

// An example's layout CSS is read from examples/<slug>/styles.css at request time.
// The hashed copy is the minified text that route sends.
const examplesRoot = resolve(root, 'examples');
if (existsSync(examplesRoot)) {
  for (const slug of readdirSync(examplesRoot)) {
    const file = join(examplesRoot, slug, 'styles.css');
    if (!statSafe(file)) continue;
    const logical = `/examples-styles/${slug}.css`;
    const minified = Buffer.from(minifyCss(readFileSync(file, 'utf8')));
    await publish(logical, minified, resolve(dist, 'examples-styles'), `${slug}.css`, '/dist/examples-styles/');
  }
}

// The header mark. Hashed under dist so a server restart does not change the HTML.
const mark = resolve(root, 'assets/brand/mark.svg');
if (existsSync(mark)) {
  await publish('/assets/brand/mark.svg', readFileSync(mark), resolve(dist, 'brand'), 'mark.svg', '/dist/brand/');
}

const ordered = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
await writeFile(manifestPath, `${JSON.stringify(ordered, null, 2)}\n`);
console.log(`Asset manifest: ${Object.keys(ordered).length} hashed files.`);

function statSafe(file: string): boolean {
  try { return statSync(file).isFile(); } catch { return false; }
}
