// Runs once everything is wired: the actions go into the bar's trailing slot with their
// tooltips, the app connects to the theme store and the site's mode (which set the
// first theme and mode), a `?seed=` link is shown, and only the parts, the state and
// destroy are kept.
import createTooltip from 'material/components/tooltip';
import type { App } from '../core/foundation';
import { TOOLTIPS } from '../config/layout';
import { CONTRASTS, VARIANTS } from './withVariant';

export const withSetup = () => (app: App) => {
  app.ui.bar.addTrailingElement(app.ui.actions);
  const tooltips = Object.fromEntries(Object.entries(TOOLTIPS).map(([name, text]) => [name, createTooltip({ text, target: app.ui[name].element, position: 'bottom' })]));
  app.teardown.add(() => { for (const tooltip of Object.values(tooltips)) tooltip.destroy(); });
  // The download menu opens where its tooltip shows: the tooltip gives way.
  app.download.menu.on('open', () => tooltips.download!.hide());
  // Read before connecting: the first theme rewrites the address.
  const params = new URLSearchParams(location.search);
  const seed = params.get('seed');
  const variant = VARIANTS.find(([name]) => name === params.get('variant'))?.[0] ?? (params.get('variant') === 'original' ? 'original' : null);
  const contrast = CONTRASTS.find(([, name]) => name === params.get('contrast'))?.[0] ?? null;
  app.state.set('variant', variant);
  app.state.set('contrast', contrast);
  app.teardown.add(app.source.connect());
  if (seed && /^#?[0-9a-f]{6}$/i.test(seed)) {
    const value = `#${seed.replace('#', '').toLowerCase()}`;
    // The engine loads here too. A rejected import must not stay unhandled; the select
    // never moves until the seed is shown, so the built-in theme stays the one applied.
    app.image.show(value).catch(() => app.copy.tell(`Could not read seed ${value}`));
  }
  return { ui: app.ui, state: app.state, destroy: () => app.teardown.run() };
};
