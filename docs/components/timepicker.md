# TimePicker

A time picker asks for a time of day, on a clock dial or by typing it, in a modal dialog you open from your own trigger. Reach for it when the value is a wall-clock time: a meeting, an alarm, a delivery window. Unlike the [DatePicker](datepicker.md), it renders no field of its own; you supply the button or input that opens it.

## Import

```javascript
import { createTimePicker } from 'mtrl';
```

To pull in only this component, import it directly instead: `import createTimePicker from 'mtrl/components/timepicker'`.

## Basic Usage

```javascript
const timePicker = createTimePicker({ title: 'Select time', value: '14:30' });

timeButton.addEventListener('click', () => timePicker.open());

timePicker.on('confirm', (time) => {
  timeButton.textContent = time; // "14:30"
});
```

The value is always 24-hour `HH:MM`, or `HH:MM:SS` with `showSeconds`, whatever the picker displays: `format: '12h'` changes the dial and the AM/PM selector, not the string you get back. `getTimeObject()` gives the same time as numbers.

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `value` | `string` | the current time | Initial time, 24-hour `HH:MM` or `HH:MM:SS` |
| `type` | `'dial' \| 'input'` | `'dial'` | Clock dial or keyboard entry. People can switch with the toggle in the dialog |
| `format` | `'12h' \| '24h'` | `'12h'` | How the time is shown. The value is 24-hour either way |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | The dialog's layout; horizontal puts the dial beside the time |
| `title` | `string` | — | The dialog's heading, and its accessible name |
| `showSeconds` | `boolean` | `false` | Adds seconds to the time and the value |
| `minTime` / `maxTime` | `string` | — | The earliest and latest selectable times, 24-hour `HH:MM` or `HH:MM:SS` |
| `minuteStep` / `secondStep` | `number` | `1` | The minute and second steps |
| `name` | `string` | — | Submits the value with a form the picker's element is in |
| `isOpen` | `boolean` | `false` | Whether the dialog opens as soon as it is created |
| `cancelText` / `confirmText` | `string` | `'Cancel'` / `'OK'` | The action buttons |
| `clockIcon` / `keyboardIcon` | `string` | built-in | SVG for the mode toggle |
| `container` | `string \| HTMLElement` | `document.body` | Where the dialog is appended |
| `class` | `string` | — | Extra classes on the component's element |
| `closeOnSelect` | `boolean` | — | Deprecated, no effect: the picker is confirmed with OK, as M3 specifies |

Callbacks fire alongside the events, if one handler reads better than `on()`: `onChange(time)`, `onConfirm(time)`, `onCancel()`, `onOpen()`, `onClose()`.

`TIME_PICKER_TYPE`, `TIME_FORMAT`, `TIME_PICKER_ORIENTATION` and `TIME_PERIOD` are exported as enums from `'mtrl/components/timepicker'`, so `format: TIME_FORMAT.MILITARY` reads better than `'24h'` at a call site.

## Component API

| Member | Returns | Description |
|--------|---------|-------------|
| `element` | `HTMLElement` | The component's element; holds the form value when `name` is set |
| `dialogElement` | `HTMLElement` | The native `<dialog>`. `modalElement` is the same element |
| `isOpen` | `boolean` | Whether the dialog is open, kept current |
| `open()` / `close()` / `toggle()` | `TimePickerComponent` | Shows or hides the dialog |
| `getValue()` | `string` | The time, 24-hour `HH:MM` (or `HH:MM:SS`) |
| `setValue(time)` | `TimePickerComponent` | Sets the time from a 24-hour string; an invalid one is logged and ignored. Not held to `minTime` and `maxTime` |
| `getTimeObject()` | `TimeValue` | `{ hours, minutes, seconds, period }`, `hours` 0–23 |
| `setType(type)` / `getType()` | `TimePickerComponent` / `TIME_PICKER_TYPE` | Dial or keyboard entry |
| `setFormat(format)` / `getFormat()` | `TimePickerComponent` / `TIME_FORMAT` | 12- or 24-hour display |
| `setOrientation(o)` / `getOrientation()` | `TimePickerComponent` / `TIME_PICKER_ORIENTATION` | The layout |
| `setTitle(title)` / `getTitle()` | `TimePickerComponent` / `string` | The heading |
| `on(event, handler)` / `off(event, handler)` | `TimePickerComponent` | Events |
| `destroy()` | `void` | Closes the picker and removes it |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `change` | `string` | The time changed: a pick on the dial (once, when a drag is released), a keystroke in a field, AM/PM, or `setValue` with a different time |
| `confirm` | `string` | OK was pressed; the payload is the value |
| `cancel` | none | Cancel, `Escape` or a click on the scrim closed the picker |
| `open` / `close` | none | The dialog opened or closed |

`change` fires once per new value, event and callback together. Changing the display format is not a change of value and emits nothing, and neither does `setValue` with the time the picker already has. Commit on `confirm`; use `change` for a live preview.

## Limits and steps

`minTime` and `maxTime` bound the time; `minuteStep` and `secondStep` put it on a grid.

- On the dial, hours, minutes and seconds that cannot be reached are disabled, and so is AM or PM when no time in that half of the day is allowed.
- A pointer between two labels picks the nearest step.
- A pick that leaves the time outside the limits moves it to the nearest time inside: nine o'clock at a quarter past, with `minTime: '09:30'`, becomes 09:30.
- A typed time is held to the limits and steps when it is committed, on Enter or on leaving the field, not while it is being typed.
- `setValue` is not held to them: it sets what you give it.

