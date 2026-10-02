// Runs once everything is wired: the actions go into the bar's trailing slot, the app
// connects to the theme store (which sets the first theme and mode), and only the
// parts, the state and destroy are kept.
import type { App } from '../core/foundation';

export const withSetup = () => (app: App) => {
  app.ui.bar.addTrailingElement(app.ui.actions);
  app.teardown.add(app.source.connect());
  return { ui: app.ui, state: app.state, destroy: () => app.teardown.run() };
};
