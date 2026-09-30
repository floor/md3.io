# Side sheet

A side sheet holds content that supports the page, docked to its side: filters beside a list
of results, the details of a selected item. A **modal** sheet covers the page with a scrim
until it closes; a **standard** sheet has none, and the page stays usable beside it. See the
[M3 side sheets guidelines](https://m3.material.io/components/side-sheets/overview).

## Usage

`close` fires however it closed: its close button, the scrim, `Escape` or `close()`.

```example
side-sheet:
  variant: modal
  title: Filters
  content: Narrow the results by price and distance.
  on close: refreshResults()
  action showFilters:
    open
```

## Examples

### Standard, at the start

A standard sheet sits on `surface` without a scrim. `position` is logical: `start` is the left
edge in a left-to-right page and the right edge in a right-to-left one.

```example
side-sheet:
  variant: standard
  position: start
  title: Details
  content: Created on 3 September by Ada.
```

### Wider, without a close button

`width` is in pixels, up to 400. Without its close button, a sheet needs another way to close:
here the scrim and `Escape`.

```example
side-sheet:
  variant: modal
  width: 360
  closeButton: false
  title: Sections
  content: Overview, specs, accessibility.
```

`toggle()` opens a closed sheet and closes an open one. Recipes such as filters applied on
close are planned for [Examples](/examples/).

## API

<!-- API: generated from mtrl's types and <m-side-sheet>'s spec in a later step. Until then
these tables are hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `variant` | `'standard' \| 'modal'` | `'modal'` | Whether it covers the page; the web component is standard without `modal` |
| `position` | `'start' \| 'end'` | `'end'` | The edge it docks to, in the reading direction |
| `title` | `string` | `undefined` | The headline, which names the sheet |
| `content` | `string \| HTMLElement` | `undefined` | The body, as HTML or an element |
| `width` | `number` | `256` | Its width in pixels |
| `maxWidth` | `number` | `400` | The widest it grows, in pixels |
| `closeButton` | `boolean` | `true` | A close button in the header |
| `closeOnScrimClick` | `boolean` | `true` | Whether a click on the scrim closes a modal sheet |
| `closeOnEscape` | `boolean` | `true` | Whether `Escape` closes it |
| `open` | `boolean` | `false` | Whether it starts open |
| `layer` | `'top'` | `undefined` | Shows a modal sheet in the top layer, as a native `<dialog>` with `showModal()`; the web component's modal sheet always is |
| `container` | `HTMLElement` | `document.body` | Where it is mounted |
| `on` | `{ open?, close? }` | `undefined` | Event handlers registered at creation |
| `class` | `string` | `undefined` | Additional CSS classes |

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `open()` / `close()` / `toggle()` | none | `SideSheetComponent` | Opens or closes it |
| `isOpen()` | none | `boolean` | Whether it is open |
| `setTitle(title)` / `setContent(content)` | `title: string`, `content: string \| HTMLElement` | `SideSheetComponent` | The headline, the body |
| `on(event, handler)` / `off(event, handler)` | `event: 'open' \| 'close', handler: Function` | `SideSheetComponent` | Adds or removes a listener |
| `destroy()` | none | `void` | Removes it |

### Events

| Event | Description | Data |
|-------|-------------|------|
| `open` / `close` | It opened or closed | none |

The web component dispatches them too, without a detail.

## Accessibility

- A modal sheet is a `dialog` with `aria-modal`, a standard one `complementary`; the title
  names either. Without a title, give the web component an `aria-label`.
- Opening a modal sheet focuses it, and closing it gives focus back. In the top layer, `Tab`
  stays inside it and the page behind it is inert.
- `Escape` closes it, and a click on the scrim closes a modal sheet, unless turned off. The
  close button is named "Close".

## Styling

```css
.mtrl-side-sheet, .mtrl-side-sheet--open { }   /* the fixed layer, holding the scrim and the sheet */
.mtrl-side-sheet--modal, .mtrl-side-sheet--standard { }
.mtrl-side-sheet--start, .mtrl-side-sheet--end { }
.mtrl-side-sheet__scrim { }                    /* a modal sheet's, outside the top layer */
.mtrl-side-sheet__container { }                /* the sheet */
.mtrl-side-sheet__header, .mtrl-side-sheet__title, .mtrl-side-sheet__close { }
.mtrl-side-sheet__content { }
```

## Measurements

| Attribute | Value |
|-----------|-------|
| Container | Standard `surface`, no elevation; modal `surface-container-low`, elevation 1 |
| Corners | 16dp on the side facing the page |
| Width | 256dp by default, 400dp at most |
| Header | 72dp high, 16dp above and below, 24dp at the sides, 12dp gaps; Title Large, `on-surface` |
| Close button | 40dp, `on-surface-variant` icon |
| Content | Body Medium, `on-surface-variant`, 24dp at the sides |
| Scrim | `scrim` at 32% |
