# Loading Indicator Component

The Loading Indicator component is the Material Design 3 expressive indicator for short waits. Its active indicator loops through seven Material shapes, morphing from one to the next while it turns, drawn on a canvas at the device's pixel ratio. It comes in a default form for use on a surface and a contained form for use over other content, and it can show a value instead of looping.

## Overview

Loading indicators are for waits between 200 milliseconds and 5 seconds:

- Loading a page, a pane or a list
- Loading more items into a list that already has content
- Refreshing content
- A button whose action takes a moment to complete

For anything shorter, show the content directly. For anything longer, use a [progress indicator](progress.md) so the person can see how much is left. Do not turn a loading indicator into a progress indicator mid-wait.

The component follows the Material Design 3 loading indicator specification: a 48dp container with a 38dp active indicator, the indicator in `primary`, the contained variant on a `primary-container` circle with the indicator in `on-primary-container`, sizes from 24dp to 240dp, and the shape sequence, timing and spring of the Compose Material 3 implementation.

## Import

```javascript
import { createLoadingIndicator } from 'mtrl';
```

## Basic Usage

```javascript
// An indicator that animates from creation
const loading = createLoadingIndicator({
  ariaLabel: 'Loading articles'
});

document.querySelector('.article-list').appendChild(loading.element);

// When the content arrives
loading.destroy();
```

## Configuration

The Loading Indicator component accepts the following configuration options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `size` | `number` | `48` | Width and height in pixels, kept between 24 and 240 |
| `contained` | `boolean` | `false` | Draws the indicator on a `primary-container` circle, for use over other content |
| `value` | `number \| null` | `null` | A value from 0 to 1 makes the indicator determinate; `null` loops |
| `ariaLabel` | `string` | `'Loading'` | Accessible name: say what is loading |
| `class` | `string` | `undefined` | Additional CSS classes to add to the component |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |

## Component API

The Loading Indicator component provides the following methods:

### Value Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setValue` | `value: number \| null` | `LoadingIndicatorComponent` | Sets a value from 0 to 1 (determinate) or `null` (indeterminate) |
| `getValue` | none | `number \| null` | The current value, or `null` when indeterminate |

### Appearance Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setSize` | `size: number` | `LoadingIndicatorComponent` | Sets the size in pixels, kept between 24 and 240 |
| `getSize` | none | `number` | The size in pixels |
| `setLabel` | `label: string` | `LoadingIndicatorComponent` | Sets the accessible name |

### Animation Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `start` | none | `LoadingIndicatorComponent` | Runs the animation; it runs from creation |
| `stop` | none | `LoadingIndicatorComponent` | Freezes the indicator on its current frame |
| `isRunning` | none | `boolean` | Whether the animation is running |

### Lifecycle Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `destroy` | none | `void` | Stops the animation, releases the theme and resize observers and removes the element |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `element` | `HTMLElement` | The root element, a `progressbar` |
| `canvas` | `HTMLCanvasElement` | The canvas the shapes are drawn on |

## Examples

### Default and Contained

```javascript
// On a surface: the indicator takes primary
const onSurface = createLoadingIndicator({
  ariaLabel: 'Loading messages'
});

// Over content such as an image or a map: a primary-container circle
// gives it contrast, and the indicator takes on-primary-container
const overContent = createLoadingIndicator({
  contained: true,
  ariaLabel: 'Loading map'
});
```

### Sizes

The default is 48 pixels. The size can go from 24 to 240 pixels; the ratio between the container and the active indicator stays the same. Keep the large sizes for large windows.

```javascript
const small = createLoadingIndicator({ size: 24, ariaLabel: 'Checking' });
const large = createLoadingIndicator({ size: 160, contained: true, ariaLabel: 'Loading album' });

// Later
large.setSize(96);
```

### Determinate

With a value the shape morphs from a circle to a soft burst and turns half a circle counter-clockwise as the value grows. Drive it from your own progress; nothing animates between values.

```javascript
const upload = createLoadingIndicator({
  value: 0,
  ariaLabel: 'Uploading photo'
});

request.upload.addEventListener('progress', (event) => {
  if (event.lengthComputable) {
    upload.setValue(event.loaded / event.total);
  }
});

// Back to the loop while the server processes the file
request.upload.addEventListener('load', () => upload.setValue(null));
```

### In a Button

A loading indicator can stand in for a button's label while its action runs. Match the button's content colour by setting the indicator's colour through CSS.

```javascript
const button = createButton({ text: 'Check for updates', variant: 'tonal' });
const loading = createLoadingIndicator({ size: 24, ariaLabel: 'Checking for updates' });

button.on('click', async () => {
  button.setText('');
  button.element.appendChild(loading.element);
  await checkForUpdates();
  loading.destroy();
  button.setText('Up to date');
});
```

### Pausing

Stop and start keep the current shape, so an indicator that pauses does not jump.

```javascript
const loading = createLoadingIndicator({ ariaLabel: 'Syncing' });

document.addEventListener('visibilitychange', () => {
  if (document.hidden) loading.stop();
  else loading.start();
});
```

## Shapes and Motion

