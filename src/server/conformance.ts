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

type Status = 'match' | 'drift' | 'no-source';
type Browser = 'chromium' | 'webkit';
interface Source { kind: 'compose' | 'm3-site'; file?: string; symbol?: string; line?: number; url?: string; read?: string }
interface Row {
  id: string; property: string; aspect: string; variant?: string; state?: string; density?: number;
  m3: { value: string | null; source: Source | null };
  material: Record<Browser, string>;
  status: Record<Browser, Status>;
  note?: string; issue?: string | null;
}
interface Component { id: string; name: string; rows: Row[] }
interface Matrix {
  schema: 1; sample?: boolean; generated: string;
  material: { version: string; commit: string };
  reference: { compose: { version: string; commit: string; released: string }; m3Site: { url: string; read: string } };
  browsers: Browser[]; engines: Record<Browser, string>;
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
  'no-source': { label: 'No M3 value', icon: symbols.remove },
};
const BROWSER: Record<Browser, string> = { chromium: 'Chromium', webkit: 'WebKit' };
const ASPECT: Record<string, string> = { size: 'Size', spacing: 'Spacing', shape: 'Shape', colour: 'Colour', typography: 'Typography', elevation: 'Elevation', focus: 'Focus', motion: 'Motion', density: 'Density', other: 'Other' };
const date = (iso: string): string => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

const tally = (rows: Row[], browser: Browser) => ({
  match: rows.filter(row => row.status[browser] === 'match').length,
  drift: rows.filter(row => row.status[browser] === 'drift').length,
  noSource: rows.filter(row => row.status[browser] === 'no-source').length,
});

const sourceHtml = (row: Row, matrix: Matrix): string => {
  const src = row.m3.source;
  if (!src) return 'M3 gives no value for this property.';
  if (src.kind === 'compose') {
    const url = `https://github.com/androidx/androidx/blob/${matrix.reference.compose.commit}/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/${src.file}${src.line ? `#L${src.line}` : ''}`;
    return `Compose Material 3 ${escape(matrix.reference.compose.version)}, <a class="text-link" href="${url}">${escape(`${src.file?.replace(/\.kt$/, '')}.${src.symbol}`)}</a>`;
  }
  return `<a class="text-link" href="${escape(src.url ?? matrix.reference.m3Site.url)}">m3.material.io</a>, read ${date(src.read ?? matrix.reference.m3Site.read)}`;
};

const glyph = (status: Status, browser: Browser) =>
  `<span class="matrix-glyph matrix-glyph--${status}" role="img" aria-label="${BROWSER[browser]}: ${STATUS[status].label}" title="${BROWSER[browser]}: ${STATUS[status].label}">${STATUS[status].icon}</span>`;

const rowHtml = (row: Row, matrix: Matrix): string => {
  const qualifier = [row.variant, row.state, row.density !== undefined ? `density ${row.density}` : ''].filter(Boolean).join(' · ');
  const detail = `matrix-detail-${row.id.replace(/[^a-z0-9-]/g, '-')}`;
  const text = [row.property, qualifier, row.aspect, row.note ?? '', row.m3.value ?? '', ...matrix.browsers.map(b => row.material[b])].join(' ').toLowerCase();
  return `<li class="matrix-row" id="${escape(row.id)}" data-aspect="${escape(row.aspect)}" ${matrix.browsers.map(b => `data-${b}="${row.status[b]}"`).join(' ')} data-text="${escape(text)}">`
    + `<div class="matrix-row__main">`
    + `<div class="matrix-row__name">${m('icon-button', { icon: symbols.expandMore, 'aria-label': `Details: ${row.property}${qualifier ? `, ${qualifier}` : ''}`, 'aria-expanded': 'false', 'aria-controls': detail, class: 'matrix-row__toggle', size: 'xs' })}`
    + `<span><a class="matrix-row__anchor" href="#${escape(row.id)}">${escape(row.property)}</a>${qualifier ? `<span class="matrix-muted">${escape(qualifier)}</span>` : ''}</span></div>`
    + matrix.browsers.map(b => `<div class="matrix-row__cell">${glyph(row.status[b], b)}</div>`).join('')
    + `</div><dl class="matrix-detail" id="${detail}">`
    + `<div><dt>M3</dt><dd>${row.m3.value ? `<strong>${escape(row.m3.value)}</strong> · ` : ''}${sourceHtml(row, matrix)}</dd></div>`
    + matrix.browsers.map(b => `<div><dt>material, ${BROWSER[b]}</dt><dd><strong>${escape(row.material[b] ?? '—')}</strong> · ${STATUS[row.status[b]].label}</dd></div>`).join('')
    + `<div><dt>Aspect</dt><dd>${escape(ASPECT[row.aspect] ?? row.aspect)}</dd></div>`
    + (row.note || row.issue ? `<div><dt>Note</dt><dd>${row.note ? escape(row.note) : ''}${row.issue ? ` <a class="text-link" href="${escape(row.issue)}">Issue</a>` : ''}</dd></div>` : '')
    + '</dl></li>';
};

/** A component's mini meter: one tick per row, coloured by its status in one browser. */
const ticks = (rows: Row[], browser: Browser) =>
  `<span class="matrix-ticks" role="img" aria-label="${BROWSER[browser]}: ${tally(rows, browser).match} of ${rows.length} match"><span class="matrix-ticks__label">${BROWSER[browser]}</span>${rows.map(row => `<i class="matrix-tick matrix-tick--${row.status[browser]}"></i>`).join('')}</span>`;

