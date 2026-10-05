// The chips' playground content: its scenarios and its registry entry, moved from
// src/shared/components.ts.
import type { ChipsConfig } from 'material/components/chips';
import { symbols } from '../icons';
import { type ComponentState, type Scenario, bool, choose, disabled, iconByName, pick, section, string, text, toggle } from './types';

/**
 * The chips' scenarios, from m3.material.io (read 5 October 2026). Labels stay Hiking, Music
 * and Food (fixed in `config()`); options name playground controls only. Filters select two
 * chips — "Multiple chips can be selected or unselected".
 */
const chipsScenarios: readonly Scenario[] = [
  {
    id: 'filters', name: 'Filters', source: 'https://m3.material.io/components/chips/guidelines',
    description: 'Filter chips with several selected.',
    options: { type: 'filter', multiSelect: true, hiking: true, music: true, food: false },
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
    ...section('Content', [text('label', 'Group label', 'Interests')]),
    ...section('Behavior', [toggle('multiSelect', 'Multiple selection', true, 'selectable'), toggle('selectionRequired', 'Selection required', false, 'selectable'), toggle('hiking', 'Hiking selected', true, 'selectable'), toggle('music', 'Music selected', false, 'selectable'), toggle('food', 'Food selected', false, 'selectable'), disabled]),
  ],
  config: (state: ComponentState): ChipsConfig => ({ label: string(state, 'label'), vertical: bool(state, 'vertical'), multiSelect: bool(state, 'multiSelect'), selectionRequired: bool(state, 'selectionRequired'),
    chips: ['hiking', 'music', 'food'].map((value, index) => ({ value, label: ['Hiking', 'Music', 'Food'][index], type: pick(state, 'type', ['assist', 'filter', 'input', 'suggestion'], 'filter'),
      ...(state.elevatedAllowed && bool(state, 'elevated') ? { elevated: true } : {}),
      ...(state.selectable ? { selected: bool(state, value) } : {}), disabled: bool(state, 'disabled'),
      ...(state.filterType && bool(state, 'trailingMenu') ? { trailingMenu: true } : {}),
      ...(state.inputType && bool(state, 'avatar') ? { avatar: symbols.accountCircle } : bool(state, 'icons') ? { leadingIcon: iconByName('heart') } : {}) })) }),
};
