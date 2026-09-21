# TimePicker

A time picker asks for a time of day through a clock dial or a pair of numeric
fields, in a modal dialog you open from your own trigger. Reach for it when the
value is a wall-clock time — a meeting, an alarm, a delivery window — and you
want the AM/PM handling, the minute stepping and the hour/minute focus dance
taken care of. Unlike the [DatePicker](datepicker.md), this component renders no
field of its own: you supply the input or button that opens it.

## Import

```javascript
import { createTimePicker } from 'mtrl';
```

To pull in only this component, import it directly instead: `import createTimePicker from 'mtrl/components/timepicker'`.

## Basic Usage

```javascript
const timePicker = createTimePicker({
  title: 'Select Time',
  value: '14:30'
});

timeInput.addEventListener('click', () => timePicker.open());

timePicker.on('confirm', (time) => {
  // "02:30:00 PM" here: the string follows `format`, which defaults to '12h'
  timeInput.value = time;
});

// If you want the 24-hour value, read the object rather than the string:
const { hours, minutes } = timePicker.getTimeObject(); // 14, 30
```

**The value string is not what the doc for this component used to claim.**
`getValue()` — and the payload of `change` and `confirm`, which are the same
string — is produced by `formatTime(value, format === '24h')`, and seconds are
always present because the internal time object always carries a `seconds`
field. So you get `"14:30:00"` with `format: '24h'` and `"02:30:00 PM"` with
the default `'12h'`. `getTimeObject()` is the stable, format-independent
accessor: `hours` there is always 0-23.

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `value` | `string` | current time | Initial time in 24-hour `HH:MM` (or `HH:MM:SS`) form |
| `type` | `'dial' \| 'input'` | `'dial'` | Clock dial or numeric text fields. The user can switch with the toggle button |
| `format` | `'12h' \| '24h'` | `'12h'` | Display format. The stored value is always 24-hour |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | Dialog layout |
| `title` | `string` | — | Heading text inside the dialog |
| `showSeconds` | `boolean` | `false` | Adds a seconds field |
| `minTime` | `string` | — | Earliest selectable time, `HH:MM`. Accepted by the config type; **not enforced** by the current implementation |
| `maxTime` | `string` | — | Latest selectable time, `HH:MM`. Accepted by the config type; **not enforced** |
| `minuteStep` | `number` | `1` | Step interval for minutes. Accepted by the config type; **not applied** |
| `secondStep` | `number` | `1` | Step interval for seconds. Accepted by the config type; **not applied** |
| `closeOnSelect` | `boolean` | `true` | Accepted by the config type; **not read**. The dialog closes on confirm, cancel, `Escape`, or a click on the scrim |
| `isOpen` | `boolean` | `false` | Whether the dialog starts open |
| `cancelText` | `string` | `'Cancel'` | Text of the cancel button |
| `confirmText` | `string` | `'OK'` | Text of the confirm button |
| `clockIcon` | `string` | built-in | HTML for the "switch to dial" icon |
| `keyboardIcon` | `string` | built-in | HTML for the "switch to keyboard" icon |
| `container` | `string \| HTMLElement` | `document.body` | Where the dialog is appended |
| `class` | `string` | — | Extra CSS classes on the container |
| `prefix` | `string` | `'mtrl'` | Class-name prefix |
| `componentName` | `string` | `'time-picker'` | Component name used in class generation |

Callbacks are accepted alongside the event bus and fire in addition to the
corresponding event, if a single handler reads better than `on()`:

| Option | Type | Description |
|--------|------|-------------|
| `onChange` | `(time: string) => void` | The time changed |
| `onOpen` | `() => void` | The dialog opened |
| `onClose` | `() => void` | The dialog closed |
| `onConfirm` | `(time: string) => void` | The user pressed the confirm button |
| `onCancel` | `() => void` | The user cancelled |

`TIME_PICKER_TYPE`, `TIME_FORMAT`, `TIME_PICKER_ORIENTATION` and `TIME_PERIOD`
are exported as enums, so `format: TIME_FORMAT.MILITARY` reads better than
`'24h'` at a call site. They come from the component, not the package root:
`import { TIME_FORMAT } from 'mtrl/components/timepicker'`. Only `createTimePicker`
and the types are re-exported from `'mtrl'`.

