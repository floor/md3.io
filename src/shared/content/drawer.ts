// The drawer's playground content: its named destination sets and its registry entry.
// The default destinations come from the navigation rail, the set the rail and the tabs share.
import type { DrawerConfig, DrawerItemConfig } from 'material/components/drawer';
import { symbols } from '../icons';
import { destinations } from './navigation-rail';
import { type ComponentState, type Control, type Scenario, bool, choose, range, section, string, text, toggle } from './types';

/** One row of a named drawer: a destination, a divider, or a section label. */
type DrawerRow = DrawerItemConfig;

interface DrawerSet {
  name: string;
  /** The destination the set opens on. */
  active: string;
  items: readonly DrawerRow[];
}

/**
 * Named destination sets from m3.material.io/components/navigation-drawer/guidelines
 * (read 6 October 2026). `default` is not here: today's mailbox stays exactly as it
 * was. The set follows the desktop figure: Mail, Inbox 24, Outbox 100+, Favorites,
 * Trash, then Personal Folders.
 */
const drawerSets: Record<string, DrawerSet> = {
  'mailbox-folders': {
    name: 'Mailbox folders',
    active: 'inbox',
    items: [
      { id: 'inbox', label: 'Inbox', icon: symbols.inbox, badge: '24' },
      { id: 'outbox', label: 'Outbox', icon: symbols.send, badge: '100+' },
      { id: 'favorites', label: 'Favorites', icon: symbols.heart },
      { id: 'trash', label: 'Trash', icon: symbols.delete },
      { type: 'divider' },
      { type: 'section', sectionLabel: 'Personal Folders' },
      { id: 'friends', label: 'Friends', icon: symbols.folder },
      { id: 'volunteering', label: 'Volunteering', icon: symbols.folder },
      { id: 'work', label: 'Work', icon: symbols.folder },
    ],
  },
  // badge-m3-5. Fonts and Documents have no symbol in icons.ts, so those rows
  // have no icon. Photos uses `image` (the landscape the figure draws; the file
  // was already in icons/). Delete uses `delete`.
  files: {
    name: 'Files',
    active: 'photos',
    items: [
      { id: 'photos', label: 'Photos', icon: symbols.image, badge: '999+' },
      { id: 'fonts', label: 'Fonts' },
      { id: 'documents', label: 'Documents' },
      { id: 'delete', label: 'Delete', icon: symbols.delete },
    ],
  },
};

const drawerSet = (state: ComponentState): DrawerSet | undefined => drawerSets[string(state, 'destinations')];

/** The rows on the stage: today's mailbox, or the named set with the toggles applied. */
function drawerItems(state: ComponentState): DrawerItemConfig[] {
  const set = drawerSet(state);
  if (!set) {
    return [
      ...(state.sections ? [{ type: 'section' as const, sectionLabel: 'Your mailbox' }] : []),
      ...destinations.map(item => ({
        id: item.id, label: item.label, ...(state.icons ? { icon: item.icon } : {}), active: state.active === item.id, disabled: false,
        ...(state.badges && item.id === 'inbox' ? { badge: '8' } : {}),
      })),
    ];
  }
  const active = set.items.some(item => item.id === state.active) ? state.active : set.active;
  return set.items.flatMap(item => {
    if (!state.sections && (item.type === 'section' || item.type === 'divider')) return [];
    if (item.type === 'section' || item.type === 'divider') return [{ ...item }];
    const { icon, badge, ...rest } = item;
    return [{
      ...rest,
      ...(state.icons && icon ? { icon } : {}),
      ...(state.badges && badge ? { badge } : {}),
      active: active === item.id,
    }];
  });
}

/** The Selected control's options for the destinations on the stage. */
export function drawerActiveOptions(state: ComponentState): { value: string; label: string }[] {
  return drawerItems(state).flatMap(item => item.id && item.label ? [{ value: item.id, label: item.label }] : []);
}

const selectable = [
  ...destinations.map(item => [item.id, item.label] as const),
  ['outbox', 'Outbox'], ['trash', 'Trash'], ['friends', 'Friends'], ['volunteering', 'Volunteering'], ['work', 'Work'],
  ['photos', 'Photos'], ['fonts', 'Fonts'], ['documents', 'Documents'], ['delete', 'Delete'],
] as const;

const destinationControl: Control = {
  ...choose('destinations', 'Destinations', ['default', 'mailbox-folders', 'files'], 'default', 'select'),
  labels: { default: 'Default', 'mailbox-folders': 'Mailbox folders', files: 'Files' },
};

const activeControl: Control = {
  ...choose('active', 'Selected', [...new Set(selectable.map(([id]) => id))], 'inbox', 'select'),
  labels: Object.fromEntries(selectable),
};

/**
 * The drawer's scenario, from m3.material.io (read 6 October 2026). Options name
 * playground controls only. Mailbox folders is the desktop drawer's mail list.
 */
const drawerScenarios: readonly Scenario[] = [
  {
    id: 'mailbox-folders', name: 'Mailbox folders', source: 'https://m3.material.io/components/navigation-drawer/guidelines',
    description: 'A mail drawer: Inbox and Outbox with counts, Favorites and Trash, then personal folders.',
    options: { destinations: 'mailbox-folders', variant: 'standard', headline: 'Mail', active: 'inbox', icons: true, badges: true, sections: true, open: true },
  },
  {
    id: 'files', name: 'Files', source: 'https://m3.material.io/components/badges/guidelines',
    description: 'A Files drawer. Photos is selected and shows 999+. Fonts, Documents and Delete follow.',
    options: { destinations: 'files', variant: 'standard', headline: 'Files', active: 'photos', icons: true, badges: true, sections: false, open: true },
  },
];

export const drawerComponent = {
  group: 'Navigation', name: 'Drawer', factory: 'createDrawer', variable: 'drawer',
  description: 'Explore a navigation drawer with destinations, section labels, and badges.',
  summary: 'Grouped destinations in a side panel.', styles: ['drawer', 'button', 'progress'],
  scenarios: drawerScenarios,
  controls: [
    ...section('Appearance', [choose('variant', 'Variant', ['standard', 'modal'], 'standard'), toggle('dense', 'Dense')]),
    ...section('Layout', [choose('position', 'Position', ['start', 'end'], 'start'), { ...range('width', 'Width', '280'), min: 220, max: 360, step: 20 }]),
    ...section('Content', [destinationControl, text('headline', 'Headline', 'Mail'), activeControl, toggle('icons', 'Icons', true), toggle('badges', 'Badges', true), toggle('sections', 'Section labels', true)]),
    ...section('Behavior', [toggle('open', 'Open', true), toggle('dismissible', 'Dismissible', true)]),
  ],
  config: (state: ComponentState): DrawerConfig => ({ variant: string(state, 'variant'), position: string(state, 'position'), width: Number(state.width), dense: bool(state, 'dense'), headline: string(state, 'headline'), open: bool(state, 'open'), dismissible: bool(state, 'dismissible'),
    items: drawerItems(state) }),
};
