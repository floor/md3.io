// The menu's playground content: its named item sets and its registry entry.
import type { MenuConfig, MenuContent } from 'material/components/menu';
import { symbols } from '../icons';
import { type ComponentState, type Control, type Scenario, bool, choose, iconByName, pick, section, string, text, toggle } from './types';

/** A named menu: the items, the row it marks selected, and a submenu it opens. */
interface MenuSet {
  name: string;
  /** The item `setSelected` marks. One id: the menu keeps a single selection. */
  selected?: string;
  /** The item whose submenu the preview opens, when the figure shows one. */
  openSubmenu?: string;
  items: readonly MenuContent[];
}

/**
 * Named menus from m3.material.io/components/menus/guidelines (read 6 October
 * 2026). `default` is not here: today's Save, Share and Download stay exactly
 * as they were. Dietary marks only Nut-free: `setSelected` takes one id
 * (material/.../menu/features/controller.ts). Share and Download carry a
 * submenu arrow and no children, as the file figure shows them.
 */
const menuSets: Record<string, MenuSet> = {
  'link-context': {
    name: 'Link context',
    items: [
      { id: 'new-window', text: 'Open in new window', icon: symbols.openInNew },
      { id: 'save-link', text: 'Save link as', icon: symbols.save },
      { id: 'copy-address', text: 'Copy address', icon: symbols.contentCopy },
      { id: 'inspect', text: 'Inspect', icon: symbols.search },
    ],
  },
  'text-actions': {
    name: 'Text actions',
    items: [
      { id: 'undo', text: 'Undo', icon: symbols.undo },
      { id: 'redo', text: 'Redo', icon: symbols.redo, disabled: true },
      { type: 'divider' },
      { id: 'cut', text: 'Cut', icon: symbols.contentCut },
      { id: 'copy', text: 'Copy', icon: symbols.contentCopy },
      { id: 'paste', text: 'Paste', icon: symbols.contentPaste },
    ],
  },
  'file-actions': {
    name: 'File actions',
    selected: 'offline',
    openSubmenu: 'create',
    items: [
      { id: 'open', text: 'Open', icon: symbols.folderOpen },
      { id: 'make-copy', text: 'Make a copy', icon: symbols.contentCopy },
      { id: 'create', text: 'Create', icon: symbols.edit, hasSubmenu: true, submenu: [
        { id: 'document', text: 'Document' },
        { id: 'image', text: 'Image' },
        { id: 'slides', text: 'Slides' },
      ] },
      { id: 'offline', text: 'Offline mode', icon: symbols.check },
      { id: 'share', text: 'Share', icon: symbols.share, hasSubmenu: true },
      { id: 'download', text: 'Download', icon: symbols.download, hasSubmenu: true },
    ],
  },
  'dietary-filter': {
    name: 'Dietary filter',
    selected: 'nut-free',
    items: [
      { id: 'gluten-free', text: 'Gluten-free' },
      { id: 'kosher', text: 'Kosher' },
      { id: 'nut-free', text: 'Nut-free', icon: symbols.check },
      { id: 'vegan', text: 'Vegan' },
      { id: 'vegetarian', text: 'Vegetarian' },
    ],
  },
};

const menuSet = (state: ComponentState): MenuSet | undefined => menuSets[string(state, 'menuSet')];

/** The item a named menu marks selected, if it marks one. */
export function menuSelectedId(state: ComponentState): string | undefined {
  return menuSet(state)?.selected;
}

/** The submenu a named menu opens, when its figure shows that submenu. */
export function menuOpenSubmenu(state: ComponentState): string | undefined {
  return menuSet(state)?.openSubmenu;
}

const stripIcon = (item: MenuContent, icons: boolean): MenuContent => {
  if (!('text' in item) || icons || !item.icon) return item;
  const { icon: _icon, ...rest } = item;
  return rest;
};

