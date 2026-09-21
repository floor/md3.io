# Button Component

The Button component provides a Material Design 3 compliant button control that allows users to perform actions with a single tap or click. It's designed to be lightweight, accessible, and highly customizable to fit various UI contexts.

## Overview

Buttons are commonly used for:

- Submitting forms
- Triggering actions
- Navigation
- Dialog controls
- Toolbars and action menus

The component follows Material Design 3 guidelines with support for various variants (filled, outlined, text, etc.), shapes, icons, disabled states, progress indicators, and ripple effects.

## Import

```javascript
import { createButton } from 'mtrl';
```

## Basic Usage

```javascript
// Create a basic button
const submitButton = createButton({
  text: 'Submit',
  variant: 'filled'
});

// Add to your page
document.querySelector('.form-actions').appendChild(submitButton.element);

// Listen for clicks
submitButton.on('click', () => {
  console.log('Button clicked');
});
```

## Configuration

The Button component accepts the following configuration options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `variant` | `string` | `'filled'` | Visual style of the button (filled, outlined, text, elevated, tonal) |
| `size` | `string` | `'s'` | Size of the button (xs, s, m, l, xl) |
| `shape` | `string` | `'round'` | Shape of the button (round, square) |
| `disabled` | `boolean` | `false` | Whether the button is initially disabled |
| `text` | `string` | `undefined` | Text content displayed inside the button |
| `icon` | `string` | `undefined` | HTML content (typically SVG) for the button icon |
| `iconSize` | `string` | `undefined` | Accepted but not applied. The value is appended to a CSS class (`mtrl-icon--<value>`) rather than used as a length, and the stylesheet defines no such modifier, so it has no effect. Size the icon from your own CSS, or size the SVG itself |
| `class` | `string` | `undefined` | Additional CSS classes to add to the button |
| `value` | `string` | `undefined` | Button value attribute |
| `type` | `string` | `'button'` | Button type attribute (button, submit, reset) |
| `ripple` | `boolean` | `true` | Whether to enable ripple effect on interaction |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |
| `rippleConfig` | `object` | `undefined` | Configuration options for the ripple effect |
| `ariaLabel` | `string` | `undefined` | ARIA label for accessibility (important for icon-only buttons) |
| `progress` | `boolean\|object` | `undefined` | Progress indicator configuration |
| `showProgress` | `boolean` | `false` | Whether to show progress initially |

## Button Variants

The button supports 5 Material Design 3 variants:

- **`filled`** (default): Primary action button with solid background (high emphasis)
- **`tonal`**: Secondary action button with medium emphasis
- **`outlined`**: Button with outline border and transparent background
- **`elevated`**: Button with slight elevation/shadow
- **`text`**: Button that appears as text without background or border (low emphasis)

## Button Sizes

The button supports 5 different sizes following Material Design 3 specifications:

- **`xs`**: Extra small - 32px height
- **`s`**: Small - 40px height (default)
- **`m`**: Medium - 56px height
- **`l`**: Large - 96px height
- **`xl`**: Extra large - 136px height

## Button Shapes

The button supports 2 different shapes:

- **`round`** (default): Pill-shaped buttons with fully rounded corners
- **`square`**: Buttons with size-specific corner radius (small radius that scales with button size)

## Component API

The Button component provides the following methods:

### Value Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getValue()` | none | `string` | Gets the button's current value attribute |
| `setValue(value)` | `value: string` | `ButtonComponent` | Sets the button's value attribute |

### State Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `enable()` | none | `ButtonComponent` | Enables the button, making it interactive |
| `disable()` | none | `ButtonComponent` | Disables the button, making it non-interactive |
| `setActive(active)` | `active: boolean` | `ButtonComponent` | Sets the active state of the button (e.g., when a related menu is open) |

### Variant Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setVariant(variant)` | `variant: string` | `ButtonComponent` | Changes the button's visual style variant |
| `getVariant()` | none | `string` | Gets the button's current variant |

### Size Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setSize(size)` | `size: string` | `ButtonComponent` | Sets the button's size (xs, s, m, l, xl) |
| `getSize()` | none | `string` | Gets the button's current size |

