// The tooltip card: <md3-catalog-tooltip>, the tooltip shown under its icon button, in
// place (surface.ts).
import 'mtrl/elements/css/icon-button';
import 'mtrl/elements/css/tooltip';
import createIconButton from 'mtrl/components/icon-button';
import createTooltip from 'mtrl/components/tooltip';
import { PREFIX } from 'mtrl/core';
import favorite from '../../../icons/favorite.svg' with { type: 'text' };
import { tooltipDefaults } from './defaults';
import { surface } from './surface';

export const define = (): void => surface('md3-catalog-tooltip', ['icon-button', 'tooltip'], () => {
  const host = document.createElement('div');
  host.className = 'catalog-tooltip';
  const target = createIconButton({ icon: favorite.trim(), ariaLabel: 'Favorite', variant: 'tonal' });
  const tooltip = createTooltip({ ...tooltipDefaults, target: target.element, showOnHover: false, showOnFocus: false });
  tooltip.element.classList.add(`${PREFIX}-tooltip--visible`);
  // mtrl sets the arrow's side when it positions a shown tooltip, which this one never
  // is: below its button (position 'bottom'), the arrow is on top, pointing up.
  tooltip.element.querySelector(`.${PREFIX}-tooltip__arrow`)?.classList.add(`${PREFIX}-tooltip__arrow--top`);
  host.append(target.element, tooltip.element);
  return { element: host, destroy: () => { tooltip.destroy(); target.destroy(); } };
});
