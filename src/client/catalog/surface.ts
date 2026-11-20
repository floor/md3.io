// The overlay cards (dialog, menu, snackbar, tooltip, time picker, tabs and
// toolbar) hold a live factory in a shadow root: a trigger inside the card,
// and the real overlay, which opens and closes normally over the page.
import { defineElement, registerStyles, type ElementComponent } from 'material/elements';

registerStyles({
  'catalog-surface': ':host{display:block}*,*::before,*::after{box-sizing:border-box}'
    + ':host .catalog-tooltip{display:flex;flex-direction:column;align-items:center}',
});

/** A live overlay card's element: `create` builds its trigger and component. */
export function surface(tag: string, styles: string[], create: () => ElementComponent): void {
  if (customElements.get(tag)) return;
  customElements.define(tag, defineElement({ name: tag, create, styles: ['catalog-surface', ...styles] }).element);
}

/** A container the overlay's scaffolding stays in, off the page. */
export const detached = () => document.createElement('div');
