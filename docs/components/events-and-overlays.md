---
created: 2026-10-02
updated: 2026-10-02
status: published
---

# Events and overlays

Two rules hold for every factory, and the overlays add a few of their own. This page is the
whole contract: what a handler receives and when, what is true when `open()` returns, how
Escape and stacked modals behave, and which method reads a component's state.

## A config handler is a listener

A config `on*` option (`onChange`, `onOpen`, …) is the listener registered at creation. It
gets the same argument as a listener passed to `on()`, and it runs before one added later.

```typescript
import { createDrawer } from 'material';

const drawer = createDrawer({
  variant: 'modal',
  items: [{ id: 'inbox', label: 'Inbox' }],
  onOpen: () => console.log('first'),
});
drawer.on('open', () => console.log('second'));
document.body.append(drawer.element);
```

## What is true when `open()` returns

When `open()` or `close()` returns:

- **the state has changed**: `isOpen()` answers for the new state;
- **the event has been emitted**, after a cancellable `beforeopen` or `beforeclose` where the
  component has one.

The classes, the paint, focus and the animation may follow. So add an `open` listener before
calling `open()`, not after.

```typescript continued
drawer.open();
console.log(drawer.isOpen()); // true: 'first' and 'second' are already logged
```

Opening an open component, or closing a closed one, does nothing and emits nothing.

Every overlay follows this rule, whatever its methods are called: the snackbar with `show()`
and `hide()`, the split button with `expand()` and `collapse()`.

A surface loaded on demand, such as the FAB menu's menu, may be painted after `open()` returns.

## The event that opened an overlay

The event that opened an overlay never dismisses it. An overlay opened from a click handler
ignores exactly that click: the event whose dispatch had begun when `open()` ran, and nothing
later.

## Escape and stacked modals

Escape is a key press for every modal: the dialog, the modal sheets and drawer, the pickers
and the full-screen search.

- **Only the topmost modal answers.** With a dialog open over a drawer, Escape closes the
  dialog and leaves the drawer.
- **A refusal holds for any number of presses.** A modal refuses with `closeOnEscape: false`,
  with a `beforeclose` listener that prevents it, or, for a drawer, with `dismissible: false`.
- **A close request that is not a key press can still be forced.** A back gesture, for
  example: the browser closes the modal on its third refusal.

## The elements' `open` attribute

On the web components, the `open` attribute and property are applied at once and dispatch
nothing. The `open` and `close` events are dispatched when a method or the user opens or
closes the element.

## The tooltip

The tooltip is outside the `open()` rule, by design. Its `show()` and `hide()` wait for their
delays, 300 and 100 ms, unless called with `true`, and they emit no event. Read `isVisible()`.

## State getters

The state getter is a method on every component that has one.

| Getter | Components |
|---|---|
| `isOpen()` | Dialog, menu, select, FAB menu, bottom sheet, side sheet, drawer, snackbar, date picker, time picker |
| `isExpanded()` | Search, split button, navigation rail, card |
| `isVisible()` | Tooltip, bottom app bar, toolbar |
| `isHidden()` | Navigation bar |
