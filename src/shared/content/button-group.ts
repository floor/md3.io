// The button group's playground content: its items and its registry entry, moved from
// src/shared/components.ts.
import type { ButtonGroupConfig } from 'material/components/button-group';
import { sizes, variants } from '../button';
import { type ComponentState, bool, choose, disabled, iconByName, pick, section, shape, size, square, toggle } from './types';

const groupItems = [{ value: 'bold', text: 'Bold' }, { value: 'italic', text: 'Italic' }, { value: 'underline', text: 'Underline' }];
export const buttonGroupComponent = {
  group: 'Actions', name: 'Button group', factory: 'createButtonGroup', variable: 'buttonGroup',
  description: 'Bring related actions together. Explore connected shapes and single or multiple selection.',
  summary: 'Related actions. Shared shapes. Flexible selection.',
  styles: ['progress', 'button', 'icon-button', 'button-group'],
  scenarios: [],
  controls: [
    ...section('Appearance', [choose('kind', 'Kind', ['standard', 'connected'], 'connected'), choose('variant', 'Variant', variants, 'filled', 'select'), size, square]),
    ...section('Layout', [choose('orientation', 'Orientation', ['horizontal', 'vertical'], 'horizontal'),
      choose('density', 'Density', ['default', 'comfortable', 'compact'], 'default', 'select'), toggle('equalWidth', 'Equal widths')]),
    ...section('Content', [choose('content', 'Content', ['text', 'icons', 'both'], 'text'), choose('labels', 'Labels', ['always', 'selected'], 'always')]),
    ...section('Behavior', [choose('selection', 'Selection', ['none', 'single', 'multi'], 'none'), toggle('required', 'Require a selection'), disabled]),
  ],
  config: (state: ComponentState): ButtonGroupConfig => ({
    kind: pick(state, 'kind', ['standard', 'connected'], 'standard'), selection: pick(state, 'selection', ['none', 'single', 'multi'], 'none'),
    variant: pick(state, 'variant', variants, 'outlined'), size: pick(state, 'size', sizes, 's'), shape: shape(state),
    orientation: pick(state, 'orientation', ['horizontal', 'vertical'], 'horizontal'), density: pick(state, 'density', ['default', 'comfortable', 'compact'], 'default'),
    labels: pick(state, 'labels', ['always', 'selected'], 'always'), required: bool(state, 'required'), equalWidth: bool(state, 'equalWidth'), disabled: bool(state, 'disabled'),
    ariaLabel: 'Text formatting',
    buttons: groupItems.map(item => ({ value: item.value, ariaLabel: item.text,
      ...(state.content !== 'icons' ? { text: item.text } : {}), ...(state.content !== 'text' ? { icon: iconByName(item.value) } : {}),
    })),
  }),
};
