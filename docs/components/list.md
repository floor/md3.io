# List Component

The List component renders a static array of data as a vertical, scrollable index of items, with optional single- or multi-select behaviour. Reach for it when you already hold the data in memory and want Material Design 3 list styling, selection state and a click event without writing the DOM plumbing yourself.

## Overview

Lists are commonly used for:

- Settings and preference screens
- Pickers where every choice is known up front
- Navigation indexes and search results
- Any short, finite collection the user selects from

The component renders every item it is given, once, into a document fragment. It does **not** virtualise: there is no windowing, no recycling, and no data loading. `isLoading()` and `hasNextPage()` exist for interface compatibility and always return `false`. If you need virtual scrolling, pagination, or a data source behind the list, use the standalone `vlist` package instead. Virtual scrolling is not a Material Design 3 concern, so it lives outside this component.

## Import

```javascript
import { createList } from 'mtrl';
```

## Basic Usage

```javascript
const list = createList({
  items: [
    { id: '1', headline: 'List Item 1' },
    { id: '2', headline: 'List Item 2' },
    { id: '3', headline: 'List Item 3' }
  ],
  ariaLabel: 'Example list'
});

document.querySelector('.list-container').appendChild(list.element);

list.on('select', (event) => {
  console.log('Selected item:', event.item);
});
```

`createList` throws if `items` is not an array and no `renderItem` is given: the component needs something to render.

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `items` | `any[]` | `[]` | Static array of items to display. Required unless `renderItem` is supplied |
| `renderItem` | `(item: any, index: number) => HTMLElement` | built-in renderer | Renders one item. The returned element is given the item class and `role="listitem"` if it lacks them, and a `data-id` if it has none |
| `trackSelection` | `boolean` | `true` | Whether clicks change selection. When `false`, every selection method becomes a no-op |
| `multiSelect` | `boolean` | `false` | Whether more than one item can be selected at a time |
| `initialSelection` | `(string \| number)[]` | `undefined` | Item IDs selected when the list is created |
| `ariaLabel` | `string` | `undefined` | Sets `aria-label` on the container |
| `class` | `string` | `undefined` | Additional CSS classes for the container element |
| `animate` | `boolean` | `false` | Default scroll behaviour for `scrollToItem` and `scrollToIndex` when they are called without an explicit `animate` argument |
| `prefix` | `string` | `'mtrl'` | Prefix used when generating CSS class names |
| `componentName` | `string` | `'list'` | Component name used in CSS class generation |

An item is also treated as selected at creation time when it carries `selected: true`, so `initialSelection` and per-item flags can be used interchangeably.

Item IDs come from `item.id`. If an item has no `id`, its index is used as a string instead, and that is the value every selection method expects.

## Component API

### Data Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `refresh()` | none | `Promise<ListComponent>` | Re-renders every item from the array the list holds |
| `getAllItems()` | none | `any[]` | The items the list was created with |
| `getVisibleItems()` | none | `any[]` | Same as `getAllItems()`: nothing is windowed out |
| `isLoading()` | none | `boolean` | Always `false`; the list has no async state |
| `hasNextPage()` | none | `boolean` | Always `false`; the list does not paginate |

The list keeps a reference to the array you pass in, so mutating that array in place (`push`, `splice`) and then calling `refresh()` updates the view. Assigning a new array to your own variable does not; create a new list instead.

### Scroll Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `scrollToItem(itemId, position?, animate?)` | `itemId: string \| number, position?: 'start' \| 'center' \| 'end', animate?: boolean` | `ListComponent` | Scrolls the item with that `data-id` into view. Does nothing if no element matches |
| `scrollToIndex(index, position?, animate?)` | `index: number, position?: 'start' \| 'center' \| 'end', animate?: boolean` | `Promise<ListComponent>` | Scrolls the nth rendered element into view. Out-of-range indices are ignored |

`position` defaults to `'start'`. When `animate` is omitted, the `animate` config option decides, so a list created with `animate: true` scrolls smoothly everywhere.

