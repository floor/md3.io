---
created: 2026-09-30
updated: 2026-10-01
status: draft
---

# FAB menu

A FAB menu opens from a [FAB](fab.md) to offer two to six related actions: reply, reply all
and forward, say, where one FAB would force a choice. Use it only from a FAB, a medium FAB or a
large FAB. Don't pair it with a floating toolbar or a navigation rail. See the
[M3 FAB menu guidelines](https://m3.material.io/components/fab-menu/overview).

M3 shows it two ways. In a compact window the FAB turns into a close button and the actions
rise above it as a list. On the web and in larger windows the FAB opens the baseline
[menu](menu.md). `presentation: 'auto'`, the default, takes the list below 600px and the menu
from 600px; `'list'` and `'menu'` fix one.

## Usage

`ariaLabel` names the menu the FAB opens, and every item has a label.

```example
fab-menu:
  icon: editIcon
  ariaLabel: Reply options
  presentation: list
  items:
    - { id: reply, text: Reply, icon: backIcon }
    - { id: forward, text: Forward, icon: forwardIcon }
    - { id: share, text: Share, icon: shareIcon }
```

## Examples

### The baseline menu

`presentation: 'menu'` opens the baseline menu from the FAB, 4dp above it at its trailing
edge. The menu is loaded the first time it is needed, and ahead of that in a wide window or
when the FAB is first pointed at or focused, so a page that never opens it never loads it.

```example
fab-menu:
  icon: addIcon
  ariaLabel: Create
  presentation: menu
  items:
    - { id: doc, text: Document }
    - { id: sheet, text: Spreadsheet }
    - { id: slides, text: Presentation }
```

### Color and size

`color` is `primary` (the default), `secondary` or `tertiary`: the FAB takes the role's
container, the close button the role, and the items its container. Match it to the FAB it
replaces. `size` is `default`, `medium` or `large`; the close button is always 56dp.

```example
fab-menu:
  icon: editIcon
  ariaLabel: Edit options
  presentation: list
  color: tertiary
  size: medium
  items:
    - { id: copy, text: Copy, icon: copyIcon }
    - { id: save, text: Save, icon: saveIcon }
```

### Choosing an action

`select` reports the chosen item's `value`, the item's `id` (the factory's payload also has it as
`id`), and the menu closes.

```example
fab-menu:
  icon: editIcon
  ariaLabel: Reply options
  presentation: list
  items:
    - { id: reply, text: Reply, icon: backIcon }
    - { id: forward, text: Forward, icon: forwardIcon }
  on select: choose(value)
```

`placement: 'bottom-end'` (or `'bottom-start'`) puts the FAB 16dp from the edges of its
positioned container, 24dp in large windows.

## API

<!-- API: hand-written, like the other pages until they are generated. Keep them in line with
the code, and add no prose restating them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `icon` | `string` | — | The FAB's icon |
| `ariaLabel` | `string` | — | The FAB's name: it describes the menu |
| `items` | `FabMenuItem[]` | — | `{ id, text, icon? }`, 2 to 6, top to bottom |
| `color` | `'primary' \| 'secondary' \| 'tertiary'` | `'primary'` | The colour set |
| `size` | `'default' \| 'medium' \| 'large'` | `'default'` | The FAB's size |
| `presentation` | `'auto' \| 'list' \| 'menu'` | `'auto'` | The list below 600px and the menu from 600px, or one of them |
| `placement` | `'none' \| 'bottom-end' \| 'bottom-start'` | `'none'` | Where it sits in its positioned container |
| `closeIcon` | `string` | a close icon | The close button's icon |
| `menu` | `(opener, items) => FabMenuMenu` | — | A menu of the app's own for the menu presentation |
| `class` | `string` | — | Extra classes on the element |

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `open(event?)` | `event?: Event` | `FabMenuComponent` | Opens it |
| `close()` | — | `FabMenuComponent` | Closes it |
| `toggle(event?)` | `event?: Event` | `FabMenuComponent` | Opens or closes it |
| `isOpen()` | — | `boolean` | Whether it is open |
| `getPresentation()` | — | `'list' \| 'menu'` | The presentation in use |
| `destroy()` | — | `void` | Removes it, its listeners and its menu |

`fab` is the FAB and `list` the list of the list presentation.

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `open` | — | It opened |
| `close` | — | It closed |
| `select` | `{ id, value }` | An item was chosen; it closes. `value` is the `id` again |

### Element

`<m-fab-menu>` takes the options as attributes, and `<m-fab-menu-item value icon>` children
declare the items: the text is the label, or `label`. `open` reflects whether it is open, and
setting it opens it; `show()`, `hide()` and `toggle()` do the same. `select`'s detail is
`{ value }`.

## Accessibility

- The FAB is a menu button (`aria-haspopup`, `aria-expanded`, `aria-controls`), named by
  `ariaLabel`; the items are `menuitem`s of a `menu`.
- Opening the list leaves focus on the FAB, now the close button. ArrowDown or Tab goes to the
  top item, ArrowUp to the one nearest the FAB. In the list the arrows wrap and Home and End go
  to the ends.
- Escape, Tab out of the list, or choosing an item closes it and returns focus to the FAB. A
  press outside closes it.
- The menu presentation is the baseline menu, with its own keyboard: a key that opens it lands
  on its first item.

## Styling

| Class | What it is |
|-------|------------|
| `.mtrl-fab-menu` | The root, sized to the FAB |
| `.mtrl-fab-menu__fab` | The FAB and close button |
| `.mtrl-fab-menu__list` | The list |
| `.mtrl-fab-menu__item` | An item |
| `.mtrl-fab-menu--open` | Open |
| `.mtrl-fab-menu--list`, `--menu` | The presentation in use |

## Measurements

| Attribute | Value | Token |
|-----------|-------|-------|
| Close button | 56dp, full corner | `FabMenuBaselineTokens.CloseButtonContainerHeight`, `CloseButtonContainerShape` |
| Close icon | 20dp | `FabMenuBaselineTokens.CloseButtonIconSize` |
| Item height | 56dp | `FabMenuBaselineTokens.ListItemContainerHeight` |
| Item padding | 24dp at each end | `FabMenuBaselineTokens.ListItemLeadingSpace`, `ListItemTrailingSpace` |
| Item icon | 24dp, 8dp from the label | `FabMenuBaselineTokens.ListItemIconSize`, `ListItemIconLabelSpace` |
| Item label | title medium | m3.material.io FAB menu specs |
| Between items | 4dp | `FabMenuBaselineTokens.ListItemBetweenSpace` |
| List to close button | 8dp | `FabMenuBaselineTokens.CloseButtonBetweenSpace` |
| Menu to FAB | 4dp | m3.material.io FAB menu specs (web) |
| Margin | 16dp, 24dp in large windows | m3.material.io FAB menu specs |
| Stagger | 26 to 114ms for six items | Compose `SlowEffects` spring on the visible count |
