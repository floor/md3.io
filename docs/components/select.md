# Select Component

The Select component provides a Material Design 3 compliant dropdown selection control that allows users to choose from a list of options. It combines a textfield display with a menu dropdown for a familiar and accessible selection experience.

## Overview

Selects are commonly used for:

- Choosing from a predefined list of options
- Form fields requiring single selection
- Settings and preferences
- Filtering and sorting controls

The component follows Material Design 3 guidelines with support for filled and outlined variants, labels, icons, error states, and keyboard navigation.

## Import

```javascript
import { createSelect } from 'mtrl';
```

## Basic Usage

```javascript
// Create a basic select
const countrySelect = createSelect({
  label: 'Country',
  options: [
    { id: 'us', text: 'United States' },
    { id: 'uk', text: 'United Kingdom' },
    { id: 'ca', text: 'Canada' },
    { id: 'au', text: 'Australia' }
  ]
});

// Add to your page
document.querySelector('.form-container').appendChild(countrySelect.element);

// Listen for changes
countrySelect.on('change', (event) => {
  console.log('Selected:', event.value, event.text);
});
```

## Configuration

The Select component accepts the following configuration options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `options` | `SelectOption[]` | `[]` | Array of options to display |
| `value` | `string` | `undefined` | Initially selected option ID |
| `variant` | `string` | `'filled'` | Visual style (filled, outlined) |
| `density` | `string` | `'default'` | Density level (default, compact) |
| `label` | `string` | `undefined` | Label text for the select |
| `name` | `string` | `undefined` | Input name attribute for forms |
| `required` | `boolean` | `false` | Whether selection is required |
| `disabled` | `boolean` | `false` | Whether the select is disabled |
| `supportingText` | `string` | `undefined` | Helper text below the select |
| `error` | `boolean` | `false` | Whether to show error state |
| `placement` | `string` | `'bottom-start'` | Menu placement relative to textfield |
| `class` | `string` | `undefined` | Additional CSS classes |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |

## Option Configuration

Each option in the `options` array can have the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique identifier for the option (required) |
| `text` | `string` | Display text for the option (required) |
| `disabled` | `boolean` | Whether the option is disabled |
| `icon` | `string` | HTML content (typically SVG) for an icon |
| `data` | `any` | Additional data associated with the option |

## Select Variants

The select supports 2 Material Design 3 variants:

- **`filled`** (default): Select with filled background and underline indicator
- **`outlined`**: Select with outline border

## Component API

The Select component provides the following methods:

### Value Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getValue()` | none | `string \| null` | Gets the selected option's ID |
| `setValue(value)` | `value: string \| null` | `SelectComponent` | Sets the selected option by ID |
| `clear()` | none | `SelectComponent` | Clears the current selection |
| `getText()` | none | `string` | Gets the selected option's display text |
| `getSelectedOption()` | none | `SelectOption \| null` | Gets the full selected option object |

### Options Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getOptions()` | none | `SelectOption[]` | Gets all available options |
| `setOptions(options)` | `options: SelectOption[]` | `SelectComponent` | Sets new options |

### Menu Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `open(interactionType?)` | `interactionType?: 'mouse' \| 'keyboard'` | `SelectComponent` | Opens the dropdown menu |
| `close()` | none | `SelectComponent` | Closes the dropdown menu |
| `isOpen()` | none | `boolean` | Returns whether the menu is open |

### State Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `enable()` | none | `SelectComponent` | Enables the select |
| `disable()` | none | `SelectComponent` | Disables the select |
| `setError(error, message?)` | `error: boolean, message?: string` | `SelectComponent` | Sets the error state |
| `clearError()` | none | `SelectComponent` | Clears the error state |

### Density Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setDensity(density)` | `density: 'default' \| 'compact'` | `SelectComponent` | Sets the density level |
| `getDensity()` | none | `string` | Gets the current density |

### Event Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `on(event, handler)` | `event: string, handler: Function` | `SelectComponent` | Adds an event listener |
| `off(event, handler)` | `event: string, handler: Function` | `SelectComponent` | Removes an event listener |

### Lifecycle Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `destroy()` | none | `void` | Destroys the select and cleans up resources |

## Events

The Select component emits the following events:

| Event | Description | Data |
|-------|-------------|------|
| `change` | Fires when the selection changes | `{ select, value, text, option, originalEvent?, preventDefault, defaultPrevented }` |
| `open` | Fires **only when the dropdown is opened from the keyboard** (Enter, Space or ArrowDown on the field). Opening by click, or by calling `open()`, emits nothing | `{ select, originalEvent?, preventDefault, defaultPrevented }` |
| `close` | Fires when the dropdown closes | `{ select, originalEvent?, preventDefault, defaultPrevented }` |

