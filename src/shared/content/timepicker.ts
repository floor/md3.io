// The time picker's playground content: its named content sets and its registry entry.
import type { TimePickerConfig } from 'material/components/timepicker';
import { TIME_FORMAT, TIME_PICKER_ORIENTATION, TIME_PICKER_TYPE } from 'material/components/timepicker';
import { type ComponentState, bool, choose, disabled, section, string, text, toggle } from './types';

/**
 * A named time picker: the open dialog the guidelines figure shows.
 * `default` is not here: today's 09:30 dial stays exactly as it was, and it
 * stays closed. A named set passes `open: true`, which the factory honors.
 */
interface TimeSet {
  name: string;
  title: string;
  /** `HH:mm`. The typed-time hour is ours: the figure's hour field is empty. */
  value: string;
}

/**
 * Named time pickers from m3.material.io/components/time-pickers/guidelines
 * (read 7 October 2026). The page behind the first two figures is a calendar
 * "Add title" screen and is not part of the picker.
 */
const timeSets: Record<string, TimeSet> = {
  'event-time': { name: 'Event time', title: 'Select time', value: '07:00' },
  'evening-event': { name: 'Evening event', title: 'Select time', value: '20:00' },
  // Hour 9 is ours. The figure's hour field is empty; the minute is 00 and the period is AM.
  'typed-time': { name: 'Typed time', title: 'Enter time', value: '09:00' },
};

const timeSet = (state: ComponentState): TimeSet | undefined => timeSets[string(state, 'timeSet')];

const timeSetControl = {
  ...choose('timeSet', 'Time picker', ['default', 'event-time', 'evening-event', 'typed-time'], 'default', 'select'),
  labels: { default: 'Default', 'event-time': 'Event time', 'evening-event': 'Evening event', 'typed-time': 'Typed time' },
};

const gated = { enabledWhen: 'timeContentDefault' } as const;

const source = 'https://m3.material.io/components/time-pickers/guidelines';

export const timePickerComponent = {
  group: 'Selection & input', name: 'Time picker', factory: 'createTimePicker', variable: 'timePicker',
  description: 'Choose a time with a dial or keyboard. Explore clock formats, orientation, and precision.',
  summary: 'Time entry with a dial or keyboard.', styles: ['progress', 'button', 'timepicker'],
  scenarios: [
    {
      id: 'event-time', name: 'Event time', source,
      description: 'Select time, 07:00 AM, on the 12-hour dial.',
      options: { timeSet: 'event-time' },
    },
    {
      id: 'evening-event', name: 'Evening event', source,
      description: 'Select time, 20:00, on the 24-hour dial.',
      options: { timeSet: 'evening-event', format: '24h' },
    },
    {
      id: 'typed-time', name: 'Typed time', source,
      description: 'Enter time, with 9:00 AM in the hour and minute fields.',
      options: { timeSet: 'typed-time', type: 'input' },
    },
  ],
  controls: [
    ...section('Appearance', [choose('type', 'Input mode', ['dial', 'input'], 'dial'), choose('format', 'Clock format', ['12h', '24h'], '12h'), choose('orientation', 'Orientation', ['vertical', 'horizontal'], 'vertical')]),
    ...section('Content', [timeSetControl, { ...text('title', 'Title', 'Select time'), ...gated }, { ...text('value', 'Time', '09:30'), kind: 'time', ...gated }]),
    ...section('Behavior', [toggle('showSeconds', 'Show seconds'), choose('minuteStep', 'Minute step', ['1', '5', '15'], '1'), toggle('bounded', 'Limit times'), { ...text('minTime', 'Earliest time', '09:00'), kind: 'time', enabledWhen: 'bounded' }, { ...text('maxTime', 'Latest time', '17:30'), kind: 'time', enabledWhen: 'bounded' }]),
  ],
  config: (state: ComponentState): TimePickerConfig => {
    const named = timeSet(state);
    const shared = {
      type: state.type === 'input' ? TIME_PICKER_TYPE.INPUT : TIME_PICKER_TYPE.DIAL,
      format: state.format === '24h' ? TIME_FORMAT.MILITARY : TIME_FORMAT.AMPM,
      orientation: state.orientation === 'horizontal' ? TIME_PICKER_ORIENTATION.HORIZONTAL : TIME_PICKER_ORIENTATION.VERTICAL,
      showSeconds: bool(state, 'showSeconds'), minuteStep: Number(state.minuteStep),
      ...(state.bounded ? { minTime: string(state, 'minTime'), maxTime: string(state, 'maxTime') } : {}),
      name: 'time',
    };
    // A named dialog carries the figure's own title and time, and it is open.
    // The default stays today's closed 09:30 dial, its title and time controls driving it.
    if (named) return { ...shared, title: named.title, value: named.value, open: true };
    return { type: state.type === 'input' ? TIME_PICKER_TYPE.INPUT : TIME_PICKER_TYPE.DIAL,
      format: state.format === '24h' ? TIME_FORMAT.MILITARY : TIME_FORMAT.AMPM,
      orientation: state.orientation === 'horizontal' ? TIME_PICKER_ORIENTATION.HORIZONTAL : TIME_PICKER_ORIENTATION.VERTICAL,
      title: string(state, 'title'), value: string(state, 'value'), showSeconds: bool(state, 'showSeconds'), minuteStep: Number(state.minuteStep), ...(state.bounded ? { minTime: string(state, 'minTime'), maxTime: string(state, 'maxTime') } : {}), name: 'time' };
  },
};
