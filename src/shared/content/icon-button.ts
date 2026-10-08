// The icon button's playground content: its scenarios and its registry entry, moved
// from src/shared/components.ts.
import type { IconButtonConfig } from 'material/components/icon-button';
import { symbols } from '../icons';
import { type ComponentState, type Scenario, bool, choose, disabled, icon, iconMarkup, section, shape, size, square, string, text, toggle } from './types';

/**
 * The icon button's scenarios, from m3.material.io (read 8 October 2026,
 * page JSON 71391cd0-92f8-4a8e-a625-828f5413a221). Options name playground controls
 * only. Each row is the button the figure draws; the screen around it is not.
 *
 * Sizes are the figures' own scale, re-read the same day. The restaurant hearts,
 * the reservation calendar, the album chevrons and the raised hand are the default
 * small size. Only the timer's stop is large. The guidelines name that use:
 * "Use different button colors and sizes to provide visual hierarchy and emphasize
 * primary actions."
 *
 * Favorite is the page's toggle, shown unselected as the restaurant figure draws it.
 * "Toggle icon buttons allow a single choice to be selected or deselected, such as
 * adding or removing something from favorites." Selecting it fills the heart:
 * "When making a selection, such as bookmarking or saving a video, the icon
 * transitions from outlined (unselected) to filled (selected)."
 */
const iconButtonScenarios: readonly Scenario[] = [
  {
    id: 'favorite', name: 'Favorite', source: 'https://m3.material.io/components/icon-buttons/guidelines',
    description: 'A heart for marking a restaurant a favorite: outlined until someone chooses it, and filled once they have.',
    options: { variant: 'standard', icon: 'heart', toggle: true, selected: false, ariaLabel: 'Favorite' },
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
  config: (state: ComponentState): IconButtonConfig => {
    const toggling = bool(state, 'toggle');
    const heart = string(state, 'icon') === 'heart';
    return {
      variant: string(state, 'variant'), size: string(state, 'size'), shape: shape(state), width: string(state, 'width'),
      icon: iconMarkup(state), ariaLabel: string(state, 'ariaLabel').trim() || 'Add to favorites',
      // The filled heart is the selected glyph the guidelines require. Other icons
      // in the chooser have no filled pair on this page, so they stay as drawn.
      ...(toggling && heart ? { selectedIcon: symbols.heartFill } : {}),
      toggle: toggling, selected: toggling && bool(state, 'selected'), disabled: bool(state, 'disabled'),
    };
  },
};
