// A component's Overview by property (the owner, 2026-11-26): one section per property, its
// values side by side in one stage, labelled. The stage is the page itself, no iframe: the
// markup is material's elements, server-rendered, inside a `catalog-visual--<slug>` box that
// the catalog script upgrades as it scrolls into view (src/client/catalog.ts), as the
// overview cards and the component heroes are. The sentences follow the component's API
// table (docs/components/<slug>.md).
import { checkboxMark } from '../shared/list-checkbox';
import { symbols } from '../shared/icons';
import { statusBar } from './catalog';

const escape = (text: string) => text.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
type Attributes = Record<string, string | number | boolean | undefined>;
const attributes = (attrs: Attributes) => Object.entries(attrs)
  .map(([name, value]) => value === true ? ` ${name}` : value === false || value === undefined ? '' : ` ${name}="${escape(String(value))}"`).join('');
const m = (name: string, attrs: Attributes = {}, content = '') => `<m-${name}${attributes(attrs)}>${content}</m-${name}>`;

interface PropertySection {
  /** The property's name in the API, and the section's id. */
  key: string;
  title: string;
  text: string;
  /** The values shown side by side, each with the markup that shows it. */
  /** `name` is the legend's wording (the label, capitalised, otherwise). */
  values: readonly { label: string; markup: string; name?: string }[];
  /** The stage lays the values out in a column (wide or tall values). */
  stack?: boolean;
  /** Room above each value for an open menu, and between them. */
  menus?: boolean;
  /** A figure of the parts: its legend names them, numbered as the callouts are. */
  anatomy?: readonly string[];
  /** One value alone: shown without a number or a legend. */
  single?: boolean;
}

// Button group: a cup-size choice, 8 oz selected, as the API's own examples do.
const cups = (attrs: Attributes, selected: readonly string[] = ['8']) => m('button-group', { selection: 'single', 'aria-label': 'Cup size', ...attrs },
  [['8', '8 oz'], ['12', '12 oz'], ['16', '16 oz']].map(([value, label]) => m('button-group-item', { value, selected: selected.includes(value!), 'selected-icon': symbols.check }, label!)).join(''));

// One item: an icon, a label, or both; `on` marks it selected.
type Item = { icon?: keyof typeof symbols; text?: string; on?: boolean; name?: string };
const item = ({ icon, text, on, name }: Item, index: number) => m('button-group-item', {
  value: String(index), selected: on, icon: icon ? symbols[icon] : undefined,
  // The stars mark fills when selected, as in M3's figure.
  'selected-icon': icon === 'stars' ? symbols.starsFill : undefined, 'aria-label': text ? undefined : name ?? icon,
}, text ?? '');
const group = (kind: string, variant: string, items: Item[], label: string, selection = 'single') =>
  m('button-group', { kind, variant, selection, 'aria-label': label }, items.map(item).join(''));
const kindColumn = (kind: 'standard' | 'connected') => `<div class="property-column">${kind === 'standard'
  ? group('standard', 'filled', [{ icon: 'bluetooth', name: 'Bluetooth' }, { icon: 'alarm', name: 'Alarm' }, { icon: 'link', name: 'Link' }, { icon: 'wifi', name: 'Wi-Fi' }], 'Quick settings', 'none')
    + group('standard', 'tonal', [{ text: 'Label' }, { icon: 'edit', text: 'Label', on: true }, { text: 'Label' }, { icon: 'delete', name: 'Delete' }], 'Actions')
    + group('standard', 'tonal', [{ icon: 'stars' }, { icon: 'stars' }, { icon: 'stars', text: 'Label', on: true }, { icon: 'stars' }, { icon: 'stars' }], 'Rating')
  : group('connected', 'tonal', [{ icon: 'stars' }, { icon: 'stars', on: true }, { icon: 'stars' }, { icon: 'stars' }, { icon: 'stars' }], 'Rating')
    + group('connected', 'tonal', [{ icon: 'stars', text: 'Label' }, { icon: 'stars', text: 'Label', on: true }, { icon: 'stars', text: 'Label' }], 'Views')
    + group('connected', 'tonal', [{ icon: 'stars' }, { icon: 'stars', text: 'Label', on: true }, { icon: 'stars' }], 'Mode')}</div>`;
const buttonGroup: PropertySection[] = [
  // As M3's Variants figure (the owner's reference, 2026-11-26): three standard groups, three connected.
  { key: 'kind', title: 'Kind', text: 'Standard groups space their buttons apart, each its own control; connected groups join them into one.',
    values: [{ label: 'standard', name: 'Standard button group', markup: kindColumn('standard') }, { label: 'connected', name: 'Connected button group', markup: kindColumn('connected') }] },
  { key: 'variant', title: 'Variant', text: 'A group has no colours of its own: the variant goes to every button.',
    values: ['filled', 'tonal', 'outlined', 'elevated', 'text'].map(variant => ({ label: variant, markup: cups({ kind: 'connected', variant }) })), stack: true },
  { key: 'size', title: 'Size', text: 'From xs to xl, shared by every button: it sets their height.',
    values: ['xs', 's', 'm', 'l', 'xl'].map(size => ({ label: size, markup: cups({ kind: 'connected', variant: 'tonal', size }) })), stack: true },
  { key: 'shape', title: 'Shape', text: 'Round or square outer ends.',
    values: ['round', 'square'].map(shape => ({ label: shape, markup: cups({ kind: 'connected', variant: 'tonal', size: 'm', shape }) })) },
  { key: 'orientation', title: 'Orientation', text: 'A row or a column.',
    values: ['horizontal', 'vertical'].map(orientation => ({ label: orientation, markup: cups({ kind: 'connected', variant: 'tonal', orientation }) })) },
  { key: 'selection', title: 'Selection', text: 'Plain actions, or toggle buttons: one selected at a time, or several.',
    values: [['none', []], ['single', ['8']], ['multi', ['8', '12']]].map(([selection, selected]) => ({ label: selection as string, markup: cups({ kind: 'connected', variant: 'tonal', selection: selection as string }, selected as string[]) })) },
  // As M3's adaptive figure (the owner's reference, 2026-11-26): a call's controls, one line at every width.
  { key: 'resizing', title: 'Resizing', text: 'A group stays on one line as the window changes: smaller buttons in a compact window, larger ones where there is room.',
    values: [{ label: 'compact', name: 'Compact window: size S', markup: `<div class="property-call property-call--s">` + m('button-group', { kind: 'standard', variant: 'tonal', size: 's', selection: 'none', 'aria-label': 'Call controls' },
        [['mic', symbols.mic, 'Mute'], ['camera', symbols.videocam, 'Camera'], ['hand', symbols.frontHand, 'Raise hand'], ['end', symbols.callEnd, 'End call']].map(([value, icon, label]) => m('button-group-item', { value: value!, icon: icon!, 'aria-label': label! })).join('')) + '</div>' },
      { label: 'expanded', name: 'Expanded window: size L', markup: `<div class="property-call property-call--l">` + m('button-group', { kind: 'standard', variant: 'tonal', size: 'l', selection: 'none', 'aria-label': 'Call controls' },
        [['mic', symbols.mic, 'Mute'], ['camera', symbols.videocam, 'Camera'], ['hand', symbols.frontHand, 'Raise hand'], ['end', symbols.callEnd, 'End call']].map(([value, icon, label]) => m('button-group-item', { value: value!, icon: icon!, 'aria-label': label! })).join('')) + '</div>' }], stack: true },
  { key: 'density', title: 'Density', text: 'Each step lowers the height by 4dp, down to 32dp, with a 48dp hit target kept.',
    values: ['default', 'comfortable', 'compact'].map(density => ({ label: density, markup: cups({ kind: 'connected', variant: 'tonal', density }) })) },
];

// Button: a "Label" button, as M3's figures; the sentences follow Button's own document.
const btn = (attrs: Attributes, text = 'Label') => m('button', attrs, text);
const button: PropertySection[] = [
  { key: 'variant', title: 'Variant', text: 'Five, from most to least emphasis: filled for the one main action, tonal, elevated, outlined, and text for the least.',
    values: ['filled', 'tonal', 'elevated', 'outlined', 'text'].map(variant => ({ label: variant, markup: btn({ variant }) })) },
  { key: 'size', title: 'Size', text: 'From xs to xl.',
    values: ['xs', 's', 'm', 'l', 'xl'].map(size => ({ label: size, name: size.toUpperCase(), markup: btn({ size, icon: symbols.edit }) })) },
  { key: 'shape', title: 'Shape', text: 'Round or square.',
    values: ['round', 'square'].map(shape => ({ label: shape, markup: btn({ shape, size: 'm' }) })) },
  { key: 'icon', title: 'Icon', text: 'An icon before the label, or after it.',
    values: [{ label: 'none', name: 'Label only', markup: btn({}) }, { label: 'start', name: 'Leading icon', markup: btn({ icon: symbols.edit }) },
      { label: 'end', name: 'Trailing icon', markup: btn({ icon: symbols.arrowForward, 'icon-position': 'end' }) }] },
  { key: 'toggle', title: 'Toggle', text: 'A toggle button keeps its selected state, and changes its colours with it.',
    values: [{ label: 'off', name: 'Toggle, not selected', markup: btn({ toggle: true, variant: 'tonal' }) }, { label: 'on', name: 'Toggle, selected', markup: btn({ toggle: true, selected: true, variant: 'tonal' }) }] },
  { key: 'disabled', title: 'State', text: 'Disabled, a button stays visible but takes no press.',
    values: [{ label: 'enabled', markup: btn({}) }, { label: 'disabled', markup: btn({ disabled: true }) }] },
];

