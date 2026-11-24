// The time picker card: the real time picker, shown open in the card.
import 'material/elements/css/button';
import 'material/elements/css/timepicker';
import createTimePicker from 'material/components/timepicker';
import { timepickerDefaults } from './defaults';
import { inPlace, surface } from './surface';

export const define = (): void => surface('md3-catalog-timepicker', ['progress', 'button', 'timepicker'], () =>
  inPlace(() => createTimePicker({ ...timepickerDefaults, value: '11:00' }) as never));
