// The overlay cards (dialog, menu, snackbar, tooltip, time picker, tabs and
// toolbar) hold a live factory in a shadow root: a trigger inside the card,
// and the real overlay, which opens and closes normally over the page.
import { defineElement, registerStyles, type ElementComponent } from 'material/elements';

registerStyles({
  'catalog-surface': ':host{display:block}*,*::before,*::after{box-sizing:border-box}'
    + ':host .catalog-tooltip{display:flex;flex-direction:column;align-items:center}'
    + '.catalog-picker dialog{position:static;display:block;margin:0;inset:auto;transform:none;max-height:none}'
    + '.catalog-picker>.mtrl-datepicker{display:contents}'
    + '.catalog-picker>*>:not(dialog):not(:has(dialog)){display:none}',
});

/** A live overlay card's element: `create` builds its trigger and component. */
export function surface(tag: string, styles: string[], create: () => ElementComponent): void {
  if (customElements.get(tag)) return;
  customElements.define(tag, defineElement({ name: tag, create, styles: ['catalog-surface', ...styles] }).element);
}

/** A container the overlay's scaffolding stays in, off the page. */
export const detached = () => document.createElement('div');

/** The page's document, except that its body is a spare one: a scroll lock on it locks nothing. */
const spareBody = document.createElement('body');
const unlockableDocument = new Proxy(document, {
  get(target, key) {
    if (key === 'body') return spareBody;
    const value = Reflect.get(target, key, target) as unknown;
    return typeof value === 'function' ? value.bind(target) : value;
  },
});

interface InPlacePicker extends ElementComponent {
  open: () => unknown;
  on: (event: 'open' | 'close', listener: () => void) => unknown;
}

/**
 * A picker shown open in its card, live, instead of over the page: its dialog opens in
 * place rather than in the top layer. It is inert while opening, so it cannot take
 * focus and scroll the page to itself, and the page keeps its scrolling. Cancel, OK or
 * Escape close it, so a fresh one takes its place.
 */
export function inPlace(build: () => InPlacePicker): ElementComponent {
  const element = document.createElement('div');
  element.className = 'catalog-picker';
  let picker: InPlacePicker | undefined;
  let active = true;
  const mount = () => {
    if (!active) return;
    picker?.destroy();
    const next = build();
    picker = next;
    element.inert = true;
    element.replaceChildren(next.element);
    // In place, not in the top layer. The library locks scrolling on the dialog's document,
    // so this one answers with a spare body and the page itself is never locked.
    for (const dialog of next.element.querySelectorAll('dialog')) {
      dialog.showModal = () => dialog.setAttribute('open', '');
      Object.defineProperty(dialog, 'ownerDocument', { value: unlockableDocument });
    }
    const overflow = document.body.style.overflow;
    let settled = false;
    const settle = () => {
      if (settled || picker !== next) return;
      settled = true;
      requestAnimationFrame(() => { if (picker === next) element.inert = false; });
    };
    // The picker also locks its own document just before announcing that it opened.
    next.on('open', () => { document.body.style.overflow = overflow; requestAnimationFrame(settle); });
    next.on('close', () => { if (picker === next && settled) queueMicrotask(mount); });
    next.open();
    setTimeout(settle, 1000);
  };
  // Opened outside the page, a dialog skips showModal but still locks the page's scroll,
  // and a card arriving by client navigation connects later than one in the first load.
  const whenConnected = () => {
    if (!active) return;
    if (element.isConnected) mount();
    else requestAnimationFrame(whenConnected);
  };
  queueMicrotask(whenConnected);
  return { element, destroy: () => { active = false; picker?.destroy(); picker = undefined; } } as ElementComponent;
}
