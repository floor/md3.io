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
    + '.catalog-tooltips .mtrl-tooltip__arrow{display:none}'
    + '.catalog-tooltips--scene{justify-content:flex-end;align-items:flex-start}.catalog-tooltips__row{display:flex;align-items:flex-start;gap:8px}'
    + '.catalog-tooltips__avatar{border-radius:50%;margin-top:4px;object-fit:cover}',
});

const items = [
  { icon: symbols.playlistAdd, label: 'Add to playlist', text: 'Add to playlist', variant: 'plain' },
  { icon: symbols.settings, label: 'Upload settings', text: 'Photos upload in full quality. Change it any time in Settings.', variant: 'rich' },
] as const;

// The Overview's figures (component-properties.ts): each real tooltip shown in place under or over its target.
type Figure = { variant: 'plain' | 'rich'; text: string; icon: string; label: string; scene?: boolean };
const FIGURES: Record<string, Figure> = {
  'variant-plain': { variant: 'plain', text: 'Add to playlist', icon: symbols.playlistAdd, label: 'Add to playlist' },
  'variant-rich': { variant: 'rich', text: 'Photos upload in full quality. Change it any time in Settings.', icon: symbols.settings, label: 'Upload settings' },
  glance: { variant: 'plain', text: 'Notifications', icon: symbols.notifications, label: 'Notifications', scene: true },
};
const figure = ({ variant, text, icon, label, scene }: Figure) => () => {
  const host = document.createElement('div');
  host.className = scene ? 'catalog-tooltips catalog-tooltips--scene' : 'catalog-tooltips';
  const item = document.createElement('div');
  item.className = 'catalog-tooltips__item';
  const target = createIconButton({ icon, ariaLabel: label, variant: scene ? 'standard' : 'tonal' } as never);
  const tooltip = createTooltip({ text, variant, target: target.element, position: scene ? 'bottom' : 'top', showOnHover: false, showOnFocus: false });
  if (scene) {
    // As M3's figure: the screen's top corner, Settings, Notifications (its tooltip shown) and the account.
    const settings = createIconButton({ icon: symbols.settings, ariaLabel: 'Settings', variant: 'standard' } as never);
    const row = document.createElement('div');
    row.className = 'catalog-tooltips__row';
    const avatar = document.createElement('img');
    Object.assign(avatar, { src: 'https://picsum.photos/id/338/96/96', alt: 'Your account', width: 40, height: 40, className: 'catalog-tooltips__avatar' });
    item.append(target.element, tooltip.element);
    row.append(settings.element, item, avatar);
    host.append(row);
  } else {
    item.append(tooltip.element, target.element);
    host.append(item);
  }
  let active = true;
  const frame = requestAnimationFrame(() => { if (!active) return; tooltip.show?.(); item.insertBefore(tooltip.element, scene ? null : target.element); });
  return { element: host, destroy: () => { active = false; cancelAnimationFrame(frame); tooltip.destroy(); target.destroy(); } };
};

export const define = (): void => {
  for (const [suffix, entry] of Object.entries(FIGURES)) surface(`md3-catalog-tooltip-${suffix}`, ['icon-button', 'tooltip', 'catalog-tooltips'], figure(entry));
  defineCard();
};
const defineCard = (): void => surface('md3-catalog-tooltip', ['icon-button', 'tooltip', 'catalog-tooltips'], () => {
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
