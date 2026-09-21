import createSwitch from 'mtrl/components/switch';
import createRadios from 'mtrl/components/radios';
import createSlider from 'mtrl/components/slider';
import createTextfield from 'mtrl/components/textfield';
import createSelect from 'mtrl/components/select';
import createSearch from 'mtrl/components/search';
import createDatePicker from 'mtrl/components/datepicker';
import createTimePicker from 'mtrl/components/timepicker';
import { createChips } from 'mtrl/components/chips';
import createCheckbox from 'mtrl/components/checkbox';
import createButton from 'mtrl/components/button';
import createIconButton from 'mtrl/components/icon-button';
import createButtonGroup from 'mtrl/components/button-group';
import createSplitButton from 'mtrl/components/split-button';
import createFab from 'mtrl/components/fab';
import createExtendedFab from 'mtrl/components/extended-fab';
import { components, initialComponentState, isComponent, normalizeComponentState, type ComponentState } from '../shared/components';

const componentSlug = document.documentElement.dataset.component!;
if (!isComponent(componentSlug)) throw new Error('Unknown component');
const slug = componentSlug;
let component: { element: HTMLElement; destroy: () => void } | undefined;
let current: ComponentState | undefined;
let clicks = 0;
let disposing = false;
const stage = document.querySelector<HTMLElement>('#stage')!;
const post = (data: Record<string, unknown>) => { if (!disposing) parent.postMessage(data, location.origin); };
const clicked = () => post({ type: 'md3:click', count: ++clicks });
const message = (value: string) => post({ type: 'md3:event', message: value });

