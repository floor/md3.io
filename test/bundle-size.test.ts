// The Bundle size guide and the home's tree-shaking figures read material's own measurement
// (data/material-sizes.md, copied from the release's SIZES.md), for the version the site pins.
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { handleRequest } from '../server';
import { materialSizes } from '../src/server/material-sizes';
import { componentSlugs } from '../src/shared/components';

const version = JSON.parse(readFileSync(resolve(import.meta.dir, '../node_modules/material/package.json'), 'utf8')).version as string;
const page = async (path: string) => (await handleRequest(new Request(`http://localhost${path}`))).text();

describe('bundle size', () => {
  test('the copied table is for the pinned material, and measures every component the site shows', () => {
    const { rows, commit } = materialSizes(version);
    expect(commit).toMatch(/^[0-9a-f]{7,}$/);
    const measured = new Set(rows.map(row => row.slug));
    expect(componentSlugs.filter(slug => !measured.has(slug))).toEqual([]);
    for (const row of rows) expect(row.gzip, row.name).toMatch(/^\d+(\.\d+)? KB$/);
  });
  test('the guide shows the whole table, tree-shaking and how it is measured', async () => {
    const html = await page('/docs/bundle-size/');
    for (const heading of ['Size table', 'Tree-shaking', 'Measuring']) expect(html).toContain(`>${heading}</h2>`);
    const { rows } = materialSizes(version);
    expect((html.match(/<tr>/g) ?? []).length).toBe(rows.length + 1);
    expect(html).toContain(`material ${version}`);
    expect(html).toContain('bun run size');
  });
  test('the home figures are the table\'s, and link to the guide', async () => {
    const html = await page('/');
    const button = materialSizes(version).rows.find(row => row.name === 'button')!;
    expect(html).toContain(`+${Number.parseFloat(button.vsCore.replace("+", "")).toFixed(1)} KB</span>`);
    expect(html).toContain('href="/docs/bundle-size/"');
  });
});
