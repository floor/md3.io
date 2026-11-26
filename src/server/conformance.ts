// md3.io/conformance/matrix: material's conformance with M3, property by property (FLO-1607, the owner's
// request of 2026-11-26). Laid out as the parity matrix the owner likes, from material's components in
// md3.io's design: a masthead, a summary card per browser, a caution line, a controls bar (search and
// filter chips with counts), a sticky column header, a section per component (its meters and its rows,
// each disclosing its detail), and a tray of what the filters select, with a copy button.
//
// The data is material's public matrix file, schema v1 agreed with material on 2026-11-26, vendored at the
// pinned version by `bun run conformance:sync` into data/conformance/matrix.json. Until material tags the
// first real file, the page renders a labelled sample. Scores are derived here. The search, the chips and
// the tray run in src/client/conformance.ts; without scripts every row shows, details open.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { symbols } from '../shared/icons';

type Status = 'match' | 'drift' | 'no-value';
/** The two references material is measured against (schema v1, revised 2026-11-26): the M3 specification on
 *  m3.material.io, and Jetpack Compose Material 3 at its pinned version. The browsers are only the method. */
type Ref = 'spec' | 'compose';
interface Row {
  id: string; property: string; aspect: string; variant?: string; state?: string;
  spec: { value: string | null; url?: string; section?: string; read?: string } | null;
  compose: { value: string | null; file?: string; symbol?: string; line?: number; url?: string } | null;
  material: { value: string; engines: Record<string, string> | null };
  status: Record<Ref, Status>;
  note?: string; issue?: string | null;
}
interface Component { id: string; name: string; properties: Row[] }
interface Matrix {
  schema: 1; sample?: boolean; material: string; commit: string; measured: string;
  references: { spec: { name: string; url: string; read: string }; compose: { name: string; version: string; commit: string; date: string; url: string } };
  method: { browsers: string[]; engines: Record<string, string>; note: string };
  components: Component[];
}

const root = resolve(import.meta.dir, '../..');
const load = (): Matrix => {
  const real = resolve(root, 'data/conformance/matrix.json');
  return JSON.parse(readFileSync(existsSync(real) ? real : resolve(root, 'data/conformance/sample.json'), 'utf8')) as Matrix;
};

const escape = (value: string): string => value.replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]!);
type Attributes = Record<string, string | number | boolean | undefined>;
const attrs = (list: Attributes) => Object.entries(list).map(([name, value]) => value === true ? ` ${name}` : value === false || value === undefined ? '' : ` ${name}="${escape(String(value))}"`).join('');
const m = (name: string, list: Attributes = {}, content = '') => `<m-${name}${attrs(list)}>${content}</m-${name}>`;

const STATUS: Record<Status, { label: string; icon: string }> = {
  match: { label: 'Matches', icon: symbols.check },
  drift: { label: 'Drift', icon: symbols.close },
  'no-value': { label: 'No value', icon: symbols.remove },
};
const REFS: Ref[] = ['spec', 'compose'];
const REF: Record<Ref, string> = { spec: 'm3.material.io', compose: 'Compose' };
const ENGINE: Record<string, string> = { chromium: 'Chromium', webkit: 'WebKit' };
const ASPECT: Record<string, string> = { size: 'Size', spacing: 'Spacing', shape: 'Shape', colour: 'Colour', typography: 'Typography', elevation: 'Elevation', focus: 'Focus', motion: 'Motion', density: 'Density', other: 'Other' };
const date = (iso: string): string => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

const tally = (rows: Row[], ref: Ref) => ({
  match: rows.filter(row => row.status[ref] === 'match').length,
  drift: rows.filter(row => row.status[ref] === 'drift').length,
  noValue: rows.filter(row => row.status[ref] === 'no-value').length,
});

const refValue = (row: Row, ref: Ref): string | null => row[ref]?.value ?? null;
const refSource = (row: Row, ref: Ref, matrix: Matrix): string => {
  if (ref === 'spec') {
    const spec = row.spec;
    if (!spec?.value) return 'The specification gives no value.';
    return `<a class="text-link" href="${escape(spec.url ?? matrix.references.spec.url)}">m3.material.io${spec.section ? `, ${escape(spec.section)}` : ''}</a>, read ${date(spec.read ?? matrix.references.spec.read)}`;
  }
  const compose = row.compose;
  if (!compose?.value) return 'Compose gives no value.';
  const name = `${compose.file?.replace(/\.kt$/, '')}.${compose.symbol}`;
  return `${escape(matrix.references.compose.name)} ${escape(matrix.references.compose.version)}, ${compose.url ? `<a class="text-link" href="${escape(compose.url)}${compose.line ? `#L${compose.line}` : ''}">${escape(name)}</a>` : escape(name)}`;
};