### Shape Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setShape(shape)` | `shape: string` | `ButtonComponent` | Sets the button's shape (round, square) |
| `getShape()` | none | `string` | Gets the button's current shape |

### Content Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setText(content)` | `content: string` | `ButtonComponent` | Sets the button's text content |
| `getText()` | none | `string` | Gets the button's current text content |
| `setIcon(icon)` | `icon: string` | `ButtonComponent` | Sets the button's icon HTML content (empty string removes icon) |
| `getIcon()` | none | `string` | Gets the button's current icon HTML content |
| `hasIcon()` | none | `boolean` | Checks if the button has an icon |
| `setAriaLabel(label)` | `label: string` | `ButtonComponent` | Sets the button's aria-label attribute for accessibility |

### Progress Methods (when progress is configured)

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `showProgress()` | none | `Promise<ButtonComponent>` | Shows the progress indicator |
| `showProgressSync()` | none | `ButtonComponent` | Shows the progress indicator synchronously |
| `hideProgress()` | none | `Promise<ButtonComponent>` | Hides the progress indicator |
| `hideProgressSync()` | none | `ButtonComponent` | Hides the progress indicator synchronously |
| `setProgress(value)` | `value: number` | `Promise<ButtonComponent>` | Sets progress value (0-100) |
| `setProgressSync(value)` | `value: number` | `ButtonComponent` | Sets progress value synchronously |
| `setIndeterminate(indeterminate)` | `indeterminate: boolean` | `Promise<ButtonComponent>` | Sets indeterminate mode |
| `setIndeterminateSync(indeterminate)` | `indeterminate: boolean` | `ButtonComponent` | Sets indeterminate mode synchronously |
| `setLoading(loading, text?)` | `loading: boolean, text?: string` | `Promise<ButtonComponent>` | Shows progress and **disables** the button; restores the previous text on `false` unless new text is given |
| `setLoadingSync(loading, text?)` | `loading: boolean, text?: string` | `ButtonComponent` | The same, without awaiting the lazy progress import |

### Event Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `on(event, handler)` | `event: string, handler: Function` | `ButtonComponent` | Adds an event listener |
| `off(event, handler)` | `event: string, handler: Function` | `ButtonComponent` | Removes an event listener |

### Style Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `addClass(...classes)` | `...classes: string[]` | `ButtonComponent` | Adds CSS classes to the button element |

### Lifecycle Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `destroy()` | none | `void` | Destroys the button component and cleans up resources |

## Events

The Button component emits the following events:

| Event | Description | Data |
|-------|-------------|------|
| `click` | Fires when the button is clicked | `{ event, element, originalEvent }` |
| `focus` | Fires when the button receives focus | `{ event, element, originalEvent }` |
| `blur` | Fires when the button loses focus | `{ event, element, originalEvent }` |

`event` and `originalEvent` are the same DOM event; `element` is the button element. Handlers are not called while the button is disabled.

## Examples

### Basic Button Variants

```javascript
// Filled button (default)
const filledButton = createButton({
  text: 'Filled Button'
});

// Outlined button
const outlinedButton = createButton({
  text: 'Outlined Button',
  variant: 'outlined'
});

// Text button
const textButton = createButton({
  text: 'Text Button',
  variant: 'text'
});

// Elevated button
const elevatedButton = createButton({
  text: 'Elevated Button',
  variant: 'elevated'
});

// Tonal button
const tonalButton = createButton({
  text: 'Tonal Button',
  variant: 'tonal'
});
```

### Button Sizes

```javascript
// Extra small button
const xsButton = createButton({
  text: 'XS',
  size: 'xs'
});

// Small button (default)
const smallButton = createButton({
  text: 'Small'
});

// Medium button
const mediumButton = createButton({
  text: 'Medium',
  size: 'm'
});

// Large button
const largeButton = createButton({
  text: 'Large',
  size: 'l'
});

// Extra large button
const xlButton = createButton({
  text: 'Extra Large',
  size: 'xl'
});
```

### Button Shapes

