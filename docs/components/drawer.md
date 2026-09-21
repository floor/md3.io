# Drawer Component

A navigation drawer holds the top-level destinations of an app in a vertical list along one edge — Inbox, Sent, Drafts, then a rule, then labels. Reach for it when there are more destinations than a navigation bar can carry, or when they need grouping. For a surface that holds content rather than destinations, use a [sheet](sheet.md); for a short list of actions, a [menu](menu.md).

## Overview

The drawer comes in the two variants the Material 3 specification describes:

- **standard** — inline with the layout. It is a `navigation` landmark, it takes width from the page rather than covering it, and it can be left open permanently in expanded windows.
- **modal** — over the layout, behind a scrim. It is a `dialog`, it locks the page behind it, and Escape or a click on the scrim closes it. This is the compact- and medium-window form.

Destinations are declared as data, not markup. The `items` array takes navigation entries, dividers and section labels, and the component renders, tracks and re-renders them.

## Import

```javascript
import { createDrawer } from 'mtrl';
```

## Basic Usage

```javascript
const drawer = createDrawer({
  variant: 'standard',
  headline: 'Mail',
  open: true,
  items: [
    { id: 'inbox', label: 'Inbox', icon: inboxIcon, badge: '24', active: true },
    { id: 'outbox', label: 'Outbox', icon: outboxIcon },
    { type: 'divider' },
    { type: 'section', label: 'Labels' },
    { id: 'family', label: 'Family', icon: labelIcon }
  ],
  onSelect: ({ id }) => navigate(id)
});

document.body.appendChild(drawer.element);
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `variant` | `'standard' \| 'modal'` | `'standard'` | Inline, or over the page with a scrim |
| `position` | `'start' \| 'end'` | `'start'` | Which edge it anchors to; mirrors under RTL |
| `open` | `boolean` | `false` | Whether it starts open |
| `dismissible` | `boolean` | `true` | Whether the scrim and Escape close a modal drawer |
| `headline` | `string` | `undefined` | Text above the destinations |
| `items` | `DrawerItemConfig[]` | `[]` | Destinations, dividers and section labels |
| `width` | `string \| number` | `360` | Width; a number is pixels. Set as `--drawer-width` on the root |
| `dense` | `boolean` | `false` | Smaller items and tighter spacing |
| `ripple` | `boolean` | `true` | Press ripple on items, clipped to the item shape |
| `class` | `string` | `undefined` | Extra CSS classes |
| `prefix` | `string` | `'mtrl'` | Class-name prefix |
| `componentName` | `string` | `'drawer'` | Component name used in class generation |
| `onSelect` | `(event: DrawerSelectEvent) => void` | `undefined` | Called when a destination is chosen |
| `onOpen` | `() => void` | `undefined` | Called when it opens |
| `onClose` | `() => void` | `undefined` | Called when it closes |

### Items

Each entry in `items` is a `DrawerItemConfig`. The default `type` is `item`.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | `'item' \| 'divider' \| 'section'` | `'item'` | What this entry is |
| `id` | `string` | `undefined` | Identifier, used by `setActive`, `setBadge` and the select event |
| `label` | `string` | `undefined` | Destination text — also the text of a `section` |
| `icon` | `string` | `undefined` | Leading icon, as an HTML string |
| `badge` | `string` | `undefined` | Trailing text, such as an unread count |
| `active` | `boolean` | `false` | Whether this destination starts selected |
| `disabled` | `boolean` | `false` | When `true`, the destination cannot be clicked or reached by the arrow keys, and carries `aria-disabled` |
| `sectionLabel` | `string` | `undefined` | Section text, as an alternative to `label` |

## Component API

### State

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `open()` | — | `DrawerComponent` | Opens it and moves focus to the destination in the tab order — the active one, or the first when none is active |
| `close()` | — | `DrawerComponent` | Closes it |
| `toggle()` | — | `DrawerComponent` | Flips the state |
| `isOpen()` | — | `boolean` | Whether it is open |

### Destinations

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setActive(id)` | `id: string` | `DrawerComponent` | Marks a destination as the current one |
| `getActive()` | — | `string \| null` | The current destination's id |
| `setItems(items)` | `items: DrawerItemConfig[]` | `DrawerComponent` | Replaces the whole list |
| `getItems()` | — | `DrawerItemConfig[]` | The current list |
| `setBadge(id, badge)` | `id: string, badge: string` | `DrawerComponent` | Sets a badge, or clears it with `''` |
| `setHeadline(text)` | `text: string` | `DrawerComponent` | Replaces the headline |
| `getHeadline()` | — | `string` | The current headline |

### Events and lifecycle

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `on(event, handler)` | `event: string, handler` | `DrawerComponent` | Adds a listener |
| `off(event, handler)` | `event: string, handler` | `DrawerComponent` | Removes one |
| `addClass(...classes)` | `classes: string[]` | `DrawerComponent` | Adds classes to the root |
| `getClass(name)` | `name: string` | `string` | A class name with the component prefix |
| `destroy()` | — | `void` | Removes the scrim, unbinds the key handler, restores page scrolling |

| Property | Type | Description |
|----------|------|-------------|
| `element` | `HTMLElement` | The `<aside>` root |
| `lifecycle` | `{ destroy() }` | Lifecycle handle |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `select` | `DrawerSelectEvent` | A destination was chosen |
| `open` | — | The drawer opened |
| `close` | — | The drawer closed |

`DrawerSelectEvent` is `{ id, label, index, originalEvent }`, where `index` counts destinations only — dividers and section labels do not take a position.

