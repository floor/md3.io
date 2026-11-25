// material's own size table (data/material-sizes.md, copied from the release's SIZES.md by
// scripts/sync-sizes.ts): per component, the minified and gzipped initial graph, the gzip
// delta over material's core kernel, and the gzip of chunks it loads on demand. JavaScript
// only, as a bundler keeps it from the package entry.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { components } from '../shared/components';

const root = resolve(import.meta.dir, '../..');
export interface SizeRow { name: string; slug: string | null; min: string; gzip: string; vsCore: string; deferred: string }

/** material's names that differ from the site's. */
const SITE_SLUG: Record<string, string> = { drawer: 'navigation-drawer', 'top-app-bar': 'app-bar' };

let cached: { version: string; commit: string; date: string; rows: SizeRow[] } | undefined;
export function materialSizes(version: string) {
  if (cached) return cached;
  const file = readFileSync(resolve(root, 'data/material-sizes.md'), 'utf8');
  const copied = /^<!-- material ([\d.]+),/.exec(file)?.[1];
  if (copied !== version) throw new Error(`data/material-sizes.md is for material ${copied}, the site pins ${version}: run bun run sizes:sync`);
  const [, commit = '', date = ''] = /Measured at ([0-9a-f]+) on (\d{4}-\d{2}-\d{2})/.exec(file) ?? [];
  const table = /<!-- size-table -->\r?\n([\s\S]*?)\r?\n<!-- \/size-table -->/.exec(file)?.[1];
  if (!table) throw new Error('data/material-sizes.md has no size table');
  const rows = table.split('\n').slice(2).map(line => line.split('|').slice(1, -1).map(cell => cell.trim()))
    .map(([name = '', min = '', gzip = '', vsCore = '', deferred = '']) => {
      const slug = SITE_SLUG[name] ?? name;
      return { name, slug: slug in components ? slug : null, min, gzip, vsCore, deferred };
    });
  return cached = { version, commit, date, rows };
}

/** The size table as Markdown, with the site's component names, linked to their pages. */
export function sizeTableMarkdown(version: string): string {
  const { rows } = materialSizes(version);
  const label = (row: SizeRow) => row.name === 'core' ? '**Core** (`pipe`, `createBase`, `withElement`)'
    : row.name === 'all' ? '**Everything** (`export * from \'material\'`)'
    : row.slug ? `[${components[row.slug as keyof typeof components].name}](/components/${row.slug}/)` : `\`${row.name}\``;
  return ['| Component | Minified | Gzipped | vs core | Deferred |', '| --- | ---: | ---: | ---: | ---: |',
    ...rows.map(row => `| ${label(row)} | ${row.min} | ${row.gzip} | ${row.vsCore} | ${row.deferred || '—'} |`)].join('\n');
}
