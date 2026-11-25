// Copies material's own size measurement (SIZES.md, written by material's scripts/size.ts with
// `bun run size --markdown`, and checked by its CI) for the material version this site pins,
// from that release's tag, to data/material-sizes.md. The package does not ship SIZES.md.
// Run it whenever the material pin changes: the build fails while the copy names another version.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dir, '..');
const version = JSON.parse(readFileSync(resolve(root, 'node_modules/material/package.json'), 'utf8')).version as string;
const url = `https://raw.githubusercontent.com/floor/material/v${version}/SIZES.md`;
const response = await fetch(url);
if (!response.ok) throw new Error(`${url} answered ${response.status}`);
const body = await response.text();
if (!body.includes('<!-- size-table -->')) throw new Error(`${url} has no <!-- size-table --> markers`);
writeFileSync(resolve(root, 'data/material-sizes.md'), `<!-- material ${version}, copied from ${url} -->\n${body}`);
console.log(`data/material-sizes.md: material ${version}`);
