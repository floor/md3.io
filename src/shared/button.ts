export const variants = ['filled', 'tonal', 'outlined', 'elevated', 'text'] as const;
export const sizes = ['xs', 's', 'm', 'l', 'xl'] as const;
// Baseline, then the M3 scheme variants generated from its seed, then material's own themes.
export const themes = ['baseline', 'neutral', 'vibrant', 'expressive', 'fidelity', 'content', 'monochrome', 'rainbow', 'fruit-salad', 'ocean', 'forest', 'spring', 'sunset', 'autumn', 'desert', 'summer', 'brownbeige', 'sageivory', 'tealcaramel', 'highcontrast'] as const;
import { symbols } from './icons';
export const icons = {
  none: '',
  download: symbols.download,
  bookmark: symbols.bookmark,
  send: symbols.send,
  heart: symbols.heart,
};
export interface ButtonState {
  variant: typeof variants[number];
  size: typeof sizes[number];
  shape: 'round' | 'square';
  text: string;
  icon: keyof typeof icons;
  disabled: boolean;
  toggle: boolean;
  selected: boolean;
  theme: typeof themes[number];
  mode: 'light' | 'dark';
}
export const defaults: ButtonState = { variant: 'filled', size: 's', shape: 'round', text: 'Button', icon: 'none', disabled: false, toggle: false, selected: false, theme: 'baseline', mode: 'light' };
export function normalizeState(value: unknown): ButtonState {
  const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const toggle = raw.toggle === true;
  return {
    variant: variants.find(v => v === raw.variant) ?? defaults.variant,
    size: sizes.find(v => v === raw.size) ?? defaults.size,
    shape: raw.shape === 'square' ? 'square' : 'round',
    text: typeof raw.text === 'string' ? raw.text.slice(0, 80) : defaults.text,
    icon: Object.keys(icons).find(v => v === raw.icon) as keyof typeof icons || 'none',
    disabled: raw.disabled === true,
    toggle,
    // Selected is the toggle's state. A button that is not a toggle is not selected.
    selected: toggle && raw.selected === true,
    theme: themes.find(v => v === raw.theme) ?? defaults.theme,
    mode: raw.mode === 'dark' ? 'dark' : 'light',
  };
}
export function buttonConfig(state: ButtonState) {
  return { text: state.text, variant: state.variant, size: state.size, shape: state.shape, disabled: state.disabled,
    ...(icons[state.icon] ? { icon: icons[state.icon] } : {}),
    ...(!state.text.trim() ? { ariaLabel: state.icon === 'none' ? 'Button' : state.icon } : {}),
    ...(state.toggle ? { toggle: true, selected: state.selected } : {}),
  };
}
