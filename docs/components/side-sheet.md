# Side Sheet

A side sheet is a surface docked to a vertical edge of the screen, holding content that supports the page rather than replacing it: filters beside a list of results, details beside a map, a form beside the record it edits. Reach for it when the reader needs the sheet and the page at once. If the content must be dealt with before anything else continues, a [dialog](dialog.md) is more direct; if it belongs at the bottom of the screen on a small window, a [bottom sheet](bottom-sheet.md) fits better.

## Overview

There are two variants, and the difference is what happens to the page behind them.

- A **modal** sheet floats over the page behind a scrim, takes focus, and closes on Escape, on its close button, or on a click outside.
- A **standard** sheet sits beside the page on a plain surface with no scrim, and leaves it usable.

They differ in colour as well as behaviour: a standard sheet sits on `surface`, a modal one on `surface-container-low`.

## Import

```javascript
import { createSideSheet } from 'mtrl';
```

## Basic Usage

```javascript
const filters = createSideSheet({
  title: 'Filters',
  content: '<p>Narrow the results.</p>'
});

filters.open();
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `variant` | `'standard' \| 'modal'` | `'modal'` | Modal floats over the page and takes focus; standard docks beside it |
| `position` | `'start' \| 'end'` | `'end'` | Which edge to dock to. Logical, so it follows the writing direction |
| `title` | `string` | `undefined` | Headline, which also names the sheet through `aria-labelledby` |
| `content` | `string \| HTMLElement` | `undefined` | Body of the sheet, as markup or an element |
| `width` | `number` | `256` | Width in pixels, capped by `maxWidth` |
| `maxWidth` | `number` | `400` | The sheet never grows past this |
| `closeButton` | `boolean` | `true` | Whether the header carries a close button |
| `closeOnScrimClick` | `boolean` | `true` | Whether a click on the scrim closes a modal sheet |
| `closeOnEscape` | `boolean` | `true` | Whether Escape closes it |
| `open` | `boolean` | `false` | Whether the sheet starts open |
| `container` | `HTMLElement` | `document.body` | Where to mount the sheet |
| `on` | `SideSheetEventHandlers` | `undefined` | Handlers registered at creation |
| `class` | `string` | `undefined` | Extra classes for the root element |

## Component API

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `open()` | none | `SideSheetComponent` | Opens the sheet |
| `close()` | none | `SideSheetComponent` | Closes it |
| `toggle()` | none | `SideSheetComponent` | Opens it if closed, closes it if open |
| `isOpen()` | none | `boolean` | Whether the sheet is showing |
| `setContent(content)` | `content: string \| HTMLElement` | `SideSheetComponent` | Replaces the body |
| `setTitle(title)` | `title: string` | `SideSheetComponent` | Replaces the headline, adding one if absent |
| `on(event, handler)` | `event: string, handler: Function` | `SideSheetComponent` | Adds an event listener |
| `off(event, handler)` | `event: string, handler: Function` | `SideSheetComponent` | Removes one |
| `destroy()` | none | `void` | Removes the sheet and releases its listeners |
| `getClass(name)` | `name: string` | `string` | Prefixes a class name |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `open` | none | The sheet became visible |
| `close` | none | The sheet was hidden, however it was dismissed |

Handlers passed as `on` at creation are registered, so these two are equivalent:

```javascript
const sheet = createSideSheet({ on: { close: () => applyFilters() } });
sheet.on('close', () => applyFilters());
```

## Examples

A standard sheet toggled beside the page:

```javascript
const details = createSideSheet({
  variant: 'standard',
  title: 'Details',
  content: '<p>The page behind this sheet still scrolls.</p>'
});

toggleButton.addEventListener('click', () => details.toggle());
```

Applying work when the sheet closes, however it was dismissed:

```javascript
const filters = createSideSheet({
  title: 'Filters',
  on: { close: () => refreshResults() }
});
```

A sheet docked to the leading edge, at a wider size:

```javascript
const navigation = createSideSheet({
  position: 'start',
  width: 360,
  title: 'Sections'
});
```

## Accessibility

A modal sheet's container carries `role="dialog"` and `aria-modal="true"`. A standard sheet's carries `role="complementary"`, because it supports the page rather than interrupting it, and does not trap the reader.

Giving a `title` sets `aria-labelledby` to it, which is how the sheet is announced. Without a title the sheet has no accessible name, so pass one or set `aria-label` on the container yourself.

Opening a modal sheet moves focus to the container, and closing it returns focus to whatever had it before, so a keyboard user is not dropped at the top of the page.

The close button is a real `<button type="button">` with `aria-label="Close"`, and its icon is `aria-hidden`, so the button is announced by its name rather than by its glyph. Its focus ring uses the secondary role.

While the sheet is closed it is `aria-hidden` and takes no pointer events, so nothing inside it is reachable behind the page.

## Styling

| Class | Element |
|-------|---------|
| `.mtrl-side-sheet` | The fixed layer holding everything |
| `.mtrl-side-sheet--modal`, `--standard` | The variant |
| `.mtrl-side-sheet--start`, `--end` | Which edge it docks to |
| `.mtrl-side-sheet--open` | Present while the sheet is showing |
| `.mtrl-side-sheet-scrim` | The scrim, on modal sheets only |
| `.mtrl-side-sheet-container` | The sheet surface |
| `.mtrl-side-sheet-header`, `-title`, `-close` | The header |
| `.mtrl-side-sheet-content` | The body |

Positions are written with logical properties throughout, so a sheet docked to the end appears on the right in a left-to-right document and on the left in a right-to-left one, with its corners and its slide direction mirrored to match.

## Measurements

Compose has no side sheet tokens, so these come from the M3 side sheet specs and the Android implementation. Each row names its source rather than a token that does not exist.

| Attribute | Value | Source |
|-----------|-------|--------|
| Container colour, standard | surface | Android `SideSheet` default `colorSurface` |
| Container colour, modal | surface-container-low | Android `SideSheet` default `colorSurfaceContainerLow` |
| Container shape | 16dp, on the two corners facing the page | Android `shapeAppearanceCornerLarge` |
| Default width | 256dp | Android standard side sheet layout width |
| Maximum width | 400dp | Side sheet specs, container maximum width |
| Header padding | 24dp either side, 12dp between elements | Side sheet specs |
| Header height | 72dp | Side sheet specs, bottom actions height |
| Content padding | 24dp | Side sheet specs, start and end padding |

The scrim is the scrim role at 32% opacity, matching the dialog and the bottom sheet. Modal sheets carry elevation level 1; standard sheets carry none, because they are docked rather than floating.
