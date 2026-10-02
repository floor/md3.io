---
created: 2026-09-21
updated: 2026-09-30
status: published
---

# Form

A form builds a set of fields from a layout, and keeps their data: it reads and sets it,
knows when it has changed, validates it and submits it. M3 has no form component; its fields
are mtrl's, such as [text fields](/docs/components/text-field/), and M3's guidance for them
applies.

From **material-addons**, checked against 3.0.0-next.0. material-addons has no web components, and a
form's layout names mtrl's factories, which the neutral examples cannot, so these examples are
plain JavaScript: the vanilla factory, which works in any framework.

## Usage

The layout is an array of `[factory, name, options]`. A field named `info.<key>` (or
`data.<key>`) is the data's `<key>`; buttons named `submit` and `cancel` submit and reset the
form, and are enabled while its data differs from what it started with.

```javascript
import { createForm } from 'material-addons';
import { createTextField, createSwitch, createButton } from 'material';

const form = createForm({
  layout: [
    [createTextField, 'info.name', { label: 'Name' }],
    [createTextField, 'info.email', { label: 'Email', type: 'email' }],
    [createSwitch, 'info.newsletter', { label: 'Newsletter' }],
    [createButton, 'cancel', { text: 'Cancel', variant: 'text' }],
    [createButton, 'submit', { text: 'Save', variant: 'filled' }],
  ],
  data: { name: 'Ada', email: 'ada@example.com', newsletter: true },
  onSubmit: (data) => myApi.saveUser(data),
  container: document.body,
});
```

A layout item can also be an element, `['section', { class: 'details' }, ...children]`, to
group the fields.

## Examples

### Validation

Each rule validates one field's value, with all the data at hand: it returns `true`, or a
message. `validate()` shows the messages on the fields, and `submit()` validates first.

```javascript
import { createForm } from 'material-addons';
import { createTextField } from 'material';

const form = createForm({
  layout: [
    [createTextField, 'info.password', { label: 'Password', type: 'password' }],
    [createTextField, 'info.confirm', { label: 'Confirm password', type: 'password' }],
  ],
  validation: [
    { field: 'password', validate: (value) => String(value ?? '').length >= 8 || 'At least 8 characters' },
    { field: 'confirm', validate: (value, data) => value === data.password || 'The passwords differ' },
  ],
  container: document.body,
});

const { valid, errors } = form.validate();
```

### Submitting

With `action`, `submit()` sends the data as JSON with `fetch`, by `method` (`POST` by
default); `onSubmit` replaces the request. While it submits, the controls are disabled.

```javascript
import { createForm } from 'material-addons';
import { createTextField, createButton } from 'material';

const form = createForm({
  action: '/api/profile',
  method: 'PUT',
  layout: [
    [createTextField, 'info.city', { label: 'City' }],
    [createButton, 'submit', { text: 'Save', variant: 'filled' }],
  ],
  container: document.body,
});

form.on('submit:success', () => router.go('/profile'));
```

### Loading data

`setData(data, true)` sets the data as the new starting point, so the form is not modified.
`setData(data)` changes it as an edit would.

```javascript
import { createForm } from 'material-addons';
import { createTextField } from 'material';

const form = createForm({
  layout: [[createTextField, 'info.name', { label: 'Name' }]],
  container: document.body,
});

form.setData({ name: 'Grace' }, true);
```

`protectChanges` guards unsaved changes: `beforeUnload` asks before the page is left, and
`onDataOverwrite` blocks clicks outside the form and emits `data:conflict`, whose `cancel()`
keeps the changes and `proceed()` discards them. Recipes such as an account form or a sign-in
form are planned for [Examples](/examples/).

## API

