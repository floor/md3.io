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
    const url = new URL(location.href);
    if (url.searchParams.get('theme') !== value) {
      url.searchParams.set('theme', value);
      history.replaceState(history.state, '', url.pathname + url.search + url.hash);
    }
  });
  state.on('mode', () => { scheme.paint(); scheme.chrome(); });
  return app;
};
