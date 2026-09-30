// The time picker card: <md3-catalog-timepicker>, the picker shown open in place
// (surface.ts).
import 'mtrl/elements/css/button';
import 'mtrl/elements/css/timepicker';
import createTimePicker from 'mtrl/components/timepicker';
import { timepickerDefaults } from './defaults';
import { surface } from './surface';

export const define = (): void => surface('md3-catalog-timepicker', ['progress', 'button', 'timepicker'], () => {
  // The picker is only its modal <dialog>: shown open without showModal(), so it is
  // not modal and not in the top layer.
  // Landscape, which fits a card's shape; scaled down to fit it (catalog.css).
  const picker = createTimePicker({ ...timepickerDefaults, orientation: 'horizontal' });
  const dialog = picker.element.querySelector('dialog');
  dialog?.setAttribute('open', '');
  return { element: picker.element, destroy: () => picker.destroy() };
});
