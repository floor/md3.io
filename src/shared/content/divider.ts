// The divider's playground content: its registry entry, moved from
// src/shared/components.ts.
import type { DividerConfig } from 'material/components/divider';
import { type ComponentState, choose, pick, range, section, string } from './types';

export const dividerComponent = {
  group: 'Containment', name: 'Divider', factory: 'createDivider', variable: 'divider',
  description: 'Separate related content. Explore orientation, insets, line weight, and color.',
  summary: 'A quiet boundary between sections.', styles: ['divider'],
  scenarios: [],
  controls: [
    ...section('Appearance', [choose('variant', 'Variant', ['full-width', 'inset', 'middle-inset'], 'full-width', 'select'), choose('orientation', 'Orientation', ['horizontal', 'vertical'], 'horizontal'), { ...range('thickness', 'Thickness', '1'), min: 1, max: 8 }, choose('color', 'Color', ['outline-variant', 'outline', 'primary', 'secondary'], 'outline-variant', 'select')]),
    ...section('Layout', [{ ...range('insetStart', 'Start inset', '16'), max: 64 }, { ...range('insetEnd', 'End inset', '16'), max: 64 }]),
  ],
  config: (state: ComponentState): DividerConfig => ({ variant: pick(state, 'variant', ['full-width', 'inset', 'middle-inset'], 'full-width'), orientation: pick(state, 'orientation', ['horizontal', 'vertical'], 'horizontal'), thickness: Number(state.thickness), insetStart: Number(state.insetStart), insetEnd: Number(state.insetEnd), color: `var(--mtrl-sys-color-${string(state, 'color')})` }),
};
