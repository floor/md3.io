# Tabs Component

Tabs organize content across different screens, data sets and other interactions that sit at the same level. Material 3 has two variants: **primary** tabs sit at the top of the content pane, under a top app bar, and **secondary** tabs subdivide one of those views. Use tabs for related content, not for sequential steps, and keep to four tabs or fewer where you can; beyond that, make the row scrollable.

## Import

```javascript
import { createTabs } from 'mtrl';
import { TAB_VARIANTS, TAB_INDICATOR_WIDTH_STRATEGIES } from 'mtrl/components/tabs/constants';
```

## Basic Usage

```javascript
const tabs = createTabs({
  tabs: [
    { text: 'Flights', value: 'flights', state: 'active' },
    { text: 'Trips', value: 'trips' },
    { text: 'Explore', value: 'explore' }
  ],
  on: { change: (event) => showPanel(event.value) }
});
tabs.element.setAttribute('aria-label', 'Travel');
document.querySelector('.travel').append(tabs.element);
```

Start one tab with `state: 'active'`; the component does not pick one for you. Name the tab row with `aria-label` (or `aria-labelledby`) when nothing else on the page does.

## Configuration

### Tabs options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `tabs` | `TabConfig[]` | `[]` | The tabs to build, in order |
| `variant` | `'primary' \| 'secondary'` | `'primary'` | Primary or secondary tabs |
| `scrollable` | `boolean` | `true` | A horizontally scrolling row, 52dp in from both edges. `false` divides the row evenly between the tabs (fixed tabs) |
| `showDivider` | `boolean` | `true` | The 1dp divider along the bottom of the row |
| `autoActivate` | `boolean` | `false` | Whether an arrow key also selects the tab it moves to. By default it only moves focus, and Space or Enter selects |
| `indicator` | `IndicatorConfig` | `{}` | The active indicator (below) |
| `groupId` | `string` | allocated | The id every tab's id is built from, `tab-<groupId>-<value>`. Pin it when ids must survive a re-render |
| `on` | `{ [event]: Function }` | `undefined` | Event handlers registered at creation, as with `on()` |
| `class` | `string` | `undefined` | Additional CSS classes on the row |

### Tab options

Each entry of `tabs`, and the argument to `addTab()`.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `text` | `string` | `undefined` | The label |
| `icon` | `string` | `undefined` | Icon as SVG markup. With a label, the icon sits above it and the row is 64dp tall |
| `ariaLabel` | `string` | `undefined` | The accessible name of a tab with an icon and no label, which otherwise has none |
| `value` | `string` | `undefined` | Identifies the tab to `change`, `setActiveTab()` and its panel |
| `state` | `'active' \| 'inactive'` | `'inactive'` | Whether the tab starts active |
| `disabled` | `boolean` | `false` | Whether the tab starts disabled |
| `badge` | `string \| number` | `undefined` | Badge content; keep it to four characters, including a "+" |
| `badgeConfig` | `object` | `undefined` | Options for the badge: `variant`, `color`, `size`, `position`, `max` |
| `ripple` | `boolean` | `true` | Whether pressing the tab shows the ripple |
| `class` | `string` | `undefined` | Additional CSS classes on the tab |

### Indicator options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `widthStrategy` | `'auto' \| 'content' \| 'dynamic' \| 'fixed'` | `'auto'` | `auto`: the label's width inset 2dp on each side (24dp at least) for primary tabs, the whole tab for secondary ones |
| `height` | `number` | 3 primary, 2 secondary | Height in pixels |
| `color` | `string` | theme `primary` | The indicator's colour |
| `visible` | `boolean` | `true` | Whether it starts shown; `getIndicator().hide()` and `show()` change it later |
| `fixedWidth` | `number` | `40` | Width for the `fixed` strategy |
| `animationDuration` | `number` | spring | Replaces Material's default spatial spring with a fixed duration in milliseconds |
| `animationTiming` | `string` | spring | An easing to use with `animationDuration` |

## Component API

### Tabs

| Method | Returns | Description |
|--------|---------|-------------|
| `addTab(config)` | `TabComponent` | Builds a tab and appends it |
| `add(tab)` | `TabsComponent` | Appends a tab built with `createTab` |
| `removeTab(tabOrValue)` | `TabsComponent` | Removes and destroys a tab |
| `getTabs()` | `TabComponent[]` | The tabs, in order |
| `getActiveTab()` | `TabComponent \| null` | The active tab |
| `setActiveTab(tabOrValue)` | `TabsComponent` | Selects a tab, updates its panels and emits `change`. An unknown value clears the selection |
| `getIndicator()` | `TabIndicator` | The indicator: `show()`, `hide()`, `setColor()`, `update()` |
| `on(event, handler)` / `off(event, handler)` | `TabsComponent` | Events: `change` |
| `destroy()` | `void` | Destroys every tab and the row |

### Tab