// Icon button, split button, FAB, extended FAB and FAB menu: their API tables' values and wording.
const ib = (attrs: Attributes) => m('icon-button', { icon: symbols.edit, 'aria-label': 'Edit', ...attrs });
const iconButton: PropertySection[] = [
  { key: 'variant', title: 'Variant', text: 'Four, in descending order of emphasis.',
    values: ['filled', 'tonal', 'outlined', 'standard'].map(variant => ({ label: variant, markup: ib({ variant }) })) },
  { key: 'size', title: 'Size', text: 'From xs to xl: the size of its container.',
    values: ['xs', 's', 'm', 'l', 'xl'].map(size => ({ label: size, name: size.toUpperCase(), markup: ib({ variant: 'filled', size }) })) },
  { key: 'width', title: 'Width', text: 'Narrow, default or wide, relative to the size\'s container.',
    values: ['narrow', 'default', 'wide'].map(width => ({ label: width, markup: ib({ variant: 'tonal', size: 'm', width }) })) },
  { key: 'shape', title: 'Shape', text: 'Round or square.',
    values: ['round', 'square'].map(shape => ({ label: shape, markup: ib({ variant: 'tonal', size: 'm', shape }) })) },
  { key: 'toggle', title: 'Toggle', text: 'A toggle icon button keeps its selected state.',
    values: [{ label: 'off', name: 'Toggle, not selected', markup: ib({ variant: 'tonal', size: 'm', toggle: true }) }, { label: 'on', name: 'Toggle, selected', markup: ib({ variant: 'tonal', size: 'm', toggle: true, selected: true }) }] },
];
const sb = (attrs: Attributes) => m('split-button', { label: 'Label', icon: symbols.edit, 'trailing-label': 'More options', ...attrs },
  ['First', 'Second', 'Third'].map(label => m('menu-item', {}, label)).join(''));
const splitButton: PropertySection[] = [
  { key: 'variant', title: 'Variant', text: 'Shared by both halves.',
    values: ['filled', 'tonal', 'outlined', 'elevated'].map(variant => ({ label: variant, markup: sb({ variant }) })) },
  { key: 'size', title: 'Size', text: 'From xs to xl, for both halves.',
    values: ['xs', 's', 'm', 'l', 'xl'].map(size => ({ label: size, name: size.toUpperCase(), markup: sb({ size }) })) },
];
const colours = ['primary-container', 'secondary-container', 'tertiary-container', 'primary', 'secondary', 'tertiary'];
const named = (value: string) => value.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
const fabSections: PropertySection[] = [
  { key: 'variant', title: 'Variant', text: 'Its colour style: a container colour, or the colour itself.',
    values: colours.map(variant => ({ label: variant, name: named(variant), markup: m('fab', { variant, icon: symbols.edit, 'aria-label': 'Edit' }) })) },
  { key: 'size', title: 'Size', text: 'Default, medium or large: the container, the icon and the corner.',
    values: ['default', 'medium', 'large'].map(size => ({ label: size, markup: m('fab', { size, icon: symbols.edit, 'aria-label': 'Edit' }) })) },
];
const xf = (attrs: Attributes) => m('extended-fab', { icon: symbols.add, ...attrs }, 'Label');
const extendedFab: PropertySection[] = [
  { key: 'variant', title: 'Variant', text: 'Its colour style: a container colour, or the colour itself.',
    values: colours.map(variant => ({ label: variant, name: named(variant), markup: xf({ variant }) })) },
  { key: 'size', title: 'Size', text: 'Small, medium or large: the height, the icon, the spacing and the label\'s type style.',
    values: ['small', 'medium', 'large'].map(size => ({ label: size, markup: xf({ size }) })) },
  { key: 'icon-position', title: 'Icon position', text: 'The icon before the label, or after it.',
    values: [{ label: 'start', name: 'Icon first', markup: xf({}) }, { label: 'end', name: 'Icon last', markup: xf({ 'icon-position': 'end' }) }] },
];
const fm = (attrs: Attributes) => m('fab-menu', { icon: symbols.edit, 'aria-label': 'Create', presentation: 'list', ...attrs },
  [['first', 'First'], ['second', 'Second'], ['third', 'Third']].map(([value, label]) => m('fab-menu-item', { value, icon: symbols.star }, label!)).join(''));
const fabMenu: PropertySection[] = [
  { key: 'color', title: 'Color', text: 'Its colour set: primary, secondary or tertiary.',
    values: ['primary', 'secondary', 'tertiary'].map(color => ({ label: color, markup: fm({ color, open: true }) })), menus: true },
  { key: 'size', title: 'Size', text: 'The FAB\'s size: default, medium or large.',
    values: ['default', 'medium', 'large'].map(size => ({ label: size, markup: fm({ size }) })) },
];

// The pickers are dialogs: each value is the real picker shown open in place, a catalog surface
// per value (src/client/catalog/timepicker.ts and datepicker.ts).
const pickerSurface = (slug: 'timepicker' | 'datepicker', suffix: string) => `<md3-catalog-${slug}-${suffix} class="property-picker"></md3-catalog-${slug}-${suffix}>`;
const timepicker: PropertySection[] = [
  { key: 'type', title: 'Input mode', text: 'A clock dial, or keyboard entry; people can switch between them with the toggle in the dialog.',
    values: [{ label: 'dial', name: 'Dial', markup: pickerSurface('timepicker', 'type-dial') }, { label: 'input', name: 'Input', markup: pickerSurface('timepicker', 'type-input') }] },
  { key: 'format', title: 'Clock format', text: 'How the time is shown: 12-hour or 24-hour. The value is 24-hour either way.',
    values: [{ label: '12h', name: '12-hour', markup: pickerSurface('timepicker', 'format-12h') }, { label: '24h', name: '24-hour', markup: pickerSurface('timepicker', 'format-24h') }] },
  { key: 'orientation', title: 'Orientation', text: 'The dialog\'s layout: horizontal puts the dial beside the time.',
    values: [{ label: 'vertical', markup: pickerSurface('timepicker', 'orientation-vertical') }, { label: 'horizontal', markup: pickerSurface('timepicker', 'orientation-horizontal') }] },
  { key: 'seconds', title: 'Seconds', text: 'Seconds can be added to the time and the value.',
    values: [{ label: 'off', name: 'Without seconds', markup: pickerSurface('timepicker', 'seconds-off') }, { label: 'on', name: 'With seconds', markup: pickerSurface('timepicker', 'seconds-on') }] },
];
const datepicker: PropertySection[] = [
  { key: 'variant', title: 'Variant', text: 'The form: inline under the field, a dialog, or a dialog opened on date entry.',
    values: [{ label: 'docked', markup: pickerSurface('datepicker', 'variant-docked') }, { label: 'modal', markup: pickerSurface('datepicker', 'variant-modal') }, { label: 'modal-input', name: 'Modal input', markup: pickerSurface('datepicker', 'variant-modal-input') }] },
  { key: 'selection', title: 'Selection', text: 'One date, or a start and an end.',
    values: [{ label: 'single', markup: pickerSurface('datepicker', 'selection-single') }, { label: 'range', markup: pickerSurface('datepicker', 'selection-range') }] },
  { key: 'view', title: 'Initial view', text: 'The calendar opens on the days, the months or the years.',
    values: [{ label: 'day', name: 'Days', markup: pickerSurface('datepicker', 'view-day') }, { label: 'month', name: 'Months', markup: pickerSurface('datepicker', 'view-month') }, { label: 'year', name: 'Years', markup: pickerSurface('datepicker', 'view-year') }] },
];

