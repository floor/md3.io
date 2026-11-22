import { describe, expect, test } from 'bun:test';
import { handleRequest } from '../server';
import { components, initialComponentState, componentCode, elementConfig } from '../src/shared/components';
import { elementMeta } from '../src/server/elements-meta';
import { frameworkCode } from '../src/shared/frameworks';
import { searchSite } from '../src/server/search';
import { sitemapPages } from '../src/server/seo';
import { examplesUsingComponent } from '../src/server/examples';

const get = (path: string, method = 'GET') => handleRequest(new Request(`http://localhost${path}`, { method }));

describe('App bar naming and compatibility', () => {
  test('legacy playground, docs and preview URLs redirect once with query strings intact', async () => {
    for (const prefix of ['/components/', '/docs/components/', '/preview/']) {
      for (const method of ['GET', 'HEAD']) {
        const query = '?framework=vue&theme=ocean&type=large&title=A%26B';
        const response = await get(`${prefix}top-app-bar/${query}`, method);
        expect(response.status).toBe(301);
        expect(response.headers.get('Location')).toBe(`${prefix}app-bar/${query}`);
        expect((await get(response.headers.get('Location')!, method)).status).toBe(200);
      }
    }
  });

  test('canonical pages, sitemap, search and showcase links use App bar', async () => {
    for (const path of ['/components/app-bar/', '/docs/components/app-bar/']) {
      const response = await get(path);
      expect(response.status).toBe(200);
      const html = await response.text();
      expect(/<h1\b[^>]*>App bar<\/h1>/.test(html)).toBe(true);
      expect(html).toContain(`href="https://md3.io${path}"`);
      expect(html).not.toContain('href="/components/top-app-bar/"');
      expect(html).not.toContain('href="/docs/components/top-app-bar/"');
    }
    const paths = sitemapPages().map(page => page.path);
    expect(paths).toContain('/components/app-bar/');
    expect(paths).not.toContain('/components/top-app-bar/');
    expect(searchSite('createTopAppBar').find(result => result.section === 'Components')).toMatchObject({ title: 'App bar', url: '/components/app-bar/' });
    expect(examplesUsingComponent('app-bar').map(example => example.slug).sort()).toEqual(['email', 'notes', 'settings']);
  });

  test('frame styles retain the installed Material CSS name', async () => {
    const html = await (await get('/styles/frame/')).text();
    expect(html.includes('/styles/app-bar')).toBe(false);
    expect(html.includes('/styles/top-app-bar')).toBe(true);
  });

  test('the installed TopAppBar API remains in working framework samples', () => {
    const state = initialComponentState('app-bar');
    expect(components['app-bar'].factory).toBe('createTopAppBar');
    expect(componentCode('app-bar', state)).toContain('createTopAppBar');
    const meta = elementMeta('app-bar')!;
    expect(meta.name).toBe('top-app-bar');
    expect(meta.slotted?.length).toBeGreaterThan(0);
    for (const framework of ['html', 'react', 'vue', 'svelte', 'solid'] as const) {
      const code = frameworkCode(framework, meta, elementConfig('app-bar', state), { theme: 'baseline', mode: 'light' });
      expect(code).toMatch(/m-top-app-bar|TopAppBar/);
      expect(code).not.toMatch(/<m-app-bar|\bcreateAppBar\b/);
    }
  });

  test('Bottom app bar stays live, indexed, marked and points to Toolbar', async () => {
    const catalog = await (await get('/components/')).text();
    expect(catalog).toContain('<m-badge class="catalog-status" label="Deprecated"');
    for (const path of ['/components/bottom-app-bar/', '/docs/components/bottom-app-bar/']) {
      const response = await get(path);
      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain('badge="Deprecated"');
      expect(html).toContain('<strong>Deprecated.</strong>');
      expect(html).toContain('href="/components/toolbar/"');
      expect(sitemapPages().map(page => page.path)).toContain(path);
    }
    expect(searchSite('createBottomAppBar').find(result => result.section === 'Components')).toMatchObject({ title: 'Bottom app bar', group: 'Deprecated', url: '/components/bottom-app-bar/' });
  });
});
