// The select card: <m-select>.
import { define as defineButtonCard } from './button';
import 'material/elements/css/select';
import { defineSelect } from 'material/elements';

export const define = (): void => {
  defineButtonCard();
  defineSelect();
};
