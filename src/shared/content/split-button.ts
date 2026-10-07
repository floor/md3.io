// The split button's playground content: its scenarios and its registry entry, moved
// from src/shared/components.ts.
import type { MenuContent } from 'material/components/menu';
import type { SplitButtonConfig } from 'material/components/split-button';
import { icons as buttonIcons, sizes } from '../button';
import { symbols } from '../icons';
import { type ComponentState, type Scenario, bool, choose, disabled, icon, iconMarkup, pick, section, size, string, text } from './types';

const saveItems: MenuContent[] = [{ id: 'save-as', text: 'Save as…' }, { id: 'save-copy', text: 'Save a copy' }, { id: 'download', text: 'Download' }];
const shareItems: MenuContent[] = [{ id: 'link', text: 'Copy link' }, { id: 'email', text: 'Send by email' }, { id: 'export', text: 'Export file' }];

/** Named menus from the saved figures. The save and share sets stay the ones the page already had. */
const menuSets: Record<string, MenuContent[]> = {
  save: saveItems,
  share: shareItems,
  'playback-speed': [
    { id: '0.5x', text: '0.5x' },
    { id: '1x', text: '1x' },
    { id: '1.5x', text: '1.5x' },
    { id: '2x', text: '2x' },
  ],
  slideshow: [
    { id: 'presenter', text: 'Open presenter view' },
    { id: 'beginning', text: 'Start from beginning' },
    { id: 'slideshow', text: 'Start slideshow', icon: symbols.playCircle },
  ],
};

/**
 * The split button's scenarios, from m3.material.io (read 7 October 2026). Options name
 * playground controls only. The figures show the menus open; the element cannot declare
 * that, so the stage leaves them closed.
 */
const splitButtonScenarios: readonly Scenario[] = [
  {
    id: 'playback-speed', name: 'Playback speed', source: 'https://m3.material.io/components/split-button/overview',
    description: 'Tonal, "1.5x", no icon. The trailing button opens the menu: 0.5x, 1x, 1.5x, 2x. Not yet exposed by the element: open. Not yet exposed by the element: items[].selected.',
    options: { variant: 'tonal', text: '1.5x', icon: 'none', menu: 'playback-speed', trailingLabel: 'Playback speeds' },
  },
  {
    id: 'slideshow', name: 'Slideshow', source: 'https://m3.material.io/components/split-button/overview',
    description: 'Filled, a play-in-circle and "Slideshow". The trailing button opens the menu: Open presenter view, Start from beginning, Start slideshow. Not yet exposed by the element: open.',
    options: { variant: 'filled', text: 'Slideshow', icon: 'playCircle', menu: 'slideshow', trailingLabel: 'Slideshow options' },
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
    ...section('Content', [icon([...Object.keys(buttonIcons), 'playCircle'], 'none'), text('text', 'Text', 'Save'), text('trailingLabel', 'Menu label', 'More save options'),
      choose('menu', 'Menu options', ['save', 'share', 'playback-speed', 'slideshow'], 'save')]),
    ...section('Behavior', [disabled]),
  ],
  config: (state: ComponentState): SplitButtonConfig => ({
    variant: pick(state, 'variant', ['filled', 'tonal', 'outlined', 'elevated'], 'filled'), size: pick(state, 'size', sizes, 's'),
    text: string(state, 'text'), ...(iconMarkup(state) ? { icon: iconMarkup(state) } : {}),
    ...(!string(state, 'text').trim() ? { ariaLabel: 'Primary action' } : {}),
    trailingLabel: string(state, 'trailingLabel').trim() || 'More options', disabled: bool(state, 'disabled'),
    items: menuSets[string(state, 'menu')] ?? saveItems,
  }),
};
