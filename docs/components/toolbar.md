---
created: 2026-09-30
updated: 2026-09-30
status: draft
---

# Toolbar

A toolbar holds the actions for the current page or the current selection: icon buttons, a
few buttons, a text field. M3 Expressive has two. The **docked** toolbar spans the bottom of
the window and holds global actions; it replaces the [bottom app bar](bottom-app-bar.md). The
**floating** toolbar is a pill above the content and holds contextual actions, such as
formatting, and can pair with a [FAB](fab.md). Don't show a toolbar and a navigation bar at the
same time. See the [M3 toolbar guidelines](https://m3.material.io/components/toolbars/overview).

## Usage

A docked toolbar spreads its items across the width. Icon buttons need `ariaLabel` to name
them, and the toolbar needs `ariaLabel` of its own when a page has more than one.

```example
toolbar:
  ariaLabel: Message actions
  items:
    - { icon: inboxIcon, ariaLabel: Move to inbox }
    - { icon: labelIcon, ariaLabel: Label }
    - { icon: shareIcon, ariaLabel: Share }
    - { icon: moreIcon, ariaLabel: More }
```

## Examples

### Floating, with toggles

The floating toolbar is a pill, elevated by default. Toggle icon buttons keep their pressed
state, for choices such as marking a photo.

```example
toolbar:
  variant: floating
  ariaLabel: Mark photo
  items:
    - { icon: heartOutlineIcon, ariaLabel: Favorite, toggle: true, selected: true }
    - { icon: starIcon, ariaLabel: Star, toggle: true }
    - { icon: labelIcon, ariaLabel: Label, toggle: true }
```

### Vibrant

`color: 'vibrant'` puts the toolbar on primary container, for more emphasis or a temporary
mode such as editing.

```example
toolbar:
  variant: floating
  color: vibrant
  ariaLabel: Editing
  items:
    - { icon: closeIcon, ariaLabel: Cancel }
    - { icon: copyIcon, ariaLabel: Copy }
    - { icon: checkIcon, ariaLabel: Done, variant: filled }
```

### Vertical

A floating toolbar can be vertical in larger windows, placed at the start or end of the
window, opposite a navigation rail. Up and Down then move between its items.

```example
toolbar:
  variant: floating
  orientation: vertical
  ariaLabel: Tools
  items:
    - { icon: editIcon, ariaLabel: Draw }
    - { icon: photoIcon, ariaLabel: Image }
    - { icon: shareIcon, ariaLabel: Share }
```

### Placement, a FAB and hiding on scroll

`placement` positions the toolbar in its container, which needs `position: relative`: a
horizontal floating toolbar 16dp above the bottom edge, a vertical one 24dp from the side. A
FAB passed as `fab` sits beside the toolbar, 8dp away. With `scrollBehavior: 'exit'`, the
toolbar leaves the screen after 40px of scrolling down and comes back after 40px up, or at the
top; `scrollTarget` names the element that scrolls, the window by default.

```javascript
import { createToolbar, createFab } from 'mtrl';

const toolbar = createToolbar({
  variant: 'floating',
  placement: 'bottom',
  scrollBehavior: 'exit',
  ariaLabel: 'Mark photo',
  items: [
    { icon: heartOutlineIcon, ariaLabel: 'Favorite', toggle: true },
    { icon: starIcon, ariaLabel: 'Star', toggle: true },
  ],
  fab: createFab({ icon: editIcon, ariaLabel: 'Edit', variant: 'primary-container' }),
});
document.body.append(toolbar.element);
```

Pair a vibrant toolbar with a `tertiary-container` FAB, a standard one with `primary-container`.

### An overflow menu

`overflow` adds a trailing "more" button and hands it to a function that builds the menu it
opens. The toolbar never loads a menu of its own, so it costs nothing when unused. What the
function returns is destroyed with the toolbar.

```javascript
import { createToolbar, createMenu } from 'mtrl';

const toolbar = createToolbar({
  ariaLabel: 'Actions',
  items: [{ icon: inboxIcon, ariaLabel: 'Move to inbox' }],
  overflow: (opener) => createMenu({
    opener,
    items: [{ id: 'move', text: 'Move to' }, { id: 'mute', text: 'Mute' }],
  }),
});
document.body.append(toolbar.element);
```

As an element, the menu goes in `slot="overflow"`, and `<m-toolbar>` anchors it to the button:

```html
<m-toolbar aria-label="Actions">
  <m-icon-button aria-label="Move to inbox"></m-icon-button>
  <m-menu slot="overflow">
    <m-menu-item value="move">Move to</m-menu-item>
    <m-menu-item value="mute">Mute</m-menu-item>
  </m-menu>
</m-toolbar>
```

## API

<!-- API: hand-written, like the other pages until they are generated. Keep them in line with
the code, and add no prose restating them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `variant` | `'docked' \| 'floating'` | `'docked'` | Full width at the bottom, or a pill above the content |
| `color` | `'standard' \| 'vibrant'` | `'standard'` | Surface container, or primary container |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | A floating toolbar's layout; docked is always horizontal |
| `placement` | `'none' \| 'bottom' \| 'top' \| 'start' \| 'end'` | `'none'` | Where it sits in its positioned container; docked takes only `'bottom'` |
| `arrangement` | `'spread' \| 'center'` | `'spread'` | A docked toolbar's items spread, or centred 32dp apart |
| `elevated` | `boolean` | `true` for floating | Level 1 shadow; a docked toolbar has none |
| `items` | `ToolbarItem[]` | `[]` | Icon button configs, button configs with `text`, or elements and components |
| `fab` | `HTMLElement \| { element }` | — | A FAB beside the toolbar, outside its tab stop |
| `fabPosition` | `'start' \| 'end'` | `'end'` | The FAB's end of the toolbar |
| `overflow` | `(opener: HTMLElement) => unknown` | — | Builds the menu the "more" button opens |
| `overflowIcon` | `string` | more vertical | The overflow button's icon |
| `overflowLabel` | `string` | `'More options'` | The overflow button's name |
| `scrollBehavior` | `'none' \| 'exit'` | `'none'` | Leave the screen while scrolling forward |
| `scrollTarget` | `HTMLElement \| Window` | `window` | What scrolls |
| `scrollThreshold` | `number` | `40` | Pixels of scrolling that hide or show it |
| `ariaLabel` | `string` | `'Toolbar'` | The toolbar's accessible name |
| `class` | `string` | — | Extra classes on the element |

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `add(item)` | `item: ToolbarItem` | `HTMLElement` | Adds an item before the overflow button |
| `remove(item)` | `item: HTMLElement \| { element }` | `ToolbarComponent` | Removes an item; one the toolbar created is destroyed |
| `getItems()` | — | `HTMLElement[]` | The item elements, without the overflow button |
| `show()` | — | `ToolbarComponent` | Brings it back on screen |
| `hide()` | — | `ToolbarComponent` | Moves it off screen and out of the focus order |
| `isVisible()` | — | `boolean` | Whether it is on screen |
| `setColor(color)` | `color: 'standard' \| 'vibrant'` | `ToolbarComponent` | Changes the colour |
| `getColor()` | — | `'standard' \| 'vibrant'` | The current colour |
| `destroy()` | — | `void` | Removes it, its listeners and the items it created |

`bar` is the element with the `toolbar` role, and `overflowButton` the overflow button, or
`null`.

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `show` | — | It came back on screen |
| `hide` | — | It left the screen |

### Element

`<m-toolbar>` takes the options as attributes (`fab-position`, `scroll-behavior`,
`scroll-threshold`, `overflow-label`), with `flat` for `elevated: false`. Its children are the
items; `slot="fab"` takes a FAB and `slot="overflow"` an `<m-menu>`. `show()` and `hide()`
dispatch `show` and `hide`.

## Accessibility

- The element with the `toolbar` role holds the items and is named by `ariaLabel`; a vertical
  toolbar sets `aria-orientation="vertical"`. The FAB is beside it, outside the toolbar.
- The toolbar is one tab stop. The arrow keys move along it (Left and Right follow the reading
  direction; Up and Down when vertical), Home and End go to the ends, and disabled items are
  skipped. Tab leaves it, and coming back lands on the item focused last.
- In a text field inside the toolbar, the arrow keys, Home and End stay with the caret.
- Off screen (`hide()`, or `scrollBehavior: 'exit'`), the toolbar and its FAB are `inert`.

## Styling

| Class | What it is |
|-------|------------|
| `.mtrl-toolbar` | The root: layout and placement |
| `.mtrl-toolbar__bar` | The element with the `toolbar` role |
| `.mtrl-toolbar__fab` | The FAB's container |
| `.mtrl-toolbar--docked`, `--floating` | The variant |
| `.mtrl-toolbar--vibrant` | The vibrant colour |
| `.mtrl-toolbar--hidden` | Off screen |

`--mtrl-toolbar-shape` overrides the container's corner: M3 allows a rounded docked toolbar on
the web and large screens.

## Measurements

| Attribute | Value | Token |
|-----------|-------|-------|
| Height | 64dp | `DockedToolbarTokens.ContainerHeight`, `FloatingToolbarTokens.ContainerHeight` |
| Docked padding | 16dp at each end | `DockedToolbarTokens.ContainerLeadingSpace`, `ContainerTrailingSpace` |
| Docked spacing, centred | 32dp | `DockedToolbarTokens.ContainerMaxSpacing` |
| Docked corner | none | `DockedToolbarTokens.ContainerShape` (CornerNone) |
| Floating padding | 8dp | `FloatingToolbarTokens.ContainerLeadingSpace`, `ContainerTrailingSpace` |
| Floating spacing | 4dp | `FloatingToolbarTokens.ContainerBetweenSpace` |
| Floating corner | full | `FloatingToolbarTokens.ContainerShape` (CornerFull) |
| Floating elevation | level 1 | `FloatingToolbarDefaults.ContainerExpandedElevationWithFab` |
| Floating margin | 16dp, 24dp vertical | `FloatingToolbarTokens.ContainerExternalPadding`; m3.material.io guidelines (vertical) |
| FAB gap | 8dp | `FloatingToolbarDefaults.ToolbarToFabGap` |
| Standard container | surface container | `DockedToolbarTokens.ContainerColor`, `FloatingToolbarTokens.StandardContainerColor` |
| Vibrant container | primary container | `FloatingToolbarTokens.VibrantContainerColor` |
| Vibrant items | on primary container; selected on surface container | `FloatingToolbarTokens.VibrantButton*` |
| Scroll threshold | 40dp | `FloatingToolbarDefaults.ScrollDistanceThreshold` |
