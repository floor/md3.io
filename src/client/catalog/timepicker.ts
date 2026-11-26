// The time picker card: the real time picker, shown open in the card. The Overview's property
// sections (src/server/component-properties.ts) show it once per value: one surface each.
import 'material/elements/css/button';
import 'material/elements/css/timepicker';
import createTimePicker from 'material/components/timepicker';
import { timepickerDefaults } from './defaults';
import { inPlace, surface } from './surface';

/** The property sections' surfaces: `md3-catalog-timepicker-<property>-<value>`. */
export const TIMEPICKER_PROPERTIES = {
  'type-dial': { type: 'dial' }, 'type-input': { type: 'input' },
  'format-12h': { format: '12h' }, 'format-24h': { format: '24h' },
  'orientation-vertical': { orientation: 'vertical' }, 'orientation-horizontal': { orientation: 'horizontal' },
  'seconds-off': { showSeconds: false }, 'seconds-on': { showSeconds: true },
} as const;

export const define = (): void => {
  surface('md3-catalog-timepicker', ['progress', 'button', 'timepicker'], () =>
    inPlace(() => createTimePicker({ ...timepickerDefaults, value: '11:00' }) as never));
  for (const [suffix, config] of Object.entries(TIMEPICKER_PROPERTIES)) surface(`md3-catalog-timepicker-${suffix}`, ['progress', 'button', 'timepicker'], () =>
    inPlace(() => createTimePicker({ ...timepickerDefaults, value: '11:00', ...config }) as never));
};
