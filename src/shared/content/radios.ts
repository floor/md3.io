// The radio buttons' playground content: its scenarios and its registry entry, moved
// from src/shared/components.ts.
import type { RadiosConfig } from 'material/components/radios';
import { type ComponentState, type Scenario, bool, choose, disabled, pick, section, string, text, toggle } from './types';

/**
 * The radio buttons' scenarios, from m3.material.io (read 5 October 2026). Options name
 * playground controls only.
 */
const radiosScenarios: readonly Scenario[] = [
  {
    id: 'selected', name: 'Express delivery', source: 'https://m3.material.io/components/radio-button/guidelines',
    description: 'A radio button set with the express option selected.',
    options: { value: 'express' },
  },
];
export const radiosComponent = {
  group: 'Selection & input', name: 'Radio buttons', factory: 'createRadios', variable: 'radios',
  description: 'Choose one option from a set. Explore orientation, label placement, and disabled options.',
  summary: 'One choice from a related set.', styles: ['radios'],
  scenarios: radiosScenarios,
  controls: [
    ...section('Layout', [choose('direction', 'Direction', ['vertical', 'horizontal'], 'vertical'), toggle('labelBefore', 'Labels before')]),
    ...section('Content', [text('name', 'Name', 'delivery'), choose('value', 'Selected', ['standard', 'express', 'pickup'], 'standard', 'select')]),
    ...section('Behavior', [toggle('disableExpress', 'Disable express'), disabled]),
  ],
  config: (state: ComponentState): RadiosConfig => ({ name: string(state, 'name') || 'delivery', direction: pick(state, 'direction', ['vertical', 'horizontal'], 'vertical'),
    value: bool(state, 'disableExpress') && state.value === 'express' ? 'standard' : string(state, 'value'), disabled: bool(state, 'disabled'),
    options: [{ value: 'standard', label: 'Standard' }, { value: 'express', label: 'Express', disabled: bool(state, 'disableExpress') }, { value: 'pickup', label: 'Pick up' }].map(option => ({ ...option, labelBefore: bool(state, 'labelBefore') })) }),
};
