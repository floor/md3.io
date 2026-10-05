// The split button's playground content: its scenarios and its registry entry, moved
// from src/shared/components.ts.
import type { SplitButtonConfig } from 'material/components/split-button';
import { icons as buttonIcons, sizes } from '../button';
import { type ComponentState, type Scenario, bool, choose, disabled, icon, iconMarkup, pick, section, size, string, text } from './types';

/**
 * The split button's scenarios, from m3.material.io (read 5 October 2026). Options name
 * playground controls only; the menus stay the playground's save and share sets.
 */
const splitButtonScenarios: readonly Scenario[] = [
  {
    id: 'share', name: 'Share', source: 'https://m3.material.io/components/split-button/overview',
    description: 'An action with a menu of related actions: share, with link, email, and export.',
    options: { text: 'Share', icon: 'send', menu: 'share', trailingLabel: 'More share options' },
  },
];
export const splitButtonComponent = {
  group: 'Actions', name: 'Split button', factory: 'createSplitButton', variable: 'splitButton',
  description: 'A primary action and more possibilities. Open the trailing menu to try the alternatives.',
  summary: 'One primary action, with more options close by.',
  styles: ['menu', 'progress', 'button', 'split-button'],
  scenarios: splitButtonScenarios,
  controls: [
    ...section('Appearance', [choose('variant', 'Variant', ['filled', 'tonal', 'outlined', 'elevated'], 'filled', 'select'), size]),
    ...section('Content', [icon(Object.keys(buttonIcons), 'none'), text('text', 'Text', 'Save'), text('trailingLabel', 'Menu label', 'More save options'),
      choose('menu', 'Menu options', ['save', 'share'], 'save')]),
    ...section('Behavior', [disabled]),
  ],
  config: (state: ComponentState): SplitButtonConfig => ({
    variant: pick(state, 'variant', ['filled', 'tonal', 'outlined', 'elevated'], 'filled'), size: pick(state, 'size', sizes, 's'),
    text: string(state, 'text'), ...(iconMarkup(state) ? { icon: iconMarkup(state) } : {}),
    ...(!string(state, 'text').trim() ? { ariaLabel: 'Primary action' } : {}),
    trailingLabel: string(state, 'trailingLabel').trim() || 'More options', disabled: bool(state, 'disabled'),
    items: state.menu === 'share'
      ? [{ id: 'link', text: 'Copy link' }, { id: 'email', text: 'Send by email' }, { id: 'export', text: 'Export file' }]
      : [{ id: 'save-as', text: 'Save as…' }, { id: 'save-copy', text: 'Save a copy' }, { id: 'download', text: 'Download' }],
  }),
};
