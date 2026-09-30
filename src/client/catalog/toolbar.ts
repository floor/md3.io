// The toolbar card: <m-toolbar>, with <m-icon-button> from that card's module.
import 'mtrl/elements/css/toolbar';
import { defineToolbar } from 'mtrl/elements';
import { define as defineIconButtonCard } from './icon-button';

export const define = (): void => {
  defineIconButtonCard();
  defineToolbar();
};
