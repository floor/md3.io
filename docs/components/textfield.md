# Textfield

A textfield collects free-form text: a name, an email address, a password, a
paragraph. It wraps a native `<input>` (or `<textarea>` for multiline) in the
Material 3 filled or outlined container, with a label that floats out of the way
when there is content, and optional icons, affixes and supporting text around
it. Reach for it whenever the answer cannot be picked from a list.

## Import

```javascript
import { createTextfield } from 'mtrl';
```

To pull in only this component, import it directly instead: `import createTextfield from 'mtrl/components/textfield'`.

## Basic Usage

```javascript
const username = createTextfield({
  label: 'Username',
  name: 'username'
});

document.querySelector('.form').appendChild(username.element);

username.on('input', ({ value }) => {
  console.log(value);
});
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | `'text' \| 'password' \| 'email' \| 'number' \| 'tel' \| 'url' \| 'search' \| 'multiline'` | `'text'` | Input type. `multiline` renders a `<textarea>` instead of an `<input>` |
| `variant` | `'filled' \| 'outlined'` | `'filled'` | Container style |
| `density` | `'default' \| 'compact'` | `'default'` | Row height: 56px, or 40px when compact |
| `label` | `string` | — | The floating label |
| `name` | `string` | — | Input `name` attribute, used for form submission |
| `value` | `string` | `''` | Initial value |
| `placeholder` | `string` | `' '` | Placeholder text. A single space is set when you omit it, so the CSS can tell an empty field from a filled one |
| `required` | `boolean` | `false` | Marks the input required for native form validation |
| `disabled` | `boolean` | `false` | Renders the field non-interactive |
| `readonly` | `boolean` | `false` | Accepted by the config type; set it yourself with `setAttribute('readonly', '')` |
| `maxLength` | `number` | — | Native `maxlength` |
| `pattern` | `string` | — | Native validation `pattern` |
| `autocomplete` | `string` | — | Native `autocomplete` token |
| `leadingIcon` | `string` | — | HTML (typically an inline `<svg>`) shown before the input |
| `trailingIcon` | `string` | — | HTML shown after the input |
| `prefixText` | `string` | — | Static text before the value, such as a currency sign |
| `suffixText` | `string` | — | Static text after the value, such as a unit |
| `supportingText` | `string` | — | Helper text under the field |
| `error` | `boolean` | `false` | Renders the field and its supporting text in the error style |
| `class` | `string` | — | Extra CSS classes on the root element |
| `prefix` | `string` | `'mtrl'` | Class-name prefix |
| `componentName` | `string` | `'textfield'` | Component name used in class generation |

## Component API

| Property | Type | Description |
|----------|------|-------------|
| `element` | `HTMLElement` | The root container |
| `input` | `HTMLInputElement \| HTMLTextAreaElement` | The native control |
| `leadingIcon` | `HTMLElement \| null` | The leading icon element, when one exists |
| `trailingIcon` | `HTMLElement \| null` | The trailing icon element, when one exists |
| `supportingTextElement` | `HTMLElement \| null` | The supporting-text element, when one exists |
| `prefixTextElement` | `HTMLElement \| null` | The prefix-text element, when one exists |
| `suffixTextElement` | `HTMLElement \| null` | The suffix-text element, when one exists |

### Value and attributes

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getValue()` | none | `string` | The input's current value |
| `setValue(value)` | `value: string` | `TextfieldComponent` | Sets the value and refreshes the empty/filled state |
| `setAttribute(name, value)` | `name: string, value: string` | `TextfieldComponent` | Sets an attribute on the input |
| `getAttribute(name)` | `name: string` | `string \| null` | Reads an attribute from the input |
| `removeAttribute(name)` | `name: string` | `TextfieldComponent` | Removes an attribute from the input |

