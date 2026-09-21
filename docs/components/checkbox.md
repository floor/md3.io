# Checkbox

A checkbox lets someone select any number of items from a set, or turn a single
option on or off. Reach for it when the choice is one of several that are
submitted together — a form, a filter panel, a list of permissions. If the
choice takes effect the moment it is made, a [Switch](switch.md) says that
better. The checkbox also carries a third, indeterminate state for the "select
all" row above a partially selected list.

## Import

```javascript
import { createCheckbox } from 'mtrl';
```

To pull in only this component, import it directly instead: `import createCheckbox from 'mtrl/components/checkbox'`.

## Basic Usage

```javascript
const terms = createCheckbox({
  label: 'Accept terms and conditions',
  name: 'accept-terms'
});

document.querySelector('.form').appendChild(terms.element);

terms.on('change', () => {
  console.log('accepted:', terms.isChecked());
});
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `label` | `string` | — | Label text rendered next to the control. Also becomes the input's `aria-label` |
| `name` | `string` | — | Input `name` attribute, used for form submission |
| `value` | `string` | `'on'` | Input `value` attribute, used for form submission |
| `checked` | `boolean` | `false` | Initial checked state |
| `indeterminate` | `boolean` | `false` | Sets `input.indeterminate`, which screen readers announce as "mixed". It does **not** add the `--indeterminate` class, so the box is painted unchecked until you call `setIndeterminate(true)` |
| `required` | `boolean` | `false` | Marks the input required for native form validation |
| `disabled` | `boolean` | `false` | Renders the checkbox non-interactive |
| `variant` | `'filled' \| 'outlined'` | `'filled'` | Accepted by the config type; **inert**. Nothing in the composition pipe reads it, so `mtrl-checkbox--outlined` is never applied and `outlined` renders exactly like `filled`. Add the class yourself if you want the outlined styling |
| `labelPosition` | `'start' \| 'end'` | `'end'` | Whether the label sits before or after the box |
| `class` | `string` | — | Extra CSS classes on the root element |
| `prefix` | `string` | `'mtrl'` | Class-name prefix |
| `componentName` | `string` | `'checkbox'` | Component name used in class generation |

`variant` and `labelPosition` have constants exported alongside the factory, so
you do not have to spell the strings: `CHECKBOX_VARIANTS.OUTLINED`,
`CHECKBOX_LABEL_POSITION.START`. Constants are **not** re-exported from the
package root — import them from the component:
`import { CHECKBOX_VARIANTS } from 'mtrl/components/checkbox'`.

## Component API

| Property | Type | Description |
|----------|------|-------------|
| `element` | `HTMLElement` | The root container |
| `input` | `HTMLInputElement` | The native `<input type="checkbox">` |

### Value

`getValue()` returns the *checked state*, not the `value` attribute — that is
what a form binding almost always wants. The attribute has its own pair of
accessors for the rare case you need it.

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getValue()` | none | `boolean` | Whether the checkbox is checked |
| `setValue(value)` | `value: boolean \| string` | `CheckboxComponent` | Checks or unchecks. Strings `"true"` and `"1"` check, anything else unchecks |
| `getValueAttribute()` | none | `string` | The input's `value` attribute |
| `setValueAttribute(value)` | `value: string` | `CheckboxComponent` | Sets the input's `value` attribute |

### State

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `check()` | none | `CheckboxComponent` | Checks the box |
| `uncheck()` | none | `CheckboxComponent` | Unchecks the box |
| `toggle()` | none | `CheckboxComponent` | Flips the checked state |
| `isChecked()` | none | `boolean` | Current checked state |
| `setIndeterminate(state)` | `state: boolean` | `CheckboxComponent` | Sets or clears the mixed state |
| `enable()` | none | `CheckboxComponent` | Makes the checkbox interactive |
| `disable()` | none | `CheckboxComponent` | Makes the checkbox non-interactive |

### Label, events and lifecycle

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setLabel(text)` | `text: string` | `CheckboxComponent` | Replaces the label text |
| `getLabel()` | none | `string` | Current label text |
| `on(event, handler)` | `event: string, handler: Function` | `CheckboxComponent` | Adds an event listener |
| `off(event, handler)` | `event: string, handler: Function` | `CheckboxComponent` | Removes an event listener |
| `destroy()` | none | `void` | Tears the component down and releases listeners |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `change` | `{ checked, value, nativeEvent }` from a click or keypress; `{ checked, value }` from a programmatic change | The checked state changed |

`change` is the only event the component emits. For anything else — `focus`,
`blur`, `click` — listen on `checkbox.input` directly.

**Setting the state in code fires `change` too.** `check()` and `uncheck()`
emit it when the state actually changes, `toggle()` always emits, and
`setValue()` emits through them; only `nativeEvent` is missing from the
payload, so `data.nativeEvent === undefined` is how you tell a programmatic
change from a user one. Nothing is dispatched on the native input, so a
listener added with `checkbox.input.addEventListener('change', …)` does *not*
see these. A handler that writes back into the checkbox needs a guard.

## Examples

### A row of checkboxes

The showcase builds exactly this set:

```javascript
createCheckbox({ label: 'Default' });
createCheckbox({ label: 'Checked', checked: true });
createCheckbox({ label: 'Disabled', disabled: true });
createCheckbox({ label: 'Disabled', disabled: true, checked: true });
```

### Select all, with an indeterminate parent

The parent is checked when every child is, unchecked when none are, and
indeterminate in between. Two things to know before copying this: `indeterminate`
in the config paints nothing, so call `setIndeterminate(true)` once the component
exists; and because `check()`/`uncheck()` emit `change`, the two handlers below
call each other. The `syncing` flag is what stops the round trip — without it,
`check()` on a child re-enters `syncParent`.

```javascript
const parent = createCheckbox({ label: 'Select All Items' });
parent.setIndeterminate(true);

