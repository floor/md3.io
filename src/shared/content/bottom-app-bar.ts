// The bottom app bar's playground content: its registry entry, moved from
// src/shared/components.ts.
import type { BottomAppBarConfig } from 'material/components/bottom-app-bar';
import { type ComponentState, bool, choose, pick, section, text, toggle } from './types';

export const bottomAppBarComponent = {
  group: 'Navigation', name: 'Bottom app bar', factory: 'createBottomAppBar', variable: 'bottomBar',
  description: 'Keep frequent actions within reach. Try a floating action button and different placements.',
  summary: 'Frequent actions with an optional FAB.', styles: ['bottom-app-bar', 'icon-button', 'fab'],
  scenarios: [],
  controls: [
    ...section('Layout', [toggle('hasFab', 'Show FAB', true), choose('fabPosition', 'FAB position', ['center', 'end'], 'end')]),
    ...section('Content', [choose('actions', 'Action count', ['1', '2', '3'], '2'), text('fabLabel', 'FAB label', 'Compose')]),
    ...section('Behavior', [toggle('visible', 'Visible', true)]),
  ],
  config: (state: ComponentState): BottomAppBarConfig => ({ hasFab: bool(state, 'hasFab'), fabPosition: pick(state, 'fabPosition', ['center', 'end'], 'end'), autoHide: false }),
};
