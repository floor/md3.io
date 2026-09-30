# Navigation rail

A navigation rail holds three to seven top-level destinations in a column along the side of a
medium or expanded window. In M3 Expressive it has two states: **collapsed**, a 96dp column
with the labels under the icons, and **expanded**, a 220 to 360dp panel with the labels beside
them, which replaces the navigation drawer. See the
[M3 navigation rail guidelines](https://m3.material.io/components/navigation-rail/overview).

## Usage

Each destination has an `id`, a `label` and an `icon`; `active` marks the current one. A badge
is a count or a short text, and `badgeLabel` says what it counts.

```example
navigation-rail:
  ariaLabel: Mail
  items:
    - { id: inbox, label: Inbox, icon: inboxIcon, badge: 24, badgeLabel: 24 unread, active: true }
    - { id: outbox, label: Outbox, icon: outboxIcon }
    - { id: favorites, label: Favorites, icon: starIcon }
```

## Examples

### Expanded

The menu button at the top expands and collapses the rail; `expanded` sets the state it starts
in, and `expandedWidth` its expanded width. A destination with `href` is a link, and keeps the
browser's navigation.

```example
navigation-rail:
  expanded: true
  expandedWidth: 320
  items:
    - { id: inbox, label: Inbox, icon: inboxIcon, active: true }
    - { id: outbox, label: Outbox, icon: outboxIcon, href: /outbox }
```

### Modal

With `layout: 'modal'`, the collapsed rail is hidden and the expanded one opens over the page
in a native modal dialog; `Escape` and the scrim collapse it. `hideWhenCollapsed` hides a
standard rail while it is collapsed.

```example
navigation-rail:
  layout: modal
  items:
    - { id: inbox, label: Inbox, icon: inboxIcon, active: true }
    - { id: outbox, label: Outbox, icon: outboxIcon }
```

A selection emits `select` with `{ id, index, originalEvent }`; `originalEvent.preventDefault()`
keeps a link's navigation to the app's router. The web component dispatches `change` with
`{ value }`, the destination's id. `header` puts an element of the app's, such as a FAB, under
the menu button; the web component takes it in its `header` slot.

## API

<!-- API: generated from mtrl's types and <m-navigation-rail>'s spec in a later step. Until then these
tables are hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `items` | `NavigationRailItemConfig[]` | `[]` | Destinations; each needs a unique `id`, a `label` and an `icon` |
| `expanded` | `boolean` | `false` | Whether it starts expanded |
| `layout` | `'standard' \| 'modal'` | `'standard'` | Standard rails take layout width; modal rails expand over the page in a native dialog |
| `hideWhenCollapsed` | `boolean` | `false` | Hide the standard rail when collapsed (modal rails always do) |
| `expandedWidth` | `number` | `280` | Expanded width in pixels, clamped to 220 to 360 |
| `showToggle` | `boolean` | `true` | Show the menu button that expands and collapses the rail |
| `expandIcon` | `string` | Material Symbols `menu` | Menu button icon while collapsed |
| `collapseIcon` | `string` | Material Symbols `menu_open` | Menu button icon while expanded |
| `expandLabel` | `string` | `'Expand navigation'` | Accessible name of the menu button while collapsed |
| `collapseLabel` | `string` | `'Collapse navigation'` | Accessible name of the menu button while expanded |
| `header` | `HTMLElement` | `undefined` | Application-owned element under the menu button, such as a FAB |
| `ripple` | `boolean` | `true` | Press ripple, clipped to the active indicator |
| `ariaLabel` | `string` | `'Primary navigation'` | Accessible name of the rail |
| `class` | `string` | `undefined` | Additional CSS classes |
| `onSelect` | `(event) => void` | `undefined` | Called with `{ id, index, originalEvent }` when a destination is selected |
| `onExpand` / `onCollapse` | `() => void` | `undefined` | Called when the rail expands or collapses |

#### Items

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier |
| `label` | `string` | Label text |
| `icon` | `string` | Icon markup |
| `activeIcon` | `string` | Icon markup while active, for a filled variant |
| `href` | `string` | Renders the destination as a link |
| `badge` | `string \| number \| boolean` | A large badge with text, or `true` for a dot |
| `badgeLabel` | `string` | Accessible description of the badge |
| `active` | `boolean` | Initially active |
| `disabled` | `boolean` | Not selectable, and out of the tab order |

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `expand()` / `collapse()` / `toggle()` | `NavigationRailComponent` | Expansion state |
| `isExpanded()` | `boolean` | Whether it is expanded |
| `setActive(id)` / `getActive()` | `NavigationRailComponent` / `string \| null` | The active destination; `setActive()` emits nothing |
| `setItems(items)` / `getItems()` | `NavigationRailComponent` / `NavigationRailItemConfig[]` | Replace or read the destinations |
| `setBadge(id, badge, label?)` | `NavigationRailComponent` | Update a badge |
| `on(event, handler)` / `off(event, handler)` | `NavigationRailComponent` | Events |
| `destroy()` | `void` | Remove listeners and the element |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `select` | `{ id, index, originalEvent }` | A destination was clicked or activated from the keyboard |
| `expand` / `collapse` | `{ expanded }` | The rail expanded or collapsed |

## Accessibility

- A `nav` landmark (a `dialog` in the modal layout) named by `ariaLabel`; the active
  destination has `aria-current="page"`.
- A badge is in its destination's name: the label, then `badgeLabel`, the badge's text, or
  "New activity" for a dot.
- `Tab` reaches the destinations; `Up`, `Down`, `Home` and `End` move between the enabled ones.
- The menu button has `aria-expanded`, and is named by `expandLabel` or `collapseLabel`. The
  modal rail keeps focus inside while it is open.

## Styling

Selecting a destination grows the `secondary-container` indicator out of the middle of the
item on the spatial spring. Expanding glides the width, the items and the indicator on the
same spring, and the label moves beside the icon at the midpoint behind a fade. None of it
runs with reduced motion.

```css
.mtrl-navigation-rail { }                                   /* the rail */
.mtrl-navigation-rail--expanded, .mtrl-navigation-rail--modal { }
.mtrl-navigation-rail__toggle { }                           /* the menu button */
.mtrl-navigation-rail__item, .mtrl-navigation-rail__item--active { }
.mtrl-navigation-rail__indicator { }                        /* the active indicator */
.mtrl-navigation-rail__badge { }                            /* --dot for the dot */
```

## Measurements

From the M3 Expressive rail tokens (Android `navigationrail`, version 34.0.0):

| Attribute | Collapsed | Expanded |
|-----------|-----------|----------|
| Width | 96dp | 220–360dp, 280dp by default |
| Destination | 64dp tall, the label under the icon | 56dp tall, the label beside the icon |
| Active indicator | A 56 × 32dp pill | 56dp tall, the item's width less 40dp |
| Icon | 24dp | 24dp |
| Menu button | 48dp, 40dp above the destinations | 48dp |
