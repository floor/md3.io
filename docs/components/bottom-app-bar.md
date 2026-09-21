# Bottom App Bar Component

The bottom app bar puts a screen's actions within thumb reach on a phone: a row
of icon buttons on the left and, usually, a [FAB](./fab.md) on the right. It
pins itself to the bottom of its positioned container, and it can hide itself
while the user scrolls down so the content gets the whole screen.

## Overview

The component is a `role="toolbar"` container holding two slots it builds for
you: an actions container on the leading side and a FAB container on the
trailing side. You fill them with `addAction()` and `addFab()`; the bar owns
nothing else about their contents.

Two things it does own:

- **the FAB slot** — `fabPosition: 'end'` leaves the FAB at the trailing edge,
  `'center'` absolutely centres it in the bar. Declaring `hasFab: true` at
  creation switches the bar to its shorter with-FAB height even before a FAB is
  added.
- **auto-hide** — with `autoHide`, the bar listens on `window` and slides out of
  view once the page scrolls more than 10px down, sliding back on the way up.

The element is `position: absolute`, so the thing you put it in needs to be
positioned. The showcase does exactly that: a `position: relative` demo box with
the bar pinned to its bottom edge.

## Import

```javascript
import { createBottomAppBar } from 'mtrl';
```

## Basic Usage

```javascript
const bar = createBottomAppBar();

bar.addAction(searchButton.element);
bar.addAction(favoriteButton.element);
bar.addAction(shareButton.element);
bar.addFab(composeFab.element);

screen.appendChild(bar.element);  // screen is position: relative
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `hasFab` | `boolean` | `false` | Marks the bar as carrying a FAB from the start |
| `fabPosition` | `'center' \| 'end'` | `'end'` | Where the FAB container sits |
| `autoHide` | `boolean` | `false` | Hide on scroll down, show on scroll up |
| `transitionDuration` | `number` | `300` | Milliseconds for the show and hide slide. Only applied when `autoHide` is on |
| `onVisibilityChange` | `(visible: boolean) => void` | — | Called when scrolling hides or shows the bar |
| `tag` | `string` | `'div'` | Element to build the bar from |
| `class` | `string` | — | Extra classes on the element |
| `prefix` | `string` | `'mtrl'` | Class-name prefix |
| `componentName` | `string` | `'bottom-app-bar'` | Name used in class generation |

## Component API

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `addAction(button)` | `button: HTMLElement` | `BottomAppBar` | Appends an element to the actions container |
| `addFab(fab)` | `fab: HTMLElement` | `BottomAppBar` | Replaces whatever is in the FAB container and marks the bar as having one |
| `show()` | — | `BottomAppBar` | Slides the bar back into view |
| `hide()` | — | `BottomAppBar` | Slides it out of view |
| `isVisible()` | — | `boolean` | Whether it is currently shown |
| `getActionsContainer()` | — | `HTMLElement` | The actions container, for removing or reordering its children |

The component is built on the library's base, so `element`, `getClass()`,
`addClass()` and `lifecycle` (with `mount()`, `unmount()` and `destroy()`) are
there as well. Tear it down with **`lifecycle.destroy()`**: that is the one that
removes the `window` scroll listener. There is also a bare `destroy()` on the
component, inherited from the base element; it removes the element and leaves
the scroll handler bound to a bar that is no longer on the page.

There is no `removeAction()`: take children off `getActionsContainer()`
directly. `addFab()` empties its container first, so calling it again swaps the
FAB rather than adding a second one.

## Events

The bar emits nothing on its own emitter. Use `onVisibilityChange` for the
auto-hide transitions, and listen on the buttons you put in the bar for
everything else.

| Callback | Payload | Description |
|----------|---------|-------------|
| `onVisibilityChange` | `visible: boolean` | Scrolling hid or showed the bar. Not called by `show()` or `hide()` |

If you drive visibility yourself, call your own code alongside `show()` and
`hide()` — they change the bar, not the callback.

## Examples

### Actions and a FAB

The showcase's basic bar is four icon buttons; adding a FAB is one more call.

```javascript
const bar = createBottomAppBar({ hasFab: true });

