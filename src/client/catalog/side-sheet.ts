// The side-sheet card: <m-side-sheet>.
import 'material/elements/css/side-sheet';
import { defineSideSheet } from 'material/elements';
import { define as defineButtonCard } from './button';
import { define as defineCheckboxCard } from './checkbox';

export const define = (): void => {
  defineButtonCard();
  defineCheckboxCard();
  defineSideSheet();
};
