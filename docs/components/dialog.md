---
created: 2026-09-21
updated: 2026-10-01
status: published
---

# Dialog

A dialog asks for a decision, or holds a short task, before anything else continues: discard
a draft, confirm a deletion, pick a ringtone. It is modal: the page behind it is out of reach
until it closes. For a message that needs no answer, use a [snackbar](/docs/components/snackbar/).
See the [M3 dialogs guidelines](https://m3.material.io/components/dialogs/overview).

## Usage

The buttons are its actions, and each closes it. `layer: 'top'` shows it in the browser's top
layer, as a native `<dialog>` above everything else; the web component always is.

```example
dialog:
  title: Discard draft?
  content: Your draft will be deleted.
  layer: top
  buttons:
    - { text: Cancel, variant: text, closeDialog: true }
    - { text: Discard, variant: text, closeDialog: true }
  action ask:
    open
```

## Examples

### Full screen

A full-screen dialog holds a task in a compact window. It has a close button in its header,
and is a `dialog` rather than an `alertdialog`.

```example
dialog:
  title: New event
  content: Add a title, a time and guests.
  size: fullscreen
  layer: top
  buttons:
    - { text: Save, variant: text, closeDialog: true }
```

### Only its actions close it

For work that would be lost, the scrim and `Escape` can be kept from closing it; its
actions then have to include a way out.

```example
dialog:
  title: Leave the survey?
  content: Your answers so far will be lost.
  closeOnOverlayClick: false
  closeOnEscape: false
  layer: top
  buttons:
    - { text: Stay, variant: text, closeDialog: true }
    - { text: Leave, variant: text, closeDialog: true }
```

### Subtitle and dividers

`divider` draws a line above and below the content, for a body that scrolls.

```example
dialog:
  title: Terms of service
  subtitle: Updated September 2026
  content: These terms apply to your use of the service.
  divider: true
  layer: top
  buttons:
    - { text: Accept, variant: text, closeDialog: true }
```

A button's `onClick(event, dialog)` runs its action, and returning `false` keeps the dialog
open; the web component's actions are buttons of your own. `confirm({ message })` asks a
question in the dialog and resolves to the answer. Recipes such as confirming a deletion or a
form that validates before it closes are planned for [Examples](/examples/).

## API

<!-- API: generated from mtrl's types and <m-dialog>'s spec in a later step. Until then these
tables are hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title` | `string` | `undefined` | The headline, which names the dialog |
| `subtitle` | `string` | `undefined` | A line below the headline |
| `content` | `string` | `undefined` | The body, as HTML |
| `buttons` | `DialogButton[]` | `[]` | The actions, in order |
| `size` | `'small' \| 'medium' \| 'large' \| 'fullwidth' \| 'fullscreen'` | `'medium'` | The width; `fullscreen` fills the viewport |
| `animation` | `'scale' \| 'slide-up' \| 'slide-down' \| 'fade'` | `'scale'` | How it enters and leaves |
| `footerAlignment` | `'right' \| 'left' \| 'center' \| 'space-between'` | `'right'` | Where the actions sit |
| `divider` | `boolean` | `false` | Lines above and below the content |
| `closeButton` | `boolean` | `true` at `fullscreen`, else `false` | A close button in the header |
| `open` | `boolean` | `false` | Whether it starts open |
| `closeOnOverlayClick` | `boolean` | `true` | Whether a click on the scrim closes it |
| `closeOnEscape` | `boolean` | `true` | Whether `Escape` closes it |
| `layer` | `'top'` | `undefined` | Shows it in the top layer, as a native `<dialog>` with `showModal()`; without it, it is in an overlay of its own in `container` |
| `container` | `HTMLElement` | `document.body` | Where it is mounted |
| `modal` | `boolean` | `true` | `false` leaves out `aria-modal`, and the page behind it keeps scrolling; outside the top layer it stays reachable too |
| `autofocus` | `boolean` | `true` | Focuses it when it opens |
| `trapFocus` | `boolean` | `true` | Keeps `Tab` inside it |
| `role` | `'alertdialog' \| 'dialog'` | by `size` | The role, `dialog` at `fullscreen` and `alertdialog` otherwise |
| `ariaLabel` | `string` | `undefined` | The name without a title |
| `animationDuration` | `number` | `500` to open, `150` to close | When `afteropen` and `afterclose` follow, in ms |
| `zIndex` | `number` | `undefined` | The overlay's z-index, outside the top layer |
| `on` | `{ [event]: handler }` | `undefined` | Event handlers registered at creation |
| `class` | `string` | `undefined` | Additional CSS classes |

#### A button

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `text` | `string` | required | The label |
| `variant` | `string` | `'text'` | The button's variant |
| `onClick` | `(event, dialog) => void \| boolean` | `undefined` | Its action; `false` keeps the dialog open |
| `closeDialog` | `boolean` | `true` | Whether it closes the dialog |
| `autofocus` | `boolean` | `false` | Focuses it when the dialog opens |
| `attributes` | `Record<string, unknown>` | `undefined` | More of the [button's options](/docs/components/button/) |
| `size` | `string` | `undefined` | The button's size |

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `open()` / `close()` / `toggle(open?)` | `open?: boolean` | `DialogComponent` | Opens or closes it |
| `isOpen()` | none | `boolean` | Whether it is open |
| `setTitle(title)` / `getTitle()` | `title: string` | `DialogComponent` / `string` | The headline |
| `setSubtitle(subtitle)` / `getSubtitle()` | `subtitle: string` | `DialogComponent` / `string` | The subtitle |
| `setContent(content)` / `getContent()` | `content: string` | `DialogComponent` / `string` | The body, as HTML |
| `addButton(button)` / `removeButton(indexOrText)` | `button: DialogButton`, `indexOrText: number \| string` | `DialogComponent` | Adds or removes an action |
| `getButtons()` | none | `DialogButton[]` | The actions |
| `setSize(size)` / `setFooterAlignment(alignment)` | `size: DialogSize`, `alignment: DialogFooterAlignment` | `DialogComponent` | The width, where the actions sit |
| `toggleDivider(show)` / `hasDivider()` | `show: boolean` | `DialogComponent` / `boolean` | The lines around the content |
| `getHeaderElement()` / `getContentElement()` / `getFooterElement()` | none | `HTMLElement \| null` | Its regions |
| `confirm(options)` | `{ message, title?, confirmText?, cancelText?, confirmVariant?, cancelVariant?, size? }` | `Promise<boolean>` | Replaces the content and actions with a question, opens it, and resolves to the button pressed: `true` for the confirming one, which comes last, `false` for the other. Closed any other way (`Escape`, the scrim, `close()`), it resolves `false`. The message is text |
| `on(event, handler)` / `off(event, handler)` | `event: string, handler: Function` | `DialogComponent` | Adds or removes a listener |
| `destroy()` | none | `void` | Removes it |

| Property | Type | Description |
|----------|------|-------------|
| `element` | `HTMLElement` | The dialog |
| `overlay` | `HTMLElement` | The scrim it sits in, outside the top layer |

### Events

| Event | Description | Data |
|-------|-------------|------|
| `beforeopen` / `beforeclose` | It is about to open or close; `preventDefault()` stops it | `{ dialog, preventDefault, defaultPrevented }` |
| `open` / `close` | Emitted inside `open()` and `close()`, once the dialog is open or closed. The animation finishing is `afteropen` / `afterclose` | `{ dialog }` |
| `afteropen` / `afterclose` | Its animation is over | `{ dialog }` |

The web component dispatches `open` and `close`, without a detail, and `cancel` when `Escape`
asks it to close, which `preventDefault()` refuses.

## Accessibility

- An `alertdialog`, or a `dialog` at `fullscreen`, with `aria-modal`. The role follows M3: "On
  web, basic dialogs should have the alert dialog role" ([M3 dialogs
  accessibility](https://m3.material.io/components/dialogs/accessibility)). A full-screen dialog
  holds a task rather than a prompt, so it is a plain `dialog`; `role` overrides either. The title
  names it (`aria-labelledby`), or `ariaLabel` without one, and shows no tooltip; the content
  describes it.
- Opening it focuses its first focusable element, or the dialog; closing it gives focus back.
  `Tab` stays inside it, and the page behind it is inert.
- `Escape` and a click on the scrim close it, unless turned off. The close button is named
  "Close dialog".
- Its motion is reduced to a fade under `prefers-reduced-motion`.

## Styling

```css
.mtrl-dialog, .mtrl-dialog--visible { }
.mtrl-dialog--small, .mtrl-dialog--large, .mtrl-dialog--fullwidth, .mtrl-dialog--fullscreen { }
.mtrl-dialog--slide-up, .mtrl-dialog--slide-down, .mtrl-dialog--fade { }
.mtrl-dialog__overlay { }                 /* the scrim, outside the top layer */
.mtrl-dialog__header, .mtrl-dialog__header-title, .mtrl-dialog__header-subtitle { }
.mtrl-dialog__header-close, .mtrl-dialog__content, .mtrl-dialog__footer { }
.mtrl-dialog__footer--left, .mtrl-dialog__footer--center, .mtrl-dialog__footer--space-between { }
.mtrl-dialog__header-divider, .mtrl-dialog__footer-divider { }
```

## Measurements

| Attribute | Value |
|-----------|-------|
| Container | `surface-container-high`, 28dp corners, elevation 3 |
| Width | 280dp to 560dp; `small` 360dp at most |
| Scrim | `scrim` at 32% |
| Headline | Headline Small, `on-surface` |
| Supporting text | Body Medium, `on-surface-variant` |
| Padding | 24dp; 16dp between the headline and the content |
| Actions | 8dp apart |
| Full screen | No corners; 56dp header, Title Large |
