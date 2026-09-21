# Search Component

The Search component provides a Material Design 3 compliant search interface that allows users to search through content using text queries. It implements the MD3 Search Bar and Search View patterns with support for suggestions, keyboard navigation, and seamless state transitions.

## Overview

Search is commonly used for:

- Filtering lists and collections
- Navigating to content
- Finding specific items in large datasets
- Global application search
- Command palettes

The component follows Material Design 3 guidelines with two distinct states:
- **Search Bar**: Collapsed, pill-shaped input for initiating search
- **Search View**: Expanded container displaying suggestions and results

## Import

```javascript
import { createSearch } from 'mtrl';
```

## Basic Usage

```javascript
// Create a basic search bar
const search = createSearch({
  placeholder: 'Search...',
  onSubmit: (value) => {
    console.log('Search for:', value);
  }
});

// Add to your page
document.querySelector('.header').appendChild(search.element);

// Listen for input changes
search.on('input', (e) => {
  console.log('Query:', e.value);
});
```

## Configuration

The Search component accepts the following configuration options:

### State Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `initialState` | `'bar' \| 'view'` | `'bar'` | Initial component state (collapsed or expanded) |
| `viewMode` | `'docked' \| 'fullscreen'` | `'docked'` | Display mode when expanded |
| `disabled` | `boolean` | `false` | Whether the search is initially disabled |

### Content Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `placeholder` | `string` | `'Search'` | Placeholder/supporting text |
| `value` | `string` | `''` | Initial input value |
| `leadingIcon` | `string` | `undefined` | Custom leading icon HTML |
| `trailingItems` | `SearchTrailingItem[]` | `undefined` | Trailing icons or avatar |
| `suggestions` | `SearchSuggestion[] \| string[]` | `undefined` | Suggestions to display |

### Behavior Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showClearButton` | `boolean` | `true` | Show clear button when input has value |
| `expandOnFocus` | `boolean` | `true` | Auto-expand to view on focus |
| `collapseOnBlur` | `boolean` | `true` | Auto-collapse when blurred |
| `collapseDelay` | `number` | `150` | Delay (ms) before collapsing on blur |

### Sizing Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `minWidth` | `number` | `360` | Minimum width in pixels |
| `maxWidth` | `number` | `720` | Maximum width in pixels |
| `fullWidth` | `boolean` | `false` | Ignore min/max width constraints |

### Event Handlers

| Option | Type | Description |
|--------|------|-------------|
| `onSubmit` | `(value: string) => void` | Called when search is submitted |
| `onInput` | `(value: string) => void` | Called when input value changes |
| `onClear` | `() => void` | Called when input is cleared |
| `onExpand` | `() => void` | Declared in `SearchConfig` but never called — the `expand` event is emitted without invoking this handler. Use `search.on('expand', ...)` |
| `onCollapse` | `() => void` | Declared in `SearchConfig` but never called — the `collapse` event is emitted without invoking this handler. Use `search.on('collapse', ...)` |
| `onSuggestionSelect` | `(suggestion: SearchSuggestion) => void` | Called when a suggestion is selected |

## Search States

The Search component has two primary states following MD3 specifications:

### Search Bar (Collapsed)

The default collapsed state showing a pill-shaped input field.

- Height: 56px
- Width: 360-720px (configurable)
- Shape: Pill (full rounded corners)
- Leading icon: Search magnifying glass
- Trailing: Optional icons or avatar

### Search View (Expanded)

The expanded state showing the input with suggestions/results below.

- **Docked mode**: Inline expansion (360-720px width, max 2/3 screen height)
- **Fullscreen mode**: Full-screen overlay (72px header height)

## Component API

The Search component provides the following methods:

### Value Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getValue()` | none | `string` | Gets the current search value |
| `setValue(value, trigger?)` | `value: string, trigger?: boolean` | `SearchComponent` | Sets the search value |
| `getPlaceholder()` | none | `string` | Gets the current placeholder text |
| `setPlaceholder(text)` | `text: string` | `SearchComponent` | Sets the placeholder text |

### State Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `expand()` | none | `SearchComponent` | Expands to search view |
| `collapse()` | none | `SearchComponent` | Collapses to search bar |
| `getState()` | none | `'bar' \| 'view'` | Gets the current state |
| `isExpanded()` | none | `boolean` | Checks if currently expanded |
| `setViewMode(mode)` | `mode: 'docked' \| 'fullscreen'` | `SearchComponent` | Sets the view mode |
| `getViewMode()` | none | `'docked' \| 'fullscreen'` | Gets the current view mode |

### Input Control Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `focus()` | none | `SearchComponent` | Focuses the search input |
| `blur()` | none | `SearchComponent` | Blurs the search input |
| `clear()` | none | `SearchComponent` | Clears the search input |
| `submit()` | none | `SearchComponent` | Submits the current search value |

