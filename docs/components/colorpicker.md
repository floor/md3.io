# ColorPicker Component

The ColorPicker component provides an intuitive interface for selecting colors with support for HSV area selection, hue slider, opacity control, hex input, color swatches, and an eyedropper/pipette tool. It supports inline, dropdown, and dialog display variants for flexible integration into any application.

## Overview

Color pickers are commonly used for:

- Theme customization and personalization settings
- Design tools and graphic editors
- Form inputs requiring color selection
- Style configuration in applications
- Brand color management
- Background and text color controls
- Image color sampling with pipette tool

The component follows Material Design 3 guidelines with support for different sizes, display variants, density modes, opacity control, and comprehensive color format handling (hex, RGB, HSV).

## Import

```javascript
import { createColorPicker } from 'mtrl-addons';
```

## Basic Usage

```javascript
// Create an inline color picker
const picker = createColorPicker({
  value: '#ff5722',
  onChange: (color) => console.log('Selected:', color)
});

// Add to your page
document.querySelector('.controls').appendChild(picker.element);

// Update color programmatically
picker.setValue('#2196f3');

// Listen for color changes
picker.on('change', (color) => {
  document.body.style.backgroundColor = color;
});
```

## Configuration

The ColorPicker component accepts the following configuration options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `value` | `string` | `'#ff0000'` | Initial color value (hex format) |
| `variant` | `'inline' \| 'dropdown' \| 'dialog'` | `'inline'` | Display variant |
| `trigger` | `HTMLElement` | `undefined` | Trigger element for dropdown/dialog variants |
| `closeOnSelect` | `boolean` | `true` | Close on swatch select (dropdown/dialog) |
| `showArea` | `boolean` | `true` | Show the saturation/brightness area |
| `showHue` | `boolean` | `true` | Show the hue slider |
| `showOpacity` | `boolean` | `false` | Show the opacity/alpha slider |
| `opacity` | `number` | `1` | Initial opacity value (0-1) |
| `showInput` | `boolean` | `true` | Show the hex input field |
| `inputLabel` | `string` | `'Hex'` | Label for the input field |
| `showPreview` | `boolean` | `true` | Show the color preview square |
| `showSwatches` | `boolean` | `true` | Show the swatches row |
| `showPipette` | `boolean` | `true` | Show the pipette/eyedropper button (when supported) |
| `imageSource` | `HTMLImageElement \| string \| null` | `undefined` | Image source for canvas-based pipette sampling |
| `size` | `'s' \| 'm' \| 'l'` | `'m'` | Component size (s=200px, m=280px, l=360px) |
| `density` | `'default' \| 'compact'` | `'default'` | Layout density |
| `swatchSize` | `number` | `32` | Swatch size in pixels |
| `swatches` | `string[] \| ColorSwatch[]` | `undefined` | Predefined color swatches |
| `maxSwatches` | `number` | `8` | Maximum number of swatches |
| `disabled` | `boolean` | `false` | Whether the picker is disabled |
| `class` | `string` | `undefined` | Additional CSS class |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |
| `onChange` | `function` | `undefined` | Callback when color changes (committed) |
| `onInput` | `function` | `undefined` | Callback during selection (live preview) |
| `onPipetteStart` | `function` | `undefined` | Callback when pipette sampling starts |
| `onPipetteEnd` | `function` | `undefined` | Callback when pipette sampling ends |

## Component API

The ColorPicker component provides the following methods:

### Value Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getValue()` | none | `string` | Gets the current hex color value |
| `setValue(color)` | `color: string` | `ColorPickerComponent` | Sets the color from hex value |
| `getHSV()` | none | `HSVColor` | Gets the current HSV color object |
| `setHSV(hsv)` | `hsv: HSVColor` | `ColorPickerComponent` | Sets the color from HSV values |
| `getRGB()` | none | `RGBColor` | Gets the current RGB color object |
| `setRGB(rgb)` | `rgb: RGBColor` | `ColorPickerComponent` | Sets the color from RGB values |

### Opacity Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getOpacity()` | none | `number` | Gets the current opacity value (0-1) |
| `setOpacity(opacity)` | `opacity: number` | `ColorPickerComponent` | Sets the opacity value (0-1) |

