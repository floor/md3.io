// The specs index (the owner's decision of 2026-11-26, relayed by Priam): SQLite (bun:sqlite) for the list's
// search, filters and pages. A derived index, never edited: it is built in memory at start from the vendored release
// files, data/specs/<version>.json (each a copy of a release tag's conformance/matrix.json, the only source),
// so it is rebuilt from the tags every time. A new release is loaded when specs:sync vendors its tag and the
// site deploys. Row ids are material's, stable across versions, so a row's history is a query on its id.
//
// The tables are the agreed schema's matrix tables (releases, components, matrix_rows, search), without the issues
// tables. Two additive columns: matrix_rows.position keeps the file's order, and search.version scopes a search.
import { Database } from 'bun:sqlite';

export type Status = 'match' | 'drift' | 'no-value';
export interface MatrixRow {
  id: string; property: string; aspect: string; variant?: string; state?: string; density?: number;
  spec: { value: string | null; url?: string; section?: string; read?: string } | null;
  compose: { value: string | null; file?: string; symbol?: string; line?: number; url?: string } | null;
  material: { value: string; engines: Record<string, string> | null };
  status: { spec: Status; compose: Status };
  note?: string; issue?: string | null;
}
export interface MatrixFile {
  schema: 1; sample?: boolean; material: string; commit: string; measured: string;
  references: { spec: { name: string; url: string; read: string }; compose: { name: string; version: string; commit: string; date: string; url: string } };
  method: { browsers: string[]; engines: Record<string, string>; note: string };
  components: { id: string; name: string; properties: MatrixRow[] }[];
}

const SCHEMA = `
CREATE TABLE releases   (version TEXT PRIMARY KEY, commit_sha TEXT, measured TEXT, compose_version TEXT, compose_commit TEXT, spec_read TEXT);
CREATE TABLE components (id TEXT PRIMARY KEY, name TEXT, page TEXT, deprecated INTEGER DEFAULT 0);
CREATE TABLE matrix_rows (
  id TEXT, version TEXT REFERENCES releases(version),
  component TEXT REFERENCES components(id), property TEXT, aspect TEXT, variant TEXT, state TEXT, density INTEGER,
  spec_value TEXT, spec_url TEXT, spec_section TEXT, spec_read TEXT, compose_value TEXT, compose_file TEXT, compose_symbol TEXT, compose_line INTEGER, compose_url TEXT,
  material_value TEXT, material_engines TEXT,
  status_spec TEXT, status_compose TEXT,
  note TEXT, issue TEXT, position INTEGER, PRIMARY KEY (id, version));
CREATE INDEX matrix_rows_by_aspect ON matrix_rows(aspect, component);
CREATE INDEX matrix_rows_by_position ON matrix_rows(version, position);
CREATE VIRTUAL TABLE search USING fts5(title, component, property, row_id UNINDEXED, version UNINDEXED, tokenize='unicode61 remove_diacritics 2');
`;

/** A fresh index of the given releases. */
export function buildIndex(files: { version: string; matrix: MatrixFile }[], pages: Record<string, string> = {}): Database {
  const db = new Database(':memory:');
  db.exec(SCHEMA);
  const release = db.prepare('INSERT INTO releases VALUES (?, ?, ?, ?, ?, ?)');
  const component = db.prepare('INSERT OR REPLACE INTO components VALUES (?, ?, ?, ?)');
  const row = db.prepare(`INSERT INTO matrix_rows VALUES (${Array(24).fill('?').join(', ')})`);
  const search = db.prepare('INSERT INTO search VALUES (?, ?, ?, ?, ?)');
  db.transaction(() => {
    for (const { version, matrix } of files) {
      release.run(version, matrix.commit, matrix.measured, matrix.references.compose.version, matrix.references.compose.commit, matrix.references.spec.read);
      let position = 0;
      for (const c of matrix.components) {
        component.run(c.id, c.name, pages[c.id] ?? null, c.id === 'bottom-app-bar' ? 1 : 0);
        for (const r of c.properties) {
          row.run(r.id, version, c.id, r.property, r.aspect, r.variant ?? null, r.state ?? null, r.density ?? null,
            r.spec?.value ?? null, r.spec?.url ?? null, r.spec?.section ?? null, r.spec?.read ?? null,
            r.compose?.value ?? null, r.compose?.file ?? null, r.compose?.symbol ?? null, r.compose?.line ?? null, r.compose?.url ?? null,
            r.material.value, r.material.engines ? JSON.stringify(r.material.engines) : null,
            r.status.spec, r.status.compose, r.note ?? null, r.issue ?? null, position++);
          // title: the row's words and values; property: its name and qualifiers.
          const title = [r.aspect, r.note, r.spec?.value, r.compose?.value, r.material.value].filter(Boolean).join(' ');
          search.run(title, c.name, [r.property, r.variant, r.state].filter(Boolean).join(' '), r.id, version);
        }
      }
    }
  })();
  return db;
}

