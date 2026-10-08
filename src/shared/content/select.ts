// The select's playground content: its named content sets and its registry entry.
import type { SelectConfig } from 'material/components/select';
import { type ComponentState, type Scenario, bool, choose, disabled, pick, section, string, text, toggle } from './types';

/**
 * A named select: the field and the options the guidelines figure shows.
 * `default` is not here: today's fruit field stays exactly as it was.
 */
interface SelectSet {
  name: string;
  label: string;
  value: string;
  options: NonNullable<SelectConfig['options']>;
}

/**
 * Named selects from m3.material.io/components/menus (state read 7 October 2026;
 * diet read 8 October 2026, the single-select half of figure mhkpbo8d-30, "Menus
 * can be single- or multi-select"; its multi-select half needs more than one
 * `value` id, which SelectConfig does not have).
 * The menu stays closed: `<m-select>` has no `open` attribute
 * (`material/src/elements/select.ts`, the attributes from `variant`) and
 * `SelectConfig` has no `open` field, only `open()` on the component. A
 * selected item also draws its check at the end (`material/src/styles/components/_menu.scss`,
 * `&--selected::after`), which would sit over "AK".
 */
const selectSets: Record<string, SelectSet> = {
  state: {
    name: 'State',
    label: 'State',
    value: 'AK',
    options: [{ id: 'AL', text: 'AL' }, { id: 'AK', text: 'AK' }, { id: 'AZ', text: 'AZ' }],
  },
  diet: {
    name: 'Diet',
    label: 'Diet',
    value: 'Nut-free',
    options: [{ id: 'Gluten-free', text: 'Gluten-free' }, { id: 'Kosher', text: 'Kosher' }, { id: 'Nut-free', text: 'Nut-free' }, { id: 'Vegan', text: 'Vegan' }, { id: 'Vegetarian', text: 'Vegetarian' }],
  },
};

const selectSetControl = {
  ...choose('selectSet', 'Select', ['default', 'state', 'diet'], 'default', 'select'),
  labels: { default: 'Default', state: 'State', diet: 'Diet' },
};

const gated = { enabledWhen: 'selectContentDefault' } as const;

const selectScenarios: readonly Scenario[] = [
  {
    id: 'state', name: 'State', source: 'https://m3.material.io/components/menus/accessibility',
    description: 'A filled State field showing AK.',
    options: { selectSet: 'state', variant: 'filled' },
  },
  {
    id: 'diet', name: 'Dietary options', source: 'https://m3.material.io/components/menus/guidelines',
    description: 'An outlined Diet field showing Nut-free, for picking one dietary requirement.',
    options: { selectSet: 'diet', variant: 'outlined' },
  },
];

export const selectComponent = {
  group: 'Selection & input', name: 'Select', factory: 'createSelect', variable: 'select',
  description: 'Pick an option from a menu. Explore field styles, selection, and validation states.',
  summary: 'A menu of choices in a field.', styles: ['text-field', 'menu', 'select'],
  scenarios: selectScenarios,
  controls: [
    ...section('Appearance', [choose('variant', 'Variant', ['filled', 'outlined'], 'outlined'), choose('density', 'Density', ['default', 'compact'], 'default')]),
    ...section('Content', [selectSetControl, { ...text('label', 'Label', 'Fruit'), ...gated }, { ...choose('value', 'Selected', ['', 'apple', 'banana', 'cherry'], 'apple', 'select'), ...gated }, { ...text('supportingText', 'Supporting text', 'Choose a favorite'), ...gated }]),
    ...section('Behavior', [{ ...toggle('disableBanana', 'Disable banana'), ...gated }, toggle('error', 'Error'), toggle('required', 'Required'), disabled]),
  ],
  config: (state: ComponentState): SelectConfig => {
    const key = string(state, 'selectSet');
    const named = selectSets[key];
    // A named field carries the figure's own label, value and options, and its
    // form name is the set's key. The default stays today's fruit list, its
    // label and selected controls driving it.
    if (named) {
      return {
        variant: pick(state, 'variant', ['filled', 'outlined'], 'outlined'), density: string(state, 'density'),
        label: named.label, value: named.value, error: bool(state, 'error'), required: bool(state, 'required'),
        disabled: bool(state, 'disabled'), name: key, options: named.options,
      };
    }
    return { variant: string(state, 'variant'), density: string(state, 'density'), label: string(state, 'label'), value: string(state, 'value'),
      supportingText: string(state, 'supportingText'), error: bool(state, 'error'), required: bool(state, 'required'), disabled: bool(state, 'disabled'), name: 'fruit',
      options: [{ id: 'apple', text: 'Apple' }, { id: 'banana', text: 'Banana', disabled: bool(state, 'disableBanana') }, { id: 'cherry', text: 'Cherry' }] };
  },
};
