// The extended FAB's playground content: its scenarios and its registry entry, moved
// from src/shared/components.ts.
import type { ExtendedFabConfig } from 'material/components/extended-fab';
import { type ComponentState, type Scenario, bool, choose, disabled, fabPosition, icon, iconMarkup, pick, position, section, string, text, toneControl, toggle } from './types';

/**
 * The extended FAB's scenarios, from m3.material.io (read 7 October 2026). Options name
 * playground controls only. The screen around the pill is not part of it.
 */
const extendedFabScenarios: readonly Scenario[] = [
  {
    id: 'compose', name: 'Compose', source: 'https://m3.material.io/components/extended-fab/guidelines',
    description: 'A wide Compose button with a pencil, for starting a message.',
    options: { text: 'Compose', icon: 'edit', variant: 'tertiary-container' },
  },
  {
    id: 'check-out', name: 'Check out', source: 'https://m3.material.io/components/extended-fab/guidelines',
    description: 'A wide Check out button with a cart, centred, for paying for what is in the basket.',
    options: { text: 'Check out', icon: 'shoppingCart', variant: 'tertiary-container', position: 'center' },
  },
  {
    id: 'publish', name: 'Publish', source: 'https://m3.material.io/components/extended-fab/guidelines',
    description: 'A wide Publish button with an upward arrow, for sending work out.',
    options: { text: 'Publish', icon: 'arrowUpward' },
  },
  {
    id: 'new-task', name: 'New task', source: 'https://m3.material.io/components/extended-fab/guidelines',
    description: 'A wide New task button with a plus, for adding a task.',
    options: { text: 'New task', icon: 'add' },
  },
  {
    id: 'find-flights', name: 'Find flights', source: 'https://m3.material.io/components/extended-fab/guidelines',
    description: 'A wide Find flights button with a plane, centred, for searching trips.',
    options: { text: 'Find flights', icon: 'flight', variant: 'primary', position: 'center' },
  },
  {
    id: 'save-draft', name: 'Save draft', source: 'https://m3.material.io/components/extended-fab/guidelines',
    description: 'A wide Save draft label with no icon, for keeping work that is not finished.',
    options: { text: 'Save draft', icon: 'none' },
  },
];
export const extendedFabComponent = {
  group: 'Actions', name: 'Extended FAB', factory: 'createExtendedFab', variable: 'extendedFab',
  description: 'Give your primary action a little more context. Try labels, icon placement, and a collapsed state.',
  summary: 'A floating action, with room for a label.',
  styles: ['extended-fab'],
  scenarios: extendedFabScenarios,
  controls: [
    ...section('Appearance', [toneControl, choose('size', 'Size', ['small', 'medium', 'large'], 'small'),
      choose('width', 'Width', ['fixed', 'fluid'], 'fixed'), position, toggle('lowered', 'Lowered elevation')]),
    ...section('Content', [icon(['add', 'edit', 'heart', 'download', 'send', 'shoppingCart', 'arrowUpward', 'flight', 'none'], 'edit'), text('text', 'Text', 'Compose'), choose('iconPosition', 'Icon position', ['start', 'end'], 'start')]),
    ...section('Behavior', [toggle('collapsed', 'Collapsed'), disabled]),
  ],
  config: (state: ComponentState): ExtendedFabConfig => {
    const icon = iconMarkup(state);
    return {
      variant: string(state, 'variant'), size: pick(state, 'size', ['small', 'medium', 'large'], 'small'), ...(icon ? { icon } : {}),
      text: string(state, 'text'), ariaLabel: string(state, 'text').trim() || 'Compose', disabled: bool(state, 'disabled'),
      iconPosition: pick(state, 'iconPosition', ['start', 'end'], 'start'), width: pick(state, 'width', ['fixed', 'fluid'], 'fixed'), ...fabPosition(state),
    };
  },
};
