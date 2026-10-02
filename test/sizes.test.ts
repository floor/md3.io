import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { handleRequest } from '../server';
import { componentSlugs } from '../src/shared/components';
import { sizes } from '../src/server/sizes';

// data/sizes.json is written by `bun run sizes`: re-run it when mtrl changes version.
describe('component sizes', () => {
  test('are measured on the installed mtrl', () => {
    const { version } = JSON.parse(readFileSync('node_modules/material/package.json', 'utf8')) as { version: string };
    expect(sizes.material).toBe(version);
  });

  test('cover every component, for the factory and the element', () => {
    expect(Object.keys(sizes.components).sort()).toEqual([...componentSlugs].sort());
    for (const slug of componentSlugs) for (const flavour of ['factory', 'element'] as const) {
      const size = sizes.components[slug]![flavour];
      expect(size.alone).toBeGreaterThan(size.added);
      expect(size.added).toBeGreaterThan(0);
    }
  });

  test('show on the component page, one line per flavour', async () => {
    const page = await (await handleRequest(new Request('http://localhost/components/button/'))).text();
    const kb = (n: number) => (n / 1024).toFixed(1);
    expect(page).toMatch(new RegExp(`<span data-flavour="factory" [^>]*><strong>${kb(sizes.components.button!.factory.added)} KB</strong> gzip`));
    expect(page).toMatch(new RegExp(`<span data-flavour="element" hidden [^>]*><strong>${kb(sizes.components.button!.element.added)} KB</strong> gzip`));
  });
});