### Appearance

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setVariant(variant)` | `variant: 'filled' \| 'outlined'` | `TextfieldComponent` | Switches the container style and re-runs positioning |
| `getVariant()` | none | `TextfieldVariant` | The current variant |
| `setDensity(density)` | `density: 'default' \| 'compact'` | `TextfieldComponent` | Switches the row height |
| `getDensity()` | none | `string` | The current density |
| `setLabel(text)` | `text: string` | `TextfieldComponent` | Replaces the floating label |
| `getLabel()` | none | `string` | The current label text |

### Icons and affixes

Each of these features is only added to the component when its option was passed
at creation. `setLeadingIcon()`, `setTrailingIcon()`, `setPrefixText()` and
`setSuffixText()` **silently do nothing** on a field built without
`leadingIcon`, `trailingIcon`, `prefixText` or `suffixText` — there is no error,
just no element. The features test the option for a truthy value, so an empty
string does not reserve the slot either: pass the real initial content at
creation if you intend to change it later.

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setLeadingIcon(html)` | `html: string` | `TextfieldComponent` | Replaces the leading icon's HTML. No-op unless `leadingIcon` was passed at creation |
| `removeLeadingIcon()` | none | `TextfieldComponent` | Removes the leading icon |
| `setTrailingIcon(html)` | `html: string` | `TextfieldComponent` | Replaces the trailing icon's HTML. No-op unless `trailingIcon` was passed at creation |
| `removeTrailingIcon()` | none | `TextfieldComponent` | Removes the trailing icon |
| `setPrefixText(text)` | `text: string` | `TextfieldComponent` | Replaces the prefix text. No-op unless `prefixText` was passed at creation |
| `removePrefixText()` | none | `TextfieldComponent` | Removes the prefix text |
| `setSuffixText(text)` | `text: string` | `TextfieldComponent` | Replaces the suffix text. No-op unless `suffixText` was passed at creation |
| `removeSuffixText()` | none | `TextfieldComponent` | Removes the suffix text |
| `updatePositions()` | none | `TextfieldComponent` | Recomputes label and input padding. Call it after you change the surroundings yourself — the setters above already do |

### Supporting text and errors

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setSupportingText(text, isError?)` | `text: string, isError?: boolean` | `TextfieldComponent` | Sets the helper text, optionally in the error style |
| `removeSupportingText()` | none | `TextfieldComponent` | Removes the helper text |
| `setError(error, message?)` | `error: boolean, message?: string` | `TextfieldComponent` | Toggles the error state, with optional supporting text |
| `isError()` | none | `boolean` | Whether the field is currently in the error state |

### State, events and lifecycle

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `enable()` | none | `TextfieldComponent` | Makes the field interactive |
| `disable()` | none | `TextfieldComponent` | Makes the field non-interactive |
| `on(event, handler)` | `event: string, handler: Function` | `TextfieldComponent` | Adds an event listener |
| `off(event, handler)` | `event: string, handler: Function` | `TextfieldComponent` | Removes an event listener |
| `destroy()` | none | `void` | Tears the component down and releases listeners |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `input` | `{ value, isEmpty, isAutofilled }` | The value changed as the user types, or the browser autofilled it |
| `change` | `{ value, isEmpty, isAutofilled }` | The native `change` event: the value was committed |
| `focus` | `{ isEmpty }` | The input took focus |
| `blur` | `{ isEmpty }` | The input lost focus |

Autofill is detected by watching for the WebKit autofill animation and attribute
changes, then emitted as `input` with `isAutofilled: true` — worth handling if
your form validates as it goes, since the browser fires no keystrokes.

## Examples

### Filled and outlined

The two variants the showcase puts side by side:

```javascript
const filled = createTextfield({
  label: 'Filled Input',
  placeholder: 'Type something...',
  variant: 'filled'
});

const outlined = createTextfield({
  label: 'Outlined Input',
  placeholder: 'Type something...',
  variant: 'outlined'
});
```

### Supporting text, and the same field in error

```javascript
const username = createTextfield({
  label: 'Username',
  variant: 'filled',
  supportingText: 'Between 3-20 characters'
});

const email = createTextfield({
  label: 'Email',
  type: 'email',
  variant: 'outlined',
  supportingText: 'Invalid email address',
  error: true
});
```

Validating on blur is the usual shape:

```javascript
email.on('blur', ({ isEmpty }) => {
  if (isEmpty) return email.setError(false);

  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.getValue());
  email.setError(!valid, valid ? '' : 'Enter a valid email address');
});
```

### Compact density

```javascript
createTextfield({
  label: 'Filled Input',
  variant: 'filled',
  density: 'compact'
});
```

### Prefix, suffix and icons

```javascript
const amount = createTextfield({
  label: 'Amount',
  type: 'number',
  prefixText: '$',
  suffixText: 'USD'
});

const search = createTextfield({
  label: 'Search',
  type: 'search',
  leadingIcon: '<svg viewBox="0 0 24 24" width="24" height="24">…</svg>'
});
```

### Multiline

```javascript
createTextfield({
  label: 'Multiline Input',
  placeholder: 'Type multiple lines...',
  type: 'multiline',
  variant: 'outlined'
});
```

### A password field with a reveal toggle

```javascript
const password = createTextfield({
  label: 'Password',
  type: 'password',
  variant: 'outlined',
  trailingIcon: eyeIcon
});

password.trailingIcon.addEventListener('click', () => {
  const hidden = password.getAttribute('type') === 'password';
  password.setAttribute('type', hidden ? 'text' : 'password');
  password.setTrailingIcon(hidden ? eyeOffIcon : eyeIcon);
});
```

## Accessibility

The component renders a real `<input>` or `<textarea>` and forwards `name`,
`required`, `maxlength`, `pattern` and `autocomplete` to it, so native
validation and password managers behave as expected.

**The label is the thing to watch.** The floating label is a `<label>` element
with no `for` attribute, and the input is given no `id` and no `aria-label`.
Visually the field is labelled; to a screen reader it is not. Give the input a
name yourself — the component hands you both the escape hatches:

```javascript
const email = createTextfield({ label: 'Email', type: 'email' });

