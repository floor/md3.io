// The navigation-rail card: <m-navigation-rail>. In a component's At a glance screen, choosing a
// destination shows its list (glance.ts).
import 'material/elements/css/navigation-rail';
import { defineNavigationRail } from 'material/elements';
import { glanceLists } from './glance';

export const define = (visual?: Element): void | (() => void) => {
  defineNavigationRail();
  return glanceLists(visual);
};