The indeterminate indicator loops through seven Material shapes in this order: soft burst, 9-sided cookie, pentagon, pill, sunny, 4-sided cookie, oval. Every 650 milliseconds it morphs to the next shape on a spring (damping ratio 0.6, stiffness 200) and turns a quarter turn, while a slow linear rotation adds a full turn every 4666 milliseconds. The spring overshoots the target shape slightly, then the shape holds until the next morph.

The shapes are built from the same rounded-polygon geometry as the Compose Material 3 shapes, available in `mtrl/core/shapes`, and the indicator interpolates their outlines around the centre. The largest shape's farthest point reaches the 38dp active circle inside the 48dp container, so every shape fits as it turns.

The determinate indicator morphs between a circle and the soft burst with the value.

## Accessibility

The Loading Indicator component follows the Material Design 3 accessibility guidance:

- `role="progressbar"` on the root element, with an `aria-label` that says what is loading
- `aria-valuemin`, `aria-valuemax` and `aria-valuenow` (0 to 100) while determinate, removed while indeterminate
- The canvas is hidden from assistive technology with `aria-hidden="true"`
- Under `prefers-reduced-motion: reduce` the shapes are shown in turn without morphing or spinning
- The indicator keeps a contrast of at least 3:1 against the surface it sits on with the default colour roles; use the contained variant over images and other content

```html
<!-- Indeterminate -->
<div role="progressbar" aria-label="Loading articles" class="mtrl-loading-indicator">
  <canvas class="mtrl-loading-indicator__canvas" aria-hidden="true"></canvas>
</div>

<!-- Determinate -->
<div role="progressbar" aria-label="Uploading photo" aria-valuemin="0" aria-valuemax="100" aria-valuenow="42" class="mtrl-loading-indicator mtrl-loading-indicator--determinate">
  <canvas class="mtrl-loading-indicator__canvas" aria-hidden="true"></canvas>
</div>
```

## CSS Customization

The component uses BEM-style CSS classes:

```css
/* Base styles: the container */
.mtrl-loading-indicator { /* ... */ }

/* Contained variant: primary-container circle */
.mtrl-loading-indicator--contained { /* ... */ }

/* Determinate state */
.mtrl-loading-indicator--determinate { /* ... */ }

/* Canvas element */
.mtrl-loading-indicator__canvas { /* ... */ }
```

The canvas draws the shapes in the element's `color`, so the indicator can be recoloured with CSS alone:

```css
/* An indicator inside a filled button takes the button's content colour */
.mtrl-button--filled .mtrl-loading-indicator {
  color: var(--mtrl-sys-color-on-primary);
}
```

### CSS Custom Properties

```css
.mtrl-loading-indicator {
  --mtrl-loading-indicator-size: 48px; /* set by the component from `size` */
}

:root {
  --mtrl-sys-color-primary: #6750A4;              /* indicator colour */
  --mtrl-sys-color-primary-container: #EADDFF;    /* contained: container colour */
  --mtrl-sys-color-on-primary-container: #21005D; /* contained: indicator colour */
}
```

## Performance Considerations

- One filled path per frame, 360 points, on a canvas sized to the element and the device pixel ratio
- Shape outlines are computed once per shape and shared by every indicator on the page
- The frame loop runs only while the indicator is indeterminate and running; a determinate indicator draws when its value changes
- The browser pauses `requestAnimationFrame` in background tabs; call `stop()` yourself when the indicator scrolls out of view for long
- Call `destroy()` when the wait is over so the loop, the theme observer and the resize observer are released

## Browser Support

The component works in every browser with Canvas 2D, `ResizeObserver` and `requestAnimationFrame`, that is all current browsers. Without a 2D context the element and its accessibility attributes still render; nothing is drawn.

## Best Practices

### When to Use a Loading Indicator

- Waits between 200 milliseconds and 5 seconds
- Where the amount of work is unknown, or known but short
- Centred in the page or container that is loading, or in the space new items will fill

### When to Use a Progress Indicator Instead

- Waits over 5 seconds
- Uploads, downloads and other work whose progress is known and worth watching
- Do not transition a loading indicator into a progress indicator; pick one for the wait

### Visual Guidelines

- Use the default variant directly on a surface and the contained variant over images, maps and other content
- Keep the default 48dp on compact windows and scale up in larger windows, never past 240dp
- Do not cover the content that is loading with a large indicator; one small indicator in the space the content will fill is enough

### Accessibility Guidelines

- Always give a label that names what is loading, such as `'Loading news'` or `'Refreshing page'`
- Do not move focus to the indicator
- Keep an alternative way to trigger a refresh when the indicator is part of a gesture

## TypeScript Support

The Loading Indicator component includes full TypeScript definitions:

```typescript
import { createLoadingIndicator, LoadingIndicatorConfig, LoadingIndicatorComponent } from 'mtrl';

const config: LoadingIndicatorConfig = {
  size: 64,
  contained: true,
  ariaLabel: 'Loading album'
};

const loading: LoadingIndicatorComponent = createLoadingIndicator(config);

loading.setValue(0.5);   // number | null
loading.setSize(96);     // clamped to 24–240
loading.stop().start();  // chainable
```
