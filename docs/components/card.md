# Card

A card groups the content and actions about one subject on one surface: a title, media,
supporting text and buttons. Use cards when each item needs its own title, media and
controls, and should read as a separate object. M3 has three: **elevated**, **filled** and
**outlined**. See the [M3 card guidelines](https://m3.material.io/components/cards/overview).

## Usage

The card places its sections in M3 order: media, header, content, then actions.

```example
card:
  header: { title: The Kiss, subtitle: 'Gustav Klimt, 1908' }
  content: { text: 'A couple embracing, wrapped in gold leaf and ornament.' }
  buttons:
    - { text: Details, variant: text }
```

## Examples

### Media

`media` puts an image at the top, clipped to the card's shape. Its `alt` is required when the
image carries meaning, and `''` when it does not. In the factory, `aspectRatio` (`'16:9'`,
`'4:3'`, `'1:1'`) sets its crop, and `contain: true` fits it whole.

```example
card:
  variant: filled
  media: { src: /assets/playground/landscape-1.svg, alt: A mountain landscape }
  header: { title: Highlands, subtitle: Three days on foot }
```

### Clickable

`clickable` makes the whole card a button: it is in the tab order, `Enter` and `Space` click
it, and a press shows the ripple. Keep other controls out of a clickable card.

```example
card:
  variant: outlined
  clickable: true
  header: { title: Unsaved changes }
  content: { text: Your edits have not been published yet. }
```

A card has no width of its own: it fills the column, grid cell or flex track it is in, as the
M3 specs describe. The `--small`, `--medium` and `--large` classes fix it at 344, 480 and
624dp. The factory's content helpers, `createCardHeader()`, `createCardContent()`,
`createCardMedia()` and `createCardActions()`, build sections for `setHeader()`,
`addContent()`, `addMedia()` and `setActions()`. The web component takes its sections in
slots: `media`, `avatar`, `headline`, `subhead`, `header-action`, the content, and `actions`.

## API

<!-- API: generated from mtrl's types and <m-card>'s spec in a later step. Until then these
tables are hand-written: keep them in line with the code, and add no prose restating them. -->

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `variant` | `'elevated' \| 'filled' \| 'outlined'` | `'elevated'` | Card variant |
| `clickable` | `boolean` | `false` | A button: ripple, `Enter` and `Space`, and the `click` event |
| `interactive` | `boolean` | `false` | The `button` role, a tab stop and hover elevation, without key handling |
| `fullWidth` | `boolean` | `false` | `width: 100%` |
| `draggable` | `boolean` | `false` | HTML drag, with elevation while dragged and `dragstart` / `dragend` |
| `header` | `CardHeaderConfig` | `undefined` | `{ title, subtitle, avatar, action, class }` |
| `content` | `CardContentConfig` | `undefined` | `{ text, html, children, padding, class }`; `html` wins over `text`, `padding` is on by default |
| `media` | `CardMediaConfig` | `undefined` | `{ src, alt, element, aspectRatio, contain, position, class }`; `position` is `'top'` or `'bottom'` |
| `actions` | `CardActionsConfig` | `undefined` | `{ actions, align, fullBleed, vertical, class }`; `align` is `'start'`, `'center'`, `'end'` or `'space-between'` |
| `buttons` | `ButtonConfig[]` | `undefined` | An actions row of buttons, added a microtask after creation |
| `aria` | `CardAriaAttributes` | `undefined` | `{ role, label, labelledby, describedby }`, each written as an `aria-` attribute; `role` defaults to `region`, or `button` when interactive |
| `class` | `string` | `undefined` | Additional CSS classes |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |

`headerConfig`, `contentConfig`, `mediaConfig` and `actionsConfig` are the long forms of
`header`, `content`, `media` and `actions`.

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `setHeader(element)` | `CardComponent` | Replaces the header; after the media when there is some, otherwise first |
| `addContent(element)` | `CardComponent` | Appends a content section; one without the `mtrl-card-content` class is ignored |
| `addMedia(element, position?)` | `CardComponent` | Inserts media at the top (default) or the bottom |
| `setActions(element)` | `CardComponent` | Replaces the actions row, last |
| `makeDraggable(onDragStart?)` | `CardComponent` | Makes the card draggable, keeping `aria-grabbed` in step |
| `focus()` | `CardComponent` | Focuses the card |
| `destroy()` | `void` | Removes the card and its listeners |

| Helper | Returns | Description |
|--------|---------|-------------|
| `createCardHeader(config)` | `HTMLElement` | A header from `CardHeaderConfig` |
| `createCardContent(config)` | `HTMLElement` | A content section from `CardContentConfig` |
| `createCardMedia(config)` | `HTMLElement` | Media from `CardMediaConfig` |
| `createCardActions(config)` | `HTMLElement` | An actions row from `CardActionsConfig` |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `click` | the DOM event | A clickable card was clicked, or activated with `Enter` or `Space` |
| `dragstart` / `dragend` | `{ event }` | A draggable card's drag began or ended |

The web component's activation is the native `click`.

## Accessibility

- The card is a `region`, or a `button` with a tab stop when it is clickable or interactive.
  `aria.label` or `aria.labelledby` names it; the web component is named by its headline.
- Only a clickable card answers `Enter` and `Space`: an `interactive` card alone takes focus
  and cannot be operated from the keyboard.
- `makeDraggable()` keeps `aria-grabbed` in step during a drag; `draggable: true` does not set
  it.
- A clickable card is one control: buttons inside it are not reachable as their own.

## Styling

The elevation follows the variant, and rises while the card is hovered or dragged.

```css
.mtrl-card { }
.mtrl-card--elevated, .mtrl-card--filled, .mtrl-card--outlined { }
.mtrl-card--interactive, .mtrl-card--focused, .mtrl-card--dragging, .mtrl-card--full-width { }
.mtrl-card--small, .mtrl-card--medium, .mtrl-card--large { }
.mtrl-card__header, .mtrl-card__header-text, .mtrl-card__header-title, .mtrl-card__header-subtitle { }
.mtrl-card__header-avatar, .mtrl-card__header-action { }
.mtrl-card__media, .mtrl-card__content, .mtrl-card__actions { }
```

## Measurements

| Attribute | Value | Token |
|-----------|-------|-------|
| Container corner | 12dp | `ContainerShape` (CornerMedium), all three variants |
| Elevated container | `surface-container-low` | `ElevatedCardTokens.ContainerColor` |
| Filled container | `surface-container-highest` | `FilledCardTokens.ContainerColor` |
| Outlined container | `surface` | `OutlinedCardTokens.ContainerColor` |
| Outline | 1dp `outline-variant`; `on-surface` focused | `OutlinedCardTokens.OutlineColor` / `OutlineWidth` / `FocusOutlineColor` |
| Elevated elevation | Level 1, level 2 hovered | `ContainerElevation` / `HoverContainerElevation` |
| Filled and outlined elevation | Level 0, level 1 hovered | `HoverContainerElevation` |
| Dragged elevation | Level 4 elevated, level 3 otherwise | `DraggedContainerElevation` |
