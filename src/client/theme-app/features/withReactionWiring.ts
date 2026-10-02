// State → UI and effects, one direction only. A theme, variant or contrast works out
// the scheme (withVariant), then repaints the card, the palettes, the app's colours,
// the controls and the address; the site's mode repaints the card and the app.
import type { App } from '../core/foundation';
import { nameSupportingText } from './withDownload';

export const withReactionWiring = () => (app: App) => {
  const { ui, scheme, palettes, state, variant, source, copy } = app;
  const controls = () => {
    const theme = source.current();
    if (ui.theme.getValue() !== theme.name) ui.theme.setValue(theme.name);
    const { variant: current, contrast } = variant.effective();
    // "Original" is a hand-made theme's own colours: hidden for a seeded theme, whose
    // own variant is its original (styles/theme-app.css), not rebuilt with setOptions.
    if (theme.handSeed) delete ui.variant.element.dataset.seeded;
    else ui.variant.element.dataset.seeded = '';
    if (ui.variant.getValue() !== current) ui.variant.setValue(current);
    const seed = variant.seedOf(theme);
    ui.variant.textField.setSupportingText(!theme.handSeed ? `Seed ${seed}`
      : current === 'original' && contrast ? `Tonal Spot from ${seed}: Original is standard contrast only`
      : current === 'original' ? `Set by hand; variants generated from ${seed}` : `Generated from ${seed}`);
    if (!ui.contrast.isSelected(String(contrast))) ui.contrast.select(String(contrast));
  };
  const render = () => variant.update(() => {
    scheme.paint();
    palettes.paint();
    scheme.chrome();
    controls();
    const url = new URL(location.href);
    url.search = variant.params().toString();
    if (url.href !== location.href) history.replaceState(history.state, '', url.pathname + url.search + url.hash);
  }, () => copy.tell('Could not apply this scheme'));
  state.on('theme', render);
  state.on('variant', render);
  state.on('contrast', render);
  state.on('mode', () => { scheme.paint(); scheme.chrome(); });
  // The Theme name field: its row is reserved from the start (layout); a name the download
  // refuses says why there. No scheme work: the name only names the file.
  state.on('name', (value: unknown) => ui.name.setSupportingText(nameSupportingText(value)));
  return app;
};
