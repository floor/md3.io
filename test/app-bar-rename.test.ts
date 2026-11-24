import { describe, expect, test } from 'bun:test';
import { handleRequest } from '../server';
import { components, initialComponentState, componentCode, componentDeprecations, elementConfig, type ComponentState } from '../src/shared/components';
import { elementMeta } from '../src/server/elements-meta';
import { frameworkCode } from '../src/shared/frameworks';
import { searchSite } from '../src/server/search';
import { sitemapPages } from '../src/server/seo';
import { examplesUsingComponent } from '../src/server/examples';

const get = (path: string, method = 'GET') => handleRequest(new Request(`http://localhost${path}`, { method }));

describe('App bar naming and compatibility', () => {
  test('legacy playground, docs and preview URLs redirect once with query strings intact', async () => {
    for (const prefix of ['/components/', '/docs/components/', '/preview/']) {
      for (const [oldSlug,newSlug] of [['top-app-bar','app-bar'],['drawer','navigation-drawer']]) for (const method of ['GET', 'HEAD']) {
        const query = '?framework=vue&theme=ocean&type=large&title=A%26B';
        const response = await get(`${prefix}${oldSlug}/${query}`, method);
        expect(response.status).toBe(301);
        expect(response.headers.get('Location')).toBe(`${prefix}${newSlug}/${query}`);
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
    expect(searchSite('createAppBar').find(result => result.section === 'Components')).toMatchObject({ title: 'App bar', url: '/components/app-bar/' });
    expect(examplesUsingComponent('app-bar').map(example => example.slug).sort()).toEqual(['email', 'notes', 'settings']);
  });

  test('frame styles retain the installed Material CSS name', async () => {
    const html = await (await get('/styles/frame/')).text();
    expect(html.includes('/styles/app-bar')).toBe(false);
    expect(html.includes('/styles/top-app-bar')).toBe(true);
  });

  test('the installed TopAppBar API remains in working framework samples', () => {
    const state = initialComponentState('app-bar');
    expect(components['app-bar'].factory).toBe('createAppBar');
    expect(componentCode('app-bar', state)).toContain('createAppBar');
    const meta = elementMeta('app-bar')!;
    expect(meta.name).toBe('top-app-bar');
    expect(meta.slotted?.length).toBeGreaterThan(0);
    for (const framework of ['html', 'react', 'vue', 'svelte', 'solid'] as const) {
      const code = frameworkCode(framework, meta, elementConfig('app-bar', state), { theme: 'baseline', mode: 'light' });
      expect(code).toMatch(/m-top-app-bar|TopAppBar/);
      expect(code).not.toMatch(/<m-app-bar|\bcreateAppBar\b/);
    }
  });

  test('Navigation drawer is renamed without changing the installed API or deprecating it', async () => {
    for (const prefix of ['/components/', '/docs/components/']) {
      const response = await get(`${prefix}navigation-drawer/`);
      expect(response.status).toBe(200);
      expect(/<h1\b[^>]*>Navigation drawer<\/h1>/.test(await response.text())).toBe(true);
    }
    const meta = elementMeta('navigation-drawer')!;
    expect(meta.name).toBe('drawer');
    expect(meta.children?.name).toBe('drawer-item');
    expect(components['navigation-drawer'].factory).toBe('createNavigationDrawer');
    expect(componentCode('navigation-drawer', initialComponentState('navigation-drawer'))).toContain('createNavigationDrawer');
    expect(componentDeprecations['navigation-drawer']).toBeUndefined();
    expect(searchSite('createNavigationDrawer').find(result => result.section === 'Components')).toMatchObject({ title: 'Navigation drawer', url: '/components/navigation-drawer/' });
    expect(sitemapPages().map(page => page.path)).not.toContain('/components/drawer/');
    expect(examplesUsingComponent('navigation-drawer').map(example => example.slug).sort()).toEqual(['email','notes']);
  });

  test('modal and closed Navigation drawer samples use the same human-readable opener', () => {
    const patches: ComponentState[] = [{ variant: 'modal' }, { open: false }];
    for (const patch of patches) {
      const state = { ...initialComponentState('navigation-drawer'), ...patch };
      const code = componentCode('navigation-drawer', state);
      expect(code).toContain("text: 'Open navigation drawer'");
      expect(code).not.toContain('Open navigation-drawer');
    }
  });

  test('Bottom app bar is gone: its URLs redirect to Toolbar, query kept', async () => {
    for (const [from, to] of [['/components/bottom-app-bar/?x=1', '/components/toolbar/?x=1'], ['/docs/components/bottom-app-bar/', '/docs/components/toolbar/'], ['/preview/bottom-app-bar/', '/preview/toolbar/']] as const) {
      const response = await get(from);
      expect(response.status).toBe(301);
      expect(response.headers.get('location')).toBe(to);
    }
    expect(await (await get('/components/')).text()).not.toContain('/components/bottom-app-bar/');
    expect(sitemapPages().map(page => page.path)).not.toContain('/components/bottom-app-bar/');
    expect(searchSite('createBottomAppBar').filter(result => result.title === 'Bottom app bar')).toEqual([]);
  });
});
