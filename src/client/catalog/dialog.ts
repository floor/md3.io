// The dialog card: the real dialog, open in the card. A list of choices between dividers,
// Cancel, and OK once a choice is made. A fresh one opens a moment after it closes.
import 'material/elements/css/dialog';
import 'material/elements/css/button';
import 'material/elements/css/radios';
import { registerStyles } from 'material/elements';
import createDialog from 'material/components/dialog';
import createRadios from 'material/components/radios';
import { keepFocusInCard } from './card-focus';
import { surface } from './surface';

// Open in place rather than over the page: the dialog sits in the card, in the flow.
registerStyles({
  'catalog-dialog': '.catalog-dialog{display:flex;justify-content:center}'
    // A non-modal dialog sits on a fixed overlay with a scrim: here it is in the flow, clear.
    + '.catalog-dialog .mtrl-dialog__overlay{position:static!important;inset:auto!important;background:none!important;overflow:visible!important;display:flex!important;justify-content:center;align-items:center;padding:0!important}'
    + '.catalog-dialog .mtrl-dialog{transform:none!important;translate:none!important;opacity:1!important;margin:0!important;width:300px}'
    + '.catalog-dialog .mtrl-radios{padding-block:8px}',
});

const choices = [{ value: 'none', label: 'None' }, { value: 'bright', label: 'Bright' }, { value: 'chimes', label: 'Chimes' }, { value: 'waves', label: 'Waves' }];

export const define = (): void => surface('md3-catalog-dialog', ['progress', 'button', 'divider', 'dialog', 'radios', 'catalog-dialog'], () => {
  const host = document.createElement('div');
  host.className = 'catalog-dialog';
  let active = true;
  let timer = 0;
  let current: { destroy: () => void } | undefined;
  const open = () => {
    if (!active) return;
    current?.destroy();
    const dialog = createDialog({
      title: 'Alarm sound', ariaLabel: 'Alarm sound', size: 'small', divider: true, closeButton: false,
      // Always open in the page, so keyboard users Tab on past it: no focus trap.
      modal: false, autofocus: false, trapFocus: false, closeOnOverlayClick: false, container: host,
      buttons: [{ text: 'Cancel', variant: 'text', closeDialog: true }, { text: 'OK', variant: 'text', closeDialog: true, attributes: { disabled: true } }],
    });
    const radios = createRadios({ name: 'alarm-sound', options: choices, direction: 'vertical' });
    dialog.getContentElement()?.append(radios.element);
    // OK is for a choice: it turns on once one is made.
    radios.element.addEventListener('change', () => {
      dialog.getFooterElement()?.querySelector('button[disabled]')?.removeAttribute('disabled');
    });
    dialog.on('close', () => { timer = window.setTimeout(open, 1500); });
    dialog.open();
    current = { destroy: () => { radios.destroy(); dialog.destroy(); } };
  };
  keepFocusInCard(host);
  const frame = requestAnimationFrame(open);
  return { element: host, destroy: () => { active = false; cancelAnimationFrame(frame); clearTimeout(timer); current?.destroy(); } };
});
