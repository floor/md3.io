// The button-group card: <m-button-group>.
import 'material/elements/css/button-group';
import { defineButtonGroup } from 'material/elements';
import { define as defineButton } from './button';
import { define as defineIconButton } from './icon-button';
import { glanceLists } from './glance';

export const define = (visual?: Element): void | (() => void) => {
  defineButton();
  defineIconButton();
  defineButtonGroup();
  return glanceLists(visual);
};
