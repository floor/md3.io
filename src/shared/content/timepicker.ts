// The time picker's playground content: its registry entry, moved from
// src/shared/components.ts.
import type { TimePickerConfig } from 'material/components/timepicker';
import { TIME_FORMAT, TIME_PICKER_ORIENTATION, TIME_PICKER_TYPE } from 'material/components/timepicker';
import { type ComponentState, bool, choose, disabled, section, string, text, toggle } from './types';

export const timePickerComponent = {
  group: 'Selection & input', name: 'Time picker', factory: 'createTimePicker', variable: 'timePicker',
  description: 'Choose a time with a dial or keyboard. Explore clock formats, orientation, and precision.',
  summary: 'Time entry with a dial or keyboard.', styles: ['progress', 'button', 'timepicker'],
  scenarios: [],
  controls: [
    ...section('Appearance', [choose('type', 'Input mode', ['dial', 'input'], 'dial'), choose('format', 'Clock format', ['12h', '24h'], '12h'), choose('orientation', 'Orientation', ['vertical', 'horizontal'], 'vertical')]),
    ...section('Content', [text('title', 'Title', 'Select time'), { ...text('value', 'Time', '09:30'), kind: 'time' }]),
    ...section('Behavior', [toggle('showSeconds', 'Show seconds'), choose('minuteStep', 'Minute step', ['1', '5', '15'], '1'), toggle('bounded', 'Limit times'), { ...text('minTime', 'Earliest time', '09:00'), kind: 'time', enabledWhen: 'bounded' }, { ...text('maxTime', 'Latest time', '17:30'), kind: 'time', enabledWhen: 'bounded' }]),
  ],
  config: (state: ComponentState): TimePickerConfig => ({ type: state.type === 'input' ? TIME_PICKER_TYPE.INPUT : TIME_PICKER_TYPE.DIAL,
    format: state.format === '24h' ? TIME_FORMAT.MILITARY : TIME_FORMAT.AMPM,
    orientation: state.orientation === 'horizontal' ? TIME_PICKER_ORIENTATION.HORIZONTAL : TIME_PICKER_ORIENTATION.VERTICAL,
    title: string(state, 'title'), value: string(state, 'value'), showSeconds: bool(state, 'showSeconds'), minuteStep: Number(state.minuteStep), ...(state.bounded ? { minTime: string(state, 'minTime'), maxTime: string(state, 'maxTime') } : {}), name: 'time' }),
};
