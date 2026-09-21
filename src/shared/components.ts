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
import { buttonConfig, icons as buttonIcons, normalizeState, sizes, themes, variants } from './button';

const svg = (path: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
export const componentIcons: Record<string, string> = {
  ...buttonIcons,
  add: svg('<path d="M12 5v14M5 12h14"/>'),
  edit: svg('<path d="m16 3 5 5-12 12-6 1 1-6ZM14 5l5 5"/>'),
  bold: svg('<path d="M7 4h6a4 4 0 0 1 0 8H7V4Zm0 8h7a4 4 0 0 1 0 8H7v-8Z"/>'),
  italic: svg('<path d="M10 4h10M4 20h10M15 4 9 20"/>'),
  underline: svg('<path d="M6 3v7a6 6 0 0 0 12 0V3M4 21h16"/>'),
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
const localDate = (value: string | boolean | undefined) => `${value}T12:00:00`;
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
    description: 'Explore compact choices and actions. Try chip variants, icons, and single or multiple selection.',
    summary: 'Compact choices, filters, and actions.', styles: ['chips'],
    controls: [
      ...section('Appearance', [choose('variant', 'Variant', ['assist', 'filter', 'input', 'suggestion', 'filled', 'outlined', 'elevated'], 'filter', 'select'), toggle('vertical', 'Vertical layout'), toggle('icons', 'Leading icons')]),
      ...section('Content', [text('label', 'Group label', 'Interests')]),
      ...section('Behavior', [toggle('multiSelect', 'Multiple selection', true), toggle('hiking', 'Hiking selected', true), toggle('music', 'Music selected'), toggle('food', 'Food selected'), disabled]),
    ],
    config: (state: ComponentState): ChipsConfig => ({ label: string(state, 'label'), vertical: bool(state, 'vertical'), multiSelect: bool(state, 'multiSelect'),
      chips: ['hiking', 'music', 'food'].map((value, index) => ({ value, text: ['Hiking', 'Music', 'Food'][index], variant: string(state, 'variant'), selected: bool(state, value), disabled: bool(state, 'disabled'),
        ...(bool(state, 'icons') ? { leadingIcon: componentIcons.heart } : {}) })) }),
  },
  slider: {
    group: 'Selection & input', name: 'Slider', factory: 'createSlider', variable: 'slider',
    description: 'Choose a value or a range. Explore track sizes, steps, colors, and value indicators.',
    summary: 'Values and ranges along a track.', styles: ['slider'],
    controls: [
      ...section('Appearance', [choose('size', 'Size', ['XS', 'S', 'M', 'L', 'XL'], 'XS'), choose('color', 'Color', ['primary', 'secondary', 'tertiary', 'error'], 'primary', 'select'), toggle('ticks', 'Tick marks'), toggle('showValue', 'Value indicator', true)]),
      ...section('Content', [text('label', 'Label', 'Volume'), range('value', 'Value', '40'), { ...range('secondValue', 'Range end', '80'), enabledWhen: 'range' }]),
      ...section('Behavior', [toggle('range', 'Range slider'), choose('step', 'Step', ['1', '5', '10'], '1'), disabled]),
    ],
    config: (state: ComponentState): SliderConfig => ({ min: 0, max: 100, value: Number(state.value), ...(bool(state, 'range') ? { secondValue: Number(state.secondValue) } : {}),
      step: Number(state.step), range: bool(state, 'range'), size: pick(state, 'size', ['XS', 'S', 'M', 'L', 'XL'], 'XS'), color: pick(state, 'color', ['primary', 'secondary', 'tertiary', 'error'], 'primary'),
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
    description: 'Choose a date or a range. Open the calendar to explore month, year, and modal views.',
    summary: 'Dates and ranges from a calendar.', styles: ['full'],
    controls: [
      ...section('Appearance', [choose('variant', 'Variant', ['docked', 'modal', 'modal-input'], 'docked', 'select'), choose('initialView', 'Initial view', ['day', 'month', 'year'], 'day')]),
      ...section('Content', [text('label', 'Accessible label', 'Choose a date'), date('value', 'Date', '2026-09-21'), { ...date('endDate', 'Range end', '2026-09-25'), enabledWhen: 'range' }, choose('dateFormat', 'Date format', ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], 'MM/DD/YYYY', 'select')]),
      ...section('Behavior', [toggle('range', 'Date range'), toggle('closeOnSelect', 'Close on selection', true), disabled]),
    ],
    config: (state: ComponentState): DatePickerConfig => ({ variant: string(state, 'variant'), initialView: string(state, 'initialView'), selectionMode: bool(state, 'range') ? 'range' : 'single',
      value: bool(state, 'range') ? [localDate(state.value), localDate(state.endDate)] : localDate(state.value), dateFormat: string(state, 'dateFormat'),
      label: string(state, 'label'), closeOnSelect: bool(state, 'closeOnSelect'), disabled: bool(state, 'disabled') }),
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
    if (control.kind === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(String(state[control.key]))) state[control.key] = control.initial;
    if (control.kind === 'time' && !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(String(state[control.key]))) state[control.key] = control.initial;
  }
  if (slug === 'slider') {
    const step = Number(state.step);
    state.value = String(Math.round(Number(state.value) / step) * step);
    state.secondValue = String(Math.max(Number(state.value), Math.round(Number(state.secondValue) / step) * step));
  }
  if (slug === 'chips' && !state.multiSelect) {
    let selected = false;
    for (const key of ['hiking', 'music', 'food']) { const keep: boolean = !!state[key] && !selected; selected ||= keep; state[key] = keep; }
  }
  if (slug === 'datepicker' && String(state.endDate) < String(state.value)) state.endDate = state.value!;
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
    slug === 'datepicker' ? `datePicker.input.setAttribute('aria-label', ${JSON.stringify(string(state, 'label').trim() || 'Choose a date')});\n` +
      `// Compatibility with the current calendar renderer's boolean attributes.\nconst syncCalendarButtons = () => {\n  datePicker.element.querySelectorAll('button[disabled="false"]').forEach(button => button.removeAttribute('disabled'));\n};\nconst calendarObserver = new MutationObserver(syncCalendarButtons);\ncalendarObserver.observe(datePicker.element, { childList: true, subtree: true });\nsyncCalendarButtons();\n` +
      (state.closeOnSelect ? `// Refresh calendar visibility after a completed selection.\ndatePicker.on('change', () => {\n  ${state.range ? 'if (Array.isArray(datePicker.getValue())) ' : ''}datePicker.close();\n});\n` : '') :
    slug === 'timepicker' ? `const openButton = createButton({ text: 'Choose time', variant: 'tonal' });\nopenButton.on('click', () => timePicker.open());\ntimePicker.element.append(openButton.element);\n` : '');
  const calls = `${state.collapsed === true ? `${component.variable}.collapse();\n` : ''}${state.lowered === true ? `${component.variable}.lower();\n` : ''}`;
  const styles = component.styles.includes('full') ? "import 'mtrl/styles';\n" : ["base", ...component.styles].map(style => `import 'mtrl/styles/${style}';\n`).join('');
  return `import { ${component.factory}${slug === 'timepicker' ? ', createButton' : ''} } from 'mtrl';\n${styles}${state.theme === 'baseline' ? '' : `import 'mtrl/themes/${state.theme}';\n`}\n` +
    `document.documentElement.dataset.theme = '${state.theme}';\ndocument.documentElement.dataset.themeMode = '${state.mode}';\n\n` +
    `const ${component.variable} = ${component.factory}(${config});\n${calls}${setup}\ndocument.body.append(${component.variable}.element);\n\n// When the view is removed:\n${slug === 'timepicker' ? '// openButton.destroy();\n' : slug === 'datepicker' ? '// calendarObserver.disconnect();\n' : ''}// ${component.variable}.destroy();\n`;
}
