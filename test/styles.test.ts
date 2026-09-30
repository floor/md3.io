import { describe, expect, test } from 'bun:test';
import { handleRequest } from '../server';
import { themes } from '../src/shared/button';
import { baseline, shapeScale, shapeUsage, themeBase } from '../src/server/tokens';

const get = (path: string) => handleRequest(new Request(`http://localhost${path}`));

describe('Styles pages', () => {
  for (const [path, heading] of [['/styles/', 'Styles'], ['/styles/color/', 'Color'], ['/styles/typography/', 'Typography'], ['/styles/shape/', 'Shape']] as const) {
    test(`${path} renders with Styles active in the nav and the sidebar`, async () => {
      const response = await get(path);
      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain(`<h1>${heading}</h1>`);
      expect(html).toContain('<a href="/styles/" class="active">Styles</a>');
      expect(html).toContain('<span class="header__section">Styles</span>');
      expect(html).toContain(`href="${path}" aria-current="page"`);
      expect(html).toContain('/styles/styles-pages.css');
      // mtrl's base.css would restyle the site: the Styles pages never load it.
      expect(html).not.toContain('mtrl/styles/base.css');
      // Every Styles page has the live preview, the export panel and one status region.
      expect(html).toContain('<iframe src="/styles/frame/"');
      expect(html).toContain('id="styles-export"');
      expect(html.match(/id="styles-status"/g)?.length).toBe(1);
      const base = JSON.parse(/<script type="application\/json" id="theme-base">([\s\S]*?)<\/script>/.exec(html)![1]!);
      expect(base).toEqual(JSON.parse(JSON.stringify(themeBase)));
    });
  }
  test('the overview lists the coming pages as disabled cards, and Shape as a page', async () => {
    const html = await (await get('/styles/')).text();
    for (const name of ['Elevation', 'Motion', 'States', 'Icons']) expect(html).toContain(`<h3>${name}</h3>`);
    expect(html.match(/aria-disabled="true"/g)?.length).toBe(4);
    expect(html).toContain('<a class="styles-card ui-card ui-card--interactive" href="/styles/shape/">');
    expect(html).toContain('id="styles-summary"');
  });
  test('the shape page lists every step of mtrl\'s corner scale, with its token and value', async () => {
    const html = await (await get('/styles/shape/')).text();
    const steps = Object.keys(shapeScale);
    expect(steps).toContain('medium');
    expect(steps).toContain('full');
    expect(html.match(/class="shape-step" data-step=/g)?.length).toBe(steps.length);
    for (const [step, radius] of Object.entries(shapeScale)) {
      expect(html).toContain(`data-copy="var(--mtrl-sys-shape-corner-${step})"`);
      expect(html).toContain(`mtrl: ${radius}px`);
    }
    // Only scalable steps get a fine-tune slider: none and full stay as they are.
    expect(html).toContain('id="shape-medium"');
    expect(html).not.toContain('id="shape-full"');
    expect(html).not.toContain('id="shape-none"');
    expect(html).toMatch(/id="shape-roundness" min="0" max="300"/);
    // Where mtrl uses a step, read from its compiled component styles.
    expect(shapeUsage.medium).toContain('card');
    expect(html).toMatch(/data-step="extra-large"[\s\S]*?Used by [^<]*(<a href="\/components\/[a-z-]+\/">[^<]+<\/a>, )*<a href="\/components\/dialog\/">Dialog<\/a>/);
  });
  test('the preview frame is real mtrl, isolated and not indexed', async () => {
    const response = await get('/styles/frame/');
    expect(response.status).toBe(200);
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex');
    const html = await response.text();
    expect(html).toContain('/dist/mtrl/styles/base.css');
    for (const style of ['card', 'dialog', 'button', 'chips', 'textfield']) expect(html).toContain(`/dist/mtrl/styles/${style}.css`);
    expect(html).toContain('/dist/styles-frame.js');
  });
  test('the shape page is in the sitemap and the sidebar', async () => {
    expect(await (await get('/sitemap.xml')).text()).toContain('<loc>https://md3.io/styles/shape/</loc>');
    expect(await (await get('/styles/color/')).text()).toContain('<a class="sidebar__link " href="/styles/shape/"');
  });
  test('Styles is not active on other sections, and the stylesheet stays off them', async () => {
    const html = await (await get('/components/')).text();
    expect(html).toContain('<a href="/styles/" class="">Styles</a>');
    expect(html).not.toContain('styles-pages.css');
  });
  test('the color page embeds every theme as JSON, with `<` escaped', async () => {
    const html = await (await get('/styles/color/')).text();
    const json = /<script type="application\/json" id="color-tokens">([\s\S]*?)<\/script>/.exec(html)![1]!;
    const data = JSON.parse(json) as { themes: Record<string, { light: Record<string, unknown>; dark: Record<string, unknown> }> };
    expect(Object.keys(data.themes)).toEqual([...themes]);
    expect(data.themes.baseline!.light.primary).toBe(baseline.light.get('primary')!);
    expect(json).not.toContain('<');
    expect(html).toContain('data-copy="var(--mtrl-sys-color-primary-container)"');
  });
  test('the typography page shows all 15 roles with copyable class and variable', async () => {
    const html = await (await get('/styles/typography/')).text();
    expect(html.match(/class="type-card" data-role=/g)?.length).toBe(15);
    expect(html).toContain('data-copy="mtrl-display-large"');
    // Where mtrl uses a role, read from its component styles, linked to the playground
    expect(html).toMatch(/data-role="label-large"[\s\S]*?Used by [^<]*<a href="\/components\/button\/">Button<\/a>/);
    expect(html).toContain('data-copy="mtrl-font-bold"');
  });
});
