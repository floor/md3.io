# Top App Bar Component

The top app bar holds the current screen's identity and its actions: a
navigation icon on the left, a headline, and up to a few actions on the right.
It is a `<header role="banner">` that spans the width of its container and
reacts to scrolling, either by raising itself or, on the taller types, by
compressing down to the small one.

## Overview

Four types, differing in height and in where the headline sits:

- **small** (64dp) — the default. Leading, headline and trailing in one row.
  For sub-pages that need back navigation and a couple of actions.
- **center** (64dp) — the same row, headline centred. For a root page showing
  the app name.
- **medium** (112dp) — two rows: leading and trailing on top, headline beneath
  in `headline-small`.
- **large** (152dp) — the same two rows with a `headline-medium` headline, for
  maximum emphasis.

The bar builds its own three containers and hands them to you; you fill the
leading and trailing ones with whatever buttons the screen needs.

Scrolling is on by default: the component listens on `window` and adds a
scrolled state past `scrollThreshold` pixels, which changes the background to
`surface-container` and raises the bar one elevation level. When `compressible`
is on, which it is by default, a medium or large bar also collapses to 64dp and
its headline shrinks back to `title-large`.

The element is `position: absolute` at the top of its container, so the thing
you put it in needs to be positioned — a plain `<div>` parent will leave the bar
pinned to the nearest positioned ancestor, or to the page, rather than to the
box you meant. Give that container `position: relative`.

## Import

```javascript
import { createTopAppBar } from 'mtrl';
```

## Basic Usage

```javascript
const bar = createTopAppBar({
  title: 'Inbox',
  type: 'small'
});

bar.addLeadingElement(backButton.element);
bar.addTrailingElement(searchButton.element);
bar.addTrailingElement(moreButton.element);

document.querySelector('.screen').appendChild(bar.element);
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | `'small' \| 'medium' \| 'large' \| 'center'` | `'small'` | Height and headline placement |
| `title` | `string` | — | Initial headline text |
| `scrollable` | `boolean` | `true` | Watch `window` scrolling and toggle the scrolled state |
| `compressible` | `boolean` | `true` | Let a medium or large bar collapse to small once scrolled |
| `scrollThreshold` | `number` | `4` | Pixels of scroll before the scrolled state turns on |
| `onScroll` | `(scrolled: boolean) => void` | — | Called each time the scrolled state flips |
| `tag` | `string` | `'header'` | Element to build the bar from |
| `class` | `string` | — | Extra classes on the element |
| `prefix` | `string` | `'mtrl'` | Class-name prefix |
| `componentName` | `string` | `'top-app-bar'` | Name used in class generation |

`scrollable` only wires the `window` listener. A bar inside its own scrolling
container should leave it on or off as you like and drive the state itself with
`setScrollState()`, which is what the showcase does for its boxed demos.

## Component API

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setTitle(title)` | `title: string` | `TopAppBar` | Replaces the headline text |
| `getTitle()` | — | `string` | The current headline text |
| `addLeadingElement(element)` | `element: HTMLElement` | `TopAppBar` | Appends to the leading container |
| `addTrailingElement(element)` | `element: HTMLElement` | `TopAppBar` | Appends to the trailing container |
| `setType(type)` | `type: TopAppBarType` | `TopAppBar` | Switches type and rebuilds the rows, keeping the containers and their contents |
| `setScrollState(scrolled)` | `scrolled: boolean` | `TopAppBar` | Turns the scrolled state on or off by hand |
| `getHeadlineElement()` | — | `HTMLElement` | The `<h1>` holding the headline |
| `getLeadingContainer()` | — | `HTMLElement` | The leading container, for removing or reordering its children |
| `getTrailingContainer()` | — | `HTMLElement` | The trailing container |

The component is built on the library's base, so `element`, `getClass()`,
`addClass()` and `lifecycle` (with `mount()`, `unmount()` and `destroy()`) are
there as well. Tear it down with **`lifecycle.destroy()`**: that is the one that
removes the `window` scroll listener. There is also a bare `destroy()` on the
component, inherited from the base element; it removes the element and leaves
the scroll handler bound to a bar that is no longer on the page.

## Events

The bar emits nothing on its own emitter. Use the `onScroll` callback for the
scrolled state, and `element.addEventListener` (or the components you put in
the leading and trailing containers) for everything else.

