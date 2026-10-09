// The FAB's playground content: its scenarios and its registry entry, moved from
// src/shared/components.ts.
import type { FabConfig } from 'material/components/fab';
import { type ComponentState, type Scenario, bool, choose, disabled, fabPosition, icon, iconMarkup, position, section, string, text, toneControl, toggle } from './types';

/**
 * The FAB's scenarios, from m3.material.io (read 9 October 2026, guidelines page JSON).
 * Options name playground controls only. The default picture stays the add icon.
 *
 * Sizes the page still names, in its own list: FAB, Medium FAB (most recommended),
 * Large FAB. "The medium FAB is recommended for most situations". "A large FAB is
 * useful in any window size when the layout calls for a clear and prominent primary
 * action". "Use a medium FAB for mobile layouts, and large FAB for tablets and large
 * screens." "In expanded breakpoints, consider placing the FAB in the upper left
 * corner, like in the navigation rail."
 *
 * "The small FAB is no longer recommended." The library's FabSize is "default" |
 * "medium" | "large", so there is no small scenario.
 *
 * Colour: the inbox pencil is the primary container (the soft container the email
 * figures use). The expressive update "Added tone color styles: Primary Secondary
 * Tertiary". The primary tone is the one that stays distinct when a pale container
 * would sit on a similar surface: "The container must have sufficient color contrast
 * with the surface it's placed on." Secondary and tertiary are named styles with no
 * separate job on the page, so they stay on the Color control.
 */
const fabScenarios: readonly Scenario[] = [
  {
    id: 'compose', name: 'Compose', source: 'https://m3.material.io/components/floating-action-button/guidelines',
    description: 'A medium pencil for starting a message, the size for most windows, at the lower right of an inbox.',
    options: { icon: 'edit', ariaLabel: 'Compose', size: 'medium', variant: 'primary-container', position: 'bottom-right' },
  },
  {
    id: 'create', name: 'Create', source: 'https://m3.material.io/components/floating-action-button/guidelines',
    description: 'A large add button at the upper left of a wide screen, the size for large windows, where the primary action is one of the first things people see.',
    options: { icon: 'add', ariaLabel: 'Create', size: 'large', variant: 'primary-container', position: 'top-left' },
  },
  {
    id: 'add', name: 'Add', source: 'https://m3.material.io/components/floating-action-button/guidelines',
    description: 'An add button in the primary tone at the lower right, so the container stays distinct from the surface behind it.',
    options: { icon: 'add', ariaLabel: 'Add', size: 'default', variant: 'primary', position: 'bottom-right' },
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