## Component API

| Property | Type | Description |
|----------|------|-------------|
| `element` | `HTMLElement` | The component's own container |
| `modalElement` | `HTMLElement` | The full-screen scrim. Clicking it closes the picker |
| `dialogElement` | `HTMLElement` | The dialog surface holding the title, dial and buttons |
| `isOpen` | `boolean` | **Stale.** It is copied from the `isOpen` config once, at construction, and never updated by `open()`/`close()`. Track the state from the `open` and `close` events instead |

### Visibility

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `open()` | none | `TimePickerComponent` | Opens the dialog and emits `open` |
| `close()` | none | `TimePickerComponent` | Closes the dialog and emits `close` |
| `toggle()` | none | `TimePickerComponent` | Opens or closes, whichever applies |

### Value

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getValue()` | none | `string` | Formatted per `format`, and **always with seconds**, regardless of `showSeconds`: `"14:30:00"` in `'24h'`, `"02:30:00 PM"` in the default `'12h'` |
| `setValue(time)` | `time: string` | `TimePickerComponent` | Sets the time from a 24-hour `HH:MM` or `HH:MM:SS` string, and emits `change`. An out-of-range or unparseable string is logged to the console and ignored, not thrown |
| `getTimeObject()` | none | `TimeValue` | `{ hours, minutes, seconds, period }`, with `hours` always 0-23. Use this, not `getValue()`, when you need the value rather than the display |

### Appearance

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setType(type)` | `type: TIME_PICKER_TYPE` | `TimePickerComponent` | Switches between dial and numeric input |
| `getType()` | none | `TIME_PICKER_TYPE` | The current type |
| `setFormat(format)` | `format: TIME_FORMAT` | `TimePickerComponent` | Switches between 12- and 24-hour display |
| `getFormat()` | none | `TIME_FORMAT` | The current format |
| `setOrientation(orientation)` | `orientation: TIME_PICKER_ORIENTATION` | `TimePickerComponent` | Switches the dialog layout |
| `getOrientation()` | none | `TIME_PICKER_ORIENTATION` | The current orientation |
| `setTitle(title)` | `title: string` | `TimePickerComponent` | Replaces the dialog title |
| `getTitle()` | none | `string` | The current title |

### Events and lifecycle

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `on(event, handler)` | `event: string, handler: Function` | `TimePickerComponent` | Adds an event listener |
| `off(event, handler)` | `event: string, handler: Function` | `TimePickerComponent` | Removes an event listener |
| `destroy()` | none | `void` | Tears the component down and removes the dialog from the DOM |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `change` | `string` | The time changed, as the user drags the dial or types. Fires many times during a drag |
| `confirm` | `string` | The confirm button was pressed |
| `cancel` | none | The cancel button was pressed, or `Escape` closed the dialog |
| `open` | none | The dialog opened |
| `close` | none | The dialog closed |

Payloads here are the bare time string, not an object — `on('confirm', (time) =>
…)`, not `({ value })`. It is the same string `getValue()` returns, so it
carries the AM/PM suffix under the default `'12h'` format; call
`picker.getTimeObject()` in the handler if you want numbers. Use `confirm` to
commit the value and `change` only if you want a live preview.

`cancel` is emitted by the cancel button and by `Escape`, but **not** by a click
on the scrim, which closes the dialog with only `close`.

## Examples

### Opening from your own field

The pattern the showcase uses throughout: a read-only input that opens the
picker, updated when the user confirms.

```javascript
const timePicker = createTimePicker({
  title: 'Select Time',
  value: '14:30'
});

const timeInput = document.createElement('input');
timeInput.type = 'text';
timeInput.readOnly = true;
timeInput.placeholder = 'Click to select time';

timeInput.addEventListener('click', () => timePicker.open());

// getTimeObject() is format-independent; getValue() is not
timePicker.on('change', () => {
  const { hours, minutes } = timePicker.getTimeObject();
  const period = hours >= 12 ? 'PM' : 'AM';
  const padded = String(minutes).padStart(2, '0');
  timeInput.value = `${hours % 12 === 0 ? 12 : hours % 12}:${padded} ${period}`;
});
```

