---
created: 2026-09-30
updated: 2026-11-09
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
top; `scrollTarget` names the element that scrolls, the window by default. With
`scrollBehavior: 'collapse'` on a **docked** toolbar, scrolling down 40px shrinks the bar from
64dp to 48dp and visually hides an icon+label button's text label while keeping every item on
screen, focusable, and named; scrolling back up 40px (or returning to the top) expands it again.
A **floating** toolbar is unaffected by `'collapse'` (on `variant: 'floating'`,
`scrollBehavior: 'collapse'` resolves to `'none'`).

```javascript
import { createToolbar, createFab } from 'material';

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
import { createToolbar, createMenu } from 'material';

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

### Migrating from the bottom app bar

`createBottomAppBar` and `<m-bottom-app-bar>` are deprecated in `3.x` in favour of a docked toolbar (`variant: 'docked'`, `placement: 'bottom'`).

**Factory recipe:**
```javascript
import { createToolbar, createFab } from 'material';

const bar = createToolbar({
  variant: 'docked',
  placement: 'bottom',
  scrollBehavior: 'exit',
  scrollThreshold: 10,
  ariaLabel: 'Bottom app bar',
  items: [
    { icon: searchIcon, ariaLabel: 'Search' },
    { icon: inboxIcon, ariaLabel: 'Archive' },
  ],
  fab: createFab({ icon: addIcon, ariaLabel: 'Create' }),
  fabPosition: 'end',
});
```

**Web component recipe:**
```html
<m-toolbar
  variant="docked"
  placement="bottom"
  scroll-behavior="exit"
  scroll-threshold="10"
  aria-label="Bottom app bar"
>
  <m-icon-button aria-label="Search"></m-icon-button>
  <m-icon-button aria-label="Archive"></m-icon-button>
  <m-fab slot="fab" aria-label="Create"></m-fab>
