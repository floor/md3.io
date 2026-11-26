// The date picker card: the real modal range picker, on the current month, the 2nd to the 5th selected.
// The Overview's property sections (src/server/component-properties.ts) show it once per value.
import 'material/elements/css/button';
import 'material/elements/css/datepicker';
import createDatePicker from 'material/components/datepicker';
import { inPlace, surface } from './surface';

/** Early days, so the selection sits in the calendar's first rows and the card needs no scrolling. */
const currentRange = (): [Date, Date] => {
  const today = new Date();
  return [new Date(today.getFullYear(), today.getMonth(), 2), new Date(today.getFullYear(), today.getMonth(), 5)];
};
const day = (): Date => { const today = new Date(); return new Date(today.getFullYear(), today.getMonth(), 5); };

/** The property sections' surfaces: `md3-catalog-datepicker-<property>-<value>`. */
const DATEPICKER_PROPERTIES: Record<string, () => Record<string, unknown>> = {
  'variant-docked': () => ({ variant: 'docked', value: day() }),
  'variant-modal': () => ({ variant: 'modal', value: day() }),
  'variant-modal-input': () => ({ variant: 'modal-input', value: day() }),
  'selection-single': () => ({ variant: 'modal', value: day() }),
  'selection-range': () => ({ variant: 'modal', selectionMode: 'range', value: currentRange() }),
  'view-day': () => ({ variant: 'modal', initialView: 'day', value: day() }),
  'view-month': () => ({ variant: 'modal', initialView: 'month', value: day() }),
  'view-year': () => ({ variant: 'modal', initialView: 'year', value: day() }),
};

export const define = (): void => {
  surface('md3-catalog-datepicker', ['progress', 'button', 'datepicker'], () =>
    inPlace(() => createDatePicker({ variant: 'modal', selectionMode: 'range', value: currentRange(), label: 'Select dates' }) as never));
  for (const [suffix, config] of Object.entries(DATEPICKER_PROPERTIES)) surface(`md3-catalog-datepicker-${suffix}`, ['progress', 'button', 'datepicker'], () =>
    inPlace(() => createDatePicker({ label: 'Select date', ...config() } as never) as never));
};
