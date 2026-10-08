// The FAB menu's playground content: its named item sets and its registry entry.
import type { FabMenuConfig, FabMenuItem } from 'material/components/fab-menu';
import { symbols } from '../icons';
import { type ComponentState, type Scenario, choose, iconByName, pick, section, string, toggle } from './types';

interface MenuSet {
  name: string;
  /** Accessible name of the FAB. It is not drawn. */
  ariaLabel: string;
  items: readonly FabMenuItem[];
}

/**
 * Named menus from the saved figures. `default` is not here: Reply, Forward,
 * Favorite, Bookmark, Download and Archive stay exactly as they were.
 */
const menuSets: Record<string, MenuSet> = {
  'new-music': {
    name: 'New music',
    ariaLabel: 'Create',
    items: [
      { id: 'playlist', text: 'New playlist', icon: symbols.musicNote },
      { id: 'collection', text: 'New collection', icon: symbols.libraryMusic },
      { id: 'station', text: 'New station', icon: symbols.radio },
    ],
  },
  'photo-categories': {
    name: 'Photo categories',
    ariaLabel: 'Photo categories',
    items: [
      { id: 'pets', text: 'Pets', icon: symbols.pets },
      { id: 'landscapes', text: 'Landscapes', icon: symbols.landscape },
      { id: 'food', text: 'Food', icon: symbols.restaurant },
      { id: 'people', text: 'People', icon: symbols.person },
      { id: 'nature', text: 'Nature', icon: symbols.forest },
    ],
  },
  share: {
    name: 'Share',
    ariaLabel: 'Share',
    items: [
      { id: 'email', text: 'Email', icon: symbols.mail },
      { id: 'message', text: 'Message', icon: symbols.chat },
      { id: 'folder', text: 'Shared folder', icon: symbols.folderShared },
    ],
  },
};

const menuSet = (state: ComponentState): MenuSet | undefined => menuSets[string(state, 'menuSet')];

const defaultItems = (state: ComponentState): FabMenuItem[] =>
  [['reply', 'Reply', 'send'], ['forward', 'Forward', 'send'], ['star', 'Favorite', 'heart'], ['save', 'Bookmark', 'bookmark'], ['download', 'Download', 'download'], ['inbox', 'Archive', 'inbox']]
    .slice(0, Number(state.items))
    .map(([id, text, icon]) => ({ id: id!, text: text!, ...(state.itemIcons ? { icon: iconByName(icon!) } : {}) }));

/**
 * The FAB menu's scenarios, from m3.material.io (read 7 October 2026). Options name
 * playground controls only. Each menu is open: every tab declares it.
 */
const fabMenuScenarios: readonly Scenario[] = [
  {
    id: 'new-music', name: 'New music', source: 'https://m3.material.io/components/fab-menu/guidelines',
    description: 'An open menu for starting a playlist, a collection, or a station.',
    options: { menuSet: 'new-music', color: 'tertiary', open: true },
  },
  {
    id: 'photo-categories', name: 'Photo categories', source: 'https://m3.material.io/components/fab-menu/guidelines',
    description: 'An open menu of photo groups: Pets, Landscapes, Food, People, and Nature.',
    options: { menuSet: 'photo-categories', color: 'primary', open: true },
  },
  {
    id: 'share', name: 'Share', source: 'https://m3.material.io/components/fab-menu/guidelines',
    description: 'An open menu for sharing by email, a message, or a shared folder.',
    options: { menuSet: 'share', color: 'primary', open: true },
  },
];

const itemsControl = {
  ...choose('menuSet', 'Items', ['default', 'new-music', 'photo-categories', 'share'], 'default', 'select'),
  labels: { default: 'Default', 'new-music': 'New music', 'photo-categories': 'Photo categories', share: 'Share' },
};

export const fabMenuComponent = {
  group: 'Actions', name: 'FAB menu', factory: 'createFabMenu', variable: 'fabMenu',
  description: 'Offer a few related actions from one FAB. Try the expressive list, the baseline menu the web uses, and the colour sets.',
  summary: 'Two to six related actions, opened from a FAB.', styles: ['fab', 'menu', 'fab-menu'],
  scenarios: fabMenuScenarios,
  controls: [
    ...section('Appearance', [choose('presentation', 'Presentation', ['list', 'menu', 'auto'], 'list'), choose('color', 'Color', ['primary', 'secondary', 'tertiary'], 'primary'), choose('size', 'Size', ['default', 'medium', 'large'], 'default', 'select'),
      choose('placement', 'Placement', ['none', 'bottom-end', 'bottom-start'], 'none', 'select')]),
    ...section('Content', [itemsControl, { ...choose('items', 'Item count', ['2', '3', '4', '5', '6'], '3'), enabledWhen: 'menuSetDefault' }, toggle('itemIcons', 'Item icons', true)]),
    ...section('Behavior', [toggle('open', 'Open')]),
  ],
  config: (state: ComponentState): FabMenuConfig => {
    const set = menuSet(state);
    const placement = pick(state, 'placement', ['none', 'bottom-end', 'bottom-start'], 'none');
    return {
      icon: iconByName('edit'), ariaLabel: set ? set.ariaLabel : 'Reply options',
      presentation: pick(state, 'presentation', ['list', 'menu', 'auto'], 'list'),
      color: pick(state, 'color', ['primary', 'secondary', 'tertiary'], 'primary'),
      size: pick(state, 'size', ['default', 'medium', 'large'], 'default'),
      ...(placement === 'none' ? {} : { placement }),
      items: set
        ? set.items.map(item => ({ id: item.id, text: item.text, ...(state.itemIcons && item.icon ? { icon: item.icon } : {}) }))
        : defaultItems(state),
    };
  },
};
