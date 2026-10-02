---
created: 2026-09-21
updated: 2026-09-29
status: published
---

# Button

A button lets people take an action with one tap: save, send, add to cart. M3 has five,
from most to least emphasis: **filled** for the one main action, **tonal**, **elevated**,
**outlined**, and **text** for the least. See the
[M3 buttons guidelines](https://m3.material.io/components/buttons/overview).

## Usage

```example
button:
  text: Save
  on click: save()
```

## Examples

### Emphasis, size and shape

`variant` sets the emphasis, `size` runs from `xs` to `xl`, and `shape` is `round` (a pill)
or `square` (corners that grow with the size).

```example
button:
  text: Discard
  variant: outlined
  size: m
  shape: square
```

### An icon

An icon goes with the label or alone. Alone, the button needs `ariaLabel` to name it.

```example
button:
  text: Add to cart
  variant: tonal
  icon: addIcon
```

### Disabled while it works

An action changes the button: here its label and `disabled`.

```example
button:
  text: Send
  on click: sending()
  action sending:
    set text: Sending
    set disabled: true
```

The factory can also show progress in the icon slot (`progress`, `setProgress()`,
`setLoading()`); the web component does not take it yet. Recipes built on buttons, such as an
upload with progress, a form submission or a multi-step process, are planned for
[Examples](/examples/).

## API

<!-- API: generated from mtrl's types and <m-button>'s spec in a later step. Until then these
tables are hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `variant` | `string` | `'filled'` | Visual style of the button (filled, outlined, text, elevated, tonal) |
| `size` | `string` | `'s'` | Size of the button (xs, s, m, l, xl) |
| `shape` | `string` | `'round'` | Shape of the button (round, square) |
| `disabled` | `boolean` | `false` | Whether the button is initially disabled |
| `text` | `string` | `undefined` | Text content displayed inside the button |
| `icon` | `string` | `undefined` | HTML content (typically SVG) for the button icon |
| `iconSize` | `string` | `undefined` | Accepted but not applied. The value is appended to a CSS class (`mtrl-icon--<value>`) rather than used as a length, and the stylesheet defines no such modifier, so it has no effect. Size the icon from your own CSS, or size the SVG itself |
| `class` | `string` | `undefined` | Additional CSS classes to add to the button |
| `value` | `string` | `undefined` | Button value attribute |
| `type` | `string` | `'button'` | Button type attribute (button, submit, reset) |
| `ripple` | `boolean` | `true` | Whether a press shows the ripple, which is the pressed state layer (0.10) as in Compose; without it, a static 0.10 layer shows the press |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |
| `rippleConfig` | `{ duration? }` | `undefined` | How long, in ms, a released wave lingers before it is removed: the wave is the 0.10 pressed state layer, drawn by the stylesheet |
| `ariaLabel` | `string` | `undefined` | ARIA label for accessibility (important for icon-only buttons) |
| `progress` | `boolean\|object` | `undefined` | Progress indicator configuration |
| `showProgress` | `boolean` | `false` | Whether to show progress initially |

### Methods

#### Value Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getValue()` | none | `string` | Gets the button's current value attribute |
| `setValue(value)` | `value: string` | `ButtonComponent` | Sets the button's value attribute |

#### State Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `enable()` | none | `ButtonComponent` | Enables the button, making it interactive |
| `disable()` | none | `ButtonComponent` | Disables the button, making it non-interactive |
| `setActive(active)` | `active: boolean` | `ButtonComponent` | Sets the active state of the button (e.g., when a related menu is open) |

#### Variant Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setVariant(variant)` | `variant: string` | `ButtonComponent` | Changes the button's visual style variant |
| `getVariant()` | none | `string` | Gets the button's current variant |

#### Size Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setSize(size)` | `size: string` | `ButtonComponent` | Sets the button's size (xs, s, m, l, xl) |
| `getSize()` | none | `string` | Gets the button's current size |

#### Shape Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setShape(shape)` | `shape: string` | `ButtonComponent` | Sets the button's shape (round, square) |
| `getShape()` | none | `string` | Gets the button's current shape |

#### Content Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setText(content)` | `content: string` | `ButtonComponent` | Sets the button's text content |
| `getText()` | none | `string` | Gets the button's current text content |
| `setIcon(icon)` | `icon: string` | `ButtonComponent` | Sets the button's icon HTML content (empty string removes icon) |
| `getIcon()` | none | `string` | Gets the button's current icon HTML content |
| `hasIcon()` | none | `boolean` | Checks if the button has an icon |
| `setAriaLabel(label)` | `label: string` | `ButtonComponent` | Sets the button's aria-label attribute for accessibility |

#### Progress Methods (when progress is configured)

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `showProgress()` | none | `Promise<ButtonComponent>` | Shows the progress indicator |
| `showProgressSync()` | none | `ButtonComponent` | Shows the progress indicator synchronously |
| `hideProgress()` | none | `Promise<ButtonComponent>` | Hides the progress indicator |
| `hideProgressSync()` | none | `ButtonComponent` | Hides the progress indicator synchronously |
| `setProgress(value)` | `value: number` | `Promise<ButtonComponent>` | Sets progress value (0-100) |
| `setProgressSync(value)` | `value: number` | `ButtonComponent` | Sets progress value synchronously |
| `setIndeterminate(indeterminate)` | `indeterminate: boolean` | `Promise<ButtonComponent>` | Sets indeterminate mode |
| `setIndeterminateSync(indeterminate)` | `indeterminate: boolean` | `ButtonComponent` | Sets indeterminate mode synchronously |
| `setLoading(loading, text?)` | `loading: boolean, text?: string` | `Promise<ButtonComponent>` | Shows progress and **disables** the button; restores the previous text on `false` unless new text is given |
| `setLoadingSync(loading, text?)` | `loading: boolean, text?: string` | `ButtonComponent` | The same, without awaiting the lazy progress import |

#### Event Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `on(event, handler)` | `event: string, handler: Function` | `ButtonComponent` | Adds an event listener |
| `off(event, handler)` | `event: string, handler: Function` | `ButtonComponent` | Removes an event listener |

#### Style Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `addClass(...classes)` | `...classes: string[]` | `ButtonComponent` | Adds CSS classes to the button element |

#### Lifecycle Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `destroy()` | none | `void` | Destroys the button component and cleans up resources |

### Events

| Event | Description | Data |
|-------|-------------|------|
| `click` | Fires when the button is clicked | `{ event, element, originalEvent }` |
| `focus` | Fires when the button receives focus | `{ event, element, originalEvent }` |
| `blur` | Fires when the button loses focus | `{ event, element, originalEvent }` |

`event` and `originalEvent` are the same DOM event; `element` is the button element. Handlers
are not called while the button is disabled.

## Accessibility

- A native `<button>`, named by its label, or by `ariaLabel` when it has only an icon.
- `Tab` focuses it; `Enter` and `Space` activate it.
- Disabled, it leaves the tab order and its handlers are not called.
- `type: 'submit'` submits the form it is in; the web component submits its host's form.

## Styling

The custom property reaches the factory's button and the web component alike; the classes are
the factory's, inside the web component's shadow root.

```css
.mtrl-button { }
.mtrl-button--filled, .mtrl-button--tonal, .mtrl-button--elevated,
.mtrl-button--outlined, .mtrl-button--text { }
.mtrl-button--xs, .mtrl-button--s, .mtrl-button--m, .mtrl-button--l, .mtrl-button--xl { }
.mtrl-button--square { }
.mtrl-button__icon, .mtrl-button__text { }
.mtrl-button--progress, .mtrl-button__progress { }

.checkout {
  --mtrl-button-shape: 8px;  /* the corner radius */
}
```

## Measurements

| Size | Height |
|------|--------|
| `xs` | 32dp |
| `s` (default) | 40dp |
| `m` | 56dp |
| `l` | 96dp |
| `xl` | 136dp |
