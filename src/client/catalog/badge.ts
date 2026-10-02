// The badge card: <m-badge>, with <m-icon-button> from that card's module.
import 'material/elements/css/badge';
import { defineBadge } from 'material/elements';
import { define as defineIconButtonCard } from './icon-button';

export const define = (): void => {
  defineIconButtonCard();
  defineBadge();
};
