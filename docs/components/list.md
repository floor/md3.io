---
created: 2026-09-21
updated: 2026-09-30
status: published
---

# List

A list is a continuous, vertical index of text and images: a headline per row, with an
overline, supporting text, and leading and trailing content such as an icon, an avatar or a
time. Rows are one, two or three lines tall, and can be selected, one at a time or several.
See the [M3 list guidelines](https://m3.material.io/components/lists/overview).

## Usage

Each item has an `id` and a `headline`. By default a row is a button that selects it, and
choosing another row moves the selection.

```example
list:
  ariaLabel: Ideas for today
  items:
    - { id: walk, headline: Morning walk }
    - { id: read, headline: Read a chapter }
    - { id: cook, headline: Try a new recipe }
```

## Examples

### Anatomy

`supportingText` and `overline` make a row two or three lines tall; `lines` sets it. `leading`
and `trailing` are `{ type, content }`: an `icon`, `avatar`, `image` or `video` leading, and
an `icon` or `text` trailing. `{ kind: 'subheader' }` titles a group and `{ kind: 'divider' }`
separates one, `inset` to line up with the text. `trackSelection: false` makes the rows
display only.

```example
list:
  ariaLabel: Places
  trackSelection: false
  items:
    - { kind: subheader, headline: Places to explore }
    - { id: trail, headline: Mountain trail, supportingText: 5 km loop, leading: { type: icon, content: locationIcon }, trailing: { type: text, content: 40 min } }
    - { kind: divider, inset: true }
    - { id: garden, headline: Botanical garden, supportingText: Open until 6 pm, leading: { type: icon, content: locationIcon }, trailing: { type: text, content: 15 min } }
```

### Several selected

`multiSelect` lets rows be selected together, and `initialSelection` (or an item's
`selected`) sets the rows that start selected. A `disabled` row cannot be selected or focused.

```example
list:
  ariaLabel: Countries
  multiSelect: true
  initialSelection: [fr, jp]
  items:
    - { id: fr, headline: France }
    - { id: de, headline: Germany, disabled: true }
    - { id: jp, headline: Japan }
```

A choice emits `select` with `{ item, element, originalEvent }` before the selection moves;
`preventDefault()` leaves it where it was. Choosing the selected row again deselects it. The
web component dispatches `activate` with `{ value }`, then `change` with `{ value, values }`
when the selection moved. A trailing `control` or `custom` slot holds the app's own control,
which a click on does not select the row. `renderItem(item, index)` renders a row the app's
way. The list renders every item; for long or remote data, use
[vlist](https://vlist.io).

## API

<!-- API: generated from mtrl's types and <m-list>'s spec in a later step. Until then these
tables are hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `items` | `ListItem[]` | `[]` | The rows, subheaders and dividers |
| `renderItem` | `(item, index) => HTMLElement` | the anatomy | Renders a row's content |
| `trackSelection` | `boolean` | `true` | Rows are buttons that select; `false`, display only |
| `multiSelect` | `boolean` | `false` | Several rows selected at once |
| `initialSelection` | `(string \| number)[]` | `undefined` | The ids selected at creation |
| `ariaLabel` | `string` | `undefined` | The list's accessible name |
| `animate` | `boolean` | `false` | Whether `scrollToItem()` and `scrollToIndex()` scroll smoothly by default |
| `class` | `string` | `undefined` | Additional CSS classes |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |
| `componentName` | `string` | `'list'` | Component name used in class generation |

#### Items

| Field | Type | Description |
|-------|------|-------------|
| `kind` | `'item' \| 'subheader' \| 'divider'` | A row by default |
| `id` | `string \| number` | The row's id; its index without one |
| `headline` | `string` | The row's text; `text`, `title` or `name` stand in for it |
| `overline` / `supportingText` | `string` | The line above and the lines below the headline |
| `lines` | `1 \| 2 \| 3` | The row's height; inferred from the text without it |
| `leading` | `ListSlot` | `{ type: 'icon' \| 'avatar' \| 'image' \| 'video' \| 'text' \| 'control' \| 'custom', content }` |
| `trailing` | `ListSlot` | The same, at the end |
| `selected` / `disabled` | `boolean` | Selected at creation; not selectable |
| `inset` | `boolean` | A divider lined up with the text |

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getSelectedItems()` / `getSelectedItemIds()` | `ListItem[]` / `string[]` | The selection |
| `isItemSelected(id)` | `boolean` | Whether a row is selected |
| `selectItem(id)` / `deselectItem(id)` | `ListComponent` | Adds a row to the selection, or removes it |
| `setSelection(ids)` / `clearSelection()` | `ListComponent` | Replaces or clears the selection |
| `refresh()` | `Promise<ListComponent>` | Renders the items again, from the array the list holds |
| `getAllItems()` / `getVisibleItems()` | `ListItem[]` | The items, all of them in both cases |
| `scrollToItem(id, position?, animate?)` | `ListComponent` | Scrolls a row into view: `'start'`, `'center'` or `'end'` |
| `scrollToIndex(index, position?, animate?)` | `Promise<ListComponent>` | The same, by index |
| `isLoading()` / `hasNextPage()` | `boolean` | Always `false` |
| `on(event, handler)` / `off(event, handler)` | `ListComponent` | Events |
| `destroy()` | `void` | Removes the list and its listeners |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `select` | `{ item, element, originalEvent, component, preventDefault, defaultPrevented }` | A row was chosen, before the selection moves |
| `load` | `{ items, loading, hasNext, hasPrev, component }` | The items were rendered, at creation and on `refresh()` |
| `scroll` | `{ originalEvent, component }` | The list scrolled |

## Accessibility

- The list is a `list` named by `ariaLabel`, each row a `listitem`, a divider a `separator`.
- A selectable row holds a button named by the headline and described by the supporting text,
  with `aria-pressed` for its selection. `Up`, `Down`, `Home` and `End` move between the
  enabled rows; `Enter` or `Space` selects.
- A disabled row is `aria-disabled` and its button disabled. Leading icons are hidden from
  assistive tech; a trailing control is the app's to name.

## Styling

A selected row has the `secondary-container` color and 16dp corners.

```css
.mtrl-list { }
.mtrl-list__content, .mtrl-list__subheader, .mtrl-list__divider, .mtrl-list__divider--inset, .mtrl-list__empty { }
.mtrl-list__item, .mtrl-list__item--two-line, .mtrl-list__item--three-line { }
.mtrl-list__item--selected, .mtrl-list__item--disabled, .mtrl-list__action { }
.mtrl-list__text, .mtrl-list__overline, .mtrl-list__headline, .mtrl-list__supporting { }
.mtrl-list__leading, .mtrl-list__leading--icon, .mtrl-list__leading--avatar, .mtrl-list__leading--image, .mtrl-list__leading--video { }
.mtrl-list__trailing, .mtrl-list__trailing--icon, .mtrl-list__trailing--text { }
```

## Measurements

From Compose's `ListItem` and `ListTokens`:

| Attribute | Value |
|-----------|-------|
| Row | 56dp one line, 72dp two, 88dp three; 16dp between its parts |
| Padding | 8dp top and bottom (12dp for three lines), 16dp at the sides |
| Text | Headline Body Large `on-surface`; overline Label Small and supporting text Body Medium, `on-surface-variant` |
| Leading | Icon 24dp; avatar 40dp; image 56dp; video 100 × 56dp (114 × 64dp in three lines) |
| Trailing text | Label Small |
| Subheader | Label Large, `on-surface-variant` |
| Divider | 1dp `outline-variant`; inset 72dp from the start and 16dp from the end |
| Focus | A 2dp `secondary` ring inside the row |