### Selection Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getSelectedItems()` | none | `any[]` | The item objects currently selected |
| `getSelectedItemIds()` | none | `string[]` | The IDs currently selected, always as strings |
| `isItemSelected(itemId)` | `itemId: string \| number` | `boolean` | Whether that item is selected |
| `selectItem(itemId)` | `itemId: string \| number` | `ListComponent` | Selects an item. In single-select mode this does not clear other programmatic selections |
| `deselectItem(itemId)` | `itemId: string \| number` | `ListComponent` | Deselects an item |
| `clearSelection()` | none | `ListComponent` | Deselects everything |
| `setSelection(itemIds)` | `itemIds: (string \| number)[]` | `ListComponent` | Replaces the whole selection and repaints every item's state |

`setSelection` is the method to use when you want the selection to match a list exactly; `selectItem` only adds.

The "Returns `ListComponent`" column above is optimistic: these methods return an inner component, not the one the factory handed you, and each hop returns something smaller than the last. `list.selectItem('1')` gives you an object that still has `deselectItem` but no `getAllItems`; `list.selectItem('1').deselectItem('2')` gives you one with neither. Treat every method as returning nothing useful and start a fresh statement — `list.selectItem('1'); list.deselectItem('2');` — rather than chaining.

### Event and Lifecycle Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `on(event, handler)` | `event: string, handler: Function` | `ListComponent` | Adds an event listener |
| `off(event, handler)` | `event: string, handler: Function` | `ListComponent` | Removes an event listener |
| `destroy()` | none | `void` | Empties the list, removes the click handler and tears the component down |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `select` | `{ item, element, originalEvent, component, preventDefault, defaultPrevented }` | An item was clicked. Fires **before** the selection changes; call `preventDefault()` in the handler to leave the selection alone. Not emitted at all when `trackSelection: false`, since the click listener is what raises it |
| `load` | `{ items, loading, hasNext, hasPrev, component }` | Items were rendered, on creation and on every `refresh()`. `loading`, `hasNext` and `hasPrev` are always `false` |
| `scroll` | `{ event, element, originalEvent }` | The container scrolled. This is the shape the core event forwarder emits — note there is no `component`, and `event` and `originalEvent` are the same object |

The container also forwards native `keydown` events, so `list.on('keydown', handler)` works if you implement your own key handling.

## Examples

### Custom item rendering

The showcase's basic list supplies its own renderer, which is the usual case once items are more than a line of text:

```javascript
const list = createList({
  class: 'list--basic',
  items: [
    { id: '1', headline: 'List Item 1' },
    { id: '2', headline: 'List Item 2' }
  ],
  renderItem: (item) => {
    const element = document.createElement('div');
    element.className = 'mtrl-list-item';
    element.innerHTML = `
      <div class="mtrl-list-item-content">
        <span class="mtrl-list-item-text">${item.headline}</span>
      </div>
    `;
    return element;
  }
});

document.querySelector('.showcase').appendChild(list.element);
```

### Multi-select with an initial selection

```javascript
const list = createList({
  items: countries,
  multiSelect: true,
  initialSelection: ['fr', 'jp'],
  ariaLabel: 'Countries'
});

list.on('select', () => {
  console.log(list.getSelectedItemIds());
});

// Replace the selection wholesale
list.setSelection(['de']);
```

### Vetoing a selection

```javascript
list.on('select', (event) => {
  if (event.item.disabled) {
    event.preventDefault();  // click is ignored, nothing is highlighted
  }
});
```

### Display only

```javascript
const list = createList({
  items: entries,
  trackSelection: false
});
```

With `trackSelection: false` clicks do nothing, `getSelectedItems()` returns `[]`, and the selection methods return the component unchanged. The `select` event does not fire either, so this mode is for display only — if you want the click without the highlight, keep `trackSelection` on and call `preventDefault()` as above.

## Accessibility

The component sets:

- `role="list"` on the container element, and again on the inner content wrapper
- `tabindex="0"` on the container, so it can be focused and scrolled by keyboard
- `aria-label` on the container when `ariaLabel` is given
- `role="listitem"` on every rendered item that does not already declare a role

What the consumer still has to provide:

- **Keyboard selection.** The component listens for clicks only. Arrow-key navigation and Enter/Space activation are not implemented; `keydown` is forwarded so you can add them.
- **Selection semantics for assistive technology.** No `aria-selected`, `aria-multiselectable` or `role="option"` is set. If the list is a picker rather than a static index, set those attributes on the elements your `renderItem` returns.
- **An accessible name.** Pass `ariaLabel`, or label the container yourself.