const sync = (values: ComponentState) => {
  if (disposing) return;
  if (current) Object.assign(current, values);
  post({ type: 'md3:values', values });
};
const dateValue = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
function create(state: ComponentState) {
  switch (slug) {
    case 'switch': {
      const control = createSwitch(components.switch.config(state));
      control.on('change', () => { sync({ checked: control.isChecked() }); message(control.isChecked() ? 'Switch on' : 'Switch off'); });
      return control;
    }
    case 'radios': {
      const control = createRadios(components.radios.config(state));
      control.element.setAttribute('aria-label', 'Delivery method');
      control.on('change', () => { sync({ value: control.getValue() }); message(`Selected: ${control.getSelected()?.label}`); });
      return control;
    }
    case 'chips': {
      const control = createChips(components.chips.config(state));
      control.on('change', () => {
        const values = control.getSelectedValues();
        sync(Object.fromEntries(['hiking', 'music', 'food'].map(value => [value, values.includes(value)])));
        message(values.length ? `Selected: ${values.join(', ')}` : 'Selection cleared');
      });
      return control;
    }
    case 'slider': {
      const control = createSlider(components.slider.config(state));
      control.on('input', () => {
        const value = control.getValue();
        const second = control.getSecondValue();
        sync({ value: String(value), ...(second !== null ? { secondValue: String(second) } : {}) });
        message(second === null ? `Value: ${value}` : `Range: ${value}–${second}`);
      });
      return control;
    }
    case 'textfield': {
      const control = createTextfield(components.textfield.config(state));
      if (!String(state.label).trim()) control.input.setAttribute('aria-label', 'Text field');
      control.input.addEventListener('input', () => { sync({ value: control.getValue() }); message('Text updated'); });
      return control;
    }
    case 'select': {
      const control = createSelect(components.select.config(state));
      if (!String(state.label).trim()) control.textfield.input.setAttribute('aria-label', 'Select an option');
      control.on('change', () => { sync({ value: control.getValue() || '' }); message(`Selected: ${control.getText()}`); });
      return control;
    }
    case 'search': {
      const control = createSearch(components.search.config(state));
      control.on('input', () => sync({ value: control.getValue() }));
      control.on('clear', () => { sync({ value: '' }); message('Search cleared'); });
      control.on('expand', () => { sync({ initialState: 'view' }); message('Search expanded'); });
      control.on('collapse', () => { sync({ initialState: 'bar' }); message('Search collapsed'); });
      control.on('suggestionSelect', () => { sync({ value: control.getValue() }); message(`Selected: ${control.getValue()}`); });
      control.on('submit', () => message(`Search: ${control.getValue()}`));
      return control;
    }
    case 'datepicker': {
      const control = createDatePicker(components.datepicker.config(state));
      control.input.setAttribute('aria-label', String(state.label).trim() || 'Choose a date');
      // The current calendar renderer emits disabled="false" on selectable days.
      const syncCalendarButtons = () => control.element.querySelectorAll('button[disabled="false"]').forEach(button => button.removeAttribute('disabled'));
      const calendarObserver = new MutationObserver(syncCalendarButtons);
      calendarObserver.observe(control.element, { childList: true, subtree: true });
      syncCalendarButtons();
      control.on('change', () => {
        const value = control.getValue();
        if (value) sync(Array.isArray(value) ? { value: dateValue(value[0]), endDate: dateValue(value[1]) } : { value: dateValue(value) });
        if (state.closeOnSelect && (!state.range || Array.isArray(value))) control.close();
        message(`Selected: ${control.getFormattedValue()}`);
      });
      control.on('open', () => message('Calendar opened'));
      control.on('close', () => message('Calendar closed'));
      return { element: control.element, destroy: () => { calendarObserver.disconnect(); control.destroy(); } };
    }
    case 'timepicker': {
      const control = createTimePicker(components.timepicker.config(state));
      const trigger = createButton({ text: `Choose time · ${control.getValue()}`, variant: 'tonal' });
      trigger.on('click', () => control.open());
      control.element.appendChild(trigger.element);
      const changed = () => {
        const time = control.getTimeObject();
        const value = [time.hours, time.minutes, ...(state.showSeconds ? [time.seconds || 0] : [])].map(value => String(value).padStart(2, '0')).join(':');
        sync({ value });
        trigger.setText(`Choose time · ${control.getValue()}`);
      };
      control.on('change', changed);
      control.on('confirm', () => { changed(); message(`Selected: ${control.getValue()}`); });
      control.on('open', () => message('Time picker opened'));
      control.on('close', () => message('Time picker closed'));
      return { element: control.element, destroy: () => { trigger.destroy(); control.destroy(); } };
    }
    case 'checkbox': {
      const checkbox = createCheckbox(components.checkbox.config(state));
      if (!String(state.label).trim()) checkbox.input.setAttribute('aria-label', 'Checkbox');
      checkbox.on('change', () => {
        checkbox.setIndeterminate(false);
        const nextState = checkbox.isChecked() ? 'checked' : 'unchecked';
        if (current) current.state = nextState;
        post({ type: 'md3:checkbox', state: nextState });
        message(`Checkbox ${nextState}`);
      });
      return checkbox;
    }
    case 'button': {
      const button = createButton(components.button.config(state));
      button.on('click', clicked);
      return button;
    }
    case 'icon-button': {
      const button = createIconButton(components['icon-button'].config(state));
      button.on('click', clicked);
      button.element.addEventListener('toggle', event => {
        if (!(event instanceof CustomEvent) || typeof event.detail?.selected !== 'boolean') return;
        const selected: boolean = event.detail.selected;
        if (current) current.selected = selected;
        post({ type: 'md3:selected', selected });
        message(selected ? 'Icon button selected' : 'Icon button deselected');
      });
      return button;
    }
    case 'button-group': {
      const group = createButtonGroup(components['button-group'].config(state));
      group.on('click', event => message(`${event.button.element.getAttribute('aria-label') || 'Action'} clicked`));
      group.on('change', event => message(event.values.length ? `Selected: ${event.values.join(', ')}` : 'Selection cleared'));
      return group;
    }
    case 'split-button': {
      const button = createSplitButton(components['split-button'].config(state));
      button.on('click', clicked);
      button.on('expand', () => message('Menu opened'));
      button.on('collapse', () => message('Menu closed'));
      button.on('select', event => message(event.item && 'text' in event.item ? `Selected: ${event.item.text}` : 'Menu option selected'));
      return button;
    }
    case 'fab': {
      const button = createFab(components.fab.config(state));
      if (state.lowered) button.lower();
      button.on('click', clicked);
      return button;
    }
    case 'extended-fab': {
      const button = createExtendedFab(components['extended-fab'].config(state));
      if (state.collapsed) button.collapse();
      if (state.lowered) button.lower();
      button.on('click', clicked);
      return button;
    }
  }
}
const fingerprint = (state: ComponentState) => JSON.stringify([components[slug].config(state), state.collapsed, state.lowered]);
function render(state: ComponentState) {
  document.documentElement.dataset.theme = String(state.theme);
  document.documentElement.dataset.themeMode = String(state.mode);
  document.documentElement.style.colorScheme = String(state.mode);
  if (current && fingerprint(current) === fingerprint(state)) { current = state; return; }
  disposing = true;
  try { component?.destroy(); } finally { disposing = false; }
  component = create(state);
  stage.replaceChildren(component.element);
  current = state;
}
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== parent || event.data?.type !== 'md3:configure') return;
  try { render(normalizeComponentState(slug, event.data.state)); }
  catch (error) { console.error(error); post({ type: 'md3:error' }); }
});
window.addEventListener('pagehide', () => component?.destroy());
// Preserve the appearance applied before paint instead of briefly rendering the light defaults.
render(normalizeComponentState(slug, {
  ...initialComponentState(slug),
  theme: document.documentElement.dataset.theme,
  mode: document.documentElement.dataset.themeMode,
}));
post({ type: 'md3:ready' });