// Loading indicator and progress: their API tables' values and wording.
const li = (attrs: Attributes) => m('loading-indicator', { size: 72, 'aria-label': 'Loading', ...attrs });
const loadingIndicator: PropertySection[] = [
  { key: 'contained', title: 'Contained', text: 'Bare, or on a primary-container circle for contrast over content.',
    values: [{ label: 'false', name: 'Uncontained', markup: li({}) }, { label: 'true', name: 'Contained', markup: li({ contained: true }) }] },
  { key: 'value', title: 'Type', text: 'It loops while the wait is open-ended, or shows a value from 0 to 1.',
    values: [{ label: 'null', name: 'Indeterminate', markup: li({}) }, { label: '0.6', name: 'Determinate, at 0.6', markup: li({ value: 0.6 }) }] },
  { key: 'size', title: 'Size', text: 'Its width and height, from 24 to 240 pixels: 48 by default.',
    values: [24, 48, 96].map(size => ({ label: String(size), name: `${size}px`, markup: li({ size }) })) },
];
// A linear indicator takes its container's width: each one is given 240px here.
const pr = (attrs: Attributes) => `<div class="property-progress">${m('progress', { value: 60, 'aria-label': 'Progress', ...attrs })}</div>`;
const progress: PropertySection[] = [
  { key: 'variant', title: 'Variant', text: 'A line, or a circle.',
    values: ['linear', 'circular'].map(variant => ({ label: variant, markup: pr({ variant }) })) },
  { key: 'shape', title: 'Shape', text: 'A flat or a wavy active indicator.',
    values: ['flat', 'wavy'].map(shape => ({ label: shape, markup: `<div class="property-column">${pr({ shape })}${pr({ shape, variant: 'circular' })}</div>` })) },
  { key: 'thickness', title: 'Thickness', text: 'Thin (4px) or thick (8px).',
    values: ['thin', 'thick'].map(thickness => ({ label: thickness, markup: pr({ thickness }) })) },
  { key: 'indeterminate', title: 'Type', text: 'A value from 0 to the maximum, or activity without a value.',
    values: [{ label: 'determinate', name: 'Determinate, at 60%', markup: pr({}) }, { label: 'indeterminate', name: 'Indeterminate', markup: pr({ indeterminate: true }) }] },
  { key: 'label', title: 'Percentage', text: 'The value can be shown as a percentage beside the indicator.',
    values: [{ label: 'off', name: 'Without the percentage', markup: pr({}) }, { label: 'on', name: 'With the percentage', markup: pr({ 'show-label': true }) }] },
];

// The drawer's example is a mail app, as M3's own drawer: the boxes, a divider, personal folders.
const mailboxes: Record<string, string[][]> = {
  // A fourth field marks a message unread: the Inbox's badge counts them.
  inbox: [['Ali Connors', 'Brunch this weekend?', '10:12', 'unread'], ['Sandra Adams', 'Summer BBQ', '9:41', 'unread'], ['Trevor Hansen', 'Oui oui', 'Yesterday', 'unread'], ['Britta Holt', 'Birthday gift', 'Yesterday'], ['Lee Chen', 'Recipe to try', 'Mon'], ['Jordan Price', 'Weekend hike', 'Sun']],
  outbox: [['To Ali Connors', 'Re: Brunch this weekend?', 'Sending'], ['To the team', 'Notes from Friday', 'Sending']],
  favorites: [['Sandra Adams', 'Summer BBQ', '9:41'], ['Lee Chen', 'Recipe to try', 'Mon'], ['Mia Torres', 'Holiday photos', 'Oct 28']],
  trash: [['Newsletter', 'This week in gardening', 'Tue'], ['Store', 'Your receipt', 'Oct 27']],
  work: [['Dana Kim', 'Quarterly plan', '11:02'], ['Omar Said', 'Design review notes', 'Mon'], ['Priya Nair', 'Hiring update', 'Fri']],
  travel: [['Air North', 'Your boarding pass', 'Sat'], ['Harbour Hotel', 'Booking confirmed', 'Oct 29']],
};
const mailNames: Record<string, string> = { inbox: 'Inbox', outbox: 'Outbox', favorites: 'Favorites', trash: 'Trash', work: 'Work', travel: 'Travel' };
const unread = mailboxes.inbox!.filter(row => row[3] === 'unread').length;
const mailItems = (count = true) => [
  m('drawer-item', { value: 'inbox', icon: symbols.inbox, 'selected-icon': symbols.inboxFill, ...(count ? { badge: unread, 'badge-label': `${unread} unread` } : {}) }, 'Inbox'),
  m('drawer-item', { value: 'outbox', icon: symbols.send }, 'Outbox'), m('drawer-item', { value: 'favorites', icon: symbols.heart }, 'Favorites'), m('drawer-item', { value: 'trash', icon: symbols.delete }, 'Trash'),
  m('drawer-item', { type: 'divider' }), m('drawer-item', { type: 'section' }, 'Personal folders'),
  m('drawer-item', { value: 'work', icon: symbols.folder }, 'Work'), m('drawer-item', { value: 'travel', icon: symbols.folder }, 'Travel'),
].join('');

// Navigation: rail, bar, drawer and app bar as elements, each in a phone-width box; tabs and
// toolbar as catalog surfaces, one per value (src/client/catalog/tabs.ts and toolbar.ts).
const places = [{ value: 'inbox', label: 'Inbox', icon: symbols.inbox, badge: 8 }, { value: 'favorites', label: 'Favorites', icon: symbols.heart }, { value: 'sent', label: 'Sent', icon: symbols.send }];
const screen = (content: string, kind = 'wide') => `<div class="property-screen property-screen--${kind}">${content}</div>`;
const rail = (attrs: Attributes, badges = true) => screen(m('navigation-rail', { value: 'inbox', 'no-toggle': true, 'aria-label': 'Mail', ...attrs },
  places.map(place => m('navigation-rail-item', { value: place.value, icon: place.icon, ...(badges && place.badge ? { badge: place.badge } : {}) }, place.label)).join('')), 'tall');
const navigationRail: PropertySection[] = [
  { key: 'expanded', title: 'Expanded', text: 'Collapsed to its icons, or expanded with the labels beside them.',
    values: [{ label: 'false', name: 'Collapsed', markup: rail({}) }, { label: 'true', name: 'Expanded', markup: rail({ expanded: true }) }] },
  { key: 'badges', title: 'Badges', text: 'A destination can carry a badge, a count or a dot.',
    values: [{ label: 'off', name: 'Without badges', markup: rail({}, false) }, { label: 'on', name: 'With a badge', markup: rail({}) }] },
];
// The horizontal layout is for bars 600px wide or more (the API table).
const bar = (attrs: Attributes, badges = false) => screen(m('navigation-bar', { value: 'inbox', 'aria-label': 'Mail', ...attrs },
  places.map(place => m('navigation-bar-item', { value: place.value, icon: place.icon, ...(badges && place.badge ? { badge: place.badge } : {}) }, place.label)).join('')), attrs['item-layout'] === 'horizontal' ? 'wider' : 'wide');
const navigationBar: PropertySection[] = [
  { key: 'item-layout', title: 'Item layout', text: 'The icon above the label, or beside it.',
    values: [{ label: 'vertical', markup: bar({ 'item-layout': 'vertical' }) }, { label: 'horizontal', markup: bar({ 'item-layout': 'horizontal' }) }], stack: true },
  { key: 'badges', title: 'Badges', text: 'A destination can carry a badge, a count or a dot.',
    values: [{ label: 'off', name: 'Without badges', markup: bar({}) }, { label: 'on', name: 'With a badge', markup: bar({}, true) }], stack: true },
];
// The property boxes show the same mail drawer; without icons, the entries keep their order.
const drawer = (attrs: Attributes, icons = true) => screen(m('drawer', { open: true, value: 'inbox', headline: 'Mail', width: 240, 'aria-label': 'Mail', ...attrs },
  icons ? mailItems() : mailItems().replace(/ icon="[^"]*"/g, '').replace(/ selected-icon="[^"]*"/g, '')), 'drawer');
const navigationDrawer: PropertySection[] = [
  { key: 'dense', title: 'Density', text: 'Dense items are 36dp high, with a 48dp hit target; the type and the icons stay the same.',
    values: [{ label: 'false', name: 'Default', markup: drawer({}) }, { label: 'true', name: 'Dense', markup: drawer({ dense: true }) }] },
  { key: 'icons', title: 'Icons', text: 'A destination can show an icon before its label.',
    values: [{ label: 'on', name: 'With icons', markup: drawer({}) }, { label: 'off', name: 'Without icons', markup: drawer({}, false) }] },
];
// The app bar is laid out absolutely inside its element: the box gives it the large type's height.
const appBar = (type: string) => screen(m('top-app-bar', { type, headline: 'My library', 'no-scroll': true },
  m('icon-button', { slot: 'leading', icon: symbols.menu, 'aria-label': 'Open navigation' }) + m('icon-button', { slot: 'trailing', icon: symbols.heart, 'aria-label': 'Favorite' })), 'appbar');
// The top of a phone: an app bar over a list that scrolls under it. With `scrollTarget` the bar follows
// that list (its scrolled state, and a medium or large bar compresses), as the app bar's document says.
const library = [['Mirror lake', 'Waterhouse'], ['Honeydew', 'Waterhouse'], ['Paper boats', 'The Lindens'], ['Northern line', 'Ada Vale'], ['Glasshouse', 'The Lindens'],
  ['Slow river', 'Ada Vale'], ['Small hours', 'Waterhouse'], ['Harbour lights', 'The Lindens'], ['Open water', 'Ada Vale'], ['Late bloom', 'Waterhouse']];
