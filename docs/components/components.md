# Components Module Documentation

The Components module provides a collection of highly optimized, fully accessible UI components built using the functional composition pattern. Each component is crafted with a focus on performance, memory efficiency, and code reusability while adhering to Material Design 3 specifications.

## Overview

The Components module implements Material Design 3 principles using a lightweight, dependency-free architecture. Instead of relying on inheritance or heavy frameworks, components are constructed through functional composition, allowing for precisely tailored features with minimal overhead.

Key characteristics of our component system include:

- **Functional Composition**: Components are assembled from small, focused feature enhancers
- **Zero Dependencies**: No external dependencies, keeping bundle size minimal
- **TypeScript-First**: Full type safety with comprehensive interfaces
- **Accessibility-Focused**: ARIA support and keyboard navigation built-in
- **Performance-Optimized**: Minimal DOM operations and memory footprint
- **Customizable**: Extensive configuration options without bloat

## Component Architecture

Each component follows a consistent architectural pattern:

1. **Factory Function**: A creator function (e.g., `createButton`) serves as the primary API
2. **Configuration Processing**: Default values are merged with user configuration
3. **Feature Composition**: Multiple enhancers are applied in a specific order
4. **Public API Creation**: A clean public API is exposed while hiding implementation details

### Component Factory Pattern

The standard pattern used for creating components is:

```
const component = pipe(
  createBase,
  withEvents(),
  withElement(config),
  withSpecificFeatures(config),
  withLifecycle(),
  withAPI(config)
)(processedConfig);
```

This pipeline provides a clean separation of concerns while ensuring each component only includes the features it needs.

## Core Components

### Button

The Button component implements Material Design 3 button variants with ripple effects, states, and accessibility features.

#### Variants

- **Filled**: Primary action with solid background (high emphasis)
- **Tonal**: Secondary action with semi-filled background (medium emphasis)
- **Outlined**: Button with outline border (medium-low emphasis)
- **Elevated**: Button with slight elevation/shadow
- **Text**: Text-only button without background (low emphasis)

#### Key Features

- Touch ripple effects with configurable animation
- Accessible keyboard navigation and ARIA attributes
- Icon support with position control
- Disabled state management
- Focus, hover, and active states

### Checkbox

The Checkbox component provides a Material Design 3 compliant checkbox with support for indeterminate state.

#### Key Features

- Checked, unchecked, and indeterminate states
- Label positioning (start/end)
- Accessible keyboard interaction
- Touch-friendly hit areas
- Form integration with name/value

### Menu

The Menu component offers a dropdown menu system with support for nested submenus, keyboard navigation, and ARIA attributes.

#### Key Features

- Intelligent positioning with automatic flipping
- Cursor-based focus management
- Support for nested submenus
- Icons and keyboard shortcuts
- Dynamic item enabling/disabling
- Keyboard navigation and screen reader support

### Slider

The Slider component implements a touch and keyboard accessible range input with support for discrete steps, custom thumb control, and accessibility features.

#### Key Features

- Continuous and discrete (stepped) modes
- Range slider support (dual thumbs)
- Customizable track and thumb appearance
- Keyboard accessibility with fine/coarse adjustments
- Touch and mouse input with accessible events
- Value bubble for current selection

## Component APIs

Each component exposes a consistent public API with these characteristics:

- **Element Access**: Direct access to the root DOM element
- **State Methods**: Enable/disable and other state controls
- **Content Methods**: Update text, icons, etc.
- **Event Subscription**: Add/remove event listeners
- **Lifecycle Control**: Mount, unmount, and destroy functionality
- **Method Chaining**: Most methods return the component for chaining

### Common API Patterns

Most components implement these common API methods:

- **Element Reference**: `component.element` provides access to the root DOM element
- **Event Handling**: `component.on(event, handler)` and `component.off(event, handler)`
- **State Management**: `component.enable()` and `component.disable()`
- **Destruction**: `component.destroy()` for cleanup

## Extending Components

The component system is designed for extension through several approaches:

### Feature Composition

New features can be added to existing components through the composition pipeline:

```typescript
const createCustomButton = (config) => pipe(
  createButton,
  withCustomFeature(config)
)(config);
```

### Custom Components

New components can be created following the same pattern:

```typescript
const createCustomComponent = (config) => {
  const baseConfig = {
    ...defaultConfig,
    ...config,
    componentName: 'custom'
  };

  return pipe(
    createBase,
    withEvents(),
    withElement(elementConfig),
    withFeature1(baseConfig),
    withFeature2(baseConfig),
    withLifecycle()
  )(baseConfig);
};
```

### API Extension

Existing component APIs can be extended with custom functionality:

```typescript
const withCustomAPI = (component) => ({
  ...component,
  customMethod() {
    // Custom implementation
    return this;
  }
});

const enhancedButton = withCustomAPI(createButton(config));
```

## Component Features

Components are built from composable features, including:

### UI Features

- **Text Content**: Adds and manages text through `withText`
- **Icon Support**: Adds icon capabilities through `withIcon`
- **Variant Styling**: Applies style variants through `withVariant`
- **Size Variations**: Adds size options through `withSize`
- **Ripple Effect**: Adds Material Design ripple through `withRipple`

### Behavioral Features

- **Event Handling**: Adds event system through `withEvents`
- **Disabled State**: Adds disabled functionality through `withDisabled`
- **Input Handling**: Adds form input behavior through `withInput`
- **Checkable State**: Adds checked state through `withCheckable`
- **Lifecycle Management**: Adds lifecycle methods through `withLifecycle`

### Specialized Features

