import { parseCSV, writeCSV } from './parser';

export interface Column { id: string; label: string; type: 'text' | 'number' | 'date'; index: number }
export interface Row { id: number; cells: string[]; [key: string]: unknown }
export interface Document { name: string; columns: Column[]; rows: Row[]; edits: Map<string, string> }
export interface View { query: string; exact?: { column: string; value: string }; sort?: { column: string; direction: 'asc' | 'desc' }; hidden: Set<string> }
export const freshView = (): View => ({ query: '', hidden: new Set() });
const key = (row: number, column: Column) => `${row}:${column.id}`;
export const valueAt = (doc: Document, row: Row, column: Column): string => doc.edits.get(key(row.id, column)) ?? row.cells[column.index];
const numeric = (s: string) => /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(s) && Number.isFinite(Number(s));
const date = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s;

export function openCSV(text: string, name: string): Document {
  const [headers, ...records] = parseCSV(text);
  const used = new Set<string>();
  const columns = headers.map((header, index): Column => {
    const base = header || `Column ${index + 1}`;
    let label = base, suffix = 2;
    while (used.has(label)) label = `${base} (${suffix++})`;
    used.add(label);
    const values = records.map(row => row[index]).filter(Boolean);
    const type = values.length && values.every(numeric) ? 'number' : values.length && values.every(date) ? 'date' : 'text';
    return { id: `c${index}`, index, label, type };
  });
  return { name, columns, rows: records.map((cells, id) => ({ id, cells })), edits: new Map() };
}

/** Structural sharing: only the sparse edit map is copied. */
export function edit(doc: Document, row: Row, column: Column, value: string): Document {
  const edits = new Map(doc.edits);
  if (value === row.cells[column.index]) edits.delete(key(row.id, column));
  else edits.set(key(row.id, column), value);
  return { ...doc, edits };
}
export const visibleColumns = (doc: Document, view: View) => doc.columns.filter(c => !view.hidden.has(c.id));
export function hideColumn(doc: Document, view: View, id: string): View {
  if (!doc.columns.some(c => c.id === id) || visibleColumns(doc, view).length <= 1) return view;
  return { ...view, hidden: new Set([...view.hidden, id]) };
}
export function rowsInView(doc: Document, view: View): Row[] {
  const query = view.query.toLocaleLowerCase();
  const exact = doc.columns.find(c => c.id === view.exact?.column);
  const rows = doc.rows.filter(row => (!query || doc.columns.some(c => valueAt(doc, row, c).toLocaleLowerCase().includes(query))) &&
    (!exact || valueAt(doc, row, exact) === view.exact!.value));
  const column = doc.columns.find(c => c.id === view.sort?.column);
  if (!column) return rows;
  const direction = view.sort!.direction === 'asc' ? 1 : -1;
  return rows.sort((a, b) => {
    const av = valueAt(doc, a, column), bv = valueAt(doc, b, column);
    if (!av || !bv) return av === bv ? 0 : av ? -1 : 1;
    const compare = column.type === 'number' && numeric(av) && numeric(bv) ? Number(av) - Number(bv) :
      av < bv ? -1 : av > bv ? 1 : 0;
    return direction * compare;
  });
}
export interface Match { row: number; column: string }
export function findCells(doc: Document, view: View, rows: Row[], query: string): Match[] {
  const matches: Match[] = [];
  if (!query) return matches;
  const needle = query.toLocaleLowerCase();
  const columns = visibleColumns(doc, view);
  rows.forEach((row, index) => columns.forEach(c => {
    if (valueAt(doc, row, c).toLocaleLowerCase().includes(needle)) matches.push({ row: index, column: c.id });
  }));
  return matches;
}
/** Prefix potential spreadsheet formulas, including whitespace/control prefixes. */
export const safeCell = (value: string) => /^[\s]*[=+@-]/.test(value) || /^[\t\r\n]/.test(value) ? "'" + value : value;
export function exportCSV(doc: Document, view: View, safe = false): string {
  const records = [doc.columns.map(c => c.label), ...rowsInView(doc, view).map(row => doc.columns.map(c => valueAt(doc, row, c)))];
  return writeCSV(safe ? records.map(row => row.map(safeCell)) : records);
}