export function conformancePage(): { html: string } {
  const matrix = load();
  const { browsers } = matrix;
  const rows = matrix.components.flatMap(component => component.rows);
  const aspects = [...new Set(rows.map(row => row.aspect))];

  const masthead = `<header class="matrix-masthead">`
    + `<p class="matrix-eyebrow">Conformance</p><h1>material and Material 3, property by property</h1>`
    + `<p class="matrix-lede">Each value M3 gives for a component, the value material renders in ${browsers.map(b => BROWSER[b]).join(' and ')}, and whether they match.</p>`
    + `<p class="matrix-facts">Reference: Compose Material 3 ${escape(matrix.reference.compose.version)} (${date(matrix.reference.compose.released)}) and m3.material.io (read ${date(matrix.reference.m3Site.read)}) · material ${escape(matrix.material.version)} · measured ${date(matrix.generated)} · ${rows.length} properties in ${matrix.components.length} components</p>`
    + `</header>`;

  const cards = `<div class="matrix-summary">${browsers.map(browser => {
    const t = tally(rows, browser);
    const measured = t.match + t.drift;
    const percent = measured ? Math.round((t.match / measured) * 100) : 100;
    return m('card', { variant: 'filled', class: 'matrix-card' },
      `<p class="matrix-card__browser">${BROWSER[browser]}</p><p class="matrix-card__score"><strong>${t.match} of ${measured}</strong> match</p>`
      + `<p class="matrix-card__percent">${percent}%</p>${m('progress', { variant: 'linear', value: percent, max: 100, 'aria-label': `${BROWSER[browser]}: ${percent}% match` })}`
      + `<p class="matrix-card__rest">${t.drift} drift · ${t.noSource} no M3 value</p>`);
  }).join('')}</div>`;

  const caution = `<p class="matrix-caution">${symbols.error}<span>${matrix.sample ? '<strong>Sample data.</strong> This page shows the matrix\'s shape with a few rows; material\'s measured file replaces it. ' : ''}`
    + `Each mark is measured by material's conformance tooling in headless ${browsers.map(b => BROWSER[b]).join(' and ')} and re-measured by a second tester; values come from the rendered page, in CSS pixels.</span></p>`;

  const chip = (group: string, value: string, label: string, count: number) => m('chip', { variant: 'filter', value: `${group}:${value}`, label: `${label} ${count}` });
  const countBy = (key: (row: Row) => boolean) => rows.filter(key).length;
  const controls = `<div class="matrix-controls" role="search">`
    + m('text-field', { variant: 'outlined', label: 'Search properties', 'leading-icon': symbols.search, class: 'matrix-search', density: 'compact' })
    + `<div class="matrix-chip-groups">`
    + `<div class="matrix-chip-group"><span>Status</span>${m('chips', { selection: 'multiple', 'aria-label': 'Status', class: 'matrix-chips', 'data-group': 'status' }, (['match', 'drift', 'no-source'] as const).map(s => chip('status', s, STATUS[s].label, countBy(row => browsers.some(b => row.status[b] === s)))).join(''))}</div>`
    + `<div class="matrix-chip-group"><span>Aspect</span>${m('chips', { selection: 'multiple', 'aria-label': 'Aspect', class: 'matrix-chips', 'data-group': 'aspect' }, aspects.map(a => chip('aspect', a, ASPECT[a] ?? a, countBy(row => row.aspect === a))).join(''))}</div>`
    + `<div class="matrix-chip-group"><span>Browser</span>${m('chips', { selection: 'single', 'aria-label': 'Browser', class: 'matrix-chips', 'data-group': 'browser' }, browsers.map(b => chip('browser', b, BROWSER[b], rows.length)).join(''))}</div>`
    + `</div></div>`;

  const header = `<div class="matrix-colhead" aria-hidden="true"><span>Property</span>${browsers.map(b => `<span>${BROWSER[b]}</span>`).join('')}</div>`;

  const sections = matrix.components.map(component => {
    const drifts = component.rows.filter(row => browsers.some(b => row.status[b] === 'drift')).length;
    return `<section class="matrix-section" id="${escape(component.id)}" aria-labelledby="${escape(component.id)}-title">`
      + `<div class="matrix-section__head"><h2 id="${escape(component.id)}-title"><a href="/components/${escape(component.id)}/">${escape(component.name)}</a></h2>`
      + `<span class="matrix-badge${drifts ? ' matrix-badge--drift' : ''}">${drifts ? `${drifts} drift` : 'All match'}</span>`
      + `<span class="matrix-section__ticks">${browsers.map(b => ticks(component.rows, b)).join('')}</span></div>`
      + `<ul class="matrix-rows">${component.rows.map(row => rowHtml(row, matrix)).join('')}</ul>`
      + `<p class="matrix-empty" hidden>No property of ${escape(component.name)} matches the filters.</p></section>`;
  }).join('');

  const tray = `<aside class="matrix-tray" aria-label="Selection"><p class="matrix-tray__count" role="status"><strong data-matrix-count>${rows.length}</strong> of ${rows.length} properties</p>`
    + m('button', { variant: 'tonal', icon: symbols.contentCopy, class: 'matrix-copy' }, 'Copy as CSV') + '</aside>';

  return { html: `<div class="matrix" data-browsers="${browsers.join(' ')}">${masthead}${cards}${caution}${controls}${header}<div class="matrix-sections">${sections}</div>${tray}</div>` };
}
