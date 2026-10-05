// The drawer's playground content: its registry entry, moved from
// src/shared/components.ts. The destinations it lists come from the navigation rail's
// module, the set the rail, this drawer and the tabs share.
import type { DrawerConfig } from 'material/components/drawer';
import { activeDestination, destinations } from './navigation-rail';
import { type ComponentState, bool, choose, range, section, string, text, toggle } from './types';

export const drawerComponent = {
  group: 'Navigation', name: 'Drawer', factory: 'createDrawer', variable: 'drawer',
  description: 'Explore a navigation drawer with destinations, section labels, and badges.',
  summary: 'Grouped destinations in a side panel.', styles: ['drawer', 'button', 'progress'],
  scenarios: [],
  controls: [
    ...section('Appearance', [choose('variant', 'Variant', ['standard', 'modal'], 'standard'), toggle('dense', 'Dense')]),
    ...section('Layout', [choose('position', 'Position', ['start', 'end'], 'start'), { ...range('width', 'Width', '280'), min: 220, max: 360, step: 20 }]),
    ...section('Content', [text('headline', 'Headline', 'Mail'), activeDestination, toggle('icons', 'Icons', true), toggle('badges', 'Badges', true), toggle('sections', 'Section labels', true)]),
    ...section('Behavior', [toggle('open', 'Open', true), toggle('dismissible', 'Dismissible', true), toggle('disableSent', 'Disable Sent')]),
  ],
  config: (state: ComponentState): DrawerConfig => ({ variant: string(state, 'variant'), position: string(state, 'position'), width: Number(state.width), dense: bool(state, 'dense'), headline: string(state, 'headline'), open: bool(state, 'open'), dismissible: bool(state, 'dismissible'),
    items: [...(state.sections ? [{ type: 'section' as const, sectionLabel: 'Your mailbox' }] : []), ...destinations.map(item => ({ id: item.id, label: item.label, ...(state.icons ? { icon: item.icon } : {}), active: state.active === item.id, disabled: item.id === 'sent' && bool(state, 'disableSent'), ...(state.badges && item.id === 'inbox' ? { badge: '8' } : {}) }))] }),
};
