// The tooltip's playground content: its registry entry, moved from
// src/shared/components.ts.
import type { TooltipConfig } from 'material/components/tooltip';
import { type ComponentState, bool, choose, range, section, string, text, toggle } from './types';

export const tooltipComponent = {
  group: 'Communication', name: 'Tooltip', factory: 'createTooltip', variable: 'tooltip',
  description: 'Add a little context. Hover or focus the action to explore tooltip styles, placement, and timing.',
  summary: 'Extra context on hover or focus.', styles: ['icon-button', 'tooltip'],
  scenarios: [],
  controls: [
    ...section('Appearance', [choose('variant', 'Variant', ['default', 'plain', 'rich'], 'default'), choose('position', 'Position', ['top', 'right', 'bottom', 'left', 'top-start', 'top-end', 'right-start', 'right-end', 'bottom-start', 'bottom-end', 'left-start', 'left-end'], 'bottom', 'select')]),
    ...section('Content', [text('text', 'Text', 'Save to favorites')]),
    ...section('Behavior', [toggle('visible', 'Visible'), toggle('showOnHover', 'Show on hover', true), toggle('showOnFocus', 'Show on focus', true), { ...range('showDelay', 'Show delay (ms)', '300'), max: 1500, step: 100 }, { ...range('hideDelay', 'Hide delay (ms)', '100'), max: 1500, step: 100 }]),
  ],
  config: (state: ComponentState): TooltipConfig => ({ text: string(state, 'text'), variant: string(state, 'variant'), position: string(state, 'position'), visible: bool(state, 'visible'), showDelay: Number(state.showDelay), hideDelay: Number(state.hideDelay), showOnFocus: bool(state, 'showOnFocus'), showOnHover: bool(state, 'showOnHover') }),
};
