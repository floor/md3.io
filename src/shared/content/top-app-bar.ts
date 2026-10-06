// The top app bar's playground content: the action buttons both app bars share, the
// named bars, what a preview adds beside their configs, and its registry entry.
import type { IconButtonConfig } from 'material/components/icon-button';
import type { FabConfig } from 'material/components/fab';
import type { TopAppBarConfig } from 'material/components/top-app-bar';
import { symbols } from '../icons';
import { type ComponentState, type Control, type Scenario, bool, choose, iconByName, pick, section, string, text, toggle } from './types';

/** A filled button a named bar puts in the trailing slot. The bar's title is its only text line. */
export interface AppBarButton {
  text: string;
  icon: string;
  variant: 'filled';
}

interface BarContext {
  name: string;
  actions: readonly IconButtonConfig[];
  trailingButton?: AppBarButton;
}

/**
 * Named bars from m3.material.io/components/app-bars/guidelines (read 6 October
 * 2026). `default` is not here: today's library bar stays exactly as it was.
 * The trail guide's "Discover popular trails" and the attachment's "7.2 MB • PNG"
 * are not in a set: a bar has a title and no subtitle (material/.../top-app-bar/types.ts).
 */
const barContexts: Record<string, BarContext> = {
  'trail-guide': {
    name: 'Trail guide',
    actions: [{ icon: symbols.bookmark, ariaLabel: 'Bookmark', variant: 'tonal' }],
  },
  'article-review': {
    name: 'Article review',
    actions: [{ icon: symbols.share, ariaLabel: 'Share', variant: 'tonal' }],
  },
  'media-attachment': {
    name: 'Media attachment',
    actions: [],
    trailingButton: { text: 'Send', icon: symbols.send, variant: 'filled' },
  },
  'article-reader': {
    name: 'Article reader',
    actions: [{ icon: symbols.share, ariaLabel: 'Share', variant: 'standard' }],
  },
};

const barContext = (state: ComponentState): BarContext | undefined => barContexts[string(state, 'context')];

export const appBarActions = (state: ComponentState): IconButtonConfig[] => ['heart', 'bookmark', 'send'].slice(0, Number(state.actions)).map(icon => ({ icon: iconByName(icon), ariaLabel: { heart: 'Favorite', bookmark: 'Bookmark', send: 'Share' }[icon] ?? icon, variant: 'standard' }));

/** What an app bar preview adds beside its config: the icon buttons, a trailing button, the FAB, and the state it is put in. */
export function appBarContent(slug: 'top-app-bar' | 'bottom-app-bar', state: ComponentState): { leading?: IconButtonConfig; actions: IconButtonConfig[]; trailingButton?: AppBarButton; fab?: FabConfig; scrolled?: boolean; visible?: boolean } {
  if (slug !== 'top-app-bar') return { actions: appBarActions(state), ...(state.hasFab ? { fab: { icon: iconByName('add'), ariaLabel: String(state.fabLabel).trim() || 'Compose' } } : {}), visible: state.visible === true };
  const named = barContext(state);
  if (!named) return { ...(state.leading ? { leading: { icon: iconByName('menu'), ariaLabel: 'Open navigation' } } : {}), actions: appBarActions(state), scrolled: state.scrolled === true };
  return {
    ...(state.leading ? { leading: { icon: symbols.arrowBack, ariaLabel: 'Back' } } : {}),
    actions: [...named.actions],
    ...(named.trailingButton ? { trailingButton: named.trailingButton } : {}),
    scrolled: state.scrolled === true,
  };
}

const contextControl: Control = {
  ...choose('context', 'Context', ['default', 'trail-guide', 'article-review', 'media-attachment', 'article-reader'], 'default', 'select'),
  labels: { default: 'Default', ...Object.fromEntries(Object.entries(barContexts).map(([id, set]) => [id, set.name])) },
};

/**
 * The top app bar's scenarios, from m3.material.io (read 6 October 2026). Options
 * name playground controls only. Each bar is the figure's bar: a back button, the
 * title, and the action the figure shows.
 */
const topAppBarScenarios: readonly Scenario[] = [
  {
    id: 'trail-guide', name: 'Trail guide', source: 'https://m3.material.io/components/app-bars/guidelines',
    description: 'A large bar for a trail guide, with a bookmark.',
    options: { context: 'trail-guide', type: 'large', title: 'Top 10 hiking trails', leading: true, scrolled: false, actions: '1' },
  },
  {
    id: 'article-review', name: 'Article review', source: 'https://m3.material.io/components/app-bars/guidelines',
    description: 'A medium bar for a review of sushi spots, with a share action.',
    options: { context: 'article-review', type: 'medium', title: 'The best sushi spots in Los Angeles and Orange County', leading: true, scrolled: false, actions: '1' },
  },
  {
    id: 'media-attachment', name: 'Media attachment', source: 'https://m3.material.io/components/app-bars/guidelines',
    description: 'A small bar over an image, with a Send button.',
    options: { context: 'media-attachment', type: 'small', title: 'Image', leading: true, scrolled: false, actions: '0' },
  },
  {
    id: 'article-reader', name: 'Article reader', source: 'https://m3.material.io/components/app-bars/guidelines',
    description: 'A small bar for an article, scrolled, with a share action.',
    options: { context: 'article-reader', type: 'small', title: 'Material 3', leading: true, scrolled: true, actions: '1' },
  },
];

export const topAppBarComponent = {
  group: 'Navigation', name: 'Top app bar', factory: 'createTopAppBar', variable: 'topBar',
  description: 'Give a view its title and actions. Explore bar sizes and the scrolled appearance.',
  summary: 'A title, navigation, and contextual actions.', styles: ['top-app-bar', 'icon-button'],
  // The Send button's styles: the preview only. Vanilla imports them when a bar has that button.
  previewStyles: ['button'],
  scenarios: topAppBarScenarios,
  controls: [
    ...section('Appearance', [choose('type', 'Type', ['small', 'center', 'medium', 'large'], 'small', 'select'), toggle('scrolled', 'Scrolled state'), toggle('compressible', 'Compressible', true)]),
    ...section('Content', [contextControl, text('title', 'Title', 'My library'), toggle('leading', 'Navigation button', true), { ...choose('actions', 'Action count', ['0', '1', '2'], '1'), enabledWhen: 'contextDefault' }]),
  ],
  config: (state: ComponentState): TopAppBarConfig => ({ type: pick(state, 'type', ['small', 'center', 'medium', 'large'], 'small'), title: string(state, 'title'), compressible: bool(state, 'compressible'), scrollable: false }),
};
