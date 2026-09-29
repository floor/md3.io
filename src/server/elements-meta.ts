// The web component behind a playground, as plain data for the framework code
// generators (src/shared/frameworks.ts). Read on the server from mtrl/elements,
// which imports safely there; the browser gets JSON, not the elements.
import { elements, declarations } from 'mtrl/elements';
import type { ChildrenMeta, ConfigKey, ElementMeta, SlottedMeta } from '../shared/frameworks';

type Spec = {
  name: string;
  attributes?: Record<string, { type: 'string' | 'boolean' | 'number'; config?: string }>;
  properties?: Record<string, { config?: string }>;
  model?: string;
  events?: Record<string, unknown>;
  slot?: { attribute: string; config: string };
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
    name: 'navigation-rail-item', declaration: 'navigationRailItem', from: 'items', text: 'label', keys: { id: 'value' },
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
};

// Config keys the spec does not map to an attribute, or maps otherwise.
const keys: Record<string, Record<string, ConfigKey>> = {
  chips: { multiSelect: { attribute: 'selection', values: { true: 'multi', false: 'single' } } },
  list: {
    trackSelection: { attribute: 'selection', values: { false: 'none' } },
    multiSelect: { attribute: 'selection', values: { true: 'multiple' } },
    initialSelection: { model: true },
  },
  'navigation-rail': { layout: { ignore: ['standard'] }, showToggle: { attribute: 'no-toggle', values: { false: true } }, ripple: { ignore: [true] } },
  drawer: { variant: { ignore: ['standard'] }, dismissible: { ignore: [true] } },
  'top-app-bar': {
    compressible: { attribute: 'no-compress', values: { false: true } },
    scrollable: { attribute: 'no-scroll', values: { false: true } },
    scrolled: { call: { method: 'setScrollState' }, ignore: [false] },
  },
  // The bar has a FAB when one is slotted.
  'bottom-app-bar': { hasFab: { ignore: [true, false] }, visible: { call: { method: 'hide', when: false }, ignore: [true] } },
  card: {
    'header.title': { attribute: 'headline' },
    'header.subtitle': { attribute: 'subhead' },
    'content.text': { text: true },
    // A clickable card is interactive.
    interactive: { same: 'clickable' },
  },
  carousel: { snap: { ignore: [true] } },
};

// Config values the element takes as child elements in its slots: the element
// (an mtrl element, or `img`), the slot, and which item keys are its attributes.
type Slotted = Omit<SlottedMeta, 'attributes' | 'text'> & { attributes?: Record<string, string> };
const slotted: Record<string, Slotted[]> = {
  card: [
    { from: 'media', element: 'img', native: true, slot: 'media', attributes: { src: 'src', alt: 'alt' }, ignore: { position: ['top'] } },
    { from: 'buttons', element: 'button', slot: 'actions', after: true },
  ],
  'top-app-bar': [
    { from: 'leading', element: 'icon-button', slot: 'leading' },
    { from: 'actions', element: 'icon-button', slot: 'trailing' },
  ],
  'bottom-app-bar': [
    { from: 'actions', element: 'icon-button' },
    { from: 'fab', element: 'fab', slot: 'fab' },
  ],
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
function slottedMeta(entry: Slotted): SlottedMeta {
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
  };
}
