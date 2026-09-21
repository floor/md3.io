# Dialog Component

A dialog interrupts. It puts a scrim over the page, takes focus, and asks for a decision the app cannot make on its own: confirm a deletion, fill in a short form, read something that must not be missed. Reach for it when the answer has to come before anything else continues. If the message needs no decision, a [snackbar](snackbar.md) is the lighter thing; if the choices are a list, a [menu](menu.md) is.

## Overview

The component covers the two shapes the Material 3 dialog specification describes:

- A **basic dialog** — a headline, supporting text, and up to two text buttons. It is an `alertdialog`, and it is dismissed by its actions rather than by a close icon.
- A **full-screen dialog** — a task that fills a compact window, with a close affordance in a 56dp header and its actions in a bar at the bottom. It is a plain `dialog`, and it does get a close button.

Everything else is one of the sizes in between. The dialog manages its own overlay, focus trap, Escape handling and animation; you supply the content and the buttons.

## Import

```javascript
import { createDialog } from 'mtrl';
```

## Basic Usage

```javascript
const dialog = createDialog({
  title: 'Basic Dialog',
  content: '<p>This is a basic dialog with a title, content, and standard buttons.</p>',
  buttons: [
    { text: 'Cancel', variant: 'text', closeDialog: true },
    { text: 'OK', variant: 'text', closeDialog: true, onClick: () => save() }
  ]
});

dialog.open();
```

The dialog appends its own overlay to `document.body` (or to `container`), so there is nothing to mount yourself. Call `destroy()` when you are done with it, or create a fresh one each time, as the showcase does.

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title` | `string` | `undefined` | Headline, in the header |
| `subtitle` | `string` | `undefined` | Supporting line under the headline |
| `content` | `string` | `undefined` | Body, as text or HTML |
| `buttons` | `DialogButton[]` | `[]` | Footer actions, in order |
| `size` | `'small' \| 'medium' \| 'large' \| 'fullwidth' \| 'fullscreen'` | `'medium'` | Width variant |
| `animation` | `'scale' \| 'slide-up' \| 'slide-down' \| 'fade'` | `'scale'` | How it enters and leaves |
| `footerAlignment` | `'right' \| 'left' \| 'center' \| 'space-between'` | `'right'` | Where the footer buttons sit |
| `open` | `boolean` | `false` | Whether it starts open |
| `divider` | `boolean` | `false` | Rules between header and content, and — when there is a footer — between content and footer |
| `closeButton` | `boolean` | `false`, `true` at `fullscreen` | A close affordance in the header |
| `closeOnOverlayClick` | `boolean` | `true` | Dismiss by clicking the scrim |
| `closeOnEscape` | `boolean` | `true` | Dismiss with Escape |
| `modal` | `boolean` | `true` | Sets `aria-modal` on the dialog |
| `autofocus` | `boolean` | `true` | Focus the first focusable element on open |
| `trapFocus` | `boolean` | `true` | Keep Tab inside the dialog |
| `role` | `'alertdialog' \| 'dialog'` | by size | Overrides the role the size implies |
| `ariaLabel` | `string` | `undefined` | Accessible name when there is no headline |
| `container` | `HTMLElement` | `document.body` | Where the overlay is appended |
| `animationDuration` | `number` | `150` | Open/close duration in milliseconds |
| `zIndex` | `number` | `1000` | Stacking order override |
| `class` | `string` | `undefined` | Extra CSS classes |
| `on` | `Record<DialogEventType, handler>` | `undefined` | Event handlers registered at creation |

### Buttons

Each entry in `buttons` is a `DialogButton`:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `text` | `string` | — | Label; required |
| `variant` | `string` | `'text'` | Button variant, e.g. `'filled'`, `'tonal'`, `'outlined'` |
| `color` | `string` | `undefined` | **Accepted but not applied.** The dialog does not pass it to the button; a coloured action needs `class` on the dialog and a rule of your own |
| `size` | `string` | `undefined` | **Accepted but not applied.** The dialog does not pass it to the button, so every action is the default button size |
| `onClick` | `(event, dialog) => void \| boolean` | `undefined` | What the action does |
| `closeDialog` | `boolean` | `true` | Whether activating it closes the dialog |
| `autofocus` | `boolean` | `false` | Focus this button when the dialog opens |
| `attributes` | `Record<string, any>` | `undefined` | Extra **button config**, spread into `createButton`. Only keys the button knows (`id`, `style`, `data`, `ariaLabel`, …) survive; arbitrary attributes such as `data-id` or `form` are dropped |

## Component API

### Visibility

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `open()` | — | `DialogComponent` | Shows the dialog |
| `close()` | — | `DialogComponent` | Hides it |
| `toggle(open)` | `open?: boolean` | `DialogComponent` | Flips the state, or forces one |
| `isOpen()` | — | `boolean` | Whether it is open |

### Content

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setTitle(title)` | `title: string` | `DialogComponent` | Replaces the headline |
| `getTitle()` | — | `string` | The current headline |
| `setSubtitle(subtitle)` | `subtitle: string` | `DialogComponent` | Replaces the supporting line |
| `getSubtitle()` | — | `string` | The current supporting line |
| `setContent(content)` | `content: string` | `DialogComponent` | Replaces the body |
| `getContent()` | — | `string` | The current body |
| `getHeaderElement()` | — | `HTMLElement \| null` | The header, for direct work |
| `getContentElement()` | — | `HTMLElement \| null` | The content region |
| `getFooterElement()` | — | `HTMLElement \| null` | The footer |

