// The dialog card: <md3-catalog-dialog>, the dialog shown open in place (surface.ts).
import 'mtrl/elements/css/dialog';
import createDialog from 'mtrl/components/dialog';
import { PREFIX } from 'mtrl/core';
import { dialogDefaults } from './defaults';
import { detached, surface } from './surface';

export const define = (): void => surface('md3-catalog-dialog', ['progress', 'button', 'divider', 'dialog'], () => {
  // Without `layer: "top"` the dialog is a <div> in an overlay: the overlay stays in
  // a detached container and the dialog comes into the shadow root.
  const dialog = createDialog({ ...dialogDefaults, container: detached(), open: false });
  dialog.element.classList.add(`${PREFIX}-dialog--visible`);
  return { element: dialog.element, destroy: () => dialog.destroy() };
});