const glyph = (status: Status, ref: Ref) =>
  `<span class="matrix-glyph matrix-glyph--${status}" role="img" aria-label="Against ${REF[ref]}: ${STATUS[status].label}" title="Against ${REF[ref]}: ${STATUS[status].label}">${STATUS[status].icon}</span>`;

const rowHtml = (row: Row, matrix: Matrix): string => {
  const qualifier = [row.variant, row.state].filter(Boolean).join(' · ');
  const detail = `matrix-detail-${row.id.replace(/[^a-z0-9-]/g, '-')}`;
  const text = [row.property, qualifier, row.aspect, row.note ?? '', refValue(row, 'spec') ?? '', refValue(row, 'compose') ?? '', row.material.value].join(' ').toLowerCase();
  const engines = row.material.engines ? Object.entries(row.material.engines).map(([engine, value]) => `${ENGINE[engine] ?? engine} ${escape(value)}`).join(', ') : `the same in ${matrix.method.browsers.map(b => ENGINE[b] ?? b).join(' and ')}`;
  return `<li class="matrix-row" id="${escape(row.id)}" data-aspect="${escape(row.aspect)}" ${REFS.map(r => `data-${r}="${row.status[r]}"`).join(' ')} data-text="${escape(text)}">`
    + `<div class="matrix-row__main">`
    + `<div class="matrix-row__name">${m('icon-button', { icon: symbols.expandMore, 'aria-label': `Details: ${row.property}${qualifier ? `, ${qualifier}` : ''}`, 'aria-expanded': 'false', 'aria-controls': detail, class: 'matrix-row__toggle', size: 'xs' })}`
    + `<span><a class="matrix-row__anchor" href="#${escape(row.id)}">${escape(row.property)}</a>${qualifier ? `<span class="matrix-muted">${escape(qualifier)}</span>` : ''}</span></div>`
    + REFS.map(r => `<div class="matrix-row__cell" data-col="${r}"><span class="matrix-value">${escape(refValue(row, r) ?? '—')}</span>${glyph(row.status[r], r)}</div>`).join('')
    + `<div class="matrix-row__cell matrix-row__material" data-col="material"><span class="matrix-value">${escape(row.material.value)}</span></div>`
    + `</div><dl class="matrix-detail" id="${detail}">`
    + REFS.map(r => `<div><dt>${REF[r]}</dt><dd>${refValue(row, r) ? `<strong>${escape(refValue(row, r)!)}</strong> · ` : ''}${refSource(row, r, matrix)} · <em>${STATUS[row.status[r]].label}</em></dd></div>`).join('')
    + `<div><dt>material</dt><dd><strong>${escape(row.material.value)}</strong>, ${engines}</dd></div>`
    + `<div><dt>Aspect</dt><dd>${escape(ASPECT[row.aspect] ?? row.aspect)}</dd></div>`
    + (row.note || row.issue ? `<div><dt>Note</dt><dd>${row.note ? escape(row.note) : ''}${row.issue ? ` <a class="text-link" href="${escape(row.issue)}">Issue</a>` : ''}</dd></div>` : '')
    + '</dl></li>';
};

/** A component's mini meter: one tick per row, coloured by its status against one reference. */
const ticks = (rows: Row[], ref: Ref) =>
  `<span class="matrix-ticks" role="img" aria-label="Against ${REF[ref]}: ${tally(rows, ref).match} of ${rows.length} match"><span class="matrix-ticks__label">${REF[ref]}</span>${rows.map(row => `<i class="matrix-tick matrix-tick--${row.status[ref]}"></i>`).join('')}</span>`;

const percentOf = (rows: Row[], ref: Ref) => { const t = tally(rows, ref); const measured = t.match + t.drift; return measured ? Math.round((t.match / measured) * 100) : null; };
const caution = (matrix: Matrix) => `<p class="matrix-caution">${symbols.error}<span>${matrix.sample ? '<strong>Sample data.</strong> These pages show the matrix\'s shape with a few rows; material\'s measured file replaces it. ' : ''}`
  + `Where the two references disagree, each status is shown as it is. Method: measured from the rendered page in ${matrix.method.browsers.map(b => ENGINE[b] ?? b).join(' and ')}, values in CSS pixels; a row shows each engine's value only when they differ.</span></p>`;
