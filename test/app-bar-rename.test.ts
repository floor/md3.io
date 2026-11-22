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

  test('Navigation drawer is renamed without changing the installed API or deprecating it', async () => {
    for (const prefix of ['/components/', '/docs/components/']) {
      const response = await get(`${prefix}navigation-drawer/`);
      expect(response.status).toBe(200);
      expect(/<h1\b[^>]*>Navigation drawer<\/h1>/.test(await response.text())).toBe(true);
    }
    const meta = elementMeta('navigation-drawer')!;
    expect(meta.name).toBe('drawer');
    expect(meta.children?.name).toBe('drawer-item');
    expect(components['navigation-drawer'].factory).toBe('createDrawer');
    expect(componentCode('navigation-drawer', initialComponentState('navigation-drawer'))).toContain('createDrawer');
    expect(componentDeprecations['navigation-drawer']).toBeUndefined();
    expect(searchSite('createDrawer').find(result => result.section === 'Components')).toMatchObject({ title: 'Navigation drawer', url: '/components/navigation-drawer/' });
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

  test('Bottom app bar stays live, indexed, marked and points to Toolbar', async () => {
    const catalog = await (await get('/components/')).text();
    expect(catalog).toContain('<m-badge variant="small" label="Deprecated"');
    expect(catalog).toContain('</m-badge> Deprecated</span>');
    for (const path of ['/components/bottom-app-bar/', '/docs/components/bottom-app-bar/']) {
      const response = await get(path);
      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain('badge="Depr."');
      expect(html).toContain('<strong>Deprecated.</strong>');
      expect(html).toContain('href="/components/toolbar/"');
      expect(sitemapPages().map(page => page.path)).toContain(path);
    }
    const docs = await (await get('/docs/components/bottom-app-bar/')).text();
    const article = docs.split('<article class="md">')[1]?.split('</article>')[0] ?? '';
    expect((article.match(/<strong>Deprecated\.<\/strong>/g) ?? []).length).toBe(1);
    const title = article.indexOf('<h1');
    const description = article.indexOf('A bottom app bar puts');
    const chips = article.indexOf('class="framework-chips-row');
    const notice = article.indexOf('<blockquote>');
    expect(title >= 0 && description > title && chips > description && notice > chips).toBe(true);
    expect(article.includes('href="/components/toolbar/"')).toBe(true);
    expect(searchSite('createBottomAppBar').find(result => result.section === 'Components')).toMatchObject({ title: 'Bottom app bar', group: 'Deprecated', url: '/components/bottom-app-bar/' });
  });
});
