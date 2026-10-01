// The Themes app: mtrl's built-in themes as Material Theme Builder's scheme card and
// tonal palettes. Built the mtrl way, a pipe of small features, each
// `(config?) => (app) => ({ ...app, ns })`, with no `this`:
//   foundation (state, UI from config/layout.ts) → the theme and what paints it →
//   wiring (UI → handlers; state → UI) → setup.
// The editor and builder will be more features and layout entries in this pipe.
import { pipe } from 'mtrl/core/compose';
import { withState, withUI } from './core/foundation';
import { layout } from './config/layout';
import { withThemeSource, type ThemeData } from './features/withThemeSource';
import { withScheme } from './features/withScheme';
import { withPalettes } from './features/withPalettes';
import { withCopy } from './features/withCopy';
import { withInputWiring } from './features/withInputWiring';
import { withReactionWiring } from './features/withReactionWiring';
import { withSetup } from './features/withSetup';

export interface ThemeAppOptions {
  container: HTMLElement;
  themes: ThemeData[];
  /** mtrl's THEME_ROLES, the order of each theme's colours. */
  roles: string[];
  /** The theme the server rendered for. */
  selected: string;
}

export const createThemeApp = (options: ThemeAppOptions) => {
  return pipe(
    // Foundation. Theme and mode persist through the Styles store (withThemeSource).
    withState({ theme: null, mode: null }),
    withUI(layout(options), options.container),
    // The theme, and what paints it
    withThemeSource(options),
    withScheme(),
    withPalettes(),
    withCopy(),
    // Wiring, one direction each
    withInputWiring(),
    withReactionWiring(),
    // Start, keeping the parts, the state and destroy
    withSetup(),
  )({ roles: options.roles });
};
export type ThemeApp = ReturnType<typeof createThemeApp>;
