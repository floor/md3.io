# Snackbar Component

A snackbar reports something that has already happened — a message archived, a photo saved, an upload finished — at the bottom of the screen, without taking focus and without asking for anything. It may carry one action, which is almost always the undo. Reach for it when the user should know, but does not need to decide. When they do need to decide, that is a [dialog](dialog.md).

## Overview

Snackbars are announced politely and never focused, so a screen reader user hears the message after whatever they are doing rather than being pulled out of it. Only one is on screen at a time: the component keeps a single process-wide queue, and a snackbar shown while another is up waits its turn.

Two rules follow from the specification and shape most of the API:

- A snackbar **with an action stays** until it is acted on or dismissed. Something that can be undone must not disappear before the user reaches it.
- A snackbar **without an action goes** after four seconds. The countdown holds while the pointer is over it or focus is inside it, so it does not vanish mid-read.

## Import

```javascript
import { createSnackbar, clearSnackbars } from 'mtrl';
```

## Basic Usage

```javascript
const snackbar = createSnackbar({ message: 'Photo saved to album' });
snackbar.show();
```

`message` is required; without it the factory throws. The element mounts itself on `show()` and takes itself off the page when it has faded, so there is nothing to append.

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `message` | `string` | — | The text; required, up to two lines |
| `action` | `string` | `undefined` | Label of the single text-button action |
| `dismissible` | `boolean` | `false` | Adds a close icon button |
| `closeLabel` | `string` | `'Dismiss'` | Accessible name of the close icon |
| `duration` | `'short' \| 'long' \| 'indefinite' \| number` | `'short'`, or `'indefinite'` with an action | How long it stays; a number is milliseconds, `0` is indefinite |
| `position` | `'center' \| 'start' \| 'end'` | `'center'` | Where it sits along the bottom edge |
| `queueBehavior` | `'queue' \| 'replace'` | `'queue'` | Whether it waits its turn or evicts what is on screen |
| `onAction` | `(event: SnackbarEvent) => void` | `undefined` | Called when the action is activated |
| `onOpen` | `(event: SnackbarEvent) => void` | `undefined` | Called when it appears |
| `onClose` | `(event: SnackbarEvent) => void` | `undefined` | Called when it leaves |
| `on` | `Record<SnackbarEventType, handler>` | `undefined` | Handlers registered at creation |
| `class` | `string` | `undefined` | Extra CSS classes |
| `prefix` | `string` | `'mtrl'` | Class-name prefix |
| `componentName` | `string` | `'snackbar'` | Component name used in class generation |

The presets are `short` (4 s), `long` (10 s) and `indefinite` (stays). Passing `duration: 'short'` alongside an `action` is allowed and does what it says — it is a deliberate override of the default, not an oversight.

## Component API

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `show()` | — | `SnackbarComponent` | Puts it in the queue and shows it when its turn comes |
| `hide()` | — | `SnackbarComponent` | Dismisses it, with reason `api` |
| `setMessage(text)` | `text: string` | `SnackbarComponent` | Replaces the message |
| `getMessage()` | — | `string` | The current message |
| `setAction(text)` | `text: string` | `SnackbarComponent` | Relabels the action |
| `getAction()` | — | `string` | The current action label |
| `setDuration(duration)` | `SnackbarDuration` | `SnackbarComponent` | Sets the duration; restarts the countdown if on screen |
| `getDuration()` | — | `number` | Milliseconds, `0` for indefinite |
| `setPosition(position)` | `SnackbarPosition` | `SnackbarComponent` | Moves it along the bottom edge |
| `getPosition()` | — | `SnackbarPosition` | The current position |
| `on(event, handler)` | `SnackbarEventType, handler` | `SnackbarComponent` | Adds a listener |
| `off(event, handler)` | `SnackbarEventType, handler` | `SnackbarComponent` | Removes one |
| `destroy()` | — | `void` | Removes it and releases the timer and buttons |

| Property | Type | Description |
|----------|------|-------------|
| `element` | `HTMLElement` | The snackbar surface |
| `state` | `'visible' \| 'hidden'` | Where it is in its life |
| `actionButton` | `HTMLElement` | The action button, when there is one |
| `closeButton` | `HTMLElement` | The close icon button, when there is one |
| `timer` | `SnackbarTimer` | The auto-dismiss countdown |

| Function | Returns | Description |
|----------|---------|-------------|
| `clearSnackbars()` | `void` | Dismisses the snackbar on screen and drops the ones waiting |

`clearSnackbars` exists because messages belong to whatever raised them. A drawer that closes or an account that signs out should not leave a message about it on screen — and, since the queue shows one at a time, a stale message blocks the next one behind it.

## Events

Every handler receives a `SnackbarEvent`: `{ snackbar, reason?, originalEvent }`.

| Event | Payload | Description |
|-------|---------|-------------|
| `open` | `SnackbarEvent` | It is on screen |
| `action` | `SnackbarEvent` | The action was activated |
| `close` | `SnackbarEvent` | It is leaving; `reason` says why |
| `dismiss` | `SnackbarEvent` | Fires with `close`; this is what the queue listens to |

`reason` is one of `timeout`, `action`, `close-button`, `escape`, `api` or `queue` — the last meaning the queue replaced or cleared it.

```javascript
createSnackbar({ message: 'Message archived', action: 'Undo' })
  .on('close', ({ reason }) => console.info(`snackbar closed: ${reason}`))
  .show();
```

## Examples

### Undo

The pattern the action exists for. The snackbar stays until the user takes it or dismisses it, and activating the action dismisses it for you.