Focus styling is provided: `:focus-visible` on an item draws a 2dp inset outline in the `primary` colour.

## Styling

BEM classes a consumer may reasonably target:

| Class | Element |
|-------|---------|
| `.mtrl-list-container` | Root, scrollable element |
| `.mtrl-list-content` | Wrapper the items are rendered into |
| `.mtrl-list-item` | One item |
| `.mtrl-list-item--selected` | Selected item |
| `.mtrl-list-item-content` | Item content column |
| `.mtrl-list-item-text` | Item text, as used by the default renderer |
| `.mtrl-list-item-headline` | Primary line of a two-line item |
| `.mtrl-list-item-supporting` | Secondary line |
| `.mtrl-list-item-overline` | Line above the headline |
| `.mtrl-list-item-meta` | Trailing metadata |
| `.mtrl-list-item-leading` | Leading icon slot, 24×24 |
| `.mtrl-list-item-trailing` | Trailing icon slot |
| `.mtrl-list-empty` | Placeholder shown when `items` is empty |
| `.mtrl-list--dense` | Denser item height |
| `.mtrl-list-divider` | Divider between items |

The stylesheet exposes one CSS custom property, `--item-offset`, which is applied as a `translateY` on each item and defaults to `0px`.

One caveat worth knowing about the item class. Every rendered element — yours or the built-in one — is given an **unprefixed** `list-item` class on top of whatever it already has, because the renderer checks for and adds the raw constant rather than the prefixed name. The class that carries the styling is `mtrl-list-item`, and the built-in renderer sets it correctly, so the default case looks right and simply carries a spare `list-item` alongside. A custom `renderItem` that does not set `mtrl-list-item` itself gets only the spare, and picks up none of the stylesheet — which is why the showcase's renderer sets `mtrl-list-item` explicitly, and why yours should too. The selected-state class is applied with the prefix and does match.

Prefixing runs the other way for the `class` option: what you pass is prefixed for you, so `class: 'list--basic'` lands on the container as `mtrl-list--basic`. Pass a name that already starts with `mtrl-` to opt out.

Colours come from the theme rather than from hard-coded values: the container uses `surface`, items use `on-surface`, secondary text uses `on-surface-variant`, and a selected item uses `secondary-container` with `on-secondary-container`.

## Measurements

`_list.scss` does not name any Material Design 3 shape or size token, so these are the stylesheet's own declarations, cited by the SCSS variable that carries them. Anything not listed here has no named source in the component.

| Attribute | Value | Source |
|-----------|-------|--------|
| Item min height | 48dp | `$list-item-height` (`_list.scss`) |
| Dense item min height | 40dp | `$list-item-dense-height` (`_list.scss`) |
| Item vertical padding | 8dp | `$list-padding` (`_list.scss`) |
| Item horizontal padding | 16dp | `$list-item-padding` (`_list.scss`) |
| Section title padding | 16dp | `$list-section-padding` (`_list.scss`) |
| Container min height | 200dp | `$list-container-min-height` (`_list.scss`) |
| Item content gap | 16dp | `gap` on `.mtrl-list-item` (`_list.scss`) |
| Leading icon | 24×24dp | `.mtrl-list-item-leading` (`_list.scss`) |

`$list-padding` is also declared as the vertical padding of a `.mtrl-list` block, but nothing is ever given that class — the container is `.mtrl-list-container` and the wrapper `.mtrl-list-content` — so that rule matches no element and only the item padding is real.

The typography is set through the theme's typescale rather than by size: `body-large` for the headline, `body-medium` for supporting text, and `label-small` for the overline and metadata.

## TypeScript Support

```typescript
import { createList } from 'mtrl';
import type { ListConfig, ListComponent, ListSelectEvent } from 'mtrl';

const list: ListComponent = createList({
  items: entries,
  multiSelect: true
} as ListConfig);

list.on('select', (event: ListSelectEvent) => {
  console.log(event.item);
});
```

`ListConfig` and `ListComponent` are exported from the package root, along with `SelectEvent` under the name `ListSelectEvent`. `LoadEvent` is exported from the component's own types module.
