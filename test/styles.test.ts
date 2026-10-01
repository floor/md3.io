import { describe, expect, test } from 'bun:test';
import { handleRequest } from '../server';
import { themes } from '../src/shared/button';
import { baseline } from '../src/server/tokens';

const get = (path: string) => handleRequest(new Request(`http://localhost${path}`));

describe('Styles pages', () => {
  for (const [path, heading] of [['/styles/', 'Styles'], ['/styles/color/', 'Color'], ['/styles/typography/', 'Typography']] as const) {
    test(`${path} renders with Styles active in the nav and the sidebar`, async () => {
      const response = await get(path);
      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain(`<h1>${heading}</h1>`);
      expect(html).toContain('<a href="/styles/" class="active">Styles</a>');
      expect(html).toContain('<span class="header__section">Styles</span>');
      expect(html).toContain(`href="${path}" aria-current="page"`);
      expect(html).toContain('/dist/css/styles.css');
      expect(html).not.toContain('/styles/styles-pages.css');
      expect(html).not.toContain('/styles/roboto.css');
      // mtrl's base.css would restyle the site: the Styles pages never load it.
      expect(html).not.toContain('mtrl/styles/base.css');
    });
  }
  test('the overview lists the coming pages as disabled cards', async () => {
    const html = await (await get('/styles/')).text();
    for (const name of ['Elevation', 'Shape', 'Motion', 'States', 'Icons']) expect(html).toContain(`<h3>${name}</h3>`);
    expect(html.match(/aria-disabled="true"/g)?.length).toBe(5);
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
