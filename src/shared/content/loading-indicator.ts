// The loading indicator's playground content: its registry entry, moved from
// src/shared/components.ts.
import type { LoadingIndicatorConfig } from 'material/components/loading-indicator';
import { type ComponentState, type Scenario, bool, range, section, string, text, toggle } from './types';

/**
 * The loading indicator's scenarios. The page draws the indicator by itself.
 * Figures from https://m3.material.io/components/loading-indicator/guidelines,
 * read 9 October 2026 (content build 2026-09-23_06-10-05, page
 * eb6cf431-55ab-4d41-b3c5-cf4da1bae66f).
 *
 * Indeterminate stays on, the page default. Value stays at 50 because that
 * control is off while the indicator is indeterminate. The page says not to
 * turn a loading indicator into a progress indicator, and no figure prints a
 * percent.
 *
 * Getting ready is the contained indicator above "Getting your device ready...".
 * Size stays at 48. Loading photos is the bare indicator, centered on an empty
 * Photos page and again under the grid: contained stays off and size stays at
 * 48, because those frames show the page default. The page cannot show either
 * placement. Loading the page is the morphing icon in the Material.io tab.
 * The tab does not print a size. Size is 24, the minimum the size figure
 * labels, because 48 is the Photos indicator and not this one.
 */
const loadingIndicatorScenarios: readonly Scenario[] = [
  {
    id: 'getting-ready', name: 'Getting ready', source: 'https://m3.material.io/components/loading-indicator/guidelines',
    description: 'The device is still getting ready, so the indicator sits in a circle where it has to stand out. This page draws that indicator by itself.',
    options: { contained: true, ariaLabel: 'Getting your device ready' },
  },
  {
    id: 'loading-photos', name: 'Loading photos', source: 'https://m3.material.io/components/loading-indicator/guidelines',
    description: 'Photos are still on the way, and the indicator waits on the open surface. This page draws that indicator by itself.',
    options: { ariaLabel: 'Loading photos' },
  },
  {
    id: 'loading-the-page', name: 'Loading the page', source: 'https://m3.material.io/components/loading-indicator/guidelines',
    description: 'A page is loading in a tight spot, so the indicator stays small. This page draws that indicator by itself.',
    options: { size: '24', ariaLabel: 'Loading page' },
  },
];

export const loadingIndicatorComponent = {
  group: 'Communication', name: 'Loading indicator', factory: 'createLoadingIndicator', variable: 'indicator',
  description: 'Give short waits a little expression. Explore the morphing shape with or without its container.',
  summary: 'An expressive shape for short waits.', styles: ['loading-indicator'],
  scenarios: loadingIndicatorScenarios,
  controls: [
    ...section('Appearance', [toggle('contained', 'Contained'), { ...range('size', 'Size', '48'), min: 24, max: 240, step: 8 }]),
    ...section('Content', [{ ...range('value', 'Value', '50'), enabledWhen: 'determinate' }, text('ariaLabel', 'Accessible label', 'Loading your content')]),
    ...section('Behavior', [toggle('indeterminate', 'Indeterminate', true)]),
  ],
  config: (state: ComponentState): LoadingIndicatorConfig => ({ size: Number(state.size), contained: bool(state, 'contained'), value: state.indeterminate ? null : Number(state.value) / 100, ariaLabel: string(state, 'ariaLabel').trim() || 'Loading your content' }),
};