let screens = 0;
const phoneTop = (type: string, follow = false, scrolled = false) => {
  const id = `property-scroll-${++screens}`;
  // The phone's status bar (9:30, signal, battery), as the overview cards' frames show it.
  return `<div class="property-top property-top--${type}"><div class="property-top__screen">${statusBar}<div class="property-top__body">`
    + m('top-app-bar', { type, headline: 'My library', ...(follow ? { 'scroll-target': id } : { 'no-scroll': true }) },
      m('icon-button', { slot: 'leading', icon: symbols.menu, 'aria-label': 'Open navigation' }) + m('icon-button', { slot: 'trailing', icon: symbols.heart, 'aria-label': 'Favorite' }))
    + `<ul class="property-phone__list property-top__list" id="${id}" tabindex="0" aria-label="My library"${scrolled ? ' data-start-scroll' : ''}>${library.map(([title, artist]) => `<li><span><strong>${title}</strong><span>${artist}</span></span></li>`).join('')}</ul></div></div></div>`;
};
// The variants, as M3's figure: each bar alone, at its own height, stacked and numbered.
const variantBar = (type: string) => `<div class="property-bar property-bar--${type}">` + m('top-app-bar', { type, headline: 'Headline', 'no-scroll': true },
  m('icon-button', { slot: 'leading', icon: symbols.arrowBack, 'aria-label': 'Back' }) + m('icon-button', { slot: 'trailing', icon: symbols.search, 'aria-label': 'Search' })
  + m('icon-button', { slot: 'trailing', icon: symbols.heart, 'aria-label': 'Favorite' })) + '</div>';
// The medium bar's anatomy, as M3's figure: container, leading button, trailing icons, headline.
const appBarAnatomy = () => `<div class="property-anatomy property-anatomy--bar"><div class="property-bar property-bar--medium">` + m('top-app-bar', { type: 'medium', headline: 'Headline', 'no-scroll': true, 'data-anatomy': true, 'data-part-shadow': '[class*=headline]:4:bottom' },
  m('icon-button', { slot: 'leading', icon: symbols.arrowBack, 'aria-label': 'Back', 'data-part': '2', 'data-part-side': 'top' }) + m('icon-button', { slot: 'trailing', icon: symbols.search, 'aria-label': 'Search', 'data-part': '3', 'data-part-side': 'top' })
  + m('icon-button', { slot: 'trailing', icon: symbols.heart, 'aria-label': 'Favorite', 'data-part': '3', 'data-part-side': 'top' })) + '</div></div>';
const appBarSections: PropertySection[] = [
  { key: 'anatomy', title: 'Anatomy', text: 'The parts of an app bar: a medium bar here; the small bar has the same, on one row.',
    values: [{ label: 'anatomy', markup: appBarAnatomy() }], anatomy: ['Container', 'Leading button', 'Trailing icons', 'Headline'] },
  { key: 'variants', title: 'Variants', text: 'Small and centre-aligned bars are one 64dp row; medium and large put the headline on a second row, and compress to the small bar as the page scrolls.',
    values: [['small', 'Small'], ['center', 'Centre-aligned'], ['medium', 'Medium'], ['large', 'Large']].map(([type, name]) => ({ label: type!, name, markup: variantBar(type!) })), stack: true },
];
// The bar flat at the top of its list, and in its scrolled state once the list has scrolled (catalog/app-bar.ts starts it scrolled).
appBarSections.push({ key: 'scroll', title: 'Scroll states', text: 'Flat at the top of the page; once it scrolls, the bar takes its scrolled colour and a level of elevation.',
  values: [{ label: 'flat', name: 'Flat', markup: phoneTop('small', true) }, { label: 'scrolled', name: 'On scroll', markup: phoneTop('small', true, true) }] });
const surfaceOf = (slug: string, suffix: string) => `<md3-catalog-${slug}-${suffix} class="property-surface"></md3-catalog-${slug}-${suffix}>`;
const tabsSections: PropertySection[] = [
  { key: 'variant', title: 'Variant', text: 'Primary tabs, for a page\'s main destinations, or secondary tabs, within a section.',
    values: [{ label: 'primary', markup: screen(surfaceOf('tabs', 'variant-primary')) }, { label: 'secondary', markup: screen(surfaceOf('tabs', 'variant-secondary')) }], stack: true },
  { key: 'icons', title: 'Icons', text: 'A tab can show an icon with its label.',
    values: [{ label: 'on', name: 'With icons', markup: screen(surfaceOf('tabs', 'icons-on')) }, { label: 'off', name: 'Without icons', markup: screen(surfaceOf('tabs', 'icons-off')) }], stack: true },
];
const toolbarSections: PropertySection[] = [
  { key: 'variant', title: 'Variant', text: 'Full width at the bottom, or a pill above the content.',
    values: [{ label: 'docked', markup: screen(surfaceOf('toolbar', 'variant-docked')) }, { label: 'floating', markup: surfaceOf('toolbar', 'variant-floating') }], stack: true },
  { key: 'color', title: 'Color', text: 'The surface container colour, or the primary container.',
    values: [{ label: 'standard', markup: surfaceOf('toolbar', 'color-standard') }, { label: 'vibrant', markup: surfaceOf('toolbar', 'color-vibrant') }] },
  { key: 'orientation', title: 'Orientation', text: 'A floating toolbar\'s layout: a docked one is always horizontal.',
    values: [{ label: 'horizontal', markup: surfaceOf('toolbar', 'orientation-horizontal') }, { label: 'vertical', markup: surfaceOf('toolbar', 'orientation-vertical') }] },
];

// Containment: card as elements; dialog as catalog surfaces, one per value (catalog/dialog.ts);
// the sheets standard (not modal), open in a screen box.
const cardOf = (attrs: Attributes, actions = true) => m('card', { headline: 'A little time outside', subhead: 'Find your next escape', ...attrs },
  actions ? m('button', { slot: 'actions', variant: 'text' }, 'Explore') + m('button', { slot: 'actions', variant: 'tonal' }, 'Save') : '');
// A photo in the card's media slot: one of the carousel's (src/shared/carousel-photos.ts: Lorem Picsum,
// Unsplash photos, loaded at view time; its licence notes are there).
const photoCard = () => m('card', { variant: 'elevated', headline: 'Himalayan Peaks', subhead: 'Nepal' },
  '<img slot="media" src="https://picsum.photos/id/29/600/338" width="600" height="338" alt="Snowy peaks of the Himalaya under a blue sky" loading="lazy">'
  + m('button', { slot: 'actions', variant: 'text' }, 'Explore') + m('button', { slot: 'actions', variant: 'tonal' }, 'Save'));
// The card's anatomy, as M3's figure: numbered callouts on its parts (catalog/card.ts places them
// on the parts it measures, so they follow the font and the theme).
const anatomyParts = ['Container', 'Media', 'Headline', 'Subhead', 'Supporting text', 'Actions'];
const anatomyCard = () => `<div class="property-anatomy">${m('card', { variant: 'elevated', 'data-anatomy': true, 'data-container-at': 0.2 },
  '<div slot="media" class="property-anatomy__media" data-part="2" data-part-side="right"></div>'
  + '<span slot="headline" data-part="3">Headline</span><span slot="subhead" data-part="4">Subhead</span>'
  + '<p data-part="5">Explain more about the topic shown in the headline and subhead through supporting text.</p>'
  + m('button', { slot: 'actions', variant: 'outlined' }, 'Action') + m('button', { slot: 'actions', variant: 'filled', 'data-part': '6', 'data-part-side': 'right' }, 'Action'))}</div>`;
const cardSections: PropertySection[] = [
  { key: 'anatomy', title: 'Anatomy', text: 'The parts of a card, top to bottom, in the order the card places them.',
    values: [{ label: 'anatomy', name: 'Anatomy', markup: anatomyCard() }], anatomy: anatomyParts },
  { key: 'variant', title: 'Variant', text: 'Elevated, with a shadow; filled, on a container colour; or outlined, with a border.',
    values: ['elevated', 'filled', 'outlined'].map(variant => ({ label: variant, markup: `<div class="property-card">${cardOf({ variant })}</div>` })) },
  { key: 'media', title: 'Media', text: 'Media at the top of the card, clipped to its shape: a photo here.',
    values: [{ label: 'photo', name: 'With a photo', markup: `<div class="property-card">${photoCard()}</div>` }] },
  { key: 'actions', title: 'Actions', text: 'A card can end with its actions, or hold content alone.',
    values: [{ label: 'on', name: 'With actions', markup: `<div class="property-card">${cardOf({ variant: 'outlined' })}</div>` }, { label: 'off', name: 'Without actions', markup: `<div class="property-card">${cardOf({ variant: 'outlined' }, false)}</div>` }] },
];
const dialogSections: PropertySection[] = [
  { key: 'size', title: 'Size', text: 'Its width: small, medium or large (it can also fill the width or the whole screen).',
    values: ['small', 'medium', 'large'].map(size => ({ label: size, markup: surfaceOf('dialog', `size-${size}`) })), stack: true },
  { key: 'divider', title: 'Dividers', text: 'Dividers can set the content apart from the title and the actions.',
    values: [{ label: 'on', name: 'With dividers', markup: surfaceOf('dialog', 'dividers-on') }, { label: 'off', name: 'Without dividers', markup: surfaceOf('dialog', 'dividers-off') }] },
];
const sheetText = '<p class="property-sheet__text">A place for useful context, related information and settings.</p>';
const sideSheet = (position: string) => screen(`<div class="property-sheet-page">Page content</div>` + m('side-sheet', { open: true, headline: 'Details', width: 220, position }, sheetText), 'sheet');
const bottomSheet = (attrs: Attributes) => screen(`<div class="property-sheet-page">Page content</div>` + m('bottom-sheet', { open: true, headline: 'Plan your visit', ...attrs }, sheetText), 'sheet');
const sideSheetSections: PropertySection[] = [
  { key: 'position', title: 'Position', text: 'The edge it docks to, in the reading direction: the end, or the start.',
    values: [{ label: 'end', markup: sideSheet('end') }, { label: 'start', markup: sideSheet('start') }] },
];
const bottomSheetSections: PropertySection[] = [
  { key: 'drag-handle', title: 'Drag handle', text: 'The handle at its top: a button, and the way to drag it taller or shorter.',
    values: [{ label: 'on', name: 'With the handle', markup: bottomSheet({}) }, { label: 'off', name: 'Without', markup: bottomSheet({ 'no-drag-handle': true }) }] },
];

