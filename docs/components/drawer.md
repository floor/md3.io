# Drawer

A navigation drawer holds an app's top-level destinations in a vertical list along one edge,
with dividers and section labels to group them. M3 has two: **standard**, inline in the layout
of an expanded window, and **modal**, over the page behind a scrim, for compact and medium
windows. For content rather than destinations, use a [sheet](sheet.md); for a short list of
actions, a [menu](menu.md). See the
[M3 navigation drawer guidelines](https://m3.material.io/components/navigation-drawer/overview).

## Usage

`items` are destinations, dividers (`type: 'divider'`) and section labels
(`type: 'section'`); `active` marks the current destination, and a `badge` is trailing text
such as an unread count.

```example
drawer:
  headline: Mail
  open: true
  items:
    - { id: inbox, label: Inbox, icon: inboxIcon, badge: '24', active: true }
    - { id: outbox, label: Outbox, icon: outboxIcon }
    - { type: divider }
    - { type: section, label: Labels }
    - { id: family, label: Family, icon: labelIcon }
```

## Examples

### Modal

A modal drawer opens over the page and locks it: the page does not scroll, and focus moves to
the active destination. The scrim and `Escape` close it; `dismissible: false` keeps it open.

```example
drawer:
  variant: modal
  headline: Mail
  items:
    - { id: inbox, label: Inbox, icon: inboxIcon, active: true }
    - { id: outbox, label: Outbox, icon: outboxIcon }
  action openNavigation: open
```

With `layer: 'top'`, a modal drawer is a native `<dialog>` in the top layer, above every
z-index and outside any clipping ancestor, and its scrim is the `::backdrop`. The web
component's `modal` drawer is always in the top layer.

### Dense, at the end

`dense` makes the items shorter; `position: 'end'` anchors the drawer to the end edge, which
is the left in right-to-left layouts. `width` is pixels as a number, or any CSS length.

```example
drawer:
  open: true
  dense: true
  position: end
  width: 280
  items:
    - { id: users, label: Users, active: true }
    - { id: billing, label: Billing }
    - { id: audit, label: Audit log }
```

A choice emits `select` with `{ id, label, index, originalEvent }`, `index` counting the
destinations only; the web component dispatches `change` with `{ value }`, the destination's
id. `setActive()`, `setBadge()` and `setItems()` keep the drawer in step with the app, and emit
nothing. Recipes such as a drawer that follows the route, or labels that load late, are planned
for [Examples](/examples/).

## API

<!-- API: generated from mtrl's types and <m-drawer>'s spec in a later step. Until then these
tables are hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `variant` | `'standard' \| 'modal'` | `'standard'` | Inline, or over the page with a scrim |
| `position` | `'start' \| 'end'` | `'start'` | Which edge it anchors to; mirrors under RTL |
| `open` | `boolean` | `false` | Whether it starts open |
| `dismissible` | `boolean` | `true` | Whether the scrim and Escape close a modal drawer |
| `layer` | `'top'` | `undefined` | A modal drawer in the top layer, as a native `<dialog>` |
| `headline` | `string` | `undefined` | Text above the destinations |
| `ariaLabel` | `string` | the headline, or `'Navigation'` | The drawer's accessible name |
| `items` | `DrawerItemConfig[]` | `[]` | Destinations, dividers and section labels |
| `width` | `string \| number` | `360` | Width; a number is pixels. Set as `--mtrl-drawer-width` on the root |
| `dense` | `boolean` | `false` | Smaller items and tighter spacing |
| `ripple` | `boolean` | `true` | Press ripple on items, clipped to the item shape |
| `class` | `string` | `undefined` | Extra CSS classes |
| `prefix` | `string` | `'mtrl'` | Class-name prefix |
| `componentName` | `string` | `'drawer'` | Component name used in class generation |
| `onSelect` | `(event: DrawerSelectEvent) => void` | `undefined` | Called when a destination is chosen |
| `onOpen` / `onClose` | `() => void` | `undefined` | Called when it opens or closes |

#### Items

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | `'item' \| 'divider' \| 'section'` | `'item'` | What this entry is |
| `id` | `string` | `undefined` | Identifier, used by `setActive`, `setBadge` and the select event |
| `label` | `string` | `undefined` | Destination text, and the text of a `section` |
| `icon` | `string` | `undefined` | Leading icon, as an HTML string |
| `badge` | `string` | `undefined` | Trailing text, such as an unread count |
| `active` | `boolean` | `false` | Whether this destination starts selected |
| `disabled` | `boolean` | `false` | Cannot be clicked or reached by the arrow keys, and carries `aria-disabled` |
| `sectionLabel` | `string` | `undefined` | Section text, as an alternative to `label` |

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `open()` / `close()` / `toggle()` | `DrawerComponent` | Opens or closes it; opening moves focus to the active destination, or the first |
| `isOpen()` | `boolean` | Whether it is open |
| `setActive(id)` / `getActive()` | `DrawerComponent` / `string \| null` | The current destination |
| `setItems(items)` / `getItems()` | `DrawerComponent` / `DrawerItemConfig[]` | Replaces or reads the whole list |
| `setBadge(id, badge)` | `DrawerComponent` | Sets a badge, or clears it with `''` |
| `setHeadline(text)` / `getHeadline()` | `DrawerComponent` / `string` | The headline |
| `on(event, handler)` / `off(event, handler)` | `DrawerComponent` | Events |
| `addClass(...classes)` | `DrawerComponent` | Adds classes to the root |
| `getClass(name)` | `string` | A class name with the component prefix |
| `destroy()` | `void` | Removes the scrim, unbinds the key handler, restores page scrolling |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `select` | `{ id, label, index, originalEvent }` | A destination was chosen |
| `open` / `close` | none | The drawer opened or closed |

## Accessibility

- A standard drawer is a `navigation` landmark, a modal one a `dialog` with `aria-modal`; both
  are named by `ariaLabel`, or the headline, or "Navigation". Name them when a page has more
  than one navigation landmark.
- Each destination is a button in the tab order, the current one `aria-current="page"`;
  disabled ones are `aria-disabled` and out of the tab order. Dividers are separators.
- `Up` and `Down` move between destinations and wrap, `Home` and `End` go to the ends, and
  `Enter` or `Space` activates.
- A modal drawer keeps focus inside and the page behind inert until it closes.

## Styling

`width` is set inline on the root as `--mtrl-drawer-width`, which the sheet reads. A standard
drawer animates its width between 0 and that, so the page reflows around it; a modal drawer
keeps its width and slides its sheet in over the page.

```css
.mtrl-drawer { }                                          /* the root */
.mtrl-drawer--open, .mtrl-drawer--standard, .mtrl-drawer--modal { }
.mtrl-drawer--start, .mtrl-drawer--end, .mtrl-drawer--dense { }
.mtrl-drawer__scrim { }                                   /* modal only; --visible while open */
.mtrl-drawer__sheet { }                                   /* the panel that slides */
.mtrl-drawer__headline, .mtrl-drawer__items { }
.mtrl-drawer__item, .mtrl-drawer__item-icon, .mtrl-drawer__item-label, .mtrl-drawer__item-badge { }
.mtrl-drawer__active-indicator { }                        /* the shape behind the current destination */
.mtrl-drawer__divider, .mtrl-drawer__section-label { }
```

## Measurements

| Attribute | Value |
|-----------|-------|
| Width | 360dp, and at most the window less 56dp for a modal drawer |
| Corners | 16dp on the edge away from the anchor |
| Destination | 56dp tall, 12dp from the sheet's sides, a 28dp pill; icon 24dp, 12dp before the label |
| Divider | 1dp `outline-variant`, inset 28dp |
