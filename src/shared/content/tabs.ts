// The tabs' playground content: its named tab sets and its registry entry.
// The default destinations come from the navigation rail, the set the rail and the drawer share.
import type { TabsConfig } from 'material/components/tabs';
import { symbols } from '../icons';
import { destinations } from './navigation-rail';
import { type ComponentState, type Control, type Scenario, bool, choose, iconByName, section, string, toggle } from './types';

/** One tab in a named set. */
interface TabItem {
  id: string;
  label: string;
  icon?: string;
  badge?: string | number;
}

interface TabSet {
  name: string;
  /** The tab list's accessible name. */
  ariaLabel: string;
  /** The tab the set opens on. */
  active: string;
  items: readonly TabItem[];
}

/**
 * Named tab sets from m3.material.io/components/tabs/guidelines (read 6 October
 * 2026). `default` is not here: today's mailbox views stay exactly as they were.
 * Media gallery and Saved media badges use the same three words because both
 * figures do; the Photos badge is the difference.
 */
const tabSets: Record<string, TabSet> = {
  'trip-planner': {
    name: 'Trip planner',
    ariaLabel: 'Travel',
    active: 'flights',
    items: [
      { id: 'flights', label: 'Flights', icon: symbols.flight },
      { id: 'trips', label: 'Trips', icon: symbols.luggage },
      { id: 'explore', label: 'Explore', icon: symbols.explore },
    ],
  },
  'media-gallery': {
    name: 'Media gallery',
    ariaLabel: 'Saved media',
    active: 'video',
    items: [
      { id: 'video', label: 'Video', icon: symbols.videocam },
      { id: 'photos', label: 'Photos', icon: symbols.photoLibrary },
      { id: 'audio', label: 'Audio', icon: symbols.musicNote },
    ],
  },
  'saved-media-badges': {
    name: 'Saved media badges',
    ariaLabel: 'Saved media',
    active: 'video',
    items: [
      { id: 'video', label: 'Video', icon: symbols.videocam },
      { id: 'photos', label: 'Photos', icon: symbols.photoLibrary, badge: '999+' },
      { id: 'audio', label: 'Audio', icon: symbols.musicNote },
    ],
  },
  'recipe-sections': {
    name: 'Recipe sections',
    ariaLabel: 'Recipe',
    active: 'overview',
    items: [
      { id: 'overview', label: 'Overview' },
      { id: 'ingredients', label: 'Ingredients' },
      { id: 'instructions', label: 'Instructions' },
    ],
  },
};

const tabSet = (state: ComponentState): TabSet | undefined => tabSets[string(state, 'tabSet')];

const extraTabs = ['Drafts', 'Archive', 'Trash'].map(label => ({ id: label.toLowerCase(), label, icon: iconByName('inbox') }));

/** The tabs on the stage: today's mailbox, or the named set. */
function currentTabs(state: ComponentState): TabItem[] {
  const set = tabSet(state);
  if (!set) return [...destinations, ...(state.count === '6' ? extraTabs : [])];
  return set.items.map(item => ({ ...item }));
}

/** The tab list's accessible name. Default stays "Mailbox views". */
export function tabsAriaLabel(state: ComponentState): string {
  return tabSet(state)?.ariaLabel ?? 'Mailbox views';
}

/** The Selected control's options for the tabs on the stage. */
export function tabActiveOptions(state: ComponentState): { value: string; label: string }[] {
  return currentTabs(state).map(item => ({ value: item.id, label: item.label }));
}

const selectable = [
  ...destinations.map(item => [item.id, item.label] as const),
  ...extraTabs.map(item => [item.id, item.label] as const),
  ...Object.values(tabSets).flatMap(set => set.items.map(item => [item.id, item.label] as const)),
];

const tabSetControl: Control = {
  ...choose('tabSet', 'Tabs', ['default', 'trip-planner', 'media-gallery', 'saved-media-badges', 'recipe-sections'], 'default', 'select'),
  labels: { default: 'Default', ...Object.fromEntries(Object.entries(tabSets).map(([id, set]) => [id, set.name])) },
};

const activeControl: Control = {
  ...choose('active', 'Selected', [...new Set(selectable.map(([id]) => id))], 'inbox', 'select'),
  labels: Object.fromEntries(selectable),
};

/**
 * The tabs' scenarios, from m3.material.io (read 6 October 2026). Options name
 * playground controls only. Trip planner is the travel bar; the two media bars
 * are the same library, one with a count on Photos; Recipe sections is the text bar.
 */
const tabsScenarios: readonly Scenario[] = [
  {
    id: 'trip-planner', name: 'Trip planner', source: 'https://m3.material.io/components/tabs/guidelines',
    description: 'Choosing a travel view: Flights, Trips or Explore.',
    options: { tabSet: 'trip-planner', variant: 'primary', icons: true, badges: false, active: 'flights' },
  },
  {
    id: 'media-gallery', name: 'Media gallery', source: 'https://m3.material.io/components/tabs/guidelines',
    description: 'Switching a saved-media library between Video, Photos and Audio.',
    options: { tabSet: 'media-gallery', variant: 'primary', icons: true, badges: false, active: 'video' },
  },
  {
    id: 'saved-media-badges', name: 'Saved media badges', source: 'https://m3.material.io/components/tabs/guidelines',
    description: 'The same library with a count on Photos.',
    options: { tabSet: 'saved-media-badges', variant: 'primary', icons: true, badges: true, active: 'video' },
  },
  {
    id: 'recipe-sections', name: 'Recipe sections', source: 'https://m3.material.io/components/tabs/guidelines',
    description: 'Moving through a recipe: Overview, Ingredients, Instructions.',
    options: { tabSet: 'recipe-sections', variant: 'secondary', icons: false, badges: false, active: 'overview' },
  },
];

export const tabsComponent = {
  group: 'Navigation', name: 'Tabs', factory: 'createTabs', variable: 'tabs',
  description: 'Switch between related views. Try primary and secondary tabs, icons, and badges.',
  summary: 'Related views, one active tab.', styles: ['progress', 'button', 'badge', 'tabs'],
  scenarios: tabsScenarios,
  controls: [
    ...section('Appearance', [choose('variant', 'Variant', ['primary', 'secondary'], 'primary'), toggle('showDivider', 'Divider', true)]),
    ...section('Content', [tabSetControl, activeControl, toggle('icons', 'Icons', true), toggle('badges', 'Badges'), { ...choose('count', 'Tab count', ['3', '6'], '3'), enabledWhen: 'tabsDefault' }]),
    ...section('Behavior', [toggle('scrollable', 'Scrollable'), toggle('autoActivate', 'Select on arrow keys')]),
  ],
  config: (state: ComponentState): TabsConfig => {
    const named = tabSet(state);
    const items = currentTabs(state);
    const active = items.some(item => item.id === state.active) ? state.active : (named?.active ?? 'inbox');
    return {
      variant: string(state, 'variant'), showDivider: bool(state, 'showDivider'), scrollable: bool(state, 'scrollable'), ...(state.autoActivate ? { autoActivate: true } : {}),
      tabs: items.map(item => ({
        text: item.label, value: item.id, state: active === item.id ? 'active' as const : 'inactive' as const,
        ...(!named ? { disabled: false } : {}),
        ...(state.icons && item.icon ? { icon: item.icon } : {}),
        ...(state.badges && !named && item.id === 'inbox' ? { badge: 8 } : {}),
        ...(state.badges && named && item.badge !== undefined ? { badge: item.badge } : {}),
      })),
    };
  },
};
