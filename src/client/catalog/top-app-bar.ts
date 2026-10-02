// The top-app-bar card: <m-top-app-bar>, with <m-icon-button> from that card's module.
import 'material/elements/css/top-app-bar';
import { defineTopAppBar } from 'material/elements';
import { define as defineIconButtonCard } from './icon-button';

export const define = (): void => {
  defineIconButtonCard();
  defineTopAppBar();
};
