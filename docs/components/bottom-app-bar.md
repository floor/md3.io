# Bottom app bar

A bottom app bar puts a screen's frequent actions within thumb reach on a phone: a row of icon
buttons and, often, a [FAB](fab.md). M3 Expressive replaces it with the docked toolbar; this
page describes the bar as mtrl ships it today. See the
[M3 bottom app bar guidelines](https://m3.material.io/components/bottom-app-bar/overview).

## Usage

The actions sit at the leading side and the FAB at the trailing end. Icon buttons need
`ariaLabel` to name them.

```example
bottom-app-bar:
  actions:
    - { icon: searchIcon, ariaLabel: Search }
    - { icon: heartOutlineIcon, ariaLabel: Favorite }
    - { icon: shareIcon, ariaLabel: Share }
  fab: { icon: addIcon, ariaLabel: Compose }
```

## Examples

### A centered FAB

`fabPosition: 'center'` puts the FAB in the middle of the bar, and the actions keep the
leading side.

```example
bottom-app-bar:
  fabPosition: center
  actions:
    - { icon: menuIcon, ariaLabel: Menu }
  fab: { icon: photoIcon, ariaLabel: Scan }
```

### Hiding on scroll

With `autoHide`, the bar slides out once the window scrolls more than 10px down, and back on
the way up, over `transitionDuration` milliseconds.

```example
bottom-app-bar:
  autoHide: true
  transitionDuration: 200
  actions:
    - { icon: searchIcon, ariaLabel: Search }
```

Auto-hide follows the window; a bar over its own scrolling container is driven with `show()`
and `hide()`. `onVisibilityChange(visible)` is called whenever the bar hides or shows,
whatever caused it. The bar is `position: absolute` at the bottom of its container, so that
container needs `position: relative`, and room at the end of its content for the bar.

## API

<!-- API: generated from mtrl's types and <m-bottom-app-bar>'s spec in a later step. Until then these
tables are hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `hasFab` | `boolean` | `false` | The bar's height with a FAB from the start; `addFab()` sets it too |
| `fabPosition` | `'center' \| 'end'` | `'end'` | Where the FAB sits |
| `autoHide` | `boolean` | `false` | Hide on scroll down, show on scroll up |
| `transitionDuration` | `number` | `300` | Milliseconds for the slide; applied with `autoHide` |
| `onVisibilityChange` | `(visible: boolean) => void` | — | Called when the bar hides or shows |
| `tag` | `string` | `'div'` | The element to build the bar from |
| `class` | `string` | — | Extra classes on the element |
| `prefix` | `string` | `'mtrl'` | Class-name prefix |
| `componentName` | `string` | `'bottom-app-bar'` | Name used in class generation |

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `addAction(button)` | `BottomAppBar` | Appends an element to the actions |
| `addFab(fab)` | `BottomAppBar` | Replaces the FAB, and gives the bar its height with a FAB |
| `show()` / `hide()` | `BottomAppBar` | Slides the bar into or out of view |
| `isVisible()` | `boolean` | Whether it is shown |
| `getActionsContainer()` | `HTMLElement` | The actions container, to remove or reorder actions |
| `destroy()` | `void` | Removes the bar and its window scroll listener |

### Events

The bar emits no events: `onVisibilityChange` reports its visibility.

## Accessibility

- The bar is a `toolbar` named "Bottom app bar"; the web component's `aria-label` names it
  instead. Its buttons are each in the tab order: the toolbar has no arrow-key navigation.
- Each icon button and the FAB need their `ariaLabel`.
- Hidden, the bar is moved out of view and stays in the tab order.

## Styling

The background is the theme's `surface-container`. Hiding is `transform: translateY(100%)`.

```css
.mtrl-bottom-app-bar { }
.mtrl-bottom-app-bar--with-fab, .mtrl-bottom-app-bar--fab-center, .mtrl-bottom-app-bar--hidden { }
.mtrl-bottom-app-bar__actions, .mtrl-bottom-app-bar__fab-container { }
```

## Measurements

| Attribute | Value |
|-----------|-------|
| Height | 80dp; 72dp with a FAB |
| Padding | 12dp top and bottom, 4dp leading, 16dp trailing |
| Space between actions | 4dp |
| Elevation | Level 2 |
| Corners | None |