for (const button of [searchButton, favoriteButton, shareButton, settingsButton]) {
  bar.addAction(button.element);
}

bar.addFab(createFab({ icon: addIcon, ariaLabel: 'Add item' }).element);
```

### A centred FAB

```javascript
const bar = createBottomAppBar({
  hasFab: true,
  fabPosition: 'center'
});

bar.addAction(menuButton.element);
bar.addFab(scanFab.element);
```

The FAB container becomes absolutely positioned at the centre of the bar, so
the actions keep the full leading side to themselves.

### Hiding on scroll

```javascript
const bar = createBottomAppBar({
  autoHide: true,
  transitionDuration: 200,
  onVisibilityChange: (visible) => {
    document.body.classList.toggle('bar-hidden', !visible);
  }
});
```

Auto-hide watches `window.scrollY`, so a bar inside its own scrolling box will
not react to that box. Drive it with `show()` and `hide()` there:

```javascript
list.addEventListener('scroll', () => {
  const down = list.scrollTop > lastTop;
  lastTop = list.scrollTop;
  if (down && bar.isVisible()) bar.hide();
  else if (!down && !bar.isVisible()) bar.show();
});
```

## Accessibility

- The element is a `role="toolbar"` labelled `"Bottom app bar"`. That label is
  fixed; set a better one on `element` yourself when a screen has more than one
  toolbar.
- `role="toolbar"` sets an expectation of arrow-key navigation between its
  controls, and the component does not implement it. Either add roving tabindex
  yourself or change the role on `element` to match what the bar actually does.
- Icon-only actions need an accessible name; pass `ariaLabel` to each button.
- Hiding the bar moves it out of the viewport with a transform, so it stays in
  the tab order while hidden. If the bar is meant to be unreachable when
  hidden, set `hidden` or `inert` on `element` alongside `hide()`.
- The bar overlays the bottom of its container, so leave room at the end of
  scrollable content for the last item not to sit underneath it.

## Styling

```css
.mtrl-bottom-app-bar { }
.mtrl-bottom-app-bar--with-fab { }
.mtrl-bottom-app-bar--fab-center { }
.mtrl-bottom-app-bar--hidden { }

/* the parts */
.mtrl-bottom-app-bar-actions { }
.mtrl-bottom-app-bar-fab-container { }
```

The background is the theme's `surface-container`. Hiding is a
`transform: translateY(100%)`, which is why the transition is on `transform`.

Note that `BOTTOM_APP_BAR_CLASSES` in `constants.ts` lists a partly different
set of names — `bottom-app-bar-fab` for the FAB container, for instance. The
classes above are what the component writes and what the stylesheet matches.

## Measurements

`_bottom-app-bar.scss` names no M3 token for these values, so the source column
points at the declaration instead of at a token.

| Attribute | Value | Source |
|-----------|-------|--------|
| Height | 80dp | commented "Default height as per specs" |
| Height with a FAB | 72dp | the `--with-fab` rule |
| Padding | 12dp top and bottom, 16dp trailing, 4dp leading | commented on the padding declaration |
| Space between actions | 4dp | `gap` on `-actions` |
| Elevation | level 2 | `elevation(2)` |
| Scroll delta before hiding or showing | 10px | the `autoHide` handler in `bottom-app-bar.ts` |
| Show and hide transition | 300ms | `DEFAULT_TRANSITION_DURATION` in `constants.ts` |

One caveat on the corners: the stylesheet asks for `t.shape('medium')` on the
two top corners, which expands to `var(--mtrl-sys-shape-medium)`. The token
sheet defines `--mtrl-sys-shape-corner-medium`, not that name, so the variable
is unset and the radius does not apply — the bar's top corners are square as
shipped. Set `border-top-left-radius` and `border-top-right-radius` yourself if
you want them rounded.