// Full-screen fills a phone's screen, in portrait, and scrolls vertically (the carousel's document).
const carouselOf = (layout: string) => layout === 'full-screen'
  ? `<div class="property-device"><div class="property-device__screen">${surfaceOf('carousel', `variant-${layout}`)}</div></div>`
  : `<div class="property-carousel">${surfaceOf('carousel', `variant-${layout}`)}</div>`;
// One section per layout, each its own sentence and a full-width strip (a single value: no number, no legend).
const carouselSections: PropertySection[] = [
  ['multi-browse', 'Multi-browse', 'The default: at least one large, one medium and one small item, and more large ones as the container grows.'],
  ['uncontained', 'Uncontained', 'Items keep one size and run off the trailing edge, and the list scrolls freely, without settling on an item.'],
  ['hero', 'Hero', 'One large item, with a glimpse of the next.'],
  ['hero-center', 'Centred hero', 'One large item, centred between two small ones.'],
  ['full-screen', 'Full-screen', 'One item at a time, edge to edge, scrolling vertically: a phone\'s whole screen.'],
].map(([layout, title, text]) => ({ key: layout!, title: title!, text: text!, values: [{ label: layout!, markup: carouselOf(layout!) }], single: true }));

// Badges, on navigation bar destinations as M3's figures show them: an empty badge is the dot.
const badgeBar = (items: [string, string, string?][], label: string) => screen(m('navigation-bar', { value: '', 'aria-label': label },
  items.map(([text, icon, badge], i) => m('navigation-bar-item', { value: `d${i}`, icon, ...(badge !== undefined ? { badge, 'badge-label': badge === '' ? 'New' : `${badge} new` } : {}) }, text)).join('')), 'wide');
const badgeItem = (badge: string) => `<div class="property-badge-item">${badgeBar([['Label', symbols.stars, badge]], 'Example')}</div>`;
const badgeColors = ['error', 'primary', 'secondary', 'tertiary', 'success', 'warning', 'info'];
const badgeSections: PropertySection[] = [
  { key: 'size', title: 'Size', text: 'Small, a dot that says something is new; large, a short label with a count or a status.',
    values: [{ label: 'small', name: 'Small, on a navigation destination', markup: badgeItem('') }, { label: 'large', name: 'Large, on a navigation destination', markup: badgeItem('1') },
      { label: 'max', name: 'Large, with the most characters', markup: badgeItem('999+') }] },
  { key: 'label', title: 'Label text', text: 'A large badge holds at most four characters: a longer count shortens to 999+, or to its max and a plus.',
    values: [{ label: 'label', markup: badgeBar([['Favorites', symbols.star, '3'], ['Recent', symbols.schedule, '10'], ['Contacts', symbols.person, '99+'], ['Mail', symbols.mail, '999+']], 'Phone'), }], single: true },
  { key: 'color', title: 'Color', text: 'Error by default, as M3 maps it; material adds the theme\'s other roles for badges that carry another meaning.',
    values: badgeColors.map(color => ({ label: color, name: color[0]!.toUpperCase() + color.slice(1), markup: m('badge', { color, label: '3' }) })) },
];

// Lists, as M3's figures: the same items in each style, a star leading and a shortcut trailing.
const listOf = (attrs: Attributes, items: string) => `<div class="property-list">${m('list', { 'aria-label': 'Example', selection: 'none', ...attrs }, items)}</div>`;
const starItems = (n: number, trailing = true, selected: number[] = []) => Array.from({ length: n }, (_, i) => m('list-item', { value: `i${i + 1}`, headline: 'List item', 'leading-icon': symbols.stars, ...(trailing ? { 'trailing-text': '⌘C' } : {}), ...(selected.includes(i + 1) ? { selected: true } : {}) })).join('');
// The glance's task list, as M3's list anatomy: an icon, the task and its due date, and a checkbox
// after it, checked for the tasks that are done (two, always the same on load).
const tasks: [string, string, string, string, boolean][] = [
  ['invites', symbols.mail, 'Mail out invitations', 'Due Mon 1 Dec', true],
  ['dessert', symbols.restaurant, 'Order a gluten-free dessert for 12', 'Due Wed 3 Dec', false],
  ['karaoke', symbols.mic, 'Book the karaoke venue', 'Due Thu 4 Dec', true],
  ['music', symbols.musicNote, 'Make a playlist', 'Due Fri 5 Dec', false],
];
const taskItems = () => m('list-item', { kind: 'subheader', headline: 'Party planning' })
  + tasks.map(([value, icon, headline, due, done]) => m('list-item', { value, headline, 'supporting-text': due, 'leading-icon': icon,
    'trailing-icon': checkboxMark(done), ...(done ? { selected: true } : {}) })).join('');
const listSections: PropertySection[] = [
  { key: 'style', title: 'Style', text: 'Standard items sit on the surface; segmented items are each their own rounded tile. The look changes, not the behaviour.',
    values: [{ label: 'standard', name: 'Standard', markup: listOf({ variant: 'standard', selection: 'single', value: 'i3' }, starItems(6)) },
      { label: 'segmented', name: 'Segmented', markup: listOf({ variant: 'segmented', selection: 'single', value: 'i3' }, starItems(6)) }] },
  { key: 'selection', title: 'Selection', text: 'One mode per list: items that act, a single choice, or several.',
    values: [{ label: 'none', name: 'Single action: each item one target', markup: listOf({ variant: 'segmented', selection: 'none' }, starItems(4, false)) },
      { label: 'single', name: 'Single select', markup: listOf({ variant: 'segmented', selection: 'single', value: 'i3' }, starItems(4, false)) },
      { label: 'multiple', name: 'Multi-select', markup: listOf({ variant: 'segmented', selection: 'multiple' }, starItems(4, false, [3, 4])) }] },
  { key: 'lines', title: 'Lines', text: 'A headline alone, with supporting text, or with an overline above it.',
    values: [{ label: 'one', name: 'One line', markup: listOf({}, m('list-item', { headline: 'Mirror lake', 'leading-icon': symbols.libraryMusic }) ) },
      { label: 'two', name: 'Two lines', markup: listOf({}, m('list-item', { headline: 'Mirror lake', 'supporting-text': 'Waterhouse', 'leading-icon': symbols.libraryMusic })) },
      { label: 'three', name: 'Three lines', markup: listOf({}, m('list-item', { overline: 'Now playing', headline: 'Mirror lake', 'supporting-text': 'Waterhouse', 'leading-icon': symbols.libraryMusic })) }], stack: true },
  { key: 'leading', title: 'Leading content', text: 'An icon, an avatar or an image before the text.',
    values: [{ label: 'icon', name: 'Icon', markup: listOf({}, m('list-item', { headline: 'Ada Vale', 'supporting-text': 'Contact', 'leading-icon': symbols.person })) },
      { label: 'avatar', name: 'Avatar', markup: listOf({}, m('list-item', { headline: 'Ada Vale', 'supporting-text': 'Contact', 'leading-avatar': 'A' })) },
      { label: 'image', name: 'Image', markup: listOf({}, m('list-item', { headline: 'Paper boats', 'supporting-text': 'The Lindens', 'leading-image': 'https://picsum.photos/id/1015/112/112' })) }], stack: true },
  { key: 'trailing', title: 'Trailing content', text: 'A short text, such as a count or a shortcut, or an icon after the text.',
    values: [{ label: 'text', name: 'Text', markup: listOf({}, m('list-item', { headline: 'Inbox', 'supporting-text': 'Mail', 'trailing-text': '100+' })) },
      { label: 'icon', name: 'Icon', markup: listOf({}, m('list-item', { headline: 'Settings', 'supporting-text': 'Display, sound', 'trailing-icon': symbols.chevronRight })) }], stack: true },
];

