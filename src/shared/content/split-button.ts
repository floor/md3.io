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
  // The enamel-mug figure leaves this menu closed. The items are the colors the
  // product line prints beside the button: "Comes in navy, black, white, forest, cherry."
  enamel: [
    { id: 'navy', text: 'Navy' },
    { id: 'black', text: 'Black' },
    { id: 'white', text: 'White' },
    { id: 'forest', text: 'Forest' },
    { id: 'cherry', text: 'Cherry' },
  ],
};

/**
 * The split button's scenarios, from m3.material.io (read 8 October 2026,
 * page JSON 1341051a-3131-40d4-abbf-69e37b307651). Playback speed and slideshow are
 * the figures whose menus are drawn open. The enamel-mug figure is the large hero
 * purchase ("Using large split buttons on small screens can add extra emphasis for
 * hero moments"); its menu is closed in the figure. The speed figure is the smaller
 * secondary control beside a large play button ("The most prominent controls can be
 * larger while secondary controls in a split button can be smaller") and stays the
 * default small, with no leading icon. Elevated and outlined are listed as color
 * styles, and no sentence names a job for either, so they are not scenarios.
 * Options name playground controls only. The element cannot declare an open menu,
 * so the stage leaves every menu closed.
 */
const splitButtonScenarios: readonly Scenario[] = [
  {
    id: 'playback-speed', name: 'Playback speed', source: 'https://m3.material.io/components/split-button/guidelines',
    description: 'Someone watching a video sets playback to 1.5x, or opens the menu for a slower or faster speed.',
    options: { variant: 'tonal', text: '1.5x', icon: 'none', menu: 'playback-speed', trailingLabel: 'Playback speeds' },
  },
  {
    id: 'slideshow', name: 'Slideshow', source: 'https://m3.material.io/components/split-button/guidelines',
    description: 'Someone presenting starts the slideshow, or opens the menu for presenter view and where to begin.',
    options: { variant: 'filled', text: 'Slideshow', icon: 'playCircle', menu: 'slideshow', trailingLabel: 'Slideshow options' },
  },
  {
    id: 'enamel-mugs', name: 'Enamel mugs', source: 'https://m3.material.io/components/split-button/guidelines',
    description: 'Someone buying an enamel mug on a small screen uses the large button for the $7.49 purchase, and the menu offers the colors the product line names.',
    options: { variant: 'filled', size: 'l', text: '$7.49', icon: 'add', menu: 'enamel', trailingLabel: 'Choose a color' },
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
    ...section('Content', [icon([...Object.keys(buttonIcons), 'playCircle', 'add'], 'none'), text('text', 'Text', 'Save'), text('trailingLabel', 'Menu label', 'More save options'),
      { ...choose('menu', 'Menu options', ['save', 'share', 'playback-speed', 'slideshow', 'enamel'], 'save', 'select'), labels: { save: 'Save', share: 'Share', 'playback-speed': 'Playback speed', slideshow: 'Slideshow', enamel: 'Mug colors' } }]),
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
