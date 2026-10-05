// The top app bar's playground content: the action buttons both app bars share, what a
// preview adds beside their configs, and its registry entry, moved from
// src/shared/components.ts.
import type { IconButtonConfig } from 'material/components/icon-button';
import type { FabConfig } from 'material/components/fab';
import type { TopAppBarConfig } from 'material/components/top-app-bar';
import { type ComponentState, bool, choose, iconByName, pick, section, string, text, toggle } from './types';

export const appBarActions = (state: ComponentState): IconButtonConfig[] => ['heart', 'bookmark', 'send'].slice(0, Number(state.actions)).map(icon => ({ icon: iconByName(icon), ariaLabel: { heart: 'Favorite', bookmark: 'Bookmark', send: 'Share' }[icon] ?? icon, variant: 'standard' }));
/** What an app bar preview adds beside its config: the icon buttons, the FAB, and the state it is put in. */
export function appBarContent(slug: 'top-app-bar' | 'bottom-app-bar', state: ComponentState): { leading?: IconButtonConfig; actions: IconButtonConfig[]; fab?: FabConfig; scrolled?: boolean; visible?: boolean } {
  return slug === 'top-app-bar'
    ? { ...(state.leading ? { leading: { icon: iconByName('menu'), ariaLabel: 'Open navigation' } } : {}), actions: appBarActions(state), scrolled: state.scrolled === true }
    : { actions: appBarActions(state), ...(state.hasFab ? { fab: { icon: iconByName('add'), ariaLabel: String(state.fabLabel).trim() || 'Compose' } } : {}), visible: state.visible === true };
}

export const topAppBarComponent = {
  group: 'Navigation', name: 'Top app bar', factory: 'createTopAppBar', variable: 'topBar',
  description: 'Give a view its title and actions. Explore bar sizes and the scrolled appearance.',
  summary: 'A title, navigation, and contextual actions.', styles: ['top-app-bar', 'icon-button'],
  scenarios: [],
  controls: [
    ...section('Appearance', [choose('type', 'Type', ['small', 'center', 'medium', 'large'], 'small', 'select'), toggle('scrolled', 'Scrolled state'), toggle('compressible', 'Compressible', true)]),
    ...section('Content', [text('title', 'Title', 'My library'), toggle('leading', 'Navigation button', true), choose('actions', 'Action count', ['0', '1', '2'], '1')]),
  ],
  config: (state: ComponentState): TopAppBarConfig => ({ type: pick(state, 'type', ['small', 'center', 'medium', 'large'], 'small'), title: string(state, 'title'), compressible: bool(state, 'compressible'), scrollable: false }),
};
