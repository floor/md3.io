// The checkbox's playground content: its parent-and-children sets and its registry
// entry, moved from src/shared/components.ts.
import type { CheckboxConfig } from 'material/components/checkbox';
import { type ComponentState, type Control, type Scenario, bool, choose, disabled, pick, section, string, text, toggle } from './types';

/** The children of the checkbox playground's parent, from the m3.material.io guidelines. */
export const checkboxChildren = [
  { label: 'Pickles', value: 'pickles' }, { label: 'Tomato', value: 'tomato' },
  { label: 'Lettuce', value: 'lettuce' }, { label: 'Cheese', value: 'cheese' },
] as const;

export interface CheckboxChild {
  readonly label: string;
  readonly value: string;
  readonly checkedWhenMixed?: boolean;
}

export interface CheckboxFamily {
  readonly name: string;
  readonly parent: string;
  readonly groupName: string;
  readonly children: readonly CheckboxChild[];
}

export const checkboxFamilies: Record<string, CheckboxFamily> = {
  'burger-additions': {
    name: 'Burger additions',
    parent: 'Additions',
    groupName: 'additions',
    children: [
      { label: 'Pickles', value: 'pickles' },
      { label: 'Tomato', value: 'tomato', checkedWhenMixed: true },
      { label: 'Lettuce', value: 'lettuce' },
    ],
  },
  'email-frequency': {
    name: 'Email notifications',
    parent: 'Receive emails',
    groupName: 'notifications',
    children: [
      { label: 'Daily', value: 'daily' },
      { label: 'Weekly', value: 'weekly', checkedWhenMixed: true },
      { label: 'Monthly', value: 'monthly' },
    ],
  },
};
checkboxFamilies['email-notifications'] = checkboxFamilies['email-frequency'];

const familySetControl: Control = {
  ...choose('familySet', 'Options', ['default', 'burger-additions', 'email-frequency'], 'default', 'select'),
  labels: {
    default: 'Default',
    'burger-additions': 'Burger additions',
    'email-frequency': 'Email notifications',
  },
};

/**
 * The checkbox's scenarios, from m3.material.io (read 5 October 2026). Options name
 * playground controls only. Parent and children sets can have all items selected or
 * unselected, or represent real-world toppings or notification cadences.
 */
const checkboxScenarios: readonly Scenario[] = [
  {
    id: 'burger-additions', name: 'Burger additions', source: 'https://m3.material.io/components/checkbox/guidelines',
    description: 'Customising a food order with optional toppings under an indeterminate parent checkbox.',
    options: { familySet: 'burger-additions', family: true, label: 'Additions', name: 'additions', state: 'indeterminate' },
  },
  {
    id: 'email-frequency', name: 'Email notifications', source: 'https://m3.material.io/components/checkbox/guidelines',
    description: 'Setting email digest frequencies with a parent toggle and child cadences.',
    options: { familySet: 'email-frequency', family: true, label: 'Receive emails', name: 'notifications', state: 'indeterminate' },
  },
];

/** The children of the current checkbox family, or the default burger toppings. */
export const currentCheckboxChildren = (state: ComponentState): readonly CheckboxChild[] => {
  const family = checkboxFamilies[string(state, 'familySet')];
  return family ? family.children : checkboxChildren;
};

/** Whether a child starts checked: all when the parent is, or according to the family's mixed state. */
export const checkboxChildChecked = (state: ComponentState, value: string): boolean => {
  if (state.state === 'checked') return true;
  if (state.state === 'unchecked') return false;
  const children = currentCheckboxChildren(state);
  const child = children.find(c => c.value === value);
  if (child && 'checkedWhenMixed' in child) return !!child.checkedWhenMixed;
  return value === 'tomato';
};

export const checkboxComponent = {
  group: 'Selection & input', name: 'Checkbox', factory: 'createCheckbox', variable: 'checkbox',
  description: 'Make a choice, or represent a partial selection. Explore checkbox states, labels, and form behavior.',
  summary: 'Single choices and mixed selections.',
  styles: ['checkbox'],
  scenarios: checkboxScenarios,
  controls: [
    ...section('Appearance', [choose('labelPosition', 'Label position', ['start', 'end'], 'end')]),
    // The m3.material.io checkbox guidelines' parent and children: the label names
    // the parent, the children are the guideline's own. FLO-269.
    // Value names the one standalone box's submitted value; a family's boxes carry
    // their own, so the control waits for a standalone box (`standalone`, derived).
    ...section('Content', [toggle('family', 'Parent and children', true), familySetControl, text('label', 'Label', 'Additions'), text('name', 'Name', 'additions'), { ...text('value', 'Value', 'on'), enabledWhen: 'standalone' }]),
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