### Suggestion Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setSuggestions(items)` | `items: SearchSuggestion[] \| string[]` | `SearchComponent` | Sets suggestions list |
| `getSuggestions()` | none | `SearchSuggestion[]` | Gets current suggestions |
| `clearSuggestions()` | none | `SearchComponent` | Clears all suggestions |

### Disabled State Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `enable()` | none | `SearchComponent` | Enables the component |
| `disable()` | none | `SearchComponent` | Disables the component |
| `isDisabled()` | none | `boolean` | Checks if disabled |

### Event Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `on(event, handler)` | `event: string, handler: Function` | `SearchComponent` | Adds event listener |
| `off(event, handler)` | `event: string, handler: Function` | `SearchComponent` | Removes event listener |

### Lifecycle Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `destroy()` | none | `void` | Destroys the component and cleans up |

## Events

The Search component emits the following events:

| Event | Payload | Description |
|-------|---------|-------------|
| `focus` | `SearchEvent` | Input received focus |
| `blur` | `SearchEvent` | Input lost focus |
| `input` | `SearchEvent` | Input value changed |
| `submit` | `SearchEvent` | Search submitted (Enter key) |
| `clear` | `SearchEvent` | Input cleared (clear button) |
| `expand` | `SearchEvent` | Expanded to view state |
| `collapse` | `SearchEvent` | Collapsed to bar state |
| `suggestionSelect` | `SearchEvent` | Suggestion was selected |

### SearchEvent Object

```text
{
  component: SearchComponent,  // The search component instance
  value: string,               // Current search value
  originalEvent: Event | null, // Original DOM event
  suggestion?: SearchSuggestion, // Selected suggestion (for suggestionSelect)
  preventDefault: () => void,  // Prevent default behavior
  defaultPrevented: boolean    // Whether default was prevented
}
```

`expand` and `collapse` are the exception: they carry
`{ component, state, viewMode }` only — no `value`, `originalEvent`,
`preventDefault` or `defaultPrevented`.


## Examples

### Basic Search Bar

```javascript
const search = createSearch({
  placeholder: 'Search products...',
  onSubmit: (value) => {
    performSearch(value);
  }
});

document.querySelector('.toolbar').appendChild(search.element);
```

### Search with Suggestions

```javascript
const search = createSearch({
  placeholder: 'Search...',
  suggestions: [
    { text: 'Apple', icon: fruitIcon },
    { text: 'Banana', icon: fruitIcon },
    { text: 'Cherry', icon: fruitIcon }
  ],
  onSuggestionSelect: (suggestion) => {
    console.log('Selected:', suggestion.text);
  }
});
```

### Search with String Suggestions

```javascript
// Simple string array - automatically converted to SearchSuggestion objects
const search = createSearch({
  placeholder: 'Search cities...',
  suggestions: ['New York', 'Los Angeles', 'Chicago', 'Houston']
});
```

### Search with Grouped Suggestions

```javascript
const search = createSearch({
  placeholder: 'Search...',
  suggestions: [
    { text: 'Recent: Document.pdf', group: 'recent', icon: historyIcon },
    { text: 'Recent: Photo.jpg', group: 'recent', icon: historyIcon },
    { text: 'Suggested: Reports', group: 'suggested', icon: folderIcon },
    { text: 'Suggested: Images', group: 'suggested', icon: folderIcon }
  ]
});
```

### Fullscreen Search (Mobile)

```javascript
const search = createSearch({
  placeholder: 'Search...',
  viewMode: 'fullscreen',
  expandOnFocus: true
});
```

### Inline Search (No Auto-Expand)

```javascript
// Useful for filter bars where you don't want view expansion
const search = createSearch({
  placeholder: 'Filter items...',
  expandOnFocus: false,
  collapseOnBlur: false,
  fullWidth: true
});
```

### Search with Trailing Items

```javascript
const search = createSearch({
  placeholder: 'Search...',
  trailingItems: [
    {
      id: 'mic',
      type: 'icon',
      content: microphoneIcon,
      ariaLabel: 'Voice search',
      onClick: () => startVoiceSearch()
    },
    {
      id: 'avatar',
      type: 'avatar',
      content: '<img src="user.jpg" alt="User">'
    }
  ]
});
```

### Dynamic Suggestions

```javascript
const search = createSearch({
  placeholder: 'Search users...'
});

// Update suggestions based on input
search.on('input', async (e) => {
  if (e.value.length >= 2) {
    const results = await fetchUsers(e.value);
    search.setSuggestions(results.map(user => ({
      text: user.name,
      value: user.id,
      icon: userIcon
    })));
  } else {
    search.clearSuggestions();
  }
});

// Handle selection
search.on('suggestionSelect', (e) => {
  navigateToUser(e.suggestion.value);
});
```