### Swatch Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getSwatches()` | none | `ColorSwatch[]` | Gets all current swatches |
| `setSwatches(swatches)` | `swatches: string[] \| ColorSwatch[]` | `ColorPickerComponent` | Sets the swatches array |
| `addSwatch(color, label?)` | `color: string, label?: string` | `ColorPickerComponent` | Adds a new swatch |
| `removeSwatch(color)` | `color: string` | `ColorPickerComponent` | Removes a swatch by color |
| `clearSwatches()` | none | `ColorPickerComponent` | Removes all swatches |

### State Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `enable()` | none | `ColorPickerComponent` | Enables the picker |
| `disable()` | none | `ColorPickerComponent` | Disables the picker |
| `isDisabled()` | none | `boolean` | Checks if the picker is disabled |

### Popup Methods (dropdown/dialog variants)

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `open()` | none | `ColorPickerComponent` | Opens the picker |
| `close()` | none | `ColorPickerComponent` | Closes the picker |
| `toggle()` | none | `ColorPickerComponent` | Toggles open/closed state |
| `isOpen()` | none | `boolean` | Checks if the picker is open |

### Pipette Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `pickColor()` | none | `Promise<string \| null>` | Starts pipette sampling and returns picked color |
| `setImageSource(source)` | `source: HTMLImageElement \| string \| null` | `ColorPickerComponent` | Sets image source for canvas-based sampling |
| `isSampling()` | none | `boolean` | Checks if pipette is currently sampling |

### Event Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `on(event, handler)` | `event: string, handler: Function` | `ColorPickerComponent` | Adds an event listener |
| `off(event, handler)` | `event: string, handler: Function` | `ColorPickerComponent` | Removes an event listener |

### Lifecycle Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `destroy()` | none | `void` | Destroys the component and cleans up |

## Events

The ColorPicker component emits the following events:

| Event | Description | Data |
|-------|-------------|------|
| `change` | Fires when color value is committed | `color: string` (hex) |
| `input` | Fires during color selection (live preview) | `color: string` (hex) |
| `swatchSelect` | Fires when a swatch is clicked | `color: string` (hex) |
| `swatchesChange` | Fires when swatches array changes | `swatches: ColorSwatch[]` |
| `open` | Fires when picker opens (dropdown/dialog) | none |
| `close` | Fires when picker closes (dropdown/dialog) | none |

## Color Formats

### HSVColor Interface

```javascript
{
  h: number,  // Hue (0-360)
  s: number,  // Saturation (0-100)
  v: number   // Value/Brightness (0-100)
}
```

### RGBColor Interface

```javascript
{
  r: number,  // Red (0-255)
  g: number,  // Green (0-255)
  b: number   // Blue (0-255)
}
```

### ColorSwatch Interface

```javascript
{
  color: string,      // Hex color value
  label?: string,     // Optional tooltip label
  selected?: boolean  // Whether selected
}
```

## Examples

### Inline Color Picker

```javascript
// Basic inline picker - always visible
const picker = createColorPicker({
  value: '#ff5722',
  swatches: ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5'],
  onChange: (color) => {
    console.log('Color changed:', color);
    preview.style.backgroundColor = color;
  }
});

container.appendChild(picker.element);
```

### Dropdown Color Picker

```javascript
// Dropdown variant - opens on trigger click
const colorButton = document.getElementById('color-button');

const dropdown = createColorPicker({
  variant: 'dropdown',
  trigger: colorButton,
  value: '#2196f3',
  onChange: (color) => {
    colorButton.style.backgroundColor = color;
  }
});

// The picker will position itself relative to the trigger
document.body.appendChild(dropdown.element);
```

### Dialog Color Picker

```javascript
// Dialog variant - modal overlay
const dialogPicker = createColorPicker({
  variant: 'dialog',
  trigger: document.getElementById('open-picker'),
  value: '#4caf50',
  size: 'l',
  onChange: (color) => {
    applyThemeColor(color);
  }
});

document.body.appendChild(dialogPicker.element);
```

### Keep Picker Open on Swatch Select

```javascript
// By default, dropdown/dialog pickers close when a swatch is selected.
// Set closeOnSelect to false to keep the picker open.
const picker = createColorPicker({
  variant: 'dropdown',
  trigger: document.getElementById('color-trigger'),
  value: '#ff5722',
  closeOnSelect: false,  // Keep picker open when selecting swatches
  swatches: ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5'],
  onChange: (color) => {
    // User can continue selecting different swatches
    // without the picker closing each time
    preview.style.backgroundColor = color;
  }
});

// User must explicitly close the picker (click outside, press Escape, or call close())
```

