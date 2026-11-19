// The side-sheet card: <m-side-sheet>.
import 'material/elements/css/side-sheet';
import { defineSideSheet } from 'material/elements';
import { define as defineButtonCard } from './button';

export const define = (): void => {
  defineButtonCard();
  defineSideSheet();
};