const PROPERTIES: Partial<Record<string, PropertySection[]>> = {
  'button-group': buttonGroup, button, 'icon-button': iconButton, 'split-button': splitButton, fab: fabSections, 'extended-fab': extendedFab, 'fab-menu': fabMenu, timepicker, datepicker, 'loading-indicator': loadingIndicator, progress,
  'navigation-rail': navigationRail, 'navigation-bar': navigationBar, 'navigation-drawer': navigationDrawer, 'app-bar': appBarSections, tabs: tabsSections, toolbar: toolbarSections,
  card: cardSections, carousel: carouselSections, badge: badgeSections, list: listSections, dialog: dialogSections, 'side-sheet': sideSheetSections, 'bottom-sheet': bottomSheetSections,
};

// A component at a glance, as m3.material.io's component pages open: a few points in our own
// words, from the component's document (docs/components/<slug>.md), beside the component in a
// phone screen.
interface ExpressiveNote { points: string; stage: string; caption: string; kind?: string; advice?: string }
// A music app, scrollable inside the phone: one list per destination of the bar, the current one
// shown; choosing a destination shows its list (src/client/catalog/navigation-bar.ts).
const destinationsOfPhone = [{ value: 'home', label: 'Home', icon: symbols.home }, { value: 'music', label: 'Music', icon: symbols.libraryMusic }, { value: 'podcasts', label: 'Podcasts', icon: symbols.podcasts }];
const shelves: Record<string, string[][]> = {
  home: [['Morning mix', 'Made for you', '25 songs'], ['Focus', 'Instrumental, calm', '40 songs'], ['Recently played', 'Mirror lake and 11 more', '12 songs'], ['Road trip', 'Your playlist', '58 songs'], ['New releases', 'From artists you follow', '18 songs'], ['Late night', 'Slow and low', '31 songs']],
  music: [['Mirror lake', 'Waterhouse', '2:44'], ['Honeydew', 'Waterhouse', '3:25'], ['Paper boats', 'The Lindens', '3:58'], ['Northern line', 'Ada Vale', '4:12'], ['Glasshouse', 'The Lindens', '3:07'], ['Slow river', 'Ada Vale', '5:01'], ['Small hours', 'Waterhouse', '3:39']],
  podcasts: [['How cities grow', 'Urban Notes, episode 42', '38 min'], ['The kitchen table', 'Food Talk, episode 117', '52 min'], ['Night sky in winter', 'Look Up, episode 9', '27 min'], ['Learning to listen', 'Quiet Hours, episode 3', '44 min'], ['Small engines', 'Workshop, episode 71', '33 min']],
};
const labels: Record<string, string> = { home: 'Home', music: 'Music', podcasts: 'Podcasts' };
const lists = (boxes: Record<string, string[][]> = shelves, names: Record<string, string> = labels, first = 'home') => Object.entries(boxes).map(([box, rows]) => `<ul class="property-phone__list" data-for="${box}" tabindex="0" aria-label="${names[box]}"${box === first ? '' : ' hidden'}>`
  + rows.map(([who, what, when, state]) => `<li${state === 'unread' ? ' class="is-unread"' : ''}><span><strong>${who}</strong><span>${what}</span></span><span>${when}${state === 'unread' ? '<span class="property-phone__unread" aria-label="Unread"></span>' : ''}</span></li>`).join('') + '</ul>').join('');
const phone = () => `<div class="property-phone"><div class="property-phone__screen">${lists()}`
  + m('navigation-bar', { value: 'home', 'aria-label': 'Music app' }, destinationsOfPhone.map(place => m('navigation-bar-item', { value: place.value, icon: place.icon }, place.label)).join(''))
  + `<div class="property-phone__home" aria-hidden="true"><span></span></div></div></div>`;
const tablet = (navigation: string, content = lists(), bleed = false) => `<div class="property-phone property-phone--tablet${bleed ? ' property-phone--bleed' : ''}"><div class="property-phone__screen property-phone__screen--side">${navigation}<div class="property-phone__content">${content}</div></div></div>`;
// As the drawer's: the mail app, the rail expanded (M3 Expressive's replacement for the drawer), its menu
// button kept so it collapses and expands; the screen runs off the stage's right and bottom edges.
const tabletRail = () => tablet(m('navigation-rail', { value: 'inbox', expanded: true, 'aria-label': 'Mail' },
  [['inbox', symbols.inbox, 'Inbox', unread], ['outbox', symbols.send, 'Outbox'], ['favorites', symbols.heart, 'Favorites'], ['trash', symbols.delete, 'Trash']]
    .map(([value, icon, label, badge]) => m('navigation-rail-item', { value: value as string, icon: icon as string, ...(value === 'inbox' ? { 'selected-icon': symbols.inboxFill } : {}), ...(badge ? { badge: badge as number } : {}) }, label as string)).join('')),
  lists(mailboxes, mailNames, 'inbox'), true);
