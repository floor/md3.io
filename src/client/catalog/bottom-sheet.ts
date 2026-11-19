// The bottom-sheet card: <m-bottom-sheet>.
import 'material/elements/css/bottom-sheet';
import { defineBottomSheet } from 'material/elements';
import { define as defineButtonCard } from './button';

export const define = (): void => {
  defineButtonCard();
  defineBottomSheet();
};
