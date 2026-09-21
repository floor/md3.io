# Radios

Radios present a set of mutually exclusive options where exactly one is chosen
and every option is worth showing. The component is the *group*, not the single
button: you give it a `name` and an array of options, and it owns the selection
between them. If the list is long enough that showing it all is noise, a
[Select](select.md) is the better control; if the choice is a simple on/off, use
a [Checkbox](checkbox.md) or a [Switch](switch.md).

## Import

```javascript
import { createRadios } from 'mtrl';
```

To pull in only this component, import it directly instead: `import createRadios from 'mtrl/components/radios'`.

## Basic Usage

```javascript
const plan = createRadios({
  name: 'plan',
  value: 'md',
  options: [
    { value: 'sm', label: 'Option 1' },
    { value: 'md', label: 'Option 2' },
    { value: 'lg', label: 'Option 3' },
    { value: 'xl', label: 'Option 4' }
  ]
});

document.querySelector('.form').appendChild(plan.element);

plan.on('change', (data) => {
  if (!data) return; // handlers fire twice; the second call has no payload
  console.log('selected', data.value, data.option.label);
});
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | `string` | generated | The shared `name` attribute that groups the inputs. Required in the type; a random one is generated if you omit it |
| `options` | `RadioOptionConfig[]` | `[]` | The options to render, in order |
| `value` | `string` | `''` | The `value` of the option selected initially |
| `direction` | `'vertical' \| 'horizontal'` | `'vertical'` | Stacked or laid out in a row |
| `disabled` | `boolean` | `false` | Disables every option in the group |
| `ripple` | `boolean` | `true` | Renders the state-layer element behind each radio |
| `class` | `string` | — | Extra CSS classes on the group element |
| `prefix` | `string` | `'mtrl'` | Class-name prefix |
| `componentName` | `string` | `'radios'` | Component name used in class generation |
| `rippleConfig` | `object` | — | `{ duration, timing, opacity }`, accepted by the config type but not read by the current implementation |

Each entry of `options` is a `RadioOptionConfig`:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `value` | `string` | required | The input's `value`, and the key every method addresses the option by |
| `label` | `string` | required | Visible text for the option |
| `disabled` | `boolean` | `false` | Disables this option only |
| `labelBefore` | `boolean` | `false` | Puts the text before the radio instead of after |

`RADIO_DIRECTIONS`, `RADIO_EVENTS` and the other constants are exported from the
component, not from the package root, if you would rather not spell the strings:
`import { RADIO_DIRECTIONS } from 'mtrl/components/radios'`.

## Component API

| Property | Type | Description |
|----------|------|-------------|
| `element` | `HTMLElement` | The group container, with `role="radiogroup"` |
| `radios` | `RadioItem[]` | One entry per option: `{ element, input, label, config, destroy }` |
| `lifecycle` | `{ destroy }` | Lifecycle hooks from the composition core |

### Selection

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getValue()` | none | `string` | The selected option's `value`, or `''` if none |
| `setValue(value)` | `value: string` | `RadiosComponent` | Selects the option with that value |
| `getSelected()` | none | `RadioOptionConfig \| null` | The full config of the selected option |

### Options

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `addOption(option)` | `option: RadioOptionConfig` | `RadiosComponent` | Appends an option to the group |
| `removeOption(value)` | `value: string` | `RadiosComponent` | Removes the option with that value. Clears the selection if it was the selected one |

### State

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `enable()` | none | `RadiosComponent` | Removes the `--disabled` class from the container. It does **not** re-enable the inputs, so options disabled at construction stay disabled — use `enableOption(value)` for each |
| `disable()` | none | `RadiosComponent` | Adds the `--disabled` class to the container, which greys it out and sets `pointer-events: none`. It does **not** set `disabled` on the inputs; see Accessibility |
| `enableOption(value)` | `value: string` | `RadiosComponent` | Enables one option |
| `disableOption(value)` | `value: string` | `RadiosComponent` | Disables one option |

### Events and lifecycle

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `on(event, handler)` | `event: string, handler: Function` | `RadiosComponent` | Adds an event listener |
| `off(event, handler)` | `event: string, handler: Function` | `RadiosComponent` | Does **not** remove the listener: `on()` registers a wrapper around your handler, and `off()` looks for the handler itself. There is no way to unsubscribe short of `destroy()` |
| `getClass(name)` | `name: string` | `string` | The prefixed class name, e.g. `getClass('radios')` |
| `destroy()` | none | `void` | Destroys every radio item, then the group |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `change` | `{ value, option, originalEvent }` **and then again with `undefined`** | A different option was selected by the user |

**Every `change` handler fires twice per selection, and the second call has no
payload.** The component dispatches its own `CustomEvent('change')` on the group
element and reads the detail off it, but the native `change` from the radio
input bubbles to that same element, where the detail is `undefined`. So a
handler written as `({ value }) => …` throws a `TypeError` on the second call.
Guard every handler:

```javascript
radios.on('change', (data) => {
  if (!data) return; // the bubbled native event, no payload
  console.log(data.value, data.option.label);
});
```

`setValue()` updates the inputs without firing `change`, so a programmatic
selection will not re-enter your own handler.

## Examples

### A group of options

What the showcase renders, three times over with distinct `name` values so the
groups do not steal each other's selection:

