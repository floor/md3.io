/// <reference path="./assets.d.ts" />
import createTopAppBar from 'material/components/top-app-bar';
import createDialog from 'material/components/dialog';
import { supportingTools } from './panes';
import createSnackbar from 'material/components/snackbar';
import createCheckbox from 'material/components/checkbox';
import fixture from './dispatches.csv' with { type: 'text' };
import { openCSV, edit, exportCSV, findCells, freshView, rowsInView, valueAt, type Document } from './shared';
import { button as makeButton, field as makeField, element } from './ui';
import { columnTools } from './column-tools';
import { mountListStyles } from './list-styles';
import { mountTable } from './table';

export interface SpreadsheetApp { element: HTMLElement; destroy(): void }

/** Each mount owns its document, controls, listeners and pending file reads. */
export function createSpreadsheetApp(): SpreadsheetApp {
  const controls: Array<{ destroy(): void }> = [];
  const own = <T extends { destroy(): void }>(control: T): T => { controls.push(control); return control; };
  const button: typeof makeButton = (...args) => own(makeButton(...args));
  const field: typeof makeField = (...args) => own(makeField(...args));
  const listeners = new AbortController();
  const releaseStyles = mountListStyles();
  let destroyed = false;
  const dialogs = new Set<ReturnType<typeof createDialog>>();
  const downloads = new Map<string, ReturnType<typeof setTimeout>>();
  const section = element('section', 'csv');
  section.setAttribute('aria-label', 'Spreadsheet');
  const appbar = own(createTopAppBar({ title: 'Spreadsheet', type: 'small', scrollable: false }));
  const barHost = element('div', 'csv__appbar'); barHost.append(appbar.element);
  const heading = element('div', 'csv__heading');
  const file = element('input'); file.type = 'file'; file.accept = '.csv'; file.hidden = true;
  file.setAttribute('aria-label', 'Open CSV file');
  const open = button('Open CSV', () => file.click(), true);
  const download = button('Export CSV', save);
  const safe = own(createCheckbox({ label: 'Safe for spreadsheets' }));
  heading.append(open.element, download.element, file);
  const info = element('p', 'csv__info');
  const toolbar = element('div', 'csv__toolbar'); toolbar.setAttribute('role', 'group'); toolbar.setAttribute('aria-label', 'Data tools');
  const filter = field('Filter rows');
  const clear = button('Clear filters', () => { view.query = ''; view.exact = undefined; filter.setValue(''); render(); });
  const show = button('Show all columns', () => { view.hidden.clear(); render(); });
  const editButton = button('Edit selected cell', () => { tools.close(); table?.editSelected(); });
  const findButton = button('Find', () => { findBar.hidden = false; find.input.focus(); });
  const columns = columnTools(() => doc, () => view, () => render());
  toolbar.append(columns.element, element('h2', 'csv__subhead', 'Rows and export'), filter.element, clear.element, show.element, safe.element, editButton.element);
  const tools = supportingTools(section, toolbar);
  heading.append(findButton.element, tools.opener.element);
  const findBar = element('div', 'csv__find'); findBar.hidden = true; findBar.setAttribute('role', 'search'); findBar.setAttribute('aria-label', 'Find in table');
  const find = field('Find in visible cells');
  const matches = element('output'); matches.setAttribute('aria-live', 'polite');
  const closeFind = () => { findBar.hidden = true; findButton.element.focus(); };
  findBar.append(find.element, button('Previous match', () => reveal(-1)).element, button('Next match', () => reveal(1)).element, matches, button('Close find', closeFind).element);
  findBar.addEventListener('keydown', event => { if (event.key === 'Escape') closeFind(); if (event.key === 'Enter') reveal(event.shiftKey ? -1 : 1); });
  const host = element('div', 'csv__table');
  const empty = element('p', 'csv__empty');
  const status = element('output', 'csv__status'); status.setAttribute('role', 'status');
  const error = element('p', 'csv__error'); error.setAttribute('role', 'alert'); error.hidden = true;
  const help = element('p', 'csv__help', 'This version reads and writes CSV. Drop a CSV onto the spreadsheet. Scroll sideways for more columns. Arrows move between cells; Enter or double-click edits; Escape cancels. Click or tap a column header to sort; use Tools to show columns or filter by a value. Tab enters the headers, arrows move within the table, and Enter on a header sorts.');
  section.append(barHost, heading, info, findBar, error, host, empty, status, help);

  let doc: Document = openCSV(fixture, 'warehouse-dispatches.csv'), view = freshView();
  let previous: Document | undefined;
  const undo = own(createSnackbar({ message: 'Cell edited', action: 'Undo', dismissible: true, queueBehavior: 'replace', layer: 'top' }));
  undo.on('action', () => { if (previous) { doc = previous; previous = undefined; render(); status.textContent = 'Last cell edit undone.'; } });
  let table: ReturnType<typeof mountTable> | undefined;
  let rows = rowsInView(doc, view), found = findCells(doc, view, rows, ''), match = -1, opening = 0;
  function describe() {
    info.textContent = `${doc.name} · ${rows.length.toLocaleString('en-US')} of ${doc.rows.length.toLocaleString('en-US')} rows · ${doc.columns.length} columns · ${doc.edits.size} edited cells`;
    section.dataset.rows = String(doc.rows.length);
  }
  function search() { found = findCells(doc, view, rows, find.getValue()); match = -1; matches.textContent = `${found.length} matches`; }
  function reveal(direction: number) {
    if (!found.length) return;
    match = match < 0 ? direction > 0 ? 0 : found.length - 1 : (match + direction + found.length) % found.length;
    table?.focus(found[match].row, found[match].column);
    matches.textContent = `${match + 1} of ${found.length} matches`;
  }
  function render() {
    if (destroyed) return;
    rows = rowsInView(doc, view);
    columns.sync();
    if (!table?.update(doc, view, rows)) {
      table?.destroy();
      table = mountTable(host, doc, view, rows, {
        edit(row, column, value, move, restore) {
          if (value === valueAt(doc, row, column)) return;
          previous = doc; doc = edit(doc, row, column, value); table?.updateDocument(doc); describe(); search();
          undo.setMessage(`Edited ${column.label}`).show();
          status.textContent = `Updated ${column.label}, source row ${row.id + 1}.`;
          queueMicrotask(() => {
            if (destroyed) return;
            render();
            if (restore) {
              const index = Math.max(0, rows.findIndex(r => r.id === row.id));
              const visible = doc.columns.filter(c => !view.hidden.has(c.id));
              const next = Math.max(0, Math.min(rows.length * visible.length - 1, index * visible.length + visible.indexOf(column) + move));
              table?.focus(Math.floor(next / visible.length), visible[next % visible.length].id);
            }
          });
        },
        sort(column, direction) { view.sort = direction ? { column: column.id, direction } : undefined; render(); },
      });
    }
    empty.hidden = rows.length > 0;
    empty.textContent = doc.rows.length ? 'No matching rows. Clear filters to see your data.' : 'This file has headers but no rows. Open or drop another CSV.';
    describe(); search();
  }
  filter.on('input', ({ value }) => { view.query = value; render(); });
  find.on('input', search);
  async function readFile(incoming?: File) {
    if (!incoming || destroyed) return;
    table?.commit();
    if (doc.edits.size) {
      const dialog = createDialog({ layer: 'top' });
      dialogs.add(dialog);
      const discard = await dialog.confirm({ title: 'Discard edits?', message: 'Export first to keep your changes.', confirmText: 'Discard and open', cancelText: 'Cancel' });
      dialogs.delete(dialog); dialog.destroy();
      if (!discard || destroyed) return;
    }
    const request = ++opening;
    error.hidden = true; section.setAttribute('aria-busy', 'true'); status.textContent = `Opening ${incoming.name}…`;
    try {
      if (!/\.csv$/i.test(incoming.name)) throw new Error('Open a .csv file. Excel import is not available in this reference yet.');
      const text = await incoming.text();
      // Give the loading announcement a paint before synchronous parsing.
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const next = openCSV(text, incoming.name);
      if (destroyed || request !== opening) return;
      undo.hide(); previous = undefined; doc = next; view = freshView(); filter.setValue(''); find.setValue(''); render();
      status.textContent = `Opened ${incoming.name}.`;
    } catch (problem) {
      if (request === opening) { error.textContent = `${incoming.name}: ${(problem as Error).message}`; error.hidden = false; status.textContent = 'The previous document is still open.'; }
    } finally { if (request === opening) section.removeAttribute('aria-busy'); }
  }
  file.addEventListener('change', () => { void readFile(file.files?.[0]); file.value = ''; });
  section.addEventListener('dragover', event => { event.preventDefault(); }, { signal: listeners.signal });
  section.addEventListener('drop', event => {
    event.preventDefault();
    if (event.dataTransfer?.files.length !== 1) { error.textContent = 'Drop one CSV file at a time.'; error.hidden = false; return; }
    void readFile(event.dataTransfer.files[0]);
  }, { signal: listeners.signal });
  function save() {
    table?.commit();
    const blob = new Blob([exportCSV(doc, view, safe.isChecked())], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob), link = element('a');
    link.href = url; link.download = doc.name.replace(/\.[^.]+$/, '') + '-edited.csv'; link.click();
    downloads.set(url, setTimeout(() => { URL.revokeObjectURL(url); downloads.delete(url); }, 1000));
    status.textContent = `Exported ${rowsInView(doc, view).length} rows and all ${doc.columns.length} columns, including hidden columns.`;
  }
  render(); status.textContent = 'Sample: 3,000 synthetic warehouse dispatches. Open your own CSV to begin.';

  return {
    element: section,
    destroy() {
      if (destroyed) return;
      destroyed = true; opening++;
      listeners.abort();
      for (const dialog of dialogs) dialog.destroy();
      dialogs.clear();
      for (const [url, timer] of downloads) { clearTimeout(timer); URL.revokeObjectURL(url); }
      downloads.clear();
      table?.destroy(); columns.destroy(); tools.destroy();
      controls.reverse().forEach(control => control.destroy());
      releaseStyles(); section.remove();
    },
  };
}
