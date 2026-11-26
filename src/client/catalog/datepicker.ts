// The date picker card: the real modal range picker, on the current month, the 2nd to the 5th selected.
// The Overview's property sections (src/server/component-properties.ts) show it once per value.
import 'material/elements/css/button';
import 'material/elements/css/datepicker';
import createDatePicker from 'material/components/datepicker';
import { inPlace, surface } from './surface';

/** Dates ahead, as a person picks them: a week from today, and a stay of four nights from then. The
 *  calendar opens on that date's month (the next one, near a month's end). */
const fromToday = (days: number): Date => { const today = new Date(); return new Date(today.getFullYear(), today.getMonth(), today.getDate() + days); };
const currentRange = (): [Date, Date] => [fromToday(7), fromToday(11)];
const day = (): Date => fromToday(7);

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
    inPlace(() => createDatePicker({ variant: 'modal', selectionMode: 'range', value: currentRange(), label: 'Select dates', animate: false }) as never));
  for (const [suffix, config] of Object.entries(DATEPICKER_PROPERTIES)) surface(`md3-catalog-datepicker-${suffix}`, ['progress', 'button', 'datepicker'], () =>
    inPlace(() => createDatePicker({ label: 'Select date', animate: false, ...config() } as never) as never));
};
