# Progress Component

The Progress component provides a Material Design 3 compliant progress indicator that shows the completion progress of a task or process. It uses high-performance canvas rendering to deliver smooth animations and supports both determinate and indeterminate states across linear and circular variants.

## Overview

Progress indicators are commonly used for:

- Loading content or data
- Form submissions and file uploads
- Long-running operations
- Task completion tracking
- Video/audio buffering states

The component follows Material Design 3 guidelines with support for various variants (linear, circular), shapes (line, wavy), thickness options, and smooth animations powered by canvas rendering for optimal performance.

## Import

```javascript
import { createProgress } from 'mtrl';
```

## Basic Usage

```javascript
// Create a basic linear progress bar
const progress = createProgress({
  variant: 'linear',
  value: 42,
  max: 100
});

// Add to your page
document.querySelector('.loading-container').appendChild(progress.element);

// Update progress value
progress.setValue(75);

// Listen for completion
progress.on('complete', () => {
  console.log('Task completed!');
});
```

## Configuration

The Progress component accepts the following configuration options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `variant` | `'linear' \| 'circular'` | `'linear'` | Visual style of the progress indicator |
| `value` | `number` | `0` | Initial progress value (0 to max) |
| `max` | `number` | `100` | Maximum progress value |
| `buffer` | `number` | `0` | Buffer value for linear progress (e.g., video buffering) |
| `indeterminate` | `boolean` | `false` | Whether progress shows animation without specific value |
| `thickness` | `'thin' \| 'thick' \| number` | `'thin'` | Thickness of the progress track (thin=4dp, thick=8dp, or custom pixels) |
| `shape` | `'flat' \| 'wavy'` | `'flat'` | Shape of progress animation (works for both linear and circular variants) |
| `size` | `number` | `40` (`48` wavy) | Size of circular progress in pixels (24-240, circular variant only) |
| `showLabel` | `boolean` | `false` | Whether to show percentage label |
| `disabled` | `boolean` | `false` | Whether the progress indicator is initially disabled |
| `class` | `string` | `undefined` | Additional CSS classes to add to the progress component |
| `showStopIndicator` | `boolean` | `true` | Marks the end of a linear determinate track with a 4dp dot |
| `ariaLabel` | `string` | `'Loading'` | Accessible name: what is loading |
| `labelFormatter` | `function` | `undefined` | Custom label formatter function |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |

## Component API

The Progress component provides the following methods:

### Value Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getValue()` | none | `number` | Gets the current progress value |
| `setValue(value, animate?)` | `value: number, animate?: boolean` | `ProgressComponent` | Sets the progress value. If `animate` is `true` (default), changes are animated over 500ms. If `false`, changes are immediate. |
| `getMax()` | none | `number` | Gets the maximum progress value |

### Buffer Methods (Linear Only)

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getBuffer()` | none | `number` | Gets the current buffer value |
| `setBuffer(value)` | `value: number` | `ProgressComponent` | Sets the buffer value for buffering indicators |

### State Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `enable()` | none | `ProgressComponent` | Enables the progress indicator |
| `disable()` | none | `ProgressComponent` | Disables the progress indicator |
| `isDisabled()` | none | `boolean` | Checks if the component is disabled |
| `setIndeterminate(state)` | `state: boolean` | `ProgressComponent` | Sets indeterminate state (shows animation) |
| `isIndeterminate()` | none | `boolean` | Checks if the component is in indeterminate state |

### Appearance Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setThickness(thickness)` | `thickness: 'thin' \| 'thick' \| number` | `ProgressComponent` | Sets the thickness of the progress track |
| `getThickness()` | none | `number` | Gets the current thickness value in pixels |
| `setShape(shape)` | `shape: 'flat' \| 'wavy'` | `ProgressComponent` | Sets the shape (works for both linear and circular variants) |
| `getShape()` | none | `'flat' \| 'wavy'` | Gets the current shape |

### Label Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `showLabel()` | none | `ProgressComponent` | Shows the percentage label |
| `hideLabel()` | none | `ProgressComponent` | Hides the percentage label |
| `setLabelFormatter(formatter)` | `formatter: (value: number, max: number) => string` | `ProgressComponent` | Sets custom label formatter |

### Event Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `on(event, handler)` | `event: string, handler: Function` | `ProgressComponent` | Adds an event listener |
| `off(event, handler)` | `event: string, handler: Function` | `ProgressComponent` | Removes an event listener |

