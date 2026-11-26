// The menu card: a button that opens the real menu (choosing or Escape closes it). The Overview's
// sections (component-properties.ts) show several menus open at once: <m-menu> always opens in the
// top layer as an auto popover, and the browser keeps one such popover open at a time, so each value
// is a surface of its own, the factory's menu kept in the page, under its button.
import 'material/elements/css/button';
import 'material/elements/css/icon-button';
import 'material/elements/css/menu';
import createButton from 'material/components/button';
import createIconButton from 'material/components/icon-button';
import createMenu, { type MenuConfig } from 'material/components/menu';
import createSplitButton from 'material/components/split-button';
import createFab from 'material/components/fab';
import 'material/elements/css/fab';
import 'material/elements/css/split-button';
import { symbols } from '../../shared/icons';
import { menuDefaults } from './defaults';
import { surface } from './surface';
import { registerStyles } from 'material/elements';

// The menu in the page: its box positioned against the surface (a transform makes it the reference
// for the menu's fixed position), the surface as tall as the menu.
registerStyles({
  'catalog-menu': '.catalog-menu__still{pointer-events:none}.catalog-menu__still[hidden]{display:none!important}.catalog-menu{position:relative;transform:translateZ(0);min-height:248px;min-width:240px;display:flex;flex-direction:column;align-items:flex-start}'
    + '.catalog-menu--fab{width:520px;max-width:100%;height:380px;padding:24px 24px 0;box-sizing:border-box;background:var(--mtrl-sys-color-surface);border:8px solid color-mix(in srgb,var(--mtrl-sys-color-outline) 70%,transparent);border-top:0;border-left:0;border-radius:0 0 40px 0;overflow:hidden}'
    + '.catalog-menu__page p{margin:0;font:16px/24px Roboto,sans-serif;color:var(--mtrl-sys-color-on-surface)}.catalog-menu__page mark{background:var(--mtrl-sys-color-secondary-container);color:inherit;border-radius:4px}'
    + '.catalog-menu--fab>.mtrl-fab{position:absolute;right:24px;bottom:32px}'
    + '.catalog-menu--format{min-height:560px;min-width:620px}.catalog-menu--split{min-height:300px}'
    + '.catalog-menu--photo{min-height:520px;width:360px}.catalog-menu--icon,.catalog-menu--split{align-items:flex-end;min-width:260px}'
    + '.catalog-menu__photo{width:360px;border-radius:28px;overflow:hidden;background:var(--mtrl-sys-color-surface)}'
    + '.catalog-menu__photo img{display:block;width:100%;height:auto}'
    + '.catalog-menu__bar{display:flex;align-items:center;justify-content:space-between;padding:12px 8px 12px 20px;font:14px/20px Roboto,sans-serif;color:var(--mtrl-sys-color-on-surface)}'
    + '.catalog-menu__bar>span{display:grid}.catalog-menu__bar span span{font-size:13px;color:var(--mtrl-sys-color-on-surface-variant)}',
});

type Item = Exclude<NonNullable<MenuConfig['items']>[number], { type: 'divider' } | { type: 'gap' }>;
type Entries = NonNullable<MenuConfig['items']>;
const item = (text: string, extra: Partial<Item> = {}): Item => ({ id: text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), text, ...extra }) as Item;
const sub = [item('Sub item 1'), item('Sub item 2')];
// As M3's figures (the owner's reference, 2026-11-26): items 1 to 4, the third selected, the fourth opening a submenu.
const vertical = (between: 'gap' | 'divider'): Entries => [item('Item 1', { icon: symbols.visibility }), item('Item 2', { icon: symbols.contentCopy, shortcut: '⌘C' }),
  item('Item 3', { icon: symbols.edit }), { type: between }, item('Item 4', { icon: symbols.cloud, hasSubmenu: true, submenu: sub })] as Entries;
const baseline: Entries = [item('Menu item', { hasSubmenu: true, submenu: sub }), item('Selected item', { supportingText: 'Supporting text' }),
  item('Plain item'), { type: 'divider' }, item('Cut', { icon: symbols.contentCut, hasSubmenu: true, submenu: sub })] as Entries;
const standard: Entries = [item('Refresh'), item('Settings'), item('Help'), item('More')];
const grouped: Entries = [item('Item 1', { icon: symbols.visibility }), item('Item 2', { icon: symbols.contentCopy, shortcut: '⌘C' }), item('Item 3', { icon: symbols.check }),
  { type: 'gap' }, item('Item 4', { icon: symbols.person, hasSubmenu: true, submenu: sub }), item('Item 5', { icon: symbols.settings })] as Entries;
// The glance, as M3's figure: an editor's FAB opens Undo and Redo (nothing to redo yet), then Cut, Copy, Paste.
const editor: Entries = [item('Undo', { icon: symbols.undo }), item('Redo', { icon: symbols.redo, disabled: true }), { type: 'gap' },
  item('Cut', { icon: symbols.contentCut }), item('Copy', { icon: symbols.contentCopy }), item('Paste', { icon: symbols.contentPaste })] as Entries;
