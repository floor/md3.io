// The bottom-app-bar card: <m-bottom-app-bar>, with <m-icon-button> and <m-fab> from those cards' modules.
import 'material/elements/css/bottom-app-bar';
import { defineBottomAppBar } from 'material/elements';
import { define as defineIconButtonCard } from './icon-button';
import { define as defineFabCard } from './fab';

export const define = (): void => {
  defineIconButtonCard();
  defineFabCard();
  defineBottomAppBar();
};
