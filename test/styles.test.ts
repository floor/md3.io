import { describe, expect, test } from 'bun:test';
import { handleRequest } from '../server';
import { themes } from '../src/shared/button';
import { baseline, shapeScale, shapeUsage, themeBase } from '../src/server/tokens';
import { M3_CORNER_SCALE, M3_SHAPE_COUNT } from '../src/shared/m3-shape';
import { SHAPE_GALLERY } from '../src/shared/shape-gallery';
import { SHAPE_NAMES } from '../src/shared/shape-library';

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
      expect(html).toContain('/dist/css/styles.css');
      expect(html).not.toContain('/styles/styles-pages.css');
      expect(html).not.toContain('/styles/roboto.css');
      // mtrl's base.css would restyle the site: the Styles pages never load it.
      expect(html).not.toContain('material/styles/base.css');
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
  test('the shape page shows the M3 scale, mtrl\'s values, and the steps mtrl lacks', async () => {
    const html = await (await get('/styles/shape/')).text();
    for (const { step, dp } of M3_CORNER_SCALE) {
      const radius = shapeScale[step];
      const tile = new RegExp(`<li class="shape-tile( shape-tile--missing)?" data-step="${step}">`).exec(html);
      expect(tile).not.toBeNull();
      if (radius === undefined) {
        // In M3, not in mtrl: muted, with M3's value.
        expect(tile![1]).toBe(' shape-tile--missing');
        expect(html).toContain(`${dp}px in M3`);
      } else {
        expect(tile![1]).toBeUndefined();
        expect(html).toContain(`data-copy="var(--mtrl-sys-shape-corner-${step})"`);
      }
    }
    // mtrl's own steps are listed apart, and only editable steps get an editor.
    const extras = Object.keys(shapeScale).filter(step => !M3_CORNER_SCALE.some(entry => entry.step === step));
    expect(extras).toEqual([]);
    expect(html).not.toContain('mtrl-specific, not part of M3');
    expect(html).toContain('id="shape-edit-medium"');
    expect(html).not.toContain('id="shape-edit-full"');
    expect(html).not.toContain('id="shape-edit-none"');
    expect(html).not.toContain('roundness');
    // The gallery frame, and the expressive shapes drawn by mtrl/core/shapes.
    expect(html).toContain('<iframe class="shape-gallery" src="/styles/frame/?view=gallery" data-theme-frame="theme"');
    expect(html.match(/<li class="shape-library__item"><svg viewBox="0 0 100 100" role="img" aria-label="[^"]+"><path d="M[^"]+Z" \/>/g)?.length).toBe(SHAPE_NAMES.length);
    expect(html).toContain(`M3 defines ${M3_SHAPE_COUNT} shapes; mtrl ships these ${SHAPE_NAMES.length} today (FLO-346)`);
    // The preview starts closed here: the gallery already shows the effect.
    expect(html).toMatch(/<aside class="styles-preview styles-preview--docked" id="styles-preview" aria-label="Live preview" data-collapsible data-open="false">/);
  });
  test('every gallery pairing is a step the component\'s mtrl stylesheet reads', () => {
    for (const { step, items } of SHAPE_GALLERY) for (const { component } of items) expect(shapeUsage[step]).toContain(component);
  });
  test('the preview frame is real mtrl, isolated and not indexed', async () => {
    const response = await get('/styles/frame/');
    expect(response.status).toBe(200);
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex');
    const html = await response.text();
    expect(html).toContain('/dist/material/styles/base.css');
    for (const style of ['card', 'dialog', 'button', 'chips', 'text-field', 'checkbox']) expect(html).toContain(`/dist/material/styles/${style}.css`);
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
