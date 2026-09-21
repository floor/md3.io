# Slider Component

The Slider component provides a Material Design 3 compliant input control that allows users to select a value or range of values by moving a handle along a track. It uses high-performance canvas rendering for smooth interactions and supports various configurations including range sliders, centered sliders, and discrete value selection.

## Overview

Sliders are commonly used for:

- Volume controls and audio settings
- Image filters and adjustments (brightness, contrast)
- Price range selection in e-commerce
- Data visualization with interactive filtering
- Form inputs for numeric ranges
- Accessibility controls (font size, zoom level)

The component follows Material Design 3 guidelines with support for different sizes, colors, tick marks, value display, and smooth animations powered by canvas rendering for optimal performance.

## Import

```javascript
import { createSlider } from 'mtrl';
```

## Basic Usage

```javascript
// Create a basic slider
const slider = createSlider({
  min: 0,
  max: 100,
  value: 50
});

// Add to your page
document.querySelector('.controls').appendChild(slider.element);

// Update slider value
slider.setValue(75);

// Listen for value changes
slider.on('change', (event) => {
  console.log('New value:', event.value);
});
```

## Configuration

The Slider component accepts the following configuration options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `min` | `number` | `0` | Minimum value of the slider |
| `max` | `number` | `100` | Maximum value of the slider |
| `value` | `number` | `0` | Initial value of the slider |
| `secondValue` | `number` | `undefined` | Secondary value for range sliders |
| `step` | `number` | `1` | Step size for discrete sliders |
| `disabled` | `boolean` | `false` | Whether the slider is initially disabled |
| `color` | `'primary' \| 'secondary' \| 'tertiary' \| 'error'` | `'primary'` | Color variant of the slider |
| `size` | `'XS' \| 'S' \| 'M' \| 'L' \| 'XL' \| number` | `'XS'` | Size variant (XS=16px, S=24px, M=40px, L=56px, XL=96px, or custom pixels) |
| `ticks` | `boolean` | `false` | Whether to show tick marks |
| `tickLabels` | `string[] \| Record<number, string>` | `undefined` | Custom labels for ticks |
| `valueFormatter` | `function` | `(value) => value.toString()` | Formats the value shown in the label |
| `showValue` | `boolean` | `true` | Whether to show the current value while dragging |
| `snapToSteps` | `boolean` | `true` | Whether to snap to steps while dragging |
| `range` | `boolean` | `false` | Whether the slider is a range slider (two handles) |
| `centered` | `boolean` | `false` | Whether the slider is centered (active track from center) |
| `label` | `string` | `undefined` | Label text for the slider |
| `labelPosition` | `'start' \| 'end'` | `'start'` | Position of the label |
| `icon` | `string` | `undefined` | Icon to display with the slider |
| `iconPosition` | `'start' \| 'end'` | `'start'` | Position of the icon |
| `class` | `string` | `undefined` | Additional CSS classes |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |

## Component API

The Slider component provides the following methods:

### Value Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getValue()` | none | `number` | Gets the current slider value |
| `setValue(value, triggerEvent?)` | `value: number, triggerEvent?: boolean` | `SliderComponent` | Sets the slider value |
| `getSecondValue()` | none | `number \| null` | Gets the secondary slider value (range sliders only) |
| `setSecondValue(value, triggerEvent?)` | `value: number, triggerEvent?: boolean` | `SliderComponent` | Sets the secondary slider value |

### Range Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getMin()` | none | `number` | Gets the minimum slider value |
| `setMin(min)` | `min: number` | `SliderComponent` | Sets the minimum slider value |
| `getMax()` | none | `number` | Gets the maximum slider value |
| `setMax(max)` | `max: number` | `SliderComponent` | Sets the maximum slider value |
| `getStep()` | none | `number` | Gets the slider step size |
| `setStep(step)` | `step: number` | `SliderComponent` | Sets the slider step size |

### State Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `enable()` | none | `SliderComponent` | Enables the slider |
| `disable()` | none | `SliderComponent` | Disables the slider |
| `isDisabled()` | none | `boolean` | Checks if the slider is disabled |

### Appearance Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setColor(color)` | `color: 'primary' \| 'secondary' \| 'tertiary' \| 'error'` | `SliderComponent` | Sets the slider color |
| `getColor()` | none | `string` | Gets the current slider color |
| `setSize(size)` | `size: 'XS' \| 'S' \| 'M' \| 'L' \| 'XL' \| number` | `SliderComponent` | Sets the slider size |
| `getSize()` | none | `string` | Gets the current slider size |
| `showTicks(show)` | `show: boolean` | `SliderComponent` | Shows or hides tick marks |
| `showCurrentValue(show)` | `show: boolean` | `SliderComponent` | Shows or hides value bubble during interaction |

