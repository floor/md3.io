---
created: 2026-09-21
updated: 2026-09-30
status: published
---

# Time picker

A time picker asks for a time of day, on a clock dial or by typing it, in a modal dialog: a
meeting, an alarm, a delivery window. It renders no field of its own; the app opens it from
its own button or field, and shows the time where it likes. See the
[M3 time picker guidelines](https://m3.material.io/components/time-pickers/overview).

## Usage

The value is a 24-hour time, `HH:MM`, whatever the dial shows. While the picker is open, the
dial, the fields and AM/PM edit a draft: **OK** commits it, and **Cancel**, `Escape` or the
scrim discard it.

```example
timepicker:
  title: Select time
  value: '14:30'
  action pick: open
```

## Examples

### Seconds

`showSeconds` adds seconds to the dial, the fields and the value, `HH:MM:SS`.

```example
timepicker:
  title: Start
  value: '15:30:45'
  showSeconds: true
  action pick: open
```

### Limits and steps

`minTime` and `maxTime` bound the time; `minuteStep` and `secondStep` put it on a grid. On the
dial, what cannot be reached is disabled, and so is AM or PM when none of that half of the day
is allowed. A pick outside the limits moves to the nearest time inside, and a typed time is
held to them when it is committed; `setValue()` is not.

```example
timepicker:
  title: Meeting time
  value: '10:00'
  minTime: '09:00'
  maxTime: '17:30'
  minuteStep: 15
  action pick: open
```

`format: '24h'` shows a dial with two rings, 00–11 outside and 12–23 inside, and no AM/PM; the
value is 24-hour either way. `type: 'input'` starts on keyboard entry; the toggle in the
dialog switches between the two. `orientation: 'horizontal'` puts the dial beside the time.
The factory takes these as the `TIME_FORMAT`, `TIME_PICKER_TYPE` and
`TIME_PICKER_ORIENTATION` enums from `material/components/timepicker`; the web component takes
the strings. With `name`, the time is submitted with the form the picker's element is in.

## API

<!-- API: generated from mtrl's types and <m-timepicker>'s spec in a later step. Until then these
tables are hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `value` | `string` | the current time | Initial time, 24-hour `HH:MM` or `HH:MM:SS` |
| `type` | `TIME_PICKER_TYPE` (`'dial' \| 'input'`) | `'dial'` | Clock dial or keyboard entry. People can switch with the toggle in the dialog |
| `format` | `TIME_FORMAT` (`'12h' \| '24h'`) | `'12h'` | How the time is shown. The value is 24-hour either way |
| `orientation` | `TIME_PICKER_ORIENTATION` (`'vertical' \| 'horizontal'`) | `'vertical'` | The dialog's layout; horizontal puts the dial beside the time |
| `title` | `string` | — | The dialog's heading, and its accessible name |
| `showSeconds` | `boolean` | `false` | Adds seconds to the time and the value |
| `minTime` / `maxTime` | `string` | — | The earliest and latest selectable times, 24-hour `HH:MM` or `HH:MM:SS` |
| `minuteStep` / `secondStep` | `number` | `1` | The minute and second steps |
| `name` | `string` | — | Submits the value with a form the picker's element is in |
| `open` | `boolean` | `false` | Whether the dialog opens as soon as it is created |
| `disabled` | `boolean` | `false` | A disabled picker does not open |
| `cancelText` / `confirmText` | `string` | `'Cancel'` / `'OK'` | The action buttons |
| `clockIcon` / `keyboardIcon` | `string` | built-in | SVG for the mode toggle |
| `container` | `string \| HTMLElement` | the component's element | Where the dialog is appended. By default it stays in `picker.element`; `open()` puts that element in the page if you never did |
| `class` | `string` | — | Extra classes on the component's element |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |
| `onChange` | `({ value }) => void` | — | Called beside `change` |
| `onInput` | `({ value, draftValue }) => void` | — | Called beside `input` |
| `onConfirm` | `({ value }) => void` | — | Called beside `confirm` |
| `onCancel` / `onOpen` / `onClose` | `() => void` | — | Called beside the events |

### Methods

| Member | Returns | Description |
|--------|---------|-------------|
| `element` | `HTMLElement` | The component's element; holds the form value when `name` is set |
| `dialogElement` | `HTMLElement` | The native `<dialog>`. `modalElement` is the same element |
| `isOpen()` | `boolean` | Whether the dialog is open |
| `open()` / `close()` / `toggle()` | `TimePickerComponent` | Shows or hides the dialog |
| `getValue()` | `string` | The committed time, 24-hour `HH:MM` (or `HH:MM:SS`) |
| `setValue(time)` | `TimePickerComponent` | Sets the time from a 24-hour string; an invalid one is logged and ignored. Not held to `minTime` and `maxTime` |
| `getTimeObject()` | `TimeValue` | The committed time as `{ hours, minutes, seconds, period }`, `hours` 0–23 |
| `enable()` / `disable()` / `isDisabled()` | `TimePickerComponent` / `boolean` | Disabled state; `disable()` cancels an open picker |
| `setType(type)` / `getType()` | `TimePickerComponent` / `TIME_PICKER_TYPE` | Dial or keyboard entry |
| `setFormat(format)` / `getFormat()` | `TimePickerComponent` / `TIME_FORMAT` | 12- or 24-hour display |
| `setOrientation(o)` / `getOrientation()` | `TimePickerComponent` / `TIME_PICKER_ORIENTATION` | The layout |
| `setTitle(title)` / `getTitle()` | `TimePickerComponent` / `string` | The heading |
| `on(event, handler)` / `off(event, handler)` | `TimePickerComponent` | Events |
| `destroy()` | `void` | Closes the picker and removes it |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `input` | `{ value, draftValue }` | The draft changed while the picker is open: a pick on the dial (once, when a drag is released), a keystroke in a field, AM/PM. `value` is the committed time, `draftValue` the one shown |
| `change` | `{ value }` | The committed time changed: OK with a different draft, or `setValue` with a different time |
| `confirm` | `{ value }` | OK was pressed, after `change`, while the picker is still open |
| `cancel` | none | Cancel, `Escape` or a click on the scrim discarded the draft, while the picker is still open |
| `open` / `close` | none | The dialog opened or closed |

Changing the display format emits neither `input` nor `change`, and `setValue()` with the time
the picker already has emits nothing. The web component's `input` and `change` carry
the same `{ value }`; its value is `''` until a time is set or confirmed, and the first OK dispatches
`change` even on the time the dial started on.

## Accessibility

- A native modal `<dialog>`, named by its `title`: the page behind is inert, focus moves in
  when it opens and returns to the opener when it closes, and `Escape` or the scrim cancels.
- The dial is a listbox named Hour, Minute or Second, its numbers options named as times
  ("9 o'clock", "15 minutes"). The arrows move and wrap, `Home` and `End` go to the ends,
  `Enter` or `Space` selects; numbers outside the limits or off the step are `aria-disabled`.
- On the dial, the hour and minute boxes are a radiogroup with one Tab stop, and so are AM and
  PM. In keyboard entry, the fields are number inputs named Hour, Minute and Second.
- The mode toggle is a button named "Toggle input picker" or "Toggle dial picker".

## Styling

The dial is drawn in CSS from the theme's colors. Its hand, handle and the number under the
handle move together on `--mtrl-time-picker-angle` and `--mtrl-time-picker-radius`, which
spring the short way round; reduced motion turns the spring off.

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

## Measurements

From the M3 time picker specs and their tokens:

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