### Style Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `addClass(...classes)` | `...classes: string[]` | `ProgressComponent` | Adds CSS classes to the progress element |

### Lifecycle Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `destroy()` | none | `void` | Destroys the progress component and cleans up resources |

## Events

The Progress component emits the following events. They are native
`CustomEvent`s dispatched on `progress.element`, and `on()`/`off()` are thin
wrappers over `addEventListener`/`removeEventListener`, so the handler receives
the event and the data is on `event.detail`:

| Event | Description | `event.detail` |
|-------|-------------|------|
| `change` | Fires when progress value changes | `{ value: number, max: number }` |
| `complete` | Fires when progress reaches 100%. **Note:** With animated value changes (default), this event fires after the animation completes (~500ms). With immediate value changes (`setValue(100, false)`), it fires immediately. | `{ value: number, max: number }` |

## Examples

### Basic Progress Variants

```javascript
// Linear determinate progress
const linearProgress = createProgress({
  variant: 'linear',
  value: 30,
  max: 100
});

// Circular determinate progress
const circularProgress = createProgress({
  variant: 'circular',
  value: 65,
  max: 100
});

// Indeterminate linear progress (loading animation)
const loadingProgress = createProgress({
  variant: 'linear',
  indeterminate: true
});

// Indeterminate circular progress (spinner)
const spinner = createProgress({
  variant: 'circular',
  indeterminate: true
});
```

### Progress with Labels

```javascript
const labeledProgress = createProgress({
  variant: 'linear',
  value: 42,
  showLabel: true
});

// Custom label formatter
const customProgress = createProgress({
  variant: 'linear',
  value: 7,
  max: 10,
  showLabel: true,
  labelFormatter: (value, max) => `${value} of ${max} items`
});
```

### Different Thickness Options

```javascript
// Thin progress (4px)
const thinProgress = createProgress({
  variant: 'linear',
  thickness: 'thin',
  value: 50
});

// Thick progress (8px)
const thickProgress = createProgress({
  variant: 'linear',
  thickness: 'thick',
  value: 50
});

// Custom thickness (12px)
const customThickness = createProgress({
  variant: 'linear',
  thickness: 12,
  value: 50
});
```

### Wavy Animated Progress

```javascript
// Wavy linear progress
const wavyProgress = createProgress({
  variant: 'linear',
  shape: 'wavy',
  value: 60
});

// Wavy circular progress
const wavyCircular = createProgress({
  variant: 'circular',
  shape: 'wavy',
  value: 60,
  size: 120
});

// Wavy indeterminate progress
const wavyLoading = createProgress({
  variant: 'linear',
  shape: 'wavy',
  indeterminate: true
});

// Wavy circular indeterminate
const wavySpinner = createProgress({
  variant: 'circular',
  shape: 'wavy',
  indeterminate: true
});
```

### Circular Progress with Custom Size

```javascript
// Small circular progress (24px)
const smallCircular = createProgress({
  variant: 'circular',
  size: 24,
  value: 75
});

// Large circular progress (120px)
const largeCircular = createProgress({
  variant: 'circular',
  size: 120,
  value: 75
});
```

### Buffer Progress (Video/Audio Loading)

```javascript
const bufferProgress = createProgress({
  variant: 'linear',
  value: 30,        // Current playback position
  buffer: 60,       // Amount buffered ahead
  max: 100
});

// Update as video plays and buffers
setInterval(() => {
  bufferProgress.setValue(bufferProgress.getValue() + 1);
  if (Math.random() > 0.7) {
    bufferProgress.setBuffer(bufferProgress.getBuffer() + 2);
  }
}, 1000);
```

### File Upload Progress

```javascript
const uploadProgress = createProgress({
  variant: 'linear',
  value: 0,
  showLabel: true,
  labelFormatter: (value, max) => `${Math.round(value)}% uploaded`
});

// Simulate file upload
async function uploadFile(file) {
  uploadProgress.setValue(0);
  uploadProgress.setIndeterminate(false);
  
  // Simulate upload progress
  for (let i = 0; i <= 100; i += 10) {
    await new Promise(resolve => setTimeout(resolve, 200));
    uploadProgress.setValue(i);
  }
}

uploadProgress.on('complete', () => {
  console.log('Upload completed!');
  setTimeout(() => {
    uploadProgress.hideLabel();
  }, 2000);
});
```

### Immediate vs Animated Updates

