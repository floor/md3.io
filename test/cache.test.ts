// Hashed asset URLs resolve, and the cache headers match the two lifetimes:
// a year and immutable for a content-hashed file, the short HTML cache for HTML
// and for the stable names a previously cached page still requests.
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { handleRequest } from '../server';
import { IMMUTABLE_CACHE, SHORT_CACHE } from '../src/server/assets';

const root = resolve(import.meta.dir, '..');
const manifest = JSON.parse(readFileSync(resolve(root, 'dist/asset-manifest.json'), 'utf8')) as Record<string, string>;
const get = (path: string) => handleRequest(new Request(`http://localhost${path}`));

const pages = ['/', '/components/button/', '/docs/', '/preview/button/', '/styles/frame/', '/examples/settings/frame/vanilla/'];

describe('content-hashed assets', () => {
  test('every script and stylesheet in the HTML is a hashed file, and it is immutable', async () => {
    const referenced = new Set<string>();
    for (const path of pages) {
      const response = await get(path);
      expect(response.headers.get('Cache-Control'), path).toBe(SHORT_CACHE);
      const html = await response.text();
      const assets = [...html.matchAll(/<(?:script|link)\b[^>]*?(?:src|href)="([^"]+\.(?:js|css))"/g)].map(match => match[1]!);
      expect(assets.length, path).toBeGreaterThan(0);
      for (const asset of assets) {
        expect(asset, path).toMatch(/\.[a-f0-9]{10}\.(?:js|css)$/);
        expect(Object.values(manifest), `${path} ${asset}`).toContain(asset);
        referenced.add(asset);
      }
    }
    for (const asset of referenced) {
      const response = await get(asset);
      expect([asset, response.status]).toEqual([asset, 200]);
      expect(response.headers.get('Cache-Control'), asset).toBe(IMMUTABLE_CACHE);
      const file = resolve(root, asset.slice(1));
      expect(new Uint8Array(await response.arrayBuffer())).toEqual(readFileSync(file));
    }
  });

  test('the stable names and the old /dist/mtrl/ tree answer with the short cache', async () => {
    const stable = ['/dist/site.js', '/dist/css/page.css', '/dist/playground.js', '/dist/material/themes/ocean.css', '/styles/preview.css', '/examples-styles/settings.css', '/assets/brand/mark.svg'];
    for (const path of stable) {
      const response = await get(path);
      expect([path, response.status]).toEqual([path, 200]);
      expect(response.headers.get('Cache-Control'), path).toBe(SHORT_CACHE);
    }
    const current = await get('/dist/material/themes/ocean.css');
    const legacy = await get('/dist/mtrl/themes/ocean.css');
    expect(legacy.status).toBe(200);
    expect(legacy.headers.get('Cache-Control')).toBe(SHORT_CACHE);
    expect(await legacy.text()).toBe(await current.text());
    // A query left over from the previous scheme does not make the stable name immutable.
    expect((await get('/dist/site.js?v=musffol1')).headers.get('Cache-Control')).toBe(SHORT_CACHE);
  });
});
