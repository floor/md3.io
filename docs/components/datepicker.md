# DatePicker

A date picker pairs a read-only text input with a calendar, so a date is chosen
from a grid rather than typed into a format the user has to guess. Reach for it
when the value is a calendar date and its context — the day of the week, what is
nearby, what is out of range — matters. It selects either a single date or a
range, and appears docked under the field or as a modal dialog.

## Import

```javascript
import { createDatePicker } from 'mtrl';
```

To pull in only this component, import it directly instead: `import createDatePicker from 'mtrl/components/datepicker'`.

## Basic Usage

```javascript
const picker = createDatePicker({
  label: 'Select Date',
  placeholder: 'MM/DD/YYYY'
});

document.querySelector('.form').appendChild(picker.element);

picker.on('change', ({ formattedValue }) => {
  console.log('Date selected:', picker.getValue());
  console.log('Formatted date:', formattedValue);
});
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `variant` | `'docked' \| 'modal' \| 'modal-input'` | `'docked'` | How the calendar appears: inline under the field, or in a dialog |
| `selectionMode` | `'single' \| 'range'` | `'single'` | Pick one date, or a start and an end |
| `value` | `Date \| string \| [Date \| string, Date \| string]` | — | Initial selection. Pass a two-element array in range mode |
| `minDate` | `Date \| string` | — | Earliest selectable date |
| `maxDate` | `Date \| string` | — | Latest selectable date |
| `dateFormat` | `string` | `'MM/DD/YYYY'` | Format used to render the value in the input |
| `initialView` | `'day' \| 'month' \| 'year'` | `'day'` | The view the calendar opens on |
| `placeholder` | `string` | `dateFormat` | Input placeholder. Falls back to the format string |
| `disabled` | `boolean` | `false` | Renders the input non-interactive |
| `closeOnSelect` | `boolean` | `false` docked, `true` modal | Whether choosing a date closes the calendar |
| `animate` | `boolean` | `true` | Accepted by the config type; the current implementation does not read it |
| `label` | `string` | — | Accepted by the config type; **not rendered**. See Accessibility |
| `specialDates` | `Array<{ date, highlight?, disabled?, tooltip? }>` | — | Accepted by the config type; the current implementation does not read it |
| `class` | `string` | — | Extra CSS classes on the container |
| `prefix` | `string` | `'mtrl'` | Class-name prefix |
| `componentName` | `string` | `'datepicker'` | Component name used in class generation |

`dateFormat` understands `YYYY`, `MMMM` (January), `MMM` (Jan), `MM`, `DD` and
any literal characters between them, so `'MMMM D, YYYY'` and `'DD/MM/YYYY'` both
work. In range mode the input shows `start - end` in that format.

`DATEPICKER_VARIANTS`, `DATEPICKER_VIEWS` and `DATEPICKER_SELECTION_MODES` are
exported if you would rather not spell the strings.

## Component API

| Property | Type | Description |
|----------|------|-------------|
| `element` | `HTMLElement` | The container, holding the input and the calendar |
| `input` | `HTMLInputElement` | The read-only text input that shows the formatted value |
| `calendar` | `CalendarAPI` | Navigation for the calendar view, described below |
| `disabled` | `{ enable, disable, isDisabled }` | The underlying disabled feature |
| `lifecycle` | `{ destroy }` | Lifecycle hooks from the composition core |

### Selection

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getValue()` | none | `Date \| [Date, Date] \| null` | The selected date, the range as a pair, or `null` |
| `setValue(value)` | `value: Date \| string \| [Date \| string, Date \| string]` | `DatePickerComponent` | Sets the selection and updates the input |
| `getFormattedValue()` | none | `string` | The selection rendered with `dateFormat` |
| `clear()` | none | `DatePickerComponent` | Clears the selection and emits `change` with `value: null` |

### Visibility and constraints

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `open()` | none | `DatePickerComponent` | Opens the calendar |
| `close()` | none | `DatePickerComponent` | Closes the calendar |
| `setMinDate(date)` | `date: Date \| string` | `DatePickerComponent` | Changes the earliest selectable date |
| `setMaxDate(date)` | `date: Date \| string` | `DatePickerComponent` | Changes the latest selectable date |
| `enable()` | none | `DatePickerComponent` | Makes the picker interactive |
| `disable()` | none | `DatePickerComponent` | Makes the picker non-interactive |

### Calendar navigation

Reached through `picker.calendar`. These move the visible month or view without
changing the selection.

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `goToDate(date)` | `date: Date` | `void` | Shows the month containing that date |
| `nextMonth()` | none | `void` | Moves forward one month |
| `prevMonth()` | none | `void` | Moves back one month |
| `nextYear()` | none | `void` | Moves forward one year |
| `prevYear()` | none | `void` | Moves back one year |
| `showDayView()` | none | `void` | Switches to the day grid |
| `showMonthView()` | none | `void` | Switches to the month list |
| `showYearView()` | none | `void` | Switches to the year list |
| `getCurrentView()` | none | `string` | The view currently shown |

