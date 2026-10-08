// The web component behind a playground, as plain data for the framework code
// generators (src/shared/frameworks.ts). Read on the server from mtrl/elements,
// which imports safely there; the browser gets JSON, not the elements.
import { elements, declarations } from 'material/elements';
import type { ChildrenMeta, ConfigKey, ElementMeta, OpenMeta, SlottedMeta, TriggerMeta } from '../shared/frameworks';

type Spec = {
  name: string;
  attributes?: Record<string, { type: 'string' | 'boolean' | 'number'; config?: string }>;
  properties?: Record<string, { config?: string }>;
  model?: string;
  events?: Record<string, unknown>;
  slot?: { attribute: string; config: string };
  slots?: readonly string[];
  form?: unknown;
};

const registry = elements as Record<string, { spec: Spec } | undefined>;
const camel = (name: string): string => name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

// How a playground's config array becomes declaration children: what mtrl's
// spec cannot say, because the factories take arrays and the elements children.
const children: Record<string, Omit<ChildrenMeta, 'attributes'> & { declaration: keyof typeof declarations }> = {
  tabs: { name: 'tab', declaration: 'tab', from: 'tabs', text: 'text', selected: { key: 'state', equals: 'active', value: 'value' } },
  radios: { name: 'radio', declaration: 'radio', from: 'options', text: 'label' },
  'button-group': { name: 'button-group-item', declaration: 'buttonGroupItem', from: 'buttons', text: 'text' },
  chips: {
    name: 'chip', declaration: 'chip', from: 'chips', text: 'label', keys: { type: 'variant', leadingIcon: 'icon' },
    selected: { key: 'selected', equals: true, value: 'value' },
  },
  'navigation-rail': {
    // The factory field is `activeIcon`. The item attribute is `selected-icon`
    // (material dist/elements/navigation-rail.js, the declaration).
    name: 'navigation-rail-item', declaration: 'navigationRailItem', from: 'items', text: 'label', keys: { id: 'value', activeIcon: 'selected-icon' },
    selected: { key: 'active', equals: true, value: 'id' },
  },
  drawer: {
    // A section headline's text is its `sectionLabel`.
    name: 'drawer-item', declaration: 'drawerItem', from: 'items', text: ['label', 'sectionLabel'], keys: { id: 'value' },
    selected: { key: 'active', equals: true, value: 'id' },
  },
  list: {
    name: 'list-item', declaration: 'listItem', from: 'items', text: 'headline', keys: { id: 'value' },
    // Slots are `{ type, content }`; an image slot's content is an <img>, whose src the attribute takes.
    typed: {
      leading: { icon: 'leading-icon', avatar: 'leading-avatar', image: 'leading-image' },
      trailing: { icon: 'trailing-icon', text: 'trailing-text' },
    },
    // The list infers the line count from the overline and supporting text.
    counted: { lines: ['overline', 'supportingText'] },
  },
  carousel: { name: 'carousel-item', declaration: 'carouselItem', from: 'slides', text: 'title', keys: { image: 'src' } },
  // A divider or a gap is an item whose `type` says so; a submenu is the item's own items.
  menu: {
    name: 'menu-item', declaration: 'menuItem', from: 'items', text: 'text', keys: { id: 'value' },
    flags: { type: { divider: 'divider', gap: 'gap' } }, nested: { key: 'submenu', flag: 'hasSubmenu' },
  },
  select: { name: 'select-option', declaration: 'selectOption', from: 'options', text: 'text', keys: { id: 'value' } },
  'split-button': { name: 'menu-item', declaration: 'menuItem', from: 'items', text: 'text', keys: { id: 'value' } },
  'fab-menu': { name: 'fab-menu-item', declaration: 'fabMenuItem', from: 'items', text: 'text', keys: { id: 'value' } },
  // Suggestions are strings, each one's text.
  search: { name: 'search-suggestion', declaration: 'searchSuggestion', from: 'suggestions', text: 'text' },
};