```javascript
const progress = createProgress({
  variant: 'linear',
  value: 0,
  showLabel: true
});

// Animated update (default) - smooth 500ms transition
progress.setValue(50);  // Same as setValue(50, true)

// Immediate update - no animation
progress.setValue(50, false);

// Real-time data example with immediate updates
function updateCPUUsage() {
  const cpuUsage = getCPUUsage();
  // Use immediate update for real-time data
  progress.setValue(cpuUsage, false);
}
setInterval(updateCPUUsage, 100);

// File upload with immediate updates
function onUploadProgress(event) {
  const percentComplete = (event.loaded / event.total) * 100;
  // Immediate update for smooth real-time progress
  progress.setValue(percentComplete, false);
}

// User interaction with animated update
button.onclick = () => {
  // Animated update for better UX on user actions
  progress.setValue(100);
};
```

### Task Progress with Dynamic States

```javascript
const taskProgress = createProgress({
  variant: 'linear',
  value: 0,
  showLabel: true
});

async function runLongTask() {
  // Start with indeterminate state
  taskProgress.setIndeterminate(true);
  taskProgress.setLabelFormatter(() => 'Initializing...');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Switch to determinate progress
  taskProgress.setIndeterminate(false);
  taskProgress.setLabelFormatter((value, max) => 
    `Processing: ${Math.round(value)}% complete`
  );
  
  // Simulate task progress
  for (let i = 0; i <= 100; i += 5) {
    await new Promise(resolve => setTimeout(resolve, 100));
    taskProgress.setValue(i);
  }
}

taskProgress.on('complete', () => {
  taskProgress.setLabelFormatter(() => 'Task completed!');
});
```

### Multiple Progress Indicators

```javascript
const progressContainer = document.querySelector('.progress-list');

const tasks = ['Downloading files', 'Processing data', 'Generating report'];
const progressBars = tasks.map((task, index) => {
  const progress = createProgress({
    variant: 'linear',
    value: 0,
    showLabel: true,
    labelFormatter: (value) => `${task}: ${Math.round(value)}%`
  });
  
  progressContainer.appendChild(progress.element);
  return progress;
});

// Simulate multiple concurrent tasks
progressBars.forEach((progress, index) => {
  setTimeout(() => {
    const interval = setInterval(() => {
      const newValue = progress.getValue() + Math.random() * 10;
      progress.setValue(Math.min(newValue, 100));
      
      if (progress.getValue() >= 100) {
        clearInterval(interval);
      }
    }, 200);
  }, index * 500);
});
```

## Functional Composition

The Progress component is built using functional composition, combining multiple features:

### Core Features

- **Base Component (`createBase`)**: Provides the foundation with component creation utilities.
- **Element Creation (`withElement`)**: Creates the DOM container element with proper attributes and classes.
- **Event Handling (`withEvents`)**: Enables event listening and emission.
- **Variant Styling (`withVariant`)**: Applies visual styling variants like linear or circular.
- **State Management (`withState`)**: Manages component state including value, buffer, and indeterminate state.
- **Canvas Rendering (`withCanvas`)**: High-performance canvas-based rendering for smooth animations.
- **Disabled State (`withDisabled`)**: Manages the disabled state of the progress indicator.
- **Lifecycle Management (`withLifecycle`)**: Handles component lifecycle including destruction and cleanup.
- **Public API (`withAPI`)**: Exposes a clean, chainable API for users.

### How Composition Works

The progress component is created by "piping" these features together:

```javascript
const progress = pipe(
  createBase,                    // Start with base component
  withEvents(),                  // Add event capability
  withElement(config),           // Create DOM container
  withVariant(config),           // Apply variant styling
  withDisabled(config),          // Add disabled state
  withState(config),             // Add state management
  withCanvas(config),            // Add canvas rendering
  comp => withAPI(config)(comp), // Apply public API
  withLifecycle()                // Add lifecycle management
)(baseConfig);
```

This composition pattern allows for:
- Modular, testable code
- Clean separation of concerns
- High-performance canvas rendering
- Lightweight bundles (only include what you need)
- Easy extension and customization
- Smooth animations without DOM manipulation overhead

## Canvas Rendering

The Progress component uses HTML5 Canvas for high-performance rendering:

### Benefits
- **Smooth Animations**: 60fps animations without DOM reflows
- **Pixel-Perfect Rendering**: Crisp visuals on all device pixel ratios
- **Memory Efficient**: Single canvas element instead of multiple DOM nodes
- **Flexible Styling**: Programmatic control over all visual aspects