## Examples

### Basic Select

```javascript
const roleSelect = createSelect({
  label: 'Role',
  options: [
    { id: 'admin', text: 'Administrator' },
    { id: 'editor', text: 'Editor' },
    { id: 'viewer', text: 'Viewer' }
  ]
});

document.body.appendChild(roleSelect.element);
```

### Select with Pre-selected Value

```javascript
const statusSelect = createSelect({
  label: 'Status',
  value: 'active',
  options: [
    { id: 'active', text: 'Active' },
    { id: 'pending', text: 'Pending' },
    { id: 'inactive', text: 'Inactive' }
  ]
});

document.body.appendChild(statusSelect.element);
```

### Outlined Variant

```javascript
const categorySelect = createSelect({
  label: 'Category',
  variant: 'outlined',
  options: [
    { id: 'electronics', text: 'Electronics' },
    { id: 'clothing', text: 'Clothing' },
    { id: 'books', text: 'Books' }
  ]
});

document.body.appendChild(categorySelect.element);
```

### Select with Icons

```javascript
const priorityIcon = '<svg>...</svg>';
const highIcon = '<svg>...</svg>';
const mediumIcon = '<svg>...</svg>';
const lowIcon = '<svg>...</svg>';

const prioritySelect = createSelect({
  label: 'Priority',
  options: [
    { id: 'high', text: 'High', icon: highIcon },
    { id: 'medium', text: 'Medium', icon: mediumIcon },
    { id: 'low', text: 'Low', icon: lowIcon }
  ]
});

document.body.appendChild(prioritySelect.element);
```

### Required Select with Supporting Text

```javascript
const countrySelect = createSelect({
  label: 'Country',
  name: 'country',
  required: true,
  supportingText: 'Select your country of residence',
  options: [
    { id: 'us', text: 'United States' },
    { id: 'uk', text: 'United Kingdom' },
    { id: 'ca', text: 'Canada' }
  ]
});

document.body.appendChild(countrySelect.element);
```

### Select with Error State

```javascript
const languageSelect = createSelect({
  label: 'Language',
  required: true,
  error: true,
  supportingText: 'Please select a language',
  options: [
    { id: 'en', text: 'English' },
    { id: 'es', text: 'Spanish' },
    { id: 'fr', text: 'French' }
  ]
});

document.body.appendChild(languageSelect.element);
```

### Disabled Select

```javascript
const lockedSelect = createSelect({
  label: 'Plan',
  value: 'free',
  disabled: true,
  supportingText: 'Contact support to change your plan',
  options: [
    { id: 'free', text: 'Free' },
    { id: 'pro', text: 'Professional' },
    { id: 'enterprise', text: 'Enterprise' }
  ]
});

document.body.appendChild(lockedSelect.element);
```

### Select with Disabled Options

```javascript
const tierSelect = createSelect({
  label: 'Subscription Tier',
  options: [
    { id: 'basic', text: 'Basic' },
    { id: 'pro', text: 'Professional' },
    { id: 'enterprise', text: 'Enterprise', disabled: true }
  ]
});

document.body.appendChild(tierSelect.element);
```

### Select Inside a Dialog

When using a select inside a dialog or modal, the menu automatically stays within the dialog's stacking context:

```javascript
import { createDialog, createSelect } from 'mtrl';

const dialog = createDialog({
  title: 'User Settings',
  content: '<div id="settings-form"></div>',
  size: 'small'
});

dialog.open();

dialog.on('open', () => {
  const formContainer = dialog.getContentElement().querySelector('#settings-form');
  
  const themeSelect = createSelect({
    label: 'Theme',
    variant: 'outlined',
    options: [
      { id: 'light', text: 'Light' },
      { id: 'dark', text: 'Dark' },
      { id: 'auto', text: 'System Default' }
    ]
  });
  
  formContainer.appendChild(themeSelect.element);
});
```

### Form Integration

```javascript
const form = document.getElementById('user-form');

const roleSelect = createSelect({
  label: 'Role',
  name: 'role',
  required: true,
  options: [
    { id: 'admin', text: 'Administrator' },
    { id: 'editor', text: 'Editor' },
    { id: 'viewer', text: 'Viewer' }
  ]
});

form.appendChild(roleSelect.element);

form.addEventListener('submit', (event) => {
  event.preventDefault();
  
  if (!roleSelect.getValue()) {
    roleSelect.setError(true, 'Please select a role');
    return;
  }
  
  roleSelect.clearError();
  console.log('Selected role:', roleSelect.getValue());
});
```

### Dynamic Options