| Method | Returns | Description |
|--------|---------|-------------|
| `getValue()` / `setValue(value)` | `string` / `TabComponent` | The tab's value |
| `isActive()` | `boolean` | Whether the tab is selected |
| `setText(text)` / `getText()` | `TabComponent` / `string` | The label |
| `setIcon(icon)` / `getIcon()` | `TabComponent` / `string` | The icon |
| `setBadge(content)` / `getBadge()` / `showBadge()` / `hideBadge()` | `TabComponent` / `string` | The badge |
| `enable()` / `disable()` | `TabComponent` | Disabled state |
| `on(event, handler)` / `off(event, handler)` | `TabComponent` | Events: `click`, `focus`, `blur` |
| `destroy()` | `void` | Removes the tab |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `change` | `{ tab, value }` | The selected tab changed, by pointer, keyboard or `setActiveTab()`. `tab` and `value` are `null` when an unknown value cleared the selection |

## Examples

### Tabs with panels

Give each panel `role="tabpanel"`, the id `tabpanel-<groupId>-<value>` and `aria-labelledby="tab-<groupId>-<value>"`. The tabs then point at their panels with `aria-controls`, and show and hide them as the selection changes.

```javascript
const tabs = createTabs({
  groupId: 'travel',
  tabs: [
    { text: 'Flights', value: 'flights', state: 'active' },
    { text: 'Trips', value: 'trips' }
  ]
});
```

```html
<div role="tabpanel" id="tabpanel-travel-flights" aria-labelledby="tab-travel-flights">…</div>
<div role="tabpanel" id="tabpanel-travel-trips" aria-labelledby="tab-travel-trips" hidden>…</div>
```

### Fixed tabs with icons

```javascript
const media = createTabs({
  scrollable: false,
  tabs: [
    { text: 'Video', value: 'video', icon: videoIcon, state: 'active' },
    { text: 'Photos', value: 'photos', icon: photoIcon },
    { text: 'Audio', value: 'audio', icon: audioIcon }
  ]
});
```

### Icon-only tabs

```javascript
const views = createTabs({
  scrollable: false,
  tabs: [
    { icon: gridIcon, ariaLabel: 'Grid', value: 'grid', state: 'active' },
    { icon: listIcon, ariaLabel: 'List', value: 'list' }
  ]
});
```

### Secondary tabs

```javascript
const filters = createTabs({
  variant: 'secondary',
  tabs: [
    { text: 'Overview', value: 'overview', state: 'active' },
    { text: 'Specifications', value: 'specs' }
  ]
});
```

### A responsive row

`setupResponsiveBehavior` switches tabs with an icon and a label to icons only below 600px (the label stays as the accessible name), and back above it. It follows tabs added and labels changed later.

```javascript
import { setupResponsiveBehavior } from 'mtrl/components/tabs';

setupResponsiveBehavior(media, { smallScreen: { layout: 'icon-only' } });
```

## Accessibility

- The row is a `tablist`, each tab a `tab` with `aria-selected`, and a panel supplied as above a `tabpanel` linked by `aria-controls`.
- The row is one Tab stop, on the selected tab. The arrow keys move focus between tabs, following the reading direction in right-to-left layouts; Home and End go to the first and last tab. Disabled tabs are skipped.
- Space or Enter selects the focused tab, as the m3.material.io tabs accessibility guidance has it: the arrows navigate, and Space and Enter act. `autoActivate: true` selects on every arrow press instead. When focus leaves the row, its Tab stop returns to the selected tab.
- A tab with an icon and no label needs `ariaLabel`.
- The focus ring is Material's 3dp ring, drawn inside the tab so the row's edge and the scroll container never clip it.

## Styling

```css
.mtrl-tabs { }                          /* the row */
.mtrl-tabs--primary, .mtrl-tabs--secondary, .mtrl-tabs--scrollable { }
.mtrl-tabs__scroll { }                  /* the scrolling container */
.mtrl-tabs__indicator, .mtrl-tabs__divider { }
.mtrl-tabs--responsive-small { }        /* below the small breakpoint */

.mtrl-tab { }                           /* one tab, a button */
.mtrl-tab--active { }
.mtrl-tab--text-only, .mtrl-tab--icon-only, .mtrl-tab--icon-and-text { }
.mtrl-tab-panel { }
```

## Measurements

Following the m3.material.io tabs specs, then Compose's `PrimaryNavigationTabTokens` and `SecondaryNavigationTabTokens`:

| Attribute | Value |
|-----------|-------|
| Height | 48dp with a label or an icon, 64dp with both |
| Label | Title Small; `primary` (primary) or `on-surface` (secondary) when active, `on-surface-variant` when inactive |
| Icon | 24dp |
| Tab padding | 16dp on each side |
| Primary indicator | 3dp, `primary`, top corners 3dp, the label's width inset 2dp on each side, 24dp at least |
| Secondary indicator | 2dp, `primary`, the tab's full width |
| Divider | 1dp `outline-variant`, inside the row's height |
| Scrollable edge | 52dp before the first tab and after the last |
| States | An inactive tab turns `on-surface` on hover, focus and press, over an `on-surface` layer; a press on a primary tab is `primary`, drawn by the ripple |
| Motion | The indicator moves on the default spatial spring |