// As M3's submenu figure: a document's Format menu, Line & paragraph spacing open beside its item.
const format: Entries = [item('Text', { icon: symbols.bold, hasSubmenu: true, submenu: sub }), item('Align & indent', { icon: symbols.formatIndentIncrease, hasSubmenu: true, submenu: sub }),
  item('Line & paragraph spacing', { icon: symbols.formatLineSpacing, hasSubmenu: true, submenu: [item('Single'), item('1.15'), item('Double'), item('Custom: 1.2', { icon: symbols.check }), { type: 'divider' },
    item('Add space before paragraph'), item('Add space after paragraph'), { type: 'divider' }, item('Custom spacing…', { shortcut: '⌘/' })] as never }),
  { type: 'divider' }, item('Table', { icon: symbols.table, hasSubmenu: true, submenu: sub }), item('Image', { icon: symbols.image, hasSubmenu: true, submenu: sub }),
  item('Borders & lines', { icon: symbols.borderStyle, hasSubmenu: true, submenu: sub }), { type: 'divider' },
  item('Format options', { icon: symbols.formatPaint, hasSubmenu: true, submenu: sub }), item('Clear formatting', { icon: symbols.formatClear, shortcut: '⌘\\' })] as Entries;
const photo: Entries = [item('Share', { icon: symbols.share }), item('Download', { icon: symbols.download }), item('Copy link', { icon: symbols.link }), { type: 'divider' }, item('Delete', { icon: symbols.delete })] as Entries;
type Trigger = 'button' | 'icon' | 'split' | 'photo' | 'fab' | 'format';
/** `md3-catalog-menu-<suffix>`: the menu's config, items, selected item and the control that opens it. */
const MENU_PROPERTIES: Record<string, { config?: Partial<MenuConfig>; entries: Entries; selected?: string; trigger?: Trigger; submenu?: string }> = {
  submenu: { entries: format, trigger: 'format', submenu: 'line-paragraph-spacing', selected: 'line-paragraph-spacing' },
  'variant-gap': { entries: vertical('gap'), selected: 'item-3' }, 'variant-divider': { entries: vertical('divider'), selected: 'item-3' },
  'variant-baseline': { config: { variant: 'baseline' }, entries: baseline, selected: 'selected-item' },
  'layout-standard': { config: { position: 'bottom-end' }, entries: standard, trigger: 'icon' }, 'layout-grouped': { config: { position: 'bottom-end' }, entries: grouped, selected: 'item-3', trigger: 'split' },
  'color-standard': { config: { color: 'standard' }, entries: vertical('gap'), selected: 'item-3' }, 'color-vibrant': { config: { color: 'vibrant' }, entries: vertical('gap'), selected: 'item-3' },
  'density-default': { entries: vertical('divider') }, 'density-dense': { config: { dense: true }, entries: vertical('divider') },
  glance: { config: { position: 'left-end' }, entries: editor, trigger: 'fab' },
};

