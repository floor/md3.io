# Badge Component

A badge is a small marker that sits on the corner of something else and says there is something new there. Reach for one to carry an unread count, flag a change, or draw the eye to a control that needs attention. It comes in two sizes: a 6dp dot that only says "something", and a 16dp pill that can hold up to four characters, which is enough for a count or a very short word. A badge never takes focus and is never the thing a user clicks — it decorates whatever it is attached to, and the target stays the control.

## Import

```javascript
import { createBadge } from 'mtrl';
```

## Basic Usage

```javascript
const unread = createBadge({
  label: 5,
  color: 'error',
  target: document.querySelector('.notification-icon')
});

function setUnread(count) {
  unread.setLabel(count);
}
```

Passing a `target` wraps that element in a positioning container and drops the badge into its corner. Leave `target` out and the badge is a plain element you place yourself, through `badge.element`.

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `variant` | `'small' \| 'large'` | `'large'` | A 6dp dot, or a 16dp pill that can hold text |
| `label` | `string \| number` | `''` | What the badge shows; ignored by the `small` variant |
| `max` | `number` | `undefined` | Above this, the label becomes `"{max}+"` |
| `color` | `'error' \| 'primary' \| 'secondary' \| 'tertiary' \| 'success' \| 'warning' \| 'info'` | `'error'` | Which theme colour the badge takes |
| `position` | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'` | `'top-right'` | Which corner of the target it sits on |
| `visible` | `boolean` | `true` | Whether the badge starts visible |
| `target` | `HTMLElement` | `undefined` | The element to attach to |
| `class` | `string` | `undefined` | Additional CSS classes |

`position` is only meaningful with a target; a standalone badge is placed by whatever lays it out.

## Component API

### Content

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setLabel(label)` | `label: string \| number` | `BadgeComponent` | Sets the label, applying `max` and the four-character limit, and shows or hides the badge to match |
| `getLabel()` | none | `string` | The label as it is displayed, after formatting |
| `setContent(content)` | `content: string \| number` | `BadgeComponent` | Alias for `setLabel` |
| `getContent()` | none | `string` | Alias for `getLabel` |
| `setMax(max)` | `max: number` | `BadgeComponent` | Sets the overflow threshold and reformats the current label |

### Visibility

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `show()` | none | `BadgeComponent` | Shows the badge |
| `hide()` | none | `BadgeComponent` | Hides it |
| `toggle(visible?)` | `visible?: boolean` | `BadgeComponent` | Flips visibility, or forces it when given an argument |
| `isVisible()` | none | `boolean` | Whether it is visible |

### Appearance

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setColor(color)` | `color: string` | `BadgeComponent` | Swaps the colour |
| `setVariant(variant)` | `variant: string` | `BadgeComponent` | Swaps between `small` and `large`, and rewrites the ARIA attributes to match |
| `setPosition(position)` | `position: string` | `BadgeComponent` | Moves it to another corner |

### Attachment, styles and lifecycle

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `attachTo(target)` | `target: HTMLElement` | `BadgeComponent` | Wraps a target and puts the badge on its corner |
| `detach()` | none | `BadgeComponent` | Removes the badge from its wrapper; the element is moved to `document.body`, so place it yourself afterwards |
| `addClass(...classes)` | `classes: string[]` | `BadgeComponent` | Adds CSS classes |
| `removeClass(...classes)` | `classes: string[]` | `BadgeComponent` | Removes CSS classes |
| `on(event, handler)` | `event: string`, `handler: Function` | `BadgeComponent` | Accepted but inert — see Events |
| `off(event, handler)` | `event: string`, `handler: Function` | `BadgeComponent` | Removes one from the same inert registry |
| `destroy()` | none | `void` | Takes it off the page and releases its listeners |

| Property | Type | Description |
|----------|------|-------------|
| `element` | `HTMLElement` | The badge's own element |
| `wrapper` | `HTMLElement` | The container holding the target and the badge, once attached |

## Events

The badge emits no events of its own, and `on()`/`off()` do **not** attach DOM listeners. They subscribe to an internal emitter that the badge never publishes to and that no DOM event is forwarded into, so a handler passed to `badge.on()` is never called. The methods are there for API symmetry with the other components; treat them as inert.

If you genuinely need a listener on the badge, add it to the element yourself:

```javascript
badge.element.addEventListener('mouseenter', showDetail);
```

A badge is decoration, though, and should not be the thing a user has to hit — put the interaction on the target underneath.

## Examples

### A dot, for when the count does not matter

```javascript
const hasUpdates = createBadge({
  variant: 'small',
  color: 'primary',
  target: document.querySelector('#settings-icon')
});
```

### A count that stops at 99

```javascript
const messages = createBadge({
  label: 125,
  max: 99,
  color: 'error',
  target: document.querySelector('#messages-icon')
});
// shows "99+"
```

