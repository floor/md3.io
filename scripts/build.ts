import { mkdir, cp } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dir, '..');
const outdir = resolve(root, 'dist');
await mkdir(outdir, { recursive: true });
const result = await Bun.build({
  entrypoints: ['site', 'playground', 'preview'].map(name => resolve(root, `src/client/${name}.ts`)),
  outdir, target: 'browser', splitting: true, minify: true, sourcemap: 'external',
});
if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}
const mtrlDist = resolve(root, 'node_modules/mtrl/dist');
await cp(resolve(mtrlDist, 'styles'), resolve(outdir, 'mtrl/styles'), { recursive: true });
// Date picker is currently available only in the full library stylesheet.
await cp(resolve(mtrlDist, 'styles.css'), resolve(outdir, 'mtrl/styles/full.css'));
await cp(resolve(mtrlDist, 'themes'), resolve(outdir, 'mtrl/themes'), { recursive: true });
console.log('Built site, component playgrounds, and Material preview assets.');
