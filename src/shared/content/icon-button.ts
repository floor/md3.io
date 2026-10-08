// The icon button's playground content: its scenarios and its registry entry, moved
// from src/shared/components.ts.
import type { IconButtonConfig } from 'material/components/icon-button';
import { type ComponentState, type Scenario, bool, choose, disabled, icon, iconMarkup, section, shape, size, square, string, text, toggle } from './types';

/**
 * The icon button's scenarios, from m3.material.io (read 7 October 2026). Options name
 * playground controls only. Each row is the button the figure draws; the screen around
 * it is not. Accessible names are not drawn.
 */
const iconButtonScenarios: readonly Scenario[] = [
  {
    id: 'favorite', name: 'Favorite', source: 'https://m3.material.io/components/icon-buttons/guidelines',
    description: 'An outlined heart for marking a favorite, left unselected until someone chooses it.',
    options: { variant: 'standard', icon: 'heart', toggle: false, selected: false, ariaLabel: 'Favorite' },
  },
  {
    id: 'reservation-date', name: 'Reservation date', source: 'https://m3.material.io/components/icon-buttons/guidelines',
    description: 'A tonal calendar button for choosing the date of a reservation.',
    options: { variant: 'tonal', icon: 'calendarToday', toggle: false, selected: false, ariaLabel: 'Choose a date' },
  },
  {
    id: 'browse-albums', name: 'Browse albums', source: 'https://m3.material.io/components/icon-buttons/guidelines',
    description: 'An outlined chevron for moving on to the next albums.',
    options: { variant: 'outlined', icon: 'chevronRight', toggle: false, selected: false, ariaLabel: 'More albums' },
  },
  {
    id: 'raise-hand', name: 'Raise hand', source: 'https://m3.material.io/components/icon-buttons/guidelines',
    description: 'A tonal raised hand for asking to speak.',
    options: { variant: 'tonal', icon: 'frontHand', toggle: false, selected: false, ariaLabel: 'Raise hand' },
  },
  {
    id: 'stop-timer', name: 'Stop', source: 'https://m3.material.io/components/icon-buttons/guidelines',
    description: 'A large filled square for stopping a timer.',
    options: { variant: 'filled', size: 'l', icon: 'stop', toggle: false, selected: false, ariaLabel: 'Stop' },
  },
];
export const iconButtonComponent = {
  group: 'Actions', name: 'Icon button', factory: 'createIconButton', variable: 'iconButton',
  description: 'A compact action with room for expression. Try its shape, width, and toggle state.',
  summary: 'Compact actions, with a shape for every state.',
  styles: ['icon-button'],
  scenarios: iconButtonScenarios,
  controls: [
    ...section('Appearance', [choose('variant', 'Variant', ['standard', 'filled', 'tonal', 'outlined'], 'standard', 'select'), size, square,
      choose('width', 'Width', ['narrow', 'default', 'wide'], 'default')]),
    ...section('Content', [icon(['heart', 'bookmark', 'download', 'send', 'add', 'edit', 'calendarToday', 'chevronRight', 'frontHand', 'stop'], 'heart'), text('ariaLabel', 'Accessible label', 'Add to favorites')]),
    ...section('Behavior', [toggle('toggle', 'Toggle button'), toggle('selected', 'Selected', false, 'toggle'), disabled]),
  ],
  config: (state: ComponentState): IconButtonConfig => ({
    variant: string(state, 'variant'), size: string(state, 'size'), shape: shape(state), width: string(state, 'width'),
    icon: iconMarkup(state), ariaLabel: string(state, 'ariaLabel').trim() || 'Add to favorites',
    toggle: bool(state, 'toggle'), selected: bool(state, 'toggle') && bool(state, 'selected'), disabled: bool(state, 'disabled'),
  }),
};
