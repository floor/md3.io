// The snackbar card: a button that shows the real snackbar.
import 'material/elements/css/snackbar';
import 'material/elements/css/button';
import createButton from 'material/components/button';
import createSnackbar from 'material/components/snackbar';
import { snackbarDefaults } from './defaults';
import { surface } from './surface';

export const define = (): void => surface('md3-catalog-snackbar', ['progress', 'button', 'icon-button', 'snackbar'], () => {
  const host = document.createElement('div');
  const trigger = createButton({ text: 'Show snackbar', variant: 'tonal' });
  const snackbar = createSnackbar(snackbarDefaults);
  trigger.on('click', () => snackbar.show());
  host.append(trigger.element, snackbar.element);
  return { element: host, destroy: () => { snackbar.destroy(); trigger.destroy(); } };
});
