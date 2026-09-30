---
created: 2026-09-21
updated: 2026-09-30
status: published
---

# Date picker

A date picker lets people select a date, or a range of dates. M3 has four forms: a
**docked** calendar under its field, a **modal** dialog, a **modal date input** for typing,
and a **full-screen** picker, for compact screens and the usual form of a range. See the
[M3 date picker guidelines](https://m3.material.io/components/date-pickers/overview).

## Usage

The picker is a text field with a calendar button, which opens the calendar. In the dialog
forms a selection is a draft until **OK** (or **Save**); **Cancel**, **Close**, `Escape` and
the scrim discard it. `change` fires once a date is committed; dates before `minDate` or after
`maxDate` cannot be chosen.

```example
datepicker:
  label: Departure
  variant: modal
  value: 2026-10-02
  minDate: 2026-10-01
  on change: search(value)
```

## Examples

### A range, full screen

With `selectionMode: 'range'`, the first tap is the start and the second the end, and
**Save** commits both. A lone date given as the value is the one-day range.

```example
datepicker:
  label: Stay
  variant: fullscreen
  selectionMode: range
  value: [2026-10-02, 2026-10-05]
```

### Typing a date

`modal-input` opens on the keyboard entry, in `dateFormat`. The field rejects a date that does
not exist (02/30) or falls outside the limits, and **OK** stays disabled until the entry is
valid. The pencil and calendar buttons switch between typing and the calendar.

```example
datepicker:
  label: Birthday
  variant: modal-input
  dateFormat: DD/MM/YYYY
```

### Read-only

A read-only field keeps its value readable and focusable, as a native `readonly` input does,
and its calendar closed.

```example
datepicker:
  label: Check-in
  value: 2026-10-02
  readOnly: true
  supportingText: Set by your booking
```

With `required`, `checkValidity()` answers whether a date is missing, and `reportValidity()`
also marks the field invalid; the web component reports it to its form as `valueMissing`. The
factory's `specialDates` marks dates, or makes them unselectable, each with an optional tooltip.

Months swipe horizontally, by touch, trackpad or mouse wheel, and the arrows slide the same
way. Tapping the year opens every year from `minDate` to `maxDate` (1900 to 2100 without
limits). Full screen, the months are one vertical list that grows as it scrolls.

## API

<!-- API: generated from mtrl's types and <m-datepicker>'s spec in a later step. Until then these
tables are hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `variant` | `'docked' \| 'modal' \| 'modal-input' \| 'fullscreen'` | `'docked'` | The form: inline under the field, a dialog, a dialog opened on date entry, or the whole screen |
| `selectionMode` | `'single' \| 'range'` | `'single'` | One date, or a start and an end |
| `value` | `Date \| string \| [start, end] \| { start, end }` | `undefined` | The initial value; in range mode a pair, and a lone date the one-day range `[d, d]` |
| `label` | `string` | `'Select date'` | The field's label, and the dialog's title |
| `minDate` / `maxDate` | `Date \| string` | `undefined` | The first and last selectable dates |
| `dateFormat` | `string` | `'MM/DD/YYYY'` | How the field shows and reads dates (`YYYY`, `MM`, `M`, `DD`, `D`, `MMM`, `MMMM`) |
| `placeholder` | `string` | the format | The field's placeholder |
| `initialView` | `'day' \| 'month' \| 'year'` | `'day'` | The view the calendar opens on (not in full screen) |
| `closeOnSelect` | `boolean` | `false` | Commit and close on a selection, without OK |
| `specialDates` | `{ date, highlight?, disabled?, tooltip? }[]` | `[]` | Dates to mark, or to make unselectable |
| `disabled` | `boolean` | `false` | Whether the field starts disabled |
| `readOnly` | `boolean` | `false` | The value shows and cannot change: no typing, the calendar does not open, the calendar button is disabled |
| `required` | `boolean` | `false` | A date is required: set on the input for forms, and read by `checkValidity()` |
| `supportingText` | `string` | the format | The supporting text under the field; without it, the date format |
| `name` | `string` | `undefined` | The field's name, for forms |
| `animate` | `boolean` | `true` | Whether the dialog fades in |
| `class` | `string` | `undefined` | Additional CSS classes |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `open()` / `close()` | `DatePickerComponent` | Shows or hides the calendar |
| `getValue()` / `setValue(value)` | `Date \| null` (`[Date, Date] \| null` in range mode) / `DatePickerComponent` | The committed value; `setValue` takes what `value` does |
| `getFormattedValue()` | `string` | The value as the field shows it |
| `clear()` | `DatePickerComponent` | Clears the value |
| `setMinDate(date)` / `setMaxDate(date)` | `DatePickerComponent` | The limits |
| `enable()` / `disable()` | `DatePickerComponent` | Disabled state |
| `setReadOnly(readOnly)` / `isReadOnly()` | `DatePickerComponent` / `boolean` | Read-only state |
| `setRequired(required)` | `DatePickerComponent` | Whether a date is required |
| `checkValidity()` / `reportValidity()` | `boolean` | False when a required date is missing; `reportValidity()` also shows the error on the field |
| `setSupportingText(text)` | `DatePickerComponent` | The supporting text; `null` or `''` shows the format again |
| `calendar.goToDate(date)` / `nextMonth()` / `prevMonth()` / `nextYear()` / `prevYear()` | `void` | Moves the calendar without selecting |
| `calendar.showDayView()` / `showMonthView()` / `showYearView()` / `getCurrentView()` | `void` / `string` | The view |
| `on(event, handler)` / `off(event, handler)` | `DatePickerComponent` | Events |
| `destroy()` | `void` | Removes the picker |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `change` | `{ value, rangeEndDate, formattedValue, iso }` | The committed value changed: `value` as `getValue()` returns it, `rangeEndDate` a range's end (`null` otherwise), `iso` the value as ISO text |
| `open` / `close` | `{ value }` | The calendar opened or closed |

Every `change` has the same shape, whether the calendar, the field or `setValue()` committed
it; a docked range emits once, when both its dates are chosen. The web component's `change`
carries `{ value, date }`: `value` as an ISO date, `YYYY-MM-DD`, a range as
`YYYY-MM-DD/YYYY-MM-DD`, and empty as `''`, and `date` the `Date` form. So the factory's `value`
is a `Date` and its `iso` the text, while the web component's `value` is the text and its `date`
the `Date`.

## Accessibility

- The dialog forms are native modal dialogs: the page behind is inert, focus stays inside and
  returns to the field on close. The docked calendar is a non-modal dialog that closes when
  focus or a click leaves it.
- A month is a `grid` with weekday column headers; each day is a button named by its full
  date, the selection is `aria-selected` and today `aria-current="date"`. A live region
  announces the month and year as they change; months swiped out of view are inert.
- The calendar is one Tab stop: the arrows move by day and week, `Home` and `End` to the ends
  of the week, `Page Up` and `Page Down` by month, and by year with `Shift`. `Enter` or
  `Space` selects, `Escape` closes.
- The docked field takes typing; in the dialog forms the field opens the calendar.

## Styling

```css
.mtrl-datepicker { }                     /* the field and its calendar */
.mtrl-datepicker__calendar { }           /* the dialog */
.mtrl-datepicker--docked, .mtrl-datepicker--modal, .mtrl-datepicker--fullscreen, .mtrl-datepicker--range { }
.mtrl-datepicker__modal-header, .mtrl-datepicker__title, .mtrl-datepicker__headline { }
.mtrl-datepicker__track { }              /* the swiping months */
.mtrl-datepicker__list, .mtrl-datepicker__subhead { }  /* full screen */
.mtrl-datepicker__days, .mtrl-datepicker__weekday, .mtrl-datepicker__cell, .mtrl-datepicker__day { }
.mtrl-datepicker__day--today, .mtrl-datepicker__day--selected, .mtrl-datepicker__cell--range { }
.mtrl-datepicker__years, .mtrl-datepicker__year, .mtrl-datepicker__months, .mtrl-datepicker__month { }
.mtrl-datepicker__footer, .mtrl-datepicker__cancel, .mtrl-datepicker__confirm, .mtrl-datepicker__close, .mtrl-datepicker__save { }
```

## Measurements

From the M3 date picker specs and their tokens:

| Attribute | Value |
|-----------|-------|
| Field | Fills its container up to 360dp; 280dp where it shrinks to fit, as the text field (Compose `TextFieldDefaults.MinWidth`) |
| Modal | 360dp wide, `surface-container-high`, 28dp corners, elevation 3, a 0.32 scrim |
| Header | 120dp (128dp for a range); title Label Large, headline Headline Large (Title Large for a range) |
| Full screen | The viewport, no corners or elevation, a 128dp header with close (x) and Save, subheads Title Small |
| Weekdays and days | 48dp cells, Body Large; a 40dp round selection |
| Selected | `primary` with `on-primary` text; today has a 1dp `primary` outline |
| Range | A 40dp `secondary-container` band |
| Years | 3 columns, 72 × 36dp items |
| Motion | The months slide; the dialog fades in |