### Programmatic Control

```javascript
const search = createSearch({
  placeholder: 'Search...'
});

// Expand programmatically
document.querySelector('.search-trigger').addEventListener('click', () => {
  search.expand();
  search.focus();
});

// Set value programmatically
search.setValue('initial query');

// Clear and refocus
search.clear().focus();

// Check state
if (search.isExpanded()) {
  search.collapse();
}
```

### Event Handling

```javascript
const search = createSearch({
  placeholder: 'Search...'
});

search
  .on('focus', () => console.log('Search focused'))
  .on('blur', () => console.log('Search blurred'))
  .on('input', (e) => console.log('Input:', e.value))
  .on('submit', (e) => console.log('Submit:', e.value))
  .on('clear', () => console.log('Cleared'))
  .on('expand', () => console.log('Expanded'))
  .on('collapse', () => console.log('Collapsed'));
```

## Keyboard Support

The Search component supports full keyboard navigation per MD3 specifications:

| Key | Action |
|-----|--------|
| `Enter` | Submit search or select highlighted suggestion |
| `Escape` | Clear input (if has value) or collapse (if empty) |
| `ArrowDown` | Move to next suggestion |
| `ArrowUp` | Move to previous suggestion |
| `Tab` | Select highlighted suggestion and move focus |

## CSS Customization

The Search component uses BEM-style class naming with the `mtrl-` prefix:

### Root Element

```css
.mtrl-search { }                    /* Root container */
.mtrl-search--bar { }               /* Bar state (collapsed) */
.mtrl-search--view { }              /* View state (expanded) */
.mtrl-search--docked { }            /* Docked view mode */
.mtrl-search--fullscreen { }        /* Fullscreen view mode */
.mtrl-search--focused { }           /* Input is focused */
.mtrl-search--disabled { }          /* Component is disabled */
.mtrl-search--populated { }         /* Input has value */
.mtrl-search--full-width { }        /* Full width mode */
```

### Structure Elements

```css
.mtrl-search__container { }         /* Header/bar container */
.mtrl-search__leading-icon { }      /* Leading icon button */
.mtrl-search__input-wrapper { }     /* Input wrapper */
.mtrl-search__input { }             /* Text input field */
.mtrl-search__clear-button { }      /* Clear button */
.mtrl-search__clear-button--hidden { } /* Hidden clear button */
.mtrl-search__trailing-icon { }     /* Trailing icon button */
.mtrl-search__avatar { }            /* Trailing avatar */
.mtrl-search__divider { }           /* Header/content divider */
.mtrl-search__content { }           /* Content area (view mode) */
```

### Suggestion Elements

```css
.mtrl-search__suggestions { }       /* Suggestions container */
.mtrl-search__suggestion-list { }   /* Suggestions list (ul) */
.mtrl-search__suggestion-item { }   /* Individual suggestion (li) */
.mtrl-search__suggestion-item--selected { } /* Highlighted suggestion */
.mtrl-search__suggestion-icon { }   /* Suggestion icon */
.mtrl-search__suggestion-text { }   /* Suggestion text */
.mtrl-search__suggestion-divider { } /* Divider between groups */
```

### Customization Example

```css
/* Custom search bar styling */
.mtrl-search__container {
  background-color: var(--my-surface-color);
  border: 1px solid var(--my-border-color);
}

/* Custom input styling */
.mtrl-search__input {
  font-size: 14px;
}

/* Custom suggestion hover state */
.mtrl-search__suggestion-item:hover {
  background-color: var(--my-hover-color);
}

/* Reduce height for compact layouts */
.my-compact-search .mtrl-search__container {
  height: 40px;
}
```

## Accessibility

The Search component follows accessibility best practices:

- Uses `role="search"` on the root element
- Provides `aria-label` on the input
- Uses `role="listbox"` for suggestions list
- Uses `role="option"` for suggestion items
- Announces suggestion count to screen readers
- Supports full keyboard navigation
- Uses `aria-disabled` for disabled state
- Clear button has descriptive `aria-label`

### Minimum Touch Target

All interactive elements (icons, buttons) meet the 48x48dp minimum touch target requirement.

## MD3 Design Tokens

The Search component uses these Material Design 3 tokens:

### Colors

| Element | Token |
|---------|-------|
| Container background | `md.sys.color.surface-container-high` |
| Leading icon | `md.sys.color.on-surface` (bar), `md.sys.color.on-surface-variant` (view) |
| Input text | `md.sys.color.on-surface` |
| Placeholder text | `md.sys.color.on-surface-variant` |
| Divider | `md.sys.color.outline-variant` |

### Measurements

