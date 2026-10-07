// The date picker's playground content: its named content sets and its registry entry.
import type { DatePickerConfig } from 'material/components/datepicker';
import { type ComponentState, type Scenario, bool, choose, date, disabled, section, string, text, toggle } from './types';

/**
 * A named date picker: the field the guidelines figure shows.
 * `default` is not here: today's "Choose a date" field stays exactly as it was.
 * The calendar is open on the stage. The factory config has no `open` field;
 * the preview and the Vanilla tab call `open()` after the picker is in the
 * page, and the element tabs set the `open` attribute.
 */
interface DateSet {
  name: string;
  label: string;
  /** A single date, or the start of a range. `YYYY-MM-DD`. */
  value: string;
  end?: string;
  supportingText?: string;
}

/**
 * Named date pickers from m3.material.io/components/date-pickers/guidelines
 * (read 7 October 2026). The trip's "Depart - Return dates" is the dialog
 * title: the full-screen header prints `label` there
 * (`material/src/components/datepicker/render.ts`, the modal title), and the
 * headline "Aug 17 – Aug 23" is the component's own formatting of the range.
 */
const dateSets: Record<string, DateSet> = {
  'profile-form': {
    name: 'Profile form',
    label: 'DOB',
    value: '1979-08-18',
    supportingText: 'MM/DD/YYYY',
  },
  'trip-dates': {
    name: 'Trip dates',
    label: 'Depart - Return dates',
    value: '2025-08-17',
    end: '2025-08-23',
    supportingText: 'Depart - Return dates',
  },
  'date-of-birth': {
    name: 'Date of birth',
    label: 'Date of birth',
    value: '1979-08-18',
  },
};

const dateSet = (state: ComponentState): DateSet | undefined => dateSets[string(state, 'dateSet')];

const dateSetControl = {
  ...choose('dateSet', 'Date picker', ['default', 'profile-form', 'trip-dates', 'date-of-birth'], 'default', 'select'),
  labels: { default: 'Default', 'profile-form': 'Profile form', 'trip-dates': 'Trip dates', 'date-of-birth': 'Date of birth' },
};

const gated = { enabledWhen: 'dateContentDefault' } as const;

const source = 'https://m3.material.io/components/date-pickers/guidelines';

const datepickerScenarios: readonly Scenario[] = [
  {
    id: 'profile-form', name: 'Profile form', source,
    description: 'A DOB field, 08/18/1979, with the August 1979 calendar open on the 18th.',
    options: { dateSet: 'profile-form' },
  },
  {
    id: 'trip-dates', name: 'Trip dates', source,
    description: 'Depart - Return dates, August 17 through 23, 2025, on a full-screen calendar.',
    options: { dateSet: 'trip-dates', variant: 'fullscreen', range: true },
  },
  {
    id: 'date-of-birth', name: 'Date of birth', source,
    description: 'A date of birth dialog titled Date of birth, showing Aug 18, 1979.',
    options: { dateSet: 'date-of-birth', variant: 'modal-input' },
  },
];

export const datepickerComponent = {
  group: 'Selection & input', name: 'Date picker', factory: 'createDatePicker', variable: 'datePicker',
  description: 'Choose a date or enter one by keyboard. Explore calendar and input modes, ranges, and selection limits.',
  summary: 'Calendar and keyboard entry for dates and ranges.', styles: ['datepicker'],
  scenarios: datepickerScenarios,
  controls: [
    ...section('Appearance', [choose('variant', 'Variant', ['docked', 'modal', 'modal-input', 'fullscreen'], 'docked', 'select'), { ...choose('initialView', 'Initial view', ['day', 'month', 'year'], 'day'), ...gated }]),
    ...section('Content', [dateSetControl, { ...text('label', 'Label', 'Choose a date'), ...gated }, { ...date('value', 'Date', '2026-09-21'), ...gated }, { ...date('endDate', 'Range end', '2026-09-25'), enabledWhen: 'rangeEndEnabled' }, { ...choose('dateFormat', 'Date format', ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], 'MM/DD/YYYY', 'select'), ...gated }]),
    ...section('Behavior', [{ ...toggle('range', 'Date range'), ...gated }, toggle('closeOnSelect', 'Close on selection'), disabled, toggle('bounded', 'Limit dates'), { ...date('minDate', 'Earliest date', '2026-09-01'), enabledWhen: 'bounded' }, { ...date('maxDate', 'Latest date', '2026-10-31'), enabledWhen: 'bounded' }]),
  ],
  config: (state: ComponentState): DatePickerConfig => {
    const named = dateSet(state);
    const limits = state.bounded ? { minDate: string(state, 'minDate'), maxDate: string(state, 'maxDate') } : {};
    // A named picker carries the figure's own label and dates. The default
    // stays today's field, its label and date controls driving it.
    if (named) {
      const range = named.end !== undefined;
      return {
        variant: string(state, 'variant'), initialView: string(state, 'initialView'), selectionMode: range ? 'range' : 'single',
        value: range ? [named.value, named.end!] as [string, string] : named.value,
        dateFormat: string(state, 'dateFormat'), label: named.label,
        ...(named.supportingText ? { supportingText: named.supportingText } : {}),
        closeOnSelect: bool(state, 'closeOnSelect'), disabled: bool(state, 'disabled'), ...limits,
      };
    }
    return { variant: string(state, 'variant'), initialView: string(state, 'initialView'), selectionMode: bool(state, 'range') ? 'range' : 'single',
      ...(state.value ? { value: bool(state, 'range') && state.endDate ? [string(state, 'value'), string(state, 'endDate')] as [string, string] : string(state, 'value') } : {}), dateFormat: string(state, 'dateFormat'),
      label: string(state, 'label'), closeOnSelect: bool(state, 'closeOnSelect'), disabled: bool(state, 'disabled'), ...(state.bounded ? { minDate: string(state, 'minDate'), maxDate: string(state, 'maxDate') } : {}) };
  },
};
