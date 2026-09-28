import type { BadgeConfig } from 'mtrl/components/badge';
import type { ProgressConfig } from 'mtrl/components/progress';
import type { LoadingIndicatorConfig } from 'mtrl/components/loading-indicator';
import type { SnackbarConfig } from 'mtrl/components/snackbar';
import type { TooltipConfig } from 'mtrl/components/tooltip';
import type { CardSchema } from 'mtrl/components/card';
import type { ListConfig, ListItem, ListSlot } from 'mtrl/components/list';
import type { CarouselConfig } from 'mtrl/components/carousel';
import type { DividerConfig } from 'mtrl/components/divider';
import type { DialogConfig } from 'mtrl/components/dialog';
import type { BottomSheetConfig } from 'mtrl/components/bottom-sheet';
import type { SideSheetConfig } from 'mtrl/components/side-sheet';
import type { NavigationRailConfig } from 'mtrl/components/navigation-rail';
import type { DrawerConfig } from 'mtrl/components/drawer';
import type { TabsConfig } from 'mtrl/components/tabs';
import type { MenuConfig } from 'mtrl/components/menu';
import type { TopAppBarConfig } from 'mtrl/components/top-app-bar';
import type { BottomAppBarConfig } from 'mtrl/components/bottom-app-bar';
import type { SwitchConfig } from 'mtrl/components/switch';
import type { RadiosConfig } from 'mtrl/components/radios';
import type { ChipsConfig } from 'mtrl/components/chips';
import type { SliderConfig } from 'mtrl/components/slider';
import type { TextfieldConfig } from 'mtrl/components/textfield';
import type { SelectConfig } from 'mtrl/components/select';
import type { SearchConfig } from 'mtrl/components/search';
import type { DatePickerConfig } from 'mtrl/components/datepicker';
import type { TimePickerConfig } from 'mtrl/components/timepicker';
import { TIME_PICKER_TYPE, TIME_FORMAT, TIME_PICKER_ORIENTATION } from 'mtrl/components/timepicker';
import type { CheckboxConfig } from 'mtrl/components/checkbox';
import type { IconButtonConfig } from 'mtrl/components/icon-button';
import type { ButtonGroupConfig } from 'mtrl/components/button-group';
import type { SplitButtonConfig } from 'mtrl/components/split-button';
import type { FabConfig } from 'mtrl/components/fab';
import type { ExtendedFabConfig } from 'mtrl/components/extended-fab';
import { symbols } from './icons';
import { buttonConfig, icons as buttonIcons, normalizeState, sizes, themes, variants } from './button';

export const componentIcons: Record<string, string> = {
  ...buttonIcons,
  menu: symbols.menu,
  inbox: symbols.inbox,
  add: symbols.add,
  edit: symbols.edit,
  bold: symbols.bold,
  italic: symbols.italic,
  underline: symbols.underline,
};
export type ComponentState = Record<string, string | boolean>;
export interface Control {
  section?: 'Appearance' | 'Layout' | 'Content' | 'Behavior';
  key: string;
  label: string;
  kind: 'choice' | 'icons' | 'select' | 'toggle' | 'text' | 'range' | 'date' | 'time';
  initial: string | boolean;
  options?: readonly string[];
  labels?: Record<string, string>;
  enabledWhen?: string;
  min?: number;
  max?: number;
  step?: number;
}
const section = (title: NonNullable<Control['section']>, controls: Control[]): Control[] => controls.map(control => ({ ...control, section: title }));
const choose = (key: string, label: string, options: readonly string[], initial: string, kind: 'choice' | 'select' | 'icons' = 'choice'): Control => ({ key, label, options, initial, kind });
const toggle = (key: string, label: string, initial = false, enabledWhen?: string): Control => ({ key, label, initial, kind: 'toggle', enabledWhen });
const text = (key: string, label: string, initial: string): Control => ({ key, label, initial, kind: 'text' });
const range = (key: string, label: string, initial: string): Control => ({ key, label, initial, kind: 'range', min: 0, max: 100, step: 1 });
const date = (key: string, label: string, initial: string): Control => ({ key, label, initial, kind: 'date' });
const size = choose('size', 'Size', sizes, 's');
const square = toggle('square', 'Square shape');
const disabled = toggle('disabled', 'Disabled');
const icon = (options: readonly string[], initial: string) => choose('icon', 'Icon', options, initial, 'icons');
const pick = <const T extends readonly string[]>(state: ComponentState, key: string, values: T, fallback: T[number]): T[number] => values.find(value => value === state[key]) ?? fallback;
const string = (state: ComponentState, key: string) => typeof state[key] === 'string' ? state[key] as string : '';
const bool = (state: ComponentState, key: string) => state[key] === true;
const shape = (state: ComponentState) => bool(state, 'square') ? 'square' as const : 'round' as const;
const tones = ['primary-container', 'secondary-container', 'tertiary-container', 'primary', 'secondary', 'tertiary', 'surface'] as const;
const positions = ['center', 'bottom-right', 'bottom-left', 'top-right', 'top-left'] as const;
const position = choose('position', 'Position', positions, 'center', 'select');
const toneControl: Control = { ...choose('variant', 'Color', tones, 'primary-container', 'select'), labels: { surface: 'Surface (legacy)' } };
const iconMarkup = (state: ComponentState) => componentIcons[string(state, 'icon')] || '';
const fabPosition = (state: ComponentState) => state.position === 'center' ? {} : { position: string(state, 'position') };
const groupItems = [{ value: 'bold', text: 'Bold' }, { value: 'italic', text: 'Italic' }, { value: 'underline', text: 'Underline' }];

