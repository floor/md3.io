// State → UI and effects, one direction only: a theme repaints the cards, the
// palettes, the chrome, the select and the address; a mode repaints the chrome and
// the mode button.
import type { App } from '../core/foundation';
import { icons } from '../config/layout';

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
  state.on('mode', (value: string) => {
    scheme.chrome();
    const dark = value === 'dark';
    ui.mode.setIcon(dark ? icons.light : icons.dark);
    ui.mode.setAriaLabel(dark ? 'App in light mode' : 'App in dark mode');
    ui.mode.element.setAttribute('aria-pressed', String(dark));
  });
  return app;
};
