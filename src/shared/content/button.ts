// The button's playground content: its scenarios and its registry entry, moved from
// src/shared/components.ts.
import { buttonConfig, icons as buttonIcons, normalizeState, variants } from '../button';
import { type ComponentState, type Scenario, choose, disabled, icon, section, shape, size, square, text, toggle } from './types';

/**
 * The button's scenarios, from m3.material.io (read 3 October 2026). Options name
 * playground controls only. Favorite uses the factory's `toggle` and `selected`;
 * the element has no toggle attribute, so the element snippet cannot select it,
 * and the description says so.
 */
const buttonScenarios: readonly Scenario[] = [
  {
    id: 'save', name: 'Save', source: 'https://m3.material.io/components/buttons/guidelines',
    description: 'A filled button for an important, final action, like Save.',
    options: { variant: 'filled', text: 'Save', icon: 'none' },
  },
  {
    id: 'download', name: 'Download', source: 'https://m3.material.io/components/buttons/guidelines',
    description: 'A filled button with a leading icon before the label.',
    options: { variant: 'filled', text: 'Download', icon: 'download' },
  },
  {
    id: 'secondary', name: 'Secondary', source: 'https://m3.material.io/components/buttons/guidelines',
    description: 'An outlined button for an alternative, secondary action.',
    options: { variant: 'outlined', text: 'Next movie', icon: 'none' },
  },
  {
    id: 'cancel', name: 'Cancel', source: 'https://m3.material.io/components/buttons/guidelines',
    description: 'A text button for the lowest-priority action.',
    options: { variant: 'text', text: 'Cancel', icon: 'none' },
  },
  {
    id: 'favorite', name: 'Favorite', source: 'https://m3.material.io/components/buttons/guidelines',
    description: 'A toggle button for a binary selection, shown selected. The element has no toggle attribute, so its snippet cannot select it.',
    options: { variant: 'filled', text: 'Favorite', icon: 'heart', toggle: true, selected: true },
  },
  {
    id: 'large', name: 'Large', source: 'https://m3.material.io/components/buttons/overview',
    description: 'A leading icon and a label at the large size.',
    options: { variant: 'filled', size: 'l', text: 'Download', icon: 'download' },
  },
];
export const buttonComponent = {
  group: 'Actions', name: 'Button', factory: 'createButton', variable: 'button',
  description: 'One action, many expressions. Find the right fit for yours.',
  summary: 'Five variants. Five sizes. Your next action.',
  styles: ['progress', 'button'],
  scenarios: buttonScenarios,
  controls: [
    ...section('Appearance', [choose('variant', 'Variant', variants, 'filled', 'select'), size, square]),
    ...section('Content', [icon(Object.keys(buttonIcons), 'none'), text('text', 'Text', 'Button')]),
    ...section('Behavior', [toggle('toggle', 'Toggle button', false, 'toggleAllowed'), toggle('selected', 'Selected', false, 'toggle'), disabled]),
  ],
  config: (state: ComponentState) => buttonConfig(normalizeState({ ...state, shape: shape(state) })),
};