### Label and Icon Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setLabel(text)` | `text: string` | `SliderComponent` | Sets the label text |
| `getLabel()` | none | `string` | Gets the label text |
| `setIcon(iconHtml)` | `iconHtml: string` | `SliderComponent` | Sets the icon HTML |
| `getIcon()` | none | `string` | Gets the icon HTML |

### Event Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `on(event, handler)` | `event: string, handler: Function` | `SliderComponent` | Adds an event listener |
| `off(event, handler)` | `event: string, handler: Function` | `SliderComponent` | Removes an event listener |

### Lifecycle Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `destroy()` | none | `void` | Destroys the slider component and cleans up resources |

## Events

The Slider component emits the following events:

| Event | Description | Data |
|-------|-------------|------|
| `change` | Fires when slider value changes and interaction completes | `{ value: number, secondValue: number \| null }` |
| `input` | Fires during dragging as value changes | `{ value: number, secondValue: number \| null }` |
| `focus` | Fires when slider handle receives focus | `{ value: number, secondValue: number \| null }` |
| `blur` | Fires when slider handle loses focus | `{ value: number, secondValue: number \| null }` |
| `start` | Fires when interaction starts (mouse down, touch start) | `{ value: number, secondValue: number \| null }` |
| `end` | Fires when interaction ends (mouse up, touch end) | `{ value: number, secondValue: number \| null }` |

Every slider event carries the same object: `{ slider, value, secondValue,
originalEvent, preventDefault, defaultPrevented }`.

## Examples

### Basic Slider Variants

```javascript
// Simple value slider
const volumeSlider = createSlider({
  min: 0,
  max: 100,
  value: 50,
  label: 'Volume'
});

// Discrete slider with steps
const brightnessSlider = createSlider({
  min: 0,
  max: 10,
  value: 5,
  step: 1,
  ticks: true,
  label: 'Brightness'
});

// Price range slider
const priceSlider = createSlider({
  min: 0,
  max: 1000,
  value: 100,
  secondValue: 500,
  range: true,
  label: 'Price Range',
  valueFormatter: (value) => `$${value}`
});
```

### Different Sizes

```javascript
// Extra small (16px track height)
const compactSlider = createSlider({
  size: 'XS',
  value: 30,
  label: 'Compact'
});

// Medium (40px track height)
const mediumSlider = createSlider({
  size: 'M',
  value: 50,
  label: 'Medium'
});

// Extra large (96px track height)
const largeSlider = createSlider({
  size: 'XL',
  value: 70,
  label: 'Large'
});

// Custom size (32px track height)
const customSlider = createSlider({
  size: 32,
  value: 60,
  label: 'Custom Size'
});
```

### Color Variants

```javascript
// Primary color (default)
const primarySlider = createSlider({
  color: 'primary',
  value: 40,
  label: 'Primary'
});

// Secondary color
const secondarySlider = createSlider({
  color: 'secondary',
  value: 60,
  label: 'Secondary'
});

// Error color
const errorSlider = createSlider({
  color: 'error',
  value: 80,
  label: 'Error State'
});
```

### Centered Sliders

```javascript
// Audio balance control
const balanceSlider = createSlider({
  min: -10,
  max: 10,
  value: 0,
  centered: true,
  label: 'Audio Balance',
  valueFormatter: (value) => {
    if (value === 0) return 'Center';
    return value > 0 ? `R${value}` : `L${Math.abs(value)}`;
  }
});

// Temperature adjustment
const temperatureSlider = createSlider({
  min: -20,
  max: 20,
  value: 5,
  step: 1,
  centered: true,
  ticks: true,
  label: 'Temperature',
  valueFormatter: (value) => `${value > 0 ? '+' : ''}${value}°C`
});
```

### Sliders with Icons

```javascript
// Volume control with icon
const volumeControl = createSlider({
  min: 0,
  max: 100,
  value: 75,
  icon: `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
  </svg>`,
  label: 'Volume'
});

// Brightness control with icon
const brightnessControl = createSlider({
  min: 0,
  max: 100,
  value: 60,
  icon: `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18M20,15.31L23.31,12L20,8.69V4H15.31L12,0.69L8.69,4H4V8.69L0.69,12L4,15.31V20H8.69L12,23.31L15.31,20H20V15.31Z"/>
  </svg>`,
  iconPosition: 'start',
  label: 'Brightness'
});
```