```javascript
// Round button (default)
const roundButton = createButton({
  text: 'Round Button',
  shape: 'round'
});

// Square button
const squareButton = createButton({
  text: 'Square Button',
  shape: 'square'
});

// Square buttons work well with different sizes
const squareSmall = createButton({
  text: 'Small Square',
  shape: 'square',
  size: 's'
});

const squareLarge = createButton({
  text: 'Large Square',
  shape: 'square',
  size: 'l'
});
```

### Button with Icon

```javascript
const saveButton = createButton({
  text: 'Save',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3.5 7 8 15 8"></polyline></svg>'
});
```

### Icon-Only Button

```javascript
const addButton = createButton({
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
  ariaLabel: 'Add item'  // Important for accessibility
});
```

### Dynamic Icon Management

```javascript
const toggleButton = createButton({
  text: 'Toggle',
  icon: '▶️'
});

toggleButton.on('click', () => {
  if (toggleButton.hasIcon()) {
    // Remove the icon
    toggleButton.setIcon('');
  } else {
    // Add the icon back
    toggleButton.setIcon('⏸️');
  }
});
```

### Form Submit Button

```javascript
const submitButton = createButton({
  text: 'Submit',
  type: 'submit'
});

const form = document.querySelector('form');
form.appendChild(submitButton.element);
```

### Disabled Button

```javascript
const disabledButton = createButton({
  text: 'Not Available',
  disabled: true
});
```

### Button with Event Handling

```javascript
const actionButton = createButton({
  text: 'Load More'
});

actionButton.on('click', async () => {
  actionButton.disable();
  actionButton.setText('Loading...');
  
  try {
    await loadMoreItems();
    actionButton.setText('Load More');
  } catch (error) {
    console.error('Failed to load items:', error);
    actionButton.setText('Retry');
  } finally {
    actionButton.enable();
  }
});
```

### Dynamically Changing Button Properties

```javascript
const toggleButton = createButton({
  text: 'Normal State',
  variant: 'text',
  shape: 'round',
  size: 's'
});

toggleButton.on('click', () => {
  if (toggleButton.getVariant() === 'text') {
    toggleButton.setVariant('filled');
    toggleButton.setShape('square');
    toggleButton.setSize('m');
    toggleButton.setText('Active State');
  } else {
    toggleButton.setVariant('text');
    toggleButton.setShape('round');
    toggleButton.setSize('s');
    toggleButton.setText('Normal State');
  }
});
```

## Button Progress Feature

The button component includes built-in progress indicator support that is **lazily loaded** - meaning the progress component is only imported and initialized when actually used.

### Benefits

- **Zero overhead**: Buttons without progress configuration don't import any progress code
- **Automatic code splitting**: Progress component is dynamically imported only when needed
- **Seamless integration**: Progress appears as the button's icon
- **Flexible API**: Both synchronous and asynchronous methods available

### Basic Usage

#### Enable Progress

```typescript
// Simple boolean to enable with defaults
const button1 = createButton({
  text: 'Submit',
  progress: true  // Uses default circular progress
});

// Or with custom configuration
const button2 = createButton({
  text: 'Upload',
  progress: {
    variant: 'circular',
    size: 20,
    indeterminate: false
  }
});
```

#### Synchronous API (Recommended for UI)

For most UI interactions, use the synchronous methods:

```typescript
button.on('click', () => {
  // Show loading state
  button.setLoadingSync(true, 'Processing...');
  
  // Do async work
  fetch('/api/data')
    .then(response => {
      // Update progress
      button.setProgressSync(75);
      return response.json();
    })
    .then(data => {
      // Complete
      button.setLoadingSync(false, 'Success!');
    });
});
```

#### Asynchronous API

Use async methods when you need to ensure the progress is loaded:

```typescript
button.on('click', async () => {
  // This ensures progress is loaded before continuing
  await button.setLoading(true, 'Starting...');
  
  for (let i = 0; i <= 100; i += 10) {
    await button.setProgress(i);
    await delay(200);
  }
  
  await button.setLoading(false, 'Complete');
});
```

### Progress Configuration