### 24-hour display, with seconds

```javascript
import { TIME_FORMAT } from 'mtrl/components/timepicker';

createTimePicker({
  title: 'Select Time',
  value: '15:30:45',
  format: TIME_FORMAT.MILITARY,
  showSeconds: true
});
```

The dial grows an inner ring in 24-hour mode, drawn as 13-23 plus `0` in place
of 24; in 12-hour mode it shows 1-12 with an AM/PM selector beside the fields.

### Constraining the choice

The showcase passes `minTime` and `maxTime` for a business-hours picker, and the
config type accepts them, but nothing in the component reads them yet — the dial
will happily land on 3am. `utils.ts` exports an `isTimeInRange` helper that does
the comparison; until the component wires it up, validate on confirm:

```javascript
const meeting = createTimePicker({
  title: 'Schedule Meeting',
  value: '09:00',
  minTime: '09:00',   // recorded in the config, not enforced
  maxTime: '17:00'
});

meeting.on('confirm', () => {
  const { hours, minutes } = meeting.getTimeObject();
  const asMinutes = hours * 60 + minutes;
  if (asMinutes < 9 * 60 || asMinutes > 17 * 60) {
    showError('Pick a time between 9am and 5pm');
    return;
  }
  console.log('Meeting at', hours, minutes);
});
```

Compare the numbers from `getTimeObject()`, not the `confirm` string: that
string is `"09:00:00 AM"` under the default format, so a `time < '09:00'`
comparison — which an earlier version of this page recommended — is wrong in
both directions. `minuteStep` is inert in the same way `minTime` is, so round
the value yourself if you need fixed slots.

### Starting in keyboard-entry mode

```javascript
import { TIME_PICKER_TYPE } from 'mtrl/components/timepicker';

createTimePicker({
  title: 'Arrival',
  type: TIME_PICKER_TYPE.INPUT
});
```

Either mode can be switched to from the other with the icon button in the
dialog's bottom-left corner, so this only sets the starting point.

## Accessibility

**What the component sets for you**

- `role="dialog"`, `aria-modal="true"` and `aria-labelledby` — but on
  `picker.element`, the component's own container, which the component never
  inserts into the page. The elements that *are* in the document are the scrim
  (`modalElement`, appended to `container`) and the dialog surface
  (`dialogElement`) inside it, and `dialogElement` carries no role at all. So a
  screen reader is presented with an unlabelled generic box, not a modal dialog.
  Put the semantics where the user will meet them:

  ```javascript
  picker.dialogElement.setAttribute('role', 'dialog');
  picker.dialogElement.setAttribute('aria-modal', 'true');
  picker.dialogElement.setAttribute('aria-labelledby', 'mtrl-time-picker-title');
  ```

  The title element does get `id="mtrl-time-picker-title"`, and only exists when
  you pass `title`, so pass one. That id is fixed, not per-instance, so two
  pickers on a page produce duplicate ids.
- `role="presentation"` on the scrim.
- `role="button"`, `tabindex="0"` and `aria-pressed` on the AM and PM controls,
  kept in sync as the period changes.
- `aria-label` on the type-toggle button, updated to say what it will switch to
  ("Switch to keyboard input" / "Switch to dial selector").
- `Escape` closes the dialog and emits `cancel`, bound on `document` while the
  picker is open.
- Clicking the scrim closes the dialog.

**What you still have to supply**

- **A `title`.** Without one the `aria-labelledby` points at an element that was
  never created, and the dialog is announced with no name.
- **The dialog role itself**, as above.
- **A labelled trigger.** The component renders no field, so the input or button
  that opens it is yours, and so is its label.
- **Focus management.** Focus is not moved into the dialog when it opens, not
  trapped inside it while it is open, and not returned to the trigger when it
  closes. If keyboard operation matters, do this yourself around `open()` and
  `close()`:

  ```javascript
  picker.on('open', () => picker.dialogElement.focus());
  picker.on('close', () => trigger.focus());
  ```

