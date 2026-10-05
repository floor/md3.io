// The FAB menu's playground content: its registry entry, moved from
// src/shared/components.ts.
import type { FabMenuConfig } from 'material/components/fab-menu';
import { type ComponentState, choose, iconByName, pick, section, toggle } from './types';

export const fabMenuComponent = {
  group: 'Actions', name: 'FAB menu', factory: 'createFabMenu', variable: 'fabMenu',
  description: 'Offer a few related actions from one FAB. Try the expressive list, the baseline menu the web uses, and the colour sets.',
  summary: 'Two to six related actions, opened from a FAB.', styles: ['fab', 'menu', 'fab-menu'],
  scenarios: [],
  controls: [
    ...section('Appearance', [choose('presentation', 'Presentation', ['list', 'menu', 'auto'], 'list'), choose('color', 'Color', ['primary', 'secondary', 'tertiary'], 'primary'), choose('size', 'Size', ['default', 'medium', 'large'], 'default', 'select'),
      // A select, as Size is: `bottom-end` and `bottom-start` are longer than the
      // segmented Presentation and Color labels, and a select keeps the column narrow.
      choose('placement', 'Placement', ['none', 'bottom-end', 'bottom-start'], 'none', 'select')]),
    ...section('Content', [choose('items', 'Item count', ['2', '3', '4', '5', '6'], '3'), toggle('itemIcons', 'Item icons', true)]),
  ],
  config: (state: ComponentState): FabMenuConfig => {
    // `none` is the library's own default, so the code names a placement only when one is set.
    const placement = pick(state, 'placement', ['none', 'bottom-end', 'bottom-start'], 'none');
    return {
      icon: iconByName('edit'), ariaLabel: 'Reply options',
      presentation: pick(state, 'presentation', ['list', 'menu', 'auto'], 'list'),
      color: pick(state, 'color', ['primary', 'secondary', 'tertiary'], 'primary'),
      size: pick(state, 'size', ['default', 'medium', 'large'], 'default'),
      ...(placement === 'none' ? {} : { placement }),
      items: [['reply', 'Reply', 'send'], ['forward', 'Forward', 'send'], ['star', 'Favorite', 'heart'], ['save', 'Bookmark', 'bookmark'], ['download', 'Download', 'download'], ['inbox', 'Archive', 'inbox']]
        .slice(0, Number(state.items))
        .map(([id, text, icon]) => ({ id: id!, text: text!, ...(state.itemIcons ? { icon: iconByName(icon!) } : {}) })),
    };
  },
};
