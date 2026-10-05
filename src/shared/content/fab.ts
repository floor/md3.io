// The FAB's playground content: its scenarios and its registry entry, moved from
// src/shared/components.ts.
import type { FabConfig } from 'material/components/fab';
import { type ComponentState, type Scenario, bool, choose, disabled, fabPosition, icon, iconMarkup, position, section, string, text, toneControl, toggle } from './types';

/**
 * The FAB's scenarios, from m3.material.io (read 5 October 2026). Options name playground
 * controls only.
 */
const fabScenarios: readonly Scenario[] = [
  {
    id: 'create', name: 'Create', source: 'https://m3.material.io/components/floating-action-button/guidelines',
    description: 'The most important action on the screen, with a clear add icon.',
    options: { ariaLabel: 'Create' },
  },
  {
    id: 'edit', name: 'Edit', source: 'https://m3.material.io/components/floating-action-button/guidelines',
    description: 'An edit action; the guidelines name the edit icon as clear and simple.',
    options: { icon: 'edit', ariaLabel: 'Edit' },
  },
  {
    id: 'favorite', name: 'Favorite', source: 'https://m3.material.io/components/floating-action-button/guidelines',
    description: 'A constructive Favorite action, one the guidelines name.',
    options: { icon: 'heart', ariaLabel: 'Favorite' },
  },
];
export const fabComponent = {
  group: 'Actions', name: 'FAB', factory: 'createFab', variable: 'fab',
  description: 'Give your primary action a place to stand out. Explore color, size, and floating positions.',
  summary: 'A floating action with a clear purpose.',
  styles: ['fab'],
  scenarios: fabScenarios,
  controls: [
    ...section('Appearance', [toneControl, choose('size', 'Size', ['default', 'medium', 'large'], 'default', 'select'),
      position, toggle('lowered', 'Lowered elevation')]),
    ...section('Content', [icon(['add', 'edit', 'heart', 'download', 'send'], 'add'), text('ariaLabel', 'Accessible label', 'Create new item')]),
    ...section('Behavior', [disabled]),
  ],
  config: (state: ComponentState): FabConfig => ({ variant: string(state, 'variant'), size: string(state, 'size'), icon: iconMarkup(state),
    ariaLabel: string(state, 'ariaLabel').trim() || 'Create new item', disabled: bool(state, 'disabled'), ...fabPosition(state) }),
};
