---
created: 2026-09-21
updated: 2026-09-30
status: published
---

# Search

Search lets people enter a keyword or phrase and find what they are looking for. It starts as
a **search bar**; focusing it opens the **search view**, with suggestions or results under the
bar, **docked** on larger screens or **full screen** on compact ones. See the
[M3 search guidelines](https://m3.material.io/components/search/overview).

## Usage

Focusing the bar opens the view. `input` fires as the query changes, including when the clear
button or Escape empties it; Enter submits, and a chosen suggestion fills the bar and closes
the view.

```example
search:
  placeholder: Search messages
  suggestions: [Invoices, Travel, Team lunch]
  on input: runSearch(value)
```

## Examples

### Style and view mode

`variant` is **contained**, M3 Expressive's style and the default, or **divided**, the
baseline. `viewMode: 'fullscreen'` opens the view over the whole screen; compact windows open
a docked view full screen anyway.

```example
search:
  placeholder: Search places
  variant: divided
  viewMode: fullscreen
```

### Grouped suggestions

A suggestion is a string or `{ text, value, icon, group }`. A change of `group` between two
suggestions draws a divider.

```example
search:
  placeholder: Search places
  suggestions:
    - { text: Lisbon, group: Recent }
    - { text: Tokyo, group: Recent }
    - { text: Paris, group: Suggested }
```

### Setting the query

An action sets the query; here, it empties it.

```example
search:
  placeholder: Search messages
  value: Invoices
  action reset:
    set value: ''
```

The factory also takes `trailingItems`, up to two trailing icon buttons or one and an avatar,
each `{ id, type, content, ariaLabel, onClick }`; the web component takes one icon and one
avatar, as `trailing-icon` and `avatar`, and dispatches `action` with the item's id on a click.

## API

<!-- API: generated from mtrl's types and <m-search>'s spec in a later step. Until then these
tables are hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `variant` | `'contained' \| 'divided'` | `'contained'` | The M3 style: a filled pill bar with results in their own container, or a bar that squares off above a divider |
| `viewMode` | `'docked' \| 'fullscreen'` | `'docked'` | Where the view opens: under the bar, or over the whole screen. Compact windows open docked as full screen |
| `initialState` | `'bar' \| 'view'` | `'bar'` | Whether it starts open |
| `placeholder` | `string` | `'Search'` | The hinted text, and the input's accessible name |
| `value` | `string` | `''` | The initial query |
| `name` | `string` | — | Submits the query with a surrounding form |
| `suggestions` | `SearchSuggestion[] \| string[]` | `[]` | The list in the view: `{ text, value?, icon?, supportingText?, group? }`; `supportingText` makes a two-line item, a change of `group` adds a divider |
| `leadingIcon` | `string` | search icon | SVG for the leading icon (the view shows a back arrow) |
| `trailingItems` | `SearchTrailingItem[]` | — | Up to two trailing icon buttons, or one and an avatar: `{ id, type: 'icon' \| 'avatar', content, ariaLabel?, onClick? }` |
| `showClearButton` | `boolean` | `true` | A clear button while there is text |
| `expandOnFocus` | `boolean` | `true` | Open the view when the bar is focused |
| `collapseOnBlur` | `boolean` | `true` | Close the view when focus leaves the search |
| `collapseDelay` | `number` | `150` | Milliseconds before closing on blur |
| `minWidth` / `maxWidth` | `number` | `360` / `720` | The bar's width range, in pixels |
| `fullWidth` | `boolean` | `false` | Fill the container instead |
| `disabled` | `boolean` | `false` | Whether it starts disabled |
| `class` | `string` | — | Additional CSS classes |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |
| `onInput` / `onSubmit` | `(value: string) => void` | — | Called with the query, beside the events |
| `onClear` / `onExpand` / `onCollapse` | `() => void` | — | Called beside the events |
| `onSuggestionSelect` | `(suggestion: SearchSuggestion) => void` | — | Called with the chosen suggestion |
| `on` | `{ [event]: handler }` | — | Event handlers, by event name |

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getValue()` / `setValue(value, triggerEvent?)` | `string` / `SearchComponent` | The query |
| `getPlaceholder()` / `setPlaceholder(text)` | `string` / `SearchComponent` | The hinted text |
| `expand()` / `collapse()` | `SearchComponent` | Opens or closes the view |
| `isExpanded()` / `getState()` | `boolean` / `'bar' \| 'view'` | Whether it is open |
| `setViewMode(mode)` / `getViewMode()` | `SearchComponent` / `SearchViewMode` | Docked or full screen, also while open |
| `setVariant(variant)` / `getVariant()` | `SearchComponent` / `SearchVariant` | Contained or divided |
| `setSuggestions(list)` / `getSuggestions()` / `clearSuggestions()` | `SearchComponent` / `SearchSuggestion[]` | The list in the view |
| `setLeadingIcon(svg)` | `SearchComponent` | The bar's leading icon |
| `setTrailingItems(items)` / `addTrailingItem(item)` / `removeTrailingItem(id)` | `SearchComponent` | Trailing icons and avatar |
| `focus()` / `blur()` / `clear()` / `submit()` | `SearchComponent` | Input actions |
| `enable()` / `disable()` / `isDisabled()` | `SearchComponent` / `boolean` | Disabled state |
| `on(event, handler)` / `off(event, handler)` | `SearchComponent` | Events |
| `destroy()` | `void` | Closes the view and removes the search |

### Events

| Event | Description |
|-------|-------------|
| `input` | The query changed: typing, or the clear button or Escape emptying it |
| `submit` | Enter was pressed with a query |
| `clear` | The clear button or Escape cleared the query, after its `input` |
| `suggestionSelect` | A suggestion was chosen; `suggestion` carries it |
| `expand` / `collapse` | The view opened or closed |
| `focus` / `blur` | The input gained or lost focus |

Handlers receive `{ component, value, originalEvent, suggestion?, preventDefault(),
defaultPrevented }`. The web component's events are `input`, `change` (a submit), `select` (a
suggestion), each with `{ value }`, then `open`, `close` and `action`.

## Accessibility

- The root is a `search` landmark. The input is a combobox, named by the placeholder or the
  web component's `aria-label`, that controls the suggestions listbox; `aria-expanded` follows
  the view.
- The arrows move `aria-activedescendant` through the suggestions and Enter selects the one
  reached; a polite status announces how many show. Hovering a suggestion does not move the
  keyboard highlight.
- The open view is in the top layer. Docked, it sits over a scrim and a press outside closes
  it; full screen, it is a modal `<dialog>`, the page behind is inert, and Escape closes it.
- Its icon buttons are 48dp targets named "Search", "Go back" and "Clear search"; trailing
  items are named by their `ariaLabel`, which an avatar with `onClick` needs.

## Styling

```css
.mtrl-search { }                                       /* the root; keeps the bar's place */
.mtrl-search--bar, .mtrl-search--view { }              /* closed, open */
.mtrl-search--docked, .mtrl-search--fullscreen { }
.mtrl-search--contained, .mtrl-search--divided { }
.mtrl-search--populated, .mtrl-search--focused, .mtrl-search--disabled, .mtrl-search--full-width { }
.mtrl-search__surface { }                              /* the bar and results; in the top layer while open */
.mtrl-search__container, .mtrl-search__input-wrapper, .mtrl-search__input { }
.mtrl-search__leading-icon, .mtrl-search__clear-button, .mtrl-search__trailing, .mtrl-search__trailing-icon, .mtrl-search__avatar { }
.mtrl-search__divider, .mtrl-search__content, .mtrl-search__suggestions { }
.mtrl-search__suggestion-list, .mtrl-search__suggestion-item, .mtrl-search__suggestion-item--selected { }
.mtrl-search__suggestion-icon, .mtrl-search__suggestion-text, .mtrl-search__suggestion-divider { }

.inbox-header .mtrl-search {
  --mtrl-search-min-width: 240px;  /* the bar's width range */
  --mtrl-search-max-width: 480px;
}
```

## Measurements

From the M3 search specs (`SearchBarTokens`, `SearchViewTokens`):

| Attribute | Value |
|-----------|-------|
| Bar | 56dp, full corners, `surface-container-high`; 360–720dp wide |
| Input | Body Large, `on-surface`; hinted text `on-surface-variant` |
| Icons | 24dp in 48dp targets, 4dp from the ends; text at 56dp; a 30dp avatar |
| States | Hover 8%, focus and pressed 10%; a 3dp `secondary` focus ring |
| Contained, docked | Results 2dp below the pill, in a `surface-container-high` container with 12dp corners, 240dp tall at least and 2/3 of the screen at most |
| Contained, full screen | `surface-container-low`, the bar inset 12dp |
| Divided, docked | The bar's lower corners square off above a 1dp `outline` divider; 28dp corners overall |
| Divided, full screen | A 72dp header, no corners, `surface-container-high` |
| Scrim | 0.32, docked |
| Suggestions | 56dp one-line items, Body Large, 16dp padding |
| Motion | The results reveal over 300ms, emphasized decelerate; none with reduced motion |