### Animation Features
- **Material Design 3 Compliant**: Follows MD3 animation specifications
- **Indeterminate Animations**: Two-segment animation for linear progress, creating fluid, organic motion
- **Value Transitions**: Eased transitions when changing progress values
- **Wavy Animations**: Unique wavy progress shapes for enhanced visual appeal
- **Responsive Sizing**: Automatic canvas scaling for different container sizes

### Indeterminate Animation

Both indeterminate animations are ported from the Compose Material 3
implementation, keyframes and easing curves included.

```javascript
const loading = createProgress({ variant: 'linear', indeterminate: true });
const spinner = createProgress({ variant: 'circular', indeterminate: true });
```

**Linear**, over a 1750ms cycle: two bars cross the track, each defined by a
head and a tail that start 250ms apart and ease on the emphasized accelerate
curve. The leading bar's head starts at once and reaches the end at 1000ms;
the trailing bar starts at 650ms. The track is drawn ahead of, between and
behind them, with the same 4dp gap the determinate indicator uses.

**Circular**, over a 6 second cycle: the arc turns 1080 degrees at a steady
rate with four 90 degree kicks on top of it, one every 1500ms and each taking
300ms on the emphasized decelerate curve, so it turns 1440 degrees a cycle.
The arc itself grows from 10% of the circle to 87% by half way and shrinks
back. A circular indeterminate indicator has no track.

## Visual Enhancements

### The dot at low values

At 0 nothing is drawn. As soon as progress begins, the round cap of the active
indicator reads as the dot the guidelines call for at low percentages.

### The wave

The wave is 3dp tall on a 4dp linear track, which is the 10dp container height
the tokens describe, and it keeps that relationship as the track thickens. On a
circular indicator it is 1.6dp at the default 40dp size and scales with the
size, so the waveform keeps its proportions. The wave travels one wavelength a
second: 40dp for a determinate linear indicator, 20dp for an indeterminate one,
15dp around a circle.

A determinate wave flattens below 10% and above 95%, fading over 500ms on the
standard curve as it appears and the emphasized accelerate curve as it goes, so
the indicator finishes flat.

```javascript
// Waves at any size and thickness
const wavy = createProgress({ variant: 'circular', shape: 'wavy', size: 96, value: 60 });
const thickWavy = createProgress({ shape: 'wavy', thickness: 'thick', value: 60 });
```

## Accessibility

The Progress component follows accessibility best practices:

- `role="progressbar"` on the container, with an `aria-label` that says what is loading, such as `'Loading news article'` or `'Refreshing page'`
- `aria-valuemin`, `aria-valuemax` and `aria-valuenow` attributes
- `aria-valuenow` removed during indeterminate state
- `aria-disabled` when the component is disabled
- The canvas is hidden from assistive technology with `aria-hidden="true"`
- The stop indicator marks the end of a linear determinate track. It is required unless the track has a contrast of at least 3:1 with its container and the surface behind it, so it is drawn by default; turn it off with `showStopIndicator: false` when that contrast is met
- Linear indicators are mirrored under `direction: rtl`
- Under `prefers-reduced-motion: reduce` nothing animates: the indicator draws a still frame

### Screen Reader Support

The component provides appropriate information to assistive technologies:

```html
<!-- Determinate progress -->
<div role="progressbar" aria-label="Uploading photo" aria-valuemin="0" aria-valuemax="100" aria-valuenow="42">
  <canvas class="mtrl-progress-canvas" aria-hidden="true"></canvas>
</div>

<!-- Indeterminate progress -->
<div role="progressbar" aria-label="Loading news article" aria-valuemin="0" aria-valuemax="100">
  <canvas class="mtrl-progress-canvas" aria-hidden="true"></canvas>
</div>
```

## CSS Customization

The Progress component uses BEM-style CSS classes for easy customization:

```css
/* Base progress styles */
.mtrl-progress { /* ... */ }

/* Progress variants */
.mtrl-progress--linear { /* ... */ }
.mtrl-progress--circular { /* ... */ }

/* Progress states */
.mtrl-progress--indeterminate { /* ... */ }
.mtrl-progress--disabled { /* ... */ }

/* Progress shapes */
.mtrl-progress--wavy { /* ... */ }

/* Progress label */
.mtrl-progress__label { /* ... */ }

/* Canvas element */
.mtrl-progress-canvas { /* ... */ }
```

### CSS Custom Properties