<!-- API: generated from material-addons' types in a later step. Until then these tables are
hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `layout` | `LayoutSchema` | `undefined` | The fields, buttons and elements |
| `data` | `FormData` | `undefined` | The data it starts with |
| `container` | `HTMLElement` | `undefined` | Where it is mounted |
| `action` | `string` | `undefined` | Where `submit()` sends the data |
| `method` | `'GET' \| 'POST' \| 'PUT' \| 'PATCH' \| 'DELETE'` | `'POST'` | How it sends it |
| `onSubmit` | `(data, form) => Promise<unknown>` | `undefined` | Submits in place of the request |
| `onCancel` | `(form) => void` | `undefined` | Runs on `cancel` in place of `reset()` |
| `controls` | `string[] \| null` | `['submit', 'cancel']` | The buttons it wires; `null` wires none |
| `useChanges` | `boolean` | `true` | Enables the controls only while the data has changed |
| `validation` | `FormValidationRule[]` | `[]` | `{ field, validate(value, data), message? }`: `validate` returns `true` or a message |
| `showFieldErrorMessages` | `boolean` | `true` | Shows a message on its field, or only the error state |
| `protectChanges` | `boolean \| { beforeUnload?, onDataOverwrite? }` | `false` | Guards unsaved changes; `true` is both |
| `sysinfo` | `string[]` | `[]` | Fields left out of the data |
| `autocomplete` | `'on' \| 'off'` | `'off'` | The form's `autocomplete` |
| `on` | `FormEventHandlers` | `undefined` | Event handlers registered at creation |
| `class` | `string` | `undefined` | Additional CSS classes |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getData()` / `setData(data, silent?)` | `data: FormData, silent?: boolean` | `FormData` / `FormComponent` | The data; `silent` sets it as the starting point |
| `getFieldValue(name)` / `setFieldValue(name, value, silent?)` | `name: string, value: FieldValue` | `FieldValue` / `FormComponent` | One field's value |
| `getField(name)` / `getFieldNames()` | `name: string` | `FormField \| undefined` / `string[]` | The fields |
| `isModified()` / `getDataState()` | none | `boolean` / `'pristine' \| 'dirty'` | Whether the data differs from its starting point |
| `snapshot()` | none | `void` | Makes the current data the starting point |
| `reset(force?)` / `clear(force?)` | `force?: boolean` | `boolean` | Back to the starting point, or empty; `false` when change protection stopped it |
| `validate()` / `validateField(name)` | `name: string` | `{ valid, errors }` / `string \| undefined` | Validates, and shows the messages |
| `getFieldError(name)` / `setFieldError(name, message)` / `clearFieldError(name)` / `clearErrors()` | `name: string, message: string` | `string \| undefined` / `FormComponent` | The errors |
| `submit(options?)` | `{ method?, headers?, validate?, handler? }` | `Promise<unknown>` | Validates, unless `validate: false`, and submits |
| `enable()` / `disable()` | none | `FormComponent` | Every field |
| `enableControls()` / `disableControls()` | none | `FormComponent` | The `submit` and `cancel` buttons |
| `on(event, handler)` / `off(event, handler)` / `emit(event, data?)` | `event: string` | `FormComponent` / `void` | Listeners, and events of your own |
| `destroy()` | none | `void` | Removes it |

| Property | Type | Description |
|----------|------|-------------|
| `element` | `HTMLElement` | The root |
| `form` | `HTMLFormElement` | The `<form>` inside it |
| `ui` | `Record<string, unknown>` | Every named component of the layout |
| `fields` | `Map<string, FormField>` | The data's fields |
| `state` | `FormState` | `{ modified, submitting, disabled, initialData, currentData, errors }` |

`DATA_STATE` and `FORM_EVENTS` are in `material-addons/components/form/constants`.

### Events

| Event | Description | Data |
|-------|-------------|------|
| `change` / `field:change` | A field changed | `{ name, value }` |
| `state:change` | The data became modified, or not | `{ modified, state }` |
| `data:set` / `data:get` | `setData()` or `getData()` was called | the data |
| `submit` | It is submitting | the data |
| `submit:success` / `submit:error` | It submitted, or failed | the response / the error |
| `validation:error` | Validation failed | `{ [field]: message }` |
| `reset` | It was reset | none |
| `data:conflict` | Protected changes were about to be lost | `{ currentData, newData, cancelled, cancel(), proceed() }` |

## Accessibility

- A native `<form>`; each field keeps its own semantics, label and keyboard.
- A validation message is the field's supporting text, and its error state its
  `aria-invalid`.
- `Enter` in a field does not submit the form: submitting is the `submit` button's, or
  `submit()`.

## Styling

```css
.mtrl-form { }
.mtrl-form--modified, .mtrl-form--submitting { }
```