### Discrete Sliders with Custom Labels

```javascript
// Quality selector
const qualitySlider = createSlider({
  min: 0,
  max: 4,
  value: 2,
  step: 1,
  ticks: true,
  tickLabels: {
    0: 'Low',
    1: 'Medium',
    2: 'High',
    3: 'Very High',
    4: 'Ultra'
  },
  label: 'Video Quality'
});

// Font size selector
const fontSizeSlider = createSlider({
  min: 12,
  max: 24,
  value: 16,
  step: 2,
  ticks: true,
  label: 'Font Size',
  valueFormatter: (value) => `${value}px`
});
```

### Advanced Range Slider

```javascript
// Time range picker
const timeRangeSlider = createSlider({
  min: 0,
  max: 24,
  value: 9,
  secondValue: 17,
  step: 0.5,
  range: true,
  label: 'Working Hours',
  valueFormatter: (value) => {
    const hours = Math.floor(value);
    const minutes = (value % 1) * 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
});

// Age range filter
const ageRangeSlider = createSlider({
  min: 18,
  max: 65,
  value: 25,
  secondValue: 45,
  range: true,
  step: 1,
  label: 'Age Range',
  valueFormatter: (value) => `${value} years`
});
```

### Interactive Examples

```javascript
// Image filter control
const contrastSlider = createSlider({
  min: -100,
  max: 100,
  value: 0,
  centered: true,
  label: 'Contrast',
  valueFormatter: (value) => `${value > 0 ? '+' : ''}${value}%`
});

const imageElement = document.querySelector('#preview-image');

contrastSlider.on('input', (event) => {
  // Real-time preview during dragging
  const contrast = 100 + event.value;
  imageElement.style.filter = `contrast(${contrast}%)`;
});

contrastSlider.on('change', (event) => {
  // Save final value
  console.log('Final contrast:', event.value);
});

// Audio equalizer
const frequencies = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];
const eqSliders = frequencies.map((freq, index) => {
  const slider = createSlider({
    min: -12,
    max: 12,
    value: 0,
    step: 0.5,
    centered: true,
    size: 'S',
    label: freq >= 1000 ? `${freq/1000}kHz` : `${freq}Hz`,
    valueFormatter: (value) => `${value > 0 ? '+' : ''}${value}dB`
  });
  
  slider.on('change', (event) => {
    updateEqualizer(index, event.value);
  });
  
  return slider;
});
```

### Form Integration

```javascript
// Settings form with sliders
const settingsForm = document.querySelector('#settings-form');

const settings = {
  volume: createSlider({
    min: 0,
    max: 100,
    value: 75,
    label: 'Master Volume'
  }),
  
  timeout: createSlider({
    min: 5,
    max: 60,
    value: 30,
    step: 5,
    ticks: true,
    label: 'Session Timeout (minutes)'
  }),
  
  fontSize: createSlider({
    min: 12,
    max: 20,
    value: 14,
    step: 1,
    label: 'Font Size',
    valueFormatter: (value) => `${value}px`
  })
};

// Add sliders to form
Object.values(settings).forEach(slider => {
  settingsForm.appendChild(slider.element);
});

// Form submission
settingsForm.addEventListener('submit', (event) => {
  event.preventDefault();
  
  const formData = {
    volume: settings.volume.getValue(),
    timeout: settings.timeout.getValue(),
    fontSize: settings.fontSize.getValue()
  };
  
  console.log('Settings:', formData);
  saveSettings(formData);
});
```

### Accessibility Example

```javascript
// Accessible slider with full keyboard support
const accessibleSlider = createSlider({
  min: 0,
  max: 100,
  value: 50,
  step: 1,
  label: 'Zoom Level',
  showValue: true,
  valueFormatter: (value) => `${value}%`,
  
  // Event handlers for screen reader announcements
  on: {
    change: (event) => {
      // Announce final value to screen readers
      announceToScreenReader(`Zoom level set to ${event.value} percent`);
    },
    
    focus: (event) => {
      // Provide instructions on first focus
      if (!accessibleSlider.hasReceivedFocus) {
        announceToScreenReader('Use arrow keys to adjust zoom level');
        accessibleSlider.hasReceivedFocus = true;
      }
    }
  }
});

function announceToScreenReader(message) {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.style.position = 'absolute';
  announcement.style.left = '-10000px';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  setTimeout(() => document.body.removeChild(announcement), 1000);
}
```