### Buttons and layout

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `addButton(button)` | `button: DialogButton` | `DialogComponent` | Appends an action |
| `removeButton(indexOrText)` | `number \| string` | `DialogComponent` | Removes by position or label |
| `getButtons()` | — | `DialogButton[]` | The current actions |
| `setFooterAlignment(alignment)` | `DialogFooterAlignment` | `DialogComponent` | Moves the footer buttons |
| `setSize(size)` | `DialogSize` | `DialogComponent` | Changes the width variant |
| `toggleDivider(show)` | `show: boolean` | `DialogComponent` | Shows or hides the rules |
| `hasDivider()` | — | `boolean` | Whether the rule is showing |

### Events and lifecycle

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `on(event, handler)` | `event: DialogEventType, handler` | `DialogComponent` | Adds a listener |
| `off(event, handler)` | `event: DialogEventType, handler` | `DialogComponent` | Removes one |
| `confirm(options)` | `options?: DialogConfirmOptions` | `Promise<boolean>` | Opens a confirmation and resolves to the answer |
| `destroy()` | — | `void` | Removes the overlay and releases focus |

| Property | Type | Description |
|----------|------|-------------|
| `element` | `HTMLElement` | The dialog surface |
| `overlay` | `HTMLElement` | The scrim it sits in |

## Events

`beforeopen` and `beforeclose` receive the full `DialogEvent`: `{ dialog, preventDefault, defaultPrevented }`. The other four carry `{ dialog }` alone — there is nothing to prevent once the dialog has committed to opening or closing, so they have no `preventDefault`. No dialog event populates `originalEvent`, although the type declares it.

| Event | Payload | Description |
|-------|---------|-------------|
| `beforeopen` | `{ dialog, preventDefault, defaultPrevented }` | About to open; `preventDefault()` stops it |
| `open` | `{ dialog }` | Opening has begun |
| `afteropen` | `{ dialog }` | The enter animation has finished |
| `beforeclose` | `{ dialog, preventDefault, defaultPrevented }` | About to close; `preventDefault()` stops it |
| `close` | `{ dialog }` | Closing has begun |
| `afterclose` | `{ dialog }` | The exit animation has finished |

`beforeclose` is the hook for a dialog that should not close yet:

```javascript
dialog.on('beforeclose', (event) => {
  if (!form.checkValidity()) event.preventDefault();
});
```

## Examples

### Confirming something destructive

`confirm()` builds a small dialog with two buttons and resolves to the answer, so the call site reads like a question.

```javascript
const dialog = createDialog();

const confirmed = await dialog.confirm({
  title: 'Delete Item',
  message: 'Are you sure you want to delete this item? This action cannot be undone.',
  confirmText: 'Delete',
  cancelText: 'Cancel'
});

if (confirmed) deleteItem();
```

Two things to know before you await it. The promise settles only when one of the two buttons is pressed: dismissing the confirmation with Escape or a click on the scrim leaves it pending for ever, so either await it behind a `Promise.race`, or pass `closeOnEscape: false` and `closeOnOverlayClick: false` when you create the dialog. And `confirm()` appends the confirming button first, so it sits at the left of the pair — the reverse of the order this page recommends for buttons you write yourself. Build the dialog by hand when the order matters.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `message` | `string` | — | The question; required |
| `title` | `string` | `'Confirm'` | Headline above it |
| `confirmText` | `string` | `'Yes'` | Label of the affirming button |
| `cancelText` | `string` | `'No'` | Label of the dismissing button |
| `confirmVariant` | `string` | `'filled'` | Variant of the affirming button |
| `cancelVariant` | `string` | `'text'` | Variant of the dismissing button |
| `size` | `DialogSize` | `'small'` | Size of the confirmation dialog |

It also reuses the dialog it is called on: the title, the content and the size are replaced, and any buttons already there are destroyed.

### A form that validates before it closes

Give the accepting button `closeDialog: false` and close it yourself when the form is happy.

```javascript
const dialog = createDialog({
  title: 'Settings',
  content: '<div id="settings-form"></div>',
  divider: true,
  buttons: [
    { text: 'Cancel', variant: 'text', closeDialog: true },
    {
      text: 'Save',
      variant: 'filled',
      closeDialog: false,
      onClick: (event, dialog) => {
        const form = document.getElementById('settings-form');
        if (form.checkValidity()) {
          save(form);
          dialog.close();
        }
      }
    }
  ]
});

dialog.open();
```

### Full-screen

The `fullscreen` size is for a task in a compact window. It takes the whole viewport, gets a close affordance in its header without being asked, and drops back to `role="dialog"` because it holds work rather than a prompt.

