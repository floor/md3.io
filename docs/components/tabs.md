# Tabs Component

The Tabs component switches between sibling views that sit at the same level of a
hierarchy. Reach for it when the user is choosing which of several equal things to
look at, not when they are moving to a different part of the app: that is
navigation's job. Tabs come in two variants, primary for the top level of a
screen and secondary for a subdivision inside one of those.

## Import

```javascript
import { createTabs } from 'mtrl';

import {
  TAB_VARIANTS,
  TAB_STATES,
  TAB_INDICATOR_WIDTH_STRATEGIES
} from 'mtrl/components/tabs';
```

## Basic Usage

```javascript
const tabs = createTabs({
  tabs: [
    { text: 'Home', value: 'home', state: 'active' },
    { text: 'Favorites', value: 'favorites' },
    { text: 'Profile', value: 'profile' }
  ]
});

container.appendChild(tabs.element);

tabs.on('change', (event) => {
  showPanel(event.value);
});
```

Exactly one tab should start with `state: 'active'`. The component does not pick
one for you.

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `tabs` | `TabConfig[]` | `undefined` | Tabs created at construction, in order |
| `variant` | `'primary' \| 'secondary'` | `'primary'` | Tabs variant. Primary indicators track the label width, secondary ones span the tab |
| `scrollable` | `boolean` | `true` | Wrap the tabs in a horizontally scrolling container |
| `showDivider` | `boolean` | `true` | Draw the 1px divider under the tab row |
| `indicator` | `IndicatorConfig` | `undefined` | Indicator sizing and animation |
| `on` | `{ change?: (event) => void, [key: string]: Function }` | `undefined` | Declared in `TabsConfig` but **accepted and not applied**: nothing in the component reads it. Register handlers with `tabs.on('change', ...)` after construction |
| `class` | `string` | `undefined` | Additional CSS classes on the container |
| `prefix` | `string` | `'mtrl'` | Prefix for CSS class names |

`indicatorHeight` and `indicatorWidthStrategy` are still accepted at the top
level but are deprecated; use the `indicator` object instead.

### Tab configuration

Each entry of `tabs`, and the argument to `addTab`, takes these options.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `text` | `string` | `undefined` | Label |
| `icon` | `string` | `undefined` | Icon HTML, typically an inline SVG |
| `value` | `string` | `undefined` | Identifier reported by the `change` event and accepted by `setActiveTab` |
| `state` | `'active' \| 'inactive' \| 'disabled'` | `'inactive'` | Initial state |
| `disabled` | `boolean` | `false` | Whether the tab starts disabled |
| `badge` | `string \| number` | `undefined` | Badge content shown on the tab |
| `badgeConfig` | `object` | `undefined` | Extra options forwarded to the badge: `variant`, `color`, `size`, `position`, `max` |
| `iconSize` | `string` | `'24px'` (annotated, not applied) | Adds an `mtrl-icon--<value>` modifier class to the icon element. `TABS_DEFAULTS.ICON_SIZE` is never merged in, so unset means no class at all, and a value like `'24px'` yields `mtrl-icon--24px`, which no stylesheet defines |
| `ripple` | `boolean` | `true` | Whether the tab ripples on press |
| `rippleConfig` | `object` | `undefined` | Ripple `duration`, `timing` and `opacity` |
| `class` | `string` | `undefined` | Additional CSS classes on the tab |
| `variant` | `string` | inherited | **Accepted and not applied.** It is merged into the tab's config, but `tab.ts` always builds a text button and adds no per-tab variant class. Set `variant` on the tabs component instead |

### Indicator configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `height` | `number` | `3` | **Accepted and not applied.** The indicator never writes a height; `_tabs.scss` fixes it at 4px for primary tabs and 2px for secondary. The legacy top-level `indicatorHeight` is inert for the same reason |
| `widthStrategy` | `'fixed' \| 'dynamic' \| 'content' \| 'auto'` | `'auto'` | How the indicator width is derived |
| `fixedWidth` | `number` | `40` | Width in pixels for the `fixed` strategy |
| `animationDuration` | `number` | `250` | Slide duration in milliseconds |
| `animationTiming` | `string` | `'cubic-bezier(0.4, 0, 0.2, 1)'` | Timing function for the slide |
| `color` | `string` | theme primary | Custom indicator colour |
| `variant` | `string` | inherited | **Accepted and not applied.** The indicator is always given the tabs component's own `variant`, so this key is overwritten |

