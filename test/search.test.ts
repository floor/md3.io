import { describe, expect, test } from 'bun:test';
import { handleRequest } from '../server';
import { renderDocument } from '../src/server/content';
import { searchSite, tokenize } from '../src/server/search';

const components = (query: string) => searchSite(query).filter(result => result.section === 'Components').map(result => result.url);

describe('site search', () => {
  test('hyphenated names are terms, and so are their parts', () => {
    expect(tokenize('<m-bottom-sheet peek-height>')).toEqual(['m-bottom-sheet', 'bottom', 'sheet', 'peek-height', 'peek', 'height']);
  });
  test('an attribute finds its component first', () => {
    const [first] = searchSite('peek-height');
    expect(first).toMatchObject({ section: 'Components', title: 'Bottom sheet', url: '/components/bottom-sheet/' });
    expect(first!.snippet).toContain('peek-height');
    expect(searchSite('peek')[0]!.url).toBe('/components/bottom-sheet/');
  });
  test('an attribute several elements share finds each of them', () => {
    expect(components('no-close-on-escape').slice(0, 4).sort())
      .toEqual(['/components/bottom-sheet/', '/components/dialog/', '/components/drawer/', '/components/side-sheet/']);
  });
  test('framework component names and child tags find their component', () => {
    expect(searchSite('MDialog')[0]!.url).toBe('/components/dialog/');
    expect(searchSite('Dialog')[0]!.url).toBe('/components/dialog/');
    expect(searchSite('m-menu-item')[0]!.url).toBe('/components/menu/');
    expect(searchSite('createDialog')[0]!.url).toBe('/components/dialog/');
  });
  test('a docs heading links to its section, and the anchor exists', () => {
    const [result] = searchSite('eyedropper');
    expect(result).toMatchObject({ section: 'Docs', url: '/docs/components/colorpicker/#pipetteeyedropper-tool' });
    expect(renderDocument('colorpicker')!.html).toContain('id="pipetteeyedropper-tool"');
  });
  test('an example is found by its name', () => {
    expect(searchSite('settings').find(result => result.section === 'Examples')?.url).toBe('/examples/settings/');
  });
  test('results come one per page, grouped Components, Docs, Examples', () => {
    const results = searchSite('dialog', 50);
    expect(new Set(results.map(result => result.url.split('#')[0])).size).toBe(results.length);
    const order = results.map(result => ['Components', 'Docs', 'Examples'].indexOf(result.section));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });
  test('an empty or blank query has no results', () => {
    expect(searchSite('')).toEqual([]);
    expect(searchSite('   \n\t')).toEqual([]);
  });
  test('GET /api/search answers with JSON', async () => {
    const response = await handleRequest(new Request('http://localhost/api/search?q=peek-height&limit=3'));
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('application/json');
    const data = await response.json() as { results: { url: string }[] };
    expect(data.results.length).toBeLessThanOrEqual(3);
    expect(data.results[0]!.url).toBe('/components/bottom-sheet/');
  });
});
