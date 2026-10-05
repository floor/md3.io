// The select's playground content: its registry entry, moved from
// src/shared/components.ts.
import type { SelectConfig } from 'material/components/select';
import { type ComponentState, bool, choose, disabled, pick, section, string, text, toggle } from './types';

export const selectComponent = {
  group: 'Selection & input', name: 'Select', factory: 'createSelect', variable: 'select',
  description: 'Pick an option from a menu. Explore field styles, selection, and validation states.',
  summary: 'A menu of choices in a field.', styles: ['text-field', 'menu', 'select'],
  scenarios: [],
  controls: [
    ...section('Appearance', [choose('variant', 'Variant', ['filled', 'outlined'], 'outlined'), choose('density', 'Density', ['default', 'compact'], 'default')]),
    ...section('Content', [text('label', 'Label', 'Fruit'), choose('value', 'Selected', ['', 'apple', 'banana', 'cherry'], 'apple', 'select'), text('supportingText', 'Supporting text', 'Choose a favorite')]),
    ...section('Behavior', [toggle('disableBanana', 'Disable banana'), toggle('error', 'Error'), toggle('required', 'Required'), disabled]),
  ],
  config: (state: ComponentState): SelectConfig => ({ variant: string(state, 'variant'), density: string(state, 'density'), label: string(state, 'label'), value: string(state, 'value'),
    supportingText: string(state, 'supportingText'), error: bool(state, 'error'), required: bool(state, 'required'), disabled: bool(state, 'disabled'), name: 'fruit',
    options: [{ id: 'apple', text: 'Apple' }, { id: 'banana', text: 'Banana', disabled: bool(state, 'disableBanana') }, { id: 'cherry', text: 'Cherry' }] }),
};
