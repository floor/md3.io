import { createVList, table, a11y } from 'vlist';
import createTextField from 'material/components/text-field';
import { element } from './ui';
import { valueAt, visibleColumns, type Document, type View, type Row, type Column } from './shared';
export interface TableActions {
  edit(row: Row, column: Column, value: string, move: number, restore: boolean): void;
  sort(column: Column, direction: 'asc' | 'desc' | null): void;
}
export function mountTable(host: HTMLElement, doc: Document, view: View, rows: Row[], actions: TableActions) {
  const columns = visibleColumns(doc, view);
  let active = { row: 0, column: 0 };
  let editor: ReturnType<typeof createTextField> | undefined;
  let editingCell: HTMLElement | undefined;
  let editingRow = -1, destroyed = false;
  const makeList = () => {
    const list = createVList({ container: host, items: rows, overscan: 4, ariaLabel: 'CSV data',
    item: { height: index => index === editingRow ? 160 : 48, template: () => '' },
  }, [table({ rowHeight: index => index === editingRow ? 160 : 48, headerHeight: 48, resizable: false, columns: columns.map((column, i) => ({
    key: column.id, label: column.label, sortable: true, width: column.type === 'text' ? 240 : 200, align: column.type === 'number' ? 'right' as const : 'left' as const,
    cell: (row: Row, _column: unknown, rowIndex: number) => {
      const cell = element('span', 'csv__cell', valueAt(doc, row, column));
      cell.dataset.row = String(rowIndex); cell.dataset.column = String(i);
      cell.tabIndex = -1; // The library's roving header is the table's only Tab stop.
      cell.setAttribute('aria-label', `${column.label}, row ${rowIndex + 1}: ${valueAt(doc, row, column) || 'empty'}`);
      cell.addEventListener('focus', () => { active = { row: rowIndex, column: i }; });
      cell.addEventListener('dblclick', () => startEdit(cell));
      return cell;
    },
  })) }), a11y({ keyboard: false })]);
    // Public VList.element is the grid root. ariaLabel currently names only the
    // inner rowgroup; set the accessible name on this documented public element.
    list.element.setAttribute('aria-label', 'CSV data');
    list.element.tabIndex = -1; // Programmatic focus only; headers already own Tab.
    list.on('column:sort', payload => {
      const { key, direction } = payload as { key: string; direction: 'asc' | 'desc' | null };
      const column = columns.find(column => column.id === key);
      if (column) actions.sort(column, direction);
    });
    if (view.sort) list.setSort(view.sort.column, view.sort.direction);
    return list;
  };
  let list = makeList();
  if (view.sort) list.setSort(view.sort.column, view.sort.direction);
  function focus(row: number, column: number) {
    if (!rows.length) return;
    active = { row: Math.max(0, Math.min(rows.length - 1, row)), column: Math.max(0, Math.min(columns.length - 1, column)) };
    const target = () => host.querySelector<HTMLElement>(`[data-row="${active.row}"][data-column="${active.column}"]`);
    const mounted = target();
    if (mounted) {
      // A visible neighbour needs just one focus change and no vertical scrolling.
      mounted.focus({ preventScroll: true });
      mounted.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      return;
    }
    // Only far jumps need focus off the recyclable row before scrolling.
    // Use the documented public root and scrollToIndex; do not suppress errors.
    list.element.focus({ preventScroll: true });
    const previousFocus = document.activeElement;
    list.scrollToIndex(active.row, 'center');
    requestAnimationFrame(() => {
      if (destroyed || document.activeElement !== previousFocus) return;
      target()?.focus({ preventScroll: true });
      target()?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
  }
  function finish(commit: boolean, move = 0, restore = true) {
    if (!editor || !editingCell) return;
    const value = editor.getValue(), row = rows[active.row], column = columns[active.column];
    const control = editor, cell = editingCell;
    editor = undefined; editingCell = undefined;
    control.destroy(); editingRow = -1; cell.classList.remove('csv__cell--editing'); cell.textContent = commit ? value : valueAt(doc, row, column);
    if (commit) actions.edit(row, column, value, move, restore);
    if (!destroyed) { list.destroy(); list = makeList(); }
    if (restore) {
      const next = active.row * columns.length + active.column + move;
      focus(Math.floor(next / columns.length), ((next % columns.length) + columns.length) % columns.length);
    }
  }
  function startEdit(cell: HTMLElement) {
    if (editor) finish(true);
    active = { row: Number(cell.dataset.row), column: Number(cell.dataset.column) };
    const column = columns[active.column];
    editingRow = active.row; list.destroy(); list = makeList();
    list.scrollToIndex(active.row, 'center');
    cell = host.querySelector<HTMLElement>(`[data-row="${active.row}"][data-column="${active.column}"]`)!;
    if (!cell) return;
    editor = createTextField({ label: `Edit ${column.label}`, value: valueAt(doc, rows[active.row], column), variant: 'outlined', type: 'multiline' });
    editingCell = cell; cell.classList.add('csv__cell--editing'); cell.replaceChildren(editor.element);
    cell.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    editor.input.focus({ preventScroll: true }); editor.input.select();
    editor.input.addEventListener('keydown', nativeEvent => {
      const event = nativeEvent as KeyboardEvent;
      event.stopPropagation();
      if (event.key === 'Escape') { event.preventDefault(); finish(false); }
      if ((event.key === 'Enter' && !event.shiftKey) || event.key === 'Tab') { event.preventDefault(); finish(true, event.key === 'Tab' ? event.shiftKey ? -1 : 1 : 0); }
    });
    const currentEditor = editor;
    // A virtual row can blur while being removed; rebuild after that DOM operation.
    editor.input.addEventListener('blur', () => queueMicrotask(() => {
      if (editor === currentEditor) finish(true, 0, false);
    }));
  }
  host.addEventListener('keydown', onKey);
  function onKey(event: KeyboardEvent) {
    if (editor || !(event.target instanceof HTMLElement) || event.target.closest('button, input, textarea, [role=menu]')) return;
    const moves: Record<string, [number, number]> = {
      ArrowDown: [1, 0], ArrowUp: [-1, 0], ArrowRight: [0, 1], ArrowLeft: [0, -1], PageDown: [10, 0], PageUp: [-10, 0],
    };
    if (moves[event.key]) { event.preventDefault(); const [r, c] = moves[event.key]; focus(active.row + r, active.column + c); }
    else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault(); focus(event.ctrlKey ? event.key === 'Home' ? 0 : rows.length - 1 : active.row, event.key === 'Home' ? 0 : columns.length - 1);
    } else if (event.key === 'Enter' || event.key === 'F2') {
      event.preventDefault();
      const cell = host.querySelector<HTMLElement>(`[data-row="${active.row}"][data-column="${active.column}"]`);
      if (cell) startEdit(cell);
    }
  }
  return {
    focus: (row: number, column: string) => focus(row, columns.findIndex(c => c.id === column)),
    commit: () => finish(true, 0, false),
    updateDocument(next: Document) { doc = next; },
    editSelected() {
      const cell = host.querySelector<HTMLElement>(`[data-row="${active.row}"][data-column="${active.column}"]`);
      if (cell) startEdit(cell);
    },
    update(next: Document, nextView: View, nextRows: Row[]) {
      const nextColumns = visibleColumns(next, nextView);
      if (nextColumns.length !== columns.length || nextColumns.some((column, i) => column !== columns[i])) return false;
      doc = next; view = nextView; rows = nextRows;
      active.row = Math.max(0, Math.min(active.row, rows.length - 1));
      list.setSort(view.sort?.column ?? null, view.sort?.direction);
      // vlist's documented sorting route: retain headers and replace the row data.
      // Move focus only if replacing the rows would remove the focused cell.
      if (host.querySelector('.csv__cell:focus')) list.element.focus({ preventScroll: true });
      // Cell values also depend on sparse document edits, not only row identity.
      list.setItems(rows.map(row => ({ ...row })));
      return true;
    },
    destroy() { destroyed = true; finish(false, 0, false); host.removeEventListener('keydown', onKey); list.destroy(); },
  };
}
