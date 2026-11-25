// The snackbar card: the real snackbar, shown in the card's phone over a photo grid. Retry
// works; a fresh one comes back a moment after it closes.
import 'material/elements/css/snackbar';
import 'material/elements/css/button';
import { registerStyles } from 'material/elements';
import createSnackbar, { type SnackbarConfig } from 'material/components/snackbar';
import { keepFocusInCard } from './card-focus';
import { surface } from './surface';

const config: SnackbarConfig = { message: 'Couldn’t send photo. Retrying in 5 seconds.', action: 'Retry', position: 'center', duration: 'indefinite' };

// Shown, material puts the snackbar on <body>, fixed to the window. Here it is set back in
// the card, at the foot of the phone's screen.
registerStyles({
  'catalog-snackbar': '.catalog-snackbar{display:flex;align-items:flex-end;justify-content:center;width:100%;padding:0 12px}'
    + '.catalog-snackbar .mtrl-snackbar{position:relative!important;inset:auto!important;transform:none!important;translate:none!important;margin:0!important;width:100%;max-width:100%;min-width:0}',
});

export const define = (): void => surface('md3-catalog-snackbar', ['progress', 'button', 'icon-button', 'snackbar', 'catalog-snackbar'], () => {
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
