// Paints the theme in the app's mode: the scheme card, and the app itself. The app's mtrl components
// (the bar, the select, the buttons, the snackbar) take the chosen theme's colour roles
// in the chosen mode, written as mtrl's tokens on :root, where the select's menu and
// the snackbar, which live outside the app's element, read them too.
import type { App } from '../core/foundation';

export const withScheme = () => (app: App) => {
  const { ui, state, element } = app;
  const style = document.createElement('style');
  style.id = 'theme-app-tokens';
  document.head.append(style);
  app.teardown.add(() => style.remove());
  return {
    ...app,
    scheme: {
      /** The card, in place. */
      paint: () => ui.scheme.set(app.variant.shown(), state.get('mode') === 'dark' ? 'dark' : 'light'),
      /** The app's own colours: the theme's roles in the current mode. */
      chrome: () => {
        const theme = app.variant.shown();
        const mode = state.get('mode') === 'dark' ? 'dark' : 'light';
        const colors: string[] = theme[mode];
        style.textContent = `:root{${(app.roles as string[]).map((role, i) => `--mtrl-sys-color-${role}:${colors[i]}`).join(';')}}`;
        element.dataset.mode = mode;
      },
    },
  };
};
