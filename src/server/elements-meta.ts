// The web component behind a playground, as plain data for the framework code
// generators (src/shared/frameworks.ts). Read on the server from mtrl/elements,
// which imports safely there; the browser gets JSON, not the elements.
import { elements, declarations } from 'mtrl/elements';
import type { ChildrenMeta, ElementMeta } from '../shared/frameworks';

type Spec = {
  name: string;
  attributes?: Record<string, { type: 'string' | 'boolean' | 'number'; config?: string }>;
  properties?: Record<string, unknown>;
  model?: string;
  events?: Record<string, unknown>;
  slot?: { attribute: string; config: string };
};

// How a playground's config array becomes declaration children: what mtrl's
// spec cannot say, because the factories take arrays and the elements children.
const children: Record<string, Omit<ChildrenMeta, 'attributes'> & { declaration: keyof typeof declarations }> = {
  tabs: { name: 'tab', declaration: 'tab', from: 'tabs', text: 'text', selected: { key: 'state', equals: 'active', value: 'value' } },
};

export function elementMeta(slug: string): ElementMeta | null {
  const element = (elements as Record<string, { spec: Spec } | undefined>)[slug];
  if (!element) return null;
  const spec = element.spec;
  const attributes = Object.fromEntries(Object.entries(spec.attributes ?? {}).map(([name, a]) => [name, { type: a.type, ...(a.config ? { config: a.config } : {}) }]));
  const kids = children[slug];
  const declared = kids ? declarations[kids.declaration] : undefined;
  return {
    name: spec.name,
    attributes,
    properties: Object.keys(spec.properties ?? {}),
    ...(spec.model ? { model: spec.model } : {}),
    events: Object.keys(spec.events ?? {}),
    ...(spec.slot ? { slot: { attribute: spec.slot.attribute, config: spec.slot.config } } : {}),
    ...(kids && declared ? {
      children: {
        name: kids.name, from: kids.from, text: kids.text, ...(kids.selected ? { selected: kids.selected } : {}),
        attributes: Object.fromEntries(Object.entries(declared.attributes).filter(([name]) => name !== 'label').map(([name, a]) => [name, a.type])),
      },
    } : {}),
  };
}