### Events and lifecycle

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `on(event, handler)` | `event: string, handler: Function` | `DatePickerComponent` | Adds an event listener |
| `off(event, handler)` | `event: string, handler: Function` | `DatePickerComponent` | Removes an event listener |
| `getClass(name)` | `name: string` | `string` | The prefixed class name |
| `destroy()` | none | `void` | Removes the calendar and runs the lifecycle teardown. It does **not** remove the `document` click listener that closes the calendar on an outside click — that listener is leaked per instance, so destroy sparingly or reuse one picker |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `change` | see below | The selection changed |
| `open` | `{ value }` | The calendar opened |
| `close` | `{ value }` | The calendar closed |

`value` here depends on what opened the calendar: `open()` and `close()` send
`getValue()` (a `[start, end]` pair when a range is complete), while a click on
the input sends the raw start date only. `getValue()` in the handler is the way
to avoid the difference.

The `change` payload has two shapes, depending on where the change came from —
worth knowing before you destructure it:

| Source | Payload |
|--------|---------|
| A click in the calendar | `{ value: Date, rangeEndDate: Date \| null, formattedValue: string }` — `value` is always the single start date, and the end of a range arrives as `rangeEndDate` |
| `setValue()` | `{ value, formattedValue }`, where `value` is whatever `getValue()` returns: a `Date`, or a `[start, end]` pair in range mode |
| `clear()` | `{ value: null, formattedValue: '' }` |

The reliable move in a handler is to ignore the payload's `value` and call
`picker.getValue()`, which normalises all three cases.

Note that `setValue()` and `clear()` both emit `change`, so a handler that
writes back into the picker needs a guard.

`DATEPICKER_EVENTS` also lists `select` and `viewChange`. Those names are used
internally between the renderer and the component; they are not emitted on the
public event bus, so do not listen for them.

## Examples

### A basic picker

```javascript
const datePicker = createDatePicker({
  label: 'Select Date',
  placeholder: 'MM/DD/YYYY'
});

container.appendChild(datePicker.element);

datePicker.on('change', (data) => {
  console.log('Date selected:', datePicker.getValue());
  console.log('Formatted date:', data.formattedValue);
});
```

### Constraining the range

The showcase builds three of these: future dates only, a window of one month,
and past dates only for a date of birth.

```javascript
const today = new Date();
const nextMonth = new Date();
nextMonth.setMonth(today.getMonth() + 1);

// Appointments: nothing in the past
createDatePicker({
  placeholder: 'Select a future date',
  minDate: today
});

// Vacation: inside a one-month window
createDatePicker({
  placeholder: 'Select within one month',
  minDate: today,
  maxDate: nextMonth
});
```

Dates outside `minDate`/`maxDate` are rendered disabled and cannot be clicked.

### Selecting a range

```javascript
import { DATEPICKER_SELECTION_MODES } from 'mtrl/components/datepicker/constants';

const rangePicker = createDatePicker({
  placeholder: 'Start - End Date',
  selectionMode: DATEPICKER_SELECTION_MODES.RANGE
});

rangePicker.on('change', () => {
  const value = rangePicker.getValue();
  if (!Array.isArray(value)) return; // only the start is chosen so far

  const [start, end] = value;
  const days = Math.round((end - start) / 86400000) + 1;
  console.log(`${days} days selected`);
});
```

The first click sets the start, the second completes the pair, and a third
starts a new range. Both clicks emit `change`, and the payload's `value` is the
start date either way — `getValue()` is what tells you whether the range is
complete, since it returns the pair only once both ends are set. Selecting a
date before the start swaps the two, so the range is never inverted.

### Variants

```javascript
import { DATEPICKER_VARIANTS } from 'mtrl/components/datepicker/constants';

// Docked: the calendar drops under the field
const docked = createDatePicker({
  placeholder: 'MM/DD/YYYY',
  variant: DATEPICKER_VARIANTS.DOCKED
});

// Modal: opened from your own trigger
const modal = createDatePicker({
  placeholder: 'Select date',
  variant: DATEPICKER_VARIANTS.MODAL
});

openButton.on('click', () => modal.open());
```

### A different format

```javascript
const picker = createDatePicker({
  placeholder: 'January 1, 2025',
  dateFormat: 'MMMM D, YYYY'
});

picker.setValue(new Date());
console.log(picker.getFormattedValue()); // "January 1, 2025"
```

## Accessibility

This component needs more from the consumer than the rest of the input family.
Read this section before shipping one.

**What the component sets for you**

- `role="application"` and `aria-label="Date Picker"` on the container, with
  `tabindex="-1"`.
- `role="dialog"` on the calendar, and `aria-modal="true"` for the modal
  variants (`"false"` when docked).
- `aria-label` on each day cell, from `toLocaleDateString()`, plus
  `aria-selected` and `aria-disabled`.
