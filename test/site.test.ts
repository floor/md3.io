import { describe, expect, test } from 'bun:test';
import { handleRequest } from '../server';
import { docGroups, renderDocument } from '../src/server/content';
import { buttonConfig, defaults, normalizeState } from '../src/shared/button';
import { actions, actionSlugs, actionCode, initialActionState, normalizeActionState } from '../src/shared/actions';

const get = (path: string, method = 'GET') => handleRequest(new Request(`http://localhost${path}`, { method }));
describe('site routes and documentation', () => {
  test('landing, catalog, playground, and docs render', async () => {
    for (const path of ['/', '/components/', '/docs/', ...actionSlugs.flatMap(slug => [`/components/${slug}/`, `/preview/${slug}/`])]) {
      const response = await get(path);
      expect(response.status).toBe(200);
      expect(await response.text()).toContain('<!doctype html>');
    }
  });
  test('each action reference links to its own playground', async () => {
    for (const slug of actionSlugs) {
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
    const state = normalizeActionState('button', { text: 'Say "hello"\n</script>', icon: 'heart', disabled: true, size: 'xl', theme: 'ocean', mode: 'dark' });
    const source = actionCode('button', state);
    expect(source).toContain("import 'mtrl/themes/ocean'");
    expect(source).toContain("dataset.themeMode = 'dark'");
    const literal = source.split('createButton(')[1]!.split(');')[0]!;
    const actual = new Function(`return (${literal})`)();
    expect(actual).toEqual(actions.button.config(state));
  });
  test('an empty label has an accessible fallback', () => {
    expect(buttonConfig(normalizeState({ text: '', icon: 'download' })).ariaLabel).toBe('download');
  });
  test('action-specific values cannot escape the supported controls', () => {
    const state = normalizeActionState('extended-fab', { size: 'xl', width: 'narrow', icon: '__proto__', theme: '../private', disabled: 'false' });
    expect(state.size).toBe('small');
    expect(state.width).toBe('fixed');
    expect(state.icon).toBe('edit');
    expect(state.theme).toBe('baseline');
    expect(state.disabled).toBe(false);
  });
  test('API-only FAB states are included in the copied example', () => {
    const code = actionCode('extended-fab', { ...initialActionState('extended-fab'), collapsed: true, lowered: true });
    expect(code).toContain('extendedFab.collapse();');
    expect(code).toContain('extendedFab.lower();');
  });
});