// Simplest: mirror the visible label onto the input
email.setAttribute('aria-label', 'Email');

// Or associate an id with your own <label for="…"> elsewhere in the form
email.setAttribute('id', 'signup-email');
```

**What the component sets for you**

- The native attributes listed above, plus `disabled` when disabled.
- A `placeholder` of a single space when you pass none, so the empty state can
  be styled. It is invisible, and does not act as a label.
- The `--focused`, `--empty` and `--error` classes as the field's state changes.

**What you still have to supply**

- An accessible name, as above. This is the one thing the component cannot do
  for you and the one thing every field needs.
- `aria-invalid="true"` alongside `setError(true, …)`. The error state is
  currently visual only.
- `aria-describedby` pointing at the supporting text if you want it announced.
  The element exists — `field.supportingTextElement` — but is not referenced;
  give it an `id` and link it:

  ```javascript
  field.supportingTextElement.id = 'password-help';
  field.setAttribute('aria-describedby', 'password-help');
  ```

- A label for icon buttons you place in `trailingIcon`. HTML you pass in is
  inserted verbatim, so a clickable reveal or clear control needs its own
  `role="button"`, `tabindex` and `aria-label`.

Keyboard behaviour is entirely the browser's: `Tab` to reach the field, normal
text editing inside it, and `Enter` to submit the surrounding form (except in
`multiline`, where it inserts a newline).

## Styling

```css
.mtrl-textfield { /* root */ }
.mtrl-textfield--filled { }
.mtrl-textfield--outlined { }
.mtrl-textfield--density-compact { }
.mtrl-textfield--multiline { }

/* States */
.mtrl-textfield--focused { }
.mtrl-textfield--empty { }
.mtrl-textfield--error { }
.mtrl-textfield--disabled { }

/* Parts */
.mtrl-textfield-input { }
.mtrl-textfield-label { }
.mtrl-textfield-leading-icon { }
.mtrl-textfield-trailing-icon { }
.mtrl-textfield-prefix { /* prefixText; the element is `-prefix`, not `-prefix-text` */ }
.mtrl-textfield-suffix { }
.mtrl-textfield-helper { /* supportingText */ }
.mtrl-textfield-helper--error { }
```

Two class names that look like they should exist do not. There is no
`--floating` modifier on the label: the raised, shrunken position is applied by
CSS selectors on the input's state (`:focus ~ label`,
`:not(:placeholder-shown) ~ label`) and, for the filled variant, by the
`--focused` and `--empty` classes on the root — so there is no class to hook a
"is the label up?" style onto. There is no `.mtrl-textfield-outline` element
either: the outlined variant draws its border on the input itself, and the notch
is the label's own background colour, painted inline by JavaScript from the
inherited background. Note also that `TEXTFIELD_CLASSES` in the source still
names `textfield-supporting-text` and `textfield-outline`; the DOM does not.

Icon and affix padding is computed in JavaScript rather than fixed in CSS: the
`withPlacement` feature measures the icons and writes the input's padding and
the label's offset, which is why `updatePositions()` exists and why the setters
call it for you.

## Measurements

No M3 token is named anywhere in the textfield source, so the table cites the
declaration each value comes from in
`mtrl/src/styles/components/_textfield.scss` instead of a token it cannot prove.

| Attribute | Value | Source |
|-----------|-------|--------|
| Field height | 56px | `.mtrl-textfield-input { height }` |
| Field height, compact | 40px | `--density-compact` input rule |
| Container corner | 4px | `f.get-shape('extra-small')` |
| Filled corner | 4px top only | `border-radius: … … 0 0` on the filled variant |
| Input padding | 13px 16px | `.mtrl-textfield-input { padding }` |
| Filled input padding | 20px 16px 7px | filled variant input rule |
| Icon size | 24px, 20px inside it | leading/trailing icon rules |
| Icon size, compact | 20px, 16px inside it | `--density-compact` icon rules |
| Input padding with an icon | 44px on that side | `--with-leading-icon` / `--with-trailing-icon` input rules |
| Input padding with an affix | 48px on that side | `--with-prefix` / `--with-suffix` input rules (overwritten by `withPlacement` once measured) |
| Active indicator | 2px | filled variant indicator rule |
| Input type | body-large | `@include m.typography('body-large')` |
| Supporting text type | body-small | `@include m.typography('body-small')` |
| Multiline minimum height | 100px | `--multiline` input rule |
