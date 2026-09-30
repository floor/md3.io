// The snackbar card: <md3-catalog-snackbar>, the snackbar shown in place (surface.ts).
import 'mtrl/elements/css/snackbar';
import createSnackbar from 'mtrl/components/snackbar';
import { PREFIX } from 'mtrl/core';
import { snackbarDefaults } from './defaults';
import { surface } from './surface';

export const define = (): void => surface('md3-catalog-snackbar', ['progress', 'button', 'icon-button', 'snackbar'], () => {
  const snackbar = createSnackbar(snackbarDefaults);
  snackbar.element.classList.add(`${PREFIX}-snackbar--visible`);
  return { element: snackbar.element, destroy: () => snackbar.destroy() };
});
