# Switch Component

The Switch component provides a Material Design 3 toggle switch control that allows users to toggle between two states (on/off). It's designed to be lightweight, accessible, and customizable.

## Overview

Switches are commonly used for:

- Toggling settings on/off
- Enabling/disabling features
- Binary choices that have an immediate effect

The component follows Material Design 3 guidelines with a track and thumb design, supporting labels, error states, and disabled states.

## Import

```javascript
import { createSwitch } from 'mtrl';
```

## Basic Usage

```javascript
// Create a basic switch
const mySwitch = createSwitch({
  label: 'Enable notifications',
  checked: true
});

// Add to your page
document.querySelector('.settings-container').appendChild(mySwitch.element);

// Listen for changes
mySwitch.on('change', (event) => {
  console.log('Switch toggled:', event.checked);
});
```

## Configuration

The Switch component accepts the following configuration options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | `string` | `undefined` | Input name attribute used for form submission |
| `checked` | `boolean` | `false` | Initial checked state |
| `required` | `boolean` | `false` | Whether input is required for form validation |
| `disabled` | `boolean` | `false` | Whether the switch is disabled (non-interactive) |
| `value` | `string` | `"on"` | Input value attribute used for form submission |
| `label` | `string` | `undefined` | Label text displayed next to the switch |
| `supportingText` | `string` | `undefined` | Helper text displayed below the switch |
| `error` | `boolean` | `false` | Whether supporting text indicates an error |
| `class` | `string` | `undefined` | Additional CSS classes to add to the switch |
| `ariaLabel` | `string` | `undefined` | ARIA label for accessibility |
| `prefix` | `string` | `"mtrl"` | Prefix for CSS class names |
| `componentName` | `string` | `"switch"` | Component name used in CSS class generation |
| `icon` | `string` | `undefined` | Declared in `SwitchConfig` but never read by the component — setting it has no effect |

## Component API

The Switch component provides the following methods:

### Value Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getValue()` | none | `boolean` | Gets the checked state (not the `value` attribute), for form compatibility |
| `setValue(value)` | `value: boolean \| string` | `SwitchComponent` | Sets the checked state. A string is read as checked when it is `'true'` or `'1'`, unchecked otherwise |
| `getValueAttribute()` | none | `string` | Gets the input's `value` attribute |
| `setValueAttribute(value)` | `value: string` | `SwitchComponent` | Sets the input's `value` attribute |

### State Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `check()` | none | `SwitchComponent` | Checks/activates the switch |
| `uncheck()` | none | `SwitchComponent` | Unchecks/deactivates the switch |
| `toggle()` | none | `SwitchComponent` | Toggles the switch's checked state |
| `isChecked()` | none | `boolean` | Returns whether the switch is checked |
| `enable()` | none | `SwitchComponent` | Enables the switch, making it interactive |
| `disable()` | none | `SwitchComponent` | Disables the switch, making it non-interactive |

### Label Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setLabel(text)` | `text: string` | `SwitchComponent` | Sets the switch's label text |
| `getLabel()` | none | `string` | Gets the switch's current label text |

### Supporting Text Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setSupportingText(text, isError?)` | `text: string, isError?: boolean` | `SwitchComponent` | Sets supporting text content and optional error state |
| `removeSupportingText()` | none | `SwitchComponent` | Removes supporting text |

### Event Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `on(event, handler)` | `event: string, handler: Function` | `SwitchComponent` | Adds an event listener |
| `off(event, handler)` | `event: string, handler: Function` | `SwitchComponent` | Removes an event listener |

### Lifecycle Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `destroy()` | none | `void` | Destroys the switch component and cleans up resources |

## Events

The Switch component emits the following events:

| Event | Description | Data |
|-------|-------------|------|
| `change` | Fires when the switch state changes | `{ checked: boolean, value: string, nativeEvent?: Event }` |

`nativeEvent` is present only when the change came from the user toggling the
input. A change made through `check()`, `uncheck()`, `toggle()` or `setValue()`
emits `{ checked, value }` with no `nativeEvent`.

`change` is the only event the switch emits. `SWITCH_EVENTS` also lists `focus`
and `blur`, but nothing in the component emits them, so listeners for those
never fire; listen on `mySwitch.input` directly if you need focus changes.

## Examples

### Basic Switch

```javascript
const basicSwitch = createSwitch({
  label: 'Dark mode'
});
document.body.appendChild(basicSwitch.element);
```

