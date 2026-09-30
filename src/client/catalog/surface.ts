// The overlays open in the top layer or as modals, which a card must not do. Their
// cards hold a surface element instead: the same factory, built by mtrl's
// defineElement in a shadow root with the component's own CSS, and shown open in
// place, without showModal(), a popover, a scrim or a focus trap.
import { defineElement, registerStyles, type ElementComponent } from 'mtrl/elements';

// The factories place their surfaces with position: fixed, as overlays; in a card the
// surface is laid out where it stands.
registerStyles({
  'catalog-surface': ':host{display:block}*,*::before,*::after{box-sizing:border-box}'
    + ':host .mtrl-dialog{margin:0;min-width:0;width:320px}'
    + ':host .mtrl-menu,:host .mtrl-snackbar,:host .mtrl-tooltip{position:relative;inset:auto;translate:none}'
    + ':host .mtrl-snackbar{min-width:0}'
    + ':host .mtrl-tooltip{margin-top:4px}'
    + ':host .catalog-tooltip{display:flex;flex-direction:column;align-items:center}'
    + ':host .mtrl-time-picker__dialog{position:static;margin:0}',
});

/** A surface element: `create` builds the factory and shows it open. */
export function surface(tag: string, styles: string[], create: () => ElementComponent): void {
  if (customElements.get(tag)) return;
  customElements.define(tag, defineElement({ name: tag, create, styles: ['catalog-surface', ...styles] }).element);
}

/** A container the overlay's scaffolding stays in, off the page. */
export const detached = () => document.createElement('div');