type DbRow = Record<string, string | number | null>;
/** A stored row back in the file's shape, for the renderer. */
export const toMatrixRow = (r: DbRow): MatrixRow => ({
  id: r.id as string, property: r.property as string, aspect: r.aspect as string,
  variant: (r.variant as string) ?? undefined, state: (r.state as string) ?? undefined, density: (r.density as number) ?? undefined,
  spec: { value: r.spec_value as string | null, url: (r.spec_url as string) ?? undefined, section: (r.spec_section as string) ?? undefined, read: (r.spec_read as string) ?? undefined },
  compose: { value: r.compose_value as string | null, file: (r.compose_file as string) ?? undefined, symbol: (r.compose_symbol as string) ?? undefined, line: (r.compose_line as number) ?? undefined, url: (r.compose_url as string) ?? undefined },
  material: { value: r.material_value as string, engines: r.material_engines ? JSON.parse(r.material_engines as string) : null },
  status: { spec: r.status_spec as Status, compose: r.status_compose as Status },
  note: (r.note as string) ?? undefined, issue: (r.issue as string) ?? null,
});

export interface RowQuery { version: string; q?: string; statuses?: string[]; aspects?: string[]; refs?: ('spec' | 'compose')[]; component?: string; offset?: number; limit?: number }

/** A page of rows at a version, in the file's order, with the total that matches. */
export function queryRows(db: Database, query: RowQuery): { rows: (MatrixRow & { component: string; componentName: string })[]; total: number } {
  const where = ['m.version = $version'];
  const params: Record<string, string | number> = { $version: query.version };
  if (query.component) { where.push('m.component = $component'); params.$component = query.component; }
  if (query.aspects?.length) { where.push(`m.aspect IN (${query.aspects.map((a, i) => { params[`$a${i}`] = a; return `$a${i}`; }).join(', ')})`); }
  if (query.statuses?.length) {
    const list = query.statuses.map((s, i) => { params[`$s${i}`] = s; return `$s${i}`; }).join(', ');
    const refs = query.refs?.length ? query.refs : ['spec', 'compose'];
    where.push(`(${refs.map(r => `m.status_${r === 'spec' ? 'spec' : 'compose'} IN (${list})`).join(' OR ')})`);
  }
  const terms = (query.q ?? '').trim().split(/\s+/).filter(Boolean);
  if (terms.length) {
    // Each word, as a prefix: "cont heig" finds "Container height".
    params.$q = terms.map(t => `"${t.replace(/"/g, '""')}"*`).join(' ');
    where.push('m.id IN (SELECT row_id FROM search WHERE search MATCH $q AND version = $version)');
  }
  const from = `FROM matrix_rows m JOIN components c ON c.id = m.component WHERE ${where.join(' AND ')}`;
  const total = (db.prepare(`SELECT count(*) AS n ${from}`).get(params) as { n: number }).n;
  params.$limit = query.limit ?? 50;
  params.$offset = query.offset ?? 0;
  const rows = db.prepare(`SELECT m.*, c.name AS component_name ${from} ORDER BY m.position LIMIT $limit OFFSET $offset`).all(params) as DbRow[];
  return { total, rows: rows.map(r => ({ ...toMatrixRow(r), component: r.component as string, componentName: r.component_name as string })) };
}
