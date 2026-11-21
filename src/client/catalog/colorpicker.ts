import { createColorPicker } from 'material-addons';
import { colorSwatches } from '../../shared/content/colorpicker';

export const define = (visual: Element): (() => void) => {
  const control = createColorPicker({
    value: '#6750A4', showArea: false, showHue: false,
    showPreview: false, showInput: false, showPipette: false, swatches: colorSwatches,
  });
  visual.replaceChildren(control.element);
  return () => control.destroy();
};