// Config keys the spec does not map to an attribute, or maps otherwise.
const keys: Record<string, Record<string, ConfigKey>> = {
  chips: { multiSelect: { attribute: 'selection', values: { true: 'multi', false: 'single' } } },
  list: {
    trackSelection: { attribute: 'selection', values: { false: 'none' }, ignore: [true] },
    multiSelect: { attribute: 'selection', values: { true: 'multiple' }, ignore: [false] },
    initialSelection: { model: true },
  },
  'navigation-rail': { showToggle: { attribute: 'no-toggle', values: { false: true }, ignore: [true] }, ripple: { ignore: [true] } },
  drawer: {
    variant: { attribute: 'modal', values: { modal: true }, ignore: ['standard'] },
    // Not dismissible: neither the scrim nor Escape closes it.
    dismissible: { attribute: ['no-close-on-scrim-click', 'no-close-on-escape'], values: { false: true }, ignore: [true] },
  },
  'top-app-bar': {
    compressible: { attribute: 'no-compress', values: { false: true }, ignore: [true] },
    scrollable: { attribute: 'no-scroll', values: { false: true }, ignore: [true] },
    scrolled: { call: { method: 'setScrollState' }, ignore: [false] },
  },
  // `flat` is the element's way of saying `elevated: false`.
  toolbar: { elevated: { attribute: 'flat', values: { false: true }, ignore: [true] } },
  // The bar has a FAB when one is slotted.
  'bottom-app-bar': { hasFab: { ignore: [true, false] }, visible: { call: { method: 'hide', when: false }, ignore: [true] } },
  card: {
    'header.title': { attribute: 'headline' },
    'header.subtitle': { attribute: 'subhead' },
    'content.text': { text: true },
    // A clickable card is interactive.
    interactive: { same: 'clickable' },
    // The element builds its actions row with `createCardActions({})`
    // (material/src/elements/card.ts:98) and has no attribute for the side. The
    // stylesheet's flex row is the start, so `start` is not repeated. Any other
    // align is the gap `actions.align`: the factory's buttons path defaults to end.
    'actions.align': { ignore: ['start'] },
  },
  carousel: { snap: { ignore: [true] } },
  // The trigger is the anchor.
  menu: { opener: { ignore: ['#menu-trigger'] }, color: { ignore: ['standard'] }, closeOnSelect: { attribute: 'no-close-on-select', values: { false: true }, ignore: [true] } },
  'split-button': { text: { text: true } },
  // The element reflects `open` and setup shows the menu when the attribute is
  // present (material dist/elements/fab-menu.js). The attribute has no config
  // key, so the spec's own loop never writes it. `false` is the closed default.
  'fab-menu': { open: { attribute: 'open', values: { true: true }, ignore: [false] } },
  tooltip: {
    visible: { call: { method: 'show', when: true }, ignore: [false] },
    showOnHover: { attribute: 'no-show-on-hover', values: { false: true }, ignore: [true] },
    showOnFocus: { attribute: 'no-show-on-focus', values: { false: true }, ignore: [true] },
  },
  dialog: {
    // The element's dialog is always in the top layer.
    layer: { ignore: ['top'] },
    title: { attribute: 'headline' },
    // Named by its headline; the label is the fallback without one.
    ariaLabel: { attribute: 'aria-label', same: 'title' },
    size: { ignore: ['medium'] },
    animation: { ignore: ['scale'] },
    footerAlignment: { ignore: ['right'] },
    closeOnOverlayClick: { attribute: 'no-close-on-scrim-click', values: { false: true }, ignore: [true] },
    closeOnEscape: { attribute: 'no-close-on-escape', values: { false: true }, ignore: [true] },
  },
  'bottom-sheet': {
    variant: { attribute: 'modal', values: { modal: true }, ignore: ['standard'] },
    title: { attribute: 'headline' },
    dragHandle: { attribute: 'no-drag-handle', values: { false: true }, ignore: [true] },
    maxWidth: { ignore: [640] },
    closeOnScrimClick: { attribute: 'no-close-on-scrim-click', values: { false: true }, ignore: [true] },
    closeOnEscape: { attribute: 'no-close-on-escape', values: { false: true }, ignore: [true] },
  },
  'side-sheet': {
    variant: { attribute: 'modal', values: { modal: true }, ignore: ['standard'] },
    title: { attribute: 'headline' },
    closeButton: { attribute: 'no-close-button', values: { false: true }, ignore: [true] },
    closeOnScrimClick: { attribute: 'no-close-on-scrim-click', values: { false: true }, ignore: [true] },
    closeOnEscape: { attribute: 'no-close-on-escape', values: { false: true }, ignore: [true] },
  },
  // A range is one `start/end` string.
  datepicker: {
    value: { join: '/' }, initialView: { ignore: ['day'] }, closeOnSelect: { ignore: [false] },
    // The factory config has no `open`. The element attribute does, set from the scenario.
    open: { attribute: 'open', values: { true: true }, ignore: [false] },
  },
  // `step` is in seconds: a minute step, or with seconds shown their step, which needs a one-minute step.
  timepicker: {
    minuteStep: { attribute: 'step', values: { 5: 300, 15: 900 }, ignore: [1] },
  },
  // The view open is the `open` state; the factory's defaults are the element's.
  search: {
    initialState: { attribute: 'open', values: { view: true }, ignore: ['bar'] },
    showClearButton: { ignore: [true] },
    expandOnFocus: { ignore: [true] },
    collapseOnBlur: { ignore: [true] },
  },
};