</m-toolbar>
```

**Parity with `bottom-app-bar` (13 rows):**

| Feature | Bottom app bar (`3.x`) | Docked toolbar | Status |
| --- | --- | --- | --- |
| Embedded FAB | `hasFab`, `fabPosition`: `'center'` or `'end'`, `addFab()` | `fab` config, `fabPosition`: `'start'` or `'end'`, `slot="fab"` | End and start match. **A centred FAB (`'center'`) is not yet available on the docked toolbar.** |
| Actions | `addAction(button)` appends to the actions container; `getActionsContainer()` | `items` at creation, `add(item)` at runtime, `getItems()`, `remove(item)`; `toolbar.bar` is the element with the toolbar role | Match: `addAction` becomes `add`, `getActionsContainer` becomes `bar` / `getItems`. |
| Add a FAB after creation | `addFab(fab)` replaces the FAB and adds `--with-fab` | `fab` is read at creation only; `ToolbarComponent` has no `addFab` | **`addFab()` after creation is not yet available on the docked toolbar.** |
| Hide on scroll | `autoHide`; hides past a `10px` scroll delta; no `inert`; inline `300ms` transition | `scrollBehavior: 'exit'`; `scrollThreshold` (default `40`, so set `scrollThreshold: 10` to match); a hidden toolbar is also `inert` | Equivalent with `scrollBehavior: 'exit', scrollThreshold: 10`. Differences: default threshold is `40`, and the hidden toolbar leaves the focus order. |
| Elevation | Level 2, always | Level 0 on a docked toolbar; `elevated` applies to floating only | No option. Recreate the shadow with `box-shadow` on `::part(toolbar)` if the page needs it. |
| Custom `transitionDuration` | Inline `transform <n>ms ease-in-out` | Motion tokens (`spring-fast-spatial`); no duration option | **A custom transition duration is not yet available on the docked toolbar.** |
| Custom `tag` | `tag: 'footer'` and similar | The factory renders a `div`; the element is `<m-toolbar>` | **A custom tag is not yet available on the docked toolbar.** |
| Density | No density option | No density option | Parity: neither component exposes one, so nothing to map. |
| SSR and pre-upgrade reservation | SSR through the shared element renderer; before upgrade it is `position: absolute; bottom: 0; left: 0; right: 0` and reserves `80px` (`72px` after upgrade when a FAB is present) | SSR through the shared element renderer; before upgrade it is in flow and reserves `64px` (`min-height`) | Both render on the server and upgrade in place. The reservation differs: `80px` absolute at the bottom versus `64px` in flow. Position the container and set the height in CSS where the old reservation mattered. |
| Element attributes | `fab-position`, `auto-hide`, `transition-duration`, `aria-label` | `variant`, `placement`, `scroll-behavior`, `scroll-threshold`, `fab-position`, `color`, `arrangement`, `flat`, `orientation`, `overflow-label`, `aria-label` | `fab-position` and `aria-label` keep their names. `auto-hide` becomes `scroll-behavior="exit"` (plus `scroll-threshold="10"` to match); `transition-duration` has no equivalent. |
| Shadow parts | `bottom-app-bar`, `actions`, `fab-container` | `toolbar`, `bar`, `fab`, `overflow` | Renamed, with no aliases: `bottom-app-bar` -> `toolbar`, `actions` -> `bar`, `fab-container` -> `fab`; `overflow` is new. |
| Root role and tab order | `role="toolbar"` on the component element; actions stay in the normal `Tab` order | `role="toolbar"` on the inner `bar`; one tab stop with `ArrowLeft`/`ArrowRight`/`Home`/`End` (roving tabindex) | The accessible role is the same. The toolbar moves focus as a single tab stop, which is a keyboard-behaviour change for anyone who tabbed through every action. |
| Visibility callback | `onVisibilityChange(visible)` | `show` and `hide` events via `toolbar.on('show', handler)` / `.on('hide', handler)`, and `isVisible()` | Match: the callback becomes an event listener. |

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
| `scrollBehavior` | `'none' \| 'exit' \| 'collapse'` | `'none'` | `'exit'` leaves the screen while scrolling forward; `'collapse'` (docked only; floating is unaffected and resolves to `'none'`) shrinks the bar to 48dp and visually hides an icon+label button's label |
| `scrollTarget` | `HTMLElement \| Window` | `window` | What scrolls, for `'exit'` or `'collapse'` |
| `scrollThreshold` | `number` | `40` | Pixels of scrolling that trigger `'exit'` or `'collapse'` |
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
| `show` | — | It came back on screen (`scrollBehavior: 'exit'` or `show()`) |
| `hide` | — | It left the screen (`scrollBehavior: 'exit'` or `hide()`) |
| `collapse` | — | A docked toolbar shrank on forward scroll (`scrollBehavior: 'collapse'`) |
| `expand` | — | A docked toolbar restored its height on reverse scroll (`scrollBehavior: 'collapse'`) |

### Element

`<m-toolbar>` takes the options as attributes (`fab-position`, `scroll-behavior`,
`scroll-threshold`, `overflow-label`), with `flat` for `elevated: false`. Its children are the
items; `slot="fab"` takes a FAB and `slot="overflow"` an `<m-menu>`. `show()` and `hide()`
dispatch `show` and `hide`; with `scroll-behavior="collapse"`, a docked `<m-toolbar>` dispatches
`collapse` and `expand`.

## Accessibility

- The element with the `toolbar` role holds the items and is named by `ariaLabel`; a vertical
  toolbar sets `aria-orientation="vertical"`. The FAB is beside it, outside the toolbar.
- The toolbar is one tab stop. The arrow keys move along it (Left and Right follow the reading
  direction; Up and Down when vertical), Home and End go to the ends, and disabled items are
  skipped. Tab leaves it, and coming back lands on the item focused last.
- In a text field inside the toolbar, the arrow keys, Home and End stay with the caret.
- Off screen (`hide()`, or `scrollBehavior: 'exit'`), the toolbar and its FAB are `inert`.
- Collapsed (`scrollBehavior: 'collapse'`, docked only), the toolbar stays on screen and is **not** `inert`: items keep their focus order and 48dp target areas, and an icon+label button's label is visually hidden rather than removed so its accessible name is preserved.

## Styling

| Class | What it is |
|-------|------------|
| `.mtrl-toolbar` | The root: layout and placement |
| `.mtrl-toolbar__bar` | The element with the `toolbar` role |
| `.mtrl-toolbar__fab` | The FAB's container |
| `.mtrl-toolbar--docked`, `--floating` | The variant |
| `.mtrl-toolbar--vibrant` | The vibrant colour |
| `.mtrl-toolbar--hidden` | Off screen |
| `.mtrl-toolbar--collapsed` | Collapsed docked bar (48dp `min-height`, icon+label button labels visually hidden) |

`--mtrl-toolbar-shape` overrides the container's corner: M3 allows a rounded docked toolbar on
the web and large screens.

## Measurements

| Attribute | Value | Token |
|-----------|-------|-------|
| Height | 64dp (48dp collapsed when docked; 56dp floor with a 56dp FAB or text field) | `DockedToolbarTokens.ContainerHeight`, `FloatingToolbarTokens.ContainerHeight`; m3.material.io toolbars guidelines (48dp minimum target area) |
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