- **Track/Thumb**: Adds slider/switch track elements through `withTrack`
- **Label Management**: Adds label support through `withTextLabel`
- **Badge Support**: Adds badge capability through `withBadge`
- **Gesture Recognition**: Adds touch gestures through `withGestures`

## Styling Approach

Components use a consistent styling approach with these characteristics:

- **External CSS**: Styles are defined in external SCSS files
- **BEM Naming**: Block-Element-Modifier pattern for class names
- **Prefixing**: All classes use the `mtrl-` prefix for namespacing
- **States as Modifiers**: States like `--disabled` are applied as modifier classes
- **Minimal Specificity**: Flat selector hierarchy to avoid specificity issues

## Performance Considerations

The component system includes numerous performance optimizations:

### Rendering Performance

- **Minimal DOM Operations**: Batch DOM changes and minimize reflow
- **Efficient Event Handling**: Use event delegation where appropriate
- **Class Toggle Optimization**: Efficient class manipulation with batch operations
- **Lazy Initialization**: Components initialize features only when needed

### Memory Management

- **Proper Cleanup**: Components properly clean up resources on destruction
- **Event Handler Management**: Centralized tracking of event handlers for removal
- **Avoid Closure Leaks**: Careful management of closure references
- **Reuse DOM Elements**: Recycle elements when possible

## Accessibility

All components implement accessibility best practices:

- **ARIA Attributes**: Proper role and state attributes
- **Keyboard Navigation**: Full keyboard support with expected behaviors
- **Focus Management**: Visible focus indicators and logical focus order
- **Screen Reader Support**: Meaningful text alternatives and announcements
- **Touch Targets**: Appropriately sized touch targets for mobile use

## Examples of Component Usage

### Button Component

```typescript
// Create a filled button with an icon
const submitButton = createButton({
  text: 'Submit',
  variant: 'filled',
  icon: '<svg>...</svg>',
  iconPosition: 'start'
});

// Add click handler
submitButton.on('click', () => {
  console.log('Button clicked');
});

// Disable during async operation
submitButton.disable();

// Re-enable when done
submitButton.enable();

// Clean up when no longer needed
submitButton.destroy();
```

### Checkbox Component

```typescript
// Create a checkbox with label
const consentCheckbox = createCheckbox({
  label: 'I agree to the terms and conditions',
  name: 'consent',
  required: true,
  labelPosition: 'end'
});

// Add change handler
consentCheckbox.on('change', (e) => {
  console.log('Checkbox state:', e.checked);
});

// Toggle checked state
consentCheckbox.toggle();

// Set indeterminate state for "some selected" UI
consentCheckbox.setIndeterminate(true);

// Update label text
consentCheckbox.setLabel('I consent to all terms of service');
```

### Menu Component

```typescript
// Create a menu with items
const userMenu = createMenu({
  anchor: document.getElementById('user-avatar'),
  items: [
    { id: 'profile', text: 'Profile', icon: '<svg>...</svg>' },
    { id: 'settings', text: 'Settings' },
    { type: 'divider' },
    { id: 'logout', text: 'Log out' }
  ],
  placement: 'bottom-end'
});

// Listen for selections
userMenu.on('select', (e) => {
  console.log('Selected item:', e.itemId);
  
  if (e.itemId === 'logout') {
    logoutUser();
  }
});

// Open the menu programmatically
userMenu.open();

// Update items dynamically
userMenu.setItems([
  // New items...
]);
```

### Slider Component

```typescript
// Create a slider
const volumeSlider = createSlider({
  min: 0,
  max: 100,
  value: 50,
  step: 1,
  label: 'Volume',
  showValue: true
});

// Listen for value changes
volumeSlider.on('change', (e) => {
  console.log('New volume:', e.value);
  setSystemVolume(e.value);
});

// Update value programmatically
volumeSlider.setValue(75);

// Create a range slider
const priceRangeSlider = createSlider({
  min: 0,
  max: 1000,
  value: 200,
  secondValue: 800,
  range: true,
  label: 'Price Range',
  valueFormatter: (value) => `$${value}`
});
```

## Best Practices

When working with the component system, consider these best practices:

1. **Resource Management**: Always call `destroy()` when a component is no longer needed
2. **Event Handling**: Use the component's event system instead of direct DOM events
3. **Component Configuration**: Configure components at creation time when possible
4. **DOM Manipulation**: Avoid direct DOM manipulation of component elements
5. **Performance**: For lists of components, use virtualization techniques
6. **Accessibility**: Test with keyboard navigation and screen readers
7. **State Management**: Use component state methods instead of class manipulation

## Component Status and Roadmap

The current component library includes these fully implemented components:

- Button (all variants)
- Checkbox
- Menu (with nested submenus)
- Slider (including range slider)
- Switch
- TextField
- Radio Button
- List
- Card
- Dialog
- Snackbar

Upcoming components on the roadmap include:

- Tabs
- Navigation Rail
- Bottom App Bar
- Chips
- Date Picker
- Time Picker
- Segmented Button
- Navigation Drawer
- Progress Indicators

## Contributing New Components

When creating new components for the library, follow these guidelines:

1. Use the established functional composition pattern
2. Create a clear public API with comprehensive TypeScript types
3. Add thorough accessibility support
4. Include documentation with usage examples
5. Write tests for component features
6. Optimize for performance and memory usage
7. Follow the Material Design 3 specification
8. Use existing features when possible

## Conclusion

The Components module provides a comprehensive suite of UI components built on a foundation of functional composition. By assembling small, focused feature enhancers, each component includes precisely the functionality it needs without unnecessary overhead. This approach results in a lightweight, performant, and accessible implementation of the Material Design 3 specification.