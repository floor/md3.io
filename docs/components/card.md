# Card Component

The Card component is a surface that groups the content and actions belonging to
one subject. Reach for it when a list of things each need their own title, media,
body text and controls, and when those groups should read as separate objects
rather than rows of a table. A card is not a layout primitive; if the content has
no single subject, a plain container is the better choice.

## Import

```javascript
import {
  createCard,
  createCardHeader,
  createCardContent,
  createCardMedia,
  createCardActions
} from 'mtrl';

import { CARD_VARIANTS } from 'mtrl/components/card/constants';
```

## Basic Usage

Everything can be declared inline. The card assembles the sections in Material
Design order: media, header, content, then actions.

```javascript
const card = createCard({
  variant: 'elevated',
  header: {
    title: 'The Kiss',
    subtitle: 'Gustav Klimt, 1908'
  },
  content: {
    text: 'A couple embracing, wrapped in gold leaf and ornament.'
  },
  buttons: [
    { text: 'Details', variant: 'text' }
  ]
});

document.querySelector('.gallery').appendChild(card.element);
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `variant` | `'elevated' \| 'filled' \| 'outlined'` | `'elevated'` | Card variant |
| `interactive` | `boolean` | `false` | Gives the card a `button` role and a tab stop, and raises elevation on hover. It does not add key handling, see Accessibility |
| `clickable` | `boolean` | `false` | Adds a ripple and forwards `click`; also makes the card interactive |
| `fullWidth` | `boolean` | `false` | Adds the `--full-width` modifier, which sets `width: 100%` |
| `draggable` | `boolean` | `false` | Sets up HTML5 drag with elevation feedback and `dragstart` / `dragend` events |
| `header` | `CardHeaderConfig` | `undefined` | Header built and inserted at creation |
| `content` | `CardContentConfig` | `undefined` | Content built and inserted at creation |
| `media` | `CardMediaConfig` | `undefined` | Media built and inserted at creation |
| `actions` | `CardActionsConfig` | `undefined` | Actions row built and inserted at creation |
| `buttons` | `ButtonConfig[]` | `undefined` | Shorthand for an actions row of buttons; loaded asynchronously |
| `aria` | `CardAriaAttributes` | `undefined` | ARIA attributes; each key is prefixed with `aria-` unless it already is |
| `class` | `string` | `undefined` | Additional CSS classes |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |

`headerConfig`, `contentConfig`, `mediaConfig` and `actionsConfig` are accepted as
the long form of the four inline options and behave identically.

### Header configuration

| Option | Type | Description |
|--------|------|-------------|
| `title` | `string` | Header title text |
| `subtitle` | `string` | Secondary line under the title |
| `avatar` | `HTMLElement \| string` | Leading avatar element or HTML |
| `action` | `HTMLElement \| string` | Trailing action element or HTML |
| `class` | `string` | Additional CSS classes |

### Content configuration

| Option | Type | Description |
|--------|------|-------------|
| `text` | `string` | Text content |
| `html` | `string` | HTML content; takes precedence over `text` |
| `children` | `HTMLElement[]` | Elements appended to the content area |
| `padding` | `boolean` | Whether to pad the content area, `true` by default |
| `class` | `string` | Additional CSS classes |

### Media configuration

| Option | Type | Description |
|--------|------|-------------|
| `src` | `string` | Image source URL |
| `alt` | `string` | Alt text; required whenever the image carries meaning |
| `element` | `HTMLElement` | Custom element used instead of an image |
| `aspectRatio` | `'16:9' \| '4:3' \| '1:1' \| string` | Aspect ratio modifier |
| `contain` | `boolean` | Use `object-fit: contain` instead of cover |
| `position` | `'top' \| 'bottom'` | Where the media sits relative to the content |
| `class` | `string` | Additional CSS classes |

### Actions configuration

| Option | Type | Description |
|--------|------|-------------|
| `actions` | `HTMLElement[]` | Elements placed in the actions row |
| `align` | `'start' \| 'center' \| 'end' \| 'space-between'` | Horizontal alignment |
| `fullBleed` | `boolean` | Let the actions run to the card edges |
| `vertical` | `boolean` | Stack the actions vertically |
| `class` | `string` | Additional CSS classes |

### ARIA configuration

| Option | Type | Description |
|--------|------|-------------|
| `role` | `string` | Defaults to `region`, or `button` when the card is interactive or clickable |
| `label` | `string` | Accessible name |
| `labelledby` | `string` | ID of the element naming the card |
| `describedby` | `string` | ID of the element describing the card |

## Component API

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `addContent(element)` | `element: HTMLElement` | `CardComponent` | Appends a content element. The element must carry the `mtrl-card-content` class or the call is ignored |
| `setHeader(element)` | `element: HTMLElement` | `CardComponent` | Replaces the header. Inserted after the last media element when media exists, otherwise first |
| `addMedia(element, position?)` | `element: HTMLElement, position?: 'top' \| 'bottom'` | `CardComponent` | Inserts media at the top (default) or appends it at the bottom |
| `setActions(element)` | `element: HTMLElement` | `CardComponent` | Replaces the actions row and appends it last |
| `makeDraggable(onDragStart?)` | `onDragStart?: (event: DragEvent) => void` | `CardComponent` | Sets `draggable` and keeps `aria-grabbed` in sync for the drag, with or without a callback |
| `focus()` | none | `CardComponent` | Moves focus to the card element |
| `destroy()` | none | `void` | Tears the card down and removes its listeners |

Each of the four setters checks the class of the element it is handed, so pass
elements built by the content helpers rather than bare `div`s.

### Content helpers

These build the section elements the API methods expect.

| Helper | Returns | Description |
|--------|---------|-------------|
| `createCardHeader(config)` | `HTMLElement` | Title, subtitle, avatar and trailing action |
| `createCardContent(config)` | `HTMLElement` | Padded content area from text, HTML or children |
| `createCardMedia(config)` | `HTMLElement` | Image or custom element with an aspect ratio modifier |
| `createCardActions(config)` | `HTMLElement` | Actions row with alignment and stacking modifiers |

### Optional features

Cards can be composed with three enhancers exported from the component. Each one
attaches a small API under its own key.

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `isLoading()` | none | `boolean` | Whether the loading overlay is showing, on `card.loading` |
| `setLoading(state)` | `state: boolean` | `void` | Shows or hides the loading overlay, on `card.loading` |
| `isExpanded()` | none | `boolean` | Whether the expandable region is open, on `card.expandable` |
| `setExpanded(state)` | `state: boolean` | `void` | Opens or closes the expandable region, on `card.expandable` |
| `toggleExpanded()` | none | `void` | Flips the expanded state, on `card.expandable` |
| `reset()` | none | `void` | Returns a swiped card to its resting position, on `card.swipeable` |

## Events

Events are only emitted when the matching option is set.

| Event | Payload | Description |
|-------|---------|-------------|
| `dragstart` | `{ event }` | A drag began on a card created with `draggable: true`; elevation rises to level 4 |
| `dragend` | `{ event }` | The drag finished and elevation returns to level 1 |

A card created with `clickable: true` forwards the DOM `click` event; interactive
cards also forward `mouseenter`, `mouseleave`, `keydown`, `focus` and `blur`.

## Examples

### Building the sections separately

This is what the Simple Cards section of the showcase does: create the card, then
hand it a header and content built by the helpers.

```javascript
const card = createCard({
  variant: CARD_VARIANTS.FILLED,
  aria: {
    role: 'region',
    label: 'Information about The Kiss'
  }
});