```javascript
drawer.on('select', ({ id, index }) => {
  router.go(id);
  if (drawer.isOpen()) drawer.close();
});
```

## Examples

### A modal drawer for compact windows

```javascript
const drawer = createDrawer({
  variant: 'modal',
  headline: 'Navigation',
  items: [
    { id: 'home', label: 'Home', icon: homeIcon, active: true },
    { id: 'settings', label: 'Settings', icon: settingsIcon }
  ]
});

document.body.appendChild(drawer.element);

menuButton.addEventListener('click', () => drawer.toggle());
drawer.on('select', ({ id }) => {
  navigate(id);
  drawer.close();
});
```

A modal drawer locks the page behind it while it is open and restores scrolling when it closes, so let it close on selection rather than leaving it up.

### Keeping a badge current

```javascript
inbox.subscribe((unread) => {
  drawer.setBadge('inbox', unread > 0 ? String(unread) : '');
});
```

### Rebuilding the list

`setItems()` re-renders everything, which is the way to reflect a change in what the destinations are — a signed-in user gaining a section, a set of labels loading late.

```javascript
labels.then((names) => {
  drawer.setItems([
    { id: 'inbox', label: 'Inbox', icon: inboxIcon, active: true },
    { type: 'divider' },
    { type: 'section', label: 'Labels' },
    ...names.map((name) => ({ id: name, label: name, icon: labelIcon }))
  ]);
});
```

### A dense drawer

`dense` shrinks the item height and the indicator with it, for a sidebar in an admin layout where the standard destination is too tall.

```javascript
const drawer = createDrawer({ variant: 'standard', dense: true, open: true, items });
```

## Accessibility

- The root is an `<aside>`. A `standard` drawer is `role="navigation"`; a `modal` drawer is `role="dialog"` with `aria-modal="true"`.
- The destinations container is `role="tablist"` with `aria-orientation="vertical"`, and each destination is a `role="tab"` carrying `aria-selected`. Only the selected destination is in the tab order — the rest are `tabindex="-1"` — so Tab enters the list once and lands on the current destination.
- Arrow Down and Arrow Up move between destinations and wrap; Home and End jump to the ends; Enter and Space activate the focused one. Disabled destinations are skipped and carry `aria-disabled`.
- Dividers are `role="separator"`.
- Opening moves focus to the destination in the tab order, or to the drawer itself when there is none.
- Escape closes a `modal` drawer while `dismissible` is on, as does a click on the scrim. Neither applies to a `standard` drawer, which is part of the layout.
- The tab semantics come from the implementation, not from the specification: a drawer whose destinations are real page navigations, rather than panels within one page, will read to a screen reader as tabs. If that matters for your app, wrap the destinations in your own links and use the drawer for its state and layout.
- The root takes no accessible name of its own. Give it one — a `headline` is visible text, not a label — which matters most when a page has more than one navigation landmark. The component reads an `ariaLabel` config option and sets `aria-label` from it, but `DrawerConfig` does not declare the property, so TypeScript rejects it: from TypeScript, use `drawer.element.setAttribute('aria-label', 'Main')` instead.

## Styling

```css
.mtrl-drawer { /* the root */ }
.mtrl-drawer--open { /* while open */ }
.mtrl-drawer--standard,
.mtrl-drawer--modal { /* variants */ }
.mtrl-drawer--start,
.mtrl-drawer--end { /* anchor edge */ }
.mtrl-drawer--dense { /* compact items */ }

.mtrl-drawer__scrim { /* the overlay, modal only; --visible while open */ }
.mtrl-drawer__sheet { /* the panel that slides */ }
.mtrl-drawer__headline { /* text above the destinations */ }
.mtrl-drawer__items { /* the scrolling list */ }
.mtrl-drawer__item { /* one destination */ }
.mtrl-drawer__item-icon { /* leading icon */ }
.mtrl-drawer__item-label { /* destination text */ }
.mtrl-drawer__item-badge { /* trailing badge */ }
.mtrl-drawer__active-indicator { /* the shape behind the current destination */ }
.mtrl-drawer__divider { /* a rule between groups */ }
.mtrl-drawer__section-label { /* a group heading */ }
```

### CSS Custom Properties

```css
.mtrl-drawer {
  --drawer-width: 360px; /* set from the width option; the sheet reads it */
}
```

The `standard` variant animates the root's width between `0` and `--drawer-width`, so the page reflows around it as it opens. The `modal` variant keeps its width and slides the sheet in over the page instead.

## Best Practices

- Between five and seven destinations. Below that a navigation bar is enough; above it, group with sections.
- Use `standard` in expanded windows and `modal` in compact ones, and switch between them on the breakpoint rather than shipping one for both.
- Close a modal drawer when a destination is chosen. Leaving it open hides the page the user just asked for.
- Keep the active destination in step with the route: call `setActive()` on navigation, including on Back, not only from the drawer's own `select` event.
- Badges are counts and status, not labels. A badge on every destination is a badge on none.
- Icons on all destinations or on none. A half-iconed list makes the labels sit ragged.

## TypeScript Support

```typescript
import { createDrawer, DrawerConfig, DrawerComponent, DrawerSelectEvent } from 'mtrl';

const config: DrawerConfig = {
  variant: 'modal',
  position: 'start',
  headline: 'Mail',
  items: [{ id: 'inbox', label: 'Inbox', badge: '24', active: true }]
};

const drawer: DrawerComponent = createDrawer(config);
drawer.on('select', (event: DrawerSelectEvent) => console.log(event.id, event.index));
drawer.open();
```
