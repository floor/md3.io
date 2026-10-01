// The Scheme card, as Material Theme Builder lays one out, in the app's mode: Primary,
// Secondary and Tertiary columns with Error beside them, the surfaces below, and the
// inverse roles, scrim and shadow beside those. Each tile is filled with its role and
// labelled in its "on" colour. Composed the mtrl way; `set(theme, mode)` repaints it in
// place, light filled and dark outlined, and a tile click emits `copy` with { role, hex }.
import { pipe, createBase, withElement, withEvents, withLifecycle, type ElementComponent, type EventComponent } from 'mtrl/core/compose';
import createTooltip from 'mtrl/components/tooltip';
import copyIcon from '../../../icons/content_copy.svg' with { type: 'text' };
import type { ThemeData } from './features/withThemeSource';
import { contrastRatio } from '../../shared/color';

export type Mode = 'light' | 'dark';
type Size = 'tall' | 'short';

/** The role each tile's label is drawn in. Scrim and shadow are black: white labels. */
const INK: Record<string, string | null> = {
  'surface-dim': 'on-surface', surface: 'on-surface', 'surface-bright': 'on-surface',
  'surface-container-lowest': 'on-surface', 'surface-container-low': 'on-surface', 'surface-container': 'on-surface',
  'surface-container-high': 'on-surface', 'surface-container-highest': 'on-surface',
  'on-surface': 'surface', 'on-surface-variant': 'surface', outline: 'surface', 'outline-variant': 'on-surface',
  'inverse-surface': 'inverse-on-surface', 'inverse-on-surface': 'inverse-surface', 'inverse-primary': 'inverse-surface',
  scrim: null, shadow: null,
};
for (const group of ['primary', 'secondary', 'tertiary', 'error']) Object.assign(INK, {
  [group]: `on-${group}`, [`on-${group}`]: group, [`${group}-container`]: `on-${group}-container`, [`on-${group}-container`]: `${group}-container`,
});
const LABELS: Record<string, string> = { 'on-surface-variant': 'On Surface Var.' };
const label = (role: string) => LABELS[role] ?? role.split('-').map(word => word[0]!.toUpperCase() + word.slice(1)).join(' ');

/** The card's blocks: [area, rows of [role, size]] in MTB's order. */
const column = (group: string): [string, Size][] => [[group, 'tall'], [`on-${group}`, 'short'], [`${group}-container`, 'tall'], [`on-${group}-container`, 'short']];
const BLOCKS: { area: string; groups: { kind: 'col' | 'row'; tiles: [string, Size][] }[] }[] = [
  { area: 'main', groups: ['primary', 'secondary', 'tertiary'].map(group => ({ kind: 'col', tiles: column(group) })) },
  { area: 'error', groups: [{ kind: 'col', tiles: column('error') }] },
  { area: 'surfaces', groups: [
    { kind: 'row', tiles: [['surface-dim', 'tall'], ['surface', 'tall'], ['surface-bright', 'tall']] },
    { kind: 'row', tiles: ['lowest', 'low', '', 'high', 'highest'].map(step => [`surface-container${step ? `-${step}` : ''}`, 'tall']) },
    { kind: 'row', tiles: [['on-surface', 'short'], ['on-surface-variant', 'short'], ['outline', 'short'], ['outline-variant', 'short']] },
  ] },
  { area: 'inverse', groups: [
    { kind: 'col', tiles: [['inverse-surface', 'tall'], ['inverse-on-surface', 'short'], ['inverse-primary', 'short']] },
    // Two black tiles: apart, as MTB draws them, so they read as two roles.
    { kind: 'row', tiles: [['scrim', 'short'], ['shadow', 'short']] },
  ] },
];

export interface SchemeCardOptions { roles: string[] }

/** The tiles, built once: `tiles` maps each role to its button. */
const withTiles = () => <T extends ElementComponent>(component: T) => {
  const { element } = component;
  const tiles = new Map<string, HTMLButtonElement>();
  const title = document.createElement('h2');
  title.className = component.getElementClass(component.getClass('scheme-card'), 'title');
  title.textContent = 'Scheme';
  title.id = 'scheme-title';
  element.setAttribute('aria-labelledby', title.id);
  const grid = document.createElement('div');
  grid.className = component.getClass('scheme-grid');
  for (const block of BLOCKS) {
    const area = document.createElement('div');
    area.className = `${grid.className}__${block.area}`;
    for (const group of block.groups) {
      const box = document.createElement('div');
      box.className = component.getClass(`scheme-${group.kind}`);
      if (group.kind === 'row') box.style.setProperty('--count', String(group.tiles.length));
      for (const [role, size] of group.tiles) {
        const tile = document.createElement('button');
        tile.type = 'button';
        tile.className = `${component.getClass('scheme-tile')} ${component.getClass('scheme-tile')}--${size}`;
        tile.dataset.role = role;
        tile.innerHTML = `<span>${label(role)}</span><span class="${component.getClass('scheme-tile')}__copy" aria-hidden="true">${copyIcon}</span>`;
        tiles.set(role, tile);
        box.append(tile);
      }
      area.append(box);
    }
    grid.append(area);
  }
  element.append(title, grid);
  return { ...component, tiles };
};

