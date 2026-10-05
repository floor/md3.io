// The progress indicator's playground content: its registry entry, moved from
// src/shared/components.ts.
import type { ProgressConfig } from 'material/components/progress';
import { type ComponentState, bool, choose, disabled, pick, range, section, string, text, toggle } from './types';

export const progressComponent = {
  group: 'Communication', name: 'Progress', factory: 'createProgress', variable: 'progress',
  description: 'Show how a task is progressing. Compare linear and circular indicators, with flat or wavy shapes.',
  summary: 'Linear and circular progress, flat or wavy.', styles: ['progress'],
  scenarios: [],
  controls: [
    ...section('Appearance', [choose('variant', 'Variant', ['linear', 'circular'], 'linear'), choose('shape', 'Shape', ['flat', 'wavy'], 'flat'), choose('thickness', 'Thickness', ['thin', 'thick'], 'thin'), { ...range('size', 'Circular size', '48'), min: 24, max: 240, step: 8, enabledWhen: 'circular' }, toggle('showStopIndicator', 'Stop indicator', true, 'linear')]),
    ...section('Content', [{ ...range('value', 'Value', '45'), enabledWhen: 'determinate' }, { ...range('buffer', 'Buffer', '70'), enabledWhen: 'linearDeterminate' }, toggle('showLabel', 'Show percentage', false, 'determinate'), text('ariaLabel', 'Accessible label', 'Uploading files')]),
    ...section('Behavior', [toggle('indeterminate', 'Indeterminate'), disabled]),
  ],
  config: (state: ComponentState): ProgressConfig => ({ variant: pick(state, 'variant', ['linear', 'circular'], 'linear'), shape: pick(state, 'shape', ['flat', 'wavy'], 'flat'), thickness: pick(state, 'thickness', ['thin', 'thick'], 'thin'), ...(state.variant === 'circular' ? { size: Number(state.size) } : {}), value: Number(state.value), max: 100, buffer: state.variant === 'linear' ? Number(state.buffer) : 0, showStopIndicator: bool(state, 'showStopIndicator'), showLabel: !state.indeterminate && bool(state, 'showLabel'), indeterminate: bool(state, 'indeterminate'), disabled: bool(state, 'disabled'), ariaLabel: string(state, 'ariaLabel').trim() || 'Uploading files' }),
};