```javascript
const departmentSelect = createSelect({
  label: 'Department',
  options: []
});

document.body.appendChild(departmentSelect.element);

// Fetch and update options dynamically
async function loadDepartments() {
  const response = await fetch('/api/departments');
  const departments = await response.json();
  
  departmentSelect.setOptions(
    departments.map(dept => ({
      id: dept.id,
      text: dept.name
    }))
  );
}

loadDepartments();
```

### Programmatic Control

```javascript
const colorSelect = createSelect({
  label: 'Color',
  options: [
    { id: 'red', text: 'Red' },
    { id: 'green', text: 'Green' },
    { id: 'blue', text: 'Blue' }
  ]
});

document.body.appendChild(colorSelect.element);

// Set value programmatically
colorSelect.setValue('blue');

// Get current value
console.log('Current value:', colorSelect.getValue()); // 'blue'
console.log('Current text:', colorSelect.getText()); // 'Blue'

// Clear selection
colorSelect.clear();

// Open/close dropdown programmatically
colorSelect.open();
setTimeout(() => colorSelect.close(), 2000);
```

### Validation

```javascript
const requiredSelect = createSelect({
  label: 'Category',
  name: 'category',
  required: true,
  options: [
    { id: 'tech', text: 'Technology' },
    { id: 'science', text: 'Science' },
    { id: 'arts', text: 'Arts' }
  ]
});

document.body.appendChild(requiredSelect.element);

function validateSelect() {
  if (!requiredSelect.getValue()) {
    requiredSelect.setError(true, 'This field is required');
    return false;
  }
  requiredSelect.clearError();
  return true;
}

requiredSelect.on('change', () => {
  validateSelect();
});
```

## Accessibility

The Select component follows accessibility best practices:

- `aria-haspopup`, `aria-expanded` and `aria-controls` on the field, linking it to the menu; the menu is `role="menu"` with `role="menuitem"` options (the component does not set `role="combobox"` or `role="listbox"`)
- Keyboard navigation support
- Focus management between textfield and menu
- Screen reader announcements for selection changes
- Proper labeling with associated label elements

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Enter` / `Space` | Open dropdown or select focused option |
| `Escape` | Close dropdown |
| `ArrowDown` | Open dropdown or move to next option |
| `ArrowUp` | Move to previous option |
| `Home` | Move to first option |
| `End` | Move to last option |
| `Tab` | Move focus out of select |

## CSS Customization

The Select component uses BEM-style CSS classes for easy customization:

```css
/* Base select styles */
.mtrl-select { /* ... */ }

/* Open state */
.mtrl-select--open { /* ... */ }

/* Disabled state */
.mtrl-select--disabled { /* ... */ }

/* Error state */
.mtrl-select--error { /* ... */ }

/* Size variants */
.mtrl-select--small { /* ... */ }
.mtrl-select--large { /* ... */ }

/* Variant styles */
.mtrl-select--filled { /* ... */ }
.mtrl-select--outlined { /* ... */ }

/* Textfield within select */
.mtrl-select .mtrl-textfield { /* ... */ }
.mtrl-select .mtrl-textfield-input { /* ... */ }
.mtrl-select .mtrl-textfield-label { /* ... */ }
.mtrl-select .mtrl-textfield-trailing-icon { /* ... */ }

/* Menu when child of select */
.mtrl-select > .mtrl-menu { /* ... */ }

/* Select-specific menu class */
.mtrl-select-menu { /* ... */ }

/* Selected menu item */
.mtrl-menu-item--selected { /* ... */ }
```

## Container Behavior

The Select component's menu is automatically appended as a child of the select element. This ensures:

- **Proper z-index stacking**: The menu inherits the select's stacking context
- **Works inside dialogs**: No z-index conflicts when select is in a modal
- **Correct positioning**: Menu positions relative to its parent select
- **Simplified DOM structure**: Menu is logically part of the select

This is different from standalone menus which append to `document.body` by default.

## Best Practices

- Use clear, concise option labels
- Provide a sensible default selection when appropriate
- Use supporting text to provide additional context
- Show error states with helpful messages
- Disable the select rather than hiding it when temporarily unavailable
- Keep the number of options manageable (consider search for long lists)
- Use consistent option formatting within a select
- Order options logically (alphabetically, by frequency, or by importance)

## Performance Considerations

The Select component is designed to be lightweight and performant:

- Menu elements are created on component initialization
- Options are rendered efficiently using a single DOM update
- Event delegation for option selection
- Proper cleanup on destroy to prevent memory leaks
- CSS transforms for smooth animations (GPU accelerated)
- The menu element is built once and reused; it is inserted into the DOM on open and removed again shortly after close

## Browser Compatibility

The Select component is compatible with all modern browsers:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)