### Different Sizes

```javascript
// Small picker (200px wide)
const smallPicker = createColorPicker({
  size: 's',
  value: '#ff9800'
});

// Medium picker (280px wide) - default
const mediumPicker = createColorPicker({
  size: 'm',
  value: '#03a9f4'
});

// Large picker (360px wide)
const largePicker = createColorPicker({
  size: 'l',
  value: '#8bc34a'
});
```

### Compact Density

```javascript
// Compact layout - minimal spacing, hue bar directly under area
const compactPicker = createColorPicker({
  value: '#673ab7',
  density: 'compact',
  showInput: false,
  showPreview: false
});

// Default density with standard spacing
const defaultPicker = createColorPicker({
  value: '#673ab7',
  density: 'default'
});
```

### With Opacity Slider

```javascript
// Enable opacity/alpha selection
const picker = createColorPicker({
  value: '#ff5722',
  showOpacity: true,
  opacity: 0.8,
  onChange: (color) => {
    const opacity = picker.getOpacity();
    element.style.backgroundColor = color;
    element.style.opacity = String(opacity);
  }
});

// Get and set opacity programmatically
const currentOpacity = picker.getOpacity();
picker.setOpacity(0.5);
```

### Pipette/Eyedropper Tool

```javascript
// With native EyeDropper API (Chrome, Edge)
const picker = createColorPicker({
  value: '#2196f3',
  showPipette: true,
  onPipetteStart: () => {
    console.log('Started color sampling');
  },
  onPipetteEnd: (color) => {
    if (color) {
      console.log('Picked color:', color);
    } else {
      console.log('Sampling cancelled');
    }
  }
});

// Programmatically trigger pipette
const pickedColor = await picker.pickColor();

// With image source for canvas-based fallback
const imagePicker = createColorPicker({
  value: '#ff5722',
  showPipette: true,
  imageSource: document.getElementById('my-image')
});

// Change image source dynamically
picker.setImageSource('/path/to/image.jpg');
picker.setImageSource(imageElement);
```

### Swatches Only Picker

```javascript
// Minimal picker with only swatches
const swatchPicker = createColorPicker({
  variant: 'dropdown',
  trigger: myButton,
  showArea: false,
  showHue: false,
  showInput: false,
  showPreview: false,
  swatches: [
    '#f44336', '#e91e63', '#9c27b0', '#673ab7',
    '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4'
  ],
  onChange: (color) => {
    selectedColor = color;
  }
});
```

### Working with Color Formats

```javascript
const picker = createColorPicker({
  value: '#ff5722'
});

// Get color in different formats
const hex = picker.getValue();     // '#ff5722'
const hsv = picker.getHSV();       // { h: 14, s: 86, v: 100 }
const rgb = picker.getRGB();       // { r: 255, g: 87, b: 34 }

// Set color from different formats
picker.setValue('#2196f3');                    // From hex
picker.setHSV({ h: 207, s: 90, v: 96 });       // From HSV
picker.setRGB({ r: 33, g: 150, b: 243 });      // From RGB
```

### Managing Swatches

```javascript
const picker = createColorPicker({
  value: '#607d8b',
  maxSwatches: 10
});

// Add swatches dynamically
picker.addSwatch('#ff5722', 'Orange');
picker.addSwatch('#4caf50', 'Green');

// Set all swatches at once
picker.setSwatches([
  { color: '#f44336', label: 'Red' },
  { color: '#2196f3', label: 'Blue' },
  { color: '#4caf50', label: 'Green' }
]);

// Remove a specific swatch
picker.removeSwatch('#f44336');

// Get current swatches
const swatches = picker.getSwatches();

// Clear all swatches
picker.clearSwatches();
```

### Live Preview with Input Event

```javascript
const picker = createColorPicker({
  value: '#673ab7',
  onInput: (color) => {
    // Live preview during drag
    previewElement.style.backgroundColor = color;
  },
  onChange: (color) => {
    // Final value when released
    saveColor(color);
  }
});
```

### Programmatic Open/Close

```javascript
const picker = createColorPicker({
  variant: 'dropdown',
  trigger: triggerButton
});

// Open programmatically
openButton.addEventListener('click', () => {
  picker.open();
});

// Close programmatically
closeButton.addEventListener('click', () => {
  picker.close();
});

// Toggle
toggleButton.addEventListener('click', () => {
  picker.toggle();
});

// Check state
if (picker.isOpen()) {
  console.log('Picker is open');
}
```

