// A component's Overview by property (the owner, 2026-11-26): one section per property, its
// values side by side in one stage, labelled. The stage is the page itself, no iframe: the
// markup is material's elements, server-rendered, inside a `catalog-visual--<slug>` box that
// the catalog script upgrades as it scrolls into view (src/client/catalog.ts), as the
// overview cards and the component heroes are. The sentences follow the component's API
// table (docs/components/<slug>.md).
import { symbols } from '../shared/icons';

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

const PROPERTIES: Partial<Record<string, PropertySection[]>> = {
  'button-group': buttonGroup, button, 'icon-button': iconButton, 'split-button': splitButton, fab: fabSections, 'extended-fab': extendedFab, 'fab-menu': fabMenu, timepicker, datepicker,
};

export const hasPropertyOverview = (slug: string): boolean => slug in PROPERTIES;

/** The Overview's sections and its On this page entries, for a component with properties. */
export function propertyOverview(slug: string, links: { playground: string; develop: string; codeIcon: string; playIcon: string }, name: string) {
  const sections = PROPERTIES[slug]!;
  const html = sections.map(section => {
    const id = `property-${section.key}`;
    const stage = `<div class="catalog-visual catalog-visual--${slug} property-stage${section.stack ? ' property-stage--stack' : ''}${section.menus ? ' property-stage--menus' : ''}">`
      // As M3's figures: a number under each value, and a legend below the stage.
      + section.values.map((value, index) => `<figure class="property-value">${value.markup}<figcaption><span class="property-number" aria-hidden="true">${index + 1}</span><span class="sr-only">${escape(value.name ?? value.label)}</span></figcaption></figure>`).join('') + `</div>`;
    const name = (value: PropertySection['values'][number]) => value.name ?? value.label.charAt(0).toUpperCase() + value.label.slice(1);
    const legend = `<ol class="property-legend">${section.values.map((value, index) => `<li><span class="property-number" aria-hidden="true">${index + 1}</span>${escape(name(value))}</li>`).join('')}</ol>`;
    return `<section class="property-section" aria-labelledby="${id}"><div class="property-section__heading"><div><h2 id="${id}">${escape(section.title)}</h2><p>${escape(section.text)}</p></div></div>${stage}${legend}</section>`;
  }).join('');
  return { html: `<div class="property-sections">${html}</div>`, toc: sections.map(section => ({ id: `property-${section.key}`, title: section.title })) };
}