`auto` resolves per variant: the text width for primary tabs, the full tab width
for secondary ones. `dynamic` uses half the tab width and `content` matches the
text regardless of variant.

## Component API

### Tab management

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `addTab(config)` | `config: TabConfig` | `TabComponent` | Creates a tab, appends it, and returns the new tab |
| `add(tab)` | `tab: TabComponent` | `TabsComponent` | Appends a tab built elsewhere |
| `removeTab(tabOrValue)` | `tabOrValue: TabComponent \| string` | `TabsComponent` | Removes a tab by instance or by value and destroys it |
| `getTabs()` | none | `TabComponent[]` | Every tab, in DOM order |

### Selection

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getActiveTab()` | none | `TabComponent \| null` | The active tab, or `null` when none is |
| `setActiveTab(tabOrValue)` | `tabOrValue: TabComponent \| string` | `TabsComponent` | Deactivates the others, activates this one, and emits `change` |
| `getIndicator()` | none | `TabIndicator` | The indicator instance, for direct control of its position |

### Events and lifecycle

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `on(event, handler)` | `event: string, handler: Function` | `TabsComponent` | Adds an event listener |
| `off(event, handler)` | `event: string, handler: Function` | `TabsComponent` | Removes an event listener |
| `emit(event, data)` | `event: string, data: any` | `TabsComponent` | Emits an event on the tabs component |
| `getClass(name)` | `name: string` | `string` | Prefixes a class name |
| `destroy()` | none | `void` | Destroys every tab and the container |

### The tab instance

`addTab` and `getTabs` hand back tab components with their own API.

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getValue()` | none | `string` | The tab's value |
| `setValue(value)` | `value: string` | `TabComponent` | Sets the value and the `aria-controls` it derives from it |
| `activate()` | none | `TabComponent` | Marks the tab active and sets `aria-selected="true"` |
| `deactivate()` | none | `TabComponent` | Marks the tab inactive |
| `isActive()` | none | `boolean` | Whether the tab is active |
| `enable()` | none | `TabComponent` | Removes the disabled state |
| `disable()` | none | `TabComponent` | Disables the tab and sets `aria-disabled` |
| `setText(content)` | `content: string` | `TabComponent` | Sets the label |
| `getText()` | none | `string` | Reads the label |
| `setIcon(icon)` | `icon: string` | `TabComponent` | Sets the icon HTML |
| `getIcon()` | none | `string` | Reads the icon HTML |
| `setBadge(content)` | `content: string \| number` | `TabComponent` | Sets or creates the badge |
| `getBadge()` | none | `string` | Reads the badge content |
| `showBadge()` | none | `TabComponent` | Shows the badge |
| `hideBadge()` | none | `TabComponent` | Hides the badge |
| `getBadgeComponent()` | none | `BadgeComponent \| undefined` | The underlying badge, for anything the shortcuts do not cover |
| `updateLayoutStyle()` | none | `void` | Recomputes the icon-only, text-only or icon-and-text layout class |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `change` | `{ tab, value }` | The active tab changed, whether by click, keyboard, or `setActiveTab` |

`tab` is the newly active `TabComponent` and `value` its value string. Handlers
have to be registered with `tabs.on('change', ...)` after construction: the `on`
config option is accepted but never wired to the emitter, so a handler declared
there is silently dropped.

## Examples

### Tabs driving panels

The showcase's basic example wires the `change` event to a set of panel elements.

