// The snackbar card: the real snackbar, shown in the card's phone over a photo grid. Retry
// works; a fresh one comes back a moment after it closes.
import 'material/elements/css/snackbar';
import 'material/elements/css/button';
import { registerStyles } from 'material/elements';
import createSnackbar, { type SnackbarConfig } from 'material/components/snackbar';
import { keepFocusInCard } from './card-focus';
import { surface } from './surface';
import { define as defineNavigationBar } from './navigation-bar';

const config: SnackbarConfig = { message: 'Couldn’t send photo. Retrying in 5 seconds.', action: 'Retry', position: 'center', duration: 'indefinite' };

// Shown, material puts the snackbar on <body>, fixed to the window. Here it is set back in
// the card, at the foot of the phone's screen.
registerStyles({
  'catalog-snackbar': '.catalog-snackbar{display:flex;align-items:flex-end;justify-content:center;width:100%;padding:0 12px}'
    + '.catalog-snackbar .mtrl-snackbar{position:relative!important;inset:auto!important;transform:none!important;translate:none!important;margin:0!important;width:100%;max-width:100%;min-width:0}',
});

// The Overview's sections and glance (component-properties.ts): material shows one snackbar at a time and
// queues the others, so each figure is its real snackbar made visible in place, never shown: it keeps its
// action and close button, and the queue never holds it back.
const SNACKBAR_PROPERTIES: Record<string, SnackbarConfig> = {
  glance: { message: 'Email archived', action: 'Undo' },
  'content-message': { message: 'Photo saved' },
  'content-action': { message: 'Email archived', action: 'Undo' },
  'content-close': { message: 'Connected to Wi-Fi', dismissible: true, closeLabel: 'Dismiss' },
  'content-long': { message: 'Couldn’t send the photo. It will be sent when you’re back online.', action: 'Retry', dismissible: true, closeLabel: 'Dismiss' },
};
const inPlace = (snackbarConfig: SnackbarConfig) => () => {
  const host = document.createElement('div');
  host.className = 'catalog-snackbar';
  const snackbar = createSnackbar({ position: 'center', duration: 'indefinite', ...snackbarConfig });
  snackbar.element.classList.add('mtrl-snackbar--visible');
  host.append(snackbar.element);
  return { element: host, destroy: () => snackbar.destroy() };
};

export const define = (): void => {
  for (const [suffix, snackbarConfig] of Object.entries(SNACKBAR_PROPERTIES)) surface(`md3-catalog-snackbar-${suffix}`, ['progress', 'button', 'icon-button', 'snackbar', 'catalog-snackbar'], inPlace(snackbarConfig));
  defineCard();
  defineNavigationBar();
};
const defineCard = (): void => surface('md3-catalog-snackbar', ['progress', 'button', 'icon-button', 'snackbar', 'catalog-snackbar'], () => {
  const host = document.createElement('div');
  host.className = 'catalog-snackbar';
  let snackbar = createSnackbar(config);
  let timer = 0;
  let active = true;
  const showHere = () => {
    if (!active) return;
    snackbar.show();
    host.append(snackbar.element);
  };
  const again = () => {
    if (!active) return;
    snackbar.destroy();
    snackbar = createSnackbar(config);
    snackbar.on('close', () => { timer = window.setTimeout(again, 1500); });
    showHere();
  };
  snackbar.on('close', () => { timer = window.setTimeout(again, 1500); });
  keepFocusInCard(host);
  // Once the card is in the page: the snackbar measures itself as it shows.
  const frame = requestAnimationFrame(showHere);
  return { element: host, destroy: () => { active = false; cancelAnimationFrame(frame); clearTimeout(timer); snackbar.destroy(); } };
});
