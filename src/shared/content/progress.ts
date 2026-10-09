// The progress indicator's playground content: its registry entry, moved from
// src/shared/components.ts.
import type { ProgressConfig } from 'material/components/progress';
import { type ComponentState, type Scenario, bool, choose, disabled, pick, range, section, string, text, toggle } from './types';

/**
 * The progress indicator's scenarios. The page draws the indicator by itself.
 * Figures from https://m3.material.io/components/progress-indicators/guidelines,
 * read 9 October 2026 (content build 2026-09-23_06-10-05, page
 * 9a92bb46-ccc8-4752-a144-b770d47fe1dd).
 *
 * Loading episodes is the indeterminate bar labeled "Loading my episodes".
 * Variant stays linear and shape stays flat. Value is unset because that
 * control is off while the bar is indeterminate, and no frame prints a
 * percent. Buffer stays at 70: the indeterminate bar does not draw it.
 *
 * Loading the article leaves Value at 45, the page default, because the fill
 * moves through the videos and no frame prints a percent. Buffer is 0 because
 * the default 70 draws a buffer band those figures do not have. The stop
 * indicator stays on: the figures end the bar with a dot.
 *
 * Copying files is the only printed amount. 76.8 GB of 128 GB is 60, so Value
 * is 60. Buffer is 0 for the same reason, and the stop indicator stays on.
 *
 * More photos is the wavy circle. Circular size stays at 48. Download is the
 * flat circle that replaces the Download label: shape stays flat, and size
 * stays at 48, because the figure does not print a size. Removing the track
 * and matching the indicator color to the button label are gaps.
 */
const progressScenarios: readonly Scenario[] = [
  {
    id: 'loading-episodes', name: 'Loading episodes', source: 'https://m3.material.io/components/progress-indicators/guidelines',
    description: 'My episodes are still loading, and there is no amount to show yet, so the bar slides along its track. This page draws that bar by itself.',
    options: { indeterminate: true, ariaLabel: 'Loading my episodes' },
  },
  {
    id: 'loading-article', name: 'Loading the article', source: 'https://m3.material.io/components/progress-indicators/guidelines',
    description: 'A news article is opening, and the bar shows how far it has come. This page draws that bar by itself.',
    options: { ariaLabel: 'Loading news article', buffer: '0' },
  },
  {
    id: 'copying-files', name: 'Copying files', source: 'https://m3.material.io/components/progress-indicators/guidelines',
    description: 'Files are copying, 76.8 GB of 128 GB, so the bar is past halfway and ends in a stop. This page draws that bar by itself.',
    options: { value: '60', buffer: '0', ariaLabel: 'Copying files' },
  },
  {
    id: 'more-photos', name: 'More photos', source: 'https://m3.material.io/components/progress-indicators/guidelines',
    description: 'More photos are on the way, and a wavy circle waits where they will appear. This page draws that circle by itself.',
    options: { variant: 'circular', shape: 'wavy', indeterminate: true, ariaLabel: 'Loading photos' },
  },
  {
    id: 'download', name: 'Download', source: 'https://m3.material.io/components/progress-indicators/guidelines',
    description: 'Downloading an episode is a short wait, so a flat circle stands in for the Download label. This page draws that circle by itself.',
    options: { variant: 'circular', indeterminate: true, ariaLabel: 'Downloading episode' },
  },
];

export const progressComponent = {
  group: 'Communication', name: 'Progress', factory: 'createProgress', variable: 'progress',
  description: 'Show how a task is progressing. Compare linear and circular indicators, with flat or wavy shapes.',
  summary: 'Linear and circular progress, flat or wavy.', styles: ['progress'],
  scenarios: progressScenarios,
  controls: [
    ...section('Appearance', [choose('variant', 'Variant', ['linear', 'circular'], 'linear'), choose('shape', 'Shape', ['flat', 'wavy'], 'flat'), choose('thickness', 'Thickness', ['thin', 'thick'], 'thin'), { ...range('size', 'Circular size', '48'), min: 24, max: 240, step: 8, enabledWhen: 'circular' }, toggle('showStopIndicator', 'Stop indicator', true, 'linear')]),
    ...section('Content', [{ ...range('value', 'Value', '45'), enabledWhen: 'determinate' }, { ...range('buffer', 'Buffer', '70'), enabledWhen: 'linearDeterminate' }, toggle('showLabel', 'Show percentage', false, 'determinate'), text('ariaLabel', 'Accessible label', 'Uploading files')]),
    ...section('Behavior', [toggle('indeterminate', 'Indeterminate'), disabled]),
  ],
  config: (state: ComponentState): ProgressConfig => ({ variant: pick(state, 'variant', ['linear', 'circular'], 'linear'), shape: pick(state, 'shape', ['flat', 'wavy'], 'flat'), thickness: pick(state, 'thickness', ['thin', 'thick'], 'thin'), ...(state.variant === 'circular' ? { size: Number(state.size) } : {}), value: Number(state.value), max: 100, buffer: state.variant === 'linear' ? Number(state.buffer) : 0, showStopIndicator: bool(state, 'showStopIndicator'), showLabel: !state.indeterminate && bool(state, 'showLabel'), indeterminate: bool(state, 'indeterminate'), disabled: bool(state, 'disabled'), ariaLabel: string(state, 'ariaLabel').trim() || 'Uploading files' }),
};