// Config values the element takes as child elements in its slots: the element
// (an mtrl element, or `img`), the slot, and which item keys are its attributes.
type Slotted = Omit<SlottedMeta, 'attributes' | 'text'> & { attributes?: Record<string, string> };
const slotted: Record<string, Slotted[]> = {
  card: [
    // The media is inline art: its `markup` key is a native `<svg>` tree, slotted whole;
    // a `src`/`alt` pair stays the `<img>` the element has always taken (the docs example).
    { from: 'media', element: 'img', native: true, slot: 'media', markupTree: true, attributes: { src: 'src', alt: 'alt' }, ignore: { position: ['top'] } },
    { from: 'buttons', element: 'button', slot: 'actions', after: true },
  ],
  'top-app-bar': [
    { from: 'leading', element: 'icon-button', slot: 'leading', add: 'addLeadingElement' },
    { from: 'actions', element: 'icon-button', slot: 'trailing', add: 'addTrailingElement' },
    { from: 'trailingButton', element: 'button', slot: 'trailing', add: 'addTrailingElement' },
  ],
  // The factory takes its items in its config; the element as its children. A set's text
  // buttons go to the element's default slot as `buttons` (the card's actions pattern),
  // and its FAB to the slot the element anchors it in (the bottom app bar's pattern).
  toolbar: [
    { from: 'items', element: 'icon-button' },
    { from: 'buttons', element: 'button' },
    { from: 'fab', element: 'fab', slot: 'fab' },
    // The overflow menu: the element anchors a slotted `slot="overflow"` child to its
    // own trailing more button and opens it from there; the config array is the menu's
    // items and `overflowPosition` the menu's `position`.
    { from: 'overflow', element: 'menu', slot: 'overflow', nest: { element: 'menu-item', keys: { id: 'value' }, text: 'text' }, attribute: { from: 'overflowPosition', name: 'position' } },
  ],
  // The guidelines' header FAB sits in the rail's `header` slot: an icon FAB, or an extended one with a label.
  'navigation-rail': [
    { from: 'headerFab', element: 'fab', slot: 'header' },
    { from: 'headerExtended', element: 'extended-fab', slot: 'header' },
  ],
  'bottom-app-bar': [
    { from: 'actions', element: 'icon-button', add: 'addAction' },
    { from: 'fab', element: 'fab', slot: 'fab', add: 'addFab' },
  ],
  dialog: [
    { from: 'content', element: 'p', native: true, markup: true },
    { from: 'buttons', element: 'button', slot: 'actions', closes: 'closeDialog' },
  ],
  // A named set's content is a native tree the sheet has no template of its own for;
  // the default's single `<p>` parses to the same child the markup path wrote.
  'bottom-sheet': [{ from: 'content', element: 'p', native: true, markupTree: true }],
  'side-sheet': [{ from: 'content', element: 'p', native: true, markupTree: true }],
};

// The button the preview puts beside the element (`elementConfig` adds its config):
// one that opens it, or the target a tooltip describes. `for` is the element's
// attribute naming it, when the element listens to it itself.
type Trigger = Omit<TriggerMeta, 'attributes' | 'text'> & { attributes?: Record<string, string> };
const triggers: Record<string, Trigger> = {
  menu: { from: 'trigger', element: 'button', id: 'menu-trigger', for: 'anchor', config: 'opener' },
  dialog: { from: 'trigger', element: 'button', id: 'dialog-trigger' },
  'bottom-sheet': { from: 'trigger', element: 'button', id: 'bottom-sheet-trigger' },
  'side-sheet': { from: 'trigger', element: 'button', id: 'side-sheet-trigger' },
  snackbar: { from: 'trigger', element: 'button', id: 'snackbar-trigger' },
  drawer: { from: 'trigger', element: 'button', id: 'drawer-trigger' },
  'navigation-rail': { from: 'trigger', element: 'button', id: 'navigation-rail-trigger' },
  // The time picker has no field: its opener shows the time.
  timepicker: { from: 'trigger', element: 'button', id: 'timepicker-trigger', shows: ' · ' },
  tooltip: { from: 'target', element: 'icon-button', id: 'tooltip-target', for: 'for', config: 'target' },
};