- `aria-label` on the month and year navigation buttons ("Select month",
  "Select year", and the previous/next controls).
- `readonly` on the input, so the calendar is the only way to change the value
  and a malformed string cannot be typed in.

**What you still have to supply**

- **A visible label and an accessible name.** `label` is accepted by the config
  type but nothing renders it, and the input has neither `id` nor `aria-label`.
  Supply both yourself:

  ```javascript
  const picker = createDatePicker({ placeholder: 'MM/DD/YYYY' });
  picker.input.id = 'departure-date';
  picker.input.setAttribute('aria-label', 'Departure date');
  // …and render your own <label for="departure-date">Departure date</label>
  ```

- **Arrow-key navigation and `Escape`.** The calendar is operable from the
  keyboard, but only one cell at a time: every day, month, year and navigation
  control is a real `<button type="button">`, so `Tab` reaches them and
  `Enter`/`Space` activates them, and out-of-range days carry the native
  `disabled` attribute so they are skipped. What is missing is the grid
  behaviour M3 specifies — the container forwards `keydown` but binds no
  handler, so there is no arrow-key movement between days, no `Home`/`End`, no
  `PageUp`/`PageDown` for months, and no `Escape` to close (click outside, or
  call `close()`). A 42-button tab stop per month is a long way to travel; add
  your own `keydown` handler on `picker.element` if that matters.
- **A live announcement of the selection**, if you want one. The input's value
  changes without any `aria-live` region.
- `aria-invalid` and error text; the component has neither.

`role="application"` tells a screen reader to pass keys through to the widget
rather than interpret them itself. Since the widget binds no keys of its own and
relies entirely on native button behaviour, that role buys nothing and costs the
reading commands a screen-reader user would otherwise have — worth overriding
with `picker.element.removeAttribute('role')` if your audit flags it.

## Styling

```css
.mtrl-datepicker-container { /* the root */ }
.mtrl-datepicker-input { /* the read-only field */ }
.mtrl-datepicker-calendar { /* the popup surface */ }
.mtrl-datepicker-docked { }
.mtrl-datepicker-modal { }
.mtrl-datepicker-modal-input { }
.mtrl-datepicker-range { /* added in range selection mode */ }

.mtrl-datepicker-calendar-content { /* rebuilt on every view change */ }
.mtrl-datepicker-header { }
.mtrl-datepicker-month-selector { /* the two view-switch buttons */ }
.mtrl-datepicker-year-selector { }
.mtrl-datepicker-nav-controls { /* holds -prev-btn and -next-btn */ }
.mtrl-datepicker-weekdays { }
.mtrl-datepicker-weekday { }
.mtrl-datepicker-days { }
.mtrl-datepicker-day { }
.mtrl-datepicker-months { }
.mtrl-datepicker-years { }
.mtrl-datepicker-footer { /* Cancel / OK, modal variants only */ }

/* Day states */
.mtrl-datepicker-day.today { }
.mtrl-datepicker-day.selected { }
.mtrl-datepicker-day.disabled { }
.mtrl-datepicker-day.outside-month { }
.mtrl-datepicker-day.range-start { }
.mtrl-datepicker-day.range-end { }
.mtrl-datepicker-day.range-middle { }
```

`DATEPICKER_CLASSES` exports most of these unprefixed, and the day-state names
(`today`, `selected`, `disabled`, `outside-month`, `range-*`) match what the
renderer emits. Two entries in it do not describe the DOM: `ROOT` is
`'datepicker'` while the root element is `mtrl-datepicker-container`, and
`NAVIGATION` is `'datepicker-navigation'` while the element is
`mtrl-datepicker-nav-controls`. The renderer itself reads its class names from
`types.ts`, not from that map.

## Measurements

No M3 token is named anywhere in the datepicker source, so the table cites the
declaration each value comes from in
`mtrl/src/styles/components/_datepicker.scss` instead of a token it cannot
prove.

| Attribute | Value | Source |
|-----------|-------|--------|
| Field width | 280px min, 360px max | `.mtrl-datepicker-container` |
| Input height | 40px | `.mtrl-datepicker-input { height }` |
| Input corner | 4px | `.mtrl-datepicker-input { border-radius }` |
| Calendar corner | `shape('large')`, 16px | `border-radius: v.shape('large')` |
| Calendar padding | 16px | header/body padding rules |
| Modal calendar width | 328px, capped at 90vw | `.mtrl-datepicker-modal` |
| Day cell | 40 x 40px, circular | `.mtrl-datepicker-day` |
| Day type | body-medium | `@include m.typography('body-medium')` |
| Weekday header | 40px tall, body-small | weekday rules |
| View-switch chip | `shape('full')`, title-small | header button rules |
| Month/year cell | 36px tall, `shape('medium')` | month and year view rules |
| Full-screen breakpoint | 600px | `@media (max-width: 600px)` |