### Theme Color Selector

```javascript
const themeColors = createColorPicker({
  value: document.documentElement.style.getPropertyValue('--primary-color') || '#6200ee',
  swatches: [
    '#6200ee', '#03dac6', '#ff0266', '#ff5722',
    '#4caf50', '#2196f3', '#9c27b0', '#607d8b'
  ],
  onChange: (color) => {
    document.documentElement.style.setProperty('--primary-color', color);
    localStorage.setItem('theme-color', color);
  }
});
```

### Form Integration

```javascript
const form = document.querySelector('form');
const hiddenInput = document.createElement('input');
hiddenInput.type = 'hidden';
hiddenInput.name = 'selectedColor';

const picker = createColorPicker({
  value: hiddenInput.value || '#000000',
  onChange: (color) => {
    hiddenInput.value = color;
  }
});

form.appendChild(hiddenInput);
form.appendChild(picker.element);

// On form submit, hiddenInput.value contains the selected color
```

### Disabled State

```javascript
const picker = createColorPicker({
  value: '#9e9e9e',
  disabled: true
});

// Enable later
enableButton.addEventListener('click', () => {
  picker.enable();
});

// Disable again
disableButton.addEventListener('click', () => {
  picker.disable();
});

// Check state
if (picker.isDisabled()) {
  console.log('Picker is disabled');
}
```

### Image Color Extraction

```javascript
// Create picker for extracting colors from an image
const imagePicker = createColorPicker({
  variant: 'dropdown',
  trigger: extractButton,
  showPipette: true,
  imageSource: '/uploads/user-image.jpg',
  onPipetteEnd: (color) => {
    if (color) {
      // Add picked color to swatches
      imagePicker.addSwatch(color, 'From image');
    }
  }
});

// Update when image changes
imageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    imagePicker.setImageSource(url);
  }
});
```

## Functional Composition

The ColorPicker component is built using functional composition, combining multiple features:

### Core Features

- **Base Component**: Provides foundation with state management and event system
- **Area Feature (`withArea`)**: Saturation/brightness gradient area with draggable handle
- **Hue Feature (`withHue`)**: Hue slider for selecting color hue (0-360°)
- **Opacity Feature (`withOpacity`)**: Alpha slider with checkerboard background
- **Input Feature (`withInput`)**: Hex input field and color preview
- **Swatches Feature (`withSwatches`)**: Preset color swatches management
- **Variant Feature (`withVariant`)**: Dropdown/dialog positioning and backdrop
- **Pipette Feature (`withPipette`)**: Eyedropper tool with native and canvas fallback

### How Composition Works

```javascript
const colorPicker = pipe(
  createBase,                  // Start with base
  withEvents(),                // Add event system
  withElement(config),         // Create DOM element
  withDisabled(config),        // Add disabled state
  withVariant(config),         // Add popup support (if needed)
  withArea(config),            // Add saturation/brightness area
  withHue(config),             // Add hue slider
  withOpacity(config),         // Add opacity slider (if enabled)
  withInput(config),           // Add hex input
  withSwatches(config),        // Add color swatches
  withPipette(config),         // Add pipette tool (if supported)
  withLifecycle(),             // Add lifecycle management
  comp => withAPI(config)(comp) // Apply public API
)(config);
```

This composition pattern allows for:
- Modular, testable code
- Clean separation of concerns
- Configurable feature inclusion
- Lightweight bundles (tree-shaking friendly)
- Easy extension

## Visual Components

### Saturation/Brightness Area

The main color area displays a gradient combining:
- Horizontal axis: Saturation (0% left to 100% right)
- Vertical axis: Value/Brightness (100% top to 0% bottom)
- Background: Current hue at full saturation

### Hue Slider

Horizontal slider displaying the full hue spectrum (0-360°):
- Drag to select base hue
- Saturation and brightness preserved during hue changes

### Opacity Slider

Horizontal slider with checkerboard background (when enabled):
- Transparent (0%) on left to solid (100%) on right
- Gradient shows current color from transparent to opaque
- Checkerboard pattern indicates transparency level

### Color Preview

Square showing the currently selected color with:
- Visual feedback during selection
- Contrasting border for visibility

