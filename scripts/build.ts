import { mkdir, cp, writeFile, readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { realpathSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { bundleCss, stylesheetBundles } from '../src/server/css';

const root = resolve(import.meta.dir, '..');
const outdir = resolve(root, 'dist');
await mkdir(outdir, { recursive: true });
const options = { outdir, target: 'browser', splitting: true, minify: true, sourcemap: 'external' } as const;
// The components overview is built on its own: each card's module is a chunk, and the
// chunks the cards share are split by which cards use them, not also by which of the
// other pages do. The Button pilot's glue builds alone for the same reason: joining
// the shared group would move every page's site.js chunk hash, and the pages that
// are not part of the pilot must stay byte for byte what they were.
for (const names of [['site', 'playground', 'preview', 'examples', 'styles', 'styles-frame', 'theme-app', 'colour-lab'], ['playground-material'], ['catalog']]) {
  const result = await Bun.build({ ...options, entrypoints: names.map(name => resolve(root, `src/client/${name}.ts`)) });
  if (!result.success) {
    for (const log of result.logs) console.error(log);
    process.exit(1);
  }
}
// Bun links node_modules/material file by file; copy from the real checkout so cp never
// has to recreate those links over files already in dist.
const mtrlDist = resolve(dirname(realpathSync(resolve(root, 'node_modules/material/package.json'))), 'dist');
await cp(resolve(mtrlDist, 'styles'), resolve(outdir, 'material/styles'), { recursive: true });
await cp(resolve(mtrlDist, 'themes'), resolve(outdir, 'material/themes'), { recursive: true });
// material-addons' light-DOM styles are that package's one stylesheet; an example frame
// using an addons component links it (server.ts's addonsStylesheet).
await mkdir(resolve(outdir, 'material-addons'), { recursive: true });
await cp(resolve(root, 'node_modules/material-addons/dist/styles.css'), resolve(outdir, 'material-addons/styles.css'));
// The elements' pre-upgrade rules, for the components overview's cards.
await cp(resolve(mtrlDist, 'elements/preupgrade.css'), resolve(outdir, 'material/elements/preupgrade.css'));
// The elements' shadow-root stylesheets, for material/ssr's link mode: one shared,
// cacheable copy instead of every server-rendered element carrying its own
// (src/server/playground-panel.ts). The folder is named for its content, so its
// URLs are cached for a year (isImmutableAsset), and base.json tells the server
// where it is. Kept out of dist/material and dist/css: the manifest does not
// re-hash these files one by one.
const elementCss = resolve(mtrlDist, 'elements/css');
const elementCssFiles = (await readdir(elementCss, { recursive: true })).filter(name => name.endsWith('.css')).sort();
const elementCssHash = createHash('sha256');
for (const name of elementCssFiles) elementCssHash.update(name).update(await readFile(resolve(elementCss, name)));
const elementCssDir = `element-css/${elementCssHash.digest('hex').slice(0, 10)}`;
await cp(elementCss, resolve(outdir, elementCssDir), { recursive: true, filter: source => !/\.(js|ts)$/.test(source) });
await writeFile(resolve(outdir, 'element-css/base.json'), JSON.stringify({ base: `/dist/${elementCssDir}/` }));
// One minified stylesheet per page type (dist/css/<page>.css), in the link order
// the pages used to request. See stylesheetBundles.
const cssDir = resolve(outdir, 'css');
await mkdir(cssDir, { recursive: true });
await Promise.all((Object.keys(stylesheetBundles) as (keyof typeof stylesheetBundles)[]).map(async name => {
  await writeFile(resolve(cssDir, `${name}.css`), bundleCss(name));
}));
// Every example in every framework, into dist/examples.
const examples = Bun.spawnSync(['bun', resolve(root, 'scripts/build-examples.ts')], { stdout: 'inherit', stderr: 'inherit' });
if (examples.exitCode !== 0) process.exit(1);
// Hashed names for every asset the HTML links, and the manifest the server reads.
const manifest = Bun.spawnSync(['bun', resolve(root, 'scripts/write-asset-manifest.ts')], { stdout: 'inherit', stderr: 'inherit' });
if (manifest.exitCode !== 0) process.exit(1);
console.log('Built site, component playgrounds, and Material preview assets.');
