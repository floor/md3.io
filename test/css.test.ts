import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { bundleCss, minifyCss } from '../src/server/css';

const at = (css: string, needle: string) => {
  const index = css.indexOf(needle);
  expect(css, needle).toContain(needle);
  return index;
};

describe('stylesheets', () => {
  test('minifying keeps strings, calc, and font sources, and drops comments', () => {
    const ui = minifyCss(readFileSync(resolve(import.meta.dir, '../styles/ui.css'), 'utf8'));
    expect(ui).not.toContain('/*');
    expect(ui).toContain('.ui-card');
    expect(ui).toContain('viewBox="0 0 24 24"');
    expect(ui).toContain('content:""');
    const search = minifyCss(readFileSync(resolve(import.meta.dir, '../styles/search.css'), 'utf8'));
    // `[open] .search-dialog` is a descendant. Dropping the space would restyle the dialog itself.
    expect(search).toContain('.search-overlay[open] .search-dialog{transform:scale(0.98)}');
    const shell = minifyCss(readFileSync(resolve(import.meta.dir, '../styles/shell.css'), 'utf8'));
    expect(shell).toContain('calc(100vh - var(--header-height))');
    const syntax = minifyCss(readFileSync(resolve(import.meta.dir, '../styles/syntax.css'), 'utf8'));
    expect(syntax).toContain('[data-theme-mode="light"] .hljs{');
    // The space is the descendant combinator. `.item:is(button)` would match the item itself.
    const list = minifyCss(readFileSync(resolve(import.meta.dir, '../node_modules/mtrl/dist/styles/list.css'), 'utf8'));
    expect(list).toContain('.mtrl-list__item :is(button');
    const site = minifyCss(readFileSync(resolve(import.meta.dir, '../styles/site.css'), 'utf8'));
    expect(site).toContain('(max-width:1000px) and (min-width:721px)');
    const preview = minifyCss(readFileSync(resolve(import.meta.dir, '../styles/preview.css'), 'utf8'));
    expect(preview).toContain('#stage> :is(.mtrl-switch,.mtrl-slider,.mtrl-textfield,.mtrl-select,.mtrl-search)');
    const tokens = minifyCss(readFileSync(resolve(import.meta.dir, '../styles/tokens.css'), 'utf8'));
    expect(tokens).toContain('url("/fonts/DIN-Alternate-Regular.woff2") format("woff2")');
    const base = readFileSync(resolve(import.meta.dir, '../node_modules/mtrl/dist/styles/base.css'), 'utf8');
    const min = minifyCss(base);
    expect(min.split('{').length).toBe(min.split('}').length);
    expect(min).toContain('@layer');
  });

  test('each page bundle is that page\'s old links, in that order, minified', () => {
    const home = bundleCss('home');
    expect(home).not.toMatch(/\/\*(?!\!)/);
    const order = ['DIN Alternate', '.skip-link', '.ui-card', '.doc-install', '.hljs-keyword', '.hero__tagline', '.header__mark', '.header__search'];
    order.reduce((prev, needle) => { const index = at(home, needle); expect(index).toBeGreaterThan(prev); return index; }, -1);
    expect(home).not.toContain('.catalog-visual');
    expect(home).not.toContain('.example-layout');

    const page = bundleCss('page');
    expect(page).toContain('.header__search');
    // .hero__tagline also lives in site.css. .hero__frameworks is homepage.css only.
    expect(page).not.toContain('.hero__frameworks');
    expect(home).toContain('.hero__frameworks');

    const catalog = bundleCss('catalog');
    // "Roboto" also appears in the token font stack. The self-hosted file is roboto.css only.
    const catalogOrder = ['.header__search', 'Roboto-latin-wght.woff2', 'mtrl.preupgrade', 'm-button:not(:defined)', '.catalog-visual'];
    catalogOrder.reduce((prev, needle) => { const index = at(catalog, needle); expect(index).toBeGreaterThan(prev); return index; }, -1);
    expect(catalog).not.toContain('.hero__frameworks');

    const examples = bundleCss('examples');
    expect(at(examples, '.header__search')).toBeLessThan(at(examples, '.example-layout'));
    expect(examples).not.toContain('.catalog-visual');

    const styles = bundleCss('styles');
    expect(at(styles, '.header__search')).toBeLessThan(at(styles, 'Roboto-latin-wght.woff2'));
    expect(at(styles, 'Roboto-latin-wght.woff2')).toBeLessThan(at(styles, '.styles-page'));
    expect(styles).not.toContain('.catalog-visual');
    expect(styles.split('{').length).toBe(styles.split('}').length);
  });
});
