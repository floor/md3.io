// The Card card: <m-card>, with <m-button> from that card's module.
import 'mtrl/elements/css/card';
import { defineCard } from 'mtrl/elements';
import { define as defineButtonCard } from './button';

export const define = (): void => {
  defineButtonCard();
  defineCard();
};
