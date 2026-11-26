// A component's Overview by property (the owner, 2026-11-26): one section per property, its
// values side by side in one stage, labelled. The stage is the page itself, no iframe: the
// markup is material's elements, server-rendered, inside a `catalog-visual--<slug>` box that
// the catalog script upgrades as it scrolls into view (src/client/catalog.ts), as the
// overview cards and the component heroes are. The sentences follow the component's API
// table (docs/components/<slug>.md).
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
const appBarSections: PropertySection[] = [
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
const anatomyCard = () => `<div class="property-anatomy">${m('card', { variant: 'elevated' },
  '<div slot="media" class="property-anatomy__media" data-part="2"></div>'
  + '<span slot="headline" data-part="3">Headline</span><span slot="subhead" data-part="4">Subhead</span>'
  + '<p data-part="5">Explain more about the topic shown in the headline and subhead through supporting text.</p>'
  + m('button', { slot: 'actions', variant: 'outlined' }, 'Action') + m('button', { slot: 'actions', variant: 'filled', 'data-part': '6' }, 'Action'))}</div>`;
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

const PROPERTIES: Partial<Record<string, PropertySection[]>> = {
  'button-group': buttonGroup, button, 'icon-button': iconButton, 'split-button': splitButton, fab: fabSections, 'extended-fab': extendedFab, 'fab-menu': fabMenu, timepicker, datepicker, 'loading-indicator': loadingIndicator, progress,
  'navigation-rail': navigationRail, 'navigation-bar': navigationBar, 'navigation-drawer': navigationDrawer, 'app-bar': appBarSections, tabs: tabsSections, toolbar: toolbarSections,
  card: cardSections, carousel: carouselSections, dialog: dialogSections, 'side-sheet': sideSheetSections, 'bottom-sheet': bottomSheetSections,
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
  'app-bar': {
    points: '<ul><li>The current screen\'s title, a navigation button and its most important actions, at the top.</li>'
      + '<li>Four types: small and centre-aligned on one row; medium and large, with the headline on a second row.</li>'
      + '<li>As the page scrolls, the bar takes its scrolled colour and a level of elevation, and a medium or large bar compresses to the small one.</li>'
      + '<li>It follows the window\'s scrolling, or an element\'s, named by <code>scroll-target</code>.</li></ul>',
    stage: phoneTop('large', true), caption: 'A large app bar over a library: scroll the list to compress it.', kind: 'app-bar',
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
  return { html: `<div class="property-sections">${note}${html}</div>`, toc: [...(note ? [{ id: 'property-expressive', title: 'At a glance' }] : []), ...sections.map(section => ({ id: `property-${section.key}`, title: section.title }))] };
}
