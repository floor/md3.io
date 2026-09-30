// The components overview: the cards' visuals are mtrl's elements, rendered by the
// server (src/server/catalog.ts) and defined here, with mtrl's CSS in their shadow
// roots. Loaded on this page only.
//
// The overlays open in the top layer or as modals, which a card must not do. Their
// cards hold a surface element instead: the same factory, built by mtrl's
// defineElement in a shadow root with the component's own CSS, and shown open in
// place, without showModal(), a popover, a scrim or a focus trap.
import 'mtrl/elements/css';
import { defineAll, defineElement, registerStyles, type ElementComponent } from 'mtrl/elements';
import createDialog from 'mtrl/components/dialog';
import createMenu from 'mtrl/components/menu';
import createSnackbar from 'mtrl/components/snackbar';
import createTooltip from 'mtrl/components/tooltip';
import createIconButton from 'mtrl/components/icon-button';
import createTimePicker, { TIME_PICKER_ORIENTATION } from 'mtrl/components/timepicker';
import { components, initialComponentState } from '../shared/components';
import { symbols } from '../shared/icons';
import { PREFIX } from 'mtrl/core';

const defaults = <S extends keyof typeof components>(slug: S) => components[slug].config(initialComponentState(slug)) as ReturnType<typeof components[S]['config']>;

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
function surface(tag: string, styles: string[], create: () => ElementComponent): void {
  if (customElements.get(tag)) return;
  customElements.define(tag, defineElement({ name: tag, create, styles: ['catalog-surface', ...styles] }).element);
}
const detached = () => document.createElement('div');

surface('md3-catalog-dialog', ['progress', 'button', 'divider', 'dialog'], () => {
  // Without `layer: "top"` the dialog is a <div> in an overlay: the overlay stays in
  // a detached container and the dialog comes into the shadow root.
  const dialog = createDialog({ ...defaults('dialog'), container: detached(), open: false });
  dialog.element.classList.add(`${PREFIX}-dialog--visible`);
  return { element: dialog.element, destroy: () => dialog.destroy() };
});
surface('md3-catalog-menu', ['progress', 'button', 'menu'], () => {
  const menu = createMenu({ ...defaults('menu'), opener: document.createElement('button'), container: detached() });
  menu.element.classList.add(`${PREFIX}-menu--visible`);
  return { element: menu.element, destroy: () => menu.destroy() };
});
surface('md3-catalog-snackbar', ['progress', 'button', 'icon-button', 'snackbar'], () => {
  const snackbar = createSnackbar(defaults('snackbar'));
  snackbar.element.classList.add(`${PREFIX}-snackbar--visible`);
  return { element: snackbar.element, destroy: () => snackbar.destroy() };
});
surface('md3-catalog-tooltip', ['icon-button', 'tooltip'], () => {
  const host = document.createElement('div');
  host.className = 'catalog-tooltip';
  const target = createIconButton({ icon: symbols.heart, ariaLabel: 'Favorite', variant: 'tonal' });
  const tooltip = createTooltip({ ...defaults('tooltip'), target: target.element, showOnHover: false, showOnFocus: false });
  tooltip.element.classList.add(`${PREFIX}-tooltip--visible`);
  host.append(target.element, tooltip.element);
  return { element: host, destroy: () => { tooltip.destroy(); target.destroy(); } };
});
surface('md3-catalog-timepicker', ['progress', 'button', 'timepicker'], () => {
  // The picker is only its modal <dialog>: shown open without showModal(), so it is
  // not modal and not in the top layer.
  // Landscape, which fits a card's shape; scaled down to fit it (catalog.css).
  const picker = createTimePicker({ ...defaults('timepicker'), orientation: TIME_PICKER_ORIENTATION.HORIZONTAL });
  const dialog = picker.element.querySelector('dialog');
  dialog?.setAttribute('open', '');
  return { element: picker.element, destroy: () => picker.destroy() };
});

// A property no attribute carries, set before the elements upgrade.
for (const checkbox of document.querySelectorAll<HTMLElement & { indeterminate?: boolean }>('.catalog-visual [data-indeterminate]')) checkbox.indeterminate = true;
defineAll();
