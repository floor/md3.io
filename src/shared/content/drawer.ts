// The drawer's playground content: its named destination sets and its registry entry.
// The default is a photos app, from the page's accessibility figures (read 8 October
// 2026): Photos, Albums, Recents, Trash — "A navigation drawer item's label text and
// accessibility label both read “photos.” The role is “tab.”" and "While the visible
// label text reads Recents, the accessibility label for this destination clarifies its
// function: Recent images". The mail drawer the default used to be is the mailbox set
// below, built from the destinations the rail and the tabs share.
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

/** The default drawer's destinations: the photos app of the page's accessibility figures. */
const defaultDestinations = [
  { id: 'photos', label: 'Photos', icon: symbols.image },
  { id: 'albums', label: 'Albums', icon: symbols.album },
  { id: 'recents', label: 'Recents', icon: symbols.schedule },
  { id: 'trash', label: 'Trash', icon: symbols.delete },
] as const;

/**
 * Named destination sets from m3.material.io/components/navigation-drawer/guidelines
 * (read 8 October 2026). `default` is not here: today's photos app stays exactly as it
 * was. mailbox is the mail drawer the default used to be (the rail's Inbox, Favorites,
 * Sent under "Your mailbox", eight unread on Inbox). mailbox-folders follows the
 * desktop figure: Mail, Inbox 24, Outbox 100+, Favorites, Trash, then Personal Folders.
 */
const drawerSets: Record<string, DrawerSet> = {
  mailbox: {
    name: 'Mailbox',
    active: 'inbox',
    items: [
      { type: 'section', sectionLabel: 'Your mailbox' },
      ...destinations.map(item => ({
        id: item.id, label: item.label, icon: item.icon, disabled: false,
        ...(item.id === 'inbox' ? { badge: '8' } : {}),
      })),
    ],
  },
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
  // badge-m3-5. Photos is `image`, Fonts is `font_download` (A in a square),
  // Documents is `article` (a square of text lines), Delete is `delete`.
  files: {
    name: 'Files',
    active: 'photos',
    items: [
      { id: 'photos', label: 'Photos', icon: symbols.image, badge: '999+' },
      { id: 'fonts', label: 'Fonts', icon: symbols.fontDownload },
      { id: 'documents', label: 'Documents', icon: symbols.article },
      { id: 'delete', label: 'Delete', icon: symbols.delete },
    ],
  },
};

const drawerSet = (state: ComponentState): DrawerSet | undefined => drawerSets[string(state, 'destinations')];

/** The rows on the stage: the photos app, or the named set with the toggles applied. */
function drawerItems(state: ComponentState): DrawerItemConfig[] {
  const set = drawerSet(state);
  if (!set) {
    return defaultDestinations.map(item => ({
      id: item.id, label: item.label, ...(state.icons ? { icon: item.icon } : {}), active: state.active === item.id, disabled: false,
    }));
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
  ['photos', 'Photos'], ['albums', 'Albums'], ['recents', 'Recents'], ['fonts', 'Fonts'], ['documents', 'Documents'], ['delete', 'Delete'],
] as const;

const destinationControl: Control = {
  ...choose('destinations', 'Destinations', ['default', 'mailbox', 'mailbox-folders', 'files'], 'default', 'select'),
  labels: { default: 'Default', mailbox: 'Mailbox', 'mailbox-folders': 'Mailbox folders', files: 'Files' },
};

const activeControl: Control = {
  ...choose('active', 'Selected', [...new Set(selectable.map(([id]) => id))], 'photos', 'select'),
  labels: Object.fromEntries(selectable),
};

/**
 * The drawer's scenarios, from m3.material.io (read 8 October 2026). Options name
 * playground controls only. Mailbox is the mail drawer the default used to be;
 * mailbox folders is the desktop drawer's mail list.
 */
const drawerScenarios: readonly Scenario[] = [
  {
    id: 'mailbox', name: 'Mailbox', source: 'https://m3.material.io/components/navigation-drawer/guidelines',
    description: 'A mail app\'s drawer: Inbox with eight unread, Favorites, and Sent under a "Your mailbox" label.',
    options: { destinations: 'mailbox', variant: 'standard', headline: 'Mail', active: 'inbox', icons: true, badges: true, sections: true, open: true },
  },
  {
    id: 'mailbox-folders', name: 'Mailbox folders', source: 'https://m3.material.io/components/navigation-drawer/guidelines',
    description: 'A mail drawer: Inbox and Outbox with counts, Favorites and Trash, then personal folders.',
    options: { destinations: 'mailbox-folders', variant: 'standard', headline: 'Mail', active: 'inbox', icons: true, badges: true, sections: true, open: true },
  },
  {
    id: 'files', name: 'Files', source: 'https://m3.material.io/components/badges/guidelines',
    description: 'A files drawer with Photos selected and a count of what it holds, then Fonts, Documents, and Delete.',
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
    // The photos default has no badge and no section, so those toggles do nothing there.
    // They stay, greyed, until Destinations is a named set (the panel's enabledWhen).
    ...section('Content', [destinationControl, text('headline', 'Headline', 'Photos'), activeControl, toggle('icons', 'Icons', true), toggle('badges', 'Badges', true, 'namedDestinations'), toggle('sections', 'Section labels', true, 'namedDestinations')]),
    ...section('Behavior', [toggle('open', 'Open', true), toggle('dismissible', 'Dismissible', true)]),
  ],
  config: (state: ComponentState): DrawerConfig => ({ variant: string(state, 'variant'), position: string(state, 'position'), width: Number(state.width), dense: bool(state, 'dense'), headline: string(state, 'headline'), open: bool(state, 'open'), dismissible: bool(state, 'dismissible'),
    items: drawerItems(state) }),
};
