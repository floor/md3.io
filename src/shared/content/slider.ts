// The slider's playground content: its registry entry, moved from
// src/shared/components.ts.
import type { SliderConfig } from 'material/components/slider';
import { symbols } from '../icons';
import { type ComponentState, type Scenario, bool, choose, disabled, pick, range, section, string, text, toggle } from './types';

/**
 * The slider's scenarios, from m3.material.io (read 5 October 2026). Options name
 * playground controls only. Sliders select values along continuous or discrete tracks
 * across call volume, typographic font size scale, price budget ranges, and room climate controls.
 */
const sliderScenarios: readonly Scenario[] = [
  {
    id: 'call-volume', name: 'Call volume', source: 'https://m3.material.io/components/sliders/guidelines',
    description: 'Adjusting incoming call loudness with an inset track speaker icon that mutes at zero.',
    options: { label: 'Call volume', value: '40', size: 'M', insetIcon: true },
  },
  {
    id: 'font-size', name: 'Font size', source: 'https://m3.material.io/components/sliders/guidelines',
    description: 'Selecting readable body font size along discrete typographic scale increments.',
    options: { label: 'Font size', value: '30', ticks: true, step: '10' },
  },
  {
    id: 'price-budget', name: 'Price budget', source: 'https://m3.material.io/components/sliders/guidelines',
    description: 'Defining minimum and maximum spending limits in a search filter.',
    options: { label: 'Price range', variant: 'range', value: '20', secondValue: '80' },
  },
  {
    id: 'living-room-climate', name: 'Living room climate', source: 'https://m3.material.io/components/sliders/guidelines',
    description: 'Setting target thermostat temperature in a dedicated smart home climate screen.',
    options: { label: 'Living Room', size: 'XL', value: '72', showValue: true },
  },
];

export const sliderComponent = {
  group: 'Selection & input', name: 'Slider', factory: 'createSlider', variable: 'slider',
  description: 'Choose a value or a range. Explore track sizes, steps, colors, and value indicators.',
  summary: 'Values and ranges along a track.', styles: ['slider'],
  scenarios: sliderScenarios,
  controls: [
    ...section('Appearance', [choose('size', 'Size', ['XS', 'S', 'M', 'L', 'XL'], 'XS'), choose('orientation', 'Orientation', ['horizontal', 'vertical'], 'horizontal'), choose('color', 'Color', ['primary', 'secondary', 'tertiary', 'error'], 'primary', 'select'), toggle('ticks', 'Tick marks'), toggle('showValue', 'Value indicator', true)]),
    ...section('Content', [text('label', 'Label', 'Volume'), range('value', 'Value', '40'), { ...range('secondValue', 'Range end', '80'), enabledWhen: 'range' }, toggle('insetIcon', 'Inset icon', false, 'insetIconAllowed')]),
    ...section('Behavior', [choose('variant', 'Variant', ['standard', 'centered', 'range'], 'standard'), choose('step', 'Step', ['5', '10'], '10'), disabled]),
  ],
  config: (state: ComponentState): SliderConfig => {
    const label = string(state, 'label');
    const name = string(state, 'name') || label.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'volume';
    return {
      ...(state.variant === 'centered' ? { min: -50, max: 50, value: Number(state.value) - 50, centered: true } : { min: 0, max: 100, value: Number(state.value) }),
      ...(state.variant === 'range' ? { secondValue: Number(state.secondValue) } : {}),
      step: Number(state.step), range: state.variant === 'range',
      ...(state.orientation === 'vertical' ? { orientation: 'vertical' as const } : {}),
      // The guidelines' example: volume, swapping to mute at the minimum.
      ...(state.insetIconAllowed && state.insetIcon ? { insetIcon: symbols.volumeUp, insetIconAtMin: symbols.volumeOff } : {}), size: pick(state, 'size', ['XS', 'S', 'M', 'L', 'XL'], 'XS'), color: pick(state, 'color', ['primary', 'secondary', 'tertiary', 'error'], 'primary'),
      ticks: bool(state, 'ticks'), showValue: bool(state, 'showValue'), label, ariaLabel: label.trim() || 'Volume', disabled: bool(state, 'disabled'), name,
    };
  },
};
