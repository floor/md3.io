// The button-group card: <m-button-group>.
import 'material/elements/css/button-group';
import { defineButtonGroup } from 'material/elements';
import { define as defineButton } from './button';
import { define as defineIconButton } from './icon-button';

export const define = (): void => {
  defineButton();
  defineIconButton();
  defineButtonGroup();
};
