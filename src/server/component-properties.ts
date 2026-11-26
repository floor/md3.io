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
  values: readonly { label: string; markup: string }[];
  /** The stage lays the values out in a column (wide or tall values). */
  stack?: boolean;
}

// Button group: a cup-size choice, 8 oz selected, as the API's own examples do.
const cups = (attrs: Attributes, selected: readonly string[] = ['8']) => m('button-group', { selection: 'single', 'aria-label': 'Cup size', ...attrs },
  [['8', '8 oz'], ['12', '12 oz'], ['16', '16 oz']].map(([value, label]) => m('button-group-item', { value, selected: selected.includes(value!), 'selected-icon': symbols.check }, label!)).join(''));
const buttonGroup: PropertySection[] = [
  { key: 'kind', title: 'Kind', text: 'Standard groups space their buttons apart, each its own control; connected groups join them into one.',
    values: ['standard', 'connected'].map(kind => ({ label: kind, markup: cups({ kind, variant: 'tonal' }) })) },
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

const PROPERTIES: Partial<Record<string, PropertySection[]>> = { 'button-group': buttonGroup };

export const hasPropertyOverview = (slug: string): boolean => slug in PROPERTIES;

/** The Overview's sections and its On this page entries, for a component with properties. */
export function propertyOverview(slug: string, links: { playground: string; develop: string; codeIcon: string; playIcon: string }, name: string) {
  const sections = PROPERTIES[slug]!;
  const html = sections.map(section => {
    const id = `property-${section.key}`;
    const actions = `<div class="scenario-actions" role="group" aria-label="${escape(section.title)}">`
      + `<a class="mtrl-button mtrl-button--tonal mtrl-button--s mtrl-button--round" href="${escape(links.playground)}" aria-label="${escape(`${name}: ${section.title} in the playground`)}"><span class="mtrl-button__icon">${links.playIcon}</span><span class="mtrl-button__text">Playground</span></a>`
      + `<a class="mtrl-icon-button mtrl-icon-button--tonal mtrl-icon-button--s mtrl-icon-button--round" href="${escape(`${links.develop}#api`)}" aria-label="${escape(`${name}: ${section.title} in the API`)}" title="Develop"><span class="mtrl-icon-button__icon">${links.codeIcon}</span></a>`
      + `</div>`;
    const stage = `<div class="catalog-visual catalog-visual--${slug} property-stage${section.stack ? ' property-stage--stack' : ''}">`
      + section.values.map(value => `<figure class="property-value">${value.markup}<figcaption><code>${escape(value.label)}</code></figcaption></figure>`).join('') + `</div>`;
    return `<section class="scenario" aria-labelledby="${id}"><div class="scenario__heading"><div><h2 id="${id}">${escape(section.title)}</h2><p>${escape(section.text)}</p></div>${actions}</div>${stage}</section>`;
  }).join('');
  return { html: `<div class="scenarios">${html}</div>`, toc: sections.map(section => ({ id: `property-${section.key}`, title: section.title })) };
}
