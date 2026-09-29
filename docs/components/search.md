# Search Component

Search lets people enter a keyword or phrase to find information. It starts as a **search bar**; focusing it opens the **search view**, which shows suggestions or results in a list below the bar, **docked** under it on larger screens or **full screen** on compact ones. mtrl follows the two M3 styles: **contained**, M3 Expressive's recommendation and the default, and **divided**, the baseline.

## Import

```javascript
import { createSearch } from 'mtrl';
```

## Basic Usage

```javascript
const search = createSearch({
  placeholder: 'Search messages',
  suggestions: ['Invoices', 'Travel', 'Team lunch'],
  onSubmit: (query) => runSearch(query),
});
document.querySelector('.inbox-header').append(search.element);

// Suggestions as the person types
search.on('input', ({ value }) => search.setSuggestions(lookup(value)));
```

Focusing the bar opens the view; Enter submits, a suggestion fills the bar and closes it, and the back arrow, Escape (after clearing the text) or a press outside close it.

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `variant` | `'contained' \| 'divided'` | `'contained'` | The M3 style: a filled pill bar with results in their own container, or a bar that squares off above a divider |
| `viewMode` | `'docked' \| 'fullscreen'` | `'docked'` | Where the view opens: under the bar, or over the whole screen. Compact windows open docked as full screen |
| `initialState` | `'bar' \| 'view'` | `'bar'` | Whether it starts open |
| `placeholder` | `string` | `'Search'` | The hinted text, and the input's accessible name |
| `value` | `string` | `''` | The initial query |
| `name` | `string` | — | Submits the query with a surrounding form |
| `suggestions` | `SearchSuggestion[] \| string[]` | `[]` | The list in the view: `{ text, value?, icon?, group? }`; a change of `group` adds a divider |
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

Callbacks fire alongside the events: `onInput(value)`, `onSubmit(value)`, `onClear()`, `onExpand()`, `onCollapse()`, `onSuggestionSelect(suggestion)`; `on` takes a map of event handlers.

## Component API

| Method | Returns | Description |
|--------|---------|-------------|
| `getValue()` / `setValue(value, triggerEvent?)` | `string` / `SearchComponent` | The query |
| `getPlaceholder()` / `setPlaceholder(text)` | `string` / `SearchComponent` | The hinted text |
| `expand()` / `collapse()` | `SearchComponent` | Opens or closes the view |
| `isExpanded()` / `getState()` | `boolean` / `'bar' \| 'view'` | Whether it is open |
| `setViewMode(mode)` / `getViewMode()` | `SearchComponent` / `string` | Docked or full screen, also while open |
| `setVariant(variant)` / `getVariant()` | `SearchComponent` / `string` | Contained or divided |
| `setSuggestions(list)` / `getSuggestions()` / `clearSuggestions()` | `SearchComponent` / `SearchSuggestion[]` | The list in the view |
| `setLeadingIcon(svg)` | `SearchComponent` | The bar's leading icon |
| `setTrailingItems(items)` / `addTrailingItem(item)` / `removeTrailingItem(id)` | `SearchComponent` | Trailing icons and avatar |
| `focus()` / `blur()` / `clear()` / `submit()` | `SearchComponent` | Input actions |
| `enable()` / `disable()` / `isDisabled()` | `SearchComponent` / `boolean` | Disabled state |
| `on(event, handler)` / `off(event, handler)` | `SearchComponent` | Events |
| `destroy()` | `void` | Closes the view and removes the search |

## Events

Handlers receive `{ component, value, originalEvent, suggestion?, preventDefault(), defaultPrevented }`.

| Event | Description |
|-------|-------------|
| `input` | The query changed as the person typed |
| `submit` | Enter was pressed with a query |
| `clear` | The clear button or Escape cleared the query |
| `suggestionSelect` | A suggestion was chosen; `suggestion` carries it |
| `expand` / `collapse` | The view opened or closed |
| `focus` / `blur` | The input gained or lost focus |

## Examples

### Full screen on a phone, divided

```javascript
const search = createSearch({
  placeholder: 'Search places',
  viewMode: 'fullscreen',
  variant: 'divided',
  suggestions: [
    { text: 'Lisbon', group: 'Recent' },
    { text: 'Tokyo', group: 'Recent' },
    { text: 'Paris', group: 'Suggested' },
  ],
});
```

### With a trailing action and an avatar

```javascript
createSearch({
  placeholder: 'Search your mail',
  trailingItems: [
    { id: 'voice', type: 'icon', content: micIcon, ariaLabel: 'Search by voice', onClick: startVoice },
    { id: 'me', type: 'avatar', content: '<img src="me.jpg" alt="">' },
  ],
});
```

## Accessibility

- The root is a `search` landmark. The input is a **combobox** (`aria-expanded` with the view, `aria-autocomplete="list"`) that controls the suggestions **listbox**; the arrows move `aria-activedescendant` through the options, Enter selects the one reached, and a polite status announces how many suggestions show.
- The open view shows in the browser's top layer, over the page, whatever clips or stacks its ancestors. Docked, it is placed on the bar over a scrim, and a press outside closes it. Full screen, it is a modal `<dialog>` (`showModal()`): the page behind is inert and Escape closes it.
- Moving focus to the view's own back or clear button keeps it open; it closes when focus leaves the search. Hovering a suggestion is only a look: the keyboard highlight is the arrows'.
- Icon buttons are 48dp tap targets with labels ("Search", "Go back", "Clear search", and the `ariaLabel` of trailing items), and show the focus ring on keyboard focus.
- Inside a shadow root, as in a web component, focus is read from the search's own root.

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
```

`--mtrl-search-min-width` and `--mtrl-search-max-width` on the root set the bar's width range.

## Measurements

Following the m3.material.io search specs and `SearchBarTokens` / `SearchViewTokens`, then Compose:

| Attribute | Value |
|-----------|-------|
| Bar | 56dp, full corners, `surface-container-high`; 360–720dp wide |
| Input | Body Large, `on-surface`; hinted text `on-surface-variant` |
| Icons | 24dp in 48dp tap targets, 4dp from the ends: icons centred 28dp in, text at 56dp; leading `on-surface`, trailing and clear `on-surface-variant`; a 30dp avatar |
| States | Hover 8%, focus and pressed 10%; a 3dp `secondary` focus ring |
| Contained, docked | The bar keeps its pill; results 2dp below it in their own `surface-container-high` container with 12dp corners, at least 240dp tall and at most 2/3 of the screen |
| Contained, full screen | `surface-container-low`, the bar inset 12dp |
| Divided, docked | The bar's lower corners square off above a 1dp `outline` divider; 28dp corners overall |
| Divided, full screen | A 72dp header, no corners, `surface-container-high` |
| Scrim | 0.32, docked |
| Suggestions | 56dp one-line list items, Body Large, 16dp padding; the option the arrows reach at 10% with the focus ring |
| Motion | The results reveal over 300ms on emphasized decelerate; not with reduced motion |
