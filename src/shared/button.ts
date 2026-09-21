export const variants = ['filled', 'tonal', 'outlined', 'elevated', 'text'] as const;
export const sizes = ['xs', 's', 'm', 'l', 'xl'] as const;
export const themes = ['baseline', 'ocean', 'forest', 'desert', 'sunset', 'spring', 'summer', 'autumn', 'winter', 'brownbeige', 'browngreen', 'sageivory', 'tealcaramel', 'material', 'legacy', 'highcontrast'] as const;
const svg = (path: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
export const icons = {
  none: '',
  download: svg('<path d="M12 3v12m-5-5 5 5 5-5M5 16v4h14v-4"/>'),
  bookmark: svg('<path d="M6 3h12v18l-6-4-6 4z"/>'),
  send: svg('<path d="m22 2-7 20-4-9L2 9ZM22 2 11 13"/>'),
  heart: svg('<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>'),
};
export interface ButtonState {
  variant: typeof variants[number];
  size: typeof sizes[number];
  shape: 'round' | 'square';
  text: string;
  icon: keyof typeof icons;
  disabled: boolean;
  theme: typeof themes[number];
  mode: 'light' | 'dark';
}
export const defaults: ButtonState = { variant: 'filled', size: 's', shape: 'round', text: 'Button', icon: 'none', disabled: false, theme: 'baseline', mode: 'light' };
export function normalizeState(value: unknown): ButtonState {
  const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    variant: variants.find(v => v === raw.variant) ?? defaults.variant,
    size: sizes.find(v => v === raw.size) ?? defaults.size,
    shape: raw.shape === 'square' ? 'square' : 'round',
    text: typeof raw.text === 'string' ? raw.text.slice(0, 80) : defaults.text,
    icon: Object.keys(icons).find(v => v === raw.icon) as keyof typeof icons || 'none',
    disabled: raw.disabled === true,
    theme: themes.find(v => v === raw.theme) ?? defaults.theme,
    mode: raw.mode === 'dark' ? 'dark' : 'light',
  };
}
export function buttonConfig(state: ButtonState) {
  return { text: state.text, variant: state.variant, size: state.size, shape: state.shape, disabled: state.disabled,
    ...(icons[state.icon] ? { icon: icons[state.icon] } : {}),
    ...(!state.text.trim() ? { ariaLabel: state.icon === 'none' ? 'Button' : state.icon } : {}),
  };
}
