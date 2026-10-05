// The text field's playground content: its trailing-button behaviour, its scenarios
// and its registry entry, moved from src/shared/components.ts.
import type { TextFieldConfig } from 'material/components/text-field';
import { type ComponentState, type Scenario, bool, choose, disabled, icon, iconByName, iconMarkup, range, section, string, text, toggle } from './types';

/** What a labelled trailing icon does on the text field. */
export type TrailingBehaviour = 'clear' | 'show-password';
/**
 * The behaviour of the text field's trailing button, from the trailing icon control's value:
 * the stable key, so a label a visitor types cannot turn an arbitrary icon into a clear
 * button or a password toggle. The label stays what it is in the config — the button's
 * accessible name — and the icon, not the label, decides what activating it does. One
 * behaviour per icon, shared by the preview and by the generator rule below.
 */
export function trailingBehaviour(state: ComponentState): TrailingBehaviour | undefined {
  const icon = string(state, 'trailingIcon');
  if (icon === 'close') return 'clear';
  if (icon === 'visibility') return 'show-password';
  return undefined;
}
/**
 * The text field's scenarios, from m3.material.io (read 3 October 2026). Options name
 * playground controls only; applying one is `normalizeComponentState(slug, { ...initials,
 * ...options })`. The password's show or hide button rides on the 3.0.0 factory's
 * `trailingIconLabel`; the element has no `trailing-icon-label` attribute yet, so the
 * element tabs' snippet cannot name the button, and the description says so.
 */
const textFieldScenarios: readonly Scenario[] = [
  {
    id: 'amount', name: 'Amount', source: 'https://m3.material.io/components/text-fields/guidelines',
    description: 'An amount with a dollar prefix and a USD suffix.',
    options: { type: 'number', label: 'Amount', prefixText: '$', suffixText: 'USD', placeholder: '', supportingText: '', value: '', icon: 'none' },
  },
  {
    id: 'password', name: 'Password', source: 'https://m3.material.io/components/text-fields/accessibility',
    description: 'A password with a show or hide button. In the element, the button\'s label waits on `trailing-icon-label`, 3.1.0.',
    options: { type: 'password', label: 'Password', placeholder: '', supportingText: '', value: '', icon: 'none', trailingIcon: 'visibility', trailingIconLabel: 'Show password' },
  },
  {
    id: 'email', name: 'Email', source: 'https://m3.material.io/components/text-fields/guidelines',
    description: 'An email address in error, with a leading icon.',
    options: { type: 'email', label: 'Email', icon: 'mail', trailingIcon: 'error', error: true, supportingText: 'Enter an email address', placeholder: '', value: '' },
  },
  {
    id: 'search', name: 'Search', source: 'https://m3.material.io/components/text-fields/guidelines',
    description: 'A search field with a clear button.',
    options: { type: 'search', label: 'Search', value: 'Trail', placeholder: '', supportingText: '', icon: 'none', trailingIcon: 'close', trailingIconLabel: 'Clear' },
  },
  {
    id: 'message', name: 'Message', source: 'https://m3.material.io/components/text-fields/guidelines',
    description: 'A multiline message with a character counter.',
    options: { type: 'multiline', label: 'Message', value: 'Hello', placeholder: '', supportingText: '', maxLength: '200' },
  },
];
export const textFieldComponent = {
  group: 'Selection & input', name: 'Text field', factory: 'createTextField', variable: 'textField',
  description: 'Enter text with helpful context. Explore field styles, input types, icons, and validation states.',
  summary: 'Text entry with labels and feedback.', styles: ['text-field'],
  scenarios: textFieldScenarios,
  controls: [
    ...section('Appearance', [choose('variant', 'Variant', ['filled', 'outlined'], 'outlined'), choose('density', 'Density', ['default', 'compact'], 'default'), icon(['none', 'heart', 'edit', 'send', 'mail', 'search'], 'none'),
      choose('trailingIcon', 'Trailing icon', ['none', 'close', 'error', 'visibility'], 'none', 'icons'), { ...text('trailingIconLabel', 'Trailing icon label', ''), enabledWhen: 'hasTrailingIcon' }]),
    ...section('Content', [choose('type', 'Input type', ['text', 'password', 'email', 'number', 'tel', 'url', 'search', 'multiline'], 'text', 'select'), text('label', 'Label', 'Name'), text('value', 'Value', ''), text('placeholder', 'Placeholder', 'Enter your name'), text('prefixText', 'Prefix', ''), text('suffixText', 'Suffix', ''), text('supportingText', 'Supporting text', 'As you would like it displayed'),
      { ...range('maxLength', 'Maximum length', '0'), max: 500, step: 10 }]),
    ...section('Behavior', [toggle('error', 'Error'), toggle('required', 'Required'), toggle('readonly', 'Read only'), disabled]),
  ],
  config: (state: ComponentState): TextFieldConfig => ({ variant: string(state, 'variant'), density: string(state, 'density'), type: string(state, 'type'), label: string(state, 'label'),
    value: string(state, 'value'), placeholder: string(state, 'placeholder'), supportingText: string(state, 'supportingText'), name: 'name', ...(iconMarkup(state) ? { leadingIcon: iconMarkup(state) } : {}),
    // A trailing icon is decorative until it has a label, which makes it a button emitting `trailing` (clear, show password)
    ...(iconByName(string(state, 'trailingIcon')) ? { trailingIcon: iconByName(string(state, 'trailingIcon')) } : {}),
    ...(iconByName(string(state, 'trailingIcon')) && string(state, 'trailingIconLabel').trim() ? { trailingIconLabel: string(state, 'trailingIconLabel').trim() } : {}),
    // Prefix and suffix text ("$", "kg") sit beside the input; only set when given, so the default field has neither
    ...(string(state, 'prefixText') ? { prefixText: string(state, 'prefixText') } : {}), ...(string(state, 'suffixText') ? { suffixText: string(state, 'suffixText') } : {}),
    // The counter shows `count/max` while the input has a maxlength; 0 leaves the field unlimited
    ...(Number(state.maxLength) > 0 ? { maxLength: Number(state.maxLength) } : {}),
    error: bool(state, 'error'), required: bool(state, 'required'), readonly: bool(state, 'readonly'), disabled: bool(state, 'disabled') }),
};
