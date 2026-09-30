// The badge card: <m-badge>, with <m-icon-button> from that card's module.
import 'mtrl/elements/css/badge';
import { defineBadge } from 'mtrl/elements';
import { define as defineIconButtonCard } from './icon-button';

export const define = (): void => {
  defineIconButtonCard();
  defineBadge();
};