## Functional Composition

The Slider component is built using functional composition, combining multiple features:

### Core Features

- **Base Component (`createBase`)**: Provides the foundation with component creation utilities.
- **Event Handling (`withEvents`)**: Enables event listening and emission.
- **Layout Structure (`withLayout`)**: Creates the declarative DOM structure definition.
- **Icon Support (`withIcon`)**: Adds optional icon display capability.
- **Label Support (`withLabel`)**: Adds optional label text capability.
- **Range Support (`withRange`)**: Extends single slider to support range (two handles).
- **DOM Creation (`withDom`)**: Materializes the structure definition into actual DOM elements.
- **Canvas Rendering (`withCanvas`)**: High-performance canvas-based rendering for tracks and ticks.
- **State Management (`withStates`)**: Manages appearance and disabled states.
- **Controller (`withController`)**: Handles user interactions, value management, and UI updates.
- **Lifecycle Management (`withLifecycle`)**: Handles component lifecycle including destruction and cleanup.
- **Public API (`withAPI`)**: Exposes a clean, chainable API for users.

### How Composition Works

The slider component is created by "piping" these features together:

```javascript
const slider = pipe(
  createBase,                    // Start with base component
  withEvents(),                  // Add event capability
  withLayout(baseConfig),        // Define DOM structure
  withIcon(baseConfig),          // Add icon support
  withLabel(baseConfig),         // Add label support
  withRange(baseConfig),         // Add range capability
  withDom(),                     // Create actual DOM elements
  withCanvas(baseConfig),        // Add canvas rendering
  withStates(baseConfig),        // Add state management
  withController(baseConfig),    // Add interaction handling
  withLifecycle(),               // Add lifecycle management
  comp => withAPI(config)(comp)  // Apply public API
)(baseConfig);
```

This composition pattern allows for:
- Modular, testable code
- Clean separation of concerns
- High-performance canvas rendering
- Lightweight bundles (only include what you need)
- Easy extension and customization
- Smooth interactions without DOM manipulation overhead

## Canvas Rendering

The Slider component uses HTML5 Canvas for high-performance rendering:

### Benefits
- **Smooth Interactions**: 60fps interactions without DOM reflows
- **Pixel-Perfect Rendering**: Crisp visuals on all device pixel ratios
- **Memory Efficient**: Single canvas element instead of multiple DOM track segments
- **Flexible Styling**: Programmatic control over all visual aspects

### Rendering Features
- **Material Design 3 Compliant**: Follows MD3 specifications for slider visuals
- **Responsive Track Segments**: Dynamic active/inactive track rendering based on value
- **Smart Gap Management**: Handle gaps reduce when pressed for better visual feedback
- **Tick Mark Rendering**: High-performance tick mark display with active/inactive states
- **End Dot Indicators**: Visual anchors at track ends for better contrast
- **Range Support**: Complex track rendering for range sliders with proper handle interactions

### Canvas Elements

The canvas renders the following visual elements while keeping handles and value bubbles as DOM for accessibility:

```javascript
// Canvas renders:
// - Track segments (active, inactive, start, remaining)
// - Tick marks with active/inactive states
// - End dots for visual anchoring
// - Gap adjustments during interaction

// DOM elements (for accessibility):
// - Handles (with proper ARIA attributes)
// - Value bubbles (for screen reader announcements)
// - Labels and icons
```

### Size-Aware Rendering

The canvas rendering adapts to different slider sizes:

- **Track Height**: XS=16px, S=24px, M=40px, L=56px, XL=80px, or custom
- **Handle Height**: Small sizes use 48px, larger sizes use track height + 16px offset
- **External Radius**: Small sizes use 10px, larger sizes use proportional radius
- **Gap Management**: Fixed pixel gaps with pressure reduction for visual feedback

## Visual Enhancements

The Slider component includes several visual refinements for improved user experience:

### Smart Track Rendering

The canvas-based track rendering provides:

- **Active Track Segments**: Visually distinct filled portions
- **Inactive Track Segments**: Subtle unfilled portions
- **Handle Gaps**: Visual separation between handles and track
- **Pressure Feedback**: Gap reduction when handles are pressed
- **Range Support**: Complex rendering for dual-handle sliders

### Centered Slider Support

For centered sliders (like audio balance controls):

