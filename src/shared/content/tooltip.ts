// The tooltip's playground content: its registry entry, moved from
// src/shared/components.ts.
import type { TooltipConfig } from 'material/components/tooltip';
import { symbols } from '../icons';
import { type ComponentState, type Scenario, bool, choose, range, section, string, text, toggle } from './types';

/** The control a tooltip describes. The default is today's heart icon button. */
export interface TooltipTarget {
  /** Set when the target is a FAB. Omitted, it is an icon button. */
  component?: 'fab';
  icon: string;
  ariaLabel: string;
  variant?: string;
}

/**
 * Which control the tooltip describes. `heart` is the icon button the page has
 * always shown. `upload` is the library's FAB with the add icon. `present` is
 * the icon button with the present-to-all symbol.
 */
export function tooltipTarget(state: ComponentState): TooltipTarget {
  if (state.target === 'upload') return { component: 'fab', icon: symbols.add, ariaLabel: 'Upload' };
  if (state.target === 'present') return { icon: symbols.presentToAll, ariaLabel: 'Present now', variant: 'standard' };
  return { icon: symbols.heart, ariaLabel: 'Favorite', variant: 'tonal' };
}

/**
 * The tooltip's scenarios, from m3.material.io (read 7 October 2026). Both are
 * plain and sit above the control when it is hovered or focused. They leave
 * `visible` off: the element cannot declare open, so the stage does not open
 * them. A rich tooltip is not one of them: the element has a single `text`.
 * Not yet exposed by the element: open.
 * Not yet exposed by the element: subhead.
 * Not yet exposed by the element: supportingText.
 * Not yet exposed by the element: action.
 * The figures' words that have nowhere to go: "Add others", "Share this collection
 * with friends and family. People you add to this album will also be able to add
 * and delete media.", "Learn more"; and "New settings available", "Now you can
 * adjust the uploaded image quality, and upgrade your available storage space.",
 * "Learn more".
 */
const tooltipScenarios: readonly Scenario[] = [
  {
    id: 'upload', name: 'Upload', source: 'https://m3.material.io/components/tooltips/guidelines',
    description: 'Hover or focus the button: Upload.',
    options: { target: 'upload', text: 'Upload', variant: 'plain', position: 'top' },
  },
  {
    id: 'present-now', name: 'Present now', source: 'https://m3.material.io/components/tooltips/guidelines',
    description: 'Hover or focus the button: Present now.',
    options: { target: 'present', text: 'Present now', variant: 'plain', position: 'top' },
  },
];

const targetControl = {
  ...choose('target', 'Target', ['heart', 'upload', 'present'], 'heart', 'select'),
  labels: { heart: 'Favorite', upload: 'Upload', present: 'Present now' },
};

export const tooltipComponent = {
  group: 'Communication', name: 'Tooltip', factory: 'createTooltip', variable: 'tooltip',
  description: 'Add a little context. Hover or focus the action to explore tooltip styles, placement, and timing.',
  summary: 'Extra context on hover or focus.', styles: ['icon-button', 'tooltip'],
  // The upload scenario's target is a FAB. The preview shell's styles are the
  // component's list, not the scenario's, so the sheet is here rather than in
  // `styles` (those are what the default tabs import).
  previewStyles: ['fab'],
  scenarios: tooltipScenarios,
  controls: [
    ...section('Appearance', [choose('variant', 'Variant', ['default', 'plain', 'rich'], 'default'), choose('position', 'Position', ['top', 'right', 'bottom', 'left', 'top-start', 'top-end', 'right-start', 'right-end', 'bottom-start', 'bottom-end', 'left-start', 'left-end'], 'bottom', 'select')]),
    ...section('Content', [targetControl, text('text', 'Text', 'Save to favorites')]),
    ...section('Behavior', [toggle('visible', 'Visible'), toggle('showOnHover', 'Show on hover', true), toggle('showOnFocus', 'Show on focus', true), { ...range('showDelay', 'Show delay (ms)', '300'), max: 1500, step: 100 }, { ...range('hideDelay', 'Hide delay (ms)', '100'), max: 1500, step: 100 }]),
  ],
  config: (state: ComponentState): TooltipConfig => ({ text: string(state, 'text'), variant: string(state, 'variant'), position: string(state, 'position'), visible: bool(state, 'visible'), showDelay: Number(state.showDelay), hideDelay: Number(state.hideDelay), showOnFocus: bool(state, 'showOnFocus'), showOnHover: bool(state, 'showOnHover') }),
};
