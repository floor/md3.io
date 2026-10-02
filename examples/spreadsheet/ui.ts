import createButton from 'material/components/button';
import createTextField from 'material/components/text-field';

export function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
  return Object.assign(document.createElement(tag), { className, textContent: text });
}
export function button(text: string, action: () => void, primary = false) {
  const control = createButton({ text, size: 'm', variant: primary ? 'filled' : 'outlined' });
  control.on('click', action);
  return control;
}
export function field(label: string) {
  return createTextField({ label, variant: 'outlined' });
}