```javascript
const tabs = createTabs({
  tabs: [
    { text: 'Home', value: 'home', state: 'active' },
    { text: 'Favorites', value: 'favorites' },
    { text: 'Profile', value: 'profile' }
  ]
});

tabs.on('change', (event) => {
  panels.forEach((panel) => panel.classList.add('hidden'));
  document.querySelector(`#panel-${event.value}`)?.classList.remove('hidden');
});
```

### Handlers after construction

The `on` config option does not work, so register every handler on the instance:

```javascript
const tabs = createTabs({
  tabs: [
    { text: 'Dashboard', value: 'dashboard', state: 'active' },
    { text: 'Analytics', value: 'analytics' },
    { text: 'Reports', value: 'reports' }
  ]
});

// and not `on: { change }` in the config above, which is ignored
tabs.on('change', (event) => log(`Tab changed to: ${event.value}`));
```

### Changing tabs at runtime

```javascript
// Disable a tab whose data has not loaded yet
tabs.getTabs()
  .find((tab) => tab.getValue() === 'reports')
  ?.disable();

// Draw attention to new data
tabs.getTabs()
  .find((tab) => tab.getValue() === 'analytics')
  ?.setBadge(3);

// Add and select a tab
const settings = tabs.addTab({ text: 'Settings', value: 'settings' });
tabs.setActiveTab(settings);
```

### Secondary tabs

```javascript
const subTabs = createTabs({
  variant: 'secondary',
  tabs: [
    { text: 'All', value: 'all', state: 'active' },
    { text: 'Starred', value: 'starred' }
  ]
});
```

## Accessibility

- The container is a `tablist` with `aria-orientation="horizontal"`; each tab
  takes `role="tab"` and keeps `aria-selected` in sync with its state.
- Each tab sets `aria-controls` to `tabpanel-<value>`, so give each panel that ID
  along with `role="tabpanel"` and `aria-labelledby="tab-<value>"`.
  `updateTabPanels`, exported from the component, will then show and hide the
  panels and manage their `tabindex` for you.
- Arrow, Home and End handling is registered, but unreachable. It runs only when
  the `tablist` container is itself the event target, and the container carries
  no `tabindex`, so focus always lands on a tab `<button>` instead. In practice
  keyboard users Tab onto each tab in turn and activate it with Enter or Space,
  which works because every tab is a real button. Do not rely on roving focus.
- A disabled tab sets `aria-disabled="true"` rather than being removed from the
  tab order silently.
- An icon-only tab ends up with no accessible name. `updateLayoutStyle` sets
  `aria-label` only when a tab has both the icon-only layout and text, and a tab
  with text is never icon-only, so the branch cannot run. Name icon tabs
  yourself: `tab.element.setAttribute('aria-label', 'Home')`.

## Styling

```css
.mtrl-tabs { }
.mtrl-tabs--primary { }
.mtrl-tabs--secondary { }
.mtrl-tabs--scrollable { }
.mtrl-tabs-scroll { }
.mtrl-tabs-divider { }
.mtrl-tabs-indicator { }

.mtrl-tab { }
.mtrl-tab--active { }
.mtrl-tab--inactive { }
.mtrl-tab--disabled { }
.mtrl-tab-container { }
.mtrl-tab-text { }
.mtrl-tab-icon { }
.mtrl-tab-badge { }
.mtrl-tab-ripple { }
```

The indicator is positioned with a `transform` transition, so animating it from
CSS means overriding `transition` on `.mtrl-tabs-indicator` rather than adding
another animation on top.

## Measurements

| Attribute | Value | Token |
|-----------|-------|-------|
| Divider colour | theme outline variant | `outline-variant`, named `// MD3: Outline variant color` in `_tabs.scss` |

The indicator is 4px tall on primary tabs and 2px on secondary, both fixed in
`_tabs.scss`; the 3px `TABS_DEFAULTS.INDICATOR_HEIGHT` is never applied, and
neither is the 24px `ICON_SIZE`. The defaults that do reach the indicator are its
250ms `cubic-bezier(0.4, 0, 0.2, 1)` slide and its 40px fixed width. None of them
names a Material token in the source, so none is claimed here.
