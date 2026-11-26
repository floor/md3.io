// The navigation-bar card: <m-navigation-bar>. In a component's At a glance phone, choosing a
// destination shows its list (src/server/component-properties.ts renders one list per destination).
import 'material/elements/css/navigation-bar';
import { defineNavigationBar } from 'material/elements';

export const define = (visual?: Element): void | (() => void) => {
  defineNavigationBar();
  const screen = visual?.querySelector('.property-phone__screen');
  if (!screen) return;
  const show = (event: Event) => {
    const value = (event as CustomEvent<{ value: string }>).detail?.value;
    if (!value) return;
    for (const list of screen.querySelectorAll<HTMLElement>('.property-phone__list')) {
      list.hidden = list.dataset.for !== value;
      if (!list.hidden) list.scrollTop = 0;
    }
  };
  screen.addEventListener('change', show);
  return () => screen.removeEventListener('change', show);
};