const tabletDrawer = () => tablet(m('drawer', { open: true, value: 'inbox', headline: 'Mail', width: 260, 'aria-label': 'Mail' }, mailItems()), lists(mailboxes, mailNames, 'inbox'), true);
const NOTES: Partial<Record<string, ExpressiveNote>> = {
  // The button family at a glance: each in a small scene of its own, a card on the stage.
  button: {
    points: '<ul><li>An action a person can take: send, save, confirm, or go on to the next step.</li>'
      + '<li>Five variants by emphasis: filled for the one main action, then tonal, elevated, outlined and text.</li>'
      + '<li>A label, with an icon before or after it; five sizes, round or square.</li>'
      + '<li>A toggle button keeps its selected state.</li></ul>',
    stage: `<div class="property-scene"><h3>Your order is on its way</h3><p>Order 2041 left the shop at 9:12 and arrives between 11:00 and 11:30.</p>`
      + `<div class="property-scene__actions">${btn({ variant: 'text' }, 'Details')}${btn({ variant: 'filled', icon: symbols.schedule }, 'Track order')}</div></div>`,
    caption: 'One main action, filled; a second, quieter one, as text.', kind: 'button',
  },
  'icon-button': {
    points: '<ul><li>One action shown as an icon alone, where the icon says enough: play, skip, like.</li>'
      + '<li>Four variants by emphasis: filled, tonal, outlined and standard.</li>'
      + '<li>Five sizes, narrow, default or wide, round or square.</li>'
      + '<li>A toggle keeps its state; its label for screen readers is <code>aria-label</code>.</li></ul>',
    stage: `<div class="property-scene property-scene--player"><h3>Mirror lake</h3><p>Waterhouse</p><div class="property-scene__row">`
      + ib({ icon: symbols.heart, 'selected-icon': symbols.heartFill, 'aria-label': 'Like', toggle: true, selected: true })
      + ib({ icon: symbols.skipPrevious, 'aria-label': 'Previous' }) + ib({ icon: symbols.pause, 'aria-label': 'Pause', variant: 'filled', size: 'l', width: 'wide' })
      + ib({ icon: symbols.skipNext, 'aria-label': 'Next' }) + ib({ icon: symbols.playlistAdd, 'aria-label': 'Add to playlist' }) + '</div></div>',
    caption: 'A player: the main control filled and wide, the others standard; the heart is a toggle.', kind: 'icon-button',
  },
  'button-group': {
    points: '<ul><li>Related buttons together: actions side by side, or a choice among options.</li>'
      + '<li>Standard groups space their buttons; connected groups join them into one control.</li>'
      + '<li>Plain actions, or a choice: one at a time, or several.</li>'
      + '<li>One variant, size and shape for every button in it.</li></ul>',
    // As M3's figure: an app's welcome screen, its first step between accessibility and language.
    stage: `<div class="property-welcome"><div class="property-welcome__screen"><p class="property-scene__hello">Welcome</p><div class="property-scene__row">`
      + m('button-group', { kind: 'standard', variant: 'tonal', size: 'l', selection: 'none', 'aria-label': 'Get started' },
        m('button-group-item', { value: 'access', icon: symbols.accessibilityNew, 'aria-label': 'Accessibility' }) + m('button-group-item', { value: 'start' }, 'Get started')
        + m('button-group-item', { value: 'language', icon: symbols.language, 'aria-label': 'Language' })) + '</div><div class="property-phone__home" aria-hidden="true"><span></span></div></div></div>',
    caption: 'An app\'s welcome screen: Get started, between accessibility and language. Press one: it widens and its neighbours narrow.', kind: 'button-group',
  },
  'split-button': {
    points: '<ul><li>One main action and a menu of related ones, in two halves.</li>'
      + '<li>The leading half does the action; the trailing half opens the menu.</li>'
      + '<li>Filled, tonal, outlined or elevated, shared by both halves.</li>'
      + '<li>Five sizes, from XS to XL.</li></ul>',
    stage: `<div class="property-scene"><h3>Reply to Ada</h3><p>Thanks, Saturday works. I will bring the basil.</p><div class="property-scene__actions">`
      + m('split-button', { label: 'Send', icon: symbols.send, 'trailing-label': 'More send options', variant: 'filled' }, ['Schedule send', 'Save as draft'].map(label => m('menu-item', {}, label)).join('')) + '</div></div>',
    caption: 'Send now, or open the menu to schedule it.', kind: 'split-button',
  },
  fab: {
    points: '<ul><li>The screen\'s most important action, always within reach.</li>'
      + '<li>Placed at the end of the screen, above the content.</li>'
      + '<li>A container colour, or the colour itself, in three sizes.</li>'
      + '<li>An icon alone: give it an <code>aria-label</code>.</li></ul>',
    stage: `<div class="property-scene property-scene--screen"><h3>Notes</h3>${lists({ notes: [['Shopping list', 'Milk, eggs, bread', 'Today'], ['Trip', 'Book the train', 'Mon'], ['Ideas', 'A garden bench', '20 Nov'], ['Books', 'Three to read', '12 Nov']] }, { notes: 'Notes' }, 'notes')}`
      + m('fab', { icon: symbols.add, 'aria-label': 'New note' }) + '</div>',
    caption: 'A notes app: the FAB adds a note.', kind: 'fab',
  },
  'extended-fab': {
    points: '<ul><li>The screen\'s most important action, with its name beside the icon.</li>'
      + '<li>Clearer than a FAB when the icon alone could be read two ways.</li>'
      + '<li>Three sizes; the icon before the label or after it.</li>'
      + '<li>A container colour, or the colour itself.</li></ul>',
    stage: `<div class="property-scene property-scene--screen"><h3>Inbox</h3>${lists(mailboxes, mailNames, 'inbox')}` + xf({ icon: symbols.edit }).replace('>Label<', '>Compose<') + '</div>',
    caption: 'A mail app: Compose, named so it cannot be mistaken.', kind: 'extended-fab',
  },
  'fab-menu': {
    points: '<ul><li>A FAB that opens a few related actions, two to six.</li>'
      + '<li>The FAB turns into a close button while the menu is open.</li>'
      + '<li>Primary, secondary or tertiary colours, in three sizes.</li>'
      + '<li>Each item an icon and a label.</li></ul>',
    stage: `<div class="property-scene property-scene--screen"><h3>Notes</h3>${lists({ notes: [['Shopping list', 'Milk, eggs, bread', 'Today'], ['Trip', 'Book the train', 'Mon'], ['Ideas', 'A garden bench', '20 Nov']] }, { notes: 'Notes' }, 'notes')}`
      + m('fab-menu', { icon: symbols.add, 'aria-label': 'Create', presentation: 'list' }, [['note', 'Note', symbols.edit], ['list', 'List', symbols.check], ['photo', 'Photo', symbols.image]].map(([value, label, icon]) => m('fab-menu-item', { value: value!, icon: icon! }, label!)).join('')) + '</div>',
    caption: 'A notes app: open the menu to choose what to create.', kind: 'fab-menu',
  },

  dialog: {
    points: '<ul><li>A short task or a decision that needs an answer before going on: it interrupts on purpose.</li>'
      + '<li>A title, content such as a message or a few choices, and the actions at the end.</li>'
      + '<li>A scrim dims the page behind it; keyboard focus stays inside until it closes.</li>'
      + '<li>Small, medium or large, or the whole screen on a phone.</li></ul>',
    // A clock's alarm settings, dimmed behind the dialog that changes the alarm's sound.
    stage: `<div class="property-device property-device--dialog"><div class="property-device__screen property-dialog-screen">${statusBar}<h3>Alarm</h3>`
      + '<ul class="property-phone__list"><li><span><strong>Time</strong><span>7:00</span></span></li><li><span><strong>Repeat</strong><span>Weekdays</span></span></li>'
      + '<li><span><strong>Alarm sound</strong><span>None</span></span></li><li><span><strong>Vibrate</strong><span>On</span></span></li></ul>'
      + `<div class="property-dialog-screen__scrim"></div>${surfaceOf('dialog', 'glance')}</div></div>`,
    caption: 'An alarm\'s sound, chosen in a dialog over its settings: pick one to turn on OK.', kind: 'dialog',
  },
  list: {
    points: '<ul><li>Rows of related items to scan, find one, and act on it.</li>'
      + '<li>Each item a headline, with supporting text or an overline, and content before and after it.</li>'
      + '<li>Standard or segmented: the same list, on the surface or as separate tiles.</li>'
      + '<li>Items can act, or be chosen one at a time or several at once; the selected ones are highlighted.</li></ul>',
    stage: `<div class="property-tasks"><h3>My tasks</h3>${m('list', { variant: 'segmented', selection: 'multiple', 'aria-label': 'Party planning' }, taskItems())}</div>`,
    caption: 'A task list: choose the tasks that are done.', kind: 'list',
  },
  badge: {
    points: '<ul><li>A small mark on an icon that says something changed there: new messages, a count, a status.</li>'
      + '<li>Small, a dot; large, a label of up to four characters.</li>'
      + '<li>On navigation destinations through their <code>badge</code> attribute, an empty value for the dot; anywhere else with <code>&lt;m-badge&gt;</code>.</li>'
      + '<li>Give it a label for screen readers, such as <code>badge-label="3 new messages"</code>.</li></ul>',
    stage: `<div class="property-badge-glance">${badgeBar([['Mail', symbols.mail, '999+'], ['Chat', symbols.chat, '10'], ['Rooms', symbols.groups, ''], ['Meet', symbols.videocam, '3']], 'Messaging')}</div>`,
    caption: 'A messaging app\'s destinations: counts on Mail, Chat and Meet, a dot on Rooms.', kind: 'navigation-bar',
  },
  'app-bar': {
    points: '<ul><li>The current screen\'s title, a navigation button and its most important actions, at the top.</li>'
      + '<li>Four types: small and centre-aligned on one row; medium and large, with the headline on a second row.</li>'
      + '<li>As the page scrolls, the bar takes its scrolled colour and a level of elevation, and a medium or large bar compresses to the small one.</li>'
      + '<li>It follows the window\'s scrolling, or an element\'s, named by <code>scroll-target</code>.</li></ul>',
    stage: phoneTop('large', true), caption: 'A large app bar over a library: scroll the list to compress it.', kind: 'app-bar',
    // M3's app bars page, read 2026-11-26: medium flexible and large flexible replace medium and large, no longer recommended.
    advice: 'M3 Expressive no longer recommends the medium and large app bars: medium flexible and large flexible app bars replace them. material does not have the flexible bars yet; the medium and large ones here are the baseline bars. <a class="text-link" href="https://m3.material.io/components/app-bars/overview">M3\'s note</a>',
  },
  carousel: {
    points: '<ul><li>A collection to browse rather than read in full: photos, artwork, featured entries.</li>'
      + '<li>Its items change size as they scroll, and settle into place.</li>'
      + '<li>Five layouts: multi-browse, uncontained, hero, centred hero and full-screen.</li>'
      + '<li>Scrolling settles on an item by default; an uncontained carousel scrolls freely.</li></ul>',
    // The places, as the carousel's card shows them; each layout below has its own photos.
    stage: '<div class="property-carousel property-carousel--glance"><md3-catalog-carousel class="property-surface"></md3-catalog-carousel></div>',
    caption: 'Places to explore, in the default multi-browse layout: drag or scroll it.', kind: 'carousel',
  },
  card: {
    points: '<ul><li>One subject on one surface: its media, a title, supporting text and its actions.</li>'
      + '<li>The card puts its sections in M3\'s order: media, header, content, then actions.</li>'
      + '<li>Elevated, filled or outlined, by how much it should stand out.</li>'
      + '<li>The whole card can be one button when it leads to one place.</li></ul>',
    stage: `<div class="property-card property-card--glance">${m('card', { variant: 'elevated', headline: 'Himalayan Peaks', subhead: 'From your saved places' },
      '<img slot="media" src="https://picsum.photos/id/29/600/338" width="600" height="338" alt="Snowy peaks of the Himalaya under a blue sky" loading="lazy">'
      + m('button', { slot: 'actions', variant: 'filled' }, 'Plan a trip'))}</div>`,
    caption: 'A card about one place: its photo, its name, and the one thing to do next.', kind: 'card',
  },
  'navigation-rail': {
    points: '<ul><li>Three to seven destinations in a column along the side of a medium or expanded window.</li>'
      + '<li>Collapsed, the labels sit under the icons; expanded, it widens into a panel with the labels beside them.</li>'
      + '<li>A modal rail expands over the page in a dialog; a standard one takes its place in the layout.</li>'
      + '<li>A badge on any destination: a count, a short text, or a dot.</li></ul>',
    stage: tabletRail(), caption: 'An expanded rail beside a mail app\'s boxes: choose one to see its messages, or collapse it with its menu button.', kind: 'navigation-rail',
  },
  'navigation-drawer': {
    points: '<ul><li>The app\'s destinations in a vertical list along one edge, grouped with dividers, section labels and expandable sections.</li>'
      + '<li>Standard, inline in a wide window; or modal, over the page behind a scrim.</li>'
      + '<li>Each destination a button, or a link when it has an <code>href</code>.</li>'
      + '<li>Dense items keep long lists compact, with a 48dp target kept.</li></ul>',
    stage: tabletDrawer(), caption: 'A drawer beside a mail app\'s boxes: choose one to see its messages.', kind: 'navigation-drawer',
    // M3's navigation drawer page, read 2026-11-26: the drawer is no longer recommended; the expanded rail replaces it.
    advice: 'M3 Expressive no longer recommends the navigation drawer: an expanded <a class="text-link" href="/components/navigation-rail/">navigation rail</a> does most of the same and adapts better across window sizes. <a class="text-link" href="https://m3.material.io/components/navigation-drawer/overview">M3\'s note</a>',
  },
  'navigation-bar': {
    points: '<ul><li>The app\'s main destinations, in a row along the bottom of the window: each a button, or a link when it has an <code>href</code>.</li>'
      + '<li>The icon above its label, or beside it: <code>itemLayout: \'auto\'</code> switches at 600px wide.</li>'
      + '<li>A badge on any destination: a count, a short text, or a dot.</li>'
      + '<li>It can hide as the page scrolls down, and come back on the way up.</li></ul>',
    stage: phone(),
    caption: 'Three destinations at the bottom of a music app: choose one to see its list.',
  },
};
const expressiveNote = (slug: string): string => {
  const note = NOTES[slug];
  if (!note) return '';
  return (note.advice ? `<p class="property-advice" role="note">${note.advice}</p>` : '')
    + `<section class="property-note" aria-labelledby="property-expressive"><h2 id="property-expressive">At a glance</h2><div class="property-note__body">`
    + `<div class="property-note__points">${note.points}</div>`
    + `<figure class="property-note__figure"><div class="catalog-visual catalog-visual--${note.kind ?? slug} property-note__stage">${note.stage}</div><figcaption>${note.caption}</figcaption></figure></div></section>`;
};

