# Date Picker Component

Date pickers let people select a date, or a range of dates. mtrl follows the four forms of Material 3: a **docked** calendar under its field, a **modal** dialog, a **modal date input** for typing, and a **full-screen** picker, recommended on compact screens and the usual form of a range.

## Import

```javascript
import { createDatePicker } from 'mtrl';
```

## Basic Usage

```javascript
const departure = createDatePicker({ label: 'Departure', variant: 'modal', minDate: new Date() });
departure.on('change', ({ value }) => search(value));
document.querySelector('.trip').append(departure.element);
```

The element is a text field with a calendar button. Opening the picker shows the calendar; in the dialog forms a selection is a draft until **OK** (or **Save**), and **Cancel**, **Close**, `Escape` or a click on the scrim discard it.

## Configuration

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

## Component API

| Method | Returns | Description |
|--------|---------|-------------|
| `open()` / `close()` | `DatePickerComponent` | Shows or hides the calendar |
| `getValue()` / `setValue(value)` | `Date \| null` (`[Date, Date] \| null` in range mode) / `DatePickerComponent` | The committed value; `setValue` takes what `value` does |
| `getFormattedValue()` | `string` | The value as the field shows it |
| `clear()` | `DatePickerComponent` | Clears the value |
| `setMinDate(date)` / `setMaxDate(date)` | `DatePickerComponent` | The bounds |
| `enable()` / `disable()` | `DatePickerComponent` | Disabled state |
| `setReadOnly(readOnly)` / `isReadOnly()` | `DatePickerComponent` / `boolean` | Read-only state |
| `setRequired(required)` | `DatePickerComponent` | Whether a date is required |
| `checkValidity()` / `reportValidity()` | `boolean` | False when a required date is missing; `reportValidity()` also shows the error on the field |
| `setSupportingText(text)` | `DatePickerComponent` | The supporting text; `null` or `''` shows the format again |
| `calendar.goToDate(date)` / `nextMonth()` / `prevMonth()` / `nextYear()` / `prevYear()` | `void` | Moves the calendar without selecting |
| `calendar.showDayView()` / `showMonthView()` / `showYearView()` / `getCurrentView()` | `void` / `string` | The view |
| `on(event, handler)` / `off(event, handler)` | `DatePickerComponent` | Events |
| `destroy()` | `void` | Removes the picker |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `change` | `{ value, rangeEndDate, formattedValue }` | The committed value changed: `value` as `getValue()` returns it, `rangeEndDate` a range's end (`null` otherwise) |
| `open` / `close` | `{ value }` | The calendar opened or closed |

Every `change` has the same shape, whether the calendar, the field or `setValue()` committed it. A docked range emits once, when both its dates are chosen.

## Navigating the calendar

- **Months** swipe horizontally, as the m3.material.io guidelines have it: a touch swipe, a trackpad or a mouse wheel pages to the neighbouring month, and the arrows slide the same way. With reduced motion, the arrows change the month at once.
- **Years**: tapping the year opens a list of every year from `minDate` to `maxDate` (1900 to 2100 without bounds), scrolling vertically, opened on the selected year.
- **Full screen**: the months form one vertically scrolling list, each under its month and year. The list grows as it is scrolled.

## Examples

### A range, full screen

```javascript
const stay = createDatePicker({
  label: 'Stay',
  variant: 'fullscreen',
  selectionMode: 'range',
  minDate: new Date()
});
stay.on('change', ({ value }) => {
  if (value) book(value[0], value[1]);
});
```

Tap the start date, then the end date; **Save** commits the range and the close (x) button discards it. With `selectionMode: 'range'`, TypeScript types the value as `[Date, Date] | null`; a lone date given to `setValue()` is the one-day range.

### Typing a date

```javascript
const birthday = createDatePicker({ label: 'Birthday', variant: 'modal-input', maxDate: new Date() });
```

The field rejects dates that do not exist (02/30) or fall outside the bounds, with an error message, and OK stays disabled until the entry is valid. The pencil and calendar buttons switch between typing and the calendar.

### A read-only or required field

```javascript
const checkIn = createDatePicker({ label: 'Check-in', value: '2026-10-02', readOnly: true, supportingText: 'Set by your booking' });
const expiry = createDatePicker({ label: 'Expiry', required: true });
form.addEventListener('submit', (event) => {
  if (!expiry.reportValidity()) event.preventDefault();
});
```

A read-only field keeps its value readable and focusable, as a native `readonly` input does, and its calendar closed. `checkValidity()` answers without showing anything; `reportValidity()` marks the field invalid and says what is missing.

### Unavailable dates

```javascript
const appointment = createDatePicker({
  variant: 'modal',
  specialDates: holidays.map(date => ({ date, disabled: true, tooltip: 'Closed' }))
});
```

## Accessibility

- The dialog forms are native modal dialogs: the page behind is inert, focus stays inside, and it returns to the field on close. The docked calendar is a non-modal dialog that closes when focus or a click leaves it.
- A month is a `grid` of its days with weekday column headers; each day is a button named by its full date, the selection is `aria-selected`, and today is `aria-current="date"`. A live region announces the month and year as they change.
- The calendar has one Tab stop. The arrow keys move by day and week, Home and End to the ends of the week, Page Up and Page Down by month, with Shift by year. Enter or Space selects, and Escape closes.
- Months not on show while swiping are inert and hidden from assistive tech.
- The field accepts typing in the docked form; the dialog forms open the calendar from it.

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

Following the m3.material.io date picker specs and their tokens, then Compose:

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