const destinations = [{ id: 'inbox', label: 'Inbox', icon: componentIcons.inbox! }, { id: 'favorites', label: 'Favorites', icon: componentIcons.heart! }, { id: 'sent', label: 'Sent', icon: componentIcons.send! }];
const activeDestination = choose('active', 'Selected', ['inbox', 'favorites', 'sent'], 'inbox', 'select');
export const appBarActions = (state: ComponentState): IconButtonConfig[] => ['heart', 'bookmark', 'send'].slice(0, Number(state.actions)).map(icon => ({ icon: componentIcons[icon], ariaLabel: { heart: 'Favorite', bookmark: 'Bookmark', send: 'Share' }[icon] ?? icon, variant: 'standard' }));
const paragraph = (value: string) => `<p>${value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')}</p>`;
const landscape = (index: number) => `/assets/playground/landscape-${index + 1}.svg`;
function listConfig(state: ComponentState): ListConfig<ListItem> {
  const labels = (state.content === 'places'
    ? ['Mountain trail', 'Botanical garden', 'City museum', 'Riverside park', 'Local market']
    : ['Morning walk', 'Read a chapter', 'Try a new recipe', 'Call a friend', 'Plan a weekend']).slice(0, Number(state.count));
  const items: ListItem[] = [];
  if (state.subheader) items.push({ kind: 'subheader', headline: state.content === 'places' ? 'Places to explore' : 'Ideas for today' });
  labels.forEach((headline, index) => {
    if (index && state.dividers !== 'none') items.push({ kind: 'divider', ...(state.dividers === 'inset' ? { inset: true } : {}) });
    let leading: ListSlot | undefined;
    if (state.leading === 'icon') leading = { type: 'icon', content: componentIcons[['heart', 'bookmark', 'download'][index % 3]!]! };
    if (state.leading === 'avatar') leading = { type: 'avatar', content: headline.split(' ').map(word => word[0]).slice(0, 2).join('').toUpperCase() };
    if (state.leading === 'image' || state.leading === 'video') leading = { type: state.leading, content: `<img src="${landscape(index)}" alt="">` };
    let trailing: ListSlot | undefined;
    if (state.trailing === 'text') trailing = { type: 'text', content: `${(index + 1) * 5} min` };
    if (state.trailing === 'icon') trailing = { type: 'icon', content: componentIcons.bookmark! };
    if (state.trailing === 'control') trailing = { type: 'control', content: `<button type="button" data-list-action="${headline}" aria-label="Save ${headline}" style="color:inherit;font:inherit;min-width:48px;min-height:48px;background:transparent;border:0;cursor:pointer">Save</button>` };
    items.push({ id: String(index + 1), headline, lines: Number(state.lines) as 1 | 2 | 3,
      ...(state.lines !== '1' ? { supportingText: string(state, 'supportingText') } : {}),
      ...(state.lines === '3' && state.overline ? { overline: state.content === 'places' ? 'Explore nearby' : 'Daily inspiration' } : {}),
      ...(leading ? { leading } : {}), ...(trailing ? { trailing } : {}),
      ...(state.disableLast && index === labels.length - 1 ? { disabled: true } : {}),
    });
  });
  return { items, ariaLabel: string(state, 'ariaLabel').trim() || 'Ideas for today', trackSelection: state.selection !== 'none', multiSelect: state.selection === 'multi',
    initialSelection: ['first', 'second', 'third', 'fourth', 'fifth'].flatMap((key, index) => state[key] && index < labels.length && state.selection !== 'none' ? [String(index + 1)] : []) };
}
export const components = {
  button: {
    group: 'Actions', name: 'Button', factory: 'createButton', variable: 'button',
    description: 'One action, many expressions. Find the right fit for yours.',
    summary: 'Five variants. Five sizes. Your next action.',
    styles: ['progress', 'button'],
    controls: [
      ...section('Appearance', [choose('variant', 'Variant', variants, 'filled', 'select'), size, square]),
      ...section('Content', [icon(Object.keys(buttonIcons), 'none'), text('text', 'Text', 'Button')]),
      ...section('Behavior', [disabled]),
    ],
    config: (state: ComponentState) => buttonConfig(normalizeState({ ...state, shape: shape(state) })),
  },
  'icon-button': {
    group: 'Actions', name: 'Icon button', factory: 'createIconButton', variable: 'iconButton',
    description: 'A compact action with room for expression. Try its shape, width, and toggle state.',
    summary: 'Compact actions, with a shape for every state.',
    styles: ['icon-button'],
    controls: [
      ...section('Appearance', [choose('variant', 'Variant', ['standard', 'filled', 'tonal', 'outlined'], 'standard', 'select'), size, square,
        choose('width', 'Width', ['narrow', 'default', 'wide'], 'default')]),
      ...section('Content', [icon(['heart', 'bookmark', 'download', 'send', 'add', 'edit'], 'heart'), text('ariaLabel', 'Accessible label', 'Add to favorites')]),
      ...section('Behavior', [toggle('toggle', 'Toggle button'), toggle('selected', 'Selected', false, 'toggle'), disabled]),
    ],
    config: (state: ComponentState): IconButtonConfig => ({
      variant: string(state, 'variant'), size: string(state, 'size'), shape: shape(state), width: string(state, 'width'),
      icon: iconMarkup(state), ariaLabel: string(state, 'ariaLabel').trim() || 'Add to favorites',
      toggle: bool(state, 'toggle'), selected: bool(state, 'toggle') && bool(state, 'selected'), disabled: bool(state, 'disabled'),
    }),
  },
  'button-group': {
    group: 'Actions', name: 'Button group', factory: 'createButtonGroup', variable: 'buttonGroup',
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
    config: (state: ComponentState): ButtonGroupConfig => ({
      kind: pick(state, 'kind', ['standard', 'connected'], 'standard'), selection: pick(state, 'selection', ['none', 'single', 'multi'], 'none'),
      variant: pick(state, 'variant', variants, 'outlined'), size: pick(state, 'size', sizes, 's'), shape: shape(state),
      orientation: pick(state, 'orientation', ['horizontal', 'vertical'], 'horizontal'), density: pick(state, 'density', ['default', 'comfortable', 'compact'], 'default'),
      labels: pick(state, 'labels', ['always', 'selected'], 'always'), required: bool(state, 'required'), equalWidth: bool(state, 'equalWidth'), disabled: bool(state, 'disabled'),
      ariaLabel: 'Text formatting',
      buttons: groupItems.map(item => ({ value: item.value, ariaLabel: item.text,
        ...(state.content !== 'icons' ? { text: item.text } : {}), ...(state.content !== 'text' ? { icon: componentIcons[item.value] } : {}),
      })),
    }),
  },
  'split-button': {
    group: 'Actions', name: 'Split button', factory: 'createSplitButton', variable: 'splitButton',
    description: 'A primary action and more possibilities. Open the trailing menu to try the alternatives.',
    summary: 'One primary action, with more options close by.',
    styles: ['menu', 'progress', 'button', 'split-button'],
    controls: [
      ...section('Appearance', [choose('variant', 'Variant', ['filled', 'tonal', 'outlined', 'elevated'], 'filled', 'select'), size]),
      ...section('Content', [icon(Object.keys(buttonIcons), 'none'), text('text', 'Text', 'Save'), text('trailingLabel', 'Menu label', 'More save options'),
        choose('menu', 'Menu options', ['save', 'share'], 'save')]),
      ...section('Behavior', [disabled]),
    ],
    config: (state: ComponentState): SplitButtonConfig => ({
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
    group: 'Actions', name: 'FAB', factory: 'createFab', variable: 'fab',
    description: 'Give your primary action a place to stand out. Explore color, size, and floating positions.',
    summary: 'A floating action with a clear purpose.',
    styles: ['fab'],
    controls: [
      ...section('Appearance', [toneControl, { ...choose('size', 'Size', ['small', 'default', 'medium', 'large'], 'default', 'select'), labels: { small: 'Small (legacy)' } },
        position, toggle('lowered', 'Lowered elevation')]),
      ...section('Content', [icon(['add', 'edit', 'heart', 'download', 'send'], 'add'), text('ariaLabel', 'Accessible label', 'Create new item')]),
      ...section('Behavior', [disabled]),
    ],
    config: (state: ComponentState): FabConfig => ({ variant: string(state, 'variant'), size: string(state, 'size'), icon: iconMarkup(state),
      ariaLabel: string(state, 'ariaLabel').trim() || 'Create new item', disabled: bool(state, 'disabled'), ...fabPosition(state) }),
  },
  'extended-fab': {
    group: 'Actions', name: 'Extended FAB', factory: 'createExtendedFab', variable: 'extendedFab',
    description: 'Give your primary action a little more context. Try labels, icon placement, and a collapsed state.',
    summary: 'A floating action, with room for a label.',
    styles: ['extended-fab'],
    controls: [
      ...section('Appearance', [toneControl, choose('size', 'Size', ['small', 'medium', 'large'], 'small'),
        choose('width', 'Width', ['fixed', 'fluid'], 'fixed'), position, toggle('lowered', 'Lowered elevation')]),
      ...section('Content', [icon(['add', 'edit', 'heart', 'download', 'send'], 'edit'), text('text', 'Text', 'Compose'), choose('iconPosition', 'Icon position', ['start', 'end'], 'start')]),
      ...section('Behavior', [toggle('collapsed', 'Collapsed'), disabled]),
    ],
    config: (state: ComponentState): ExtendedFabConfig => ({
      variant: string(state, 'variant'), size: pick(state, 'size', ['small', 'medium', 'large'], 'small'), icon: iconMarkup(state),
      text: string(state, 'text'), ariaLabel: string(state, 'text').trim() || 'Compose', disabled: bool(state, 'disabled'),
      iconPosition: pick(state, 'iconPosition', ['start', 'end'], 'start'), width: pick(state, 'width', ['fixed', 'fluid'], 'fixed'), ...fabPosition(state),
    }),
  },
  checkbox: {
    group: 'Selection & input', name: 'Checkbox', factory: 'createCheckbox', variable: 'checkbox',
    description: 'Make a choice, or represent a partial selection. Explore checkbox states, labels, and form behavior.',
    summary: 'Single choices and mixed selections.',
    styles: ['checkbox'],
    controls: [
      ...section('Appearance', [choose('variant', 'Variant', ['filled', 'outlined'], 'filled'), choose('labelPosition', 'Label position', ['start', 'end'], 'end')]),
      ...section('Content', [text('label', 'Label', 'Remember me'), text('name', 'Name', 'remember'), text('value', 'Value', 'on')]),
      ...section('Behavior', [choose('state', 'State', ['unchecked', 'checked', 'indeterminate'], 'unchecked', 'select'), toggle('required', 'Required'), disabled]),
    ],
    config: (state: ComponentState): CheckboxConfig => ({
      label: string(state, 'label'), name: string(state, 'name'), value: string(state, 'value') || 'on',
      variant: pick(state, 'variant', ['filled', 'outlined'], 'filled'), labelPosition: pick(state, 'labelPosition', ['start', 'end'], 'end'),
      checked: state.state === 'checked', indeterminate: state.state === 'indeterminate',
      // withInput writes boolean attributes by presence, so omit them when false.
      ...(bool(state, 'disabled') ? { disabled: true } : {}),
      ...(bool(state, 'required') ? { required: true } : {}),
      // The library ships outlined styles but does not apply variant to the root class.
      ...(state.variant === 'outlined' ? { class: 'mtrl-checkbox--outlined' } : {}),
    }),
  },
  switch: {
    group: 'Selection & input', name: 'Switch', factory: 'createSwitch', variable: 'toggle',
    description: 'Turn a setting on or off. Try labels, supporting text, and interactive states.',
    summary: 'Settings that take effect immediately.', styles: ['switch'],
    controls: [
      ...section('Content', [text('label', 'Label', 'Notifications'), text('supportingText', 'Supporting text', 'Stay up to date'), text('name', 'Name', 'notifications')]),
      ...section('Behavior', [toggle('checked', 'Checked', true), toggle('error', 'Error'), toggle('required', 'Required'), disabled]),
    ],
    config: (state: ComponentState): SwitchConfig => ({ label: string(state, 'label'), ariaLabel: string(state, 'label').trim() || 'Notifications',
      supportingText: string(state, 'supportingText'), name: string(state, 'name'), checked: bool(state, 'checked'), error: bool(state, 'error'),
      ...(bool(state, 'required') ? { required: true } : {}), ...(bool(state, 'disabled') ? { disabled: true } : {}) }),
  },
  radios: {
    group: 'Selection & input', name: 'Radio buttons', factory: 'createRadios', variable: 'radios',
    description: 'Choose one option from a set. Explore orientation, label placement, and disabled options.',
    summary: 'One choice from a related set.', styles: ['radios'],
    controls: [
      ...section('Layout', [choose('direction', 'Direction', ['vertical', 'horizontal'], 'vertical'), toggle('labelBefore', 'Labels before')]),
      ...section('Content', [text('name', 'Name', 'delivery'), choose('value', 'Selected', ['standard', 'express', 'pickup'], 'standard', 'select')]),
      ...section('Behavior', [toggle('disableExpress', 'Disable express'), disabled]),
    ],
    config: (state: ComponentState): RadiosConfig => ({ name: string(state, 'name') || 'delivery', direction: pick(state, 'direction', ['vertical', 'horizontal'], 'vertical'),
      value: bool(state, 'disableExpress') && state.value === 'express' ? 'standard' : string(state, 'value'), disabled: bool(state, 'disabled'),
      options: [{ value: 'standard', label: 'Standard' }, { value: 'express', label: 'Express', disabled: bool(state, 'disableExpress') }, { value: 'pickup', label: 'Pick up' }].map(option => ({ ...option, labelBefore: bool(state, 'labelBefore') })) }),
  },
  chips: {
    group: 'Selection & input', name: 'Chips', factory: 'createChips', variable: 'chips',
    description: 'Explore compact choices and actions. Try the four chip types, elevation, icons and avatars, and single or multiple selection.',
    summary: 'Compact choices, filters, and actions.', styles: ['chips'],
    controls: [
      // The four M3 chip types. Elevation is for assist, filter and suggestion chips; an
      // avatar for input chips; selection for filter and input chips.
      ...section('Appearance', [choose('type', 'Type', ['assist', 'filter', 'input', 'suggestion'], 'filter', 'select'), toggle('elevated', 'Elevated', false, 'elevatedAllowed'), toggle('vertical', 'Vertical layout'), toggle('icons', 'Leading icons'), toggle('avatar', 'Avatar', false, 'inputType')]),
      ...section('Content', [text('label', 'Group label', 'Interests')]),
      ...section('Behavior', [toggle('multiSelect', 'Multiple selection', true, 'selectable'), toggle('hiking', 'Hiking selected', true, 'selectable'), toggle('music', 'Music selected', false, 'selectable'), toggle('food', 'Food selected', false, 'selectable'), disabled]),
    ],
    config: (state: ComponentState): ChipsConfig => ({ label: string(state, 'label'), vertical: bool(state, 'vertical'), multiSelect: bool(state, 'multiSelect'),
      chips: ['hiking', 'music', 'food'].map((value, index) => ({ value, label: ['Hiking', 'Music', 'Food'][index], type: pick(state, 'type', ['assist', 'filter', 'input', 'suggestion'], 'filter'),
        ...(state.elevatedAllowed && bool(state, 'elevated') ? { elevated: true } : {}),
        ...(state.selectable ? { selected: bool(state, value) } : {}), disabled: bool(state, 'disabled'),
        ...(state.inputType && bool(state, 'avatar') ? { avatar: symbols.accountCircle } : bool(state, 'icons') ? { leadingIcon: componentIcons.heart } : {}) })) }),
  },
  slider: {
    group: 'Selection & input', name: 'Slider', factory: 'createSlider', variable: 'slider',
    description: 'Choose a value or a range. Explore track sizes, steps, colors, and value indicators.',
    summary: 'Values and ranges along a track.', styles: ['slider'],
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
  },
  textfield: {
    group: 'Selection & input', name: 'Text field', factory: 'createTextfield', variable: 'textfield',
    description: 'Enter text with helpful context. Explore field styles, input types, icons, and validation states.',
    summary: 'Text entry with labels and feedback.', styles: ['textfield'],
    controls: [
      ...section('Appearance', [choose('variant', 'Variant', ['filled', 'outlined'], 'outlined'), choose('density', 'Density', ['default', 'compact'], 'default'), icon(['none', 'heart', 'edit', 'send'], 'none')]),
      ...section('Content', [choose('type', 'Input type', ['text', 'password', 'email', 'number', 'tel', 'url', 'search', 'multiline'], 'text', 'select'), text('label', 'Label', 'Name'), text('value', 'Value', ''), text('placeholder', 'Placeholder', 'Enter your name'), text('supportingText', 'Supporting text', 'As you would like it displayed')]),
      ...section('Behavior', [toggle('error', 'Error'), toggle('required', 'Required'), toggle('readonly', 'Read only'), disabled]),
    ],
    config: (state: ComponentState): TextfieldConfig => ({ variant: string(state, 'variant'), density: string(state, 'density'), type: string(state, 'type'), label: string(state, 'label'),
      value: string(state, 'value'), placeholder: string(state, 'placeholder'), supportingText: string(state, 'supportingText'), name: 'name', ...(iconMarkup(state) ? { leadingIcon: iconMarkup(state) } : {}),
      error: bool(state, 'error'), required: bool(state, 'required'), readonly: bool(state, 'readonly'), disabled: bool(state, 'disabled') }),
  },
  select: {
    group: 'Selection & input', name: 'Select', factory: 'createSelect', variable: 'select',
    description: 'Pick an option from a menu. Explore field styles, selection, and validation states.',
    summary: 'A menu of choices in a field.', styles: ['textfield', 'menu', 'select'],
    controls: [
      ...section('Appearance', [choose('variant', 'Variant', ['filled', 'outlined'], 'outlined'), choose('density', 'Density', ['default', 'compact'], 'default')]),
      ...section('Content', [text('label', 'Label', 'Fruit'), choose('value', 'Selected', ['', 'apple', 'banana', 'cherry'], 'apple', 'select'), text('supportingText', 'Supporting text', 'Choose a favorite')]),
      ...section('Behavior', [toggle('disableBanana', 'Disable banana'), toggle('error', 'Error'), toggle('required', 'Required'), disabled]),
    ],
    config: (state: ComponentState): SelectConfig => ({ variant: string(state, 'variant'), density: string(state, 'density'), label: string(state, 'label'), value: string(state, 'value'),
      supportingText: string(state, 'supportingText'), error: bool(state, 'error'), required: bool(state, 'required'), disabled: bool(state, 'disabled'), name: 'fruit',
      options: [{ id: 'apple', text: 'Apple' }, { id: 'banana', text: 'Banana', disabled: bool(state, 'disableBanana') }, { id: 'cherry', text: 'Cherry' }] }),
  },
  search: {
    group: 'Selection & input', name: 'Search', factory: 'createSearch', variable: 'search',
    description: 'Start with a search bar, then explore suggestions in a docked or fullscreen view.',
    summary: 'Search with suggestions and an expanded view.', styles: ['search'],
    controls: [
      ...section('Appearance', [choose('initialState', 'State', ['bar', 'view'], 'bar'), choose('viewMode', 'View mode', ['docked', 'fullscreen'], 'docked')]),
      ...section('Content', [text('placeholder', 'Placeholder', 'Search places'), text('value', 'Query', ''), choose('suggestions', 'Suggestions', ['places', 'none'], 'places')]),
      ...section('Behavior', [toggle('showClearButton', 'Clear button', true), toggle('expandOnFocus', 'Expand on focus', true), toggle('collapseOnBlur', 'Collapse on blur', true), disabled]),
    ],
    config: (state: ComponentState): SearchConfig => ({ initialState: pick(state, 'initialState', ['bar', 'view'], 'bar'), viewMode: pick(state, 'viewMode', ['docked', 'fullscreen'], 'docked'),
      placeholder: string(state, 'placeholder'), value: string(state, 'value'), suggestions: state.suggestions === 'none' ? [] : ['Paris', 'London', 'Lisbon', 'Tokyo'],
      showClearButton: bool(state, 'showClearButton'), expandOnFocus: bool(state, 'expandOnFocus'), collapseOnBlur: bool(state, 'collapseOnBlur'), disabled: bool(state, 'disabled'), minWidth: 240, maxWidth: 480, name: 'query' }),
  },
  datepicker: {
    group: 'Selection & input', name: 'Date picker', factory: 'createDatePicker', variable: 'datePicker',
    description: 'Choose a date or enter one by keyboard. Explore calendar and input modes, ranges, and selection limits.',
    summary: 'Calendar and keyboard entry for dates and ranges.', styles: ['datepicker'],
    controls: [
      ...section('Appearance', [choose('variant', 'Variant', ['docked', 'modal', 'modal-input'], 'docked', 'select'), choose('initialView', 'Initial view', ['day', 'month', 'year'], 'day')]),
      ...section('Content', [text('label', 'Label', 'Choose a date'), date('value', 'Date', '2026-09-21'), { ...date('endDate', 'Range end', '2026-09-25'), enabledWhen: 'range' }, choose('dateFormat', 'Date format', ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], 'MM/DD/YYYY', 'select')]),
      ...section('Behavior', [toggle('range', 'Date range'), toggle('closeOnSelect', 'Close on selection'), disabled, toggle('bounded', 'Limit dates'), { ...date('minDate', 'Earliest date', '2026-09-01'), enabledWhen: 'bounded' }, { ...date('maxDate', 'Latest date', '2026-10-31'), enabledWhen: 'bounded' }]),
    ],
    config: (state: ComponentState): DatePickerConfig => ({ variant: string(state, 'variant'), initialView: string(state, 'initialView'), selectionMode: bool(state, 'range') ? 'range' : 'single',
      ...(state.value ? { value: bool(state, 'range') && state.endDate ? [string(state, 'value'), string(state, 'endDate')] as [string, string] : string(state, 'value') } : {}), dateFormat: string(state, 'dateFormat'),
      label: string(state, 'label'), closeOnSelect: bool(state, 'closeOnSelect'), disabled: bool(state, 'disabled'), ...(state.bounded ? { minDate: string(state, 'minDate'), maxDate: string(state, 'maxDate') } : {}) }),
  },
  timepicker: {
    group: 'Selection & input', name: 'Time picker', factory: 'createTimePicker', variable: 'timePicker',
    description: 'Choose a time with a dial or keyboard. Explore clock formats, orientation, and precision.',
    summary: 'Time entry with a dial or keyboard.', styles: ['progress', 'button', 'timepicker'],
    controls: [
      ...section('Appearance', [choose('type', 'Input mode', ['dial', 'input'], 'dial'), choose('format', 'Clock format', ['12h', '24h'], '12h'), choose('orientation', 'Orientation', ['vertical', 'horizontal'], 'vertical')]),
      ...section('Content', [text('title', 'Title', 'Select time'), { ...text('value', 'Time', '09:30'), kind: 'time' }]),
      ...section('Behavior', [toggle('showSeconds', 'Show seconds'), choose('minuteStep', 'Minute step', ['1', '5', '15'], '1'), toggle('closeOnSelect', 'Close on selection')]),
    ],
    config: (state: ComponentState): TimePickerConfig => ({ type: state.type === 'input' ? TIME_PICKER_TYPE.INPUT : TIME_PICKER_TYPE.DIAL,
      format: state.format === '24h' ? TIME_FORMAT.MILITARY : TIME_FORMAT.AMPM,
      orientation: state.orientation === 'horizontal' ? TIME_PICKER_ORIENTATION.HORIZONTAL : TIME_PICKER_ORIENTATION.VERTICAL,
      title: string(state, 'title'), value: string(state, 'value'), showSeconds: bool(state, 'showSeconds'), minuteStep: Number(state.minuteStep), closeOnSelect: bool(state, 'closeOnSelect'), name: 'time' }),
  },
  'navigation-rail': {
    group: 'Navigation', name: 'Navigation rail', factory: 'createNavigationRail', variable: 'rail',
    description: 'Move between destinations. Explore collapsed, expanded, and modal navigation.',
    summary: 'Primary destinations in an expressive rail.', styles: ['navigation-rail', 'button', 'progress'],
    controls: [
      ...section('Layout', [choose('layout', 'Layout', ['standard', 'modal'], 'standard'), toggle('expanded', 'Expanded'), { ...range('expandedWidth', 'Expanded width', '280'), min: 220, max: 360, step: 20 }, toggle('hideWhenCollapsed', 'Hide collapsed')]),
      ...section('Content', [activeDestination, toggle('badges', 'Badges', true), toggle('showToggle', 'Menu button', true)]),
      ...section('Behavior', [toggle('disableSent', 'Disable Sent'), toggle('ripple', 'Ripple', true)]),
    ],
    config: (state: ComponentState): NavigationRailConfig => ({ layout: pick(state, 'layout', ['standard', 'modal'], 'standard'), expanded: bool(state, 'expanded'), expandedWidth: Number(state.expandedWidth), hideWhenCollapsed: bool(state, 'hideWhenCollapsed'), showToggle: bool(state, 'showToggle'), ripple: bool(state, 'ripple'), ariaLabel: 'Mail navigation',
      items: destinations.map(item => ({ ...item, active: state.active === item.id, disabled: item.id === 'sent' && bool(state, 'disableSent'), ...(state.badges && item.id === 'inbox' ? { badge: 8, badgeLabel: '8 unread messages' } : {}) })) }),
  },
  drawer: {
    group: 'Navigation', name: 'Drawer', factory: 'createDrawer', variable: 'drawer',
    description: 'Explore a navigation drawer with destinations, section labels, and badges.',
    summary: 'Grouped destinations in a side panel.', styles: ['drawer', 'button', 'progress'],
    controls: [
      ...section('Appearance', [choose('variant', 'Variant', ['standard', 'modal'], 'standard'), toggle('dense', 'Dense')]),
      ...section('Layout', [choose('position', 'Position', ['start', 'end'], 'start'), { ...range('width', 'Width', '280'), min: 220, max: 360, step: 20 }]),
      ...section('Content', [text('headline', 'Headline', 'Mail'), activeDestination, toggle('icons', 'Icons', true), toggle('badges', 'Badges', true), toggle('sections', 'Section labels', true)]),
      ...section('Behavior', [toggle('open', 'Open', true), toggle('dismissible', 'Dismissible', true), toggle('disableSent', 'Disable Sent')]),
    ],
    config: (state: ComponentState): DrawerConfig => ({ variant: string(state, 'variant'), position: string(state, 'position'), width: Number(state.width), dense: bool(state, 'dense'), headline: string(state, 'headline'), open: bool(state, 'open'), dismissible: bool(state, 'dismissible'),
      items: [...(state.sections ? [{ type: 'section' as const, sectionLabel: 'Your mailbox' }] : []), ...destinations.map(item => ({ id: item.id, label: item.label, ...(state.icons ? { icon: item.icon } : {}), active: state.active === item.id, disabled: item.id === 'sent' && bool(state, 'disableSent'), ...(state.badges && item.id === 'inbox' ? { badge: '8' } : {}) }))] }),
  },
  tabs: {
    group: 'Navigation', name: 'Tabs', factory: 'createTabs', variable: 'tabs',
    description: 'Switch between related views. Try primary and secondary tabs, icons, and badges.',
    summary: 'Related views, one active tab.', styles: ['progress', 'button', 'badge', 'tabs'],
    controls: [
      ...section('Appearance', [choose('variant', 'Variant', ['primary', 'secondary'], 'primary'), toggle('showDivider', 'Divider', true)]),
      ...section('Content', [{ ...activeDestination, options: ['inbox', 'favorites', 'sent', 'drafts', 'archive', 'trash'] }, toggle('icons', 'Icons', true), toggle('badges', 'Badges'), choose('count', 'Tab count', ['3', '6'], '3')]),
      ...section('Behavior', [toggle('scrollable', 'Scrollable'), toggle('disableSent', 'Disable Sent')]),
    ],
    config: (state: ComponentState): TabsConfig => ({ variant: string(state, 'variant'), showDivider: bool(state, 'showDivider'), scrollable: bool(state, 'scrollable'), tabs: [...destinations, ...(state.count === '6' ? ['Drafts', 'Archive', 'Trash'].map(label => ({ id: label.toLowerCase(), label, icon: componentIcons.inbox! })) : [])].map(item => ({ text: item.label, value: item.id, state: state.active === item.id ? 'active' : 'inactive', disabled: item.id === 'sent' && bool(state, 'disableSent'), ...(state.icons ? { icon: item.icon } : {}), ...(state.badges && item.id === 'inbox' ? { badge: 8 } : {}) })) }),
  },
  menu: {
    group: 'Navigation', name: 'Menu', factory: 'createMenu', variable: 'menu',
    description: 'Open a menu of actions. Explore placement, color, supporting text, and nested choices.',
    summary: 'Actions and nested choices on demand.', styles: ['menu', 'button', 'progress'],
    controls: [
      ...section('Appearance', [choose('variant', 'Variant', ['standard', 'vibrant', 'gap', 'baseline'], 'standard', 'select'), toggle('dense', 'Dense')]),
      ...section('Layout', [choose('position', 'Position', ['bottom-start', 'bottom-end', 'top-start', 'top-end', 'right-start', 'left-start'], 'bottom-start', 'select')]),
      ...section('Content', [text('text', 'Button label', 'Open menu'), toggle('icons', 'Icons', true), toggle('supportingText', 'Supporting text'), toggle('submenu', 'Submenu')]),
      ...section('Behavior', [toggle('closeOnSelect', 'Close on selection', true), toggle('disableDownload', 'Disable download')]),
    ],
    config: (state: ComponentState): MenuConfig => ({ opener: '#menu-trigger', variant: state.variant === 'baseline' ? 'baseline' : 'vertical', color: state.variant === 'vibrant' ? 'vibrant' : 'standard', position: pick(state, 'position', ['bottom-start', 'bottom-end', 'top-start', 'top-end', 'right-start', 'left-start'], 'bottom-start'), dense: bool(state, 'dense'), closeOnSelect: bool(state, 'closeOnSelect'), items: [
      { id: 'save', text: 'Save', ...(state.icons ? { icon: componentIcons.bookmark } : {}), ...(state.supportingText ? { supportingText: 'Keep for later' } : {}) },
      { id: 'share', text: 'Share', ...(state.icons ? { icon: componentIcons.send } : {}), ...(state.submenu ? { hasSubmenu: true, submenu: [{ id: 'link', text: 'Copy link' }, { id: 'email', text: 'Email' }] } : {}) },
      { type: state.variant === 'gap' ? 'gap' : 'divider' }, { id: 'download', text: 'Download', disabled: bool(state, 'disableDownload'), ...(state.icons ? { icon: componentIcons.download } : {}) },
    ] }),
  },
  'top-app-bar': {
    group: 'Navigation', name: 'Top app bar', factory: 'createTopAppBar', variable: 'topBar',
    description: 'Give a view its title and actions. Explore bar sizes and the scrolled appearance.',
    summary: 'A title, navigation, and contextual actions.', styles: ['top-app-bar', 'icon-button'],
    controls: [
      ...section('Appearance', [choose('type', 'Type', ['small', 'center', 'medium', 'large'], 'small', 'select'), toggle('scrolled', 'Scrolled state'), toggle('compressible', 'Compressible', true)]),
      ...section('Content', [text('title', 'Title', 'My library'), toggle('leading', 'Navigation button', true), choose('actions', 'Action count', ['0', '1', '2'], '1')]),
    ],
    config: (state: ComponentState): TopAppBarConfig => ({ type: pick(state, 'type', ['small', 'center', 'medium', 'large'], 'small'), title: string(state, 'title'), compressible: bool(state, 'compressible'), scrollable: false }),
  },
  'bottom-app-bar': {
    group: 'Navigation', name: 'Bottom app bar', factory: 'createBottomAppBar', variable: 'bottomBar',
    description: 'Keep frequent actions within reach. Try a floating action button and different placements.',
    summary: 'Frequent actions with an optional FAB.', styles: ['bottom-app-bar', 'icon-button', 'fab'],
    controls: [
      ...section('Layout', [toggle('hasFab', 'Show FAB', true), choose('fabPosition', 'FAB position', ['center', 'end'], 'end')]),
      ...section('Content', [choose('actions', 'Action count', ['1', '2', '3'], '2'), text('fabLabel', 'FAB label', 'Compose')]),
      ...section('Behavior', [toggle('visible', 'Visible', true)]),
    ],
    config: (state: ComponentState): BottomAppBarConfig => ({ hasFab: bool(state, 'hasFab'), fabPosition: pick(state, 'fabPosition', ['center', 'end'], 'end'), autoHide: false }),
  },
  card: {
    group: 'Containment', name: 'Card', factory: 'createCard', variable: 'card',
    description: 'Bring content and actions together. Explore surfaces, media, and interactive cards.',
    summary: 'Content and actions on one surface.', styles: ['progress', 'button', 'card'],
    controls: [
      ...section('Appearance', [choose('variant', 'Variant', ['elevated', 'filled', 'outlined'], 'elevated'), toggle('media', 'Show image', true), choose('aspectRatio', 'Image ratio', ['16:9', '4:3', '1:1'], '16:9'), choose('mediaPosition', 'Image position', ['top', 'bottom'], 'top')]),
      ...section('Content', [text('title', 'Title', 'A little time outside'), text('subtitle', 'Subtitle', 'Find your next escape'), text('content', 'Body', 'Take the scenic route. There is always something new to discover.'), toggle('actions', 'Show actions', true)]),
      ...section('Behavior', [toggle('clickable', 'Clickable'), toggle('draggable', 'Draggable')]),
    ],
    config: (state: ComponentState): CardSchema => ({ variant: string(state, 'variant'), clickable: bool(state, 'clickable'), interactive: bool(state, 'clickable'), draggable: bool(state, 'draggable'), header: { title: string(state, 'title'), subtitle: string(state, 'subtitle') }, content: { text: string(state, 'content') }, ...(state.media ? { media: { src: landscape(0), alt: 'Illustrated mountain landscape', aspectRatio: string(state, 'aspectRatio'), position: pick(state, 'mediaPosition', ['top', 'bottom'], 'top') } } : {}), ...(state.actions ? { buttons: [{ text: 'Explore', variant: 'text' }, { text: 'Save', variant: 'tonal' }] } : {}) }),
  },
  list: {
    group: 'Containment', name: 'List', factory: 'createList', variable: 'list',
    description: 'Explore Material list anatomy. Configure text lines, media, supporting actions, and selection.',
    summary: 'One, two, or three lines with flexible content slots.', styles: ['list'],
    controls: [
      ...section('Layout', [choose('lines', 'Text lines', ['1', '2', '3'], '2'), choose('leading', 'Leading', ['none', 'icon', 'avatar', 'image', 'video'], 'icon', 'select'), choose('trailing', 'Trailing', ['none', 'text', 'icon', 'control'], 'text', 'select'), choose('dividers', 'Dividers', ['none', 'full-width', 'inset'], 'none', 'select'), toggle('subheader', 'Subheader')]),
      ...section('Content', [choose('content', 'Items', ['activities', 'places'], 'activities'), choose('count', 'Item count', ['3', '5'], '3'), { ...text('supportingText', 'Supporting text', 'Make a little time for yourself'), enabledWhen: 'hasSupporting' }, toggle('overline', 'Overline', false, 'threeLines'), text('ariaLabel', 'Accessible label', 'Ideas for today')]),
      ...section('Behavior', [choose('selection', 'Selection', ['none', 'single', 'multi'], 'single'), toggle('disableLast', 'Disable last item'), toggle('first', 'First selected', true, 'selectable'), toggle('second', 'Second selected', false, 'selectable'), toggle('third', 'Third selected', false, 'selectable'), toggle('fourth', 'Fourth selected', false, 'extraSelectable'), toggle('fifth', 'Fifth selected', false, 'extraSelectable')]),
    ],
    config: (state: ComponentState): ListConfig<ListItem> => listConfig(state),
  },
  carousel: {
    group: 'Containment', name: 'Carousel', factory: 'createCarousel', variable: 'carousel',
    description: 'Browse a collection with Material carousel layouts. Swipe, scroll, or use the arrow keys.',
    summary: 'Five ways to browse a visual collection.', styles: ['carousel'],
    controls: [
      ...section('Appearance', [choose('variant', 'Variant', ['multi-browse', 'uncontained', 'hero', 'hero-center', 'full-screen'], 'multi-browse', 'select'), { ...range('cornerRadius', 'Corner radius', '28'), max: 48 }]),
      ...section('Layout', [{ ...range('itemWidth', 'Item width', '280'), min: 120, max: 480, step: 20 }, { ...range('gap', 'Gap', '8'), max: 32 }, { ...range('padding', 'Padding', '16'), max: 48 }]),
      ...section('Content', [toggle('captions', 'Captions', true), choose('initialSlide', 'Current slide', ['0', '1', '2', '3', '4'], '0', 'select')]),
      ...section('Behavior', [toggle('snap', 'Snap to items', true)]),
    ],
    config: (state: ComponentState): CarouselConfig => ({ variant: pick(state, 'variant', ['multi-browse', 'uncontained', 'hero', 'hero-center', 'full-screen'], 'multi-browse'), itemWidth: Number(state.itemWidth), gap: Number(state.gap), padding: Number(state.padding), cornerRadius: Number(state.cornerRadius), snap: bool(state, 'snap'), initialSlide: Number(state.initialSlide), ariaLabel: 'Places to explore', slides: ['Highlands', 'Coast', 'Desert', 'Forest', 'Lakeside'].map((title, index) => ({ image: landscape(index), alt: `Illustrated ${title.toLowerCase()} landscape`, ...(state.captions ? { title, description: 'Take a moment to explore' } : {}) })) }),
  },
  divider: {
    group: 'Containment', name: 'Divider', factory: 'createDivider', variable: 'divider',
    description: 'Separate related content. Explore orientation, insets, line weight, and color.',
    summary: 'A quiet boundary between sections.', styles: ['divider'],
    controls: [
      ...section('Appearance', [choose('variant', 'Variant', ['full-width', 'inset', 'middle-inset'], 'full-width', 'select'), choose('orientation', 'Orientation', ['horizontal', 'vertical'], 'horizontal'), { ...range('thickness', 'Thickness', '1'), min: 1, max: 8 }, choose('color', 'Color', ['outline-variant', 'outline', 'primary', 'secondary'], 'outline-variant', 'select')]),
      ...section('Layout', [{ ...range('insetStart', 'Start inset', '16'), max: 64 }, { ...range('insetEnd', 'End inset', '16'), max: 64 }]),
    ],
    config: (state: ComponentState): DividerConfig => ({ variant: pick(state, 'variant', ['full-width', 'inset', 'middle-inset'], 'full-width'), orientation: pick(state, 'orientation', ['horizontal', 'vertical'], 'horizontal'), thickness: Number(state.thickness), insetStart: Number(state.insetStart), insetEnd: Number(state.insetEnd), color: `var(--mtrl-sys-color-${string(state, 'color')})` }),
  },
  dialog: {
    group: 'Containment', name: 'Dialog', factory: 'createDialog', variable: 'dialog',
    description: 'Focus on a decision. Open a dialog to try its content, actions, and dismissal behavior.',
    summary: 'A focused surface for a task or decision.', styles: ['progress', 'button', 'divider', 'dialog'],
    controls: [
      ...section('Appearance', [choose('size', 'Size', ['small', 'medium', 'large', 'fullwidth', 'fullscreen'], 'small', 'select'), choose('animation', 'Animation', ['scale', 'slide-up', 'slide-down', 'fade'], 'scale', 'select'), toggle('divider', 'Dividers')]),
      ...section('Content', [text('title', 'Title', 'Save your changes?'), text('subtitle', 'Subtitle', ''), text('content', 'Body', 'Keep your changes before leaving this view.'), toggle('actions', 'Show actions', true), choose('footerAlignment', 'Action alignment', ['right', 'left', 'center', 'space-between'], 'right', 'select')]),
      ...section('Behavior', [toggle('open', 'Open'), toggle('closeButton', 'Close button', true), toggle('closeOnOverlayClick', 'Dismiss on scrim', true), toggle('closeOnEscape', 'Dismiss with Escape', true)]),
    ],
    config: (state: ComponentState): DialogConfig => ({ title: string(state, 'title'), subtitle: string(state, 'subtitle'), content: paragraph(string(state, 'content')), ariaLabel: string(state, 'title').trim() || 'Example dialog', size: string(state, 'size'), animation: string(state, 'animation'), divider: bool(state, 'divider'), open: bool(state, 'open'), closeButton: bool(state, 'closeButton'), closeOnOverlayClick: bool(state, 'closeOnOverlayClick'), closeOnEscape: bool(state, 'closeOnEscape'), footerAlignment: string(state, 'footerAlignment'), buttons: state.actions ? [{ text: 'Cancel', variant: 'text', closeDialog: true }, { text: 'Save', variant: 'filled', closeDialog: true }] : [] }),
  },
  'bottom-sheet': {
    group: 'Containment', name: 'Bottom sheet', factory: 'createBottomSheet', variable: 'sheet',
    description: 'Reveal more from the bottom edge. Try partial and expanded states, or drag the handle.',
    summary: 'Supporting content from the bottom edge.', styles: ['progress', 'button', 'bottom-sheet'],
    controls: [
      ...section('Appearance', [choose('variant', 'Variant', ['standard', 'modal'], 'modal'), toggle('dragHandle', 'Drag handle', true)]),
      ...section('Layout', [{ ...range('peekHeight', 'Peek height', '120'), min: 56, max: 240, step: 8 }, { ...range('maxWidth', 'Maximum width', '640'), min: 280, max: 640, step: 20 }]),
      ...section('Content', [text('title', 'Title', 'Plan your visit'), text('content', 'Body', 'Find a new trail, take in the view, and make time for a quiet moment.')]),
      ...section('Behavior', [choose('initialState', 'State', ['hidden', 'partial', 'expanded'], 'hidden', 'select'), toggle('closeOnScrimClick', 'Dismiss on scrim', true), toggle('closeOnEscape', 'Dismiss with Escape', true)]),
    ],
    config: (state: ComponentState): BottomSheetConfig => ({ variant: pick(state, 'variant', ['standard', 'modal'], 'modal'), initialState: pick(state, 'initialState', ['hidden', 'partial', 'expanded'], 'hidden'), dragHandle: bool(state, 'dragHandle'), peekHeight: Number(state.peekHeight), maxWidth: Number(state.maxWidth), title: string(state, 'title'), content: paragraph(string(state, 'content')), closeOnScrimClick: bool(state, 'closeOnScrimClick'), closeOnEscape: bool(state, 'closeOnEscape') }),
  },
  'side-sheet': {
    group: 'Containment', name: 'Side sheet', factory: 'createSideSheet', variable: 'sheet',
    description: 'Keep supporting details close by. Explore standard and modal sheets on either edge.',
    summary: 'Supporting details beside the main content.', styles: ['progress', 'button', 'side-sheet'],
    controls: [
      ...section('Appearance', [choose('variant', 'Variant', ['standard', 'modal'], 'modal')]),
      ...section('Layout', [choose('position', 'Position', ['start', 'end'], 'end'), { ...range('width', 'Width', '320'), min: 240, max: 400, step: 20 }]),
      ...section('Content', [text('title', 'Title', 'Details'), text('content', 'Body', 'A place for useful context, related information, and supporting actions.')]),
      ...section('Behavior', [toggle('open', 'Open'), toggle('closeButton', 'Close button', true), toggle('closeOnScrimClick', 'Dismiss on scrim', true), toggle('closeOnEscape', 'Dismiss with Escape', true)]),
    ],
    config: (state: ComponentState): SideSheetConfig => ({ variant: pick(state, 'variant', ['standard', 'modal'], 'modal'), position: pick(state, 'position', ['start', 'end'], 'end'), width: Number(state.width), title: string(state, 'title'), content: paragraph(string(state, 'content')), open: bool(state, 'open'), closeButton: bool(state, 'closeButton'), closeOnScrimClick: bool(state, 'closeOnScrimClick'), closeOnEscape: bool(state, 'closeOnEscape') }),
  },
  badge: {
    group: 'Communication', name: 'Badge', factory: 'createBadge', variable: 'badge',
    description: 'Draw attention to something new. Try dots, counts, and labels attached to an action.',
    summary: 'A small signal for updates and counts.', styles: ['icon-button', 'badge'],
    controls: [
      ...section('Appearance', [choose('variant', 'Variant', ['small', 'large'], 'large'), choose('color', 'Color', ['error', 'primary', 'secondary', 'tertiary', 'success', 'warning', 'info'], 'error', 'select'), choose('position', 'Position', ['top-right', 'top-left', 'bottom-right', 'bottom-left'], 'top-right', 'select')]),
      ...section('Content', [{ ...text('label', 'Label', '8'), enabledWhen: 'hasLabel' }, { ...choose('max', 'Maximum count', ['9', '99', '999'], '99'), enabledWhen: 'hasLabel' }]),
      ...section('Behavior', [toggle('visible', 'Visible', true)]),
    ],
    config: (state: ComponentState): BadgeConfig => ({ variant: string(state, 'variant'), color: string(state, 'color'), position: string(state, 'position'), label: string(state, 'label'), max: Number(state.max), visible: bool(state, 'visible') }),
  },
  progress: {
    group: 'Communication', name: 'Progress', factory: 'createProgress', variable: 'progress',
    description: 'Show how a task is progressing. Compare linear and circular indicators, with flat or wavy shapes.',
    summary: 'Linear and circular progress, flat or wavy.', styles: ['progress'],
    controls: [
      ...section('Appearance', [choose('variant', 'Variant', ['linear', 'circular'], 'linear'), choose('shape', 'Shape', ['flat', 'wavy'], 'flat'), choose('thickness', 'Thickness', ['thin', 'thick'], 'thin'), { ...range('size', 'Circular size', '48'), min: 24, max: 240, step: 8, enabledWhen: 'circular' }, toggle('showStopIndicator', 'Stop indicator', true, 'linear')]),
      ...section('Content', [{ ...range('value', 'Value', '45'), enabledWhen: 'determinate' }, { ...range('buffer', 'Buffer', '70'), enabledWhen: 'linearDeterminate' }, toggle('showLabel', 'Show percentage', false, 'determinate'), text('ariaLabel', 'Accessible label', 'Uploading files')]),
      ...section('Behavior', [toggle('indeterminate', 'Indeterminate'), disabled]),
    ],
    config: (state: ComponentState): ProgressConfig => ({ variant: pick(state, 'variant', ['linear', 'circular'], 'linear'), shape: pick(state, 'shape', ['flat', 'wavy'], 'flat'), thickness: pick(state, 'thickness', ['thin', 'thick'], 'thin'), ...(state.variant === 'circular' ? { size: Number(state.size) } : {}), value: Number(state.value), max: 100, buffer: state.variant === 'linear' ? Number(state.buffer) : 0, showStopIndicator: bool(state, 'showStopIndicator'), showLabel: !state.indeterminate && bool(state, 'showLabel'), indeterminate: bool(state, 'indeterminate'), disabled: bool(state, 'disabled'), ariaLabel: string(state, 'ariaLabel').trim() || 'Uploading files' }),
  },
  'loading-indicator': {
    group: 'Communication', name: 'Loading indicator', factory: 'createLoadingIndicator', variable: 'indicator',
    description: 'Give short waits a little expression. Explore the morphing shape with or without its container.',
    summary: 'An expressive shape for short waits.', styles: ['loading-indicator'],
    controls: [
      ...section('Appearance', [toggle('contained', 'Contained'), { ...range('size', 'Size', '48'), min: 24, max: 240, step: 8 }]),
      ...section('Content', [{ ...range('value', 'Value', '50'), enabledWhen: 'determinate' }, text('ariaLabel', 'Accessible label', 'Loading your content')]),
      ...section('Behavior', [toggle('indeterminate', 'Indeterminate', true)]),
    ],
    config: (state: ComponentState): LoadingIndicatorConfig => ({ size: Number(state.size), contained: bool(state, 'contained'), value: state.indeterminate ? null : Number(state.value) / 100, ariaLabel: string(state, 'ariaLabel').trim() || 'Loading your content' }),
  },
  snackbar: {
    group: 'Communication', name: 'Snackbar', factory: 'createSnackbar', variable: 'snackbar',
    description: 'Confirm an action without interrupting. Show a message, offer an undo, and try dismissal behavior.',
    summary: 'Brief feedback with an optional action.', styles: ['progress', 'button', 'icon-button', 'snackbar'],
    controls: [
      ...section('Layout', [choose('position', 'Position', ['start', 'center', 'end'], 'center')]),
      ...section('Content', [text('message', 'Message', 'Your changes have been saved.'), toggle('hasAction', 'Show action', true), { ...text('action', 'Action text', 'Undo'), enabledWhen: 'hasAction' }, { ...text('closeLabel', 'Dismiss label', 'Dismiss'), enabledWhen: 'dismissible' }]),
      ...section('Behavior', [choose('duration', 'Duration', ['short', 'long', 'indefinite'], 'indefinite', 'select'), toggle('dismissible', 'Close button', true), toggle('visible', 'Visible')]),
    ],
    config: (state: ComponentState): SnackbarConfig => ({ message: string(state, 'message').trim() || 'Your changes have been saved.', ...(state.hasAction ? { action: string(state, 'action') } : {}), closeLabel: string(state, 'closeLabel').trim() || 'Dismiss', position: pick(state, 'position', ['start', 'center', 'end'], 'center'), duration: pick(state, 'duration', ['short', 'long', 'indefinite'], 'indefinite'), dismissible: bool(state, 'dismissible') }),
  },
  tooltip: {
    group: 'Communication', name: 'Tooltip', factory: 'createTooltip', variable: 'tooltip',
    description: 'Add a little context. Hover or focus the action to explore tooltip styles, placement, and timing.',
    summary: 'Extra context on hover or focus.', styles: ['icon-button', 'tooltip'],
    controls: [
      ...section('Appearance', [choose('variant', 'Variant', ['default', 'plain', 'rich'], 'default'), choose('position', 'Position', ['top', 'right', 'bottom', 'left', 'top-start', 'top-end', 'right-start', 'right-end', 'bottom-start', 'bottom-end', 'left-start', 'left-end'], 'bottom', 'select')]),
      ...section('Content', [text('text', 'Text', 'Save to favorites')]),
      ...section('Behavior', [toggle('visible', 'Visible'), toggle('showOnHover', 'Show on hover', true), toggle('showOnFocus', 'Show on focus', true), { ...range('showDelay', 'Show delay (ms)', '300'), max: 1500, step: 100 }, { ...range('hideDelay', 'Hide delay (ms)', '100'), max: 1500, step: 100 }]),
    ],
    config: (state: ComponentState): TooltipConfig => ({ text: string(state, 'text'), variant: string(state, 'variant'), position: string(state, 'position'), visible: bool(state, 'visible'), showDelay: Number(state.showDelay), hideDelay: Number(state.hideDelay), showOnFocus: bool(state, 'showOnFocus'), showOnHover: bool(state, 'showOnHover') }),
  },
};
export type ComponentSlug = keyof typeof components;
export const componentSlugs = Object.keys(components) as ComponentSlug[];
export const playgroundGroups = [...new Set(componentSlugs.map(slug => components[slug].group))].map(label => ({
  label, slugs: componentSlugs.filter(slug => components[slug].group === label),
}));
export const isComponent = (slug: string): slug is ComponentSlug => Object.hasOwn(components, slug);
export function normalizeComponentState(slug: ComponentSlug, input: unknown): ComponentState {
  const raw = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const state: ComponentState = {};
  for (const control of components[slug].controls as Control[]) {
    const value = raw[control.key];
    state[control.key] = control.kind === 'toggle' ? value === true
      : control.options ? control.options.find(option => option === value) ?? control.initial
      : typeof value === 'string' ? value.slice(0, 80) : control.initial;
  }
  for (const control of components[slug].controls as Control[]) {
    if (control.kind === 'range') {
      const value = Number(state[control.key]);
      state[control.key] = String(Number.isFinite(value) ? Math.min(control.max!, Math.max(control.min!, value)) : control.initial);
    }
    if (control.kind === 'date' && !(slug === 'datepicker' && ['value', 'endDate'].includes(control.key) && state[control.key] === '') && !/^\d{4}-\d{2}-\d{2}$/.test(String(state[control.key]))) state[control.key] = control.initial;
    if (control.kind === 'time' && !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(String(state[control.key]))) state[control.key] = control.initial;
  }
  if (['navigation-rail', 'drawer', 'tabs'].includes(slug) && state.disableSent && state.active === 'sent') state.active = 'inbox';
  if (slug === 'tabs' && state.count === '3' && ['drafts', 'archive', 'trash'].includes(String(state.active))) state.active = 'inbox';
  if (slug === 'badge') state.hasLabel = state.variant === 'large';
  if (slug === 'progress' || slug === 'loading-indicator') state.determinate = !state.indeterminate;
  if (slug === 'progress') {
    state.circular = state.variant === 'circular';
    state.linear = !state.circular;
    state.linearDeterminate = state.linear && state.determinate;
  }
  if (slug === 'list') {
    state.hasSupporting = state.lines !== '1';
    state.threeLines = state.lines === '3';
    state.selectable = state.selection !== 'none';
    state.extraSelectable = state.selectable && state.count === '5';
    let selected = false;
    ['first', 'second', 'third', 'fourth', 'fifth'].forEach((key, index) => {
      const keep = !!state[key] && state.selection !== 'none' && index < Number(state.count) && (state.selection === 'multi' || !selected);
      selected ||= keep;
      state[key] = keep;
    });
  }
  if (slug === 'slider') {
    state.range = state.variant === 'range';
    // Inset icons are for standard sliders at M, L and XL (m3.material.io guidelines).
    state.insetIconAllowed = state.variant === 'standard' && ['M', 'L', 'XL'].includes(String(state.size));
    const step = Number(state.step);
    state.value = String(Math.round(Number(state.value) / step) * step);
    state.secondValue = String(Math.max(Number(state.value), Math.round(Number(state.secondValue) / step) * step));
  }
  if (slug === 'chips') {
    state.selectable = state.type === 'filter' || state.type === 'input';
    state.elevatedAllowed = state.type !== 'input';
    state.inputType = state.type === 'input';
  }
  if (slug === 'chips' && !state.multiSelect) {
    let selected = false;
    for (const key of ['hiking', 'music', 'food']) { const keep: boolean = !!state[key] && !selected; selected ||= keep; state[key] = keep; }
  }
  if (slug === 'datepicker' && state.value && state.endDate && String(state.endDate) < String(state.value)) state.endDate = state.value!;
  if (slug === 'radios' && state.disableExpress && state.value === 'express') state.value = 'standard';
  if (slug === 'select' && state.disableBanana && state.value === 'banana') state.value = 'apple';
  state.theme = themes.find(theme => theme === raw.theme) ?? 'baseline';
  state.mode = raw.mode === 'dark' ? 'dark' : 'light';
  return state;
}
export function initialComponentState(slug: ComponentSlug): ComponentState {
  return normalizeComponentState(slug, Object.fromEntries(components[slug].controls.map(control => [control.key, control.initial])));
}
export function componentCode(slug: ComponentSlug, state: ComponentState): string {
  if (components[slug].group === 'Navigation') return navigationCode(slug, state);
  if (components[slug].group === 'Containment') return containmentCode(slug, state);
  if (components[slug].group === 'Communication') return communicationCode(slug, state);
  const component = components[slug];
  const config = JSON.stringify(component.config(state), null, 2).replace(/^(\s*)"([a-zA-Z]+)":/gm, '$1$2:');
  const checkboxSetup = slug === 'checkbox'
    ? `${!string(state, 'label').trim() ? "checkbox.input.setAttribute('aria-label', 'Checkbox');\n" : ''}` +
      `// Clear mixed state for keyboard changes as well as clicks.\ncheckbox.on('change', () => checkbox.setIndeterminate(false));\n`
    : '';
  const setup = checkboxSetup + (
    slug === 'radios' ? `radios.element.setAttribute('aria-label', 'Delivery method');\n` :
    slug === 'textfield' && !string(state, 'label').trim() ? `textfield.input.setAttribute('aria-label', 'Text field');\n` :
    slug === 'select' && !string(state, 'label').trim() ? `select.textfield.input.setAttribute('aria-label', 'Select an option');\n` :
    slug === 'timepicker' ? `const openButton = createButton({ text: 'Choose time', variant: 'tonal' });\nopenButton.on('click', () => timePicker.open());\ntimePicker.element.append(openButton.element);\n` : '');
  const calls = `${state.collapsed === true ? `${component.variable}.collapse();\n` : ''}${state.lowered === true ? `${component.variable}.lower();\n` : ''}`;
  const styles = component.styles.includes('full') ? "import 'mtrl/styles';\n" : ["base", ...component.styles].map(style => `import 'mtrl/styles/${style}';\n`).join('');
  return `import { ${component.factory}${slug === 'timepicker' ? ', createButton' : ''} } from 'mtrl';\n${styles}${state.theme === 'baseline' ? '' : `import 'mtrl/themes/${state.theme}';\n`}\n` +
    `document.documentElement.dataset.theme = '${state.theme}';\ndocument.documentElement.dataset.themeMode = '${state.mode}';\n\n` +
    `const ${component.variable} = ${component.factory}(${config});\n${calls}${setup}\ndocument.body.append(${component.variable}.element);\n\n// When the view is removed:\n${slug === 'timepicker' ? '// openButton.destroy();\n' : ''}// ${component.variable}.destroy();\n`;
}

function navigationCode(slug: ComponentSlug, state: ComponentState): string {
  const component = components[slug];
  const literal = (value: unknown) => JSON.stringify(value, null, 2).replace(/^(\s*)"([a-zA-Z]+)":/gm, '$1$2:');
  const imports = [component.factory];
  let before = '';
  let after = '';
  let cleanup = '';
  if (slug === 'menu') {
    imports.push('createButton');
    before = `const trigger = createButton(${literal({ text: state.text, variant: 'tonal', ariaLabel: String(state.text).trim() || 'Open menu' })});\ntrigger.element.id = 'menu-trigger';\ndocument.body.append(trigger.element);\n\n`;
    after = `menu.on('select', event => console.log(event.item.text));\n`;
    cleanup = '// trigger.destroy();\n';
  }
  if (slug === 'drawer' || slug === 'navigation-rail') {
    imports.push('createButton');
    const method = slug === 'drawer' ? 'open' : 'expand';
    after = `const trigger = createButton({ text: 'Open ${slug === 'drawer' ? 'drawer' : 'navigation'}', variant: 'tonal' });\ntrigger.on('click', () => ${component.variable}.${method}());\ndocument.body.append(trigger.element);\n${component.variable}.on('select', event => console.log(event.id));\n`;
    cleanup = '// trigger.destroy();\n';
  }
  if (slug === 'tabs') after = `tabs.element.setAttribute('aria-label', 'Mailbox views');\n${!state.scrollable ? "// Keep fixed tabs in a horizontal row with the current stylesheet.\ntabs.element.style.flexDirection = 'row';\n" : ''}tabs.on('change', event => console.log(event.value));\n`;
  if (slug === 'top-app-bar' || slug === 'bottom-app-bar') {
    imports.push('createIconButton');
    after = `const actions = ${literal(appBarActions(state))}.map(config => createIconButton(config));\nactions.forEach(button => ${component.variable}.${slug === 'top-app-bar' ? 'addTrailingElement' : 'addAction'}(button.element));\n`;
    cleanup = '// actions.forEach(button => button.destroy());\n';
    if (slug === 'top-app-bar') {
      if (state.leading) {
        after += `const navigation = createIconButton(${literal({ icon: componentIcons.menu, ariaLabel: 'Open navigation' })});\ntopBar.addLeadingElement(navigation.element);\n`;
        cleanup += '// navigation.destroy();\n';
      }
      after += `topBar.setScrollState(${state.scrolled});\n`;
    } else {
      if (state.hasFab) {
        imports.push('createFab');
        after += `const fab = createFab(${literal({ icon: componentIcons.add, ariaLabel: String(state.fabLabel).trim() || 'Compose' })});\nbottomBar.addFab(fab.element);\n`;
        cleanup += '// fab.destroy();\n';
      }
      if (!state.visible) after += 'bottomBar.hide();\n';
    }
  }
  const styles = ['base', ...component.styles].map(style => `import 'mtrl/styles/${style}';\n`).join('');
  return `import { ${imports.join(', ')} } from 'mtrl';\n${styles}${state.theme === 'baseline' ? '' : `import 'mtrl/themes/${state.theme}';\n`}\n` +
    `document.documentElement.dataset.theme = '${state.theme}';\ndocument.documentElement.dataset.themeMode = '${state.mode}';\n\n` +
    `${before}const ${component.variable} = ${component.factory}(${literal(component.config(state))});\n${after}\ndocument.body.append(${component.variable}.element);\n\n// When the view is removed:\n${cleanup}// ${component.variable}.destroy();\n`;
}

function communicationCode(slug: ComponentSlug, state: ComponentState): string {
  const component = components[slug];
  const literal = (value: unknown) => JSON.stringify(value, null, 2).replace(/^(\s*)"([a-zA-Z]+)":/gm, '$1$2:');
  const hasTarget = slug === 'badge' || slug === 'tooltip';
  const styles = ['base', ...component.styles].map(style => `import 'mtrl/styles/${style}';\n`).join('');
  let before = '';
  let config = literal(component.config(state));
  let after = `document.body.append(${component.variable}.element);\n`;
  let cleanup = '';
  if (hasTarget) {
    before = `const target = createIconButton(${literal({ icon: componentIcons[slug === 'badge' ? 'inbox' : 'heart'], ariaLabel: slug === 'badge' ? 'Inbox' : 'Favorite', variant: 'tonal' })});\ndocument.body.append(target.element);\n\n`;
    config = config.replace(/\n}$/, ',\n  target: target.element\n}');
    after = '';
    cleanup = '// target.destroy();\n';
  } else if (slug === 'snackbar') {
    after = "const trigger = createButton({ text: 'Show snackbar', variant: 'tonal' });\ntrigger.on('click', () => snackbar.show());\ndocument.body.append(trigger.element);\n" + (state.visible ? 'snackbar.show();\n' : '');
    cleanup = '// trigger.destroy();\n';
  } else if (slug === 'progress' && state.variant === 'linear') {
    after = "progress.element.style.width = 'min(100%, 360px)';\n" + after;
  }
  return `import { ${component.factory}${hasTarget ? ', createIconButton' : slug === 'snackbar' ? ', createButton' : ''} } from 'mtrl';\n${styles}${state.theme === 'baseline' ? '' : `import 'mtrl/themes/${state.theme}';\n`}\n` +
    `document.documentElement.dataset.theme = '${state.theme}';\ndocument.documentElement.dataset.themeMode = '${state.mode}';\n\n` +
    `${before}const ${component.variable} = ${component.factory}(${config});\n${after}\n// When the view is removed:\n${slug === 'snackbar' ? '// snackbar.hide();\n' : ''}// ${component.variable}.destroy();\n${cleanup}`;
}

