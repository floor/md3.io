// The tooltip card: the real plain and rich tooltips, shown in the card above the icon
// buttons they describe.
import 'material/elements/css/icon-button';
import 'material/elements/css/tooltip';
import { registerStyles } from 'material/elements';
import createIconButton from 'material/components/icon-button';
import createTooltip from 'material/components/tooltip';
import { symbols } from '../../shared/icons';
import { surface } from './surface';

// Shown, material puts a tooltip on <body>, fixed beside its target. Here each stays in the
// card, in the flow above its button, without the arrow.
registerStyles({
  'catalog-tooltips': '.catalog-tooltips{display:flex;align-items:flex-end;justify-content:center;gap:28px}'
    + '.catalog-tooltips__item{display:flex;flex-direction:column;align-items:center;gap:8px}'
    + '.catalog-tooltips .mtrl-tooltip{position:relative!important;inset:auto!important;transform:none!important;translate:none!important;margin:0!important;opacity:1!important;visibility:visible!important;pointer-events:auto}'
    + '.catalog-tooltips .mtrl-tooltip--plain{white-space:nowrap;max-width:none}'
    + '.catalog-tooltips .mtrl-tooltip--rich{width:200px;max-width:200px}'
    + '.catalog-tooltips .mtrl-tooltip__arrow{display:none}',
});

const items = [
  { icon: symbols.playlistAdd, label: 'Add to playlist', text: 'Add to playlist', variant: 'plain' },
  { icon: symbols.settings, label: 'Upload settings', text: 'Photos upload in full quality. Change it any time in Settings.', variant: 'rich' },
] as const;

export const define = (): void => surface('md3-catalog-tooltip', ['icon-button', 'tooltip', 'catalog-tooltips'], () => {
  const host = document.createElement('div');
  host.className = 'catalog-tooltips';
  const parts = items.map(({ icon, label, text, variant }) => {
    const item = document.createElement('div');
    item.className = 'catalog-tooltips__item';
    const target = createIconButton({ icon, ariaLabel: label, variant: 'tonal' });
    const tooltip = createTooltip({ text, variant, target: target.element, position: 'top', showOnHover: false, showOnFocus: false });
    item.append(tooltip.element, target.element);
    host.append(item);
    return { tooltip, target };
  });
  // Once in the page: shown at once, and kept in the card.
  // Cancelled if the card goes first: a tooltip shown after its destroy would leave its
  // window listeners behind.
  const frame = requestAnimationFrame(() => {
    for (const { tooltip } of parts) {
      tooltip.show(true);
      tooltip.element.style.cssText = '';
    }
  });
  return { element: host, destroy: () => { cancelAnimationFrame(frame); for (const { tooltip, target } of parts) { tooltip.destroy(); target.destroy(); } } };
});