Labels are capped at four characters including the `+`. The cap is applied to the *formatted string*, not to the number, so `1250` with no `max` still shows as `"1250"` — four characters, nothing to trim. Only a number that formats to more than four characters is rewritten, and then as `"999+"`: `12500` becomes `"999+"`. A non-numeric label that is too long is truncated to four characters. Set a `max` that fits rather than letting the formatter choose.

### Following a value that can reach zero

```javascript
const cart = createBadge({
  label: 0, // note: renders a visible "0" at creation; see below
  color: 'primary',
  target: document.querySelector('#cart-icon')
});

function onCartChanged(count) {
  cart.setLabel(count); // hides itself at 0, shows itself again above it
}
```

`setLabel()` manages visibility on its own: an empty label or `0` hides the badge, anything else shows it. Call `hide()` and `show()` directly only when you want the badge gone for a reason the label does not express.

The constructor does not do this. A badge created with `label: 0` renders a visible `"0"`, because only `setLabel()` carries the zero rule. Start such a badge at `visible: false`, or call `setLabel(count)` once after creating it.

### Moving a badge between targets

```javascript
const marker = createBadge({ variant: 'small', color: 'primary' });

marker.attachTo(document.getElementById('step-1'));
// later
marker.detach();
marker.attachTo(document.getElementById('step-2'));
```

## Accessibility

- A large badge carries `role="status"`, so a screen reader announces its text when it changes. This is set at creation, from the variant
- A dot has no text to announce. Its meaning has to come from the control it decorates, so give that control a label that includes the state — "Notifications, 3 unread" rather than "Notifications". A small badge is marked `aria-hidden="true"` either way, whether it was created as `small` or switched to it by `setVariant()`, so it is skipped entirely and cannot be relied on to say anything
- A badge is not focusable and takes no keyboard input. Everything interactive belongs to the target underneath
- The badge sits outside the target's box by a few pixels at every corner, which keeps it clear of the target's own content but means the wrapper needs a little room around it
- Hide a badge rather than showing a zero. `hide()` takes it out of the layout with `display: none`, so nothing is announced either, and `setLabel(0)` does the same on your behalf

## Styling

```css
/* The badge */
.mtrl-badge { /* ... */ }

/* Variants */
.mtrl-badge--small { /* ... */ }
.mtrl-badge--large { /* ... */ }

/* Colours */
.mtrl-badge--error { /* ... */ }      /* and --primary, --secondary, --tertiary,
                                         --success, --warning, --info */

/* Position; the corner class is always applied, --positioned only with a target */
.mtrl-badge--positioned { /* ... */ }
.mtrl-badge--top-right { /* ... */ }  /* and --top-left, --bottom-right, --bottom-left */

/* States */
.mtrl-badge--invisible { /* ... */ }  /* what hide() adds */
.mtrl-badge--overflow { /* ... */ }   /* when a numeric label went over max */

/* The wrapper created by a target or attachTo() */
.mtrl-badge-wrapper { /* ... */ }
```

Colours come from the theme's `error`, `primary`, `secondary` and `tertiary` roles and their `on-` pairs, so a badge follows whatever the theme says.

## Measurements

Every value below is read off the declaration it drives in `src/styles/components/_badge.scss`, which names no M3 token for any of them, so none is quoted here. The specification comment at the top of that file is **not** a reliable source: it gives the small badge's offset as 6dp and the large one's as 14 × 12dp, where the rules themselves use 3px and 8px, and it does not mention the overflow width at all. The rules are what ships.

| Attribute | Value | Source |
|-----------|-------|--------|
| Small badge diameter | 6dp | `_badge.scss` spec comment |
| Small badge corner radius | 3dp | `_badge.scss`, `&--small` |
| Small badge offset from the target's edge | 3dp | `_badge.scss`, `&--positioned.&--small` (the file's header comment says 6dp; the rule wins) |
| Large badge height | 16dp | `_badge.scss`, `&--large` |
| Large badge corner radius | 8dp | `_badge.scss`, `&--large` |
| Large badge offset from the target's edge | 8dp | `_badge.scss`, `&--positioned.&--large` (the file's header comment says 14 × 12dp; the rule wins) |
| Overflow badge maximum width | 34dp | `_badge.scss`, `&--overflow` |
| Maximum label length | 4 characters | `BADGE_MAX_CHARACTERS` in `constants.ts` |

## Best Practices

- Use the dot when the presence of news is the whole message, and the pill only when the number is worth reading
- Set `max` on anything user-generated. A count with no ceiling eventually pushes the badge past the 34dp it is allowed
- Hide the badge at zero rather than showing "0", which reads as a value rather than as nothing
- Keep the colour meaningful: `error` for something wrong or urgent, `primary` for a plain count, `success` and `warning` for status
- Attach the badge to the control, not to a wrapper you built yourself; `target` and `attachTo()` create the positioning context they need
