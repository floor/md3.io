// The chips' playground content: its named chip sets and its registry entry, moved
// from src/shared/components.ts.
import type { ChipsConfig } from 'material/components/chips';
import { symbols } from '../icons';
import { type ComponentState, type Control, type Scenario, bool, choose, disabled, iconByName, pick, section, string, text, toggle } from './types';

export interface ChipItemData {
  value: string;
  label: string;
  type?: 'assist' | 'filter' | 'input' | 'suggestion';
  selected?: boolean;
  avatar?: string;
  leadingIcon?: string;
}

export interface ChipSetDefinition {
  name: string;
  label: string;
  type: 'assist' | 'filter' | 'input' | 'suggestion';
  chips: readonly ChipItemData[];
}

export const chipSets: Record<string, ChipSetDefinition> = {
  'email-recipients': {
    name: 'Email recipients',
    label: 'To',
    type: 'input',
    chips: [
      { value: 'ziad', label: 'Ziad Aouad', type: 'input', avatar: symbols.accountCircle },
      { value: 'mohammad', label: 'Mohammad', type: 'input', avatar: symbols.accountCircle },
    ],
  },
  'experience-actions': {
    name: 'Experience actions',
    label: 'Add to review',
    type: 'assist',
    chips: [
      { value: 'photos', label: 'Add photos', type: 'assist', leadingIcon: symbols.addAPhoto },
      { value: 'dishes', label: 'Add dishes', type: 'assist', leadingIcon: symbols.restaurant },
      { value: 'rate', label: 'Rate location', type: 'assist', leadingIcon: symbols.star },
    ],
  },
  'quick-replies': {
    name: 'Quick replies',
    label: 'Suggested replies',
    type: 'suggestion',
    chips: [
      { value: 'agree', label: 'I agree', type: 'suggestion' },
      { value: 'looks-good', label: 'Looks good to me', type: 'suggestion' },
      { value: 'thank-you', label: 'Thank you', type: 'suggestion' },
    ],
  },
  'category-filters': {
    name: 'Category filters',
    label: 'Category',
    type: 'filter',
    chips: [
      { value: 'apartment', label: 'Apartment', type: 'filter' },
      { value: 'accessories', label: 'Accessories', type: 'filter' },
      { value: 'tops', label: 'Tops', type: 'filter', selected: true },
      { value: 'shoes', label: 'Shoes', type: 'filter' },
    ],
  },
};
chipSets['catalog-filters'] = chipSets['category-filters'];

const defaultChipSet: ChipSetDefinition = {
  name: 'Default',
  label: 'Interests',
  type: 'filter',
  chips: [
    { value: 'hiking', label: 'Hiking', type: 'filter', selected: true },
    { value: 'music', label: 'Music', type: 'filter', selected: false },
    { value: 'food', label: 'Food', type: 'filter', selected: false },
  ],
};

const chipSetControl: Control = {
  ...choose('chipSet', 'Chip set', ['default', 'email-recipients', 'experience-actions', 'quick-replies', 'category-filters'], 'default', 'select'),
  labels: { default: 'Default', ...Object.fromEntries(Object.entries(chipSets).map(([id, set]) => [id, set.name])) },
};

/**
 * The chips' scenarios, from m3.material.io (read 5 October 2026). Options name
 * playground controls only. Named chip sets provide authentic situations for each
 * chip variant: contact input chips with avatars and remove buttons, assist chips
 * with action icons, quick replies for chat suggestions, and catalog filter chips
 * with active multi-selection.
 */
const chipsScenarios: readonly Scenario[] = [
  {
    id: 'email-recipients', name: 'Email recipients', source: 'https://m3.material.io/components/chips/guidelines',
    description: 'Addressing an email draft with recipient contact chips showing avatars and remove buttons.',
    options: { chipSet: 'email-recipients', type: 'input', label: 'To' },
  },
  {
    id: 'experience-actions', name: 'Experience actions', source: 'https://m3.material.io/components/chips/guidelines',
    description: 'Prompting follow-up actions (Add photos, Add dishes, Rate location) on a restaurant review.',
    options: { chipSet: 'experience-actions', type: 'assist', label: 'Add to review' },
  },
  {
    id: 'quick-replies', name: 'Quick replies', source: 'https://m3.material.io/components/chips/guidelines',
    description: 'Prompting one-tap conversational response phrases below an incoming message.',
    options: { chipSet: 'quick-replies', type: 'suggestion', label: 'Suggested replies' },
  },
  {
    id: 'catalog-filters', name: 'Category filters', source: 'https://m3.material.io/components/chips/guidelines',
    description: 'Filtering a catalog by department in a filter results sheet, with Tops selected.',
    options: { chipSet: 'category-filters', type: 'filter', label: 'Category', multiSelect: true },
  },
];
export const chipsComponent = {
  group: 'Selection & input', name: 'Chips', factory: 'createChips', variable: 'chips',
  description: 'Explore compact choices and actions. Try the four chip types, elevation, icons and avatars, and single or multiple selection.',
  summary: 'Compact choices, filters, and actions.', styles: ['chips'],
  scenarios: chipsScenarios,
  controls: [
    // The four M3 chip types. Elevation is for assist, filter and suggestion chips; an
    // avatar for input chips; selection for filter and input chips.
    ...section('Appearance', [choose('type', 'Type', ['assist', 'filter', 'input', 'suggestion'], 'filter', 'select'), toggle('elevated', 'Elevated', false, 'elevatedAllowed'), toggle('vertical', 'Vertical layout'), toggle('icons', 'Leading icons'), toggle('avatar', 'Avatar', false, 'inputType'), toggle('trailingMenu', 'Trailing menu', false, 'filterType'), toggle('draggable', 'Draggable')]),
    ...section('Content', [chipSetControl, text('label', 'Group label', 'Interests')]),
    ...section('Behavior', [toggle('multiSelect', 'Multiple selection', true, 'selectable'), toggle('selectionRequired', 'Selection required', false, 'selectable'), disabled]),
  ],
  config: (state: ComponentState): ChipsConfig => {
    const set = chipSets[string(state, 'chipSet')] ?? defaultChipSet;
    const isDefault = set === defaultChipSet;
    let singleSelectedSeen = false;
    return {
      label: string(state, 'label') || set.label,
      vertical: bool(state, 'vertical'),
      multiSelect: bool(state, 'multiSelect'),
      selectionRequired: bool(state, 'selectionRequired'),
      chips: set.chips.map(chip => {
        let isSelected = typeof state.selectedChips === 'string'
          ? state.selectedChips === '__none__'
            ? false
            : state.selectedChips.split(',').filter(Boolean).includes(chip.value)
          : chip.selected === true;
        if (!bool(state, 'multiSelect')) {
          if (isSelected && !singleSelectedSeen) {
            singleSelectedSeen = true;
          } else {
            isSelected = false;
          }
        }
        return {
          ...chip,
          type: pick(state, 'type', ['assist', 'filter', 'input', 'suggestion'], set.type),
          ...(state.elevatedAllowed && bool(state, 'elevated') ? { elevated: true } : {}),
          ...(state.selectable ? { selected: isSelected } : {}),
          disabled: bool(state, 'disabled'),
          ...(state.filterType && bool(state, 'trailingMenu') ? { trailingMenu: true } : {}),
          ...(isDefault && state.inputType && bool(state, 'avatar') ? { avatar: symbols.accountCircle } : {}),
          ...(isDefault && bool(state, 'icons') ? { leadingIcon: iconByName('heart') } : {}),
        };
      }),
    };
  },
};
