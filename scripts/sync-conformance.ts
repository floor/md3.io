// Vendors material's conformance matrix at the version md3.io pins (package.json), from the release tag:
// https://raw.githubusercontent.com/floor/material/v<version>/conformance/matrix.json (schema v1, agreed
// with material on 2026-11-26). Run on each material bump, as sizes:sync is; the page reads the
// committed copy, never the network.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dir, '..');
const version = (JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as { dependencies: Record<string, string> }).dependencies.material;
const url = `https://raw.githubusercontent.com/floor/material/v${version}/conformance/matrix.json`;
const response = await fetch(url);
if (!response.ok) {
  console.error(`No conformance matrix at v${version} (${response.status}); the page keeps its sample.`);
  process.exit(1);
}
const matrix = await response.json() as { schema?: number; material?: { version?: string } };
if (matrix.schema !== 1) throw new Error(`Unexpected schema ${matrix.schema}: the page reads schema 1`);
if (matrix.material?.version !== version) throw new Error(`The file measures material ${matrix.material?.version}, md3.io pins ${version}`);
writeFileSync(resolve(root, 'data/conformance/matrix.json'), `${JSON.stringify(matrix, null, 2)}\n`);
console.log(`Conformance matrix: material ${version}, from ${url}`);