The component supports CSS custom properties for theming:

```css
:root {
  --mtrl-sys-color-primary: #6750A4;             /* Active indicator and stop indicator */
  --mtrl-sys-color-secondary-container: #E8DEF8; /* Track */
  --mtrl-sys-color-primary-container: #EADDFF;   /* Buffer */
  --mtrl-sys-color-on-surface-variant: #49454F;  /* Label */
}
```

The indicator is drawn on a canvas, which reads these from the element's
computed style once and again whenever the theme changes.

## Performance Considerations

The Progress component is designed for optimal performance:

### Canvas Rendering Benefits
- **No DOM Reflows**: Canvas updates don't trigger layout recalculations
- **Hardware Acceleration**: GPU-accelerated rendering when available
- **Efficient Animations**: RequestAnimationFrame-based animation loops
- **Memory Efficient**: Single canvas element vs. multiple DOM nodes

### Optimization Features
- **Debounced Resize**: Smart resize handling to prevent excessive redraws
- **Animation Cleanup**: Proper cleanup of animation loops to prevent memory leaks
- **Pixel Ratio Awareness**: Automatic scaling for high-DPI displays
- **Selective Redraws**: Only redraws when values actually change

### Best Practices for Performance
- Use indeterminate state for unknown durations
- Batch multiple value updates when possible
- Clean up components when no longer needed
- Avoid creating many progress instances simultaneously
- Use immediate updates (`setValue(value, false)`) for high-frequency changes like real-time data or file uploads
- Use animated updates (default) for user-triggered actions for better UX

## Browser Support

The Progress component works in all modern browsers that support:
- HTML5 Canvas API
- CSS Custom Properties
- ES6+ JavaScript features
- RequestAnimationFrame API

For older browsers, the component requires these APIs to function properly. Consider using polyfills or alternative solutions for environments that don't support these modern web standards.

## Best Practices

### When to Use Progress Indicators
- **Determinate**: When you know the completion percentage (file uploads, form submissions)
- **Indeterminate**: When duration is unknown (loading data, processing)
- **Linear**: For horizontal layouts, forms, and step-by-step processes
- **Circular**: For compact spaces, overlays, and general loading states

### Visual Guidelines
- Use appropriate thickness for the context (thin for subtle, thick for emphasis)
- Choose wavy shape sparingly for special effects or brand differentiation
- Position labels clearly without obstructing the progress indicator
- Ensure sufficient color contrast for accessibility
- Use consistent progress styling throughout your application

### Animation Guidelines
- **Use Animated Updates (`setValue(value)` or `setValue(value, true)`)** for:
  - User-triggered actions (button clicks, form submissions)
  - Step-by-step processes
  - Milestone achievements
  - Any interaction where smooth visual feedback enhances UX
  
- **Use Immediate Updates (`setValue(value, false)`)** for:
  - Real-time data (CPU usage, network speed)
  - File upload/download progress
  - Rapid polling or streaming data
  - High-frequency updates (> 10 updates per second)
  - Situations where animation queuing could cause lag

### Performance Guidelines
- Limit the number of simultaneous animated progress indicators
- Use indeterminate state judiciously (can be distracting if overused)
- Update progress values at reasonable intervals (not too frequently)
- Clean up progress components when navigation occurs

### Accessibility Guidelines
- Always provide meaningful labels for screen readers
- Don't rely solely on color to convey progress state
- Ensure progress indicators are keyboard accessible when interactive
- Test with screen readers to verify proper announcements
- Consider users with vestibular disorders when using animated states

## Error Handling

The Progress component includes robust error handling:

```javascript
// Safe value setting with validation
progress.setValue(150); // Automatically clamped to max value
progress.setValue(-10); // Automatically clamped to 0

// Component handles canvas initialization gracefully
const progress = createProgress({
  variant: 'circular',
  value: 50
});

// Component will retry canvas initialization if needed
```

## TypeScript Support

The Progress component includes full TypeScript definitions:

```typescript
import { createProgress, ProgressConfig, ProgressComponent } from 'mtrl';

const progress: ProgressComponent = createProgress({
  variant: 'linear',
  value: 50,
  thickness: 'thick'
} as ProgressConfig);

// Type-safe method calls
progress.setValue(75); // TypeScript will validate the number type
progress.setValue(75, true); // Animated update
progress.setValue(75, false); // Immediate update
progress.setShape('wavy'); // TypeScript will validate shape options
```