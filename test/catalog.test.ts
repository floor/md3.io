import { describe, expect, test } from 'bun:test';
import { handleRequest } from '../server';
import { componentSlugs, components, initialComponentState } from '../src/shared/components';
import { dialogDefaults, menuDefaults, snackbarDefaults, timepickerDefaults, tooltipDefaults } from '../src/client/catalog/defaults';
import { catalogTokens, catalogVisuals, SURFACES } from '../src/server/catalog';
import { baseline, scopedTokens } from '../src/server/tokens';

const get = async (path: string) => (await handleRequest(new Request(`http://md3.test${path}`))).text();

describe('the components overview', () => {
  test('every card shows an mtrl element, inert and hidden from assistive technology', () => {
    for (const slug of componentSlugs) {
      const visual = catalogVisuals[slug];
      expect(visual, slug).toMatch(/^<div class="catalog-visual catalog-visual--[a-z-]+" aria-hidden="true" inert>/);
      expect(visual, slug).toMatch(/<(m|md3-catalog)-[a-z-]+[ >]/);
    }
  });
  test('the overlays are surfaces, never the top-layer elements', () => {
    for (const [slug, tag] of Object.entries(SURFACES)) {
      expect(catalogVisuals[slug as keyof typeof catalogVisuals]).toContain(`<${tag}>`);
      expect(catalogVisuals[slug as keyof typeof catalogVisuals]).not.toContain(`<m-${slug}`);
    }
    // The sheets are the standard, non-modal ones.
    expect(catalogVisuals['bottom-sheet']).not.toContain(' modal');
    expect(catalogVisuals['side-sheet']).not.toContain(' modal');
  });
  test('the page loads the elements, their pre-upgrade rules and the scoped tokens, and no arrow', async () => {
    const html = await get('/components/');
    // Versioned with the build (?v=), as every script and stylesheet is
    expect(html).toMatch(/<script type="module" src="\/dist\/catalog\.js\?v=[a-z0-9]+">/);
    expect(html).toContain('/dist/mtrl/elements/preupgrade.css');
    expect(html).toContain(catalogTokens);
    expect(html).not.toContain('mtrl/styles/base.css');
    const cards = html.split('class="component-card ').slice(1);
    expect(cards.length).toBe(componentSlugs.length);
    for (const card of cards) expect(card.split('</a>')[0]).not.toContain('↗');
  });
  test("the overlay cards' configs are the playground's initial ones", () => {
    const written = { dialog: dialogDefaults, menu: menuDefaults, snackbar: snackbarDefaults, tooltip: tooltipDefaults, timepicker: timepickerDefaults };
    for (const [slug, config] of Object.entries(written)) {
      const { opener: _opener, ...playground } = components[slug as keyof typeof written].config(initialComponentState(slug as keyof typeof written)) as Record<string, unknown>;
      expect(config, slug).toEqual(playground);
    }
  });
  test('every card has its own lazily imported module', async () => {
    const entry = await Bun.file(new URL('../src/client/catalog.ts', import.meta.url)).text();
    for (const slug of componentSlugs) {
      expect(entry, slug).toContain(`import('./catalog/${slug}')`);
      // Its elements are defined when the entry calls `define`, after every chunk it needs ran.
      expect(await Bun.file(new URL(`../src/client/catalog/${slug}.ts`, import.meta.url)).text(), slug).toContain('export const define = (): void =>');
    }
    // Nothing from the playground's table or mtrl's elements is in the entry itself.
    expect(entry).not.toMatch(/^import (?!type )/m);
  });
  test('the elements bundle stays off the other pages', async () => {
    for (const path of ['/', '/components/button/', '/docs/', '/styles/']) expect(await get(path), path).not.toContain('/dist/catalog.js');
  });
});

describe('scoped tokens', () => {
  const css = scopedTokens('.scope', '.dark .scope');
  const [light, dark] = css.split('\n');
  test('light: baseline colour, typescale and shape tokens on the scope, not :root', () => {
    expect(light).toStartWith('.scope{color-scheme:light;');
    expect(light).toContain(`--mtrl-sys-color-primary:${baseline.light.get('primary')}`);
    expect(light).toMatch(/--mtrl-sys-typescale-body-large-font-size:/);
    expect(light).toMatch(/--mtrl-sys-shape-corner-[a-z-]+:/);
    expect(css).not.toContain(':root');
  });
  test('dark: the dark roles on the dark scope', () => {
    expect(dark).toStartWith('.dark .scope{color-scheme:dark;');
    expect(dark?.toLowerCase()).toContain(`--mtrl-sys-color-primary:${baseline.dark.get('primary')}`);
  });
});