card.setHeader(createCardHeader({
  title: 'The Kiss',
  subtitle: 'Gustav Klimt'
}));

card.addContent(createCardContent({
  html: '<p>A couple embracing, wrapped in gold leaf.</p>',
  padding: true
}));
```

### Media with an aspect ratio

```javascript
const card = createCard({
  variant: CARD_VARIANTS.ELEVATED,
  interactive: true,
  aria: {
    label: 'Card showing American Gothic',
    describedby: 'gothic-description'
  }
});

card.addMedia(createCardMedia({
  src: '/art/american-gothic.jpg',
  alt: 'American Gothic by Grant Wood',
  aspectRatio: '4:3'
}));

card.setHeader(createCardHeader({
  title: 'American Gothic',
  subtitle: 'Grant Wood, 1930'
}));
```

Use `contain: true` for square media so the crop does not cut faces off.

### Actions

```javascript
const card = createCard({
  variant: 'outlined',
  header: { title: 'Unsaved changes' },
  content: { text: 'Your edits have not been published yet.' },
  actions: {
    actions: [discardButton.element, publishButton.element],
    align: 'end'
  }
});
```

The `buttons` shorthand does the same thing without building the buttons
yourself, at the cost of a dynamic import: the actions row appears one
microtask after `createCard` returns, so do not read it back synchronously.

## Accessibility

- The root element takes `role="region"`, or `role="button"` with `tabindex="0"`
  when `interactive` or `clickable` is set. Override the role through `aria.role`.
- Every key of the `aria` option becomes an `aria-*` attribute, so
  `aria: { label, describedby }` is the way to name and describe a card.
- Cards created with `clickable: true` activate on Enter and Space. `interactive`
  on its own gives the tab stop and the `button` role but no key handling, so an
  interactive-only card is reachable by keyboard and cannot be operated by one.
  Both add a `--focused` class on focus so the focus ring is visible.
- `makeDraggable()` keeps `aria-grabbed` in sync for the whole drag, whether or
  not a callback is passed. `draggable: true` in the config sets no
  `aria-grabbed` at all, so supply it yourself if you use that instead.
- Media alt text is yours to supply. `createCardMedia` will not invent one, and a
  decorative image should be given `alt: ''` explicitly.

## Styling

```css
.mtrl-card { }
.mtrl-card--elevated { }
.mtrl-card--filled { }
.mtrl-card--outlined { }
.mtrl-card--interactive { }
.mtrl-card--full-width { }
.mtrl-card--small { }
.mtrl-card--medium { }
.mtrl-card--large { }
.mtrl-card--focused { }
.mtrl-card--dragging { }

