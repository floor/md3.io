// The FAB's playground content: its scenarios and its registry entry, moved from
// src/shared/components.ts.
import type { FabConfig } from 'material/components/fab';
import { type ComponentState, type Scenario, bool, choose, disabled, fabPosition, icon, iconMarkup, position, section, string, text, toneControl, toggle } from './types';

/**
 * The FAB's scenarios, from m3.material.io (read 7 October 2026). Options name playground
 * controls only. The default picture is the add icon. The pencil is the one figure.
 */
const fabScenarios: readonly Scenario[] = [
  {
    id: 'compose', name: 'Compose', source: 'https://m3.material.io/components/floating-action-button/guidelines',
    description: 'A pencil. The inbox and the navigation bar are not part of the button.',
    options: { icon: 'edit', ariaLabel: 'Compose' },
  },
];
export const fabComponent = {
  group: 'Actions', name: 'FAB', factory: 'createFab', variable: 'fab',
  description: 'Give your primary action a place to stand out. Explore color, size, and floating positions.',
  summary: 'A floating action with a clear purpose.',
  styles: ['fab'],
  scenarios: fabScenarios,
  controls: [
    ...section('Appearance', [toneControl, choose('size', 'Size', ['default', 'medium', 'large'], 'default', 'select'),
      position, toggle('lowered', 'Lowered elevation')]),
    ...section('Content', [icon(['add', 'edit', 'heart', 'download', 'send'], 'add'), text('ariaLabel', 'Accessible label', 'Create new item')]),
    ...section('Behavior', [disabled]),
  ],
  config: (state: ComponentState): FabConfig => ({ variant: string(state, 'variant'), size: string(state, 'size'), icon: iconMarkup(state),
    ariaLabel: string(state, 'ariaLabel').trim() || 'Create new item', disabled: bool(state, 'disabled'), ...fabPosition(state) }),
};