// Known issues, at the end of a component's Overview: what M3 recommends that material does not do yet,
// and the bugs we know of, each one sentence; an entry goes when its fix ships. Each was found on
// 2026-11-26 against material 3.16.4 (the M3 points from the component's M3 page, read that day).
const KNOWN_ISSUES: Partial<Record<string, { missing?: string[]; bugs?: string[] }>> = {
  'app-bar': { missing: [
    'The search app bar, with a search field and elements inside and outside it.',
    'A subtitle under the headline.',
    'The medium flexible and large flexible app bars, which replace the medium and large ones in M3 Expressive.',
    'An image or a logo in place of the headline.',
    'Leading or centred text on every app bar: only the one-row bar can be centred today.',
  ] },
  list: { missing: [
    'Items with a primary action and secondary actions of their own, such as a bookmark or a menu button.',
    'Expanding and collapsing an item to show the items under it.',
    'Swiping an item to reveal more actions.',
  ] },
  // The button family, from material's conformance matrix (Priam, checked 2026-11-26 against material 3.16.5:
  // m3.material.io read that day, Compose Material 3 tokens 41.1.19 and 1.4.0). "Newest tokens" marks a
  // value Google changed in its newest tokens, not yet in a released version.
  button: { bugs: [
    'At density −3 a small button stays 32px tall, where M3\'s density scale gives 28dp (−4dp per step); levels 0 to −2 match.',
    'A small toggle button in the square shape, when selected, has a 20px corner, where M3 specifies 12dp.',
  ] },
  'icon-button': { bugs: [
    'At density −3 a small icon button stays 32px tall, where M3\'s density scale gives 28dp.',
    'The keyboard focus ring is 2px wide, where M3\'s focus ring is 3dp (colour and offset match).',
    'An icon button created with <code>shape: undefined</code> loses its round shape at sizes other than small; fixed in material 3.16.6.',
  ] },
  'button-group': { missing: ['A variant, size or width per button: every button takes the group\'s, so a wide filled action between tonal icons, as in M3\'s figures, is not possible.'], bugs: ['The group follows its buttons\' height at every density level, so at −3 it inherits the small button\'s 32px floor (M3: 28dp).'] },
  'split-button': { missing: ['Density: the split button keeps its height at every density level.'], bugs: [
    'A selected split button shows no state layer on its trailing half, where M3 applies one without changing the colour.',
    'The menu icon is not optically offset when unselected (M3: −1, −1, −2, −3 and −6dp from XS to XL).',
    'At rest, the inner corners at sizes M, L and XL are 4dp rounder than M3: 8, 12 and 16px instead of 4, 8 and 12dp.',
    'At sizes XS and S the 48px touch area is shifted upward, so a press just below the button misses.',
  ] },
  fab: { bugs: [
    'The keyboard focus ring is 2px in the outline colour, where M3\'s is 3dp in the secondary colour.',
    'The large FAB\'s icon is 32px, where M3\'s newest tokens give 36dp (the released tokens say 32).',
  ] },
  'extended-fab': { bugs: [
    'The keyboard focus ring is 2px in the outline colour, where M3\'s is 3dp in the secondary colour.',
    'The large size\'s icon is 32px, where M3\'s newest tokens give 36dp (newest tokens only).',
    'At sizes M and L the space between icon and label is 16 and 20px, where M3\'s newest tokens give 12 and 16dp (newest tokens only).',
  ] },
  'fab-menu': { bugs: ['Menu items keep no shadow on hover, focus and press, where M3\'s newest tokens raise them to level 4 on hover and level 3 on focus and press (newest tokens only).'] },
  dialog: { bugs: ['The medium and large dialogs share one maximum width, 560px, so large is no wider than medium.'] },
  timepicker: { bugs: ['With seconds shown, the dialog stays 328px wide while its fields need 400px, so the hour is cut at the left.'] },
  progress: { missing: ['The web component <code>&lt;m-progress&gt;</code> cannot hide the stop indicator; the JavaScript factory can, with <code>showStopIndicator: false</code>.'] },
  'navigation-drawer': { missing: ['M3 Expressive recommends the expanded navigation rail in its place; the drawer stays available.'] },
};
const knownIssues = (slug: string): string => {
  const issues = KNOWN_ISSUES[slug];
  if (!issues) return '';
  const list = (title: string, items?: string[]) => items?.length ? `<h3>${title}</h3><ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>` : '';
  return `<section class="property-section property-issues" aria-labelledby="property-known-issues"><div class="property-section__heading"><h2 id="property-known-issues">Known issues</h2>`
    + `<p>What M3 recommends that material does not do yet, and the bugs we know of, on material's current release.</p></div>`
    + list('Not yet in material', issues.missing) + list('Bugs', issues.bugs) + '</section>';
};

export const hasPropertyOverview = (slug: string): boolean => slug in PROPERTIES;

/** The Overview's sections and its On this page entries, for a component with properties. */
export function propertyOverview(slug: string, links: { playground: string; develop: string; codeIcon: string; playIcon: string }, name: string) {
  const sections = PROPERTIES[slug]!;
  const html = sections.map(section => {
    const id = `property-${section.key}`;
    const stage = `<div class="catalog-visual catalog-visual--${slug} property-stage${section.stack ? ' property-stage--stack' : ''}${section.menus ? ' property-stage--menus' : ''}">`
      // As M3's figures: a number under each value, and a legend below the stage.
      + (section.anatomy || section.single ? section.values.map(value => value.markup).join('')
        : section.values.map((value, index) => `<figure class="property-value">${value.markup}<figcaption><span class="property-number" aria-hidden="true">${index + 1}</span><span class="sr-only">${escape(value.name ?? value.label)}</span></figcaption></figure>`).join('')) + `</div>`;
    const name = (value: PropertySection['values'][number]) => value.name ?? value.label.charAt(0).toUpperCase() + value.label.slice(1);
    const legend = section.single ? '' : section.anatomy
      ? `<ol class="property-legend">${section.anatomy.map((part, index) => `<li><span class="property-number" aria-hidden="true">${index + 1}</span>${escape(part)}</li>`).join('')}</ol>`
      : `<ol class="property-legend">${section.values.map((value, index) => `<li><span class="property-number" aria-hidden="true">${index + 1}</span>${escape(name(value))}</li>`).join('')}</ol>`;
    return `<section class="property-section" aria-labelledby="${id}"><div class="property-section__heading"><div><h2 id="${id}">${escape(section.title)}</h2><p>${escape(section.text)}</p></div></div>${stage}${legend}</section>`;
  }).join('');
  const note = expressiveNote(slug);
  const issues = knownIssues(slug);
  return { html: `<div class="property-sections">${note}${html}${issues}</div>`, toc: [...(note ? [{ id: 'property-expressive', title: 'At a glance' }] : []), ...sections.map(section => ({ id: `property-${section.key}`, title: section.title })), ...(issues ? [{ id: 'property-known-issues', title: 'Known issues' }] : [])] };
}