const defaultItems = (state: ComponentState): MenuContent[] => [
  { id: 'save', text: 'Save', ...(state.icons ? { icon: iconByName('bookmark') } : {}), ...(state.supportingText ? { supportingText: 'Keep for later' } : {}) },
  { id: 'share', text: 'Share', ...(state.icons ? { icon: iconByName('send') } : {}), ...(state.submenu ? { hasSubmenu: true, submenu: [{ id: 'link', text: 'Copy link' }, { id: 'email', text: 'Email' }] } : {}) },
  { type: state.variant === 'gap' ? 'gap' : 'divider' },
  { id: 'download', text: 'Download', disabled: false, ...(state.icons ? { icon: iconByName('download') } : {}) },
];

const menuSetControl: Control = {
  ...choose('menuSet', 'Menu', ['default', 'link-context', 'text-actions', 'file-actions', 'dietary-filter'], 'default', 'select'),
  labels: { default: 'Default', ...Object.fromEntries(Object.entries(menuSets).map(([id, set]) => [id, set.name])) },
};

/**
 * The menu's scenarios, from m3.material.io (read 6 October 2026). Options name
 * playground controls only. Each one opens. File actions also opens Create.
 * Dietary marks Nut-free; the figure's second check is a gap.
 */
const menuScenarios: readonly Scenario[] = [
  {
    id: 'link-context', name: 'Link context', source: 'https://m3.material.io/components/menus/guidelines',
    description: 'Acting on a link: open it, save it, copy its address, or inspect it.',
    options: { menuSet: 'link-context', text: 'Link', variant: 'standard', icons: true, submenu: false },
  },
  {
    id: 'text-actions', name: 'Text actions', source: 'https://m3.material.io/components/menus/guidelines',
    description: 'Editing text: undo, a disabled redo, then cut, copy and paste.',
    options: { menuSet: 'text-actions', text: 'Edit', variant: 'standard', icons: true, submenu: false },
  },
  {
    id: 'file-actions', name: 'File actions', source: 'https://m3.material.io/components/menus/guidelines',
    description: 'A file menu with Create open, and Offline mode selected.',
    options: { menuSet: 'file-actions', text: 'File', variant: 'standard', icons: true, submenu: true },
  },
  {
    id: 'dietary-filter', name: 'Dietary filter', source: 'https://m3.material.io/components/menus/guidelines',
    description: 'Choosing a diet, with Nut-free selected and the menu staying open.',
    options: { menuSet: 'dietary-filter', text: 'Diet', variant: 'vibrant', icons: true, closeOnSelect: false },
  },
];

export const menuComponent = {
  group: 'Navigation', name: 'Menu', factory: 'createMenu', variable: 'menu',
  description: 'Open a menu of actions. Explore placement, color, supporting text, and nested choices.',
  summary: 'Actions and nested choices on demand.', styles: ['menu', 'button', 'progress'],
  scenarios: menuScenarios,
  controls: [
    ...section('Appearance', [choose('variant', 'Variant', ['standard', 'vibrant', 'gap', 'baseline'], 'standard', 'select'), toggle('dense', 'Dense')]),
    ...section('Layout', [choose('position', 'Position', ['bottom-start', 'bottom-end', 'top-start', 'top-end', 'right-start', 'left-start'], 'bottom-start', 'select')]),
    ...section('Content', [menuSetControl, text('text', 'Button label', 'Open menu'), toggle('icons', 'Icons', true), toggle('supportingText', 'Supporting text', false, 'itemsDefault'), toggle('submenu', 'Submenu', false, 'itemsDefault')]),
    ...section('Behavior', [toggle('closeOnSelect', 'Close on selection', true)]),
  ],
  config: (state: ComponentState): MenuConfig => {
    const named = menuSet(state);
    const items = named ? named.items.map(item => stripIcon(item, state.icons === true)) : defaultItems(state);
    return {
      opener: '#menu-trigger', variant: state.variant === 'baseline' ? 'baseline' : 'vertical', color: state.variant === 'vibrant' ? 'vibrant' : 'standard', position: pick(state, 'position', ['bottom-start', 'bottom-end', 'top-start', 'top-end', 'right-start', 'left-start'], 'bottom-start'), dense: bool(state, 'dense'), closeOnSelect: bool(state, 'closeOnSelect'),
      ...(named ? { visible: true } : {}),
      items,
    };
  },
};
