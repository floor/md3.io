---
created: 2026-09-21
updated: 2026-09-30
status: published
---

# Snackbar

A snackbar tells people about something the app has done, at the bottom of the screen: a
message archived, a photo saved. It doesn't take focus or ask for anything, and has one action
at most, such as Undo. For a decision, use a [dialog](/docs/components/dialog/). See the
[M3 snackbar guidelines](https://m3.material.io/components/snackbar/overview).

## Usage

`show()` puts it in a queue shared by every snackbar on the page: one shows at a time, the
others wait their turn. Without an action it goes after 4 seconds.

```example
snackbar:
  message: Photo saved
  action tell:
    open
```

## Examples

### Undo

A snackbar with an action stays until it is acted on or dismissed, so there is time to reach
it. The action closes it.

```example
snackbar:
  message: Message archived
  action: Undo
  on action: undoArchive()
  action archive:
    open
```

### A close button, and how long it stays

`dismissible` adds a close button. `duration` is `short` (4s), `long` (10s), `indefinite`, or
milliseconds.

```example
snackbar:
  message: Update available
  dismissible: true
  duration: long
  action tell:
    open
```

### Replacing the one on screen

When only the newest message matters, `queueBehavior: 'replace'` closes the snackbar on screen
and drops the waiting ones.

```example
snackbar:
  message: Upload complete
  queueBehavior: replace
  action tell:
    open
```

`position` places it at the `start`, `center` or `end` of the bottom edge. `layer: 'top'`
shows it in the browser's top layer; while a modal dialog is open, it moves inside the dialog,
so it can still be read and used. The web component always is in the top layer.
`clearSnackbars()` closes the one on screen and drops the queue, for when what they were about
goes away.

## API

<!-- API: generated from mtrl's types and <m-snackbar>'s spec in a later step. Until then these
tables are hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `message` | `string` | required | The text, up to two lines |
| `action` | `string` | `undefined` | The action's label |
| `dismissible` | `boolean` | `false` | A close button |
| `closeLabel` | `string` | `'Dismiss'` | The close button's accessible name |
| `duration` | `'short' \| 'long' \| 'indefinite' \| number` | `'indefinite'` with an action, else `'short'` | How long it stays: 4s, 10s, until closed, or milliseconds (`0` is indefinite) |
| `position` | `'center' \| 'start' \| 'end'` | `'center'` | Where along the bottom edge |
| `queueBehavior` | `'queue' \| 'replace'` | `'queue'` | Whether it waits its turn or replaces the queue |
| `layer` | `'top'` | `undefined` | Shows it in the top layer, inside the topmost modal dialog while one is open |
| `onAction` / `onOpen` / `onClose` | `(event: SnackbarEvent) => void` | `undefined` | Handlers for `action`, `open` and `close` |
| `on` | `{ open?, close?, action?, dismiss? }` | `undefined` | Event handlers registered at creation |
| `class` | `string` | `undefined` | Additional CSS classes |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `show()` / `hide()` | none | `SnackbarComponent` | Queues it to show, or closes it with reason `api` |
| `isOpen()` | none | `boolean` | Whether it is on screen |
| `getMessage()` / `setMessage(message)` | `message: string` | `string` / `SnackbarComponent` | The text |
| `getAction()` / `setAction(text)` | `text: string` | `string` / `SnackbarComponent` | The action's label |
| `getDuration()` / `setDuration(duration)` | `duration: SnackbarDuration` | `number` / `SnackbarComponent` | How long it stays, read in milliseconds; a change on screen starts the count again |
| `getPosition()` / `setPosition(position)` | `position: 'center' \| 'start' \| 'end'` | `string` / `SnackbarComponent` | Where it sits |
| `on(event, handler)` / `off(event, handler)` | `event: string, handler: Function` | `SnackbarComponent` | Adds or removes a listener |
| `destroy()` | none | `void` | Removes it |

| Property | Type | Description |
|----------|------|-------------|
| `element` | `HTMLElement` | The snackbar |
| `state` | `'visible' \| 'queued' \| 'hidden'` | `queued` between `show()` and its turn on screen, `visible` while it is on screen |
| `actionButton` / `closeButton` | `HTMLElement \| undefined` | Its buttons |

`clearSnackbars()`, from `material`, closes the snackbar on screen and drops the waiting ones.

### Events

| Event | Description | Data |
|-------|-------------|------|
| `open` | It is on screen | `{ snackbar, originalEvent }` |
| `action` | The action was used | `{ snackbar, originalEvent }` |
| `close` / `dismiss` | It closed | `{ snackbar, reason, originalEvent }` |

`reason` is `timeout`, `action`, `close-button`, `escape`, `api` or `queue` (replaced or
cleared). The web component dispatches `open`, `action` and `close`; its `close` carries
`{ reason }`, and its `open` property is true from `show()` on, while it waits too.

## Accessibility

- A `status` live region: its message is announced politely, and focus is not moved to it.
- `Escape` closes it while focus is inside it. If focus was inside when it closed, it goes back
  where it came from.
- Its countdown pauses while the pointer is over it or focus is inside it. With an action, it
  stays until it is used or dismissed.
- The close button is named by `closeLabel`.

## Styling

Its colors are the inverse roles, so it reads as a surface of the opposite theme.

```css
.mtrl-snackbar, .mtrl-snackbar--visible { }
.mtrl-snackbar--center, .mtrl-snackbar--start, .mtrl-snackbar--end { }
.mtrl-snackbar--with-action, .mtrl-snackbar--dismissible { }
.mtrl-snackbar--action-below { }   /* an action wider than 128dp, on its own line */
.mtrl-snackbar__text, .mtrl-snackbar__action, .mtrl-snackbar__close { }
```

## Measurements

| Attribute | Value |
|-----------|-------|
| Container | `inverse-surface`, 4dp corners, elevation 3 |
| Height | 48dp, 68dp for two lines |
| Text | Body Medium, `inverse-on-surface`, two lines at most |
| Action | `inverse-primary`; below the text when wider than 128dp |
| Padding | 16dp at the start, 8dp between the text and the action |
| Motion | Fades on the fast effects spring, and scales from 0.8 on the fast spatial one |
