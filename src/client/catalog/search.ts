// The search card: <m-search>. In the Overview's Search view section (component-properties.ts), each
// figure shows its view open, as a copy in the page: material opens a real view in the top layer, with a
// scrim over the page, so two could not sit side by side, and both would float over the page as it
// scrolls. The copy is built from the search's own view (its header and suggestions), hidden from
// assistive technology; its bar stays live, and pressing the copy opens the real view over it.
import 'material/elements/css/search';
import { defineSearch } from 'material/elements';
import { symbols } from '../../shared/icons';

const shownOpen = (): (() => void) | void => {
  // Every figure on the page, once: the module is defined from the page's first search box.
  const searches = [...document.querySelectorAll<HTMLElement>('m-search[data-shown-open]:not([data-shown])')];
  if (!searches.length) return;
  const cleanups: (() => void)[] = [];
  for (const search of searches) {
    const root = search.shadowRoot ?? search;
    const surface = root.querySelector<HTMLDialogElement>('dialog');
    if (!surface) continue;
    search.setAttribute('data-shown', '');
    const copy = document.createElement('div');
    copy.className = `${surface.className} catalog-search__shown`;
    copy.setAttribute('aria-hidden', 'true');
    copy.innerHTML = surface.innerHTML;
    for (const node of copy.querySelectorAll('[id]')) node.removeAttribute('id');
    // Open, the view's header leads with a back arrow, as the live view does.
    const lead = copy.querySelector<HTMLElement>('[class*="leading"] svg, button svg');
    if (lead) lead.outerHTML = symbols.arrowBack;
    for (const node of copy.querySelectorAll<HTMLElement>('input, button, [tabindex]')) node.setAttribute('tabindex', '-1');
    const open = (event: Event) => { event.preventDefault(); root.querySelector<HTMLInputElement>('input')?.focus(); };
    copy.addEventListener('pointerdown', open);
    // Inside the search's own tree, where its styles apply, in a box with its classes in the view state.
    const bar = surface.closest<HTMLElement>('[class*="mtrl-search "], .mtrl-search') ?? surface.parentElement!;
    const box = document.createElement('div');
    box.className = `${bar.className.replace(/mtrl-search--bar/g, '')} mtrl-search--view catalog-search__box`;
    box.append(copy);
    // Over the bar, as the open view takes its place; the live bar stays under it, for the press.
    box.style.cssText = 'position:absolute;inset:0 0 auto 0;z-index:1';
    bar.after(box);
    copy.style.cssText = 'position:static;display:flex;flex-direction:column;inset:auto;margin:0;transform:none;opacity:1;visibility:visible;width:100%;max-height:none';
    cleanups.push(() => { copy.removeEventListener('pointerdown', open); box.remove(); });
  }
  return () => { for (const cleanup of cleanups) cleanup(); };
};

export const define = (): void | (() => void) => {
  defineSearch();
  // Once the searches have built their views.
  let cleanup: (() => void) | void;
  let active = true;
  void customElements.whenDefined('m-search').then(() => requestAnimationFrame(() => requestAnimationFrame(() => { if (active) cleanup = shownOpen(); })));
  return () => { active = false; cleanup?.(); };
};