### Pre-checked Switch

```javascript
const checkedSwitch = createSwitch({
  label: 'Notifications',
  checked: true
});
document.body.appendChild(checkedSwitch.element);
```

### Switch with Supporting Text

```javascript
const switchWithHelper = createSwitch({
  label: 'Enable analytics',
  supportingText: 'Data will be collected anonymously'
});
document.body.appendChild(switchWithHelper.element);
```

### Switch with Error State

```javascript
const errorSwitch = createSwitch({
  label: 'Accept terms',
  supportingText: 'You must accept the terms to continue',
  error: true
});
document.body.appendChild(errorSwitch.element);
```

### Disabled Switch

```javascript
const disabledSwitch = createSwitch({
  label: 'Premium feature',
  disabled: true,
  supportingText: 'Available in the pro version'
});
document.body.appendChild(disabledSwitch.element);
```

### Toggling Programmatically

```javascript
const toggleSwitch = createSwitch({
  label: 'Automatic updates'
});

document.body.appendChild(toggleSwitch.element);

// Later, toggle the switch programmatically
toggleSwitch.toggle();

// Or set to a specific state
toggleSwitch.check();   // Turn on
toggleSwitch.uncheck(); // Turn off
```

### Form Integration

```javascript
const form = document.getElementById('settings-form');

const notificationsSwitch = createSwitch({
  name: 'notifications',
  label: 'Enable notifications',
  value: 'enabled'
});

form.appendChild(notificationsSwitch.element);

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  console.log('Notifications enabled:', formData.has('notifications'));
});
```

## Advanced Usage

### Dynamic Supporting Text

```javascript
const passwordSwitch = createSwitch({
  label: 'Show password',
  supportingText: 'Password will remain hidden'
});

passwordSwitch.on('change', (event) => {
  if (event.checked) {
    passwordSwitch.setSupportingText('Password is now visible');
  } else {
    passwordSwitch.setSupportingText('Password is hidden');
  }
});
```

### Validation Integration

```javascript
const termsSwitch = createSwitch({
  label: 'I agree to the terms and conditions',
  name: 'terms'
});

function validateForm() {
  if (!termsSwitch.isChecked()) {
    termsSwitch.setSupportingText('You must accept the terms to continue', true);
    return false;
  } else {
    termsSwitch.removeSupportingText();
    return true;
  }
}
```

## Accessibility

The Switch component follows accessibility best practices:

- Proper labeling with label elements and ARIA attributes
- Keyboard navigation support
- Focus indicators
- Clear visual indications of state
- Disabled states properly communicated to screen readers

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Moves focus to the switch |
| `Space` | Toggles the switch state |
| `Enter` | Toggles the switch state |

## CSS Customization

The Switch component uses BEM-style CSS classes for easy customization:

```css
/* Base switch styles */
.mtrl-switch { /* ... */ }

/* Switch container */
.mtrl-switch-container { /* ... */ }

/* Switch track */
.mtrl-switch-track { /* ... */ }

/* Switch thumb */
.mtrl-switch-thumb { /* ... */ }

/* Switch label */
.mtrl-switch-label { /* ... */ }

/* Supporting text */
.mtrl-switch-helper { /* ... */ }

/* Error state */
.mtrl-switch-helper--error { /* ... */ }
.mtrl-switch--error { /* ... */ }

/* Checked state */
.mtrl-switch--checked { /* ... */ }

/* Disabled state */
.mtrl-switch--disabled { /* ... */ }
```

## Composition

The Switch component is built using functional composition, combining multiple features:

- Event handling
- DOM element creation
- Text label
- Input management
- Track/thumb visualization
- Supporting text
- Checkable state
- Disabled state
- Lifecycle management

You can create custom variants by using similar composition patterns with the core utilities.

## Best Practices

- Use switches for binary options that take immediate effect
- Provide clear, concise labels that describe the action
- Use supporting text for additional context when needed
- Group related switches together
- Avoid using too many switches on a single page
- Use the error state sparingly and only for required options
- Prefer switches over checkboxes for toggles that immediately change system state

## Browser Compatibility

The Switch component is compatible with all modern browsers:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Considerations

The Switch component is designed to be lightweight and performant:

- Minimal DOM operations
- Efficient event handling
- No unnecessary reflows or repaints
- Cleanup on destroy to prevent memory leaks