When using `progress: true`, default configuration is applied:

```typescript
{
  variant: 'circular',
  size: 20,
  thickness: 2,
  indeterminate: true
}
```

For custom configuration:

```typescript
const button = createButton({
  text: 'Upload',
  progress: {
    variant: 'circular',    // 'circular' or 'linear'
    size: 24,              // Size in pixels
    thickness: 3,          // Thickness of progress ring/bar
    indeterminate: false   // Whether to show indeterminate progress
  }
});
```

The progress config is passed straight to the progress component, so only that
component's own options apply. There is no `color` option: the indicator draws
in `currentColor` and so takes the button variant's content colour. A circular
`size` below 24 is clamped up to 24 by the progress component.

### Progress Examples

#### File Upload with Progress

```typescript
const uploadBtn = createButton({
  text: 'Upload File',
  progress: { variant: 'circular', size: 18 }
});

uploadBtn.on('click', () => {
  const file = getSelectedFile();
  
  uploadBtn.setLoadingSync(true, 'Uploading...');
  
  uploadFile(file, (progress) => {
    uploadBtn.setProgressSync(progress);
  }).then(() => {
    uploadBtn.setLoadingSync(false, 'Uploaded!');
  });
});
```

#### Form Submission

```typescript
const submitBtn = createButton({
  text: 'Submit Form',
  type: 'submit',
  progress: true
});

form.on('submit', async (e) => {
  e.preventDefault();
  
  submitBtn.setLoadingSync(true, 'Submitting...');
  
  try {
    await submitForm(form.getData());
    submitBtn.setLoadingSync(false, 'Success!');
  } catch (error) {
    submitBtn.setLoadingSync(false, 'Try Again');
  }
});
```

#### Multi-step Process

```typescript
const processBtn = createButton({
  text: 'Start Process',
  progress: { indeterminate: false }
});

processBtn.on('click', async () => {
  const steps = ['Initializing', 'Processing', 'Finalizing'];
  
  processBtn.setLoadingSync(true, steps[0]);
  processBtn.setProgressSync(0);
  
  for (let i = 0; i < steps.length; i++) {
    processBtn.setText(steps[i]);
    
    // Simulate work
    await performStep(i);
    
    const progress = ((i + 1) / steps.length) * 100;
    processBtn.setProgressSync(progress);
  }
  
  processBtn.setLoadingSync(false, 'Complete!');
});
```

### Performance

The progress component is only loaded when:
1. A button is created with `progress` configuration AND
2. One of the progress methods is called OR `showProgress: true` is set

This means:
- Buttons without progress have zero overhead
- The progress component code is automatically code-split
- First usage may have a tiny delay while loading (usually imperceptible)

### Progress Styling

The progress indicator automatically adapts to the button variant's color scheme:

- **Filled buttons**: Progress uses `on-primary` color
- **Elevated buttons**: Progress uses `primary` color  
- **Tonal buttons**: Progress uses `on-secondary-container` color
- **Outlined buttons**: Progress uses `on-surface-variant` color
- **Text buttons**: Progress uses `primary` color

These are not separate rules: the indicator's canvas is drawn in `currentColor`,
so it simply inherits whatever colour the variant gives the button's label and
icon.

Additional styling features:
- Progress smoothly fades in/out with an opacity transition
- The indicator takes the icon slot and is sized with it, so it grows with the button size rather than with the shape
- Progress remains visible in disabled state at reduced opacity
- Dark theme is inherited along with the variant colours

## Functional Composition

The Button component is built using functional composition, combining multiple features:

### Core Features

