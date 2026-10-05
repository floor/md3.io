// The extended FAB's playground content: its scenarios and its registry entry, moved
// from src/shared/components.ts.
import type { ExtendedFabConfig } from 'material/components/extended-fab';
import { type ComponentState, type Scenario, bool, choose, disabled, fabPosition, icon, iconMarkup, pick, position, section, string, text, toneControl, toggle } from './types';

/**
 * The extended FAB's scenarios, from m3.material.io (read 5 October 2026). Options name
 * playground controls only.
 */
const extendedFabScenarios: readonly Scenario[] = [
  {
    id: 'create', name: 'Create', source: 'https://m3.material.io/components/extended-fab/guidelines',
    description: 'A labelled Create, for when an icon alone is ambiguous.',
    options: { text: 'Create', icon: 'add' },
  },
];
export const extendedFabComponent = {
  group: 'Actions', name: 'Extended FAB', factory: 'createExtendedFab', variable: 'extendedFab',
  description: 'Give your primary action a little more context. Try labels, icon placement, and a collapsed state.',
  summary: 'A floating action, with room for a label.',
  styles: ['extended-fab'],
  scenarios: extendedFabScenarios,
  controls: [
    ...section('Appearance', [toneControl, choose('size', 'Size', ['small', 'medium', 'large'], 'small'),
      choose('width', 'Width', ['fixed', 'fluid'], 'fixed'), position, toggle('lowered', 'Lowered elevation')]),
    ...section('Content', [icon(['add', 'edit', 'heart', 'download', 'send'], 'edit'), text('text', 'Text', 'Compose'), choose('iconPosition', 'Icon position', ['start', 'end'], 'start')]),
    ...section('Behavior', [toggle('collapsed', 'Collapsed'), disabled]),
  ],
  config: (state: ComponentState): ExtendedFabConfig => ({
    variant: string(state, 'variant'), size: pick(state, 'size', ['small', 'medium', 'large'], 'small'), icon: iconMarkup(state),
    text: string(state, 'text'), ariaLabel: string(state, 'text').trim() || 'Compose', disabled: bool(state, 'disabled'),
    iconPosition: pick(state, 'iconPosition', ['start', 'end'], 'start'), width: pick(state, 'width', ['fixed', 'fluid'], 'fixed'), ...fabPosition(state),
  }),
};
