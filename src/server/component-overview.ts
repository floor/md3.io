// A component's Overview tab: one section per scenario (its name, its one line, and the
// component live in that scenario), each with a button group to open it in the Playground
// or read its code. The playground has its own tab (/components/<slug>/playground/).
import { components, type Scenario } from '../shared/components';

const escape = (text: string) => text.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export interface OverviewLinks { playground: string; develop: string; codeIcon: string; playIcon: string }

/** The scenarios an overview shows: the component's own, or its default alone. */
const sectionsOf = (slug: keyof typeof components): Scenario[] => {
  const scenarios = components[slug].scenarios;
  return scenarios.length ? [...scenarios]
    : [{ id: 'default', name: components[slug].name, description: components[slug].description, options: {}, source: '' }];
};

export function componentOverview(slug: keyof typeof components, links: OverviewLinks): { html: string; toc: { id: string; title: string }[] } {
  const name = components[slug].name;
  const sections = sectionsOf(slug).map(scenario => {
    const query = scenario.id === 'default' ? '' : `?scenario=${encodeURIComponent(scenario.id)}`;
    const id = `scenario-${scenario.id}`;
    // The actions, as a standard button group: Playground (tonal, the main one), then Code.
    const actions = `<div class="scenario-actions" role="group" aria-label="${escape(scenario.name)}">`
      + `<a class="mtrl-button mtrl-button--tonal mtrl-button--s mtrl-button--round" href="${escape(links.playground + query)}" aria-label="${escape(`Open ${scenario.name} in the playground`)}"><span class="mtrl-button__icon">${links.playIcon}</span><span class="mtrl-button__text">Playground</span></a>`
      + `<a class="mtrl-icon-button mtrl-icon-button--tonal mtrl-icon-button--s mtrl-icon-button--round" href="${escape(links.develop)}" aria-label="${escape(`${name}: Develop`)}" title="Develop"><span class="mtrl-icon-button__icon">${links.codeIcon}</span></a>`
      + `</div>`;
    return `<section class="scenario" aria-labelledby="${id}"><div class="scenario__heading"><div><h2 id="${id}">${escape(scenario.name)}</h2><p>${escape(scenario.description)}</p></div>${actions}</div>`
      + `<div class="scenario__stage"><iframe loading="lazy" title="${escape(`${name}: ${scenario.name}, live`)}" src="/preview/${slug}/${query}"></iframe></div></section>`;
  });
  return { html: `<div class="scenarios">${sections.join('')}</div>`, toc: sectionsOf(slug).map(scenario => ({ id: `scenario-${scenario.id}`, title: scenario.name })) };
}