### Hex Input

Text input for direct hex color entry:
- Validates input format
- Supports 3 and 6 character hex codes
- Auto-normalizes format

### Swatches

Row of preset color buttons:
- Click to select color
- Visual indicator for current selection
- Optional tooltip labels

### Pipette Button

Eyedropper tool for color sampling:
- Uses native EyeDropper API when available (Chrome, Edge)
- Falls back to canvas-based sampling when image source provided
- Click to start sampling, click again or Escape to cancel

## CSS Customization

### CSS Classes

| Class | Description |
|-------|-------------|
| `.mtrl-colorpicker` | Root element |
| `.mtrl-colorpicker--inline` | Inline variant |
| `.mtrl-colorpicker--dropdown` | Dropdown variant |
| `.mtrl-colorpicker--dialog` | Dialog variant |
| `.mtrl-colorpicker--compact` | Compact density mode |
| `.mtrl-colorpicker--disabled` | Disabled state |
| `.mtrl-colorpicker--dragging` | Active drag state |
| `.mtrl-colorpicker--open` | Open state (popup variants) |
| `.mtrl-colorpicker--position-top` | Dropdown positioned above trigger |
| `.mtrl-colorpicker__container` | Container for popup variants |
| `.mtrl-colorpicker__backdrop` | Dialog backdrop |
| `.mtrl-colorpicker__area` | Saturation/brightness area |
| `.mtrl-colorpicker__area-gradient` | Area gradient overlay |
| `.mtrl-colorpicker__area-handle` | Area selection handle |
| `.mtrl-colorpicker__hue` | Hue slider container |
| `.mtrl-colorpicker__hue-slider` | Hue gradient track |
| `.mtrl-colorpicker__hue-handle` | Hue selection handle |
| `.mtrl-colorpicker__opacity` | Opacity slider container |
| `.mtrl-colorpicker__opacity-checkerboard` | Transparency checkerboard |
| `.mtrl-colorpicker__opacity-track` | Opacity gradient track |
| `.mtrl-colorpicker__opacity-handle` | Opacity selection handle |
| `.mtrl-colorpicker__swatches` | Swatches container |
| `.mtrl-colorpicker__swatch` | Individual swatch button |
| `.mtrl-colorpicker__swatch--selected` | Selected swatch |
| `.mtrl-colorpicker__swatch--add` | Add swatch button |
| `.mtrl-colorpicker__preview` | Color preview square |
| `.mtrl-colorpicker__value` | Value display container |
| `.mtrl-colorpicker__value-input` | Hex input field |

### CSS Custom Properties

```css
:root {
  /* Size dimensions */
  --mtrl-colorpicker-width-s: 200px;
  --mtrl-colorpicker-width-m: 280px;
  --mtrl-colorpicker-width-l: 360px;
  
  /* Area heights */
  --mtrl-colorpicker-area-height-s: 120px;
  --mtrl-colorpicker-area-height-m: 160px;
  --mtrl-colorpicker-area-height-l: 200px;
  
  /* Handle size */
  --mtrl-colorpicker-handle-size: 20px;
  
  /* Hue slider height */
  --mtrl-colorpicker-hue-height-s: 16px;
  --mtrl-colorpicker-hue-height-m: 20px;
  --mtrl-colorpicker-hue-height-l: 24px;
  
  /* Opacity slider height */
  --mtrl-colorpicker-opacity-height: 20px;
  
  /* Swatch sizes */
  --mtrl-colorpicker-swatch-size-s: 24px;
  --mtrl-colorpicker-swatch-size-m: 32px;
  --mtrl-colorpicker-swatch-size-l: 40px;
  
  /* Border radius */
  --mtrl-colorpicker-border-radius: 8px;
  
  /* Popup shadow */
  --mtrl-colorpicker-popup-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  
  /* Backdrop opacity */
  --mtrl-colorpicker-backdrop-opacity: 0.5;
  
  /* Spacing */
  --mtrl-colorpicker-gap: 12px;
  --mtrl-colorpicker-gap-compact: 0px;
}
```

## Accessibility

The ColorPicker component includes comprehensive accessibility features:

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move focus between elements |
| `Arrow Keys` | Adjust values in area/sliders |
| `Shift + Arrow Keys` | Larger adjustments (10x step) |
| `Home` | Set to minimum value |
| `End` | Set to maximum value |
| `Enter/Space` | Select swatch, open/close popup |
| `Escape` | Close popup (dropdown/dialog), cancel pipette |

