// The text-field card: <m-text-field>.
import { define as defineButtonCard } from './button';
import 'material/elements/css/text-field';
import { defineTextField } from 'material/elements';

export const define = (): void => {
  defineButtonCard();
  defineTextField();
};
