import { mkdir, cp } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = resolve(import.meta.dir, '..');
const outdir = resolve(root, 'dist');
await mkdir(outdir, { recursive: true });
const options = { outdir, target: 'browser', splitting: true, minify: true, sourcemap: 'external' } as const;
// The components overview is built on its own: each card's module is a chunk, and the
// chunks the cards share are split by which cards use them, not also by which of the
// other pages do.
for (const names of [['site', 'playground', 'preview', 'examples', 'styles', 'styles-frame'], ['catalog']]) {
  const result = await Bun.build({ ...options, entrypoints: names.map(name => resolve(root, `src/client/${name}.ts`)) });
  if (!result.success) {
    for (const log of result.logs) console.error(log);
    process.exit(1);
  }
}
// Bun links node_modules/mtrl file by file; copy from the real checkout so cp never
// has to recreate those links over files already in dist.
const mtrlDist = resolve(dirname(realpathSync(resolve(root, 'node_modules/mtrl/package.json'))), 'dist');
await cp(resolve(mtrlDist, 'styles'), resolve(outdir, 'mtrl/styles'), { recursive: true });
await cp(resolve(mtrlDist, 'themes'), resolve(outdir, 'mtrl/themes'), { recursive: true });
// The elements' pre-upgrade rules, for the components overview's cards.
await cp(resolve(mtrlDist, 'elements/preupgrade.css'), resolve(outdir, 'mtrl/elements/preupgrade.css'));
// Every example in every framework, into dist/examples.
const examples = Bun.spawnSync(['bun', resolve(root, 'scripts/build-examples.ts')], { stdout: 'inherit', stderr: 'inherit' });
if (examples.exitCode !== 0) process.exit(1);
console.log('Built site, component playgrounds, and Material preview assets.');