```javascript
createSnackbar({
  message: 'Message archived',
  action: 'Undo',
  onAction: () => restore(message)
}).show();
```

### A close icon, and how long it stays

```javascript
// Goes on its own after 4 s
createSnackbar({ message: 'Photo saved to album' }).show();

// 10 s
createSnackbar({ message: 'Photo saved to album', duration: 'long' }).show();

// Exactly 2 s
createSnackbar({ message: 'Copied to clipboard', duration: 2000 }).show();

// Stays until the close icon is used
createSnackbar({ message: 'Update available', dismissible: true }).show();
```

### Several in a row, and replacing them

Three snackbars shown at once appear one after another, in order. When only the newest message matters — a progress report, a counter — `queueBehavior: 'replace'` dismisses the current one, drops the backlog, and shows this one straight away.

```javascript
['First message', 'Second message', 'Third message'].forEach((message) =>
  createSnackbar({ message, duration: 1500 }).show()
);

createSnackbar({ message: 'Uploading 1 of 3', duration: 'long' }).show();
createSnackbar({ message: 'Uploading 2 of 3', duration: 'long' }).show();
createSnackbar({ message: 'Upload complete', queueBehavior: 'replace', action: 'View' }).show();
```

### Position

Centred by default. In a wide layout a snackbar can sit at the leading or trailing edge instead; in a compact window every position collapses to the same fixed inset from each edge.

```javascript
createSnackbar({ message: 'Snackbar at the start', position: 'start', action: 'OK' }).show();
```

## Accessibility

- The container is `role="status"`: a polite, atomic live region. The message is announced when it appears, after whatever the user is doing, and focus is never moved.
- Focus is not taken on open. If focus happens to be inside the snackbar when it closes — it can only get there by Tab — it is returned to where it came from.
- Escape dismisses the snackbar when focus is inside it. The keydown is stopped there, so it does not also close whatever is behind.
- The countdown pauses on `pointerenter` and `focusin` and resumes on the way out, which is the web's answer to the extended timeout Compose gets from the accessibility manager (WCAG 2.2.1).
- An actionable snackbar defaults to indefinite for the same reason: a timed undo is a timed decision.
- The close icon is labelled from `closeLabel`, default `Dismiss`.
- The action's focus ring is drawn in `inverse-primary` rather than the button's usual colour, because secondary does not reach 3:1 against `inverse-surface` (WCAG 2.4.13).

## Styling

```css
.mtrl-snackbar { /* the surface */ }
.mtrl-snackbar--visible { /* while on screen */ }
.mtrl-snackbar--center,
.mtrl-snackbar--start,
.mtrl-snackbar--end { /* positions */ }
.mtrl-snackbar--with-action { /* an action is present */ }
.mtrl-snackbar--dismissible { /* a close icon is present */ }
.mtrl-snackbar--action-below { /* the action is too wide to sit beside the text */ }

.mtrl-snackbar-text { /* the message, clamped to two lines */ }
.mtrl-snackbar-action { /* the text button */ }
.mtrl-snackbar-close { /* the icon button */ }
```

Colours come from the inverse roles, so a snackbar reads as a surface from the opposite theme and does not need its own palette.

## Measurements

Each row cites what `src/styles/components/_snackbar.scss` names for it; the file's own header attributes them to the Compose `SnackbarTokens.kt` and `Snackbar.kt`.

| Attribute | Value | Token |
|-----------|-------|-------|
| Container colour | inverse-surface | `inverse-surface` |
| Text colour | inverse-on-surface | `inverse-on-surface` |
| Container elevation | level 3 | `elevation(3)` |
| Container corner | extra small | `get-shape('extra-small')` |
| Height, one line | 48dp | `min-height` |
| Text typography | body-medium | `typography('body-medium')` |
| Action colour | inverse-primary | `inverse-primary` |
| Close icon colour | inverse-on-surface | `inverse-on-surface` |
| Action moves below the text past | 128dp | `ACTION_INLINE_MAX_WIDTH` (`design_snackbar_action_inline_max_width`) |
| Enter/exit | fade on fast effects, scale from 0.8 on fast spatial | `motion('spring-fast-effects-*')`, `motion('spring-fast-spatial-*')` |
| Short duration | 4000 ms | `SNACKBAR_DURATION_MS.short` |
| Long duration | 10000 ms | `SNACKBAR_DURATION_MS.long` |

Spacing follows the same source: 16dp at the start, 8dp between the text and the action, 8dp after the action and none after the close icon, with 14dp above and below the text — which is what makes two lines come to 68dp. The vertical spacing is margin rather than padding, because the two-line clamp cuts at the padding box and a third line would otherwise show through.

The 16dp inset from the window edges is the one number with no token behind it: the Android snackbar keeps 8dp and the Compose host 12dp, so the component picks one and says so rather than claiming a source it does not have.

## Best Practices

- One line if you can, two at most. A snackbar is not a place to explain.
- One action, and make it the undo. Anything else is usually a dialog or a link in the page.
- Never put information in a snackbar that is only available there — it leaves on its own.
- Reach for `replace` when the messages supersede each other, and `queue` when each one is worth reading.
- Call `clearSnackbars()` when the surface a message referred to goes away.

## TypeScript Support

```typescript
import { createSnackbar, SnackbarConfig, SnackbarComponent } from 'mtrl';

const config: SnackbarConfig = {
  message: 'Message archived',
  action: 'Undo',
  position: 'start'
};

const snackbar: SnackbarComponent = createSnackbar(config);
snackbar.on('close', ({ reason }) => {
  if (reason === 'timeout') commitArchive();
});
snackbar.show();
```
