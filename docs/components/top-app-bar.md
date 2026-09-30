---
created: 2026-09-21
updated: 2026-09-30
status: published
---

# Top app bar

A top app bar shows the current screen's title, a navigation button and the screen's most
important actions. M3 has four types: **small** and **center-aligned**, one 64dp row, and
**medium** and **large**, with the headline on a second row, which compress to the small bar
as the page scrolls. See the
[M3 top app bar guidelines](https://m3.material.io/components/app-bars/overview).

## Usage

The leading button is the navigation icon; the actions go at the trailing end. Icon buttons
need `ariaLabel` to name them.

```example
top-app-bar:
  title: Inbox
  leading: { icon: backIcon, ariaLabel: Back }
  actions:
    - { icon: searchIcon, ariaLabel: Search }
    - { icon: moreIcon, ariaLabel: More options }
```

## Examples

### A large bar that compresses

Past `scrollThreshold` pixels of window scroll, the bar takes its scrolled state:
`surface-container` and one level of elevation. A medium or large bar also compresses to
64dp, its headline moving into the top row as Title Large; `compressible: false` keeps its
height.

```example
top-app-bar:
  type: large
  title: Photos
  scrollThreshold: 8
```

### Following another scroller

`scrollable: false` stops the bar following the window. A bar over its own scrolling
container is driven with `setScrollState(scrolled)`; the web component follows the element
whose id `scroll-target` names.

```example
top-app-bar:
  type: medium
  title: Messages
  scrollable: false
```

The bar is `position: absolute` at the top of its container, so that container needs
`position: relative`. `setType()` switches the type and keeps what is in the leading and
trailing containers.

## API

<!-- API: generated from mtrl's types and <m-top-app-bar>'s spec in a later step. Until then these
tables are hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | `'small' \| 'center' \| 'medium' \| 'large'` | `'small'` | Height and headline placement |
| `title` | `string` | — | The headline |
| `scrollable` | `boolean` | `true` | Follow `window` scrolling and toggle the scrolled state |
| `compressible` | `boolean` | `true` | Let a medium or large bar compress to small once scrolled |
| `scrollThreshold` | `number` | `4` | Pixels of scroll before the scrolled state turns on |
| `onScroll` | `(scrolled: boolean) => void` | — | Called each time the scrolled state flips |
| `tag` | `string` | `'header'` | The element to build the bar from |
| `class` | `string` | — | Extra classes on the element |
| `prefix` | `string` | `'mtrl'` | Class-name prefix |
| `componentName` | `string` | `'top-app-bar'` | Name used in class generation |

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `setTitle(title)` / `getTitle()` | `TopAppBar` / `string` | The headline |
| `addLeadingElement(element)` | `TopAppBar` | Appends to the leading container |
| `addTrailingElement(element)` | `TopAppBar` | Appends to the trailing container |
| `setType(type)` | `TopAppBar` | Switches type, keeping the containers and their contents |
| `setScrollState(scrolled)` | `TopAppBar` | Turns the scrolled state on or off |
| `getHeadlineElement()` | `HTMLElement` | The `<h1>` holding the headline |
| `getLeadingContainer()` / `getTrailingContainer()` | `HTMLElement` | The containers |
| `destroy()` | `void` | Removes the bar and its window scroll listener |

### Events

The bar emits no events: `onScroll` reports the scrolled state, once per change.

## Accessibility

- The bar is a `<header role="banner">` named "Top app bar"; the web component's `aria-label`
  names it instead.
- The headline is an `<h1>`: it is the screen's top-level heading, so the screen should not
  have another. A long headline is cut with an ellipsis and stays whole for assistive tech.
- The bar has no keyboard behaviour of its own: its buttons are in the tab order, and each
  icon button needs its `ariaLabel`.

## Styling

The small type has no modifier class. The colors are the theme's: `surface` behind
`on-surface`, and `surface-container` once scrolled.

```css
.mtrl-top-app-bar { }
.mtrl-top-app-bar--center, .mtrl-top-app-bar--medium, .mtrl-top-app-bar--large { }
.mtrl-top-app-bar--compressible, .mtrl-top-app-bar--scrolled { }
.mtrl-top-app-bar__leading, .mtrl-top-app-bar__headline, .mtrl-top-app-bar__trailing { }
.mtrl-top-app-bar__row { }   /* medium and large only */
```

## Measurements

| Attribute | Value |
|-----------|-------|
| Height | 64dp small and center; 112dp medium; 152dp large; 64dp compressed |
| Headline | Title Large (small, center, compressed); Headline Small (medium); Headline Medium (large) |
| Horizontal padding | 16dp, 12dp below the `sm` breakpoint |
| Space after the leading button | 24dp |
| Space between actions | 8dp |
| Scrolled | Elevation level 1 |
