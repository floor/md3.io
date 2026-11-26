// The list card: <m-list>. In the Overview's task list (src/server/component-properties.ts), each
// task's trailing checkbox (material's <m-checkbox>, shown only: the row is the option a person
// chooses, and its selection is what assistive technology reads) follows its selection: checked when done.
import 'material/elements/css/list';
import { defineList } from 'material/elements';
import { checkboxMark } from '../../shared/list-checkbox';
import 'material/elements/css/checkbox';
import { defineCheckbox } from 'material/elements';

const checkboxes = (list: Element & { values?: string[] }): void => {
  const done = new Set(list.values ?? []);
  for (const item of list.querySelectorAll<HTMLElement>('m-list-item[value]')) {
    const icon = checkboxMark(done.has(item.getAttribute('value')!));
    if (item.getAttribute('trailing-icon') !== icon) item.setAttribute('trailing-icon', icon);
  }
};

export const define = (visual?: Element): void | (() => void) => {
  defineList();
  defineCheckbox();
  const list = visual?.querySelector<Element & { values?: string[] }>('.property-tasks m-list');
  if (!list) return;
  const update = () => checkboxes(list);
  list.addEventListener('change', update);
  return () => list.removeEventListener('change', update);
};
