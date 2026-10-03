import { describe, expect, test } from 'bun:test';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { handleRequest } from '../server';
import { docHref, docSlugs } from '../src/server/content';
import { componentSlugs } from '../src/shared/components';
import { examples } from '../src/server/examples';
import { stylePages } from '../src/server/styles';
import { mtrlVersion } from '../src/server/tokens';
import { gitDates, jsonForScript } from '../src/server/seo';

const get = (path: string) => handleRequest(new Request(`http://localhost${path}`));
const jsonLd = (html: string) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]!));

describe('sitemap and robots', () => {
  test('the sitemap lists every public page once, with a lastmod, and nothing internal', async () => {
    const response = await get('/sitemap.xml');
    expect(response.headers.get('Content-Type')).toContain('application/xml');
    const xml = await response.text();
    const paths = [...xml.matchAll(/<loc>https:\/\/md3\.io([^<]*)<\/loc>/g)].map(match => match[1]!);
    const expected = ['/', '/components/', '/docs/', '/examples/', '/privacy/', ...componentSlugs.map(slug => `/components/${slug}/`), ...docSlugs.map(docHref),
      ...stylePages.map(page => page.href), ...examples.map(example => `/examples/${example.slug}/`)];
    expect([...paths].sort()).toEqual([...new Set(expected)].sort());
    expect(paths.filter(path => /^\/(preview|api)\/|\/frame\//.test(path))).toEqual([]);
    expect([...xml.matchAll(/<lastmod>([^<]*)<\/lastmod>/g)].every(match => /^\d{4}-\d{2}-\d{2}$/.test(match[1]!))).toBe(true);
    expect(xml.match(/<lastmod>/g)!.length).toBe(paths.length);
  });
  test('a page\'s lastmod is its source file\'s last commit, and no git means no dates, not an error', async () => {
    const dates = gitDates();
    const xml = await (await get('/sitemap.xml')).text();
    expect(xml).toContain(`<loc>https://md3.io/docs/components/button/</loc><lastmod>${dates.get('docs/components/button.md')}</lastmod>`);
    expect(gitDates(mkdtempSync(join(tmpdir(), 'md3-seo-'))).size).toBe(0);
  });
  test('robots.txt allows the site, keeps crawlers out of the internal routes, and names the sitemap', async () => {
    expect(await (await get('/robots.txt')).text()).toBe('User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /preview/\n\nSitemap: https://md3.io/sitemap.xml\n');
  });
});

describe('page head', () => {
  test('a documentation page has its canonical, preview, icon and theme tags', async () => {
    const html = await (await get('/docs/components/button/')).text();
    for (const tag of [
      '<link rel="canonical" href="https://md3.io/docs/components/button/" />',
      '<meta property="og:url" content="https://md3.io/docs/components/button/" />',
      '<meta property="og:site_name" content="md3.io" />',
      '<meta property="og:image" content="https://md3.io/og-image.png" />',
      '<meta property="og:image:width" content="1200" />',
      '<meta name="twitter:card" content="summary_large_image" />',
      '<meta name="twitter:image" content="https://md3.io/og-image.png" />',
      '<meta name="twitter:title" content="Button documentation — material" />',
      '<link rel="icon" href="/favicon.svg" type="image/svg+xml" />',
      '<link rel="apple-touch-icon" href="/apple-touch-icon.png" />',
      '<meta name="theme-color" content="#0c0c10" media="(prefers-color-scheme: dark)" />',
    ]) expect(html).toContain(tag);
  });
  test('a front matter description replaces the summary as the meta description', async () => {
    const html = await (await get('/docs/architecture/')).text();
    expect(html).toContain('<meta name="description" content="How the material library is built in layers');
  });
});

describe('structured data', () => {
  test('the home page describes mtrl and the site, with the search /?q= opens', async () => {
    const [app, site] = jsonLd(await (await get('/')).text());
    expect(app).toMatchObject({ '@type': 'SoftwareApplication', name: 'material', softwareVersion: mtrlVersion, codeRepository: 'https://github.com/floor/material', license: 'https://opensource.org/licenses/MIT', url: 'https://md3.io' });
    expect(site).toMatchObject({ '@type': 'WebSite', url: 'https://md3.io', potentialAction: { '@type': 'SearchAction', target: 'https://md3.io/?q={search_term_string}' } });
  });
  test('every other page has its trail: Home, its section, the page', async () => {
    const trail = async (path: string) => jsonLd(await (await get(path)).text()).map(data => [data['@type'], data.itemListElement.map((item: { name: string; item: string }) => `${item.name} ${item.item}`)]);
    expect(await trail('/docs/components/button/')).toEqual([['BreadcrumbList', ['Home https://md3.io/', 'Documentation https://md3.io/docs/', 'Button documentation https://md3.io/docs/components/button/']]]);
    expect(await trail('/components/switch/')).toEqual([['BreadcrumbList', ['Home https://md3.io/', 'Components https://md3.io/components/', 'Switch https://md3.io/components/switch/']]]);
    expect(await trail('/styles/color/')).toEqual([['BreadcrumbList', ['Home https://md3.io/', 'Styles https://md3.io/styles/', 'Color https://md3.io/styles/color/']]]);
    expect(await trail('/examples/')).toEqual([['BreadcrumbList', ['Home https://md3.io/', 'Examples https://md3.io/examples/']]]);
  });
  test('no text can close the script element', () => {
    const json = jsonForScript({ name: '</script><script>alert(1)</script> & more' });
    expect(json).not.toContain('<');
    expect(JSON.parse(json).name).toBe('</script><script>alert(1)</script> & more');
  });
});

describe('internal routes, errors and images', () => {
  test('previews and example frames are not indexed; pages are', async () => {
    expect((await get('/preview/button/')).headers.get('X-Robots-Tag')).toBe('noindex');
    expect((await get(`/examples/${examples[0]!.slug}/frame/vanilla/`)).headers.get('X-Robots-Tag')).toBe('noindex');
    expect((await get('/components/button/')).headers.get('X-Robots-Tag')).toBeNull();
  });
  test('an unknown page is a 404, without structured data', async () => {
    const response = await get('/no-such-page/');
    expect(response.status).toBe(404);
    expect(jsonLd(await response.text())).toEqual([]);
  });
  test('the icons and the preview image are served, cached, at their sizes', async () => {
    for (const [path, type] of [['/favicon.ico', 'image/x-icon'], ['/favicon.svg', 'image/svg+xml'], ['/apple-touch-icon.png', 'image/png'], ['/og-image.png', 'image/png']]) {
      const response = await get(path!);
      expect([path, response.status, response.headers.get('Content-Type')]).toEqual([path, 200, type]);
      expect(response.headers.get('Cache-Control')).toContain('max-age=');
    }
    // A PNG's width and height are the IHDR chunk's first two fields.
    const size = async (path: string) => { const png = Buffer.from(await (await get(path)).arrayBuffer()); return [png.readUInt32BE(16), png.readUInt32BE(20)]; };
    expect(await size('/og-image.png')).toEqual([1200, 630]);
    expect(await size('/apple-touch-icon.png')).toEqual([180, 180]);
    // One source: favicon.svg is the mark as scripts/brand-images.ts copied it, and the header shows it.
    expect(await (await get('/favicon.svg')).text()).toBe(readFileSync(join(import.meta.dir, '../assets/brand/mark.svg'), 'utf8'));
    const manifest = JSON.parse(readFileSync(join(import.meta.dir, '../dist/asset-manifest.json'), 'utf8')) as Record<string, string>;
    const mark = manifest['/assets/brand/mark.svg']!;
    expect(await (await get('/')).text()).toContain(`<img class="header__mark" src="${mark}" width="20" height="20" alt="" aria-hidden="true">material`);
    expect((await get('/assets/brand/mark.svg')).headers.get('Content-Type')).toBe('image/svg+xml');
    expect((await get(mark)).headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
    const ico = Buffer.from(await (await get('/favicon.ico')).arrayBuffer());
    expect([ico.readUInt16LE(2), ico.readUInt16LE(4), ico[6], ico[22]]).toEqual([1, 2, 16, 32]);
  });
});