// `open` as state the element reflects: where its first value is, and the
// methods the HTML opens and closes it with (the preview's trigger expands the
// bottom sheet). The drawer has none: the HTML sets `open`. The rail's is
// `expanded`, which its trigger expands and Escape collapses.
const open: Record<string, OpenMeta> = {
  // `visible` is the factory's initially-open menu. The element reflects it as `open`,
  // and setting that attribute opens quietly (material/src/elements/menu.ts).
  menu: { config: 'visible', property: 'open', show: 'show', hide: 'hide' },
  'fab-menu': { show: 'show', hide: 'hide' },
  dialog: { config: 'open', show: 'show', hide: 'close' },
  'bottom-sheet': { config: 'initialState', values: ['partial', 'expanded'], show: 'expand', hide: 'close' },
  'side-sheet': { config: 'open', show: 'show', hide: 'close' },
  snackbar: { config: 'open', show: 'show', hide: 'hide' },
  drawer: { config: 'open' },
  'navigation-rail': { config: 'expanded', property: 'expanded', events: ['expand', 'collapse'], show: 'expand', hide: 'collapse' },
  // `open` on the factory config starts the dialog open (`material/src/components/timepicker/timepicker.ts`).
  timepicker: { config: 'open', show: 'show', hide: 'close' },
};

// Other state bound beside `open`: the bottom sheet's full height, which a drag changes too.
// Its trigger opens it expanded, as the preview's and the HTML's `expand()` do.
const states: Record<string, NonNullable<ElementMeta['states']>> = {
  'bottom-sheet': [{ property: 'expanded', events: ['expand', 'collapse'], config: 'initialState', values: ['expanded'], opens: true }],
};

// The selection is multiple when this config key is true: the model is an
// array, or with `children` the children are `selected` (list's `value` is one).
const multiple: Record<string, ElementMeta['multiple']> = {
  chips: { key: 'multiSelect' },
  list: { key: 'multiSelect', children: true },
};

// Inline styles the element needs, as the preview gives it: the carousel fills its host's height.
const styles: Record<string, Record<string, string>> = {
  carousel: { height: '320px' },
};

// Live properties that do not start false: a playground value equal to the
// default is left out of the code, any other is written.
const propertyDefaults: Record<string, Record<string, unknown>> = {
  badge: { visible: true },
};

/** A slotted mtrl element's attributes by config key, and its text's key, from its spec. */
function slottedMeta<T extends Slotted | Trigger>(entry: T): Omit<T, 'attributes'> & Pick<SlottedMeta, 'attributes' | 'text'> {
  if (entry.native) return { ...entry, attributes: entry.attributes ?? {} };
  const spec = registry[camel(entry.element)]!.spec;
  const attributes = Object.fromEntries(Object.entries(spec.attributes ?? {})
    .flatMap(([name, a]) => (a.config ? [[a.config, name]] : [])));
  return { ...entry, attributes: { ...attributes, ...entry.attributes }, ...(spec.slot ? { text: spec.slot.config } : {}) };
}

export function elementMeta(slug: string): ElementMeta | null {
  // Registry keys are camelCase (`iconButton`); playground slugs are kebab-case.
  const key = camel(slug);
  const element = registry[key];
  if (!element) return null;
  const spec = element.spec;
  const attributes = Object.fromEntries(Object.entries(spec.attributes ?? {}).map(([name, a]) => [name, { type: a.type, ...(a.config ? { config: a.config } : {}) }]));
  const kids = children[slug];
  const declared = kids ? declarations[kids.declaration] : undefined;
  // The text is the child's label (or headline): not written again as an attribute.
  const textAttributes = new Set(['label', ...[kids?.text ?? []].flat()]);
  return {
    name: spec.name,
    attributes,
    properties: Object.fromEntries(Object.entries(spec.properties ?? {}).map(([name, p]) => [name, {
      ...(p.config ? { config: p.config } : {}),
      ...(name in (propertyDefaults[key] ?? {}) ? { default: propertyDefaults[key]![name] } : {}),
    }])),
    ...(spec.model ? { model: spec.model } : {}),
    events: Object.keys(spec.events ?? {}),
    ...(spec.form ? { form: true } : {}),
    ...(spec.slot ? { slot: { attribute: spec.slot.attribute, config: spec.slot.config } } : {}),
    ...(spec.slots?.length ? { slots: [...spec.slots] } : {}),
    ...(kids && declared ? {
      children: {
        ...Object.fromEntries(Object.entries(kids).filter(([name]) => name !== 'declaration')) as Omit<ChildrenMeta, 'attributes'>,
        attributes: Object.fromEntries(Object.entries(declared.attributes).filter(([name]) => !textAttributes.has(name)).map(([name, a]) => [name, a.type])),
      },
    } : {}),
    ...(keys[slug] ? { keys: keys[slug] } : {}),
    ...(slotted[slug] ? { slotted: slotted[slug]!.map(slottedMeta) } : {}),
    ...(multiple[slug] ? { multiple: multiple[slug] } : {}),
    ...(styles[slug] ? { style: styles[slug] } : {}),
    ...(triggers[slug] ? { trigger: slottedMeta(triggers[slug]!) } : {}),
    ...(open[slug] ? { open: open[slug] } : {}),
    ...(states[slug] ? { states: states[slug] } : {}),
  };
}
