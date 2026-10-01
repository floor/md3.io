// The built-in themes, as the server read them from mtrl's CSS (#themes-data), the
// Styles store (theme-store.ts) the app reads and writes its theme through, so the Color
// page, the playground and other tabs agree, and the site's own light or dark mode,
// which the app follows. Both land in `app.state`.
import { themeStore } from '../../theme-store';
import type { App } from '../core/foundation';
import { VARIANTS } from './withVariant';

/** mtrl's variant themes (baseline's seed through another variant): a variant here, not a theme. */
const VARIANT_THEMES = new Set<string>(VARIANTS.map(([name]) => name).filter(name => name !== 'tonal-spot'));
export const isVariantTheme = (name: string) => VARIANT_THEMES.has(name);

export interface ThemeData {
  name: string;
  label: string;
  /** Colours in `roles` order, per mode. */
  light: string[];
  dark: string[];
  /** How mtrl generates it ("seed #6750a4, Tonal Spot"), or null for a hand-set theme. */
  origin: string | null;
  palettes: Record<string, string[]> | null;
  /** What mtrl generates it from, or null for a hand-set theme. */
  spec: { seed: string; variant: string; contrast: number; secondary?: string } | null;
  /** A theme made from an image: its seed, which the address carries. */
  seed?: string;
  /** A hand-made theme's seed for generated variants: its light primary. */
  handSeed?: string | null;
}

export const withThemeSource = (config: { themes: ThemeData[] }) => (app: App) => {
  const byName = new Map(config.themes.map(theme => [theme.name, theme]));
  const fallback = config.themes[0]!;
  return {
    ...app,
    source: {
      themes: config.themes,
      /** The themes the select lists: not the variant themes. */
      listed: config.themes.filter(theme => !VARIANT_THEMES.has(theme.name)),
      get: (name: string): ThemeData => byName.get(name) ?? fallback,
      has: (name: string) => byName.has(name),
      current: (): ThemeData => byName.get(app.state.get('theme') as string) ?? fallback,
      /** A built-in theme goes through the store; one made here only into the state. */
      select: (name: string) => {
        if (!byName.has(name)) return;
        app.state.set('theme', name);
        if (!byName.get(name)!.seed) themeStore.set({ base: name });
      },
      /** Adds (or replaces) a theme made here, and shows it. */
      add: (theme: ThemeData) => {
        byName.set(theme.name, theme);
        if (app.state.get('theme') === theme.name) app.state.touch('theme');
        else app.state.set('theme', theme.name);
      },
      /** Follows the store and the site's mode into app.state; returns the disconnect. */
      connect: () => {
        // Only a change of the store's base theme (here, or in another tab) is followed:
        // a theme made from an image stays until another one is chosen.
        let base: string | undefined;
        const unsubscribe = themeStore.subscribe(state => {
          if (state.base === base) return;
          base = state.base;
          // mtrl's vibrant theme is baseline, Vibrant.
          if (VARIANT_THEMES.has(base)) { app.state.set('variant', base); app.state.set('contrast', null); app.state.set('theme', 'baseline'); return; }
          app.state.set('theme', byName.has(base) ? base : fallback.name);
        });
        // The site's mode: html[data-theme-mode], set by its header toggle, or by the
        // system preference while the site has no choice of its own (md3-site-mode).
        const root = document.documentElement;
        const system = matchMedia('(prefers-color-scheme: dark)');
        const chosen = () => { try { return localStorage.getItem('md3-site-mode'); } catch { return null; } };
        const follow = () => app.state.set('mode', root.dataset.themeMode === 'light' ? 'light' : 'dark');
        const onSystem = () => { if (!chosen()) app.state.set('mode', system.matches ? 'dark' : 'light'); };
        const observer = new MutationObserver(follow);
        observer.observe(root, { attributes: true, attributeFilter: ['data-theme-mode'] });
        system.addEventListener('change', onSystem);
        follow();
        return () => { unsubscribe(); observer.disconnect(); system.removeEventListener('change', onSystem); };
      },
    },
  };
};