/** `set(theme, mode)`: every tile, and the card's own surface, in that mode's colours. */
const withScheme = ({ roles }: SchemeCardOptions) => <T extends ElementComponent & { tiles: Map<string, HTMLButtonElement> }>(component: T) => {
  let current: Record<string, string> = {};
  const set = (theme: ThemeData, mode: Mode) => {
    const colors = theme[mode];
    component.element.dataset.mode = mode;
    component.element.classList.toggle('md3-scheme-card--dark', mode === 'dark');
    component.element.classList.toggle('md3-scheme-card--light', mode === 'light');
    current = Object.fromEntries(roles.map((role, i) => [role, colors[i]!]));
    const { element } = component;
    element.style.background = current.surface!;
    element.style.color = current['on-surface']!;
    element.style.setProperty('--card-outline', current['outline-variant']!);
    for (const [role, tile] of component.tiles) {
      // The role's "on" colour, as MTB labels it; where that pair is not one M3 holds to
      // 4.5:1 (outline on surface), black or white, whichever reads better.
      const pair = INK[role] ? current[INK[role]!]! : '#ffffff';
      const ratio = (ink: string) => contrastRatio(current[role]!, ink) ?? 0;
      tile.style.background = current[role]!;
      tile.style.color = ratio(pair) >= 4.5 ? pair : ratio('#000000') >= ratio('#ffffff') ? '#000000' : '#ffffff';
      tile.setAttribute('aria-label', `${label(role)} ${current[role]}, copy`);
      tile.dataset.hex = current[role]!;
    }
  };
  return { ...component, set, get: (role: string) => current[role] };
};

/** A tile click emits `copy`: one listener on the card, removed with it. */
const withCopyEvent = () => <T extends ElementComponent & EventComponent>(component: T) => {
  const onClick = (event: Event) => {
    const tile = (event.target as Element).closest<HTMLElement>('[data-role]');
    if (tile?.dataset.hex) component.emit('copy', { role: tile.dataset.role, hex: tile.dataset.hex });
  };
  component.element.addEventListener('click', onClick);
  component.resources!.add(() => component.element.removeEventListener('click', onClick));
  return component;
};

/**
 * As MTB does: a hovered or focused tile shows a copy icon and one mtrl tooltip, "Copy
 * hex color", moved to that tile. A click anywhere on the tile, or Enter, copies.
 */
const withCopyHint = () => <T extends ElementComponent>(component: T) => {
  const tooltip = createTooltip({ text: 'Copy hex color', position: 'top', showOnHover: false, showOnFocus: false });
  const tileOf = (event: Event) => (event.target as Element).closest<HTMLElement>('[data-role]');
  let current: HTMLElement | null = null;
  const enter = (event: Event) => {
    const tile = tileOf(event);
    if (!tile || tile === current) return;
    current = tile;
    tooltip.setTarget(tile).show(true);
  };
  const leave = (event: Event) => {
    const next = (event as MouseEvent | FocusEvent).relatedTarget as Element | null;
    if (current && next && current.contains(next)) return;
    current = null;
    tooltip.hide(true);
  };
  const listeners: [string, EventListener][] = [['pointerover', enter], ['pointerout', leave], ['focusin', enter], ['focusout', leave]];
  for (const [type, listener] of listeners) component.element.addEventListener(type, listener);
  component.resources!.add(() => {
    for (const [type, listener] of listeners) component.element.removeEventListener(type, listener);
    tooltip.destroy();
  });
  return component;
};

export const createSchemeCard = (options: SchemeCardOptions) => {
  const card = pipe(
    createBase,
    withEvents(),
    withElement({ tag: 'section', componentName: 'scheme-card' }),
    withTiles(),
    withScheme(options),
    withCopyEvent(),
    withCopyHint(),
    withLifecycle(),
  )({ prefix: 'md3', componentName: 'scheme-card' });
  return { ...card, destroy: () => card.lifecycle.destroy() };
};
export type SchemeCard = ReturnType<typeof createSchemeCard>;
