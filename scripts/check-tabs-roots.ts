// Component roots use the installed Material CSS names, independently of site slugs.
import { addonSlugs } from '../src/shared/addons';

const ROOT_NAMES = new Set([
  ...addonSlugs,
  'badge',
  'bottom-app-bar',
  'bottom-sheet',
  'button',
  'button-group',
  'card',
  'carousel',
  'checkbox',
  'chip',
  'chips',
  'datepicker',
  'dialog',
  'divider',
  'drawer',
  'extended-fab',
  'fab',
  'fab-menu',
  'icon-button',
  'list',
  'loading-indicator',
  'menu',
  'navigation-bar',
  'navigation-rail',
  'progress',
  'radio',
  'radios',
  'search',
  'select',
  'side-sheet',
  'slider',
  'snackbar',
  'split-button',
  'switch',
  'tab',
  'tabs',
  'text-field',
  // material's time picker root is mtrl-time-picker (its slug here is timepicker).
  'time-picker',
  'toolbar',
  'tooltip',
  'top-app-bar',
]);

export function isRootClass(className: string): boolean {
  if (!className.startsWith('mtrl-')) return false;
  if (className.includes('--') || className.includes('__')) return false;
  const name = className.slice(5);
  return ROOT_NAMES.has(name);
}

export function componentRootClass(slug: string): string {
  const name = slug === 'app-bar' ? 'top-app-bar' : slug === 'navigation-drawer' ? 'drawer' : slug === 'timepicker' ? 'time-picker' : slug;
  return `mtrl-${name}`;
}

/** Require the selected component itself, not just its nested buttons, to render a
 * recognized root. Call with all DOM classes so intentionally hidden overlays
 * still count; visible root/text parity remains a separate check. */
export function assertComponentRoot(slug: string, classes: readonly string[], context: string): void {
  const required = componentRootClass(slug);
  if (!isRootClass(required)) throw new Error(`${context}: root check is not registered for ${slug} (${required})`);
  const roots = classes.filter(isRootClass);
  if (!roots.includes(required)) throw new Error(`${context}: no ${required} root; found [${roots.join(', ')}]`);
}
