// The badge's playground content: its registry entry, moved from
// src/shared/components.ts.
import type { BadgeConfig } from 'material/components/badge';
import { type ComponentState, bool, choose, section, string, text, toggle } from './types';

export const badgeComponent = {
  group: 'Communication', name: 'Badge', factory: 'createBadge', variable: 'badge',
  description: 'Draw attention to something new. Try dots, counts, and labels attached to an action.',
  summary: 'A small signal for updates and counts.', styles: ['icon-button', 'badge'],
  scenarios: [],
  controls: [
    ...section('Appearance', [choose('variant', 'Variant', ['small', 'large'], 'large'), choose('color', 'Color', ['error', 'primary', 'secondary', 'tertiary', 'success', 'warning', 'info'], 'error', 'select'), choose('position', 'Position', ['top-right', 'top-left', 'bottom-right', 'bottom-left'], 'top-right', 'select')]),
    ...section('Content', [{ ...text('label', 'Label', '8'), enabledWhen: 'hasLabel' }, { ...choose('max', 'Maximum count', ['9', '99', '999'], '99'), enabledWhen: 'hasLabel' }]),
    ...section('Behavior', [toggle('visible', 'Visible', true)]),
  ],
  config: (state: ComponentState): BadgeConfig => ({ variant: string(state, 'variant'), color: string(state, 'color'), position: string(state, 'position'), label: string(state, 'label'), max: Number(state.max), visible: bool(state, 'visible') }),
};
