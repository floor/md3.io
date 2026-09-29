// The web component behind a playground, as plain data for the framework code
// generators (src/shared/frameworks.ts). Read on the server from mtrl/elements,
// which imports safely there; the browser gets JSON, not the elements.
import { elements, declarations } from 'mtrl/elements';
import type { ChildrenMeta, ElementMeta } from '../shared/frameworks';

type Spec = {
  name: string;
  attributes?: Record<string, { type: 'string' | 'boolean' | 'number'; config?: string }>;
  properties?: Record<string, { config?: string }>;
  model?: string;
  events?: Record<string, unknown>;
  slot?: { attribute: string; config: string };
  form?: unknown;
};

// How a playground's config array becomes declaration children: what mtrl's
// spec cannot say, because the factories take arrays and the elements children.
const children: Record<string, Omit<ChildrenMeta, 'attributes'> & { declaration: keyof typeof declarations }> = {
  tabs: { name: 'tab', declaration: 'tab', from: 'tabs', text: 'text', selected: { key: 'state', equals: 'active', value: 'value' } },
  radios: { name: 'radio', declaration: 'radio', from: 'options', text: 'label' },
};

// Live properties that do not start false: a playground value equal to the
// default is left out of the code, any other is written.
const propertyDefaults: Record<string, Record<string, unknown>> = {
  badge: { visible: true },
};

export function elementMeta(slug: string): ElementMeta | null {
  // Registry keys are camelCase (`iconButton`); playground slugs are kebab-case.
  const key = slug.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
  const element = (elements as Record<string, { spec: Spec } | undefined>)[key];
  if (!element) return null;
  const spec = element.spec;
  const attributes = Object.fromEntries(Object.entries(spec.attributes ?? {}).map(([name, a]) => [name, { type: a.type, ...(a.config ? { config: a.config } : {}) }]));
  const kids = children[slug];
  const declared = kids ? declarations[kids.declaration] : undefined;
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
        name: kids.name, from: kids.from, text: kids.text, ...(kids.selected ? { selected: kids.selected } : {}),
        attributes: Object.fromEntries(Object.entries(declared.attributes).filter(([name]) => name !== 'label').map(([name, a]) => [name, a.type])),
      },
    } : {}),
  };
}
