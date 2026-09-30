# Bottom sheet

A bottom sheet holds secondary content anchored to the bottom of the screen: sharing
options, filters, the details of a place on a map. A **modal** sheet covers the page with a
scrim until it closes; a **standard** sheet leaves the page usable beside it. See the
[M3 bottom sheets guidelines](https://m3.material.io/components/bottom-sheets/overview).

## Usage

An open sheet is partially expanded, showing its content up to half the screen; dragging its
handle up expands it to its full height, and down closes it.

```example
bottom-sheet:
  variant: modal
  title: Share
  content: Anyone with the link can view it.
  action share:
    open
```

## Examples

### Standard

A standard sheet has no scrim, so the page behind it still takes clicks.

```example
bottom-sheet:
  variant: standard
  title: Nearby places
  content: Three cafés within a five-minute walk.
```

### Peek height

`peekHeight` sets the partially expanded height in pixels; `expand()` and `collapse()` move
between the two heights.

```example
bottom-sheet:
  variant: modal
  title: Filters
  peekHeight: 160
  content: Price, distance and opening hours.
```

### Only its content closes it

For a step that must be finished, the scrim, `Escape` and the drag handle can be kept from
closing it.

```example
bottom-sheet:
  variant: modal
  title: Before you continue
  content: Review the updated terms.
  dragHandle: false
  closeOnScrimClick: false
  closeOnEscape: false
```

## API

<!-- API: generated from mtrl's types and <m-bottom-sheet>'s spec in a later step. Until then
these tables are hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `variant` | `'standard' \| 'modal'` | `'modal'` | Whether it covers the page; the web component is standard without `modal` |
| `title` | `string` | `undefined` | The headline, which names the sheet |
| `content` | `string \| HTMLElement` | `undefined` | The body, as HTML or an element |
| `dragHandle` | `boolean` | `true` | The handle, a button, and dragging with it |
| `peekHeight` | `number` | `undefined` | The partially expanded height in pixels; without it, the content up to half the screen |
| `maxWidth` | `number` | `640` | The widest it grows, in pixels, past which it is centered |
| `initialState` | `'hidden' \| 'partial' \| 'expanded'` | `'hidden'` | How far open it starts |
| `closeOnScrimClick` | `boolean` | `true` | Whether a click on the scrim closes a modal sheet |
| `closeOnEscape` | `boolean` | `true` | Whether `Escape` closes it; a standard sheet only from inside it |
| `layer` | `'top'` | `undefined` | Shows a modal sheet in the top layer, as a native `<dialog>` with `showModal()`; the web component's modal sheet always is |
| `container` | `HTMLElement` | `document.body` | Where it is mounted |
| `on` | `{ open?, close?, stateChange?, dragStart?, dragEnd? }` | `undefined` | Event handlers registered at creation |
| `class` | `string` | `undefined` | Additional CSS classes |

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `open()` / `close()` | none | `BottomSheetComponent` | Opens it partially expanded, or closes it |
| `expand()` / `collapse()` | none | `BottomSheetComponent` | Moves it to its full or its partial height, opening it if it is closed |
| `isOpen()` | none | `boolean` | Whether it is open at either height |
| `getState()` | none | `'hidden' \| 'partial' \| 'expanded'` | How far open it is |
| `setTitle(title)` / `setContent(content)` | `title: string`, `content: string \| HTMLElement` | `BottomSheetComponent` | The headline, the body |
| `on(event, handler)` / `off(event, handler)` | `event: string, handler: Function` | `BottomSheetComponent` | Adds or removes a listener |
| `destroy()` | none | `void` | Removes it |

### Events

| Event | Description | Data |
|-------|-------------|------|
| `open` / `close` | It opened or closed | none |
| `stateChange` | It moved between hidden, partial and expanded | `{ state, previous }` |
| `dragStart` / `dragEnd` | A drag on the handle began, or ended and settled | none / `{ state, previous }` |

The web component dispatches `open`, `close`, `expand` and `collapse`, without a detail; its
`expanded` attribute reflects the full height.

## Accessibility

- A modal sheet is a `dialog` with `aria-modal`, a standard one a `region`; the title names
  either. Without a title, give the web component an `aria-label`.
- Opening a modal sheet focuses it, and closing it gives focus back. `Tab` stays inside it and
  the page behind it is inert, in the top layer or not.
- `Escape` closes a modal sheet from anywhere, and a standard one from inside it; a click on
  the scrim closes a modal sheet. Each can be turned off.
- The drag handle is a button, as in Compose: it expands a partially open sheet and closes an
  expanded one, and its name says which ("Expand sheet", "Close sheet").

## Styling

```css
.mtrl-bottom-sheet { }                     /* the fixed layer, holding the scrim and the sheet */
.mtrl-bottom-sheet--modal, .mtrl-bottom-sheet--standard { }
.mtrl-bottom-sheet--hidden, .mtrl-bottom-sheet--partial, .mtrl-bottom-sheet--expanded { }
.mtrl-bottom-sheet__scrim { }              /* a modal sheet's, outside the top layer */
.mtrl-bottom-sheet__container { }          /* the sheet */
.mtrl-bottom-sheet__handle, .mtrl-bottom-sheet__header, .mtrl-bottom-sheet__title { }
.mtrl-bottom-sheet__content { }
```

## Measurements

| Attribute | Value |
|-----------|-------|
| Container | `surface-container-low`, 28dp top corners, elevation 1 |
| Maximum width | 640dp |
| Drag handle | A 48dp button drawing a 32×4dp bar in `on-surface-variant`; focus ring `secondary` |
| Headline | Headline Small, `on-surface` |
| Content | Body Medium, `on-surface-variant`, 24dp at the sides |
| Scrim | `scrim` at 32% |
| Settling a drag | 56dp, or a flick of 125dp/s |
