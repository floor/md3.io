// The built-in themes, as the server read them from mtrl's CSS (#themes-data), and the
// Styles store (theme-store.ts) the app reads and writes its theme and mode through, so
// the Color page, the playground and other tabs agree. `source.select(name)` and
// `source.setMode(mode)` write the store; the store's changes land in `app.state`.
import { themeStore } from '../../theme-store';
import type { App } from '../core/foundation';

export interface ThemeData {
  name: string;
  label: string;
  /** Colours in `roles` order, per mode. */
  light: string[];
  dark: string[];
  /** How mtrl generates it ("seed #6750a4, Tonal Spot"), or null for a hand-set theme. */
  origin: string | null;
  palettes: Record<string, string[]> | null;
}

export const withThemeSource = (config: { themes: ThemeData[] }) => (app: App) => {
  const byName = new Map(config.themes.map(theme => [theme.name, theme]));
  const fallback = config.themes[0]!;
  return {
    ...app,
    source: {
      themes: config.themes,
      get: (name: string): ThemeData => byName.get(name) ?? fallback,
      has: (name: string) => byName.has(name),
      current: (): ThemeData => byName.get(app.state.get('theme') as string) ?? fallback,
      select: (name: string) => { if (byName.has(name)) themeStore.set({ base: name }); },
      setMode: (mode: 'light' | 'dark') => themeStore.set({ mode }),
      /** Follows the store into app.state; returns the unsubscribe. */
      connect: () => themeStore.subscribe(({ base, mode }) => { app.state.set('mode', mode); app.state.set('theme', byName.has(base) ? base : fallback.name); }),
    },
  };
};
