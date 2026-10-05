// The date picker's playground content: its registry entry, moved from
// src/shared/components.ts.
import type { DatePickerConfig } from 'material/components/datepicker';
import { type ComponentState, bool, choose, date, disabled, section, string, text, toggle } from './types';

export const datepickerComponent = {
  group: 'Selection & input', name: 'Date picker', factory: 'createDatePicker', variable: 'datePicker',
  description: 'Choose a date or enter one by keyboard. Explore calendar and input modes, ranges, and selection limits.',
  summary: 'Calendar and keyboard entry for dates and ranges.', styles: ['datepicker'],
  scenarios: [],
  controls: [
    ...section('Appearance', [choose('variant', 'Variant', ['docked', 'modal', 'modal-input', 'fullscreen'], 'docked', 'select'), choose('initialView', 'Initial view', ['day', 'month', 'year'], 'day')]),
    ...section('Content', [text('label', 'Label', 'Choose a date'), date('value', 'Date', '2026-09-21'), { ...date('endDate', 'Range end', '2026-09-25'), enabledWhen: 'range' }, choose('dateFormat', 'Date format', ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], 'MM/DD/YYYY', 'select')]),
    ...section('Behavior', [toggle('range', 'Date range'), toggle('closeOnSelect', 'Close on selection'), disabled, toggle('bounded', 'Limit dates'), { ...date('minDate', 'Earliest date', '2026-09-01'), enabledWhen: 'bounded' }, { ...date('maxDate', 'Latest date', '2026-10-31'), enabledWhen: 'bounded' }]),
  ],
  config: (state: ComponentState): DatePickerConfig => ({ variant: string(state, 'variant'), initialView: string(state, 'initialView'), selectionMode: bool(state, 'range') ? 'range' : 'single',
    ...(state.value ? { value: bool(state, 'range') && state.endDate ? [string(state, 'value'), string(state, 'endDate')] as [string, string] : string(state, 'value') } : {}), dateFormat: string(state, 'dateFormat'),
    label: string(state, 'label'), closeOnSelect: bool(state, 'closeOnSelect'), disabled: bool(state, 'disabled'), ...(state.bounded ? { minDate: string(state, 'minDate'), maxDate: string(state, 'maxDate') } : {}) }),
};
