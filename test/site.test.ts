import { describe, expect, test } from 'bun:test';
import { handleRequest } from '../server';
import { docGroups, renderDocument } from '../src/server/content';
import { buttonConfig, defaults, normalizeState } from '../src/shared/button';
import { components, componentSlugs, componentCode, initialComponentState, normalizeComponentState } from '../src/shared/components';

const get = (path: string, method = 'GET') => handleRequest(new Request(`http://localhost${path}`, { method }));
describe('site routes and documentation', () => {
  test('landing, catalog, playground, and docs render', async () => {
    for (const path of ['/', '/components/', '/docs/', ...componentSlugs.flatMap(slug => [`/components/${slug}/`, `/preview/${slug}/`])]) {
      const response = await get(path);
      expect(response.status).toBe(200);
      expect(await response.text()).toContain('<!doctype html>');
    }
  });
  test('each component reference links to its own playground', async () => {
    for (const slug of componentSlugs) {
      expect(await (await get(`/docs/components/${slug}/`)).text()).toContain(`href="/components/${slug}/">Open playground`);
    }
  });
  test('every listed document renders', async () => {
    for (const group of docGroups) for (const item of group.items) {
      const response = await get(item.href);
      expect(response.status).toBe(200);
      expect(await response.text()).toContain('class="md"');
    }
  });
  test('headings, relative links, and the old sheet link are routable', () => {
    const document = renderDocument('drawer')!;
    expect(document.html).toContain('/docs/components/bottom-sheet/');
    expect(document.html).toContain('/docs/components/menu/');
    for (const heading of document.toc) expect(document.html).toContain(`id="${heading.id}"`);
  });
  test('unknown documents and private paths are not served', async () => {
    for (const path of ['/docs/components/missing/', '/package.json', '/.git/config', '/styles/..%2Fpackage.json', '/dist/private.map']) {
      expect((await get(path)).status).toBe(404);
    }
  });
  test('redirects preserve query strings and HEAD has no body', async () => {
    const redirect = await get('/components/button?size=l');
    expect(redirect.status).toBe(308);
    expect(redirect.headers.get('Location')).toBe('/components/button/?size=l');
    const head = await get('/components/button/', 'HEAD');
    expect(head.status).toBe(200);
    expect(await head.text()).toBe('');
    expect((await get('/', 'POST')).status).toBe(405);
  });
});
describe('preview configuration and generated code', () => {
  test('untrusted preview state is normalized', () => {
    const state = normalizeState({ variant: 'invalid', size: 'huge', icon: '__proto__', theme: '../../file', text: 'a'.repeat(200), disabled: 'false' });
    expect(state.variant).toBe(defaults.variant);
    expect(state.icon).toBe('none');
    expect(state.theme).toBe('baseline');
    expect(state.text).toHaveLength(80);
    expect(state.disabled).toBe(false);
  });
  test('copied code uses the same config as the live preview and safely quotes text', () => {
    const state = normalizeComponentState('button', { text: 'Say "hello"\n</script>', icon: 'heart', disabled: true, size: 'xl', theme: 'ocean', mode: 'dark' });
    const source = componentCode('button', state);
    expect(source).toContain("import 'mtrl/themes/ocean'");
    expect(source).toContain("dataset.themeMode = 'dark'");
    const literal = source.split('createButton(')[1]!.split(');')[0]!;
    const actual = new Function(`return (${literal})`)();
    expect(actual).toEqual(components.button.config(state));
  });
  test('an empty label has an accessible fallback', () => {
    expect(buttonConfig(normalizeState({ text: '', icon: 'download' })).ariaLabel).toBe('download');
  });
  test('action-specific values cannot escape the supported controls', () => {
    const state = normalizeComponentState('extended-fab', { size: 'xl', width: 'narrow', icon: '__proto__', theme: '../private', disabled: 'false' });
    expect(state.size).toBe('small');
    expect(state.width).toBe('fixed');
    expect(state.icon).toBe('edit');
    expect(state.theme).toBe('baseline');
    expect(state.disabled).toBe(false);
  });
  test('API-only FAB states are included in the copied example', () => {
    const code = componentCode('extended-fab', { ...initialComponentState('extended-fab'), collapsed: true, lowered: true });
    expect(code).toContain('extendedFab.collapse();');
    expect(code).toContain('extendedFab.lower();');
  });
});


describe('list anatomy playground', () => {
  test('structural entries retain data IDs and copied code matches the configured anatomy', () => {
    const state = normalizeComponentState('list', { ...initialComponentState('list'), lines: '3', leading: 'image', trailing: 'control', subheader: true, overline: true, dividers: 'inset', count: '5', selection: 'multi', fifth: true, disableLast: true });
    const config = components.list.config(state);
    expect(config.items.filter(item => item.kind === 'divider')).toHaveLength(4);
    expect(config.items.filter(item => item.id).map(item => item.id)).toEqual(['1', '2', '3', '4', '5']);
    expect(config.initialSelection).toEqual(['1', '5']);
    expect(config.items.at(-1)?.disabled).toBe(true);
    const code = componentCode('list', state);
    const literal = code.split('const list = createList(')[1]!.split(');')[0]!;
    expect(new Function(`return (${literal})`)()).toEqual(config);
    expect(code).toContain("list.element.removeEventListener('click', onListAction)");
    expect(code).toContain('Replace the demo image paths');
  });
  test('one-line examples omit text slots without losing their configured values', () => {
    const state = normalizeComponentState('list', { ...initialComponentState('list'), lines: '1', overline: true, supportingText: 'Keep this for later' });
    expect(components.list.config(state).items[0]?.supportingText).toBeUndefined();
    expect(components.list.config(state).items[0]?.overline).toBeUndefined();
    expect(state.supportingText).toBe('Keep this for later');
    expect(state.hasSupporting).toBe(false);
  });
});


test('date picker clearing and partial ranges stay reproducible in View code', () => {
  const empty = normalizeComponentState('datepicker', { ...initialComponentState('datepicker'), value: '', endDate: '' });
  expect(empty.value).toBe('');
  expect(components.datepicker.config(empty).value).toBeUndefined();
  const partial = normalizeComponentState('datepicker', { ...empty, range: true, value: '2026-09-22' });
  expect(components.datepicker.config(partial).value).toBe('2026-09-22');
  const code = componentCode('datepicker', empty);
  expect(code).toContain("import 'mtrl/styles/datepicker'");
  expect(code).not.toContain('MutationObserver');
});