| Element | Value |
|---------|-------|
| Bar height | 56px |
| Bar min width | 360px |
| Bar max width | 720px |
| View docked header height | 56px |
| View fullscreen header height | 72px |
| View docked min height | 240px |
| Horizontal padding | 16px |
| Icon size | 24px |
| Avatar size | 30px |
| Icon spacing | 16px |

## Best Practices

1. **Use appropriate placeholder text** - Be descriptive but concise (e.g., "Search products..." not just "Search")

2. **Provide suggestions when possible** - Help users find what they're looking for faster

3. **Handle empty states** - Show helpful messaging when no results are found

4. **Consider mobile** - Use `fullscreen` view mode on small screens for better UX

5. **Disable auto-expand for inline filters** - Set `expandOnFocus: false` when using search as a filter in toolbars

6. **Always handle the submit event** - Users expect Enter to perform the search

7. **Debounce dynamic suggestions** - Avoid excessive API calls on every keystroke

8. **Use clear button appropriately** - The clear button should clear input, not close search

## Performance Considerations

- **Lazy rendering**: Suggestion container is only added to DOM when expanded
- **Efficient updates**: Only re-renders suggestions when data changes
- **Debounce input handlers**: For API-based suggestions, implement debouncing
- **Virtual scrolling**: For large suggestion lists, consider implementing virtual scrolling

## TypeScript Types

```typescript
type SearchState = 'bar' | 'view';
type SearchViewMode = 'docked' | 'fullscreen';
type SearchEventType = 
  | 'focus' | 'blur' | 'input' | 'submit' 
  | 'clear' | 'expand' | 'collapse' | 'suggestionSelect';

interface SearchSuggestion {
  text: string;
  value?: string;
  icon?: string;
  group?: string;
}

interface SearchTrailingItem {
  id: string;
  content: string;
  type: 'icon' | 'avatar';
  ariaLabel?: string;
  onClick?: (event: MouseEvent) => void;
}

interface SearchConfig {
  initialState?: SearchState;
  viewMode?: SearchViewMode;
  disabled?: boolean;
  placeholder?: string;
  value?: string;
  leadingIcon?: string;
  trailingItems?: SearchTrailingItem[];
  suggestions?: SearchSuggestion[] | string[];
  showClearButton?: boolean;
  expandOnFocus?: boolean;
  collapseOnBlur?: boolean;
  collapseDelay?: number;
  minWidth?: number;
  maxWidth?: number;
  fullWidth?: boolean;
  class?: string;
  onSubmit?: (value: string) => void;
  onInput?: (value: string) => void;
  onClear?: () => void;
  onExpand?: () => void;
  onCollapse?: () => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
}

interface SearchComponent {
  element: HTMLElement;
  setValue(value: string, triggerEvent?: boolean): SearchComponent;
  getValue(): string;
  setPlaceholder(text: string): SearchComponent;
  getPlaceholder(): string;
  expand(): SearchComponent;
  collapse(): SearchComponent;
  getState(): SearchState;
  isExpanded(): boolean;
  setViewMode(mode: SearchViewMode): SearchComponent;
  getViewMode(): SearchViewMode;
  focus(): SearchComponent;
  blur(): SearchComponent;
  clear(): SearchComponent;
  submit(): SearchComponent;
  setSuggestions(suggestions: SearchSuggestion[] | string[]): SearchComponent;
  getSuggestions(): SearchSuggestion[];
  clearSuggestions(): SearchComponent;
  enable(): SearchComponent;
  disable(): SearchComponent;
  isDisabled(): boolean;
  on(event: SearchEventType, handler: (e: SearchEvent) => void): SearchComponent;
  off(event: SearchEventType, handler: (e: SearchEvent) => void): SearchComponent;
  destroy(): void;
}
```

## Migration from Previous Version

If you're upgrading from the previous search component implementation:

### Breaking Changes

1. **Removed variants**: `rail`, `drawer`, `modal`, `standard` variants removed
   - Use `initialState: 'bar'` or `initialState: 'view'` instead

2. **Renamed properties**:
   - `variant` → `initialState` (for bar/view state)
   - `trailingIcon` / `trailingIcon2` → `trailingItems` array

3. **New class names** (BEM format):
   - `.mtrl-search-container` → `.mtrl-search__container`
   - `.mtrl-search-input` → `.mtrl-search__input`
   - `.mtrl-search-leading-icon` → `.mtrl-search__leading-icon`
   - etc.

4. **New events**:
   - `expand` and `collapse` events added
   - `suggestionSelect` replaces suggestion click handling

### Migration Example

```javascript
// Before
const before = createSearch({
  variant: 'bar',
  trailingIcon: micIcon,
  trailingIcon2: avatarHtml
});

// After
const after = createSearch({
  initialState: 'bar',
  trailingItems: [
    { id: 'mic', type: 'icon', content: micIcon },
    { id: 'avatar', type: 'avatar', content: avatarHtml }
  ]
});
```
