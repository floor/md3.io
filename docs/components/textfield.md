---
created: 2026-09-21
updated: 2026-09-30
status: published
---

# Text field

A text field lets people enter free-form text: a name, an email address, a password, a
paragraph. Use one whenever the answer can't be picked from a list. It wraps a native
`<input>`, or a `<textarea>`, in the filled or outlined container, with a label that floats
out of the way, and optional icons, affixes and supporting text. See the
[M3 text fields guidelines](https://m3.material.io/components/text-fields/overview).

## Usage

`input` fires as the value changes, `change` when it is committed.

```example
textfield:
  label: Name
  name: name
  on change: save(value)
```

`variant` is `filled` (the default) or `outlined`; `density: 'compact'` lowers the field from
56 to 40dp. `type: 'multiline'` renders a `<textarea>`. Without a width from the page, a text
field is 280dp wide; any width you give it, or a stretching layout, wins.

## Examples

### Supporting text and errors

Supporting text sits under the field and describes it. An action sets the error state: the
field and its supporting text take the error colors, and the input gets `aria-invalid`.
`setError(true, message)` shows a message in place of the supporting text, and
`setError(false)` restores it.

```example
textfield:
  label: Email
  type: email
  variant: outlined
  supportingText: We never share it
  action invalid:
    set supportingText: Enter a valid email address
    set error: true
```

### A character counter

With `maxLength`, the supporting text row ends with a counter, `0/160`, that follows typing and
`setValue()`. A limit set or removed later on the input (`<m-textfield maxlength>` does this)
adds or removes it. It describes the input, so a screen reader hears it with the field, not on
every keystroke, and it takes the error color while the field is in error.

```example
textfield:
  label: Bio
  maxLength: 160
  supportingText: A line about you
```

### Affixes and icons

`prefixText` and `suffixText` sit beside the value, such as a currency and a unit;
`leadingIcon` and `trailingIcon` take SVG markup. Their setters create the slot when the field
was built without it.

```example
textfield:
  label: Amount
  type: number
  prefixText: $
  suffixText: USD
  leadingIcon: labelIcon
```

A password field with a reveal button, and validating an email as it is left, are planned for
[Examples](/examples/).

## API

<!-- API: generated from mtrl's types and <m-textfield>'s spec in a later step. Until then these
tables are hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | `'text' \| 'password' \| 'email' \| 'number' \| 'tel' \| 'url' \| 'search' \| 'multiline'` | `'text'` | Input type; `multiline` renders a `<textarea>` |
| `variant` | `'filled' \| 'outlined'` | `'filled'` | Container style |
| `density` | `'default' \| 'compact'` | `'default'` | Field height: 56dp, or 40dp when compact |
| `label` | `string` | `undefined` | The floating label |
| `name` | `string` | `undefined` | The input's `name`, for forms |
| `value` | `string` | `''` | Initial value |
| `placeholder` | `string` | `' '` | Placeholder text; a single space when omitted, so the CSS can tell an empty field |
| `required` | `boolean` | `false` | The input's `required` |
| `disabled` | `boolean` | `false` | Renders the field non-interactive |
| `readonly` | `boolean` | `false` | The input's `readonly` |
| `maxLength` | `number` | `undefined` | The input's `maxlength`, and a character counter |
| `pattern` | `string` | `undefined` | The input's validation `pattern` |
| `autocomplete` | `string` | `undefined` | The input's `autocomplete` token |
| `leadingIcon` | `string` | `undefined` | HTML, usually an SVG, before the input |
| `trailingIcon` | `string` | `undefined` | HTML after the input |
| `trailingIconLabel` | `string` | `undefined` | Makes the trailing icon a button with this accessible name, emitting `trailing` when activated; without it the icon is decorative |
| `prefixText` | `string` | `undefined` | Static text before the value |
| `suffixText` | `string` | `undefined` | Static text after the value |
| `supportingText` | `string` | `undefined` | Helper text under the field |
| `error` | `boolean` | `false` | The error state |
| `class` | `string` | `undefined` | Extra CSS classes on the root |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `element` | `HTMLElement` | The root: the field, then the supporting text row |
| `field` | `HTMLElement` | The container under the root: label, input, outline, icons and affixes. Anchor popovers to it, not to the root, so the supporting text row never pushes them down |
| `input` | `HTMLInputElement \| HTMLTextAreaElement` | The native control |
| `leadingIcon` / `trailingIcon` | `HTMLElement \| null` | The icon elements, when they exist |
| `supportingTextElement` | `HTMLElement \| null` | The supporting text on screen, when there is one |
| `prefixTextElement` / `suffixTextElement` | `HTMLElement \| null` | The affix elements, when they exist |

### Methods

#### Value and attributes

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getValue()` / `setValue(value)` | `value: string` | `string` / `TextFieldComponent` | The input's value; setting it refreshes the empty state |
| `setAttribute(name, value)` / `getAttribute(name)` / `removeAttribute(name)` | `name: string, value: string` | `TextFieldComponent` / `string \| null` | An attribute of the input |

#### Appearance

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setVariant(variant)` / `getVariant()` | `variant: 'filled' \| 'outlined'` | `TextFieldComponent` / `'filled' \| 'outlined'` | The container style |
| `setDensity(density)` / `getDensity()` | `density: 'default' \| 'compact'` | `TextFieldComponent` / `string` | The field height |
| `setLabel(text)` / `getLabel()` | `text: string` | `TextFieldComponent` / `string` | The floating label |

#### Icons and affixes

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setLeadingIcon(html)` / `removeLeadingIcon()` | `html: string` | `TextFieldComponent` | The leading icon |
| `setTrailingIcon(html, label?)` / `removeTrailingIcon()` | `html: string, label?: string` | `TextFieldComponent` | The trailing icon; `label` makes it a button with that accessible name |
| `setPrefixText(text)` / `removePrefixText()` | `text: string` | `TextFieldComponent` | The prefix text |
| `setSuffixText(text)` / `removeSuffixText()` | `text: string` | `TextFieldComponent` | The suffix text |
| `updatePositions()` | none | `TextFieldComponent` | Recomputes the label and input padding, after you change the surroundings yourself; the setters above do it |

#### Supporting text and errors

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setSupportingText(text, isError?)` / `removeSupportingText()` | `text: string, isError?: boolean` | `TextFieldComponent` | The helper text, optionally in the error style |
| `setError(error, message?)` | `error: boolean, message?: string` | `TextFieldComponent` | The error state, with an optional message in place of the helper text |
| `isError()` | none | `boolean` | Whether the field is in error |

#### State, events and lifecycle

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `enable()` / `disable()` | none | `TextFieldComponent` | The disabled state |
| `on(event, handler)` / `off(event, handler)` | `event: string, handler: Function` | `TextFieldComponent` | Adds or removes a listener |
| `destroy()` | none | `void` | Tears the component down and releases listeners |

### Events

| Event | Description | Data |
|-------|-------------|------|
| `input` | The value changed as the user types, or the browser autofilled it | `{ value, isEmpty, isAutofilled }` |
| `change` | The value was committed | `{ value, isEmpty, isAutofilled }` |
| `focus` / `blur` | The input took or lost focus | `{ isEmpty }` |

Autofill fires no keystrokes: it is detected and emitted as `input` with
`isAutofilled: true`. The web component's `input` and `change` carry `{ value }`.

## Accessibility

- The label is a `<label for>` pointing at the input, so it names the field and a click on it
  focuses the input.
- `aria-describedby` names the supporting text and the counter while they are shown, merged
  with ids you set yourself; `aria-invalid="true"` marks the error state.
- `name`, `required`, `readonly`, `maxlength`, `pattern` and `autocomplete` reach the native
  input, so native validation and password managers work.
- The default placeholder, a single space, is invisible and is not a label; a placeholder you
  pass shows while the field is focused or has no label.
- Icon HTML is inserted as it is: a clickable reveal or clear icon needs its own
  `role="button"`, `tabindex` and `aria-label`.
- The keyboard is the browser's: `Enter` submits the form, except in `multiline`.

## Styling

The root holds two children: the field, then the supporting text row, which exists only while
it holds a helper or a counter.

```text
.mtrl-textfield                root (element)
├─ .mtrl-textfield__field      the container (field): label, input, outline, icons, affixes
└─ .mtrl-textfield__supporting the row under it, in the flow
   ├─ .mtrl-textfield__helper  start
   └─ .mtrl-textfield__counter end
```

The row is in the flow: a helper that wraps pushes what follows down, and a field without one
is 56dp tall. Since mtrl 0.10 (FLO-300) the label, input and slots are inside `__field`, not
direct children of the root: CSS written as `.mtrl-textfield > .mtrl-textfield__input` now goes
through the field, `.mtrl-textfield__field > …`. The filled indicator is
`.mtrl-textfield__field::before`.

```css
.mtrl-textfield { }
.mtrl-textfield--filled, .mtrl-textfield--outlined { }
.mtrl-textfield--density-compact, .mtrl-textfield--multiline { }
.mtrl-textfield--focused, .mtrl-textfield--empty, .mtrl-textfield--error, .mtrl-textfield--disabled { }
.mtrl-textfield__field, .mtrl-textfield__input, .mtrl-textfield__label { }
.mtrl-textfield__leading-icon, .mtrl-textfield__trailing-icon { }
.mtrl-textfield__prefix, .mtrl-textfield__suffix { }
.mtrl-textfield__supporting, .mtrl-textfield__helper, .mtrl-textfield__helper--error { }
.mtrl-textfield__counter { }
.mtrl-textfield__outline, .mtrl-textfield__outline--notched { }
```

The label has no `--floating` class: it rises with the root's `--focused` and `--empty` classes
and the input's own state. The outlined border is an `__outline` of three segments
(`__outline-leading`, `__outline-notch`, `__outline-trailing`), whose notch is sized from the
label and opened by `__outline--notched`. Icon and affix padding is measured in JavaScript,
which is why `updatePositions()` exists.

## Measurements

From `_textfield.scss` in mtrl, which names no M3 token for them.

| Attribute | Value | Source |
|-----------|-------|--------|
| Field height | 56dp | `.mtrl-textfield__input { height }` |
| Field height, compact | 40dp | `--density-compact` input rule |
| Container corner | 4dp | `f.get-shape('extra-small')` |
| Filled corner | 4dp, top only | the filled variant's `border-radius` |
| Input padding | 13dp 16dp | `.mtrl-textfield__input { padding }` |
| Filled input padding | 20dp 16dp 7dp | the filled variant's input rule |
| Icon | 24dp | the leading and trailing icon rules |
| Icon, compact | 20dp, 16dp inside it | the `--density-compact` icon rules |
| Input padding beside an icon | 44dp | the `--with-leading-icon` and `--with-trailing-icon` input rules |
| Input padding beside an affix | 48dp, until measured | the `--with-prefix` and `--with-suffix` input rules |
| Active indicator | 1dp at rest, 2dp focused | the filled input's `border-bottom` and `.mtrl-textfield__field::before` |
| Input type | Body Large | `m.typography('body-large')` |
| Supporting text type | Body Small | `m.typography('body-small')` |
| Supporting text row | 4dp above, 16dp each side | `TextFieldDefaults.supportingTextPadding` |
| Multiline minimum height | 100dp | the `--multiline` input rule |
| Width, unsized | 280dp | Compose `TextFieldDefaults.MinWidth` |
