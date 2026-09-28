# Slider Component

The Slider component provides a Material Design 3 compliant input control that allows users to select a value or range of values by moving a handle along a track. It supports the three M3 variants (standard, centered and range), discrete stops, five sizes, horizontal and vertical orientation, and an inset icon.

## Overview

Sliders are commonly used for:

- Volume controls and audio settings
- Image filters and adjustments (brightness, contrast)
- Price range selection in e-commerce
- Data visualization with interactive filtering
- Form inputs for numeric ranges
- Accessibility controls (font size, zoom level)

The component follows Material Design 3 guidelines with support for different sizes, colors, tick marks, value display, and M3 Expressive motion.

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
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | A vertical slider takes its length from its CSS height |
| `topToBottom` | `boolean` | `false` | A vertical slider's minimum at the top instead of the bottom |
| `insetIcon` | `string` | `undefined` | SVG markup for an icon inside the track: standard sliders at M, L and XL |
| `insetIconAtMin` | `string` | `undefined` | The inset icon shown at the minimum value, such as mute for volume |
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
| `getSize()` | none | `SliderSize` | Gets the size as it was set: a size name, or a track height in pixels |
| `showTicks(show)` | `show: boolean` | `SliderComponent` | Shows or hides tick marks |
| `showCurrentValue(show)` | `show: boolean` | `SliderComponent` | Shows or hides value bubble during interaction |

### Label and Icon Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setLabel(text)` | `text: string` | `SliderComponent` | Sets the label text |
| `getLabel()` | none | `string` | Gets the label text |
| `setInsetIcon(icon, atMin?)` | `icon: string, atMin?: string` | `SliderComponent` | Sets the inset icon, and optionally the one at the minimum; `''` removes it |
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

### Inset Icon

M3 Expressive sliders at size M, L or XL can carry an icon inside the track that shows what the slider controls. It sits at the start of the active track and moves onto the inactive track when the active one is too short to hold it. Only standard sliders take one: not range, not centered.

```javascript
const volume = createSlider({
  size: 'M',
  value: 40,
  insetIcon: volumeUpSvg,       // 24px on M and L, 32px on XL
  insetIconAtMin: volumeOffSvg, // shown at the minimum
  ariaLabel: 'Volume'
});
```

### Vertical Sliders

A vertical slider runs from the bottom up, and takes its length from its height. Use standard or centered sliders vertically; the guidelines advise against vertical range sliders.

```javascript
const level = createSlider({ orientation: 'vertical', size: 'L', value: 60 });
level.element.style.height = '240px';

// Minimum at the top instead
const drop = createSlider({ orientation: 'vertical', topToBottom: true });
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

The Slider is built by piping features onto a base component:

```javascript
const slider = pipe(
  createBase,                     // the base component
  withEvents(),                   // event emitter
  withElement(elementConfig),     // the root element and its classes
  withRange(config),              // the second handle, for range sliders
  withDom(config),                // container, handles and value indicators
  withTextLabel(config),          // optional visible label
  withIcon(config),               // optional icon beside the slider
  withLifecycle(),                // destroy and cleanup
  withStates(config),             // disabled state and appearance
  withTracks(config),             // track, stops, ticks and inset icon
  withController(config, get),    // values, keyboard, pointer and rendering
)(config);
```

`withAPI` then wraps the result in the public API. The track is decorative DOM (`aria-hidden`); the handles are real elements with the slider role.

## Rendering and Motion

The track is drawn with a few decorative DOM elements (`aria-hidden`) under handles that stay real, focusable elements with slider semantics. The geometry follows Material Design 3:

- **Sizes**: track 16 / 24 / 40 / 56 / 96px and handle 44 / 44 / 52 / 68 / 108px for XS–XL; outer track corners 8 / 8 / 12 / 16 / 28px, inside corners 2px.
- **Handle**: 4px wide, narrowing to 2px while pressed or focused. The track keeps a 6px gap from the handle's edge.
- **Colors**: the active track, handle and stop indicators take the slider color; the inactive track takes its container color (`secondary-container` for primary).
- **Stop indicators**: a dot ends every inactive track, so centered and range sliders carry one at each end. With `ticks`, stops mark every step, and a discrete slider insets its interior steps by the corner radius.
- **Value indicator**: inverse surface, 48×44px, 12px beyond the handle. It grows out of the handle and shrinks back into it.
- **Motion**: a value change that doesn't follow the pointer (a tap on the track, a key, `setValue()`) settles on the M3 Expressive default spatial spring. A drag follows the pointer, and layout changes (the first render, a resize) never animate.

Per-slider colors can be overridden in CSS with `--mtrl-slider-color`, `--mtrl-slider-container-color` and `--mtrl-slider-on-color`.

## Accessibility

- Each handle is an element with `role="slider"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, and `aria-valuetext` when a `valueFormatter` is set.
- `aria-orientation` follows `orientation`.
- On a range slider each handle's limit is the other handle: the first handle's `aria-valuemax` is the second value, and the second handle's `aria-valuemin` is the first.
- `aria-disabled` and `tabindex="-1"` when disabled.
- Focus narrows the handle and shows the value indicator.