function containmentCode(slug: ComponentSlug, state: ComponentState): string {
  const component = components[slug];
  const hasTrigger = ['dialog', 'bottom-sheet', 'side-sheet'].includes(slug);
  const config = JSON.stringify(component.config(state), null, 2).replace(/^(\s*)"([a-zA-Z]+)":/gm, '$1$2:');
  const styles = ['base', ...component.styles].map(style => `import 'mtrl/styles/${style}';\n`).join('');
  let setup = '';
  if (slug === 'list' && state.trailing === 'control') setup += `const onListAction = (event) => {\n  const action = event.target.closest('[data-list-action]');\n  if (action) console.log('Saved:', action.dataset.listAction);\n};\nlist.element.addEventListener('click', onListAction);\n`;
  if (hasTrigger) setup = `const trigger = createButton({ text: 'Open ${component.name.toLowerCase()}', variant: 'tonal' });\ntrigger.on('click', () => ${component.variable}.${slug === 'bottom-sheet' ? 'expand' : 'open'}());\ndocument.body.append(trigger.element);\n`;
  else {
    if (slug === 'divider') setup += `const container = document.createElement('div');\ncontainer.style.cssText = 'display:flex;align-items:center;width:100%;max-width:400px;flex-direction:${state.orientation === 'vertical' ? 'column' : 'row'};${state.orientation === 'vertical' ? 'height:200px;' : ''}';\ndivider.element.style.flex = '1';\ncontainer.append(divider.element);\ndocument.body.append(container);\n`;
    if (slug === 'carousel') setup += "// A carousel needs a container with a defined height.\ncarousel.element.style.height = '320px';\n";
    if (slug !== 'divider') setup += `document.body.append(${component.variable}.element);\n`;
  }
  return `import { ${component.factory}${hasTrigger ? ', createButton' : ''} } from 'mtrl';\n${styles}${state.theme === 'baseline' ? '' : `import 'mtrl/themes/${state.theme}';\n`}\n` +
    `document.documentElement.dataset.theme = '${state.theme}';\ndocument.documentElement.dataset.themeMode = '${state.mode}';\n\n` +
    `${slug === 'card' && state.media || slug === 'carousel' || slug === 'list' && ['image', 'video'].includes(String(state.leading)) ? '// Replace the demo image paths with your own images.\n' : ''}const ${component.variable} = ${component.factory}(${config});\n${setup}\n// When the view is removed:\n// ${component.variable}.destroy();\n${slug === 'list' && state.trailing === 'control' ? '// list.element.removeEventListener(\'click\', onListAction);\n' : hasTrigger ? '// trigger.destroy();\n' : slug === 'divider' ? '// container.remove();\n' : ''}`;
}
