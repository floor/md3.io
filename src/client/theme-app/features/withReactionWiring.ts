// State → UI and effects, one direction only: a theme repaints the card, the
// palettes, the chrome, the select and the address; the site's mode repaints the card
// and the chrome.
import type { App } from '../core/foundation';

export const withReactionWiring = () => (app: App) => {
  const { ui, scheme, palettes, state } = app;
  state.on('theme', (value: string) => {
    scheme.paint();
    palettes.paint();
    scheme.chrome();
    if (ui.theme.getValue() !== value) ui.theme.setValue(value);
    // The address names the theme, or the seed of one made from an image.
    const { seed } = app.source.current();
    const url = new URL(location.href);
    url.searchParams.delete(seed ? 'theme' : 'seed');
    url.searchParams.set(seed ? 'seed' : 'theme', seed ? seed.slice(1) : value);
    if (url.href !== location.href) history.replaceState(history.state, '', url.pathname + url.search + url.hash);
  });
  state.on('mode', () => { scheme.paint(); scheme.chrome(); });
  return app;
};
