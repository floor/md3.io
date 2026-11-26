// A component's At a glance screen (src/server/component-properties.ts): one list per destination,
// the current one shown. Choosing a destination in the bar, rail or drawer (its `change` event,
// with `{ value }`) shows that destination's list, back at the top.
export function glanceLists(visual?: Element): void | (() => void) {
  const screen = visual?.querySelector('.property-phone__screen, .property-scene--lists');
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
}
