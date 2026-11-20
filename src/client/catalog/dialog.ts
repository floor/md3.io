// The dialog card: a button that opens the real dialog (it closes normally).
import 'material/elements/css/dialog';
import 'material/elements/css/button';
import createButton from 'material/components/button';
import createDialog from 'material/components/dialog';
import { dialogDefaults } from './defaults';
import { surface } from './surface';

export const define = (): void => surface('md3-catalog-dialog', ['progress', 'button', 'divider', 'dialog'], () => {
  const host = document.createElement('div');
  const trigger = createButton({ text: 'Show dialog', variant: 'tonal' });
  const dialog = createDialog({ ...dialogDefaults, open: false });
  trigger.on('click', () => dialog.open());
  host.append(trigger.element);
  return { element: host, destroy: () => { dialog.destroy(); trigger.destroy(); } };
});