let syncing = false;
const children = [
  createCheckbox({ label: 'Item 1' }),
  createCheckbox({ label: 'Item 2' }),
  createCheckbox({ label: 'Item 3' })
];

const syncParent = () => {
  if (syncing) return;
  const checked = children.filter((child) => child.isChecked()).length;

  if (checked === 0) {
    parent.uncheck();
    parent.setIndeterminate(false);
  } else if (checked === children.length) {
    parent.check();
    parent.setIndeterminate(false);
  } else {
    parent.setIndeterminate(true);
  }
};

children.forEach((child) => child.on('change', syncParent));

parent.on('change', () => {
  const checked = parent.isChecked();
  parent.setIndeterminate(false);
  syncing = true;
  children.forEach((child) => (checked ? child.check() : child.uncheck()));
  syncing = false;
});
```

### Label before the box

```javascript
createCheckbox({ label: 'Label at Start', labelPosition: 'start' });
```

### Outlined variant

The stylesheet ships `--outlined`, but the component never applies it, so
passing `variant` alone changes nothing on screen. Add the class yourself until
the option is wired up:

```javascript
import { CHECKBOX_VARIANTS } from 'mtrl/components/checkbox';

const remember = createCheckbox({
  label: 'Remember me',
  variant: CHECKBOX_VARIANTS.OUTLINED // recorded in the config, not applied
});

remember.element.classList.add('mtrl-checkbox--outlined'); // what actually paints it
```

## Accessibility

The component renders a real `<input type="checkbox">` and hides it with
`opacity: 0` rather than `display: none`, so it stays focusable and keeps every
native behaviour: `Tab` reaches it, form submission and validation work, and
screen readers announce it as a checkbox with its checked state. `Space` and
`Enter` both toggle it, both through the component's own `keydown` handler: it
calls `preventDefault()` on either key and flips `checked` itself, so `Space`
never reaches the browser's native toggle.

**What the component sets for you**

- `aria-label` on the input, from `label`. The visible `<label>` element is not
  associated with the input by `for`/`id`, so this attribute is what carries the
  name to assistive technology.
- `role="checkbox"` on the input and `role="presentation"` on the root, so the
  wrapper does not add a second node to the accessibility tree.
- `disabled` on the input when `disabled: true`, and `required` when
  `required: true`.
- `input.indeterminate`, which is what a screen reader reads as "mixed". The
  `--indeterminate` class that paints the bar is added only by
  `setIndeterminate()`, never by the `indeterminate` config option, so a
  checkbox built with that option announces as mixed while looking unchecked.
- A visible focus ring on `:focus-visible`, drawn as an outline around the box.

**What you still have to supply**

- A name, if you do not pass `label`. Nothing is set in that case — give the
  input one yourself: `checkbox.input.setAttribute('aria-label', 'Select row')`.
- Grouping. A set of related checkboxes needs a `<fieldset>` and `<legend>`, or
  a container with `role="group"` and `aria-labelledby`; the component does not
  create one.
- The relationship between a "select all" parent and its children, if you want
  it announced. `aria-controls` on the parent input is the usual choice.
- Error text. The checkbox has no supporting-text slot; render your own and
  point at it with `aria-describedby`.

Clicking the label text *does* toggle the box, but not because the label is
associated with the input: there is no `for`/`id` pair. The input is stretched
to `width: 100%; height: 100%` over the whole 40px-tall root at `z-index: 1`, so
every click inside the root — box or text — lands on the input itself. The
missing association still costs you the screen-reader relationship, which is why
the `aria-label` above is doing the naming, and it means a label rewritten in
the DOM by hand will not be announced.

## Styling

```css
.mtrl-checkbox { /* root, inline-flex, 40px minimum height */ }
.mtrl-checkbox-input { /* the native input, transparent, covers the root */ }
.mtrl-checkbox-icon { /* the 18px box and its check mark */ }
.mtrl-checkbox-label { /* the label text */ }

/* Variants — styled here, but never applied by the component; see `variant` */
.mtrl-checkbox--outlined { }

/* Label placement */
.mtrl-checkbox--label-start { }
.mtrl-checkbox--label-end { }

/* States */
.mtrl-checkbox--indeterminate { }
.mtrl-checkbox--disabled { }

/* Layout helper for a set of checkboxes */
.mtrl-checkbox-group { }
.mtrl-checkbox-group--horizontal { }
```

The box, its border and the state layer are painted from the theme's
`primary`, `on-primary`, `outline`, `surface-container-highest` and `on-surface`
colors, so a re-themed palette carries through without touching these classes.

## Measurements

No M3 token is named anywhere in the checkbox source, so the table cites the
declaration each value comes from in
`mtrl/src/styles/components/_checkbox.scss` instead of a token it cannot prove.

| Attribute | Value | Source |
|-----------|-------|--------|
| Root minimum height | 40px | `.mtrl-checkbox { min-height }` |
| Box size | 18px square | `.mtrl-checkbox-icon { width, height }` |
| Box corner | 2px | `f.get-shape('tiny')` |
| Box border | 2px | `.mtrl-checkbox-icon { border }` |
| Indeterminate bar | 10 x 2px | `.mtrl-checkbox-icon::after` |
| Label gap | 12px | `.mtrl-checkbox-label { margin-left }` |
| Label type | body-large | `@include m.typography('body-large')` |
| State layer | 12px beyond the box, circular | `.mtrl-checkbox-icon::before` |
| Disabled opacity | 0.38 | `.mtrl-checkbox--disabled { opacity }` |
| Group gap | 8px stacked, 16px in a row | `.mtrl-checkbox-group` |
