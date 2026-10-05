// The checkbox's playground content: its parent-and-children set and its registry
// entry, moved from src/shared/components.ts.
import type { CheckboxConfig } from 'material/components/checkbox';
import { type ComponentState, bool, choose, disabled, pick, section, string, text, toggle } from './types';

/** The children of the checkbox playground's parent, from the m3.material.io guidelines. */
export const checkboxChildren = [
  { label: 'Pickles', value: 'pickles' }, { label: 'Tomato', value: 'tomato' },
  { label: 'Lettuce', value: 'lettuce' }, { label: 'Cheese', value: 'cheese' },
] as const;

/** Whether a child starts checked: all when the parent is, Tomato alone when it is mixed. */
export const checkboxChildChecked = (state: ComponentState, value: string): boolean =>
  state.state === 'checked' || (state.state === 'indeterminate' && value === 'tomato');

export const checkboxComponent = {
  group: 'Selection & input', name: 'Checkbox', factory: 'createCheckbox', variable: 'checkbox',
  description: 'Make a choice, or represent a partial selection. Explore checkbox states, labels, and form behavior.',
  summary: 'Single choices and mixed selections.',
  styles: ['checkbox'],
  scenarios: [],
  controls: [
    ...section('Appearance', [choose('labelPosition', 'Label position', ['start', 'end'], 'end')]),
    // The m3.material.io checkbox guidelines' parent and children: the label names
    // the parent, the children are the guideline's own. FLO-269.
    ...section('Content', [toggle('family', 'Parent and children', true), text('label', 'Label', 'Additions'), text('name', 'Name', 'additions'), text('value', 'Value', 'on')]),
    ...section('Behavior', [choose('state', 'State', ['unchecked', 'checked', 'indeterminate'], 'indeterminate', 'select'), toggle('error', 'Error'), toggle('required', 'Required'), disabled]),
  ],
  config: (state: ComponentState): CheckboxConfig => ({
    label: string(state, 'label'), name: string(state, 'name'), value: string(state, 'value') || 'on',
    labelPosition: pick(state, 'labelPosition', ['start', 'end'], 'end'),
    checked: state.state === 'checked', indeterminate: state.state === 'indeterminate',
    // withInput writes boolean attributes by presence, so omit them when false.
    ...(bool(state, 'disabled') ? { disabled: true } : {}),
    ...(bool(state, 'required') ? { required: true } : {}),
    ...(bool(state, 'error') ? { error: true } : {}),
  }),
};