- **Zero-Point Visualization**: Clear indication of the center position
- **Bidirectional Fill**: Active track extends from center to current value
- **Smooth Transitions**: Animated value changes maintain visual continuity
- **Gap Management**: Special handling when handle approaches center

### Tick Mark Intelligence

Tick marks are rendered with smart behavior:

- **Active State Indication**: Ticks show active/inactive based on current value
- **Handle Avoidance**: Ticks are hidden when overlapping with handles
- **Range Awareness**: For range sliders, ticks between handles show as active
- **Centered Logic**: For centered sliders, tick activity follows the fill direction

## Accessibility

The Slider component follows accessibility best practices:

- Proper semantic HTML with ARIA attributes
- `role="slider"` for screen reader compatibility
- `aria-valuemin`, `aria-valuemax`, and `aria-valuenow` attributes
- `aria-orientation="horizontal"` for proper screen reader behavior
- `aria-disabled` when component is disabled
- Full keyboard navigation support (Arrow keys, Home, End, Page Up/Down)
- Focus management with visual indicators
- Value announcements during interaction

### Keyboard Navigation

The component provides comprehensive keyboard support:

| Keys | Action |
|------|--------|
| `Arrow Left/Down` | Decrease value by one step |
| `Arrow Right/Up` | Increase value by one step |
| `Shift + Arrows` | Increase/decrease by 10x step size |
| `Home` | Set to minimum value |
| `End` | Set to maximum value |
| `Page Up` | Increase by large increment (10 steps) |
| `Page Down` | Decrease by large increment (10 steps) |
| `Tab` | Move focus between handles (range sliders) |

### Screen Reader Support

The component provides appropriate information to assistive technologies:

```html
<!-- Single handle slider -->
<div class="mtrl-slider" tabindex="-1">
  <div role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="42"
       aria-orientation="horizontal" tabindex="0">
    <!-- Canvas rendering -->
  </div>
</div>

<!-- Range slider -->
<div class="mtrl-slider mtrl-slider--range" tabindex="-1">
  <div role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="25"
       aria-orientation="horizontal" tabindex="0" data-handle-index="0">
    <!-- First handle -->
  </div>
  <div role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="75"
       aria-orientation="horizontal" tabindex="0" data-handle-index="1">
    <!-- Second handle -->
  </div>
</div>
```

## CSS Customization

The Slider component uses BEM-style CSS classes for easy customization:

```css
/* Base slider styles */
.mtrl-slider { /* ... */ }

/* Slider container */
.mtrl-slider-container { /* ... */ }

/* Slider handle */
.mtrl-slider-handle { /* ... */ }

/* Value bubble */
.mtrl-slider-value { /* ... */ }

/* Slider states */
.mtrl-slider--disabled { /* ... */ }
.mtrl-slider--dragging { /* ... */ }
.mtrl-slider--discrete { /* ... */ }  /* added when step marks are shown */

/* Focus lands on a handle, so the focus class goes on the handle */
.mtrl-slider-handle--focused { /* ... */ }

/* Slider variants */
.mtrl-slider--range { /* ... */ }
.mtrl-slider--centered { /* ... */ }

/* Size variants. The default size (XS) adds no class, so style the base
   selector for it rather than .mtrl-slider--xs */
.mtrl-slider--s { /* ... */ }
.mtrl-slider--m { /* ... */ }
.mtrl-slider--l { /* ... */ }
.mtrl-slider--xl { /* ... */ }

/* Color variants. The default colour (primary) adds no class, so style the
   base selector for it rather than .mtrl-slider--primary */
.mtrl-slider--secondary { /* ... */ }
.mtrl-slider--tertiary { /* ... */ }
.mtrl-slider--error { /* ... */ }

/* Label and icon */
.mtrl-slider-label { /* ... */ }
.mtrl-slider-icon { /* ... */ }

/* Canvas element */
.mtrl-slider-canvas { /* ... */ }
```

### CSS Custom Properties

The component supports CSS custom properties for theming:

```css
:root {
  --mtrl-primary: #6750A4;                    /* Active track and handle color */
  --mtrl-primary-rgb: 103, 80, 164;          /* RGB values for alpha */
  --mtrl-outline-variant: rgba(0,0,0,0.12);  /* Inactive track color */
  --mtrl-on-surface: #1C1B1F;                /* Handle border and text */
  --mtrl-surface: #FFFBFE;                   /* Value bubble background */
}
```

