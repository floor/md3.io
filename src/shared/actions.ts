import type { IconButtonConfig } from 'mtrl/components/icon-button';
import type { ButtonGroupConfig } from 'mtrl/components/button-group';
import type { SplitButtonConfig } from 'mtrl/components/split-button';
import type { FabConfig } from 'mtrl/components/fab';
import type { ExtendedFabConfig } from 'mtrl/components/extended-fab';
import { buttonConfig, icons as buttonIcons, normalizeState, sizes, themes, variants } from './button';

const svg = (path: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
export const actionIcons: Record<string, string> = {
  ...buttonIcons,
  add: svg('<path d="M12 5v14M5 12h14"/>'),
  edit: svg('<path d="m16 3 5 5-12 12-6 1 1-6ZM14 5l5 5"/>'),
  bold: svg('<path d="M7 4h6a4 4 0 0 1 0 8H7V4Zm0 8h7a4 4 0 0 1 0 8H7v-8Z"/>'),
  italic: svg('<path d="M10 4h10M4 20h10M15 4 9 20"/>'),
  underline: svg('<path d="M6 3v7a6 6 0 0 0 12 0V3M4 21h16"/>'),
};
export type ActionState = Record<string, string | boolean>;
export interface Control {
  section?: 'Appearance' | 'Layout' | 'Content' | 'Behavior';
  key: string;
  label: string;
  kind: 'choice' | 'icons' | 'select' | 'toggle' | 'text';
  initial: string | boolean;
  options?: readonly string[];
  labels?: Record<string, string>;
  enabledWhen?: string;
}
const section = (title: NonNullable<Control['section']>, controls: Control[]): Control[] => controls.map(control => ({ ...control, section: title }));
const choose = (key: string, label: string, options: readonly string[], initial: string, kind: 'choice' | 'select' | 'icons' = 'choice'): Control => ({ key, label, options, initial, kind });
const toggle = (key: string, label: string, initial = false, enabledWhen?: string): Control => ({ key, label, initial, kind: 'toggle', enabledWhen });
const text = (key: string, label: string, initial: string): Control => ({ key, label, initial, kind: 'text' });
const size = choose('size', 'Size', sizes, 's');
const square = toggle('square', 'Square shape');
const disabled = toggle('disabled', 'Disabled');
const icon = (options: readonly string[], initial: string) => choose('icon', 'Icon', options, initial, 'icons');
const pick = <const T extends readonly string[]>(state: ActionState, key: string, values: T, fallback: T[number]): T[number] => values.find(value => value === state[key]) ?? fallback;
const string = (state: ActionState, key: string) => typeof state[key] === 'string' ? state[key] as string : '';
const bool = (state: ActionState, key: string) => state[key] === true;
const shape = (state: ActionState) => bool(state, 'square') ? 'square' as const : 'round' as const;
const tones = ['primary-container', 'secondary-container', 'tertiary-container', 'primary', 'secondary', 'tertiary', 'surface'] as const;
const positions = ['center', 'bottom-right', 'bottom-left', 'top-right', 'top-left'] as const;
const position = choose('position', 'Position', positions, 'center', 'select');
const toneControl: Control = { ...choose('variant', 'Color', tones, 'primary-container', 'select'), labels: { surface: 'Surface (legacy)' } };
const iconMarkup = (state: ActionState) => actionIcons[string(state, 'icon')] || '';
const fabPosition = (state: ActionState) => state.position === 'center' ? {} : { position: string(state, 'position') };
const groupItems = [{ value: 'bold', text: 'Bold' }, { value: 'italic', text: 'Italic' }, { value: 'underline', text: 'Underline' }];

export const actions = {
  button: {
    name: 'Button', factory: 'createButton', variable: 'button',
    description: 'One action, many expressions. Find the right fit for yours.',
    summary: 'Five variants. Five sizes. Your next action.',
    styles: ['progress', 'button'],
    controls: [
      ...section('Appearance', [choose('variant', 'Variant', variants, 'filled', 'select'), size, square]),
      ...section('Content', [icon(Object.keys(buttonIcons), 'none'), text('text', 'Text', 'Button')]),
      ...section('Behavior', [disabled]),
    ],
    config: (state: ActionState) => buttonConfig(normalizeState({ ...state, shape: shape(state) })),
  },
  'icon-button': {
    name: 'Icon button', factory: 'createIconButton', variable: 'iconButton',
    description: 'A compact action with room for expression. Try its shape, width, and toggle state.',
    summary: 'Compact actions, with a shape for every state.',
    styles: ['icon-button'],
    controls: [
      ...section('Appearance', [choose('variant', 'Variant', ['standard', 'filled', 'tonal', 'outlined'], 'standard', 'select'), size, square,
        choose('width', 'Width', ['narrow', 'default', 'wide'], 'default')]),
      ...section('Content', [icon(['heart', 'bookmark', 'download', 'send', 'add', 'edit'], 'heart'), text('ariaLabel', 'Accessible label', 'Add to favorites')]),
      ...section('Behavior', [toggle('toggle', 'Toggle button'), toggle('selected', 'Selected', false, 'toggle'), disabled]),
    ],
    config: (state: ActionState): IconButtonConfig => ({
      variant: string(state, 'variant'), size: string(state, 'size'), shape: shape(state), width: string(state, 'width'),
      icon: iconMarkup(state), ariaLabel: string(state, 'ariaLabel').trim() || 'Add to favorites',
      toggle: bool(state, 'toggle'), selected: bool(state, 'toggle') && bool(state, 'selected'), disabled: bool(state, 'disabled'),
    }),
  },
  'button-group': {
    name: 'Button group', factory: 'createButtonGroup', variable: 'buttonGroup',
    description: 'Bring related actions together. Explore connected shapes and single or multiple selection.',
    summary: 'Related actions. Shared shapes. Flexible selection.',
    styles: ['progress', 'button', 'icon-button', 'button-group'],
    controls: [
      ...section('Appearance', [choose('kind', 'Kind', ['standard', 'connected'], 'standard'), choose('variant', 'Variant', variants, 'outlined', 'select'), size, square]),
      ...section('Layout', [choose('orientation', 'Orientation', ['horizontal', 'vertical'], 'horizontal'),
        choose('density', 'Density', ['default', 'comfortable', 'compact'], 'default', 'select'), toggle('equalWidth', 'Equal widths')]),
      ...section('Content', [choose('content', 'Content', ['text', 'icons', 'both'], 'text'), choose('labels', 'Labels', ['always', 'selected'], 'always')]),
      ...section('Behavior', [choose('selection', 'Selection', ['none', 'single', 'multi'], 'none'), toggle('required', 'Require a selection'), disabled]),
    ],
    config: (state: ActionState): ButtonGroupConfig => ({
      kind: pick(state, 'kind', ['standard', 'connected'], 'standard'), selection: pick(state, 'selection', ['none', 'single', 'multi'], 'none'),
      variant: pick(state, 'variant', variants, 'outlined'), size: pick(state, 'size', sizes, 's'), shape: shape(state),
      orientation: pick(state, 'orientation', ['horizontal', 'vertical'], 'horizontal'), density: pick(state, 'density', ['default', 'comfortable', 'compact'], 'default'),
      labels: pick(state, 'labels', ['always', 'selected'], 'always'), required: bool(state, 'required'), equalWidth: bool(state, 'equalWidth'), disabled: bool(state, 'disabled'),
      ariaLabel: 'Text formatting',
      buttons: groupItems.map(item => ({ value: item.value, ariaLabel: item.text,
        ...(state.content !== 'icons' ? { text: item.text } : {}), ...(state.content !== 'text' ? { icon: actionIcons[item.value] } : {}),
      })),
    }),
  },
  'split-button': {
    name: 'Split button', factory: 'createSplitButton', variable: 'splitButton',
    description: 'A primary action and more possibilities. Open the trailing menu to try the alternatives.',
    summary: 'One primary action, with more options close by.',
    styles: ['menu', 'progress', 'button', 'split-button'],
    controls: [
      ...section('Appearance', [choose('variant', 'Variant', ['filled', 'tonal', 'outlined', 'elevated'], 'filled', 'select'), size]),
      ...section('Content', [icon(Object.keys(buttonIcons), 'none'), text('text', 'Text', 'Save'), text('trailingLabel', 'Menu label', 'More save options'),
        choose('menu', 'Menu options', ['save', 'share'], 'save')]),
      ...section('Behavior', [disabled]),
    ],
    config: (state: ActionState): SplitButtonConfig => ({
      variant: pick(state, 'variant', ['filled', 'tonal', 'outlined', 'elevated'], 'filled'), size: pick(state, 'size', sizes, 's'),
      text: string(state, 'text'), ...(iconMarkup(state) ? { icon: iconMarkup(state) } : {}),
      ...(!string(state, 'text').trim() ? { ariaLabel: 'Primary action' } : {}),
      trailingLabel: string(state, 'trailingLabel').trim() || 'More options', disabled: bool(state, 'disabled'),
      items: state.menu === 'share'
        ? [{ id: 'link', text: 'Copy link' }, { id: 'email', text: 'Send by email' }, { id: 'export', text: 'Export file' }]
        : [{ id: 'save-as', text: 'Save as…' }, { id: 'save-copy', text: 'Save a copy' }, { id: 'download', text: 'Download' }],
    }),
  },
  fab: {
    name: 'FAB', factory: 'createFab', variable: 'fab',
    description: 'Give your primary action a place to stand out. Explore color, size, and floating positions.',
    summary: 'A floating action with a clear purpose.',
    styles: ['fab'],
    controls: [
      ...section('Appearance', [toneControl, { ...choose('size', 'Size', ['small', 'default', 'medium', 'large'], 'default', 'select'), labels: { small: 'Small (legacy)' } },
        position, toggle('lowered', 'Lowered elevation')]),
      ...section('Content', [icon(['add', 'edit', 'heart', 'download', 'send'], 'add'), text('ariaLabel', 'Accessible label', 'Create new item')]),
      ...section('Behavior', [disabled]),
    ],
    config: (state: ActionState): FabConfig => ({ variant: string(state, 'variant'), size: string(state, 'size'), icon: iconMarkup(state),
      ariaLabel: string(state, 'ariaLabel').trim() || 'Create new item', disabled: bool(state, 'disabled'), ...fabPosition(state) }),
  },
  'extended-fab': {
    name: 'Extended FAB', factory: 'createExtendedFab', variable: 'extendedFab',
    description: 'Give your primary action a little more context. Try labels, icon placement, and a collapsed state.',
    summary: 'A floating action, with room for a label.',
    styles: ['extended-fab'],
    controls: [
      ...section('Appearance', [toneControl, choose('size', 'Size', ['small', 'medium', 'large'], 'small'),
        choose('width', 'Width', ['fixed', 'fluid'], 'fixed'), position, toggle('lowered', 'Lowered elevation')]),
      ...section('Content', [icon(['add', 'edit', 'heart', 'download', 'send'], 'edit'), text('text', 'Text', 'Compose'), choose('iconPosition', 'Icon position', ['start', 'end'], 'start')]),
      ...section('Behavior', [toggle('collapsed', 'Collapsed'), disabled]),
    ],
    config: (state: ActionState): ExtendedFabConfig => ({
      variant: string(state, 'variant'), size: pick(state, 'size', ['small', 'medium', 'large'], 'small'), icon: iconMarkup(state),
      text: string(state, 'text'), ariaLabel: string(state, 'text').trim() || 'Compose', disabled: bool(state, 'disabled'),
      iconPosition: pick(state, 'iconPosition', ['start', 'end'], 'start'), width: pick(state, 'width', ['fixed', 'fluid'], 'fixed'), ...fabPosition(state),
    }),
  },
};
export type ActionSlug = keyof typeof actions;
export const actionSlugs = Object.keys(actions) as ActionSlug[];
export const isAction = (slug: string): slug is ActionSlug => Object.hasOwn(actions, slug);
export function normalizeActionState(slug: ActionSlug, input: unknown): ActionState {
  const raw = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const state: ActionState = {};
  for (const control of actions[slug].controls as Control[]) {
    const value = raw[control.key];
    state[control.key] = control.kind === 'toggle' ? value === true
      : control.options ? control.options.find(option => option === value) ?? control.initial
      : typeof value === 'string' ? value.slice(0, 80) : control.initial;
  }
  state.theme = themes.find(theme => theme === raw.theme) ?? 'baseline';
  state.mode = raw.mode === 'dark' ? 'dark' : 'light';
  return state;
}
export function initialActionState(slug: ActionSlug): ActionState {
  return normalizeActionState(slug, Object.fromEntries(actions[slug].controls.map(control => [control.key, control.initial])));
}
export function actionCode(slug: ActionSlug, state: ActionState): string {
  const action = actions[slug];
  const config = JSON.stringify(action.config(state), null, 2).replace(/^(\s*)"([a-zA-Z]+)":/gm, '$1$2:');
  const calls = `${state.collapsed === true ? `${action.variable}.collapse();\n` : ''}${state.lowered === true ? `${action.variable}.lower();\n` : ''}`;
  return `import { ${action.factory} } from 'mtrl';\nimport 'mtrl/styles/base';\nimport 'mtrl/styles/${slug}';\n${state.theme === 'baseline' ? '' : `import 'mtrl/themes/${state.theme}';\n`}\n` +
    `document.documentElement.dataset.theme = '${state.theme}';\ndocument.documentElement.dataset.themeMode = '${state.mode}';\n\n` +
    `const ${action.variable} = ${action.factory}(${config});\n${calls}\ndocument.body.append(${action.variable}.element);\n\n// When the view is removed:\n// ${action.variable}.destroy();\n`;
}
