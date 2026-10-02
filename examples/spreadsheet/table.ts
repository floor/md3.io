import { createVList, table, a11y } from 'vlist';
import createMenu from 'material/components/menu';
import createTextField from 'material/components/text-field';
import { button, element } from './ui';
import { valueAt, visibleColumns, type Document, type View, type Row, type Column } from './shared';
import listStyles from 'vlist/styles' with { type: 'text' };
import tableStyles from 'vlist/styles/table' with { type: 'text' };

// The examples builder emits one JS file. Bundle the unmodified public CSS exports
// as text so their styles travel with that entry, without changing shared infrastructure.
const styles = document.createElement('style');
styles.textContent = listStyles + tableStyles; document.head.append(styles);

export interface TableActions {
  edit(row: Row, column: Column, value: string, move: number, restore: boolean): void;
  sort(column: Column, direction: 'asc' | 'desc'): void;
  filter(column: Column, value: string): void;
  hide(column: Column): void;
  unavailable(message: string): void;
}
export function mountTable(host: HTMLElement, doc: Document, view: View, rows: Row[], actions: TableActions) {
  const columns = visibleColumns(doc, view);
  let active = { row: 0, column: 0 };
  let editor: ReturnType<typeof createTextField> | undefined;
  let editingCell: HTMLElement | undefined;
  let editingRow = -1, destroyed = false;
  const controls: Array<{ destroy(): void }> = [];
  // FLO-576: vlist 3.1.0 blocks pointer input in HTMLElement labels.
  // column:click has a payload type but no runtime emission; retain keyboard menus.
  const menus = columns.map(column => {
    const opener = button(column.label, () => {});
    const menu = createMenu({ opener: opener.element, items: [
      { id: 'asc', text: 'Sort ascending' }, { id: 'desc', text: 'Sort descending' },
      { id: 'filter', text: 'Filter by selected value' }, { id: 'hide', text: 'Hide column', disabled: columns.length === 1 },
    ] });
    menu.on('select', ({ itemId }) => {
      // Let menu selection restore focus before changing the table structure.
      queueMicrotask(() => {
        if (itemId === 'asc' || itemId === 'desc') actions.sort(column, itemId);
        if (itemId === 'hide') actions.hide(column);
        if (itemId === 'filter' && rows[active.row]) actions.filter(column, valueAt(doc, rows[active.row], column));
      });
    });
    controls.push(menu, opener);
    return opener.element;
  });
  const makeList = () => createVList({ container: host, items: rows, overscan: 4, ariaLabel: 'CSV data',
    item: { height: index => index === editingRow ? 160 : 48, template: () => '' },
  }, [table({ rowHeight: index => index === editingRow ? 160 : 48, headerHeight: 72, resizable: false, columns: columns.map((column, i) => ({
    key: column.id, label: menus[i], width: column.type === 'text' ? 240 : 200, align: column.type === 'number' ? 'right' as const : 'left' as const,
    cell: (row: Row, _column: unknown, rowIndex: number) => {
      const cell = element('span', 'csv__cell', valueAt(doc, row, column));
      cell.dataset.row = String(rowIndex); cell.dataset.column = String(i);
      cell.tabIndex = rowIndex === active.row && i === active.column ? 0 : -1;
      cell.setAttribute('aria-label', `${column.label}, row ${rowIndex + 1}: ${valueAt(doc, row, column) || 'empty'}`);
      cell.addEventListener('focus', () => { active = { row: rowIndex, column: i }; });
      cell.addEventListener('dblclick', () => startEdit(cell));
      return cell;
    },
  })) }), a11y({ keyboard: false })]);
  let list = makeList();
  if (view.sort) list.setSort(view.sort.column, view.sort.direction);
  function focus(row: number, column: number) {
    if (!rows.length) return;
    active = { row: Math.max(0, Math.min(rows.length - 1, row)), column: Math.max(0, Math.min(columns.length - 1, column)) };
    const previousFocus = document.activeElement;
    list.scrollToIndex(active.row, 'center');
    requestAnimationFrame(() => {
      // A later user action takes precedence over this deferred cell reveal.
      if (destroyed || document.activeElement !== previousFocus) return;
      const target = host.querySelector<HTMLElement>(`[data-row="${active.row}"][data-column="${active.column}"]`);
      host.querySelectorAll<HTMLElement>('.csv__cell').forEach(cell => { cell.tabIndex = cell === target ? 0 : -1; });
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
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
    // The supplied multiline factory currently loses configured nonempty values.
    // Keep data intact while the reported library initialization defect is unresolved.
    if (editor.getValue() !== valueAt(doc, rows[active.row], column)) {
      editor.destroy(); editor = undefined; editingRow = -1; list.destroy(); list = makeList();
      actions.unavailable('Cell editing is waiting for a Material text-field fix. Your cell is unchanged.');
      return;
    }
    editingCell = cell; cell.classList.add('csv__cell--editing'); cell.replaceChildren(editor.element);
    editor.input.focus(); editor.input.select();
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
  const onScroll = () => finish(true, 0, false);
  host.addEventListener('scroll', onScroll, true);
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
    firstColumn: columns[0]?.id,
    destroy() { destroyed = true; finish(false, 0, false); host.removeEventListener('keydown', onKey); host.removeEventListener('scroll', onScroll, true); controls.forEach(c => c.destroy()); list.destroy(); },
  };
}