const summaryCards = (rows: Row[]) => `<div class="matrix-summary">${REFS.map(ref => {
  const t = tally(rows, ref);
  const measured = t.match + t.drift;
  const percent = measured ? Math.round((t.match / measured) * 100) : 100;
  return m('card', { variant: 'filled', class: 'matrix-card' },
    `<p class="matrix-card__browser">vs ${REF[ref]}</p><p class="matrix-card__score"><strong>${t.match} of ${measured}</strong> match</p>`
    + `<p class="matrix-card__percent">${percent}%</p>${m('progress', { variant: 'linear', value: percent, max: 100, 'aria-label': `Against ${REF[ref]}: ${percent}% match` })}`
    + `<p class="matrix-card__rest">${t.drift} drift · ${t.noValue} with no ${ref === 'spec' ? 'specification' : 'Compose'} value</p>`);
}).join('')}</div>`;
const facts = (matrix: Matrix, rows: Row[], components: number) => `<p class="matrix-facts">References: <a class="text-link" href="${escape(matrix.references.spec.url)}">m3.material.io</a> (read ${date(matrix.references.spec.read)}) and <a class="text-link" href="${escape(matrix.references.compose.url)}">Compose Material 3 ${escape(matrix.references.compose.version)}</a> (${date(matrix.references.compose.date)}) · material ${escape(matrix.material)} · measured ${date(matrix.measured)} · ${rows.length} properties${components > 1 ? ` in ${components} components` : ''}</p>`;

/** The matrix's index, as the Components page: the hero, then a card per component in its category, its
 *  stage the component's scores against each reference. */
export function conformanceIndex(sections: { id: string; name: string; items: { slug: string }[] }[]): { html: string } {
  const matrix = load();
  const byId = new Map(matrix.components.map(component => [component.id, component]));
  const rows = matrix.components.flatMap(component => component.properties);
  const card = (component: Component) => {
    const href = `/conformance/matrix/${component.id}/`;
    const drift = component.properties.filter(row => REFS.some(r => row.status[r] === 'drift')).length;
    const noValue = component.properties.filter(row => REFS.every(r => row.status[r] === 'no-value')).length;
    const stage = `<div slot="media" class="matrix-stage">${REFS.map(ref => {
      const percent = percentOf(component.properties, ref);
      return `<div class="matrix-stage__ref"><span class="matrix-stage__label">vs ${REF[ref]}</span><span class="matrix-stage__percent">${percent === null ? '—' : `${percent}%`}</span>`
        + `${m('progress', { variant: 'linear', value: percent ?? 0, max: 100, 'aria-label': `${component.name} against ${REF[ref]}: ${percent ?? 0}% match` })}${ticks(component.properties, ref)}</div>`;
    }).join('')}</div>`;
    const body = `<div class="component-card__body"><h3><a href="${href}">${escape(component.name)}</a></h3>`
      + `<p>${component.properties.length} properties · ${drift ? `${drift} drift` : 'no drift'}${noValue ? ` · ${noValue} with no value in either reference` : ''}</p>`
      + `<div class="component-card__actions"><a class="mtrl-button mtrl-button--tonal mtrl-button--s mtrl-button--round" href="${href}" aria-label="${escape(`${component.name}: properties`)}"><span class="mtrl-button__text">Properties</span></a>`
      + `<a class="mtrl-icon-button mtrl-icon-button--standard mtrl-icon-button--s mtrl-icon-button--round" href="/components/${escape(component.id)}/" aria-label="${escape(`${component.name}: component page`)}" title="Component page"><span class="mtrl-icon-button__icon">${symbols.arrowForward}</span></a></div></div>`;
    return m('card', { variant: 'filled', class: 'component-card matrix-component-card' }, stage + body);
  };
  const grid = sections.map(section => {
    const items = section.items.map(item => byId.get(item.slug)).filter((c): c is Component => !!c);
    if (!items.length) return '';
    return `<section class="component-catalog__section docs-group" aria-labelledby="matrix-${escape(section.id)}"><h2 id="matrix-${escape(section.id)}">${escape(section.name)}</h2><div class="component-grid">${items.map(card).join('')}</div></section>`;
  }).join('');
  const hero = `<header class="page-hero"><div class="page-hero__text"><h1>Conformance</h1>`
    + `<p>How material follows Material 3's two official references, the specification on m3.material.io and Jetpack Compose Material 3, component by component and property by property.</p></div><div class="page-hero__art" aria-hidden="true"></div></header>`;
  return { html: `<div class="page-wrap docs-overview matrix-index">${hero}<div class="page-hero-body">${facts(matrix, rows, matrix.components.length)}${summaryCards(rows)}${caution(matrix)}${grid}</div></div>` };
}