- **Base Component (`createBase`)**: Provides the foundation with component creation utilities.
- **Element Creation (`withElement`)**: Creates the DOM element with proper attributes and classes.
- **Event Handling (`withEvents`)**: Enables event listening and emission.
- **Text Content (`withText`)**: Manages text content within the button.
- **Icon Support (`withIcon`)**: Adds and manages icon elements.
- **Variant Styling (`withVariant`)**: Applies visual styling variants like filled, outlined, etc.
- **Size Styling (`withSize`)**: Applies size variants (xs, s, m, l, xl).
- **Disabled State (`withDisabled`)**: Manages the disabled state of the button.
- **Toggle State (`withToggle`)**: Manages the selected state used by `setSelected()`/`isSelected()`.
- **Progress Indicators (`withProgress`)**: Adds lazily-loaded progress functionality.
- **Ripple Effect (`withRipple`)**: Adds Material Design ripple feedback effect.
- **Lifecycle Management (`withLifecycle`)**: Handles component lifecycle including destruction.
- **Public API (`withAPI`)**: Exposes a clean, chainable API for users.

### How Composition Works

The button component is created by "piping" these features together:

```javascript
const button = pipe(
  createBase,               // Start with base component
  withEvents(),             // Add event capability
  withElement(config),      // Create DOM element
  withVariant(config),      // Apply variant styling
  withSize(config),         // Apply size styling
  withText(config),         // Add text content
  withIcon(config),         // Add icon support
  withDisabled(config),     // Add disabled state
  withToggle(config),       // Add selected/unselected state
  withProgress(config),     // Add progress functionality
  withRipple(config),       // Add ripple effect
  withLifecycle(),          // Add lifecycle management
  comp => withAPI(config)(comp)  // Apply public API
)(baseConfig);
```

This composition pattern allows for:
- Modular, testable code
- Clean separation of concerns
- Lightweight bundles (only include what you need)
- Easy extension and customization

## Accessibility

The Button component follows accessibility best practices:

- Proper semantic HTML with `<button>` element
- Support for `aria-label` attribute for icon-only buttons
- Keyboard navigation and focus handling
- Visual focus indicators
- Disabled states properly communicated to screen readers
- Progress states announced to screen readers

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Moves focus to the button |
| `Space` or `Enter` | Activates the button |

## CSS Customization

The Button component uses BEM-style CSS classes for easy customization:

```css
/* Base button styles */
.mtrl-button { /* ... */ }

/* Button variants */
.mtrl-button--filled { /* ... */ }
.mtrl-button--outlined { /* ... */ }
.mtrl-button--text { /* ... */ }
.mtrl-button--elevated { /* ... */ }
.mtrl-button--tonal { /* ... */ }

/* Button sizes */
.mtrl-button--xs { /* ... */ }
.mtrl-button--s { /* ... */ }
.mtrl-button--m { /* ... */ }
.mtrl-button--l { /* ... */ }
.mtrl-button--xl { /* ... */ }

/* Button shapes */
.mtrl-button--round { /* ... */ }
.mtrl-button--square { /* ... */ }

/* Button states */
.mtrl-button--disabled { /* ... */ }
.mtrl-button--active { /* ... */ }
.mtrl-button--progress { /* ... */ }

/* Button with icon */
.mtrl-button--icon { /* ... */ }
.mtrl-button-icon { /* ... */ }
.mtrl-button-text { /* ... */ }

/* Circular icon-only button */
.mtrl-button--circular { /* ... */ }

/* Progress integration */
.mtrl-button-progress { /* ... */ }

/* Ripple effect */
.mtrl-ripple { /* ... */ }
.mtrl-ripple-wave { /* ... */ }
```

## Best Practices

- Use the appropriate button variant for each context
  - Filled (primary actions)
  - Outlined (secondary actions)
  - Text (low-emphasis actions)
- Choose the right size for your context
  - XS/S for compact interfaces
  - M for standard interfaces
  - L/XL for touch-first or prominent actions
- Use square shape for buttons that need to align with other square elements
- Provide clear, concise text labels
- Use icons to enhance clarity, not to replace text (except for well-known actions)
- Always include `aria-label` for icon-only buttons
- Place primary actions on the right in dialogs and forms
- Don't use too many prominent buttons in a single view
- Keep button text to 1-3 words when possible
- Use progress indicators for operations that take longer than 1 second

## Performance Considerations

The Button component is designed to be lightweight and performant:

- Minimal DOM operations
- Efficient event handling
- Optimized ripple animations
- Lazy-loaded progress functionality
- Clean destruction to prevent memory leaks
- No external dependencies