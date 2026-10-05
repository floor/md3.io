// The tabs' playground content: its registry entry, moved from
// src/shared/components.ts. The destinations it lists come from the navigation rail's
// module, the set the rail, the drawer and these tabs share.
import type { TabsConfig } from 'material/components/tabs';
import { activeDestination, destinations } from './navigation-rail';
import { type ComponentState, bool, choose, iconByName, section, string, toggle } from './types';

export const tabsComponent = {
  group: 'Navigation', name: 'Tabs', factory: 'createTabs', variable: 'tabs',
  description: 'Switch between related views. Try primary and secondary tabs, icons, and badges.',
  summary: 'Related views, one active tab.', styles: ['progress', 'button', 'badge', 'tabs'],
  scenarios: [],
  controls: [
    ...section('Appearance', [choose('variant', 'Variant', ['primary', 'secondary'], 'primary'), toggle('showDivider', 'Divider', true)]),
    ...section('Content', [{ ...activeDestination, options: ['inbox', 'favorites', 'sent', 'drafts', 'archive', 'trash'] }, toggle('icons', 'Icons', true), toggle('badges', 'Badges'), choose('count', 'Tab count', ['3', '6'], '3')]),
    ...section('Behavior', [toggle('scrollable', 'Scrollable'), toggle('autoActivate', 'Select on arrow keys'), toggle('disableSent', 'Disable Sent')]),
  ],
  config: (state: ComponentState): TabsConfig => ({ variant: string(state, 'variant'), showDivider: bool(state, 'showDivider'), scrollable: bool(state, 'scrollable'), ...(state.autoActivate ? { autoActivate: true } : {}), tabs: [...destinations, ...(state.count === '6' ? ['Drafts', 'Archive', 'Trash'].map(label => ({ id: label.toLowerCase(), label, icon: iconByName('inbox') })) : [])].map(item => ({ text: item.label, value: item.id, state: state.active === item.id ? 'active' : 'inactive', disabled: item.id === 'sent' && bool(state, 'disableSent'), ...(state.icons ? { icon: item.icon } : {}), ...(state.badges && item.id === 'inbox' ? { badge: 8 } : {}) })) }),
};
