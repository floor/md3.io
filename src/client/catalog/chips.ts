// The chips card: <m-chips>.
import { define as defineButtonCard } from './button';
import 'material/elements/css/chips';
import { defineChips } from 'material/elements';

export const define = (): void => {
  defineButtonCard();
  defineChips();
};
