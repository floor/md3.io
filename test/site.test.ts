import { describe, expect, test } from 'bun:test';
import { handleRequest } from '../server';
import { docGroups, renderDocument } from '../src/server/content';
import { buttonConfig, defaults, normalizeState } from '../src/shared/button';
import { components, componentSlugs, componentCode, elementConfig, initialComponentState, normalizeComponentState } from '../src/shared/components';
import { symbolByFile } from '../src/shared/icons';
import { frameworkCode } from '../src/shared/frameworks';
import { elementMeta } from '../src/server/elements-meta';

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
    expect(source).toContain("import favoriteIcon from './icons/favorite.svg?raw';");
    // The icons are imports: bind each imported name to its file's SVG.
    const imports = [...source.matchAll(/^import (\w+) from '\.\/icons\/([\w-]+)\.svg\?raw';$/gm)];
    const names = imports.map(m => m[1]!);
    const values = imports.map(m => symbolByFile(m[2]!));
    const literal = source.split('createButton(')[1]!.split(');')[0]!;
    const actual = new Function(...names, `return (${literal})`)(...values);
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

describe('framework code for the overlay elements', () => {
  const code = (slug: Parameters<typeof initialComponentState>[0], framework: 'html' | 'react' | 'vue' | 'svelte' | 'solid', input: Record<string, unknown> = {}) => {
    const state = normalizeComponentState(slug, { ...initialComponentState(slug), ...input });
    return frameworkCode(framework, elementMeta(slug)!, elementConfig(slug, state), { theme: 'baseline', mode: 'light' });
  };
  test('a dialog opens from its trigger, and its actions and close event close it', () => {
    const html = code('dialog', 'html');
    expect(html).toContain('<m-button id="dialog-trigger" variant="tonal">Open dialog</m-button>');
    expect(html).toContain("document.querySelector('#dialog-trigger').addEventListener('click', () => dialog.show());");
    expect(html).toContain(`dialog.querySelectorAll('m-button[slot="actions"]').forEach((child) => child.addEventListener('click', () => dialog.close()));`);
    expect(html).toContain('<m-dialog headline="Save your changes?">\n  <p>Keep your changes before leaving this view.</p>');
    const react = code('dialog', 'react');
    expect(react).toContain('const [open, setOpen] = useState(false);');
    expect(react).toContain('<Dialog open={open} onClose={() => setOpen(false)} headline="Save your changes?">');
    expect(react).toContain('<Button slot="actions" variant="text" onClick={() => setOpen(false)}>Cancel</Button>');
    expect(code('dialog', 'vue')).toContain('<MDialog :open="open" @close="open = false"');
    expect(code('dialog', 'svelte')).toContain('<Dialog open={open} onclose={() => (open = false)}');
    // Full screen brings the close button the playground asks for.
    expect(code('dialog', 'html', { size: 'fullscreen', closeButton: true })).not.toContain('Not yet exposed');
  });
  test('a menu is anchored to its trigger, with its submenu nested and a gap named', () => {
    const html = code('menu', 'html', { submenu: true, variant: 'gap' });
    expect(html).toContain('<m-button id="menu-trigger" variant="tonal">Open menu</m-button>');
    expect(html).toContain('anchor="menu-trigger"');
    expect(html).toContain('<m-menu-item value="share">\n    Share\n    <m-menu-item value="link">Copy link</m-menu-item>');
    expect(html).toContain('Not yet exposed by the element: items[].type (gap).');
    expect(html).not.toContain('<m-menu-item></m-menu-item>');
    // The anchor opens it: the state follows the element both ways.
    expect(code('menu', 'react')).toContain('<Menu open={open} onOpen={() => setOpen(true)} onClose={() => setOpen(false)}');
  });
  test('the modal drawer and a tooltip target are generated, not noted', () => {
    const drawer = code('drawer', 'html', { variant: 'modal' });
    expect(drawer).toContain(' modal>');
    expect(drawer).not.toContain('Not yet exposed');
    expect(code('tooltip', 'html')).toContain('<m-icon-button id="tooltip-target" aria-label="Favorite" variant="tonal"></m-icon-button>');
    expect(code('tooltip', 'html')).toContain('for="tooltip-target"');
  });
  test('values that need quoting stay valid code', () => {
    expect(code('switch', 'html')).toContain("const switchElement = document.querySelector('m-switch');");
    expect(code('textfield', 'react', { label: 'Say "hi" {now}' })).toContain('label={"Say \\"hi\\" {now}"}');
    expect(code('button', 'svelte', { text: 'a {b}' })).toContain('>a &#123;b&#125;</Button>');
  });
});