/** One component's properties: its scores, the controls, and its rows. */
export function conformanceComponent(id: string): { html: string; name: string } | null {
  const matrix = load();
  const component = matrix.components.find(c => c.id === id);
  if (!component) return null;
  const rows = component.properties;
  const aspects = [...new Set(rows.map(row => row.aspect))];

  const masthead = `<header class="matrix-masthead">`
    + `<p class="matrix-eyebrow"><a class="text-link" href="/conformance/matrix/">Conformance</a></p><h1>${escape(component.name)}</h1>`
    + `<p class="matrix-lede">${escape(component.name)} against Material 3's two references, property by property: the specification's value, Compose's, material's, and whether they match. <a class="text-link" href="/components/${escape(component.id)}/">The ${escape(component.name.toLowerCase())}'s page</a></p>`
    + facts(matrix, rows, 1) + `</header>`;
  const chip = (group: string, value: string, label: string, count: number) => m('chip', { variant: 'filter', value: `${group}:${value}`, label: `${label} ${count}` });
  const countBy = (key: (row: Row) => boolean) => rows.filter(key).length;
  const controls = `<div class="matrix-controls" role="search">`
    + m('text-field', { variant: 'outlined', label: 'Search properties', 'leading-icon': symbols.search, class: 'matrix-search', density: 'compact' })
    + `<div class="matrix-chip-groups">`
    + `<div class="matrix-chip-group"><span>Status</span>${m('chips', { selection: 'multiple', 'aria-label': 'Status', class: 'matrix-chips', 'data-group': 'status' }, (['match', 'drift', 'no-value'] as const).map(st => chip('status', st, STATUS[st].label, countBy(row => REFS.some(r => row.status[r] === st)))).join(''))}</div>`
    + `<div class="matrix-chip-group"><span>Against</span>${m('chips', { selection: 'single', 'aria-label': 'Against', class: 'matrix-chips', 'data-group': 'ref' }, REFS.map(r => chip('ref', r, REF[r], countBy(row => refValue(row, r) !== null))).join(''))}</div>`
    + `<div class="matrix-chip-group"><span>Aspect</span>${m('chips', { selection: 'multiple', 'aria-label': 'Aspect', class: 'matrix-chips', 'data-group': 'aspect' }, aspects.map(a => chip('aspect', a, ASPECT[a] ?? a, countBy(row => row.aspect === a))).join(''))}</div>`
    + `</div></div>`;

  const header = `<div class="matrix-colhead" aria-hidden="true"><span>Property</span>${REFS.map(r => `<span data-col="${r}">${REF[r]}</span>`).join('')}<span data-col="material">material</span></div>`;

  const sections = [component].map(component => {
    const drifts = component.properties.filter(row => REFS.some(r => row.status[r] === 'drift')).length;
    return `<section class="matrix-section" id="${escape(component.id)}" aria-labelledby="${escape(component.id)}-title">`
      + `<div class="matrix-section__head"><h2 id="${escape(component.id)}-title"><a href="/components/${escape(component.id)}/">${escape(component.name)}</a></h2>`
      + `<span class="matrix-badge${drifts ? ' matrix-badge--drift' : ''}">${drifts ? `${drifts} drift` : 'All match'}</span>`
      + `<span class="matrix-section__ticks">${REFS.map(r => ticks(component.properties, r)).join('')}</span></div>`
      + `<ul class="matrix-rows">${component.properties.map(row => rowHtml(row, matrix)).join('')}</ul>`
      + `<p class="matrix-empty" hidden>No property of ${escape(component.name)} matches the filters.</p></section>`;
  }).join('');

  const tray = `<aside class="matrix-tray" aria-label="Selection"><p class="matrix-tray__count" role="status"><strong data-matrix-count>${rows.length}</strong> of ${rows.length} properties</p>`
    + m('button', { variant: 'tonal', icon: symbols.contentCopy, class: 'matrix-copy' }, 'Copy as CSV') + '</aside>';

  return { name: component.name, html: `<div class="matrix" data-refs="${REFS.join(' ')}">${masthead}${summaryCards(rows)}${caution(matrix)}${controls}${header}<div class="matrix-sections">${sections}</div>${tray}</div>` };
}
