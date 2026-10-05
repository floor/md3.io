// The navigation rail's playground content: the destinations the rail, the drawer and
// the tabs share, and its registry entry, moved from src/shared/components.ts.
import type { NavigationRailConfig } from 'material/components/navigation-rail';
import { type ComponentState, bool, choose, iconByName, pick, range, section, toggle } from './types';

export const destinations = [{ id: 'inbox', label: 'Inbox', icon: iconByName('inbox') }, { id: 'favorites', label: 'Favorites', icon: iconByName('heart') }, { id: 'sent', label: 'Sent', icon: iconByName('send') }];
export const activeDestination = choose('active', 'Selected', ['inbox', 'favorites', 'sent'], 'inbox', 'select');

export const navigationRailComponent = {
  group: 'Navigation', name: 'Navigation rail', factory: 'createNavigationRail', variable: 'rail',
  description: 'Move between destinations. Explore collapsed, expanded, and modal navigation.',
  summary: 'Primary destinations in an expressive rail.', styles: ['navigation-rail', 'button', 'progress'],
  scenarios: [],
  controls: [
    ...section('Layout', [choose('layout', 'Layout', ['standard', 'modal'], 'standard'), toggle('expanded', 'Expanded'), { ...range('expandedWidth', 'Expanded width', '280'), min: 220, max: 360, step: 20 }, toggle('hideWhenCollapsed', 'Hide collapsed')]),
    ...section('Content', [activeDestination, toggle('badges', 'Badges', true), toggle('showToggle', 'Menu button', true)]),
    ...section('Behavior', [toggle('disableSent', 'Disable Sent'), toggle('ripple', 'Ripple', true)]),
  ],
  config: (state: ComponentState): NavigationRailConfig => ({ layout: pick(state, 'layout', ['standard', 'modal'], 'standard'), expanded: bool(state, 'expanded'), expandedWidth: Number(state.expandedWidth), hideWhenCollapsed: bool(state, 'hideWhenCollapsed'), showToggle: bool(state, 'showToggle'), ripple: bool(state, 'ripple'), ariaLabel: 'Mail navigation',
    items: destinations.map(item => ({ ...item, active: state.active === item.id, disabled: item.id === 'sent' && bool(state, 'disableSent'), ...(state.badges && item.id === 'inbox' ? { badge: 8, badgeLabel: '8 unread messages' } : {}) })) }),
};
