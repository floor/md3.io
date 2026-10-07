import { describe, expect, test } from 'bun:test';
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { handleRequest } from '../server';
import { docGroups, installSpecifier, PACKAGE_MANAGERS, renderDocument } from '../src/server/content';
import { buttonConfig, defaults, normalizeState } from '../src/shared/button';
import { components, componentSlugs, componentCode, elementConfig, initialComponentState, normalizeComponentState } from '../src/shared/components';
import { symbolByFile, symbols } from '../src/shared/icons';
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
  test('the breadcrumb separator is hidden from assistive technology', async () => {
    expect(await (await get('/docs/')).text()).toContain('<span class="header__sep" aria-hidden="true">/');
  });
  test('a guide keeps the section name and the docs overview does not', async () => {
    const headerClass = (html: string) => html.match(/<header class="([^"]*)"/)?.[1];
    expect(headerClass(await (await get('/docs/getting-started/')).text())).toBe('header header--section-only');
    expect(headerClass(await (await get('/docs/')).text())).toBe('header');
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
  test('installSpecifier names the next dist-tag for a prerelease', () => {
    expect(installSpecifier('3.0.0-next.0')).toBe('material@next');
    expect(installSpecifier('3.0.0')).toBe('material');
    expect(installSpecifier('3.1.0-next.2')).toBe('material@next');
  });
  test('an install block gives the command of each package manager, npm first', () => {
    const html = renderDocument('getting-started')!.html;
    const text = html.replace(/<[^>]+>/g, '');
    const specifier = installSpecifier(JSON.parse(readFileSync('node_modules/material/package.json', 'utf8')).version as string);
    for (const { command } of PACKAGE_MANAGERS) expect(text).toContain(`${command} ${specifier}`);
    expect([...html.matchAll(/class="doc-install__option" data-package-manager="(\w+)" aria-pressed="(\w+)"/g)].map(m => [m[1], m[2]]))
      .toEqual([['bun', 'true'], ['npm', 'false'], ['pnpm', 'false'], ['yarn', 'false']]);
    expect(html).not.toContain('language-install');
  });
  test('the homepage and getting started install the specifier for the installed version', async () => {
    const specifier = installSpecifier(JSON.parse(readFileSync('node_modules/material/package.json', 'utf8')).version as string);
    const visible = (html: string) => html.replace(/<[^>]+>/g, '');
    const home = visible(await (await get('/')).text());
    const started = visible(renderDocument('getting-started')!.html);
    for (const { command } of PACKAGE_MANAGERS) {
      expect(home).toContain(`${command} ${specifier}`);
      expect(started).toContain(`${command} ${specifier}`);
    }
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
  test('the retired segmented button URL redirects to the button group', async () => {
    const response = await get('/docs/components/segmented-button/');
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe('/docs/components/button-group/');
  });
  test('the text field slug redirects from textfield to text-field', async () => {
    for (const [from, to] of [['/components/textfield/', '/components/text-field/'], ['/preview/textfield/', '/preview/text-field/'], ['/docs/components/textfield/', '/docs/components/text-field/']] as const) {
      const response = await get(`${from}?theme=ocean`);
      expect(response.status).toBe(301);
      expect(response.headers.get('Location')).toBe(`${to}?theme=ocean`);
    }
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
    expect(source).toContain("import 'material/themes/ocean'");
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
  expect(code).toContain("import 'material/styles/datepicker'");
  expect(code).not.toContain('MutationObserver');
});

describe('icon button scenarios', () => {
  const rows = [
    ['favorite', 'standard', 'heart', 'Favorite', false],
    ['reservation-date', 'tonal', 'calendarToday', 'Choose a date', false],
    ['browse-albums', 'outlined', 'chevronRight', 'More albums', false],
    ['raise-hand', 'tonal', 'frontHand', 'Raise hand', false],
    ['stop-timer', 'filled', 'stop', 'Stop', true],
  ] as const;
  test('each figure is one icon button, unselected, with its own glyph', () => {
    expect(components['icon-button'].scenarios.map(item => item.id)).toEqual(rows.map(([id]) => id));
    for (const [id, variant, icon, label, large] of rows) {
      const scenario = components['icon-button'].scenarios.find(item => item.id === id);
      if (!scenario) throw new Error(`missing icon button scenario ${id}`);
      const state = normalizeComponentState('icon-button', { ...initialComponentState('icon-button'), ...scenario.options });
      const config = components['icon-button'].config(state);
      expect(config.variant).toBe(variant);
      expect(config.icon).toBe(symbols[icon]);
      expect(config.ariaLabel).toBe(label);
      expect(config.selected).toBe(false);
      expect(config.toggle).toBe(false);
      expect(config.size).toBe(large ? 'l' : 's');
      expect(scenario.description).not.toContain('shown selected');
    }
    expect(components['icon-button'].scenarios.find(item => item.id === 'favorite')?.description).toContain('tooltip "Favorite"');
  });
});

describe('button group scenarios', () => {
  test('the default items stay Bold, Italic and Underline', () => {
    const config = components['button-group'].config(initialComponentState('button-group'));
    expect(config.buttons).toEqual([
      { value: 'bold', ariaLabel: 'Bold', text: 'Bold' },
      { value: 'italic', ariaLabel: 'Italic', text: 'Italic' },
      { value: 'underline', ariaLabel: 'Underline', text: 'Underline' },
    ]);
    expect(config.ariaLabel).toBe('Text formatting');
  });
  test('select size and price are the figure’s items, with the figure’s selection', () => {
    const apply = (id: string) => {
      const scenario = components['button-group'].scenarios.find(item => item.id === id);
      if (!scenario) throw new Error(`missing button group scenario ${id}`);
      const state = normalizeComponentState('button-group', { ...initialComponentState('button-group'), ...scenario.options });
      return { state, config: components['button-group'].config(state) };
    };
    const sizes = apply('select-size');
    expect(sizes.config.kind).toBe('connected');
    expect(sizes.config.selection).toBe('single');
    expect(sizes.config.buttons?.map(item => [item.text, item.selected === true])).toEqual([['8oz', true], ['12oz', false], ['16oz', false]]);
    const price = apply('price');
    expect(price.config.selection).toBe('multi');
    expect(price.config.buttons?.map(item => [item.text, item.selected === true])).toEqual([['$', true], ['$$', true], ['$$$', false], ['$$$$', false]]);
    const html = frameworkCode('html', elementMeta('button-group')!, elementConfig('button-group', sizes.state), { theme: 'baseline', mode: 'light' });
    expect(html).toContain('<m-button-group-item value="8oz" aria-label="8oz" selected>');
    expect(html).not.toContain('Not yet exposed');
  });
});

describe('split button scenarios', () => {
  const apply = (id: string) => {
    const scenario = components['split-button'].scenarios.find(item => item.id === id);
    if (!scenario) throw new Error(`missing split button scenario ${id}`);
    const state = normalizeComponentState('split-button', { ...initialComponentState('split-button'), ...scenario.options });
    return { scenario, state, config: components['split-button'].config(state) };
  };
  test('the default menu is still Save as, Save a copy, Download', () => {
    const config = components['split-button'].config(initialComponentState('split-button'));
    expect(config.items?.map(item => 'text' in item ? item.text : item.type)).toEqual(['Save as…', 'Save a copy', 'Download']);
  });
  test('playback speed and slideshow stay closed, with the figure’s items', () => {
    expect(components['split-button'].scenarios.map(item => item.id)).toEqual(['playback-speed', 'slideshow']);
    const speed = apply('playback-speed');
    expect(speed.config.variant).toBe('tonal');
    expect(speed.config.text).toBe('1.5x');
    expect(speed.config.icon).toBeUndefined();
    expect(speed.config.items?.map(item => 'text' in item ? item.text : '')).toEqual(['0.5x', '1x', '1.5x', '2x']);
    expect(speed.scenario.description).toContain('Not yet exposed by the element: open.');
    expect(speed.scenario.description).toContain('Not yet exposed by the element: items[].selected.');
    const show = apply('slideshow');
    expect(show.config.variant).toBe('filled');
    expect(show.config.text).toBe('Slideshow');
    expect(show.config.icon).toBe(symbols.playCircle);
    const last = show.config.items?.at(-1);
    expect(last && 'text' in last && last.text).toBe('Start slideshow');
    expect(last && 'icon' in last && last.icon).toBe(symbols.playCircle);
    const vanilla = componentCode('split-button', show.state);
    expect(vanilla).toContain('playCircleIcon');
    expect(vanilla).not.toContain('.expand()');
    const html = frameworkCode('html', elementMeta('split-button')!, elementConfig('split-button', speed.state), { theme: 'baseline', mode: 'light' });
    expect(html).toContain('1.5x');
    expect(html).toContain('0.5x');
    expect(html).not.toContain('expand()');
  });
});

describe('fab scenario', () => {
  test('compose is a pencil, and the default stays the add icon', () => {
    expect(components.fab.scenarios.map(item => item.id)).toEqual(['compose']);
    const scenario = components.fab.scenarios[0]!;
    const state = normalizeComponentState('fab', { ...initialComponentState('fab'), ...scenario.options });
    expect(components.fab.config(initialComponentState('fab')).icon).toBe(symbols.add);
    expect(components.fab.config(state).icon).toBe(symbols.edit);
    expect(components.fab.config(state).ariaLabel).toBe('Compose');
    expect(components.fab.config(state).position).toBeUndefined();
  });
});

describe('extended fab scenarios', () => {
  const apply = (id: string) => {
    const scenario = components['extended-fab'].scenarios.find(item => item.id === id);
    if (!scenario) throw new Error(`missing extended fab scenario ${id}`);
    const state = normalizeComponentState('extended-fab', { ...initialComponentState('extended-fab'), ...scenario.options });
    return components['extended-fab'].config(state);
  };
  test('the default pill still has its pencil and Compose', () => {
    const config = components['extended-fab'].config(initialComponentState('extended-fab'));
    expect(config.text).toBe('Compose');
    expect(config.icon).toBe(symbols.edit);
    expect(config.variant).toBe('primary-container');
  });
  test('each figure is the pill, and Save draft has no icon', () => {
    expect(components['extended-fab'].scenarios.map(item => item.id)).toEqual(['compose', 'check-out', 'publish', 'new-task', 'find-flights', 'save-draft']);
    expect(apply('compose').variant).toBe('tertiary-container');
    expect(apply('compose').icon).toBe(symbols.edit);
    expect(apply('check-out').text).toBe('Check out');
    expect(apply('check-out').icon).toBe(symbols.shoppingCart);
    expect(apply('check-out').variant).toBe('tertiary-container');
    expect(apply('check-out').position).toBeUndefined();
    expect(apply('publish').text).toBe('Publish');
    expect(apply('publish').icon).toBe(symbols.arrowUpward);
    expect(apply('new-task').text).toBe('New task');
    expect(apply('new-task').icon).toBe(symbols.add);
    expect(apply('find-flights').text).toBe('Find flights');
    expect(apply('find-flights').icon).toBe(symbols.flight);
    expect(apply('find-flights').variant).toBe('primary');
    const draft = apply('save-draft');
    expect(draft.text).toBe('Save draft');
    expect(draft.icon).toBeUndefined();
    expect(componentCode('extended-fab', normalizeComponentState('extended-fab', { ...initialComponentState('extended-fab'), icon: 'none', text: 'Save draft' }))).not.toContain('icon:');
  });
});

describe('fab menu scenarios', () => {
  const apply = (id: string) => {
    const scenario = components['fab-menu'].scenarios.find(item => item.id === id);
    if (!scenario) throw new Error(`missing fab menu scenario ${id}`);
    const state = normalizeComponentState('fab-menu', { ...initialComponentState('fab-menu'), ...scenario.options });
    return { scenario, state, config: components['fab-menu'].config(state) };
  };
  test('the default is still Reply, Forward and Favorite, and it is closed', () => {
    const state = initialComponentState('fab-menu');
    const config = components['fab-menu'].config(state);
    expect(config.items.map(item => item.text)).toEqual(['Reply', 'Forward', 'Favorite']);
    expect(config.ariaLabel).toBe('Reply options');
    expect(componentCode('fab-menu', state)).not.toContain('fabMenu.open()');
    expect(elementConfig('fab-menu', state).open).toBe(false);
  });
  test('each menu is the figure’s items, open in every tab', () => {
    const music = apply('new-music');
    expect(music.config.color).toBe('tertiary');
    expect(music.config.items.map(item => item.text)).toEqual(['New playlist', 'New collection', 'New station']);
    expect(music.config.items.map(item => item.icon)).toEqual([symbols.musicNote, symbols.libraryMusic, symbols.radio]);
    const photos = apply('photo-categories');
    expect(photos.config.color).toBe('primary');
    expect(photos.config.items.map(item => item.text)).toEqual(['Pets', 'Landscapes', 'Food', 'People', 'Nature']);
    const share = apply('share');
    expect(share.config.items.map(item => item.text)).toEqual(['Email', 'Message', 'Shared folder']);
    for (const { state } of [music, photos, share]) {
      expect(state.open).toBe(true);
      expect(componentCode('fab-menu', state)).toContain('fabMenu.open()');
      const html = frameworkCode('html', elementMeta('fab-menu')!, elementConfig('fab-menu', state), { theme: 'baseline', mode: 'light' });
      expect(html).toMatch(/\sopen[\s=>]/);
      expect(html).not.toContain('Not yet exposed');
      const react = frameworkCode('react', elementMeta('fab-menu')!, elementConfig('fab-menu', state), { theme: 'baseline', mode: 'light' });
      expect(react).toMatch(/\sopen[\s=>]/);
    }
  });
});

describe('fab menu open', () => {
  const code = (framework: 'html' | 'react' | 'vue' | 'svelte' | 'solid', open: boolean) => {
    const config = { ...elementConfig('fab-menu', initialComponentState('fab-menu')), open };
    return frameworkCode(framework, elementMeta('fab-menu')!, config, { theme: 'baseline', mode: 'light' });
  };
  test('a closed menu writes no open attribute and no gap', () => {
    for (const framework of ['html', 'react', 'vue', 'svelte', 'solid'] as const) {
      const source = code(framework, false);
      expect(source).not.toContain('Not yet exposed');
      expect(source).not.toMatch(/\sopen[\s=>]/);
    }
  });
  test('every element tab declares the menu open from the config', () => {
    for (const framework of ['html', 'react', 'vue', 'svelte', 'solid'] as const) {
      const source = code(framework, true);
      expect(source).toMatch(/\sopen[\s=>]/);
      expect(source).not.toContain('Not yet exposed');
    }
  });
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
    expect(html).toContain('<m-dialog size="small" close-button headline="Save your changes?">\n  <p>Keep your changes before leaving this view.</p>');
    const react = code('dialog', 'react');
    expect(react).toContain('const [open, setOpen] = useState(false);');
    expect(react).toContain('<Dialog open={open} onClose={() => setOpen(false)} size="small" closeButton headline="Save your changes?">');
    expect(react).toContain('<Button slot="actions" variant="text" onClick={() => setOpen(false)}>Cancel</Button>');
    // Vue and Svelte fill the declared actions slot with their own syntax
    const vue = code('dialog', 'vue');
    expect(vue).toContain('<MDialog :open="open" @close="open = false"');
    expect(vue).toContain('    <template #actions>\n      <MButton variant="text" @click="open = false">Cancel</MButton>');
    expect(vue).not.toContain('slot="actions"');
    const svelte = code('dialog', 'svelte');
    expect(svelte).toContain('<Dialog open={open} onclose={() => (open = false)}');
    expect(svelte).toContain('  {#snippet actions()}\n    <Button variant="text" onclick={() => (open = false)}>Cancel</Button>');
    expect(svelte).not.toContain('slot:');
    // Its size, dividers, alignment and dismissal are attributes; the factory's defaults are left out.
    const options = code('dialog', 'html', { size: 'medium', divider: true, footerAlignment: 'center', closeOnOverlayClick: false, closeOnEscape: false, subtitle: 'Draft' });
    expect(options).toContain('<m-dialog subtitle="Draft" close-button divider footer-alignment="center" headline="Save your changes?" no-close-on-scrim-click no-close-on-escape>');
    expect(options).not.toContain('Not yet exposed');
  });
  test('a menu is anchored to its trigger, with its submenu nested and a gap', () => {
    const html = code('menu', 'html', { submenu: true, variant: 'gap' });
    expect(html).toContain('<m-button id="menu-trigger" variant="tonal">Open menu</m-button>');
    expect(html).toContain('anchor="menu-trigger"');
    expect(html).toContain('<m-menu-item value="share">\n    Share\n    <m-menu-item value="link">Copy link</m-menu-item>');
    expect(html).toContain('<m-menu-item gap></m-menu-item>');
    expect(html).not.toContain('Not yet exposed');
    expect(code('menu', 'html', { variant: 'vibrant', closeOnSelect: false })).toContain('<m-menu position="bottom-start" variant="vertical" color="vibrant" no-close-on-select anchor="menu-trigger">');
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
  test('the modal rail opens from its trigger, and its expanded state follows collapse', () => {
    const html = code('navigation-rail', 'html', { layout: 'modal' });
    expect(html).toContain('<m-button id="navigation-rail-trigger" variant="tonal">Open navigation</m-button>');
    expect(html).toContain("document.querySelector('#navigation-rail-trigger').addEventListener('click', () => navigationRail.expand());");
    expect(code('navigation-rail', 'react', { layout: 'modal' })).toContain('expanded={expanded} onCollapse={() => setExpanded(false)} layout="modal"');
    expect(code('navigation-rail', 'vue', { layout: 'modal', expanded: true })).toContain('const expanded = ref(true);');
    // A standard rail with its menu button expands itself: no trigger.
    expect(code('navigation-rail', 'html', { expanded: true })).not.toContain('navigation-rail-trigger');
  });
  test('the bottom sheet binds its expanded state instead of calling expand()', () => {
    const react = code('bottom-sheet', 'react', { initialState: 'expanded' });
    expect(react).toContain('const [expanded, setExpanded] = useState(true);');
    expect(react).toContain('expanded={expanded} onExpand={() => setExpanded(true)} onCollapse={() => setExpanded(false)} peekHeight={120}');
    expect(react).not.toContain('Once mounted');
    // Its trigger opens it expanded, as the HTML's expand() does.
    expect(react).toContain('onClick={() => { setOpen(true); setExpanded(true); }}>Open bottom sheet</Button>');
    expect(code('bottom-sheet', 'vue')).toContain('@click="open = true; expanded = true">Open bottom sheet</MButton>');
    expect(code('bottom-sheet', 'svelte')).toContain('onclick={() => { open = true; expanded = true; }}>Open bottom sheet</Button>');
    expect(code('bottom-sheet', 'solid')).toContain('onClick={() => { setOpen(true); setExpanded(true); }}>Open bottom sheet</Button>');
    expect(code('bottom-sheet', 'html', { initialState: 'expanded', closeOnEscape: false })).toContain('<m-bottom-sheet open expanded peek-height="120" modal headline="Plan your visit" no-close-on-escape>');
  });
  test('pickers and search: values, their opener, and suggestions', () => {
    expect(code('datepicker', 'html', { range: true })).toContain('<m-datepicker value="2026-09-21/2026-09-25" variant="docked" selection-mode="range"');
    expect(code('datepicker', 'vue')).toContain('<MDatepicker v-model="value"');
    const time = code('timepicker', 'html');
    expect(time).toContain('<m-button id="timepicker-trigger" variant="tonal">Choose time · 09:30</m-button>');
    expect(time).toContain("document.querySelector('#timepicker-trigger').addEventListener('click', () => timepicker.show());");
    expect(time).toContain(`document.querySelector('#timepicker-trigger').textContent = "Choose time · " + event.detail.value;`);
    expect(code('timepicker', 'solid')).toContain('onClick={() => setOpen(true)}>Choose time · {value()}</Button>');
    expect(code('timepicker', 'html', { minuteStep: '15' })).toContain('step="900"');
    // Seconds are their own attribute (#263), with any minute step.
    const seconds = code('timepicker', 'html', { showSeconds: true, minuteStep: '5' });
    expect(seconds).toContain('show-seconds');
    expect(seconds).toContain('step="300"');
    expect(seconds).not.toContain('Not yet exposed');
    const search = code('search', 'react', { initialState: 'view' });
    expect(search).toContain('<Search value={value} onInput={(event) => setValue(event.detail.value)} name="query" placeholder="Search places" variant="contained" viewMode="docked" open>');
    expect(search).toContain('<SearchSuggestion>Paris</SearchSuggestion>');
  });
  test('values that need quoting stay valid code', () => {
    expect(code('switch', 'html')).toContain("const switchElement = document.querySelector('m-switch');");
    expect(code('text-field', 'react', { label: 'Say "hi" {now}' })).toContain('label={"Say \\"hi\\" {now}"}');
    expect(code('button', 'svelte', { text: 'a {b}' })).toContain('>a &#123;b&#125;</Button>');
  });
});

import { documentMeta, docSlugs as allDocSlugs } from '../src/server/content';
describe('documentation front matter', () => {
  test('every page says when it was created and updated, and its status', () => {
    for (const slug of allDocSlugs) {
      const meta = documentMeta(slug);
      expect([slug, /^\d{4}-\d{2}-\d{2}$/.test(meta.created ?? '')]).toEqual([slug, true]);
      expect([slug, /^\d{4}-\d{2}-\d{2}$/.test(meta.updated ?? '') && meta.updated! >= meta.created!]).toEqual([slug, true]);
      expect([slug, ['draft', 'review', 'published'].includes(meta.status ?? '')]).toEqual([slug, true]);
    }
  });
  test('the badge and the date sit under the title', async () => {
    const html = await (await handleRequest(new Request('http://localhost/docs/components/button/'))).text();
    expect(html).toMatch(/<\/h1>\n?<div class="meta"><span class="meta__badge meta__badge--published">Published<\/span><span class="meta__item">Updated <time datetime="\d{4}-\d{2}-\d{2}">/);
  });
});

test('scripts and stylesheets are the hashed files from the manifest', async () => {
  const manifest = JSON.parse(readFileSync(resolve(import.meta.dir, '../dist/asset-manifest.json'), 'utf8')) as Record<string, string>;
  const page = await (await get('/components/button/')).text();
  const assets = [...page.matchAll(/(?:src|href)="(\/(?:dist|styles)\/[^"]+\.(?:js|css)[^"]*)"/g)].map(match => match[1]!);
  // One sheet for the page, plus the scripts it loads. Both names carry the content hash.
  expect([...page.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(match => match[1])).toEqual([manifest['/dist/css/page.css']]);
  expect(assets).toContain(manifest['/dist/site.js']);
  expect(assets).toContain(manifest['/dist/playground.js']);
  for (const asset of assets) expect(Object.values(manifest)).toContain(asset);
  const home = await (await get('/')).text();
  expect([...home.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(match => match[1])).toEqual([manifest['/dist/css/home.css']]);
  expect(home).toContain('aria-label="Search (⌘K)"');
  expect(home).toContain('aria-keyshortcuts="Meta+K Control+K"');
  // Whatever CSS the server sends is minified, including a file a page no longer links.
  const served = await (await get('/styles/site.css')).text();
  expect(served).not.toContain('/*');
  expect(served).toContain('font-family:inherit');
  const preview = await (await get('/preview/button/')).text();
  // Lazy chunks import their entry by its plain name: the import map sends it to the
  // hashed file the page loaded, so the entry runs once.
  const map = JSON.parse(/<script type="importmap">(.*?)<\/script>/.exec(preview)![1]!) as { imports: Record<string, string> };
  expect(map.imports['/dist/preview.js']).toBe(manifest['/dist/preview.js']);
  expect(preview.indexOf('type="importmap"')).toBeLessThan(preview.indexOf('type="module"'));
});

test('a content-hashed chunk is cached for a year, and a stable name is not', async () => {
  const dir = resolve(import.meta.dir, '../dist');
  mkdirSync(dir, { recursive: true });
  const chunk = resolve(dir, 'chunk-abc123.js');
  const plain = resolve(dir, 'plain.js');
  writeFileSync(chunk, 'export {}\n');
  writeFileSync(plain, 'export {}\n');
  try {
    expect((await get('/dist/chunk-abc123.js')).headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
    expect((await get('/dist/plain.js')).headers.get('Cache-Control')).toBe('public, max-age=60, stale-while-revalidate=600');
  } finally {
    unlinkSync(chunk);
    unlinkSync(plain);
  }
});
