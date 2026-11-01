// The badge's playground content: its registry entry, moved from
// src/shared/components.ts.
import type { BadgeConfig } from 'material/components/badge';
import { type ComponentState, type Scenario, bool, choose, section, string, text, toggle } from './types';

/**
 * The badge's scenarios, on the inbox icon button the page already draws.
 * Figures from https://m3.material.io/components/badges/guidelines, read
 * 9 October 2026 (content build 2026-09-23_06-10-05, page
 * e18a73ff-b00d-46e7-af20-ab9dd24bf579). Color stays error and position stays
 * top-right: that page says to keep the default color and the upper trailing
 * corner. A number past Maximum is shown as that maximum plus a +, so 1250 at
 * 999 reads 999+. Ten unread leaves Maximum at 99, the page default, because
 * 10 reads the same there. The same badges are already in place on the drawer's Files
 * row and on the navigation bar's rows. Options name playground controls only.
 */
const badgeScenarios: readonly Scenario[] = [
  {
    id: 'packed-inbox', name: 'Packed inbox', source: 'https://m3.material.io/components/badges/guidelines',
    description: 'An inbox with more mail than the badge can spell out, so the count stops at 999+. The same count is on Photos in the Files drawer and on Mail in the navigation bar.',
    options: { variant: 'large', label: '1250', max: '999' },
  },
  {
    id: 'ten-unread', name: 'Ten unread', source: 'https://m3.material.io/components/badges/guidelines',
    description: 'Ten new messages, a count the badge can still show. The same count is on Music and on Chat in the navigation bar.',
    options: { variant: 'large', label: '10' },
  },
  {
    id: 'new-mail', name: 'New mail', source: 'https://m3.material.io/components/badges/guidelines',
    description: 'New mail, before there is a number to show, so the badge is only a dot. The same dot is on Music and on Rooms in the navigation bar.',
    options: { variant: 'small' },
  },
];

export const badgeComponent = {
  group: 'Communication', name: 'Badge', factory: 'createBadge', variable: 'badge',
  description: 'Draw attention to something new. Try dots, counts, and labels attached to an action.',
  summary: 'A small signal for updates and counts.', styles: ['icon-button', 'badge'],
  scenarios: badgeScenarios,
  controls: [
    ...section('Appearance', [choose('variant', 'Variant', ['small', 'large'], 'large'), choose('color', 'Color', ['error', 'primary', 'secondary', 'tertiary', 'success', 'warning', 'info'], 'error', 'select'), choose('position', 'Position', ['top-right', 'top-left', 'bottom-right', 'bottom-left'], 'top-right', 'select')]),
    ...section('Content', [{ ...text('label', 'Label', '8'), enabledWhen: 'hasLabel' }, { ...choose('max', 'Maximum count', ['9', '99', '999'], '99'), enabledWhen: 'hasLabel' }]),
    ...section('Behavior', [toggle('visible', 'Visible', true)]),
  ],
  config: (state: ComponentState): BadgeConfig => ({ variant: string(state, 'variant'), color: string(state, 'color'), position: string(state, 'position'), label: string(state, 'label'), max: Number(state.max), visible: bool(state, 'visible') }),
};