```javascript
const dialog = createDialog({
  title: 'Fullscreen Dialog',
  content: renderEditor(),
  size: 'fullscreen',
  buttons: [{ text: 'Save', variant: 'filled', closeDialog: true }]
});
```

### Sizes and animations

```javascript
for (const size of ['small', 'medium', 'large', 'fullwidth']) {
  createDialog({ title: `${size} dialog`, content: '…', size });
}

for (const animation of ['scale', 'fade', 'slide-up', 'slide-down']) {
  createDialog({ title: `${animation} animation`, content: '…', animation });
}
```

## Accessibility

- The surface, not the scrim, carries the semantics: `role="alertdialog"` for a basic dialog, `role="dialog"` at the `fullscreen` size, with `aria-modal="true"` unless `modal: false`. `role` overrides the choice.
- The headline labels the dialog through `aria-labelledby`; without one, pass `ariaLabel`. The content is referenced with `aria-describedby`.
- On open, focus goes to the element marked `autofocus`, else the first focusable one, else the dialog itself. On close it goes back to whatever had it before, if that element is still on the page.
- Tab and Shift+Tab cycle inside the dialog while `trapFocus` is on; with nothing focusable inside, focus stays on the dialog.
- Escape closes it unless `closeOnEscape: false`. A press on the scrim that ends on the scrim closes it unless `closeOnOverlayClick: false` — a drag that starts inside the dialog and releases outside does not.
- The close affordance is labelled `Close dialog`.
- Under `prefers-reduced-motion` the transforms are dropped and only a short opacity fade remains.

## Styling

```css
.mtrl-dialog { /* the surface */ }
.mtrl-dialog-overlay { /* the scrim */ }
.mtrl-dialog--visible { /* while open */ }
.mtrl-dialog--small,
.mtrl-dialog--medium,
.mtrl-dialog--large,
.mtrl-dialog--fullwidth,
.mtrl-dialog--fullscreen { /* sizes */ }
.mtrl-dialog--scale,
.mtrl-dialog--fade,
.mtrl-dialog--slide-up,
.mtrl-dialog--slide-down { /* animations */ }

.mtrl-dialog-header { /* ... */ }
.mtrl-dialog-header-title { /* ... */ }
.mtrl-dialog-header-subtitle { /* ... */ }
.mtrl-dialog-header-close { /* ... */ }
.mtrl-dialog-content { /* ... */ }
.mtrl-dialog-content--scrollable { /* opt-in, 60vh cap */ }
.mtrl-dialog-footer { /* ... */ }
.mtrl-dialog-footer--left,
.mtrl-dialog-footer--center,
.mtrl-dialog-footer--space-between { /* alignments */ }
.mtrl-dialog-header-divider,
.mtrl-dialog-footer-divider { /* ... */ }
```

## Measurements

Each row cites what `src/styles/components/_dialog.scss` names for it.

| Attribute | Value | Token |
|-----------|-------|-------|
| Container colour | surface-container-high | `surface-container-high` |
| Container corner | 28dp | `shape("extra-large")` |
| Container elevation | level 3 | `elevation(3)` |
| Scrim | 32% | `scrim` at 0.32 |
| Headline typography | headline-small | `typography("headline-small")` |
| Subtitle and body typography | body-medium | `typography("body-medium")` |
| Body colour | on-surface-variant | `on-surface-variant` |
| Divider colour | outline-variant | `outline-variant` |
| Enter/exit motion | medium 1, emphasized | `motion("duration-medium1")`, `motion("easing-emphasized")` |
| Full-screen header and action bar | 56dp | header and footer `min-height` |
| Full-screen headline typography | title-large | `typography("title-large")` |

Spacing is 24dp around the header and footer and 24dp at the sides of the content, so the gap from title to body is 16dp and from body to actions 24dp, each counted once. Footer buttons are 8dp apart. A basic dialog is at most 560dp wide at every size; `large` narrows the margins rather than exceeding it, because past 560dp the specification's answer is a full-screen dialog, not a wider one.

## Best Practices

- Two actions at most in a basic dialog, the affirming one last. Label them with the verb, not "OK".
- Do not add a close icon to a basic dialog. Its actions are the way out; the icon belongs to the full-screen size.
- Keep the body to a sentence or two. A dialog that scrolls is a sign the content wants a page, or the `fullscreen` size.
- Reserve `closeOnEscape: false` and `closeOnOverlayClick: false` for work that would be lost — and then give the dialog an explicit Cancel.
- One dialog at a time. A dialog opened from a dialog is a flow that wants a full-screen one with steps.

## TypeScript Support

```typescript
import { createDialog, DialogConfig, DialogComponent } from 'mtrl';

const config: DialogConfig = {
  title: 'Delete item',
  content: 'This cannot be undone.',
  size: 'small',
  buttons: [{ text: 'Delete', variant: 'filled' }]
};

const dialog: DialogComponent = createDialog(config);
dialog.on('afterclose', ({ dialog }) => dialog.destroy());
dialog.open();
```