### Keyboard Navigation

| Keys | Action |
|------|--------|
| Arrows along the track | One step in the direction of the track as drawn: `Right` raises, except in right-to-left layouts; `Up` raises on a vertical slider, except with `topToBottom` |
| Arrows across the track | `Up` / `Right` raise, `Down` / `Left` lower |
| `Shift` + arrows | Ten steps |
| `Page Up` / `Page Down` | A tenth of the steps, between one and ten of them |
| `Home` / `End` | The minimum / maximum, or the other handle on a range slider |
| `Tab` | Moves between the handles of a range slider |

Range handles never cross: keys, dragging and `setValue()` / `setSecondValue()` stop a handle at the other one.

### Screen Reader Support

```html
<div class="mtrl-slider mtrl-slider--range">
  <div class="mtrl-slider__container">
    <div class="mtrl-slider__visual" aria-hidden="true"><!-- track, stops, ticks --></div>
    <div class="mtrl-slider__handle" role="slider" aria-valuemin="0" aria-valuemax="75"
         aria-valuenow="25" aria-orientation="horizontal" tabindex="0"></div>
    <div class="mtrl-slider__handle" role="slider" aria-valuemin="25" aria-valuemax="100"
         aria-valuenow="75" aria-orientation="horizontal" tabindex="0"></div>
  </div>
</div>
```

## CSS Customization

The slider's classes follow BEM:

```css
.mtrl-slider { }                    /* root */
.mtrl-slider__label { }             /* visible label */
.mtrl-slider__icon { }              /* icon beside the slider */
.mtrl-slider__container { }         /* holds the track and the handles */
.mtrl-slider__track { }             /* clips the outer corners */
.mtrl-slider__segment { }           /* a piece of track; --active for the active one */
.mtrl-slider__ticks { }             /* stops; --active on the active track */
.mtrl-slider__dot { }               /* stop indicator at an end; --start at the start */
.mtrl-slider__inset-icon { }        /* --inactive when on the inactive track */
.mtrl-slider__handle { }            /* --focused while focused */
.mtrl-slider__value { }             /* value indicator; --visible while shown */

/* Modifiers on the root */
.mtrl-slider--range, .mtrl-slider--centered, .mtrl-slider--vertical { }
.mtrl-slider--s, .mtrl-slider--m, .mtrl-slider--l, .mtrl-slider--xl { }   /* XS adds none */
.mtrl-slider--secondary, .mtrl-slider--tertiary, .mtrl-slider--error { }   /* primary adds none */
.mtrl-slider--disabled, .mtrl-slider--discrete { }
.mtrl-slider--dragging { }          /* while a handle is dragged */
.mtrl-slider--settling { }          /* while a value change settles on its spring */
```

### CSS Custom Properties

Override the colors of one slider without a new theme:

```css
.volume {
  --mtrl-slider-color: #006a6a;            /* active track, handle, stops */
  --mtrl-slider-container-color: #cce8e7;  /* inactive track, ticks on the active track */
  --mtrl-slider-on-color: #ffffff;         /* ticks on the active track only */
}
```

The rest comes from the theme's color roles (`--mtrl-sys-color-*`).

## Browser Support

Any current browser with CSS custom properties, `ResizeObserver` and ES2020. The spring motion uses the CSS `linear()` easing function; where it is missing, the value change still happens, without the overshoot.

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

```javascript
slider.setValue(150); // clamped to max
slider.setValue(-10); // clamped to min

// Range handles never cross: each stops at the other
rangeSlider.setSecondValue(60);
rangeSlider.setValue(80);  // stays at 60
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

The Material 3 update (mtrl #190, #193) changes how the slider looks and moves; the API only grew.

### What Changed
- Colors follow M3: the inactive track takes the container color (`secondary-container` for primary) instead of the primary color at low opacity.
- The handle keeps a 6px gap from the track, narrows to 2px when pressed or focused, and has no outline ring.
- Centered and range sliders carry a stop indicator at each end.
- The value indicator uses the inverse surface and grows out of the handle.
- A tap, a key or `setValue()` settles on a spring; the first render and a drag no longer animate.
- Range handles stop at each other instead of swapping; `Page Up` / `Page Down` move a tenth of the steps.
- Right-to-left layouts are supported.

### What Is New
- `orientation: 'vertical'` and `topToBottom`
- `insetIcon`, `insetIconAtMin` and `setInsetIcon()`
- `--mtrl-slider-container-color`

### Updating Your Code
No code changes are needed. Styles that targeted the old unprefixed element classes (`.mtrl-slider-handle`, `.mtrl-slider-value`) should use the BEM ones above.