### ARIA Attributes

- `role="slider"` on area, hue, and opacity controls
- `role="application"` on root element
- `aria-valuenow`, `aria-valuemin`, `aria-valuemax` for slider values
- `aria-label` on all interactive elements
- `aria-expanded` on popup triggers
- `aria-disabled` when disabled

### Screen Reader Support

```html
<!-- Example rendered structure -->
<div class="mtrl-colorpicker" role="application" aria-label="Color picker">
  <div class="mtrl-colorpicker__area" role="slider" 
       aria-label="Saturation and brightness"
       aria-valuenow="50" aria-valuemin="0" aria-valuemax="100"
       tabindex="0">
    <div class="mtrl-colorpicker__area-handle"></div>
  </div>
  <div class="mtrl-colorpicker__hue" role="slider"
       aria-label="Hue"
       aria-valuenow="180" aria-valuemin="0" aria-valuemax="360"
       tabindex="0">
    <div class="mtrl-colorpicker__hue-handle"></div>
  </div>
  <div class="mtrl-colorpicker__opacity" role="slider"
       aria-label="Opacity"
       aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"
       tabindex="0">
    <div class="mtrl-colorpicker__opacity-handle"></div>
  </div>
  <input class="mtrl-colorpicker__value-input" 
         type="text" 
         aria-label="Hex color value">
  <button class="mtrl-colorpicker__pipette"
          aria-label="Pick color from screen">
  </button>
</div>
```

## Performance Considerations

### Optimization Features

- **Efficient DOM updates**: Only updates changed elements
- **Throttled input events**: Limits callback frequency during drag
- **Lazy popup creation**: Popup elements created on first open
- **Event delegation**: Swatches use event delegation
- **Canvas sampling**: Efficient image color extraction with cached canvas
- **Pointer capture**: Smooth dragging without lost events

### Best Practices

- Use `onChange` for final values, `onInput` sparingly for live preview
- Limit swatches to reasonable count (8-12 max)
- Destroy unused picker instances to free resources
- For multiple pickers, consider using dropdown/dialog variants
- Use compact density for space-constrained layouts
- Preload images for pipette canvas sampling

## Browser Support

The ColorPicker component supports all modern browsers:

| Browser | Version | Notes |
|---------|---------|-------|
| Chrome | 60+ | Full support including native EyeDropper API (91+) |
| Firefox | 55+ | Canvas-based pipette fallback |
| Safari | 12+ | Canvas-based pipette fallback |
| Edge | 79+ | Full support including native EyeDropper API (91+) |

### Feature Detection

```javascript
import { isEyeDropperSupported } from 'mtrl-addons';

if (isEyeDropperSupported()) {
  console.log('Native EyeDropper API available');
} else {
  console.log('Using canvas-based fallback');
}
```

## Best Practices

### When to Use Color Pickers

- ✅ Theme and appearance customization
- ✅ Design tools requiring precise color selection
- ✅ Forms with color input requirements
- ✅ Settings panels with color options
- ✅ Image color extraction workflows

### When to Use Alternatives

- ❌ Simple preset selection → Use buttons/radio
- ❌ Binary color choice → Use toggle/switch
- ❌ Themed color options → Use select dropdown

### Design Guidelines

- Provide meaningful default colors
- Include commonly used swatches for quick selection
- Show real-time preview of selected color
- Consider colorblind users with labels/tooltips
- Use appropriate variant for context (inline for always-visible, dropdown for space-saving)
- Use compact density when space is limited

### Interaction Guidelines

- Allow both drag selection and direct hex input
- Provide immediate visual feedback
- Close dropdown on outside click
- Preserve last selected color for undo
- Show opacity checkerboard to indicate transparency

## Error Handling

The component handles edge cases gracefully:

```javascript
// Invalid hex values are ignored
picker.setValue('invalid');  // No change
picker.setValue('#gg0000');  // No change

// Valid formats are normalized
picker.setValue('#fff');     // Becomes '#ffffff'
picker.setValue('00ff00');   // Becomes '#00ff00'

// HSV/RGB values are clamped
picker.setHSV({ h: 400, s: 150, v: -10 });
// Clamped to { h: 360, s: 100, v: 0 }

// Opacity values are clamped
picker.setOpacity(1.5);  // Clamped to 1
picker.setOpacity(-0.5); // Clamped to 0

// Pipette returns null if cancelled
const color = await picker.pickColor();
if (color === null) {
  console.log('User cancelled pipette');
}
```

