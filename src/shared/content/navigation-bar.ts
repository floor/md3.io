// The navigation bar's playground content. The default destinations are the rail's
// (the factory starts with none). The named sets are the three badge figures.
import type { NavigationBarConfig } from 'material/components/navigation-bar';
import { symbols } from '../icons';
import { destinations } from './navigation-rail';
import { type ComponentState, type Control, type Scenario, bool, choose, pick, section, string, text, toggle } from './types';

/** One destination on a named bar. `badge: true` is the dot. */
interface BarItem {
  id: string;
  label: string;
  icon: string;
  /** Shown while this destination is selected. The element calls it `selected-icon`. */
  activeIcon?: string;
  badge?: string | true;
}

interface BarSet {
  name: string;
  /** The landmark name the set opens with. */
  ariaLabel: string;
  /** The destination the set opens on. */
  active: string;
  items: readonly BarItem[];
}

/**
 * The three bars on m3.material.io/components/badges/guidelines (read 5 October 2026).
 * `default` is not here: Inbox, Favorites and Sent stay the rail's.
 * Music's selected glyph is the same eighth note, so it has no `activeIcon`.
 */
const barSets: Record<string, BarSet> = {
  'unread-nav-bar': {
    name: 'Unread',
    ariaLabel: 'Primary navigation',
    active: 'mail',
    items: [
      { id: 'mail', label: 'Mail', icon: symbols.mail, activeIcon: symbols.mailFilled, badge: '999+' },
      { id: 'chat', label: 'Chat', icon: symbols.chatBubble, badge: '10' },
      { id: 'rooms', label: 'Rooms', icon: symbols.groups, badge: true },
      { id: 'meet', label: 'Meet', icon: symbols.videoCameraFront, badge: '3' },
    ],
  },
  'new-in-music': {
    name: 'New in music',
    ariaLabel: 'Primary navigation',
    active: 'music',
    items: [
      { id: 'home', label: 'Home', icon: symbols.home, activeIcon: symbols.homeFilled },
      { id: 'music', label: 'Music', icon: symbols.musicNote, badge: true },
      { id: 'explore', label: 'Explore', icon: symbols.explore },
    ],
  },
  'ten-in-music': {
    name: 'Ten in music',
    ariaLabel: 'Primary navigation',
    active: 'home',
    items: [
      { id: 'home', label: 'Home', icon: symbols.home, activeIcon: symbols.homeFilled },
      { id: 'music', label: 'Music', icon: symbols.musicNote, badge: '10' },
      { id: 'explore', label: 'Explore', icon: symbols.explore },
    ],
  },
};

const barSet = (state: ComponentState): BarSet | undefined => barSets[string(state, 'destinations')];

/** The Selected control's options for the destinations on the stage. */
export function barActiveOptions(state: ComponentState): { value: string; label: string }[] {
  const set = barSet(state);
  const items = set ? set.items : destinations;
  return items.map(item => ({ value: item.id, label: item.label }));
}

const layouts = ['auto', 'vertical', 'horizontal'] as const;

const destinationControl: Control = {
  ...choose('destinations', 'Destinations', ['default', 'unread-nav-bar', 'new-in-music', 'ten-in-music'], 'default', 'select'),
  labels: { default: 'Default', 'unread-nav-bar': 'Unread', 'new-in-music': 'New in music', 'ten-in-music': 'Ten in music' },
};

const activeIds = [...destinations.map(item => item.id), ...Object.values(barSets).flatMap(set => set.items.map(item => item.id))];
const activeLabels = Object.fromEntries([...destinations, ...Object.values(barSets).flatMap(set => set.items)].map(item => [item.id, item.label]));

const activeControl: Control = {
  ...choose('active', 'Selected', [...new Set(activeIds)], 'inbox', 'select'),
  labels: activeLabels,
};

const itemLayoutControl: Control = {
  ...choose('itemLayout', 'Item layout', layouts, 'auto', 'select'),
  labels: { auto: 'Auto', vertical: 'Vertical', horizontal: 'Horizontal' },
};

/**
 * The bar's scenarios. The figures are the badges guidelines page (read 5 October 2026).
 * Each one shows the icon above the label, so the scenario sets vertical; the page's
 * own default stays auto. Options name playground controls only.
 */
const navigationBarScenarios: readonly Scenario[] = [
  {
    id: 'unread-nav-bar', name: 'Unread', source: 'https://m3.material.io/components/badges/guidelines',
    description: 'Mail selected with 999+, Chat with 10, Rooms with a dot, and Meet with 3.',
    options: { destinations: 'unread-nav-bar', active: 'mail', itemLayout: 'vertical', ariaLabel: 'Primary navigation' },
  },
  {
    id: 'new-in-music', name: 'New in music', source: 'https://m3.material.io/components/badges/guidelines',
    description: 'Home, Music selected with a dot, and Explore, with the labels shown.',
    options: { destinations: 'new-in-music', active: 'music', itemLayout: 'vertical', ariaLabel: 'Primary navigation' },
  },
  {
    id: 'ten-in-music', name: 'Ten in music', source: 'https://m3.material.io/components/badges/guidelines',
    description: 'Home selected, Music with 10, and Explore.',
    options: { destinations: 'ten-in-music', active: 'home', itemLayout: 'vertical', ariaLabel: 'Primary navigation' },
  },
];

export const navigationBarComponent = {
  group: 'Navigation', name: 'Navigation bar', factory: 'createNavigationBar', variable: 'navigationBar',
  description: 'Move between destinations along the bottom of the window.',
  summary: 'Three to five destinations in a bar.', styles: ['navigation-bar'],
  scenarios: navigationBarScenarios,
  controls: [
    ...section('Content', [destinationControl, activeControl, text('ariaLabel', 'Accessible label', 'Mail navigation')]),
    ...section('Layout', [itemLayoutControl]),
    ...section('Behavior', [toggle('ripple', 'Ripple', true)]),
  ],
  config: (state: ComponentState): NavigationBarConfig => {
    const set = barSet(state);
    const items = set ? set.items : destinations;
    const active = items.some(item => item.id === state.active) ? String(state.active) : (set?.active ?? 'inbox');
    return {
      itemLayout: pick(state, 'itemLayout', layouts, 'auto'),
      ripple: bool(state, 'ripple'),
      ariaLabel: string(state, 'ariaLabel') || set?.ariaLabel || 'Mail navigation',
      items: items.map(item => ({
        id: item.id,
        label: item.label,
        icon: item.icon,
        ...('activeIcon' in item && item.activeIcon ? { activeIcon: item.activeIcon } : {}),
        ...('badge' in item && item.badge !== undefined ? { badge: item.badge } : {}),
        active: active === item.id,
      })),
    };
  },
};
