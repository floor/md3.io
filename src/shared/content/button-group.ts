// The button group's playground content: its named item sets and its registry entry.
import type { ButtonGroupConfig } from 'material/components/button-group';
import { sizes, variants } from '../button';
import { type ComponentState, type Scenario, bool, choose, disabled, iconByName, pick, section, shape, size, square, string, toggle } from './types';

const groupItems = [{ value: 'bold', text: 'Bold' }, { value: 'italic', text: 'Italic' }, { value: 'underline', text: 'Underline' }];

interface GroupSet {
  name: string;
  items: readonly { value: string; text: string; selected?: boolean }[];
}

/** Named groups from the saved figures. `default` is not here: Bold, Italic and Underline stay as they were. */
const groupSets: Record<string, GroupSet> = {
  'select-size': {
    name: 'Select size',
    items: [
      { value: '8oz', text: '8oz', selected: true },
      { value: '12oz', text: '12oz' },
      { value: '16oz', text: '16oz' },
    ],
  },
  price: {
    name: 'Price',
    items: [
      { value: '$', text: '$', selected: true },
      { value: '$$', text: '$$', selected: true },
      { value: '$$$', text: '$$$' },
      { value: '$$$$', text: '$$$$' },
    ],
  },
};

const groupSet = (state: ComponentState): GroupSet | undefined => groupSets[string(state, 'groupSet')];

/**
 * The button group's scenarios, from m3.material.io (read 7 October 2026). Options name
 * playground controls only. Add to cart, and the Sort by group, are not this component.
 */
const buttonGroupScenarios: readonly Scenario[] = [
  {
    id: 'select-size', name: 'Select size', source: 'https://m3.material.io/components/button-groups/guidelines',
    description: 'A connected group: 8oz selected, 12oz, 16oz.',
    options: { groupSet: 'select-size', kind: 'connected', selection: 'single' },
  },
  {
    id: 'price', name: 'Price', source: 'https://m3.material.io/components/button-groups/guidelines',
    description: 'A connected group: $ and $$ selected, $$$, $$$$.',
    options: { groupSet: 'price', kind: 'connected', selection: 'multi' },
  },
];

const itemsControl = {
  ...choose('groupSet', 'Items', ['default', 'select-size', 'price'], 'default', 'select'),
  labels: { default: 'Default', 'select-size': 'Select size', price: 'Price' },
};

export const buttonGroupComponent = {
  group: 'Actions', name: 'Button group', factory: 'createButtonGroup', variable: 'buttonGroup',
  description: 'Bring related actions together. Explore connected shapes and single or multiple selection.',
  summary: 'Related actions. Shared shapes. Flexible selection.',
  styles: ['progress', 'button', 'icon-button', 'button-group'],
  scenarios: buttonGroupScenarios,
  controls: [
    ...section('Appearance', [choose('kind', 'Kind', ['standard', 'connected'], 'connected'), choose('variant', 'Variant', variants, 'filled', 'select'), size, square]),
    ...section('Layout', [choose('orientation', 'Orientation', ['horizontal', 'vertical'], 'horizontal'),
      choose('density', 'Density', ['default', 'comfortable', 'compact'], 'default', 'select'), toggle('equalWidth', 'Equal widths')]),
    ...section('Content', [itemsControl,
      { ...choose('content', 'Content', ['text', 'icons', 'both'], 'text'), enabledWhen: 'groupDefault' },
      { ...choose('labels', 'Labels', ['always', 'selected'], 'always'), enabledWhen: 'groupDefault' }]),
    ...section('Behavior', [choose('selection', 'Selection', ['none', 'single', 'multi'], 'none'), toggle('required', 'Require a selection'), disabled]),
  ],
  config: (state: ComponentState): ButtonGroupConfig => {
    const set = groupSet(state);
    return {
      kind: pick(state, 'kind', ['standard', 'connected'], 'standard'), selection: pick(state, 'selection', ['none', 'single', 'multi'], 'none'),
      variant: pick(state, 'variant', variants, 'outlined'), size: pick(state, 'size', sizes, 's'), shape: shape(state),
      orientation: pick(state, 'orientation', ['horizontal', 'vertical'], 'horizontal'), density: pick(state, 'density', ['default', 'comfortable', 'compact'], 'default'),
      labels: pick(state, 'labels', ['always', 'selected'], 'always'), required: bool(state, 'required'), equalWidth: bool(state, 'equalWidth'), disabled: bool(state, 'disabled'),
      ariaLabel: set ? set.name : 'Text formatting',
      buttons: set
        ? set.items.map(item => ({ value: item.value, text: item.text, ariaLabel: item.text, ...(item.selected ? { selected: true } : {}) }))
        : groupItems.map(item => ({ value: item.value, ariaLabel: item.text,
          ...(state.content !== 'icons' ? { text: item.text } : {}), ...(state.content !== 'text' ? { icon: iconByName(item.value) } : {}),
        })),
    };
  },
};
