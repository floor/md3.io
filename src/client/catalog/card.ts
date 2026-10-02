// The Card card: <m-card>, with <m-button> from that card's module.
import 'material/elements/css/card';
import { defineCard } from 'material/elements';
import { define as defineButtonCard } from './button';

export const define = (): void => {
  defineButtonCard();
  defineCard();
};
