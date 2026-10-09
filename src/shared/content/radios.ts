// The radio buttons' playground content: its named option sets and its registry
// entry, moved from src/shared/components.ts.
import type { RadiosConfig } from 'material/components/radios';
import { type ComponentState, type Control, type Scenario, bool, choose, disabled, pick, section, string, text, toggle } from './types';

export interface RadioOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface RadioOptionSet {
  readonly name: string;
  readonly groupName: string;
  readonly ariaLabel: string;
  readonly defaultValue: string;
  readonly options: readonly RadioOption[];
}

export const radioOptionSets: Record<string, RadioOptionSet> = {
  'express-delivery': {
    name: 'Express delivery',
    groupName: 'delivery',
    ariaLabel: 'Delivery method',
    defaultValue: 'express',
    options: [
      { value: 'standard', label: 'Standard' },
      { value: 'express', label: 'Express' },
      { value: 'pickup', label: 'Pick up' },
    ],
  },
  'catalog-sort': {
    name: 'Catalog sort',
    groupName: 'sort',
    ariaLabel: 'Sort by',
    defaultValue: 'relevance',
    options: [
      { value: 'relevance', label: 'Relevance' },
      { value: 'lowest-price', label: 'Lowest price' },
      { value: 'highest-rating', label: 'Highest rating' },
      { value: 'most-reviewed', label: 'Most reviewed' },
    ],
  },
  'phone-ringtone': {
    name: 'Phone ringtone',
    groupName: 'ringtone',
    ariaLabel: 'Ringtone',
    defaultValue: 'callisto',
    options: [
      { value: 'none', label: 'None' },
      { value: 'callisto', label: 'Callisto' },
      { value: 'ganymede', label: 'Ganymede' },
      { value: 'luna', label: 'Luna' },
    ],
  },
  'app-language': {
    name: 'App language',
    groupName: 'language',
    ariaLabel: 'Language',
    defaultValue: 'en',
    options: [
      { value: 'en', label: 'English' },
      { value: 'zh', label: 'Chinese (Mandarin)' },
      { value: 'es', label: 'Spanish' },
    ],
  },
  // The settings figure in the guidelines (read 8 October 2026): two radios for
  // "Allow notifications" / "Turn off notifications" beside multi-select checkboxes.
  'notifications': {
    name: 'Notifications',
    groupName: 'notifications',
    ariaLabel: 'Notifications',
    defaultValue: 'allow',
    options: [
      { value: 'allow', label: 'Allow notifications' },
      { value: 'off', label: 'Turn off notifications' },
    ],
  },
};
radioOptionSets['delivery'] = radioOptionSets['express-delivery'];

export const radioAriaLabel = (state: ComponentState): string => {
  const set = radioOptionSets[string(state, 'optionSet')];
  return set ? set.ariaLabel : 'Delivery method';
};

const optionSetControl: Control = {
  ...choose('optionSet', 'Options', ['default', 'express-delivery', 'catalog-sort', 'phone-ringtone', 'app-language', 'notifications'], 'default', 'select'),
  labels: {
    default: 'Default',
    'express-delivery': 'Express delivery',
    'catalog-sort': 'Catalog sort',
    'phone-ringtone': 'Phone ringtone',
    'app-language': 'App language',
    'notifications': 'Notifications',
  },
};

const allRadioValues = [
  'standard', 'express', 'pickup',
  'relevance', 'lowest-price', 'highest-rating', 'most-reviewed',
  'none', 'callisto', 'ganymede', 'luna',
  'en', 'zh', 'es',
  'allow', 'off',
] as const;

const radioValueControl: Control = {
  ...choose('value', 'Selected', allRadioValues, 'standard', 'select'),
  labels: {
    standard: 'Standard', express: 'Express', pickup: 'Pick up',
    relevance: 'Relevance', 'lowest-price': 'Lowest price', 'highest-rating': 'Highest rating', 'most-reviewed': 'Most reviewed',
    none: 'None', callisto: 'Callisto', ganymede: 'Ganymede', luna: 'Luna',
    en: 'English', zh: 'Chinese (Mandarin)', es: 'Spanish',
    allow: 'Allow notifications', off: 'Turn off notifications',
  },
};

