// The checkbox card: <m-checkbox>.
import 'mtrl/elements/css/checkbox';
import { defineCheckbox } from 'mtrl/elements';

export const define = (): void => {
  // A property no attribute carries, set before the elements upgrade.
  for (const checkbox of document.querySelectorAll<HTMLElement & { indeterminate?: boolean }>('.catalog-visual [data-indeterminate]')) checkbox.indeterminate = true;
  defineCheckbox();
};