```javascript
const radios = createRadios({
  name: 'size',
  options: [
    { value: 'sm', label: 'Option 1' },
    { value: 'md', label: 'Option 2' },
    { value: 'lg', label: 'Option 3' },
    { value: 'xl', label: 'Option 4' }
  ]
});

container.appendChild(radios.element);
```

Give every group on a page its own `name`. Two groups sharing one `name` are one
group as far as the browser is concerned, and selecting in the second clears the
first.

### Horizontal layout, with one option unavailable

```javascript
const shipping = createRadios({
  name: 'shipping',
  direction: 'horizontal',
  value: 'standard',
  options: [
    { value: 'standard', label: 'Standard' },
    { value: 'express', label: 'Express' },
    { value: 'overnight', label: 'Overnight', disabled: true }
  ]
});
```

### Reacting to the selection

```javascript
const delivery = createRadios({
  name: 'delivery',
  options: [
    { value: 'pickup', label: 'Pick up' },
    { value: 'ship', label: 'Ship to me' }
  ]
});

delivery.on('change', (data) => {
  if (!data) return;
  if (data.value === 'ship') {
    address.enable();
  } else {
    address.disable();
  }
});
```

### Building the options from data

```javascript
const countries = createRadios({ name: 'country' });

fetchCountries().then((list) => {
  list.forEach(({ code, name }) => {
    countries.addOption({ value: code, label: name });
  });
});
```

## Accessibility

The group renders native `<input type="radio">` elements sharing one `name`, so
the browser supplies roving focus and arrow-key navigation for free: `Tab` moves
into the group and lands on the selected radio (or the first, if none is
selected), the arrow keys move between options *and select as they go*, and
`Tab` leaves the group as a unit.

**What the component sets for you**

- `role="radiogroup"` on the container.
- A unique `id` on each input and a matching `for` on its `<label>`, so clicking
  the label text selects the option and the label is announced as the option's
  name. This association is real here, unlike in the checkbox.
- `disabled` on the inputs of options marked `disabled`, and on all of them when
  the group is created with `disabled: true`. Note that the runtime `disable()`
  method does *not* do this — see the note below.

**What you still have to supply**

- A name for the group itself. `role="radiogroup"` with no accessible name is
  announced as an unlabelled group — add `aria-labelledby` pointing at your own
  heading, or `aria-label`:

  ```javascript
  radios.element.setAttribute('aria-labelledby', 'shipping-heading');
  ```

- `aria-required` or `aria-invalid` on the group if the choice is mandatory or
  has failed validation; the component sets neither.
- Error or helper text. There is no supporting-text slot — render your own and
  reference it with `aria-describedby` on the group element.

**A disabled group is only disabled for the mouse.** `disable()` adds the
`--disabled` class, which greys the container and sets `pointer-events: none`,
but the inputs keep `disabled === false`: they stay in the tab order, and a
keyboard user can still arrow through the options and change the selection of a
group that looks unavailable. Until this is fixed, disable the group at the
source:

```javascript
radios.disable();
radios.radios.forEach((radio) => { radio.input.disabled = true; });
```

`disabled: true` at construction *is* honoured — each input is created with the
attribute — but `enable()` does not lift it, so re-enable those the same way, or
call `enableOption(value)` per option.

## Styling

```css
.mtrl-radios { /* the group container */ }
.mtrl-radios--vertical { }
.mtrl-radios--horizontal { }
.mtrl-radios--disabled { }

.mtrl-radios-item { /* one option's wrapper */ }
.mtrl-radios-item--disabled { }

.mtrl-radios-input { /* the native input, visually hidden */ }
.mtrl-radios-label { /* the clickable label */ }
.mtrl-radios-label--before { /* when labelBefore is set */ }
.mtrl-radios-control { /* the 40dp touch target around the circle */ }
.mtrl-radios-circle { /* the ring and its filled dot */ }
.mtrl-radios-ripple { /* the state layer, omitted when ripple: false */ }
.mtrl-radios-text { /* the label text */ }
```

The ring uses the theme's `outline` when unselected and `primary` when selected;
the state layer is `primary` at 8% on hover and 12% on focus.

## Measurements

No M3 token is named anywhere in the radios source, so the table cites the
declaration each value comes from in
`mtrl/src/styles/components/_radios.scss` instead of a token it cannot prove.

| Attribute | Value | Source |
|-----------|-------|--------|
| Touch target | 40 x 40px | `.mtrl-radios-control { width, height }` |
| Ring diameter | 20px | `.mtrl-radios-circle { width, height }` |
| Ring thickness | 1.5px, 1.5px when selected | `.mtrl-radios-circle { border }` |
| Selected dot | 12px | `.mtrl-radios-circle::after` |
| Row height | 48px | `.mtrl-radios-label { height }` |
| Text gap | 8px | `.mtrl-radios-text { margin-left }` |
| Label type | body-medium | `@include m.typography('body-medium')` |
| Gap between options | 12px stacked, 16px in a row | `.mtrl-radios--vertical`, `--horizontal` |
| Hover state layer | primary at 8% | `.mtrl-radios-ripple` hover rule |
| Focus state layer | primary at 12% | `.mtrl-radios-input:focus ~ … -ripple` |
| Disabled opacity | 0.6 group, 0.38 on the ring and text | `--disabled`, `:disabled ~ …` rules |
