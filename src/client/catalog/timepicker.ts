// The time picker card: a button that opens the real time picker dialog.
import 'material/elements/css/button';
import 'material/elements/css/timepicker';
import createButton from 'material/components/button';
import createTimePicker from 'material/components/timepicker';
import { timepickerDefaults } from './defaults';
import { surface } from './surface';

export const define = (): void => surface('md3-catalog-timepicker', ['progress', 'button', 'timepicker'], () => {
  const host = document.createElement('div');
  const trigger = createButton({ text: 'Show time picker', variant: 'tonal' });
  const picker = createTimePicker({ ...timepickerDefaults });
  trigger.on('click', () => picker.open());
  host.append(trigger.element, picker.element);
  return { element: host, destroy: () => { picker.destroy(); trigger.destroy(); } };
});
