// The navigation rail's playground content: the destinations the rail, the drawer and
// the tabs share, its named destination sets, and its registry entry.
import type { NavigationRailConfig } from 'material/components/navigation-rail';
import { symbols } from '../icons';
import { type ComponentState, type Control, type Scenario, bool, choose, iconByName, pick, range, section, string, toggle } from './types';

/** The Selected control the drawer and the tabs still share, until each has its own. */
export const activeDestination = choose('active', 'Selected', ['inbox', 'favorites', 'sent'], 'inbox', 'select');

export const destinations = [{ id: 'inbox', label: 'Inbox', icon: iconByName('inbox') }, { id: 'favorites', label: 'Favorites', icon: iconByName('heart') }, { id: 'sent', label: 'Sent', icon: iconByName('send') }];

/** One destination on a named rail. */
interface RailItem {
  id: string;
  label: string;
  icon: string;
}

/** The FAB the guidelines put in the rail's header. `text` makes it an extended FAB. */
export interface RailHeader {
  icon: string;
  text?: string;
  ariaLabel: string;
}

interface RailSet {
  name: string;
  ariaLabel: string;
  /** The destination the set opens on. */
  active: string;
  header?: RailHeader;
  items: readonly RailItem[];
}

/**
 * Named destination sets from m3.material.io/components/navigation-rail/guidelines
 * (read 6 October 2026). `default` is not here: today's Inbox, Favorites and Sent
 * stay exactly as they were. The expanded clock's "Sleep well" subhead is not in
 * a set: a rail item has no section type (material/.../navigation-rail/types.ts).
 */
const railSets: Record<string, RailSet> = {
  timer: {
    name: 'Timer',
    ariaLabel: 'Clock navigation',
    active: 'timer',
    header: { icon: symbols.hourglassBottom, ariaLabel: 'Add timer' },
    items: [
      { id: 'alarm', label: 'Alarm', icon: symbols.alarm },
      { id: 'clock', label: 'Clock', icon: symbols.schedule },
      { id: 'timer', label: 'Timer', icon: symbols.hourglassBottom },
      { id: 'stopwatch', label: 'Stopwatch', icon: symbols.timer },
    ],
  },
  'expanded-clock': {
    name: 'Expanded clock',
    ariaLabel: 'Clock navigation',
    active: 'timer',
    header: { icon: symbols.hourglassBottom, text: 'Add timer', ariaLabel: 'Add timer' },
    items: [
      { id: 'alarm', label: 'Alarm', icon: symbols.alarm },
      { id: 'clock', label: 'Clock', icon: symbols.schedule },
      { id: 'timer', label: 'Timer', icon: symbols.hourglassBottom },
      { id: 'stopwatch', label: 'Stopwatch', icon: symbols.timer },
      { id: 'schedule', label: 'Schedule', icon: symbols.bedtime },
      { id: 'stats', label: 'Stats', icon: symbols.barChart },
      { id: 'sleep-sounds', label: 'Sleep sounds', icon: symbols.musicNote },
    ],
  },
};

const railSet = (state: ComponentState): RailSet | undefined => railSets[string(state, 'destinations')];

/** The Selected control's options for the destinations on the stage. */
export function railActiveOptions(state: ComponentState): { value: string; label: string }[] {
  const set = railSet(state);
  const items = set ? set.items : destinations;
  return items.map(item => ({ value: item.id, label: item.label }));
}

/** The header FAB a named set shows, or none for today's mail rail. */
export function railHeader(state: ComponentState): RailHeader | undefined {
  return railSet(state)?.header;
}

const activeIds = [...destinations.map(item => item.id), ...Object.values(railSets).flatMap(set => set.items.map(item => item.id))];
const activeLabels = Object.fromEntries([...destinations, ...Object.values(railSets).flatMap(set => set.items)].map(item => [item.id, item.label]));

const destinationControl: Control = {
  ...choose('destinations', 'Destinations', ['default', 'timer', 'expanded-clock'], 'default', 'select'),
  labels: { default: 'Default', timer: 'Timer', 'expanded-clock': 'Expanded clock' },
};

const activeControl: Control = {
  ...choose('active', 'Selected', [...new Set(activeIds)], 'inbox', 'select'),
  labels: activeLabels,
};

/**
 * The rail's scenarios, from m3.material.io (read 6 October 2026). Options name
 * playground controls only. Timer is the collapsed clock rail; Expanded clock
 * opens it and adds the sleep destinations under the same tools.
 */
const navigationRailScenarios: readonly Scenario[] = [
  {
    id: 'timer', name: 'Timer', source: 'https://m3.material.io/components/navigation-rail/guidelines',
    description: 'Switching clock tools on a tablet: Alarm, Clock, Timer and Stopwatch, with an Add timer action.',
    options: { destinations: 'timer', layout: 'standard', expanded: false, active: 'timer', badges: false, showToggle: true },
  },
  {
    id: 'expanded-clock', name: 'Expanded clock', source: 'https://m3.material.io/components/navigation-rail/guidelines',
    description: 'The clock rail expanded so the tool names show, and the sleep destinations beside them.',
    options: { destinations: 'expanded-clock', layout: 'standard', expanded: true, expandedWidth: '280', active: 'timer', badges: false, showToggle: true },
  },
];

export const navigationRailComponent = {
  group: 'Navigation', name: 'Navigation rail', factory: 'createNavigationRail', variable: 'rail',
  description: 'Move between destinations. Explore collapsed, expanded, and modal navigation.',
  summary: 'Primary destinations in an expressive rail.', styles: ['navigation-rail', 'button', 'progress'],
  // The header FAB's styles: the preview only. Vanilla imports them when a set has a header.
  previewStyles: ['fab', 'extended-fab'],
  scenarios: navigationRailScenarios,
  controls: [
    ...section('Layout', [choose('layout', 'Layout', ['standard', 'modal'], 'standard'), toggle('expanded', 'Expanded'), { ...range('expandedWidth', 'Expanded width', '280'), min: 220, max: 360, step: 20 }, toggle('hideWhenCollapsed', 'Hide collapsed')]),
    ...section('Content', [destinationControl, activeControl, toggle('badges', 'Badges', true), toggle('showToggle', 'Menu button', true)]),
    ...section('Behavior', [toggle('ripple', 'Ripple', true)]),
  ],
  config: (state: ComponentState): NavigationRailConfig => {
    const set = railSet(state);
    const items = set ? set.items : destinations;
    const active = items.some(item => item.id === state.active) ? state.active : (set?.active ?? 'inbox');
    return {
      layout: pick(state, 'layout', ['standard', 'modal'], 'standard'), expanded: bool(state, 'expanded'), expandedWidth: Number(state.expandedWidth), hideWhenCollapsed: bool(state, 'hideWhenCollapsed'), showToggle: bool(state, 'showToggle'), ripple: bool(state, 'ripple'),
      ariaLabel: set?.ariaLabel ?? 'Mail navigation',
      items: items.map(item => ({
        ...item,
        active: active === item.id,
        // Today's mail rail writes `disabled: false` on every destination, as it did when Disable Sent was off.
        ...(!set ? { disabled: false } : {}),
        ...(state.badges && !set && item.id === 'inbox' ? { badge: 8, badgeLabel: '8 unread messages' } : {}),
      })),
    };
  },
};
