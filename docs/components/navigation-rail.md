# Navigation Rail

The navigation rail holds three to seven top-level destinations in a column along the side of a medium or expanded window. In Material 3 expressive it comes in two states of one component: **collapsed**, a 96dp column of icons with labels under them, and **expanded**, a 220 to 360dp panel with the labels beside the icons. The expanded rail replaces the navigation drawer.

## Import

```javascript
import { createNavigationRail } from 'mtrl';
```

## Basic Usage

```javascript
const rail = createNavigationRail({
  items: [
    { id: 'inbox', label: 'Inbox', icon: inboxIcon, badge: 24, badgeLabel: '24 unread', active: true },
    { id: 'outbox', label: 'Outbox', icon: outboxIcon, href: '/outbox' },
    { id: 'favorites', label: 'Favorites', icon: starIcon, badge: true }
  ],
  onSelect: ({ id, originalEvent }) => {
    originalEvent.preventDefault();
    router.go(id);
  }
});

document.body.prepend(rail.element);
```

## Configuration

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
| `onSelect` | `(event) => void` | `undefined` | Called with `{ id, index, originalEvent }` when a destination is selected |
| `onExpand` / `onCollapse` | `() => void` | `undefined` | Called when the rail expands or collapses |

### Items

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
| `disabled` | `boolean` | Not selectable, still focusable as a link |

## API

| Method | Description |
|--------|-------------|
| `expand()`, `collapse()`, `toggle()`, `isExpanded()` | Expansion state |
| `setActive(id)`, `getActive()` | Active destination |
| `setItems(items)`, `getItems()` | Replace or read the destinations |
| `setBadge(id, badge, label?)` | Update a badge |
| `on(event, handler)`, `off(event, handler)` | `select`, `expand`, `collapse` |
| `destroy()` | Remove listeners and the element |

## Motion

Selecting a destination grows the secondary-container indicator out of the middle of the item on the spatial spring; the previous indicator shrinks back. Expanding glides the width, the item height, the icon and the indicator on the same spring, and the label swaps from under the icon to beside it at the midpoint behind a fade. Modal rails use the fast spatial spring. All of it is disabled under `prefers-reduced-motion`.

## Styling

Import the rail styles on their own with `mtrl/styles/navigation-rail`, or as part of `mtrl/styles`.

```css
.mtrl-navigation-rail { /* container */ }
.mtrl-navigation-rail--expanded { /* expanded state */ }
.mtrl-navigation-rail--modal { /* modal dialog */ }
.mtrl-navigation-rail__toggle { /* menu button */ }
.mtrl-navigation-rail__item { /* destination */ }
.mtrl-navigation-rail__item--active { /* active destination */ }
.mtrl-navigation-rail__indicator { /* active indicator */ }
.mtrl-navigation-rail__badge { /* large badge; --dot for the dot */ }
```
