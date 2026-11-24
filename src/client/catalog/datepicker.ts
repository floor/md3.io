// The date picker card: the real modal range picker, on the current month, the 2nd to the 5th selected.
import 'material/elements/css/button';
import 'material/elements/css/datepicker';
import createDatePicker from 'material/components/datepicker';
import { inPlace, surface } from './surface';

/** Early days, so the selection sits in the calendar's first rows and the card needs no scrolling. */
const currentRange = (): [Date, Date] => {
  const today = new Date();
  return [new Date(today.getFullYear(), today.getMonth(), 2), new Date(today.getFullYear(), today.getMonth(), 5)];
};

export const define = (): void => surface('md3-catalog-datepicker', ['progress', 'button', 'datepicker'], () =>
  inPlace(() => createDatePicker({ variant: 'modal', selectionMode: 'range', value: currentRange(), label: 'Select dates' }) as never));