## Performance Considerations

The Slider component is designed for optimal performance:

### Canvas Rendering Benefits
- **No DOM Reflows**: Canvas updates don't trigger layout recalculations
- **Hardware Acceleration**: GPU-accelerated rendering when available
- **Efficient Interactions**: RequestAnimationFrame-based rendering
- **Memory Efficient**: Single canvas element vs. multiple DOM track elements

### Optimization Features
- **Debounced Resize**: Smart resize handling to prevent excessive redraws
- **Animation Cleanup**: Proper cleanup of animation loops to prevent memory leaks
- **Pixel Ratio Awareness**: Automatic scaling for high-DPI displays
- **Selective Redraws**: Only redraws when values actually change
- **Event Throttling**: Efficient handling of high-frequency input events

### Best Practices for Performance
- Avoid creating many slider instances simultaneously
- Use appropriate step sizes to prevent excessive value changes
- Clean up components when no longer needed
- Consider using `snapToSteps: false` for smoother real-time interactions
- Debounce rapid value updates when connecting to external APIs

## Browser Support

The Slider component works in all modern browsers that support:
- HTML5 Canvas API
- CSS Custom Properties
- ES6+ JavaScript features
- Pointer Events or Mouse/Touch Events
- RequestAnimationFrame API

For older browsers, consider using polyfills or alternative solutions for environments that don't support these modern web standards.

## Best Practices

### When to Use Sliders
- **Continuous Values**: When precise value selection within a range is needed
- **Visual Feedback**: When users benefit from seeing the relative position of a value
- **Range Selection**: When users need to select a range of values
- **Real-time Adjustment**: When immediate visual feedback enhances the user experience

### Design Guidelines
- Use appropriate sizes for the context (compact for forms, larger for main controls)
- Provide clear labels that describe what the slider controls
- Use tick marks for discrete values or important reference points
- Consider using icons to reinforce the slider's purpose
- Ensure sufficient color contrast for accessibility
- Use consistent slider styling throughout your application

### Interaction Guidelines
- Provide immediate visual feedback during interaction
- Use value bubbles for sliders where precise values matter
- Consider the appropriate step size for your use case
- For range sliders, ensure handles can be easily distinguished
- Test keyboard navigation thoroughly
- Provide alternative input methods for users who struggle with dragging

### Accessibility Guidelines
- Always provide meaningful labels for screen readers
- Ensure sliders are keyboard accessible
- Test with screen readers to verify proper value announcements
- Don't rely solely on color to convey state
- Provide sufficient touch targets for mobile users
- Consider users with motor disabilities when setting step sizes

### Value Management Guidelines
- Use appropriate min/max ranges that make sense for your use case
- Consider providing input fields alongside sliders for precise entry
- Validate values and provide helpful error messages
- Store and restore slider states appropriately
- Consider the impact of frequent value changes on performance

## Error Handling

The Slider component includes robust error handling:

```javascript
// Safe value setting with validation
slider.setValue(150); // Automatically clamped to max value
slider.setValue(-10); // Automatically clamped to min value

// Range validation for range sliders
rangeSlider.setValue(80);      // First handle
rangeSlider.setSecondValue(60); // Automatically maintains proper order

// Component handles canvas initialization gracefully
const slider = createSlider({
  size: 'M',
  value: 50
});

// Component will retry canvas initialization if needed
```

## TypeScript Support

The Slider component includes full TypeScript definitions:

```typescript
import { createSlider, SliderConfig, SliderComponent } from 'mtrl';

const slider: SliderComponent = createSlider({
  min: 0,
  max: 100,
  value: 50,
  size: 'M',
  color: 'primary'
} as SliderConfig);

// Type-safe method calls
slider.setValue(75); // TypeScript will validate the number type
slider.setColor('secondary'); // TypeScript will validate color options
slider.setSize('L'); // TypeScript will validate size options
```

## Migration Guide

If you're migrating from DOM-based track rendering to the new canvas-based system:

### What Changed
- Track segments are now rendered on canvas instead of DOM elements
- Tick marks are canvas-rendered for better performance
- Handle and value bubble positioning is more precise
- Animation performance is significantly improved

### What Stayed the Same
- All public API methods remain unchanged
- Event system works exactly the same
- Accessibility features are preserved and enhanced
- Configuration options are backward compatible

### Updating Your Code
No code changes are required for basic usage. Advanced customizations that relied on DOM track elements should be updated to use CSS custom properties or canvas-based styling options.