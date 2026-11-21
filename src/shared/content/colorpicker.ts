import type { ColorPickerConfig } from 'material-addons';
import { section, string, text, toggle, type ComponentDefinition } from './types';

export const colorSwatches = [
  { color: '#6750A4', label: 'Violet' },
  { color: '#006493', label: 'Ocean' },
  { color: '#316949', label: 'Forest' },
  { color: '#984061', label: 'Rose' },
];

export const colorpickerComponent: ComponentDefinition<ColorPickerConfig> = {
  group: 'Add-ons', name: 'Color picker', factory: 'createColorPicker', variable: 'picker',
  description: 'Pick a color from named swatches or enter a hex value.',
  summary: 'Choose a swatch or fine-tune a color.',
  styles: ['text-field'],
  controls: [
    ...section('Content', [text('color', 'Hex color', '#6750A4')]),
    ...section('Appearance', [toggle('palette', 'Show color area and hue', true), toggle('opacity', 'Show opacity', false)]),
  ],
  scenarios: [
    { id: 'brand-accent', name: 'Brand accent', description: 'Fine-tune an accent color and read its hex value.', options: { color: '#6750A4', palette: true }, source: 'https://github.com/floor/material-addons/tree/v3.2.0#colour-picker' },
    { id: 'chart-palette', name: 'Chart palette', description: 'Choose one of the predefined chart colors.', options: { color: '#006493', palette: false }, source: 'https://github.com/floor/material-addons/tree/v3.2.0#colour-picker' },
  ],
  config: state => ({
    value: /^#[\da-f]{6}$/i.test(string(state, 'color')) ? string(state, 'color') : '#6750A4',
    variant: 'inline',
    inputLabel: 'Hex color',
    showPipette: false,
    showArea: state.palette === true,
    showHue: state.palette === true,
    showOpacity: state.opacity === true,
    swatches: colorSwatches,
  }),
};