- **Keyboard operation of the dial.** The clock face is drawn on a `<canvas>`
  and driven by pointer events; there is no keyboard equivalent. The numeric
  fields are the accessible path, so leave the type toggle in place, or set
  `type: 'input'` where keyboard access is the priority.
- An announcement of the chosen time, if you want one. Nothing is announced as
  the dial moves.

## Styling

```css
.mtrl-time-picker { /* the component container */ }
.mtrl-time-picker--open { }
.mtrl-time-picker-modal { /* the scrim; .active fades it in */ }
.mtrl-time-picker-dialog { /* the surface */ }
.mtrl-time-picker-dialog--dial { }
.mtrl-time-picker-dialog--input { }
.mtrl-time-picker-dialog--vertical { }
.mtrl-time-picker-dialog--horizontal { }
.mtrl-time-picker-dialog--12h { }
.mtrl-time-picker-dialog--24h { }

.mtrl-time-picker-title { }
.mtrl-time-picker-period { }
.mtrl-time-picker-period-am { }
.mtrl-time-picker-period-pm { }
.mtrl-time-picker-period--selected { }
.mtrl-time-picker-dial { }
.mtrl-time-picker-dial-canvas { }

/* the numeric fields, used by both modes */
.mtrl-time-picker-input-container { }
.mtrl-time-picker-hours { }
.mtrl-time-picker-minutes { }
.mtrl-time-picker-seconds { }
.mtrl-time-picker-separator { }

.mtrl-time-picker-actions { }
.mtrl-time-picker-toggle-type { }
.mtrl-time-picker-cancel { }
.mtrl-time-picker-confirm { }
```

The dial is a canvas, so its colours are read from the theme in JavaScript
rather than set in CSS; restyling it means re-theming, not overriding these
classes.

## Measurements

No M3 token is named anywhere in the timepicker source, so the table cites the
declaration each value comes from — `CLOCK_CONSTANTS` in
`mtrl/src/components/timepicker/clockdial.ts` for the canvas, and
`mtrl/src/styles/components/_timepicker.scss` for the rest.

Read the dial numbers from `clockdial.ts`, not from the exported
`TIMEPICKER_DIAL`: `CLOCK_CONSTANTS` spreads that object and then overrides
`OUTER_RADIUS`, `INNER_RADIUS`, `NUMBER_SIZE` and `TRACK_WIDTH` with different
values, and never reads its `HAND_SIZE` at all. Only `DIAMETER` and
`CENTER_SIZE` survive from the exported constant.

| Attribute | Value | Source |
|-----------|-------|--------|
| Dialog width | 280px min, 328px max | `.mtrl-time-picker-dialog` |
| Dialog max height | 520px | `.mtrl-time-picker-dialog { max-height }` |
| Dialog corner | `get-shape('extra-large')`, 28px | `border-radius: f.get-shape('extra-large')` |
| Horizontal dialog | 520 x 360px minimum | `--horizontal` rules |
| Dial diameter | 256px | `TIMEPICKER_DIAL.DIAMETER`, used by `render.ts` for the canvas |
| Dial outer radius | 100px | `CLOCK_CONSTANTS.OUTER_RADIUS` |
| Dial inner radius (24h) | 75px | `CLOCK_CONSTANTS.INNER_RADIUS` |
| Dial number size | 24px | `CLOCK_CONSTANTS.NUMBER_SIZE` |
| Selection hand | 45px knob, 2px hand | `KNOB_SIZE`, `HAND_WIDTH` |
| Centre dot | 8px | `CLOCK_CONSTANTS.CENTER_SIZE` |
| Time field | 96 x 80px | `.mtrl-time-picker-hours` / `-minutes` / `-seconds` |
| Field corner | `get-shape('small')`, 8px | `border-radius: f.get-shape('small')` |
| Time display type | title-medium | `@include m.typography('title-medium')` |
| Title type | title-small | `@include m.typography('title-small')` |
| Minimum touch target | 48px under 600px wide | `@media (max-width: 599px)` |
