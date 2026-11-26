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
import { symbols } from '../../shared/icons';
import { menuDefaults } from './defaults';
import { surface } from './surface';
import { registerStyles } from 'material/elements';

// The menu in the page: its box positioned against the surface (a transform makes it the reference
// for the menu's fixed position), the surface as tall as the menu.
registerStyles({
  'catalog-menu': '.catalog-menu__still{pointer-events:none}.catalog-menu__still[hidden]{display:none!important}.catalog-menu{position:relative;transform:translateZ(0);min-height:248px;min-width:240px;display:flex;flex-direction:column;align-items:flex-start}'
    + '.catalog-menu--photo{min-height:520px;width:360px}'
    + '.catalog-menu__photo{width:360px;border-radius:28px;overflow:hidden;background:var(--mtrl-sys-color-surface)}'
    + '.catalog-menu__photo img{display:block;width:100%;height:auto}'
    + '.catalog-menu__bar{display:flex;align-items:center;justify-content:space-between;padding:12px 8px 12px 20px;font:14px/20px Roboto,sans-serif;color:var(--mtrl-sys-color-on-surface)}'
    + '.catalog-menu__bar>span{display:grid}.catalog-menu__bar span span{font-size:13px;color:var(--mtrl-sys-color-on-surface-variant)}',
});

type Entry = [string, string?, string?, string?] | 'divider' | 'gap';
const items = (entries: Entry[]): MenuConfig['items'] => entries.map(entry => entry === 'divider' || entry === 'gap' ? { type: entry }
  : { id: entry[0].toLowerCase(), text: entry[0], ...(entry[1] ? { icon: entry[1] } : {}), ...(entry[2] ? { shortcut: entry[2] } : {}), ...(entry[3] ? { supportingText: entry[3] } : {}) }) as MenuConfig['items'];
const edit: Entry[] = [['Cut', symbols.contentCut, '⌘X'], ['Copy', symbols.contentCopy, '⌘C'], ['Paste', symbols.contentPaste, '⌘V']];
const photo: Entry[] = [['Share', symbols.share], ['Download', symbols.download], ['Copy link', symbols.link], 'divider', ['Delete', symbols.delete]];
/** `md3-catalog-menu-<suffix>`: the menu's config and items, as the Overview's sections name them. */
const MENU_PROPERTIES: Record<string, { config?: Partial<MenuConfig>; entries: Entry[]; photo?: boolean }> = {
  'variant-vertical': { config: { variant: 'vertical' }, entries: edit }, 'variant-baseline': { config: { variant: 'baseline' }, entries: edit },
  'color-standard': { config: { color: 'standard' }, entries: edit }, 'color-vibrant': { config: { color: 'vibrant' }, entries: edit },
  'items-label': { entries: [['Undo'], ['Redo'], ['Select all']] }, 'items-shortcut': { entries: edit },
  'items-supporting': { entries: [['Share', symbols.share, undefined, 'Send a copy'], ['Copy link', symbols.link, undefined, 'Anyone with it can view'], ['Download', symbols.download, undefined, 'As a PDF']] },
  'groups-divider': { entries: [...edit, 'divider', ['Delete', symbols.delete]] }, 'groups-gap': { entries: [...edit, 'gap', ['Delete', symbols.delete]] },
  'density-default': { entries: edit }, 'density-dense': { config: { dense: true }, entries: edit },
  glance: { config: { position: 'bottom-end' }, entries: photo, photo: true },
};

// Material keeps one menu open per page (its registry closes the last one), so a section cannot show
// its menus open side by side. Each surface opens its real menu once, keeps a still copy of it where it
// rendered (inert, hidden from assistive technology), and closes it, one surface at a time. Its button
// opens the real menu over the copy; the copy shows again when it closes.
let queue = Promise.resolve();
const settle = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const openMenu = ({ config = {}, entries, photo: isPhoto }: (typeof MENU_PROPERTIES)[string]) => () => {
  const host = document.createElement('div');
  host.className = isPhoto ? 'catalog-menu catalog-menu--photo' : 'catalog-menu';
  const trigger = isPhoto ? createIconButton({ icon: symbols.moreVert, ariaLabel: 'Photo options' } as never) : createButton({ text: 'Edit', icon: symbols.edit, variant: 'tonal' } as never);
  if (isPhoto) {
    const card = document.createElement('div');
    card.className = 'catalog-menu__photo';
    card.innerHTML = '<img src="https://picsum.photos/id/1036/720/480" width="360" height="240" alt="A snowy mountain lake at dusk"><div class="catalog-menu__bar"><span><strong>Lake at dusk</strong><span>12 Nov 2026</span></span></div>';
    card.querySelector('.catalog-menu__bar')!.append(trigger.element);
    host.append(card);
  } else host.append(trigger.element);
  const menu = createMenu({ ...menuDefaults, ...config, items: items(entries), opener: trigger.element, container: host, layer: undefined } as MenuConfig);
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
    const button = trigger.element.getBoundingClientRect(), box = host.getBoundingClientRect();
    Object.assign(still.style, { position: 'absolute', top: `${button.bottom - box.top + 4}px`, bottom: 'auto', transform: 'none',
      ...(isPhoto ? { left: 'auto', right: `${box.right - button.right}px` } : { left: `${button.left - box.left}px`, right: 'auto' }) });
    host.append(still);
    focused?.focus?.({ preventScroll: true });
    window.scrollTo(scrollX, scrollY);
  });
  return { element: host, destroy: () => { active = false; menu.destroy(); trigger.destroy(); } };
};

export const define = (): void => {
  const styles = ['progress', 'button', 'icon-button', 'menu', 'catalog-menu'];
  surface('md3-catalog-menu', ['progress', 'button', 'menu'], () => {
    const host = document.createElement('div');
    const trigger = createButton({ text: 'Show menu', variant: 'tonal' });
    const menu = createMenu({ ...menuDefaults, opener: trigger.element, layer: "top" });
    host.append(trigger.element, menu.element);
    return { element: host, destroy: () => { menu.destroy(); trigger.destroy(); } };
  });
  for (const [suffix, entry] of Object.entries(MENU_PROPERTIES)) surface(`md3-catalog-menu-${suffix}`, styles, openMenu(entry));
};
