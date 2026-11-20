// The tooltip card: the real tooltip on its icon button, on hover and focus.
import 'material/elements/css/icon-button';
import 'material/elements/css/tooltip';
import createIconButton from 'material/components/icon-button';
import createTooltip from 'material/components/tooltip';
import favorite from '../../../icons/favorite.svg' with { type: 'text' };
import { tooltipDefaults } from './defaults';
import { surface } from './surface';

export const define = (): void => surface('md3-catalog-tooltip', ['icon-button', 'tooltip'], () => {
  const host = document.createElement('div');
  host.className = 'catalog-tooltip';
  const target = createIconButton({ icon: favorite.trim(), ariaLabel: 'Favorite', variant: 'tonal' });
  const tooltip = createTooltip({ ...tooltipDefaults, target: target.element });
  host.append(target.element, tooltip.element);
  return { element: host, destroy: () => { tooltip.destroy(); target.destroy(); } };
});
