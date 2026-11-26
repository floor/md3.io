// The divider card: <m-divider>.
import { define as defineIconButtonCard } from './icon-button';
import 'material/elements/css/divider';
import { defineDivider } from 'material/elements';

export const define = (): void => {
  defineIconButtonCard();
  defineDivider();
};
