// md3.io/conformance/matrix: material's conformance with M3, property by property (FLO-1607, the owner's
// request of 2026-11-26). The data is material's public matrix file, schema v1 agreed with material on
// 2026-11-26, vendored at the pinned version by `bun run conformance:sync` into data/conformance/matrix.json.
// Until material tags the first real file, the page renders a labelled sample. Scores are derived here.
// Filters are a plain GET form (component, status, browser), so they work without scripts.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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
const STATUS_LABEL: Record<Status, string> = { match: 'Matches', drift: 'Drift', 'no-source': 'No M3 value' };
const BROWSER_LABEL: Record<Browser, string> = { chromium: 'Chromium', webkit: 'WebKit' };
const date = (iso: string): string => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** Rows with an M3 value that match, out of rows with an M3 value: in one browser, or in both. */
const score = (rows: Row[], browsers: Browser[]): { matched: number; measured: number; percent: number } => {
  const measured = rows.filter(row => browsers.some(browser => row.status[browser] !== 'no-source'));
  const matched = measured.filter(row => browsers.every(browser => row.status[browser] === 'match'));
  return { matched: matched.length, measured: measured.length, percent: measured.length ? Math.round((matched.length / measured.length) * 100) : 100 };
};

const meter = (label: string, value: ReturnType<typeof score>): string =>
  `<div class="conformance-meter"><meter min="0" max="${value.measured || 1}" value="${value.matched}" aria-label="${escape(label)}"></meter>`
  + `<span><strong>${value.percent}%</strong> · ${value.matched} of ${value.measured} properties match</span></div>`;

const source = (row: Row, matrix: Matrix): string => {
  const src = row.m3.source;
  if (!src) return '<span class="conformance-muted">M3 gives no value</span>';
  if (src.kind === 'compose') {
    const url = `https://github.com/androidx/androidx/blob/${matrix.reference.compose.commit}/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/${src.file}${src.line ? `#L${src.line}` : ''}`;
    return `<a class="text-link" href="${url}">${escape(`${src.file?.replace(/\.kt$/, '')}.${src.symbol}`)}</a>`;
  }
  return `<a class="text-link" href="${escape(src.url ?? matrix.reference.m3Site.url)}">m3.material.io</a>, read ${date(src.read ?? matrix.reference.m3Site.read)}`;
};

const badge = (status: Status): string => `<span class="conformance-status conformance-status--${status}">${STATUS_LABEL[status]}</span>`;

const rowHtml = (row: Row, matrix: Matrix, browsers: Browser[]): string => {
  const qualifier = [row.variant, row.state, row.density !== undefined ? `density ${row.density}` : ''].filter(Boolean).join(', ');
  return `<tr id="${escape(row.id)}" data-aspect="${escape(row.aspect)}">`
    + `<th scope="row"><a class="conformance-anchor" href="#${escape(row.id)}">${escape(row.property)}</a>${qualifier ? `<span class="conformance-muted">${escape(qualifier)}</span>` : ''}</th>`
    + `<td>${row.m3.value ? escape(row.m3.value) : '—'}<span class="conformance-source">${source(row, matrix)}</span></td>`
    + browsers.map(browser => `<td>${escape(row.material[browser] ?? '—')}<span class="conformance-source">${badge(row.status[browser])}</span></td>`).join('')
    + `<td>${row.note ? escape(row.note) : ''}${row.issue ? ` <a class="text-link" href="${escape(row.issue)}">Issue</a>` : ''}</td></tr>`;
};

export interface ConformanceQuery { component?: string; status?: string; browser?: string }

export function conformancePage(query: ConformanceQuery): { html: string; toc: { id: string; title: string }[] } {
  const matrix = load();
  const allBrowsers = matrix.browsers;
  const browsers: Browser[] = allBrowsers.includes(query.browser as Browser) ? [query.browser as Browser] : allBrowsers;
  const status = (['match', 'drift', 'no-source'] as const).includes(query.status as Status) ? query.status as Status : undefined;
  const components = matrix.components.filter(component => !query.component || component.id === query.component);
  const keep = (row: Row) => !status || browsers.some(browser => row.status[browser] === status);
  const allRows = matrix.components.flatMap(component => component.rows);

  const select = (name: string, label: string, options: [string, string][], value?: string) =>
    `<label class="conformance-filter"><span>${label}</span><select name="${name}">${options.map(([v, l]) => `<option value="${escape(v)}"${v === (value ?? '') ? ' selected' : ''}>${escape(l)}</option>`).join('')}</select></label>`;
  const filters = `<form class="conformance-filters" method="get" action="/conformance/matrix/">`
    + select('component', 'Component', [['', 'All components'], ...matrix.components.map(c => [c.id, c.name] as [string, string])], query.component)
    + select('status', 'Status', [['', 'Any status'], ['match', 'Matches'], ['drift', 'Drift'], ['no-source', 'No M3 value']], status)
    + select('browser', 'Browser', [['', 'Both browsers'], ...allBrowsers.map(b => [b, BROWSER_LABEL[b]] as [string, string])], query.browser)
    + `<button type="submit" class="conformance-apply">Apply</button></form>`;

  const sections = components.map(component => {
    const rows = component.rows.filter(keep);
    return `<section class="conformance-component" aria-labelledby="${escape(component.id)}">`
      + `<div class="conformance-component__head"><h2 id="${escape(component.id)}"><a href="/components/${escape(component.id)}/">${escape(component.name)}</a></h2>${meter(`${component.name}: properties that match`, score(component.rows, browsers))}</div>`
      + (rows.length
        ? `<div class="conformance-table-wrap"><table class="conformance-table"><caption class="sr-only">${escape(component.name)}: M3 and material, property by property</caption>`
          + `<thead><tr><th scope="col">Property</th><th scope="col">M3</th>${browsers.map(b => `<th scope="col">material, ${BROWSER_LABEL[b]}</th>`).join('')}<th scope="col">Note</th></tr></thead>`
          + `<tbody>${rows.map(row => rowHtml(row, matrix, browsers)).join('')}</tbody></table></div>`
        : '<p class="conformance-muted">No property with this status.</p>')
      + '</section>';
  }).join('');

  const overall = score(allRows, browsers);
  const header = `<header class="conformance-header">`
    + (matrix.sample ? '<p class="conformance-sample" role="note">Sample data: this page shows the shape of the matrix with a few rows. material\'s measured file replaces it.</p>' : '')
    + `<h1>Conformance</h1><p class="conformance-lede">How closely material follows Material 3, property by property: each value M3 gives, the value material renders in Chromium and in WebKit, and whether they match.</p>`
    + `<dl class="conformance-facts">`
    + `<div><dt>M3 reference</dt><dd>Compose Material 3 ${escape(matrix.reference.compose.version)}, ${date(matrix.reference.compose.released)}; <a class="text-link" href="${escape(matrix.reference.m3Site.url)}">m3.material.io</a>, read ${date(matrix.reference.m3Site.read)}</dd></div>`
    + `<div><dt>material</dt><dd>${escape(matrix.material.version)}</dd></div>`
    + `<div><dt>Measured</dt><dd>${date(matrix.generated)}, in ${allBrowsers.map(b => BROWSER_LABEL[b]).join(' and ')}</dd></div>`
    + `<div><dt>Overall</dt><dd>${meter('All components: properties that match', overall)}</dd></div>`
    + `</dl>${filters}</header>`;

  return { html: `<div class="conformance">${header}${sections}</div>`, toc: components.map(c => ({ id: c.id, title: c.name })) };
}
