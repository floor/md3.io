# Select

A select lets people choose one option from a list, in a text field that opens a menu: a
country, a role, a sort order. Use it when the options don't need to be visible at once; for a
few that do, use [radio buttons](/docs/components/radios/). See the
[M3 menus guidelines](https://m3.material.io/components/menus/overview), where M3 describes the
exposed dropdown menu.

## Usage

Each option has an `id`, which is the select's value, and a `text`.

```example
select:
  label: Fruit
  name: fruit
  options:
    - { id: apple, text: Apple }
    - { id: banana, text: Banana }
    - { id: cherry, text: Cherry }
  on change: choose(value)
```

`variant` is `filled` (the default) or `outlined`, and `density: 'compact'` lowers the field,
as on a [text field](/docs/components/textfield/). A select fills its container's width.

## Examples

### A chosen option, a disabled one

`value` selects an option by its `id`. A disabled option stays in the list and can't be
chosen.

```example
select:
  label: Plan
  variant: outlined
  value: pro
  supportingText: Billed monthly
  options:
    - { id: free, text: Free }
    - { id: pro, text: Professional }
    - { id: enterprise, text: Enterprise, disabled: true }
```

### Required, in error

`setError(true, message)` shows a message in place of the supporting text, and `clearError()`
restores it. An action here chooses an option and clears the error.

```example
select:
  label: Role
  value: ''
  required: true
  error: true
  supportingText: Choose a role
  options:
    - { id: admin, text: Administrator }
    - { id: editor, text: Editor }
    - { id: viewer, text: Viewer }
  action chooseEditor:
    set value: editor
    set error: false
```

The menu is mounted in the select's own element. In a scrolling or clipping container, such as
a drawer or a sheet, set `menu: { container: document.body, maxHeight: '320px' }`, or
`layer: 'top'` to show it in the browser's top layer. `setOptions()` replaces the options, for
a list loaded later. Validating a select in a form is planned for [Examples](/examples/).

## API

<!-- API: generated from mtrl's types and <m-select>'s spec in a later step. Until then these
tables are hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `options` | `SelectOption[]` | `[]` | The options |
| `value` | `string` | `undefined` | The `id` of the option selected at first |
| `variant` | `'filled' \| 'outlined'` | `'filled'` | The text field's style |
| `density` | `'default' \| 'compact'` | `'default'` | The field height |
| `label` | `string` | `undefined` | The floating label |
| `name` | `string` | `undefined` | The input's `name`, for forms |
| `required` | `boolean` | `false` | Whether a selection is required |
| `disabled` | `boolean` | `false` | Whether the select is disabled |
| `supportingText` | `string` | `undefined` | Helper text under the field |
| `error` | `boolean` | `false` | The error state |
| `placement` | `string` | `'bottom-start'` | The menu's placement against the field |
| `menu` | `{ container?, maxHeight?, autoFlip?, variant?, color? }` | `undefined` | Where the menu is mounted, its maximum height, whether it flips above the field, and its variant and colors |
| `layer` | `'top'` | `undefined` | Renders the menu beside the field and shows it in the top layer; `menu.container` is then not used |
| `on` | `{ change?, open?, close? }` | `undefined` | Event handlers registered at creation |
| `class` | `string` | `undefined` | Additional CSS classes |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |

#### An option

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `string` | required | The option's value |
| `text` | `string` | required | Its text |
| `disabled` | `boolean` | `false` | Whether it can be chosen |
| `icon` | `string` | `undefined` | HTML, usually an SVG, before the text |
| `hasSubmenu` / `submenu` | `boolean` / `SelectOption[]` | `undefined` | Nested options; a select with them is a menu button rather than a combobox |
| `data` | `unknown` | `undefined` | Data of your own, carried with the option |

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getValue()` / `setValue(value)` | `value: string \| null \| undefined` | `string \| null` / `SelectComponent` | The selected option's `id` |
| `clear()` | none | `SelectComponent` | Clears the selection |
| `getText()` | none | `string` | The selected option's text |
| `getSelectedOption()` | none | `SelectOption \| null` | The selected option |
| `getOptions()` / `setOptions(options)` | `options: SelectOption[]` | `SelectOption[]` / `SelectComponent` | The options |
| `open(interactionType?)` / `close()` | `interactionType?: 'mouse' \| 'keyboard'` | `SelectComponent` | Opens or closes the menu; a disabled select does not open |
| `isOpen()` | none | `boolean` | Whether the menu is open |
| `setDensity(density)` / `getDensity()` | `density: 'default' \| 'compact'` | `SelectComponent` / `string` | The field height |
| `enable()` / `disable()` | none | `SelectComponent` | The disabled state |
| `setError(error, message?)` / `clearError()` | `error: boolean, message?: string` | `SelectComponent` | The error state |
| `on(event, handler)` / `off(event, handler)` | `event: string, handler: Function` | `SelectComponent` | Adds or removes a listener |
| `destroy()` | none | `void` | Destroys the select and releases its menu |

| Property | Type | Description |
|----------|------|-------------|
| `element` | `HTMLElement` | The root, which is the text field's |
| `textfield` | `TextfieldComponent` | The text field |
| `menu` | `MenuComponent` | The menu |

### Events

| Event | Description | Data |
|-------|-------------|------|
| `change` | The selection changed | `{ select, value, text, option, originalEvent?, preventDefault, defaultPrevented }` |
| `open` / `close` | The menu opened or closed, however it was | `{ select, originalEvent?, preventDefault, defaultPrevented }` |

The web component's `change` carries `{ value }`.

## Accessibility

- With flat options, the input is a select-only combobox (`role="combobox"`, `aria-haspopup`,
  `aria-expanded`, `aria-controls`) over a `listbox` of options. Focus stays on the input, which
  names the active option with `aria-activedescendant`.
- The label names the input, as on a text field.

| Keys | Action |
|------|--------|
| `Enter` / `Space` | Opens the menu, or chooses the active option |
| `Down` / `Up` | Opens the menu, or moves the active option |
| `Alt` + `Down` / `Alt` + `Up` | Opens the menu / chooses the active option |
| `Home` / `End` | The first / last option |
| `Page Down` / `Page Up` | Moves several options |
| A letter | The next option starting with what was typed |
| `Escape` | Closes the menu without choosing |
| `Tab` | Chooses the active option, and moves on |

## Styling

The select is a text field: its root carries both sets of classes, and the menu is its child.

```css
.mtrl-select, .mtrl-select--open { }
.mtrl-select.mtrl-textfield--filled, .mtrl-select.mtrl-textfield--outlined { }
.mtrl-select .mtrl-textfield__input, .mtrl-select .mtrl-textfield__label { }
.mtrl-select .mtrl-textfield__trailing-icon { }
.mtrl-select > .mtrl-menu { }
```
