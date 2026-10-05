// The slider's playground content: its registry entry, moved from
// src/shared/components.ts.
import type { SliderConfig } from 'material/components/slider';
import { symbols } from '../icons';
import { type ComponentState, bool, choose, disabled, pick, range, section, string, text, toggle } from './types';

export const sliderComponent = {
  group: 'Selection & input', name: 'Slider', factory: 'createSlider', variable: 'slider',
  description: 'Choose a value or a range. Explore track sizes, steps, colors, and value indicators.',
  summary: 'Values and ranges along a track.', styles: ['slider'],
  scenarios: [],
  controls: [
    ...section('Appearance', [choose('size', 'Size', ['XS', 'S', 'M', 'L', 'XL'], 'XS'), choose('orientation', 'Orientation', ['horizontal', 'vertical'], 'horizontal'), choose('color', 'Color', ['primary', 'secondary', 'tertiary', 'error'], 'primary', 'select'), toggle('ticks', 'Tick marks'), toggle('showValue', 'Value indicator', true)]),
    ...section('Content', [text('label', 'Label', 'Volume'), range('value', 'Value', '40'), { ...range('secondValue', 'Range end', '80'), enabledWhen: 'range' }, toggle('insetIcon', 'Inset icon', false, 'insetIconAllowed')]),
    ...section('Behavior', [choose('variant', 'Variant', ['standard', 'centered', 'range'], 'standard'), choose('step', 'Step', ['5', '10'], '10'), disabled]),
  ],
  // The three M3 variants. A centred slider runs from -50 to 50 around zero, so the
  // 0-100 value control is shifted onto that range.
  config: (state: ComponentState): SliderConfig => ({
    ...(state.variant === 'centered' ? { min: -50, max: 50, value: Number(state.value) - 50, centered: true } : { min: 0, max: 100, value: Number(state.value) }),
    ...(state.variant === 'range' ? { secondValue: Number(state.secondValue) } : {}),
    step: Number(state.step), range: state.variant === 'range',
    ...(state.orientation === 'vertical' ? { orientation: 'vertical' as const } : {}),
    // The guidelines' example: volume, swapping to mute at the minimum.
    ...(state.insetIconAllowed && state.insetIcon ? { insetIcon: symbols.volumeUp, insetIconAtMin: symbols.volumeOff } : {}), size: pick(state, 'size', ['XS', 'S', 'M', 'L', 'XL'], 'XS'), color: pick(state, 'color', ['primary', 'secondary', 'tertiary', 'error'], 'primary'),
    ticks: bool(state, 'ticks'), showValue: bool(state, 'showValue'), label: string(state, 'label'), ariaLabel: string(state, 'label').trim() || 'Volume', disabled: bool(state, 'disabled'), name: 'volume' }),
};