// Material keeps one menu open per page (its registry closes the last one), so a section cannot show
// its menus open side by side. Each surface opens its real menu once, keeps a still copy of it where it
// rendered (inert, hidden from assistive technology), and closes it, one surface at a time. Its button
// opens the real menu over the copy; the copy shows again when it closes.
let queue = Promise.resolve();
const settle = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const openMenu = ({ config = {}, entries, selected, trigger: kind = 'button', submenu }: (typeof MENU_PROPERTIES)[string]) => () => {
  const host = document.createElement('div');
  host.className = `catalog-menu catalog-menu--${kind}`;
  let opener: HTMLElement;
  let destroyTrigger: () => void;
  if (kind === 'fab') {
    const fab = createFab({ icon: symbols.edit, ariaLabel: 'Edit', variant: 'primary-container', size: 'medium' } as never);
    const page = document.createElement('div');
    page.className = 'catalog-menu__page';
    page.innerHTML = '<p>The harbour was quiet that morning. Boats knocked gently against the pier, and the gulls waited on the posts for the first nets to come in. <mark>Mara had walked down before sunrise to see the light change over the water</mark>, a habit she had kept since the summer her grandfather taught her to row. She sat on the stone steps, coat buttoned to the chin, and watched the town wake behind her one window at a time.</p>';
    host.append(page, fab.element);
    opener = fab.element;
    destroyTrigger = () => fab.destroy();
  } else if (kind === 'split') {
    const split = createSplitButton({ text: 'Label', icon: symbols.edit, trailingLabel: 'More options', variant: 'tonal' } as never);
    host.append(split.element);
    opener = split.trailingElement;
    destroyTrigger = () => split.destroy();
  } else {
    const trigger = kind === 'button' || kind === 'format' ? createButton({ text: kind === 'format' ? 'Format' : 'Edit', ...(kind === 'format' ? {} : { icon: symbols.edit }), variant: kind === 'format' ? 'text' : 'tonal' } as never)
      : createIconButton({ icon: symbols.moreVert, ariaLabel: kind === 'photo' ? 'Photo options' : 'More options', variant: kind === 'icon' ? 'tonal' : 'standard' } as never);
    if (kind === 'photo') {
      const card = document.createElement('div');
      card.className = 'catalog-menu__photo';
      card.innerHTML = '<img src="https://picsum.photos/id/1036/720/480" width="360" height="240" alt="A snowy mountain lake at dusk"><div class="catalog-menu__bar"><span><strong>Lake at dusk</strong><span>12 Nov 2026</span></span></div>';
      card.querySelector('.catalog-menu__bar')!.append(trigger.element);
      host.append(card);
    } else host.append(trigger.element);
    opener = trigger.element;
    destroyTrigger = () => trigger.destroy();
  }
  const menu = createMenu({ ...menuDefaults, ...config, items: entries, opener, container: host, layer: undefined } as MenuConfig);
  if (selected) menu.setSelected(selected);
  let still: HTMLElement | undefined;
  let active = true;
  menu.on?.('open', () => { if (still) still.hidden = true; });
  menu.on?.('close', () => { if (still) still.hidden = false; });
  queue = queue.then(async () => {
    if (!active || !host.isConnected) await new Promise(requestAnimationFrame);
    if (!active) return;
    const { scrollX, scrollY } = window;
    const focused = document.activeElement as HTMLElement | null;
    menu.open(undefined, 'mouse');
    await settle(350);
    if (!active) return;
    still = menu.element.cloneNode(true) as HTMLElement;
    still.removeAttribute('id');
    for (const element of still.querySelectorAll('[id]')) element.removeAttribute('id');
    still.inert = true;
    still.setAttribute('aria-hidden', 'true');
    still.classList.add('catalog-menu__still');
    menu.close();
    // Under its button, as it opens when there is room: the window's edge may have flipped it above.
    const button = opener.getBoundingClientRect(), box = host.getBoundingClientRect();
    if (kind === 'fab') Object.assign(still.style, { position: 'absolute', top: 'auto', left: 'auto', transform: 'none', bottom: `${box.bottom - button.bottom}px`, right: `${box.right - button.left + 8}px` });
    else Object.assign(still.style, { position: 'absolute', top: `${button.bottom - box.top + 4}px`, bottom: 'auto', transform: 'none',
      ...(kind !== 'button' && kind !== 'format' ? { left: 'auto', right: `${box.right - button.right}px` } : { left: `${button.left - box.left}px`, right: 'auto' }) });
    host.append(still);
    // The submenu, opened from its item (it opens on the page's body), copied beside that item.
    if (submenu) {
      const parent = menu.element.querySelector<HTMLElement>(`[data-id="${submenu}"]`);
      menu.open(undefined, 'mouse');
      await settle(350);
      menu.element.querySelector<HTMLElement>(`[data-id="${submenu}"]`)?.click();
      await settle(350);
      const open = document.querySelector<HTMLElement>('.mtrl-menu--submenu.mtrl-menu--visible');
      const row = still.querySelector<HTMLElement>(`[data-id="${submenu}"]`) ?? parent;
      if (open && row) {
        const copy = open.cloneNode(true) as HTMLElement;
        for (const element of [copy, ...copy.querySelectorAll('[id]')]) element.removeAttribute('id');
        copy.classList.add('catalog-menu__still');
        copy.inert = true;
        copy.setAttribute('aria-hidden', 'true');
        menu.close();
        await settle(50);
        const r = row.getBoundingClientRect(), b = host.getBoundingClientRect(), m = still.getBoundingClientRect();
        Object.assign(copy.style, { position: 'absolute', left: `${m.right - b.left + 4}px`, top: `${r.top - b.top - 8}px`, right: 'auto', bottom: 'auto', transform: 'none' });
        host.append(copy);
      }
      menu.close();
      focused?.focus?.({ preventScroll: true });
      window.scrollTo(scrollX, scrollY);
    }
    focused?.focus?.({ preventScroll: true });
    window.scrollTo(scrollX, scrollY);
  });
  return { element: host, destroy: () => { active = false; menu.destroy(); destroyTrigger(); } };
};

export const define = (): void => {
  const styles = ['progress', 'button', 'icon-button', 'split-button', 'fab', 'menu', 'catalog-menu'];
  surface('md3-catalog-menu', ['progress', 'button', 'menu'], () => {
    const host = document.createElement('div');
    const trigger = createButton({ text: 'Show menu', variant: 'tonal' });
    const menu = createMenu({ ...menuDefaults, opener: trigger.element, layer: "top" });
    host.append(trigger.element, menu.element);
    return { element: host, destroy: () => { menu.destroy(); trigger.destroy(); } };
  });
  for (const [suffix, entry] of Object.entries(MENU_PROPERTIES)) surface(`md3-catalog-menu-${suffix}`, styles, openMenu(entry));
};
