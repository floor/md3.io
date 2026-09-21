# Bottom Sheet

A bottom sheet is a surface anchored to the bottom edge of the screen, holding content that is secondary to the page behind it. Reach for it when a task or a set of choices needs more room than a menu and less ceremony than a dialog. If the content is a short message, a [snackbar](snackbar.md) is lighter; if it demands a decision before anything else continues, a [dialog](dialog.md) is more direct.

## Overview

There are two variants, and the difference is what happens to the page behind them.

- A **modal** sheet covers the page with a scrim, takes focus, and closes on Escape or a click outside. Use it when the sheet's task must finish first.
- A **standard** sheet has no scrim and leaves the page usable alongside it. Use it for content a reader refers to while working.

A sheet opens to a peek height that shows what it holds, and expands to show the rest. Dragging the handle moves it between those heights, and dragging it down past the last one dismisses it.

## Import

```javascript
import { createBottomSheet } from 'mtrl';
```

## Basic Usage

```javascript
const sheet = createBottomSheet({
  title: 'Share this file',
  content: '<p>Anyone with the link can open it.</p>'
});

sheet.open();
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `variant` | `'standard' \| 'modal'` | `'modal'` | Modal covers the page and takes focus; standard leaves it usable |
| `title` | `string` | `undefined` | Headline, which also names the sheet through `aria-labelledby` |
| `content` | `string \| HTMLElement` | `undefined` | Body of the sheet, as markup or an element |
| `dragHandle` | `boolean` | `true` | The 32x4dp bar. Turning it off also turns off dragging |
| `peekHeight` | `number` | `56` | Height of the partially expanded state, in pixels |
| `maxWidth` | `number` | `640` | The sheet stops growing here and centres itself |
| `initialState` | `'hidden' \| 'partial' \| 'expanded'` | `'hidden'` | State to start in |
| `closeOnScrimClick` | `boolean` | `true` | Whether a click on the scrim closes a modal sheet |
| `closeOnEscape` | `boolean` | `true` | Whether Escape closes it |
| `container` | `HTMLElement` | `document.body` | Where to mount the sheet |
| `on` | `BottomSheetEventHandlers` | `undefined` | Handlers registered at creation |
| `class` | `string` | `undefined` | Extra classes for the root element |

## Component API

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `open()` | none | `BottomSheetComponent` | Opens the sheet at the peek height |
| `close()` | none | `BottomSheetComponent` | Closes the sheet |
| `expand()` | none | `BottomSheetComponent` | Opens it to its full height |
| `collapse()` | none | `BottomSheetComponent` | Returns it to the peek height |
| `isOpen()` | none | `boolean` | Whether the sheet is showing at all |
| `getState()` | none | `BottomSheetState` | `'hidden'`, `'partial'` or `'expanded'` |
| `setContent(content)` | `content: string \| HTMLElement` | `BottomSheetComponent` | Replaces the body |
| `setTitle(title)` | `title: string` | `BottomSheetComponent` | Replaces the headline, adding one if absent |
| `on(event, handler)` | `event: string, handler: Function` | `BottomSheetComponent` | Adds an event listener |
| `off(event, handler)` | `event: string, handler: Function` | `BottomSheetComponent` | Removes one |
| `destroy()` | none | `void` | Removes the sheet and releases its listeners |
| `getClass(name)` | `name: string` | `string` | Prefixes a class name |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `open` | none | The sheet became visible, whatever height it opened to |
| `close` | none | The sheet was hidden |
| `stateChange` | `{ state, previous }` | The sheet moved between hidden, partial and expanded |
| `dragStart` | none | A drag on the handle began |
| `dragEnd` | `{ state, previous }` | A drag ended and the sheet settled |

Handlers passed as `on` at creation are registered, so these two are equivalent:

```javascript
const sheet = createBottomSheet({ on: { close: () => save() } });
sheet.on('close', () => save());
```

## Examples

Reacting to how far the sheet is open:

```javascript
const sheet = createBottomSheet({
  title: 'Filters',
  on: {
    stateChange: ({ state, previous }) => {
      if (state === 'expanded') loadAllFilters();
      console.info(`moved from ${previous} to ${state}`);
    }
  }
});
```

A standard sheet, which leaves the page usable:

```javascript
const nearby = createBottomSheet({
  variant: 'standard',
  title: 'Nearby places',
  content: '<p>The map behind this sheet still pans.</p>'
});

nearby.open();
```

A sheet that cannot be dismissed by accident, for a step that must be completed:

```javascript
const consent = createBottomSheet({
  title: 'Before you continue',
  closeOnScrimClick: false,
  closeOnEscape: false,
  dragHandle: false
});
```

## Accessibility

A modal sheet's container carries `role="dialog"` and `aria-modal="true"`; a standard sheet's carries `role="region"`, since it does not trap the reader. Giving a `title` sets `aria-labelledby` to it, which is how the sheet is announced. Without a title the sheet has no accessible name, so pass one or set `aria-label` on the container yourself.

Opening a modal sheet moves focus to the container, and closing it returns focus to whatever had it before, so a keyboard user is not dropped at the top of the page. Escape closes the sheet unless `closeOnEscape` is false.

The drag handle is `aria-hidden`, because dragging is a shortcut rather than the only way to reach a state. Every height is reachable through `open()`, `expand()` and `collapse()`, so bind those to real controls rather than relying on the gesture.

While the sheet is hidden it is `aria-hidden` and takes no pointer events, so nothing inside it is reachable behind the page.

## Styling

| Class | Element |
|-------|---------|
| `.mtrl-bottom-sheet` | The fixed layer holding everything |
| `.mtrl-bottom-sheet--modal`, `--standard` | The variant |
| `.mtrl-bottom-sheet--hidden`, `--partial`, `--expanded` | The current state |
| `.mtrl-bottom-sheet-scrim` | The scrim, on modal sheets only |
| `.mtrl-bottom-sheet-container` | The sheet surface |
| `.mtrl-bottom-sheet-handle` | The drag handle |
| `.mtrl-bottom-sheet-header`, `-title` | The headline |
| `.mtrl-bottom-sheet-content` | The body |

## Measurements

Every value here comes from the token named beside it, so it can be checked rather than trusted.

| Attribute | Value | Token |
|-----------|-------|-------|
| Container colour | surface-container-low | `SheetBottomTokens.DockedContainerColor` |
| Container shape | 28dp, top corners only | `DockedContainerShape` (CornerExtraLargeTop) |
| Container elevation | level 1 | `DockedStandardContainerElevation` |
| Drag handle size | 32 x 4dp | `DockedDragHandleWidth` / `DockedDragHandleHeight` |
| Drag handle colour | on-surface-variant | `DockedDragHandleColor` |
| Focus ring colour | secondary | `SheetBottomTokens.FocusIndicatorColor` |
| Peek height | 56dp | `BottomSheetDefaults.SheetPeekHeight` |
| Maximum width | 640dp | `BottomSheetDefaults.SheetMaxWidth` |
| Drag distance to settle | 56dp | `BottomSheetDefaults.PositionalThreshold` |
| Drag speed to settle | 125dp/s | `BottomSheetDefaults.VelocityThreshold` |

The scrim is the scrim role at 32% opacity, matching the dialog.
