// The checkbox card: <m-checkbox>.
import 'material/elements/css/checkbox';
import { defineCheckbox } from 'material/elements';

type Box = HTMLElement & { checked?: boolean; indeterminate?: boolean };
// The At a glance group: the parent follows its four children (all, some, none), and sets them all.
const parentOf = (visual: Element): (() => void) | void => {
  const parent = visual.querySelector<Box>('[data-parent]');
  const children = [...visual.querySelectorAll<Box>('[data-child]')];
  if (!parent || !children.length) return;
  const sync = () => {
    const on = children.filter(child => child.checked).length;
    parent.checked = on === children.length;
    parent.indeterminate = on > 0 && on < children.length;
  };
  const onChild = () => sync();
  const onParent = () => { const all = !!parent.checked; for (const child of children) child.checked = all; sync(); };
  for (const child of children) child.addEventListener('change', onChild);
  parent.addEventListener('change', onParent);
  return () => { for (const child of children) child.removeEventListener('change', onChild); parent.removeEventListener('change', onParent); };
};

export const define = (visual?: Element): void | (() => void) => {
  // A property no attribute carries, set before the elements upgrade.
  for (const checkbox of document.querySelectorAll<HTMLElement & { indeterminate?: boolean }>('.catalog-visual [data-indeterminate]')) checkbox.indeterminate = true;
  defineCheckbox();
  return visual ? parentOf(visual) : undefined;
};