/**
 * The radio buttons' scenarios, from m3.material.io (read 8 October 2026). Options name
 * playground controls only. Radio buttons allow selecting a single option from a set of
 * five or fewer options. One option is always pre-selected across shipping methods,
 * catalog sorting, ringtone selection, language settings, and notification settings.
 * The guidelines' settings figure shows two radios for "Allow notifications" /
 * "Turn off notifications" beside multi-select checkboxes (caption: "Radio buttons are
 * single-select, unlike checkboxes which are multi-select"), and the page directs
 * "Radio buttons should be vertically listed and have one option always selected"
 * (caution figure: "Avoid using horizontal radio button lists") — so the notifications
 * group is vertical.
 */
const radiosScenarios: readonly Scenario[] = [
  {
    id: 'express-delivery', name: 'Express delivery', source: 'https://m3.material.io/components/radio-button/guidelines',
    description: 'Selecting shipping speed in a checkout form with expedited delivery chosen.',
    options: { optionSet: 'express-delivery', value: 'express', name: 'delivery' },
  },
  {
    id: 'catalog-sort', name: 'Catalog sort', source: 'https://m3.material.io/components/radio-button/guidelines',
    description: 'Choosing how search results or catalog listings are ordered, with Relevance selected.',
    options: { optionSet: 'catalog-sort', value: 'relevance', name: 'sort' },
  },
  {
    id: 'phone-ringtone', name: 'Phone ringtone', source: 'https://m3.material.io/components/radio-button/guidelines',
    description: 'Selecting an incoming call chime from a list of audio ringtones.',
    options: { optionSet: 'phone-ringtone', value: 'callisto', name: 'ringtone' },
  },
  {
    id: 'app-language', name: 'App language', source: 'https://m3.material.io/components/radio-button/guidelines',
    description: 'Choosing interface display language from supported system locales.',
    options: { optionSet: 'app-language', value: 'en', name: 'language' },
  },
  {
    id: 'notifications', name: 'Notifications', source: 'https://m3.material.io/components/radio-button/guidelines',
    description: 'Turning app notifications on or off in settings; the two choices read as full phrases, so the group is listed vertically with Allow notifications pre-selected.',
    options: { optionSet: 'notifications', value: 'allow', name: 'notifications', direction: 'vertical' },
  },
];

export const radiosComponent = {
  group: 'Selection & input', name: 'Radio buttons', factory: 'createRadios', variable: 'radios',
  description: 'Choose one option from a set. Explore orientation, label placement, and disabled options.',
  summary: 'One choice from a related set.', styles: ['radios'],
  scenarios: radiosScenarios,
  controls: [
    ...section('Layout', [choose('direction', 'Direction', ['vertical', 'horizontal'], 'vertical'), toggle('labelBefore', 'Labels before')]),
    ...section('Content', [optionSetControl, text('name', 'Name', 'delivery'), radioValueControl]),
    ...section('Behavior', [toggle('disableExpress', 'Disable an option', false, 'isDelivery'), disabled]),
  ],
  config: (state: ComponentState): RadiosConfig => {
    const set = radioOptionSets[string(state, 'optionSet')];
    const name = string(state, 'name') || (set ? set.groupName : 'delivery');
    const isDelivery = !set || set.groupName === 'delivery';
    const rawOptions = set
      ? set.options.map(option => ({
          ...option,
          ...(isDelivery && option.value === 'express' && bool(state, 'disableExpress') ? { disabled: true } : {}),
        }))
      : [
          { value: 'standard', label: 'Standard' },
          { value: 'express', label: 'Express', disabled: bool(state, 'disableExpress') },
          { value: 'pickup', label: 'Pick up' },
        ];
    const defaultValue = set ? set.defaultValue : 'standard';
    let value = string(state, 'value') || defaultValue;
    if (isDelivery && bool(state, 'disableExpress') && value === 'express') value = 'standard';
    return {
      name,
      direction: pick(state, 'direction', ['vertical', 'horizontal'], 'vertical'),
      value,
      disabled: bool(state, 'disabled'),
      options: rawOptions.map(option => ({ ...option, labelBefore: bool(state, 'labelBefore') })),
    };
  },
};
