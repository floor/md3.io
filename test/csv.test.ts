import { describe, expect, test } from 'bun:test';
import { parseCSV, writeCSV } from '../examples/spreadsheet/parser';
import { openCSV, edit, freshView, rowsInView, findCells, hideColumn, exportCSV, valueAt } from '../examples/spreadsheet/model';

describe('CSV grammar', () => {
  test('BOM, CRLF, commas, doubled quotes and embedded line breaks', () => {
    expect(parseCSV('\uFEFFA,B\r\n"a,b","a""b\r\nc"\r\n')).toEqual([['A', 'B'], ['a,b', 'a"b\r\nc']]);
  });
  test('empty cells and final record without newline', () => {
    expect(parseCSV('A,B\n,')).toEqual([['A', 'B'], ['', '']]);
    expect(parseCSV('A\n""')).toEqual([['A'], ['']]);
  });
  test.each(['', 'a,b\n1', 'a\n"unclosed', 'a\nstray"', 'a\n"ok"extra', 'a\n"ok""'])('rejects malformed %j', text => {
    expect(() => parseCSV(text)).toThrow();
  });
  test('roundtrips text exactly', () => {
    const data = [['a', 'b'], ['<script>', '=1+1'], ['\r\n', '"comma,']];
    expect(parseCSV(writeCSV(data))).toEqual(data);
  });
});
describe('CSV model', () => {
  const doc = () => openCSV('Name,Units,Date,Code\nBeta,10,2026-01-02,001\nAlpha,2,2026-01-01,002\nAlpha,2,2026-01-03,003\nBlank,,,004', 'test.csv');
  test('types and unique labels, strict calendar dates', () => {
    expect(doc().columns.map(c => c.type)).toEqual(['text', 'number', 'date', 'text']);
    expect(openCSV(',,Column 1\nx,y,z', '').columns.map(c => c.label)).toEqual(['Column 1', 'Column 2', 'Column 1 (2)']);
    expect(openCSV('Date\n2026-02-30', '').columns[0].type).toBe('text');
    expect(openCSV('Only', '').rows).toEqual([]);
  });
  test('stable numerical sort; blanks always last', () => {
    const d = doc();
    for (const direction of ['asc', 'desc'] as const) {
      const rows = rowsInView(d, { ...freshView(), sort: { column: 'c1', direction } });
      expect(rows.map(r => r.id)).toEqual(direction === 'asc' ? [1, 2, 0, 3] : [0, 1, 2, 3]);
    }
  });
  test('edit deltas, sorting/filtering/finding edited text, reversion', () => {
    const original = doc(), column = original.columns[1], row = original.rows[0];
    const d = edit(original, row, column, '1');
    expect(original.edits.size).toBe(0);
    expect(d.rows).toBe(original.rows);
    expect(valueAt(d, row, column)).toBe('1');
    expect(rowsInView(d, { ...freshView(), sort: { column: column.id, direction: 'asc' } })[0].id).toBe(0);
    expect(edit(d, row, column, '10').edits.size).toBe(0);
    const view = { ...freshView(), query: 'BETA', exact: { column: column.id, value: '1' } };
    expect(rowsInView(d, view).length).toBe(1);
    expect(findCells(d, view, rowsInView(d, view), '1')).toContainEqual({ row: 0, column: 'c1' });
  });
  test('hide preserves export; filter defines export rows', () => {
    const d = doc();
    let view = hideColumn(d, { ...freshView(), query: 'alpha' }, 'c0');
    expect(findCells(d, view, rowsInView(d, view), 'alpha')).toEqual([]);
    expect(parseCSV(exportCSV(d, view)).length).toBe(3);
    expect(parseCSV(exportCSV(d, view))[1][0]).toBe('Alpha');
    for (const c of d.columns) view = hideColumn(d, view, c.id);
    expect(view.hidden.size).toBe(3);
  });
});

test('literal export by default, opt-in spreadsheet-safe headers and cells', () => {
  const doc = openCSV('=Header,Note\n=1+1,  @SUM(1)\n-42,ordinary', 'formulas.csv');
  expect(parseCSV(exportCSV(doc, freshView()))[1][0]).toBe('=1+1');
  expect(parseCSV(exportCSV(doc, freshView(), true))).toEqual([
    ["'=Header", 'Note'], ["'=1+1", "'  @SUM(1)"], ["'-42", 'ordinary'],
  ]);
});