.mtrl-card-header { }
.mtrl-card-header-text { }
.mtrl-card-header-title { }
.mtrl-card-header-subtitle { }
.mtrl-card-header-avatar { }
.mtrl-card-header-action { }
.mtrl-card-media { }
.mtrl-card-content { }
.mtrl-card-actions { }
```

Every card sets `--card-elevation` on the element as an inline custom property
at creation: level 1 for `elevated`, level 0 otherwise. Interactive and draggable
cards rewrite it on hover and during a drag, so a theme that wants different
shadow behaviour should read that variable rather than fight the inline style.

## Width

A card has no width of its own. It fills the column, grid cell or flex track it
is placed in, which is what the M3 card specs describe and what makes cards
usable in a layout.

Three modifiers are there for the cases that genuinely want a fixed size:
`--small` at 344dp, `--medium` at 480dp and `--large` at 624dp, plus
`--full-width` for `width: 100%`.

Before 0.8.0 every card was hard-coded to 344px and had to opt out through
`--full-width` to sit in a grid. If you relied on that width, add `--small`.

## Measurements

Each value names the token it comes from, across the three card token sets.

| Attribute | Value | Token |
|-----------|-------|-------|
| Container corner | 12dp | `ContainerShape` (CornerMedium), all three variants |
| Elevated container | surface-container-low | `ElevatedCardTokens.ContainerColor` |
| Filled container | surface-container-highest | `FilledCardTokens.ContainerColor` |
| Outlined container | surface | `OutlinedCardTokens.ContainerColor` |
| Outline | 1dp outline-variant | `OutlinedCardTokens.OutlineColor` / `OutlineWidth` |
| Outline when focused | on-surface | `OutlinedCardTokens.FocusOutlineColor` |
| Elevated elevation | level 1, level 2 hovered | `ContainerElevation` / `HoverContainerElevation` |
| Filled elevation | level 0, level 1 hovered | `FilledCardTokens.HoverContainerElevation` |
| Outlined elevation | level 0, level 1 hovered | `OutlinedCardTokens.HoverContainerElevation` |
| Dragged elevation | level 4 elevated, level 3 otherwise | `DraggedContainerElevation` |
| Disabled filled container | surface-variant | `FilledCardTokens.DisabledContainerColor` |
| Disabled elevated container | surface, keeping level 1 | `ElevatedCardTokens.DisabledContainerColor` |
| Disabled outline | outline at 12% | `DisabledOutlineColor` / `DisabledOutlineOpacity` |