## TypeScript Support

Full TypeScript definitions are included:

```typescript
import { 
  createColorPicker, 
  ColorPickerConfig, 
  ColorPickerComponent,
  HSVColor,
  RGBColor,
  ColorSwatch,
  isEyeDropperSupported
} from 'mtrl-addons';

const config: ColorPickerConfig = {
  value: '#ff5722',
  variant: 'dropdown',
  size: 'm',
  density: 'default',
  showOpacity: true,
  opacity: 1,
  showPipette: true,
  swatches: ['#f44336', '#2196f3', '#4caf50'],
  onChange: (color: string) => {
    console.log(color);
  },
  onPipetteEnd: (color: string | null) => {
    if (color) console.log('Picked:', color);
  }
};

const picker: ColorPickerComponent = createColorPicker(config);

// Fully typed methods
const hex: string = picker.getValue();
const hsv: HSVColor = picker.getHSV();
const rgb: RGBColor = picker.getRGB();
const opacity: number = picker.getOpacity();

// Async pipette method
const pickedColor: string | null = await picker.pickColor();
```

## Exported Utilities

The colorpicker module exports useful color conversion utilities:

```typescript
import {
  // Color conversion
  hsvToRgb,
  rgbToHsv,
  hsvToHex,
  hexToHsv,
  rgbToHex,
  hexToRgb,
  
  // Validation
  isValidHex,
  normalizeHex,
  
  // Utilities
  getContrastColor,
  clamp,
  
  // Feature detection
  isEyeDropperSupported
} from 'mtrl-addons';

// Convert between formats
const rgb = hsvToRgb(180, 50, 100);        // { r: 128, g: 255, b: 255 }
const hsv = rgbToHsv(255, 128, 0);         // { h: 30, s: 100, v: 100 }
const hex = rgbToHex(255, 128, 0);         // '#ff8000'

// Validate and normalize
isValidHex('#f00');                         // true
isValidHex('invalid');                      // false
normalizeHex('#f00');                       // '#ff0000'
normalizeHex('abc');                        // '#aabbcc'

// Get contrasting text color
getContrastColor('#ffffff');                // '#000000'
getContrastColor('#000000');                // '#ffffff'

// Clamp values
clamp(150, 0, 100);                         // 100
clamp(-10, 0, 100);                         // 0
```

## Constants

```typescript
import {
  COLORPICKER_EVENTS,
  COLORPICKER_SIZES,
  COLORPICKER_VARIANTS,
  COLORPICKER_DENSITIES,
  COLORPICKER_CLASSES,
  COLORPICKER_DEFAULTS,
  SWATCH_SIZES,
  SIZE_DIMENSIONS
} from 'mtrl-addons';

// Event names
COLORPICKER_EVENTS.CHANGE;        // 'change'
COLORPICKER_EVENTS.INPUT;         // 'input'
COLORPICKER_EVENTS.SWATCH_SELECT; // 'swatchSelect'
COLORPICKER_EVENTS.SWATCHES_CHANGE; // 'swatchesChange'
COLORPICKER_EVENTS.OPEN;          // 'open'
COLORPICKER_EVENTS.CLOSE;         // 'close'

// Size variants
COLORPICKER_SIZES.S;              // 's'
COLORPICKER_SIZES.M;              // 'm'
COLORPICKER_SIZES.L;              // 'l'

// Variants
COLORPICKER_VARIANTS.INLINE;      // 'inline'
COLORPICKER_VARIANTS.DROPDOWN;    // 'dropdown'
COLORPICKER_VARIANTS.DIALOG;      // 'dialog'

// Density modes
COLORPICKER_DENSITIES.DEFAULT;    // 'default'
COLORPICKER_DENSITIES.COMPACT;    // 'compact'

// Size dimensions (width, areaHeight, hueHeight)
SIZE_DIMENSIONS.s;  // { width: 200, areaHeight: 120, hueHeight: 16 }
SIZE_DIMENSIONS.m;  // { width: 280, areaHeight: 160, hueHeight: 20 }
SIZE_DIMENSIONS.l;  // { width: 360, areaHeight: 200, hueHeight: 24 }
```