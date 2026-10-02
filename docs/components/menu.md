---
created: 2026-09-21
updated: 2026-09-30
status: published
---

# Menu

A menu shows a list of choices on a temporary surface, opened from a button or another
control: an overflow menu, a context menu, the choices behind an icon button. M3 has the
**baseline** menu and the M3 Expressive **vertical** menu, recommended for new designs. See
the [M3 menu guidelines](https://m3.material.io/components/menus/overview).

## Usage

A menu opens against its opener, the button beside it: a click, `Enter`, `Space` or `Down`
opens it on the first item, `Up` on the last, and focus returns to the opener when it closes.
Choosing an item closes it.

```example
menu:
  trigger: { text: Edit }
  items:
    - { id: cut, text: Cut }
    - { id: copy, text: Copy }
    - { id: paste, text: Paste }
  on open: track('menu')
```

## Examples

### Icons, shortcuts and dividers

An item takes an `icon`, a `shortcut` hint and `disabled`; `{ type: 'divider' }` draws a line
between groups. Icons on every item, or on none.

```example
menu:
  trigger: { text: Edit }
  items:
    - { id: edit, text: Edit, icon: editIcon, shortcut: ⌘E }
    - { id: copy, text: Copy, icon: copyIcon, shortcut: ⌘C }
    - { type: divider }
    - { id: delete, text: Delete, disabled: true }
```

### The vertical menu

`variant: 'vertical'` is the expressive menu: items sit apart in a rounded container and
change shape as they are hovered, focused, pressed or selected. `color: 'vibrant'` is
tertiary-based and more prominent, for sparing use. `supportingText` adds a second line, and
`{ type: 'gap' }` splits the menu into separate surfaces.

```example
menu:
  trigger: { text: Share }
  variant: vertical
  color: vibrant
  items:
    - { id: share, text: Share, icon: shareIcon, supportingText: Anyone with the link }
    - { id: copy, text: Copy link, icon: copyIcon }
    - { type: gap }
    - { id: delete, text: Delete }
```

### A submenu

An item with `hasSubmenu` and `submenu` opens a nested menu, on hover or `Right`. The submenu
code loads the first time a menu has one. A vertical menu steps back to an 8dp corner while
its submenu, with a 24dp one, is open.

```example
menu:
  trigger: { text: File }
  position: bottom-start
  items:
    - { id: new, text: New }
    - { id: export, text: Export as, hasSubmenu: true, submenu: [{ id: pdf, text: PDF }, { id: png, text: PNG }] }
    - { id: close, text: Close }
```

A choice emits `select` with `{ item, itemId, itemData }`; the web component dispatches
`select` with `{ value }`, the item's id. `positionTarget` places the menu against another
element than its opener, as the select does with its field; the opener still opens it and
gets focus back. With `manualOpen`, the opener only places the menu and the app calls
`open()`: a context menu at the pointer uses a zero-sized opener it moves there. Recipes such
as a context menu or a menu inside a dialog are planned for [Examples](/examples/).

## API

<!-- API: generated from mtrl's types and <m-menu>'s spec in a later step. Until then these
tables are hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `opener` | `HTMLElement \| string \| { element }` | required | The element that opens the menu, and that it is placed against |
| `positionTarget` | `HTMLElement` | the opener | The element the menu is placed against, when it is not the opener |
| `items` | `MenuContent[]` | `[]` | Items, dividers and gaps |
| `variant` | `'baseline' \| 'vertical'` | `'baseline'` | `'vertical'` is the M3 Expressive menu |
| `color` | `'standard' \| 'vibrant'` | `'standard'` | The vertical menu's color mapping |
| `position` | `MenuPosition` | `'bottom-start'` | `top`, `bottom`, `left` or `right` of the opener, alone or with `-start` or `-end` |
| `offset` | `number` | `0` | Distance from the opener, in pixels |
| `autoFlip` | `boolean` | `true` | Flip to the other side to stay in the viewport |
| `closeOnSelect` | `boolean` | `true` | Close when an item is chosen |
| `closeOnClickOutside` | `boolean` | `true` | Close on a click outside |
| `closeOnEscape` | `boolean` | `true` | Close on `Escape` |
| `closeOnResize` | `boolean` | `false` | Close when the window is resized |
| `openSubmenuOnHover` | `boolean` | `true` | Open submenus on hover |
| `width` / `maxHeight` | `string` | `undefined` | CSS lengths; past `maxHeight` the list scrolls |
| `visible` | `boolean` | `false` | Whether it starts open |
| `container` | `HTMLElement` | `document.body` | Where the menu is appended |
| `layer` | `'top'` | `undefined` | The menu stays beside its opener and shows in the top layer, as a popover; `container` is then not used |
| `manualOpen` | `boolean` | `false` | The opener only places the menu; the app calls `open()` |
| `listbox` | `boolean` | `false` | The listbox popup of a select-only combobox: `option` items, focus kept by the combobox |
| `dense` | `boolean` | `false` | Compact items and tighter spacing, for toolbars |
| `on` | `{ open, close, select }` | `undefined` | Event handlers registered at creation |
| `class` | `string` | `undefined` | Additional CSS classes |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |

#### Items

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique identifier (required) |
| `text` | `string` | The label |
| `icon` | `string` | Leading icon markup |
| `shortcut` | `string` | Trailing shortcut hint, such as `⌘C` |
| `supportingText` | `string` | A second line under the label |
| `disabled` | `boolean` | Not selectable, and skipped by the arrows |
| `hasSubmenu` / `submenu` | `boolean` / `MenuItem[]` | A nested menu |
| `data` | `unknown` | App data, passed back as `itemData` |

`{ type: 'divider' }` and `{ type: 'gap' }` separate groups.

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `open(event?, interactionType?)` | `MenuComponent` | Opens the menu; `'keyboard'` focuses the first item |
| `close(event?, restoreFocus?)` | `MenuComponent` | Closes the menu |
| `toggle(event?)` | `MenuComponent` | Opens or closes it |
| `isOpen()` | `boolean` | Whether it is open |
| `setItems(items)` / `getItems()` | `MenuComponent` / `MenuContent[]` | The items |
| `setSelected(itemId)` / `getSelected()` | `MenuComponent` / `string \| null` | The selected item |
| `setOpener(opener)` / `getOpener()` | `MenuComponent` / `HTMLElement` | The opener |
| `setPosition(position)` / `getPosition()` | `MenuComponent` / `MenuPosition` | The position |
| `on(event, handler)` / `off(event, handler)` | `MenuComponent` | Events |
| `destroy()` | `void` | Destroys the menu and cleans up resources |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `open` | `{ menu, originalEvent? }` | The menu opened |
| `close` | `{ menu, originalEvent?, restoreFocus }` | The menu closed; `restoreFocus` says whether focus went back to the opener |
| `select` | `{ menu, item, itemId, value, itemData?, originalEvent?, preventDefault, defaultPrevented }` | An item was chosen |

Opening a menu closes any other root menu that is open, whatever opened it; that one's
`close` has `restoreFocus: false`.

## Accessibility

- The list is a `menu`, each item a `menuitem`, a divider a `separator`; a gap keeps the
  items in one menu. The opener has `aria-haspopup`, `aria-expanded` and `aria-controls`.
- `Down` and `Up` move between items, skipping disabled ones; `Home` and `End` go to the ends;
  typing a letter moves to the next item starting with it. `Enter` or `Space` chooses.
- `Right` opens a submenu and `Left` closes it. `Escape` closes the menu and returns focus to
  the opener; `Tab` closes it and moves on.
- Disabled items are `aria-disabled`; the selected one is `aria-selected`.

## Styling

```css
.mtrl-menu { }                                         /* the surface */
.mtrl-menu--visible { }
.mtrl-menu--position-bottom { }                        /* one class per position */
.mtrl-menu__list, .mtrl-menu__group { }
.mtrl-menu__item, .mtrl-menu__item--disabled, .mtrl-menu__item--selected, .mtrl-menu__item--submenu { }
.mtrl-menu__item-content, .mtrl-menu__item-icon, .mtrl-menu__item-text { }
.mtrl-menu__item-shortcut, .mtrl-menu__item-supporting { }
.mtrl-menu__divider { }
```

| Role (vertical) | Standard | Vibrant |
|------|----------|---------|
| Container | `surface-container-low` | `tertiary-container` |
| Label | `on-surface` | `on-tertiary-container` |
| Icons and supporting text | `on-surface-variant` | `on-tertiary-container` |
| Selected container | `tertiary-container` | `tertiary` |
| Selected label | `on-tertiary-container` | `on-tertiary` |

## Measurements

| Attribute | Baseline | Vertical |
|-----------|----------|----------|
| Container corner | 4dp | 16dp; 8dp behind an open submenu, 24dp for the submenu |
| Container padding | 8dp top and bottom | 4dp all round (`GroupPadding`) |
| Item height | 48dp | 44dp |
| Item corner | none | 4dp, 12dp when active; the first and last round outwards |
| Space between items | none | 2dp |
| Item label | Label Large | Body Large |
| Supporting text | Body Medium | Body Medium |
| Trailing text | Label Large | Label Small |
| Leading icon | 24dp | 20dp |
| Item padding | 12dp | 8dp and 16dp |
