---
created: 2026-10-07
updated: 2026-10-07
status: published
---

# Navigation bar

A navigation bar holds destinations in a row along the bottom of the window. Each destination is a button, or a link when it has an `href`.

## Usage

Each destination has an `id`, a `label` and an `icon`. `active` marks the current one. A badge is a count, a short text, or `true` for a dot with no text. `badgeLabel` names the badge; a dot with none is announced as "New activity".

```example
navigation-bar:
  ariaLabel: Mail navigation
  items:
    - { id: inbox, label: Inbox, icon: inboxIcon, badge: 8, active: true }
    - { id: favorites, label: Favorites, icon: heartOutlineIcon, badge: true }
    - { id: sent, label: Sent, icon: outboxIcon }
```

## Examples

### Icon beside the label

`itemLayout` is `vertical` (the icon above the label), `horizontal` (the icon beside it), or `auto`. `auto` is vertical, and horizontal while the bar itself is at least 600px wide.

`activeIcon` is the icon shown while that destination is selected. The web component takes it as `selected-icon`.

```example
navigation-bar:
  itemLayout: horizontal
  items:
    - { id: home, label: Home, icon: heartOutlineIcon, activeIcon: heartFilledIcon, active: true }
    - { id: search, label: Search, icon: searchIcon }
```

### Hide on scroll

`hideOnScroll` slides the bar out of view after the page scrolls down by 10 pixels, and back when it scrolls up. `true` follows the window; an object `{ target }` follows that element's scroll instead. Focus inside the bar shows it again. `hide()` and `show()` do the same without a scroll.

```example
navigation-bar:
  hideOnScroll: true
  items:
    - { id: home, label: Home, icon: homeIcon, active: true }
    - { id: search, label: Search, icon: searchIcon }
```

A selection emits `select` with `{ id, value, index, originalEvent }`. `value` is the destination's id, the same field the web component's `change` event carries. Arrow keys move between destinations along the row; Home and End move to the ends.

## API

<!-- API: generated from mtrl's types and <m-navigation-bar>'s spec in a later step. Until then these
tables are hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `items` | `NavigationBarItemConfig[]` | `[]` | Destinations; each needs a unique `id`, a `label` and an `icon` |
| `itemLayout` | `'auto' \| 'vertical' \| 'horizontal'` | `'auto'` | Icon above the label, beside it, or above until the bar is 600px wide |
| `hideOnScroll` | `boolean \| { target?: HTMLElement \| Window }` | off | Hide on scroll down, show on scroll up; `true` follows the window |
| `ariaLabel` | `string` | `'Primary navigation'` | The landmark's accessible name |
| `ripple` | `boolean` | `true` | `false` is the element's `no-ripple` attribute |
| `onSelect` | `(event: NavigationBarSelectEvent) => void` | | `select` listener registered at creation |

### Items

| Option | Type | Description |
|--------|------|-------------|
| `id` | `string` | Unique among the bar's destinations |
| `label` | `string` | The text under or beside the icon |
| `icon` | `string` | SVG markup. The element takes it as `icon` |
| `activeIcon` | `string` | SVG markup shown while this destination is active. The element takes it as `selected-icon` |
| `href` | `string` | Renders the destination as a link and keeps the browser's navigation |
| `badge` | `string \| number \| boolean` | A count, a short text, or `true` for the dot |
| `badgeLabel` | `string` | The accessible name of the badge |
| `active` | `boolean` | Whether this destination starts selected |
| `disabled` | `boolean` | Whether the destination is inert |

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getActive()` | `string \| null` | The selected destination's id |
| `setActive(id)` | `this` | Selects a destination without emitting `select`; `null` clears it |
| `getItems()` | `NavigationBarItemConfig[]` | The destinations |
| `setItems(items)` | `this` | Replaces the destinations |
| `setBadge(id, badge, label?)` | `this` | Sets or clears one destination's badge |
| `hide()` | `this` | Slides the bar out of view |
| `show()` | `this` | Slides the bar back |
| `isHidden()` | `boolean` | Whether `hide()` or a scroll has hidden it |
| `on(event, handler)` | `this` | Listens for `select` or `visibility` |
| `off(event, handler)` | `this` | Removes that listener |
| `destroy()` | `void` | Removes the bar and its listeners |

### Element

`<m-navigation-bar>` takes `value` (the selected destination's id), `item-layout`, `hide-on-scroll`, `no-ripple` and `aria-label`. `value` is also the live property. It dispatches `change` with `{ value }` and `visibility` with `{ hidden }`. `hide()` and `show()` are methods.

`<m-navigation-bar-item>` takes `value`, `icon`, `selected-icon`, `href`, `badge`, `badge-label` and `disabled`. Its text is the label. An empty `badge` attribute is the dot.
