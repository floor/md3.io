// The navigation-bar card: <m-navigation-bar>. In a component's At a glance screen, choosing a
// destination shows its list (glance.ts).
import 'material/elements/css/navigation-bar';
import { defineNavigationBar } from 'material/elements';
import { glanceLists } from './glance';

export const define = (visual?: Element): void | (() => void) => {
  defineNavigationBar();
  return glanceLists(visual);
};