```javascript
const meeting = createTimePicker({
  title: 'Meeting time',
  value: '10:00',
  minTime: '09:00',
  maxTime: '17:30',
  minuteStep: 15
});
```

## Examples

### 24-hour, with seconds

```javascript
import { TIME_FORMAT } from 'mtrl/components/timepicker';

createTimePicker({ title: 'Start', value: '15:30:45', format: TIME_FORMAT.MILITARY, showSeconds: true });
```

In 24-hour mode the dial has two rings, 00–11 outside and 12–23 inside, as in Compose; there is no AM/PM selector, and the hour and minute boxes widen to 114dp.

### Starting in keyboard entry

```javascript
import { TIME_PICKER_TYPE } from 'mtrl/components/timepicker';

createTimePicker({ title: 'Arrival', type: TIME_PICKER_TYPE.INPUT });
```

The toggle at the bottom of the dialog switches between the dial and the fields, so this only sets where the picker starts.

### In a form

```javascript
const picker = createTimePicker({ title: 'Pickup', name: 'pickup', value: '08:00' });
form.append(picker.element); // submits pickup=08:00, updated as the time changes
```

## Accessibility

- The picker is a native modal `<dialog>`: the page behind is inert, focus moves into the dialog when it opens and returns to whatever opened it when it closes, and `Escape` or a click on the scrim cancels it. Each picker's title has its own id and names the dialog, so pass a `title`.
- The dial is a listbox named Hour, Minute or Second. Its numbers are options named as times ("9 o'clock", "20 hours", "15 minutes"); the arrows move between them and wrap, Home and End go to the ends, and Enter or Space selects. A pointer can click or drag. Numbers outside the limits or off the step are `aria-disabled`.
- In dial mode the hour and minute boxes are a radiogroup: radios named "Select hour: 9 o'clock" and "Select minutes: 35 minutes", one Tab stop, the arrows moving the choice and the dial with it.
- In keyboard entry the fields are number inputs named Hour, Minute and Second, labelled below.
- AM and PM are a radiogroup with one Tab stop.
- The mode toggle is a button named "Toggle input picker" or "Toggle dial picker".
- Inside a shadow root, as in a web component, focus is read from the picker's own root, so all of this holds there too.

## Styling

```css
.mtrl-time-picker { }                              /* the component's element */
.mtrl-time-picker__dialog { }                      /* the native dialog */
.mtrl-time-picker__dialog--dial, .mtrl-time-picker__dialog--input { }
.mtrl-time-picker__dialog--vertical, .mtrl-time-picker__dialog--horizontal { }
.mtrl-time-picker__dialog--12h, .mtrl-time-picker__dialog--24h { }
.mtrl-time-picker__title, .mtrl-time-picker__content { }
.mtrl-time-picker__input-container, .mtrl-time-picker__selectors { }
.mtrl-time-picker__hours, .mtrl-time-picker__minutes, .mtrl-time-picker__seconds { }
.mtrl-time-picker__separator, .mtrl-time-picker__input-label { }
.mtrl-time-picker__period, .mtrl-time-picker__period-am, .mtrl-time-picker__period-pm, .mtrl-time-picker__period--selected { }
.mtrl-time-picker__dial, .mtrl-time-picker__dial-face, .mtrl-time-picker__dial-number { }
.mtrl-time-picker__dial-track, .mtrl-time-picker__dial-centre, .mtrl-time-picker__dial-handle { }
.mtrl-time-picker__actions, .mtrl-time-picker__toggle-type, .mtrl-time-picker__cancel, .mtrl-time-picker__confirm { }
```

The dial is drawn in CSS from the theme's colours, so a scoped theme reaches it. Its hand, handle and the label under the handle move together on `--mtrl-time-picker-angle` and `--mtrl-time-picker-radius`, registered custom properties that animate on the default spatial spring, the short way round; reduced motion turns the spring off.

## Measurements

Following the m3.material.io time picker specs and their tokens, then Compose:

| Attribute | Value |
|-----------|-------|
| Dialog | `surface-container-high`, 28dp corners, elevation 3, a 0.32 scrim |
| Title | Label Medium, `on-surface-variant` |
| Dial | 256dp, `surface-container-highest`; numbers Body Large, `on-surface` (Body Medium on the 24-hour inner ring) |
| Dial rings | Numbers 101dp from the centre; the 24-hour inner ring 69dp |
| Hand | A 2dp `primary` track, an 8dp centre dot, a 48dp `primary` handle; the number under it `on-primary` |
| Hour and minute boxes (dial) | 96 × 80dp (114dp wide in the 24-hour vertical layout), Display Large, 8dp corners; `surface-container-highest` and `on-surface`, selected `primary-container` and `on-primary-container` |
| Separator | 24dp wide, Display Large, `on-surface` |
| Fields (keyboard entry) | 96 × 72dp, Display Medium; focused, `primary-container` inside a 2dp `primary` outline; labels Body Small, `on-surface-variant` |
| AM/PM | 52 × 80dp beside the time (52 × 72 in keyboard entry, 216 × 38 in the horizontal layout), 12dp away; a 1dp `outline` with a divider; selected `tertiary-container` and `on-tertiary-container`, unselected transparent and `on-surface-variant` |
| Disabled | Dial numbers and AM/PM at 38% |
| Focus | A 3dp `secondary` ring |
| Motion | The dial springs to each value; the dialog fades in |
