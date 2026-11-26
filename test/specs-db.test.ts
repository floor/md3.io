import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { buildIndex, queryRows, type MatrixFile } from '../src/server/specs-db';

const sample = JSON.parse(readFileSync(new URL('../data/specs/sample.json', import.meta.url), 'utf8')) as MatrixFile;
const later: MatrixFile = { ...sample, components: sample.components.map(c => ({ ...c, properties: c.properties.map(r => ({ ...r, status: { ...r.status, spec: 'match' as const } })) })) };
const db = buildIndex([{ version: '1.0.0', matrix: sample }, { version: '1.1.0', matrix: later }]);
const all = sample.components.flatMap(c => c.properties);

describe('the specs index', () => {
  test('pages a version in the file order, with its total', () => {
    const page = queryRows(db, { version: '1.0.0', offset: 1, limit: 2 });
    expect(page.total).toBe(all.length);
    expect(page.rows.map(r => r.id)).toEqual(all.slice(1, 3).map(r => r.id));
  });
  test('reads a row back in the file shape, a missing value as null', () => {
    const row = queryRows(db, { version: '1.0.0', limit: 1000 }).rows.find(r => r.compose?.value === null);
    expect(row).toBeDefined();
    expect(row!.material.value).toBeString();
  });
  test('filters by status against one reference, and by aspect', () => {
    const drift = all.filter(r => r.status.compose === 'drift').length;
    expect(queryRows(db, { version: '1.0.0', statuses: ['drift'], refs: ['compose'] }).total).toBe(drift);
    const size = all.filter(r => r.aspect === 'size').length;
    expect(queryRows(db, { version: '1.0.0', aspects: ['size'] }).total).toBe(size);
  });
  test('searches words as prefixes, across the component and the property', () => {
    const hits = queryRows(db, { version: '1.0.0', q: 'contain heig' }).rows;
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every(r => /container height/i.test(r.property))).toBe(true);
    expect(queryRows(db, { version: '1.0.0', q: 'tooltip' }).rows.every(r => r.component === 'tooltip')).toBe(true);
  });
  test('keeps versions apart, so a row id has a history', () => {
    const id = all[0]!.id;
    const statuses = ['1.0.0', '1.1.0'].map(version => queryRows(db, { version, limit: 1000 }).rows.find(r => r.id === id)!.status.spec);
    expect(statuses[1]).toBe('match');
    expect(db.prepare('SELECT count(*) AS n FROM matrix_rows WHERE id = ?').get(id)).toEqual({ n: 2 });
  });
});