| Callback | Payload | Description |
|----------|---------|-------------|
| `onScroll` | `scrolled: boolean` | The scrolled state changed; fires once per transition, not once per scroll event |

## Examples

### The four types side by side

```javascript
for (const type of ['center', 'small', 'medium', 'large']) {
  const bar = createTopAppBar({ type, title: 'Page title', scrollable: false });
  bar.addLeadingElement(menuButton().element);
  bar.addTrailingElement(moreButton().element);
  demo.appendChild(bar.element);
}
```

`scrollable: false` matters here: several bars on one page would otherwise all
respond to the same window scroll.

### A large bar that compresses

```javascript
const bar = createTopAppBar({
  type: 'large',
  title: 'Photos',
  compressible: true,
  scrollThreshold: 8,
  onScroll: (scrolled) => {
    document.body.classList.toggle('has-compact-bar', scrolled);
  }
});
```

Past 8px of scroll the bar drops from 152dp to 64dp, the headline moves into the
top row and shrinks to `title-large`, and the background changes to
`surface-container`.

### Driving the state from a scrolling container

```javascript
const bar = createTopAppBar({ title: 'Messages', scrollable: false });
list.addEventListener('scroll', () => {
  bar.setScrollState(list.scrollTop > 4);
});
```

### Switching type at runtime

```javascript
bar.setType('medium');
```

`setType()` empties the element and rebuilds its rows, but the leading,
headline and trailing containers are reused, so anything you added to them
survives the switch.

## Accessibility

- The element is a `<header>` with `role="banner"` and `aria-label="Top app
  bar"`. The label is fixed; set a better one on `element` yourself if a page
  has more than one banner-like region.
- The headline is an `<h1>`, so it is the page's top-level heading. If your
  screen already has one, either use this bar's headline as it or change the
  element's role — do not ship two `<h1>`s.
- The bar contributes no keyboard behaviour of its own. Everything reachable in
  it is a component you put there, so give icon-only buttons an accessible name.
- The headline is a single line that ellipsises. A long title will be cut
  visually, but it stays complete in the accessibility tree.

## Styling

```css
.mtrl-top-app-bar { }
.mtrl-top-app-bar--center { }
.mtrl-top-app-bar--medium { }
.mtrl-top-app-bar--large { }
.mtrl-top-app-bar--compressible { }
.mtrl-top-app-bar--scrolled { }

/* the parts */
.mtrl-top-app-bar-leading { }
.mtrl-top-app-bar-headline { }
.mtrl-top-app-bar-trailing { }
.mtrl-top-app-bar-row { }   /* medium and large only */
```

The small type carries no modifier class — it is the base rule. Colours come
from the theme: `surface` behind `on-surface`, changing to `surface-container`
once scrolled.

Note that `TOP_APP_BAR_CLASSES` in `constants.ts` lists a different, unused set
of names (`top-app-bar-section--leading`, `top-app-bar-title` and so on). The
classes above are what the component actually writes and what the stylesheet
matches.

## Measurements

`_top-app-bar.scss` names no M3 token for these values, so the source column
points at the declaration instead of at a token.

| Attribute | Value | Source |
|-----------|-------|--------|
| Height, small and center | 64dp | commented "Default type (small) - 64dp height as per specs" |
| Height, medium | 112dp | commented "Medium top app bar - 112dp height" |
| Height, large | 152dp | commented "Large top app bar - 152dp height" |
| Height once compressed | 64dp | the `--scrolled` compressible rule |
| Horizontal padding | 16dp, 12dp below the `sm` breakpoint | `_top-app-bar.scss` |
| Headline typography, small and center | `title-large` | the typography mixin |
| Headline typography, medium | `headline-small` | the typography mixin |
| Headline typography, large | `headline-medium` | the typography mixin |
| Space after the leading container | 24dp | `margin-right` on `-leading` |
| Space between trailing actions | 8dp | `gap` on `-trailing` |
| Elevation once scrolled | level 1 | `elevation(1)` in the `--scrolled` rule |
| Scroll threshold | 4px | `TOP_APP_BAR_DEFAULTS.SCROLL_THRESHOLD` |
| Height and colour transition | 0.3s | the transition on the root rule |
