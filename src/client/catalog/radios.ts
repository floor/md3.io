// The radios card: <m-radios>.
import { define as defineButtonCard } from './button';
import 'material/elements/css/radios';
import { defineRadios } from 'material/elements';

export const define = (): void => {
  defineButtonCard();
  defineRadios();
};
