// The Card card: <m-card>, with <m-button> from that card's module. In a card's Anatomy figure
// (src/server/component-properties.ts), numbered callouts are placed on the parts it measures.
import 'material/elements/css/card';
import { defineCard } from 'material/elements';
import { define as defineButtonCard } from './button';
import { anatomy } from './anatomy';

export const define = (visual?: Element): void | (() => void) => {
  defineButtonCard();
  defineCard();
  return visual ? anatomy(visual) : undefined;
};
