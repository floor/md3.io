// The loading indicator's playground content: its registry entry, moved from
// src/shared/components.ts.
import type { LoadingIndicatorConfig } from 'material/components/loading-indicator';
import { type ComponentState, bool, range, section, string, text, toggle } from './types';

export const loadingIndicatorComponent = {
  group: 'Communication', name: 'Loading indicator', factory: 'createLoadingIndicator', variable: 'indicator',
  description: 'Give short waits a little expression. Explore the morphing shape with or without its container.',
  summary: 'An expressive shape for short waits.', styles: ['loading-indicator'],
  scenarios: [],
  controls: [
    ...section('Appearance', [toggle('contained', 'Contained'), { ...range('size', 'Size', '48'), min: 24, max: 240, step: 8 }]),
    ...section('Content', [{ ...range('value', 'Value', '50'), enabledWhen: 'determinate' }, text('ariaLabel', 'Accessible label', 'Loading your content')]),
    ...section('Behavior', [toggle('indeterminate', 'Indeterminate', true)]),
  ],
  config: (state: ComponentState): LoadingIndicatorConfig => ({ size: Number(state.size), contained: bool(state, 'contained'), value: state.indeterminate ? null : Number(state.value) / 100, ariaLabel: string(state, 'ariaLabel').trim() || 'Loading your content' }),
};
