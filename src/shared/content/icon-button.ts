// The icon button's playground content: its scenarios and its registry entry, moved
// from src/shared/components.ts.
import type { IconButtonConfig } from 'material/components/icon-button';
import { type ComponentState, type Scenario, bool, choose, disabled, icon, iconMarkup, section, shape, size, square, string, text, toggle } from './types';

/**
 * The icon button's scenarios, from m3.material.io (read 5 October 2026). Options name
 * playground controls only. The element takes `toggle` and `selected` as attributes, so
 * the toggle scenarios' snippets match the factory's.
 */
const iconButtonScenarios: readonly Scenario[] = [
  {
    id: 'favorite', name: 'Favorite', source: 'https://m3.material.io/components/icon-buttons/guidelines',
    description: 'A toggle button for a binary action, shown selected.',
    options: { toggle: true, selected: true, icon: 'heart' },
  },
  {
    id: 'bookmark', name: 'Bookmark', source: 'https://m3.material.io/components/icon-buttons/guidelines',
    description: 'A toggle button shown unselected; the outlined icon fills when selected.',
    options: { toggle: true, icon: 'bookmark', ariaLabel: 'Bookmark' },
  },
  {
    id: 'download', name: 'Download', source: 'https://m3.material.io/components/icon-buttons/guidelines',
    description: 'A filled button for a high emphasis action, like downloading.',
    options: { variant: 'filled', icon: 'download', ariaLabel: 'Download' },
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
    ...section('Content', [icon(['heart', 'bookmark', 'download', 'send', 'add', 'edit'], 'heart'), text('ariaLabel', 'Accessible label', 'Add to favorites')]),
    ...section('Behavior', [toggle('toggle', 'Toggle button'), toggle('selected', 'Selected', false, 'toggle'), disabled]),
  ],
  config: (state: ComponentState): IconButtonConfig => ({
    variant: string(state, 'variant'), size: string(state, 'size'), shape: shape(state), width: string(state, 'width'),
    icon: iconMarkup(state), ariaLabel: string(state, 'ariaLabel').trim() || 'Add to favorites',
    toggle: bool(state, 'toggle'), selected: bool(state, 'toggle') && bool(state, 'selected'), disabled: bool(state, 'disabled'),
  }),
};
