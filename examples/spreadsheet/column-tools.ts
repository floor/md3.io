import createSwitch from 'material/components/switch';
import createSelect from 'material/components/select';
import { button, field, element } from './ui';
import { hideColumn, type Document, type View } from './shared';

/** The same controls work by pointer, touch and keyboard, including hidden columns. */
export function columnTools(document: () => Document, view: () => View, changed: () => void) {
  const root = element('div', 'csv__column-tools');
  const choice = createSelect({ label: 'Filter column', class: 'csv__filter-column', variant: 'outlined', layer: 'top', options: [] });
  const value = field('Exact value');
  const apply = button('Apply value filter', () => {
    const column = choice.getValue();
    if (!column) return;
    view().exact = { column, value: value.getValue() }; changed();
  });
  const clear = button('Clear value filter', () => { view().exact = undefined; value.setValue(''); changed(); });
  const summary = element('output'); summary.setAttribute('aria-live', 'polite');
  const list = element('div', 'csv__columns');
  list.setAttribute('role', 'group'); list.setAttribute('aria-label', 'Visible columns');
  root.append(element('h2', 'csv__subhead', 'Filter by value'), choice.element, value.element,
    apply.element, clear.element, summary, element('h2', 'csv__subhead', 'Columns'), list);
  let schema: Document['columns'] | undefined;
  let switches: Array<ReturnType<typeof createSwitch>> = [];
  let syncing = false;
  return {
    element: root,
    sync() {
      const doc = document(), state = view();
      if (schema !== doc.columns) {
        switches.forEach(control => control.destroy());
        schema = doc.columns;
        choice.setOptions(doc.columns.map(column => ({ id: column.id, text: column.label })));
        choice.setValue(doc.columns[0]?.id);
        value.setValue('');
        switches = doc.columns.map(column => {
          const control = createSwitch({ label: column.label, checked: !state.hidden.has(column.id) });
          control.on('change', ({ checked }) => {
            if (syncing) return;
            if (checked) view().hidden.delete(column.id);
            else view().hidden = hideColumn(document(), view(), column.id).hidden;
            changed();
          });
          list.append(control.element);
          return control;
        });
      }
      syncing = true;
      switches.forEach((control, index) => {
        const visible = !state.hidden.has(doc.columns[index].id);
        control.setValue(visible);
        if (visible && state.hidden.size === doc.columns.length - 1) control.disable();
        else control.enable();
      });
      syncing = false;
      if (state.exact) clear.enable(); else clear.disable();
      summary.textContent = state.exact
        ? `${doc.columns.find(column => column.id === state.exact!.column)?.label} equals ${state.exact.value || '(empty)'}`
        : 'All values';
    },
    destroy() { switches.forEach(control => control.destroy()); [choice, value, apply, clear].forEach(control => control.destroy()); root.remove(); },
  };
}
