import createBadge from 'material/components/badge';
import createProgress from 'material/components/progress';
import createLoadingIndicator from 'material/components/loading-indicator';
import createSnackbar from 'material/components/snackbar';
import createTooltip from 'material/components/tooltip';
import createCard from 'material/components/card';
import createList from 'material/components/list';
import createCarousel from 'material/components/carousel';
import { createCarouselRemote } from './carousel-remote';
import { createDivider } from 'material/components/divider';
import createDialog from 'material/components/dialog';
import createBottomSheet from 'material/components/bottom-sheet';
import createSideSheet from 'material/components/side-sheet';
import createNavigationRail from 'material/components/navigation-rail';
import createDrawer from 'material/components/drawer';
import createTabs from 'material/components/tabs';
import createMenu from 'material/components/menu';
import createTopAppBar from 'material/components/top-app-bar';
import createBottomAppBar from 'material/components/bottom-app-bar';
import createToolbar from 'material/components/toolbar';
import createSwitch from 'material/components/switch';
import createRadios from 'material/components/radios';
import createSlider from 'material/components/slider';
import createTextField from 'material/components/text-field';
import createSelect from 'material/components/select';
import createSearch from 'material/components/search';
import createDatePicker from 'material/components/datepicker';
import createTimePicker from 'material/components/timepicker';
import { createChips, type ChipComponent } from 'material/components/chips';
import createCheckbox from 'material/components/checkbox';
import createButton from 'material/components/button';
import createIconButton from 'material/components/icon-button';
import createButtonGroup from 'material/components/button-group';
import createSplitButton from 'material/components/split-button';
import createFab from 'material/components/fab';
import createFabMenu from 'material/components/fab-menu';
import createExtendedFab from 'material/components/extended-fab';
import { appBarContent, checkboxChildChecked, checkboxChildren, currentCheckboxChildren, componentIcons, components, initialComponentState, isComponent, normalizeComponentState, radioAriaLabel, trailingBehaviour, type ComponentState } from '../shared/components';
import { symbols } from '../shared/icons';

const componentSlug = document.documentElement.dataset.component!;
if (!isComponent(componentSlug)) throw new Error('Unknown component');
const slug = componentSlug;
let component: { element: HTMLElement; destroy: () => void } | undefined;
let current: ComponentState | undefined;
let clicks = 0;
let disposing = false;
let generation = 0;
const stage = document.querySelector<HTMLElement>('#stage')!;

const post = (data: Record<string, unknown>) => { if (!disposing) parent.postMessage(data, location.origin); };
const clicked = () => post({ type: 'md3:click', count: ++clicks });
const report = (value: string) => post({ type: 'md3:event', message: value });

const syncValues = (values: ComponentState) => {
  if (disposing) return;
  if (current) Object.assign(current, values);
  post({ type: 'md3:values', values });
};
const dateValue = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
function create(state: ComponentState) {
  const instance = generation;
  const message = (value: string) => { if (instance === generation) report(value); };
  const sync = (values: ComponentState) => { if (instance === generation) syncValues(values); };
  switch (slug) {
    case 'badge': {
      const host = document.createElement('div');
      const target = createIconButton({ icon: componentIcons.inbox, ariaLabel: 'Inbox', variant: 'tonal' });
      host.append(target.element);
      const control = createBadge({ ...components.badge.config(state), target: target.element });
      target.on('click', () => message('Inbox clicked'));
      return { element: host, destroy: () => { control.destroy(); target.destroy(); } };
    }
    case 'progress': return createProgress(components.progress.config(state));
    case 'loading-indicator': return createLoadingIndicator(components['loading-indicator'].config(state));
    case 'snackbar': {
      const control = createSnackbar(components.snackbar.config(state));
      const trigger = createButton({ text: 'Show snackbar', variant: 'tonal' });
      trigger.on('click', () => control.show());
      control.on('open', () => { sync({ visible: true }); message('Snackbar opened'); });
      control.on('close', event => { sync({ visible: false }); message(`Snackbar closed: ${event.reason}`); });
      if (state.visible) control.show();
      return { element: trigger.element, destroy: () => { control.hide(); control.destroy(); trigger.destroy(); } };
    }
    case 'tooltip': {
      const target = createIconButton({ icon: componentIcons.heart, ariaLabel: 'Favorite', variant: 'tonal' });
      // Positioning needs the target in the document before an initially visible tooltip is created.
      stage.append(target.element);
      const control = createTooltip({ ...components.tooltip.config(state), target: target.element });
      const observer = new MutationObserver(() => {
        sync({ visible: control.isVisible() });
        message(control.isVisible() ? 'Tooltip shown' : 'Tooltip hidden');
      });
      observer.observe(control.element, { attributes: true, attributeFilter: ['aria-hidden'] });
      target.on('click', () => message('Favorite clicked'));
      return { element: target.element, destroy: () => { observer.disconnect(); control.destroy(); target.destroy(); } };
    }
    case 'card': {
      const control = createCard(components.card.config(state));
      control.element.addEventListener('click', event => {
        const button = (event.target as Element).closest('button');
        if (button) message(`${button.textContent?.trim()} clicked`);
        else if (state.clickable) message('Card clicked');
      });
      control.element.addEventListener('dragstart', () => message('Card drag started'));
      return control;
    }
    case 'list': {
      const control = createList(components.list.config(state));
      control.on('select', () => queueMicrotask(() => {
        const selected = control.getSelectedItemIds();
        sync(Object.fromEntries(['first', 'second', 'third', 'fourth', 'fifth'].map((key, index) => [key, selected.includes(String(index + 1))])));
        message(selected.length ? `Selected: ${control.getSelectedItems().map(item => item.headline).join(', ')}` : 'Selection cleared');
      }));
      const onAction = (event: MouseEvent) => {
        const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-list-action]') : null;
        if (target) message(`Saved: ${target.dataset.listAction}`);
      };
      control.element.addEventListener('click', onAction);
      return { element: control.element, destroy: () => { control.element.removeEventListener('click', onAction); control.destroy(); } };
    }
    case 'carousel': {
      const control = createCarousel(components.carousel.config(state));
      const count = control.slides.getCount();
      control.on('change', event => { sync({ initialSlide: String(event.value) }); message(`Slide ${event.value + 1} of ${count}`); });
      // The remote under the carousel goes with it: a new carousel gets a new remote.
      const remote = createCarouselRemote(control);
      const host = document.createElement('div');
      host.className = 'carousel-demo';
      host.append(control.element, remote.element);
      return { element: host, destroy: () => { remote.destroy(); control.destroy(); } };
    }
    case 'divider': {
      const control = createDivider(components.divider.config(state));
      const container = document.createElement('div');
      container.style.cssText = `display:flex;align-items:center;width:100%;max-width:400px;flex-direction:${state.orientation === 'vertical' ? 'column' : 'row'};${state.orientation === 'vertical' ? 'height:200px;' : ''}`;
      control.element.style.flex = '1';
      container.append(control.element);
      return { element: container, destroy: () => control.destroy() };
    }
    case 'dialog': {
      const control = createDialog(components.dialog.config(state));
      const trigger = createButton({ text: 'Open dialog', variant: 'tonal' });
      trigger.on('click', () => control.open());
      control.on('open', () => { sync({ open: true }); message('Dialog opened'); });
      control.on('close', () => { sync({ open: false }); message('Dialog closed'); });
      return { element: trigger.element, destroy: () => { control.destroy(); trigger.destroy(); } };
    }
    case 'bottom-sheet': {
      const control = createBottomSheet(components['bottom-sheet'].config(state));
      const trigger = createButton({ text: 'Open bottom sheet', variant: 'tonal' });
      trigger.on('click', () => control.expand());
      control.on('stateChange', event => { sync({ initialState: event.state }); message(`Bottom sheet ${event.state}`); });
      return { element: trigger.element, destroy: () => { control.destroy(); trigger.destroy(); } };
    }
    case 'side-sheet': {
      const control = createSideSheet(components['side-sheet'].config(state));
      const trigger = createButton({ text: 'Open side sheet', variant: 'tonal' });
      trigger.on('click', () => control.open());
      control.on('open', () => { sync({ open: true }); message('Side sheet opened'); });
      control.on('close', () => { sync({ open: false }); message('Side sheet closed'); });
      return { element: trigger.element, destroy: () => { control.destroy(); trigger.destroy(); } };
    }

    case 'navigation-rail': {
      const control = createNavigationRail(components['navigation-rail'].config(state));
      const host = document.createElement('div');
      host.className = 'navigation-demo';
      host.append(control.element);
      const trigger = createButton({ text: 'Open navigation', variant: 'tonal' });
      trigger.element.classList.add('navigation-trigger');
      trigger.on('click', () => control.expand());
      const updateTrigger = () => { trigger.element.hidden = control.isExpanded() || !(state.layout === 'modal' || state.hideWhenCollapsed || !state.showToggle); };
      updateTrigger();
      host.append(trigger.element);
      control.on('select', event => { sync({ active: event.id }); message(`Selected: ${event.id}`); });
      control.on('expand', () => { sync({ expanded: true }); updateTrigger(); message('Navigation expanded'); });
      control.on('collapse', () => { sync({ expanded: false }); updateTrigger(); message('Navigation collapsed'); });
      return { element: host, destroy: () => { trigger.destroy(); control.destroy(); } };
    }
    case 'drawer': {
      const control = createDrawer(components.drawer.config(state));
      const host = document.createElement('div');
      host.className = 'navigation-demo';
      host.dataset.position = String(state.position);
      host.append(control.element);
      const trigger = createButton({ text: 'Open drawer', variant: 'tonal' });
      trigger.element.classList.add('navigation-trigger');
      trigger.element.hidden = control.isOpen();
      trigger.on('click', () => control.open());
      host.append(trigger.element);
      control.on('select', (event: { id: string; label: string }) => { sync({ active: event.id }); message(`Selected: ${event.label}`); });
      control.on('open', () => { sync({ open: true }); trigger.element.hidden = true; message('Drawer opened'); });
      control.on('close', () => { sync({ open: false }); trigger.element.hidden = false; message('Drawer closed'); });
      return { element: host, destroy: () => { trigger.destroy(); control.destroy(); } };
    }
    case 'tabs': {
      const control = createTabs(components.tabs.config(state));
      control.element.setAttribute('aria-label', 'Mailbox views');
      control.on('change', (event: { value: string }) => { sync({ active: event.value }); message(`Selected: ${event.value}`); });
      return control;
    }
    case 'menu': {
      const trigger = createButton({ text: String(state.text), variant: 'tonal', ariaLabel: String(state.text).trim() || 'Open menu' });
      const control = createMenu({ ...components.menu.config(state), opener: trigger.element });
      control.on('select', event => message(`Selected: ${event.item.text}`));
      control.on('open', () => message('Menu opened'));
      control.on('close', () => message('Menu closed'));
      return { element: trigger.element, destroy: () => { control.destroy(); trigger.destroy(); } };
    }
    case 'top-app-bar': {
      const control = createTopAppBar(components['top-app-bar'].config(state));
      const content = appBarContent('top-app-bar', state);
      const buttons = content.actions.map(config => createIconButton(config));
      buttons.forEach(button => { control.addTrailingElement(button.element); button.on('click', () => message(`${button.element.getAttribute('aria-label')} clicked`)); });
      if (content.leading) {
        const navigation = createIconButton(content.leading);
        navigation.on('click', () => message('Navigation clicked'));
        control.addLeadingElement(navigation.element);
        buttons.push(navigation);
      }
      control.setScrollState(content.scrolled === true);
      return { element: control.element, destroy: () => { buttons.forEach(button => button.destroy()); control.destroy(); } };
    }
    case 'bottom-app-bar': {
      const control = createBottomAppBar(components['bottom-app-bar'].config(state));
      const content = appBarContent('bottom-app-bar', state);
      const buttons = content.actions.map(config => createIconButton(config));
      buttons.forEach(button => { control.addAction(button.element); button.on('click', () => message(`${button.element.getAttribute('aria-label')} clicked`)); });
      const fab = content.fab ? createFab(content.fab) : null;
      if (fab) { control.addFab(fab.element); fab.on('click', () => message(`${String(state.fabLabel) || 'Compose'} clicked`)); }
      if (!content.visible) control.hide();
      return { element: control.element, destroy: () => { buttons.forEach(button => button.destroy()); fab?.destroy(); control.destroy(); } };
    }
    case 'toolbar': {
      const control = createToolbar(components.toolbar.config(state));
      control.bar.addEventListener('click', (event) => {
        const item = (event.target as Element).closest('[aria-label]');
        if (item && item !== control.bar) message(`${item.getAttribute('aria-label')} clicked`);
      });
      return control;
    }

    case 'switch': {
      const control = createSwitch(components.switch.config(state));
      control.on('change', () => { sync({ checked: control.isChecked() }); message(control.isChecked() ? 'Switch on' : 'Switch off'); });
      return control;
    }
    case 'radios': {
      const control = createRadios(components.radios.config(state));
      control.element.setAttribute('aria-label', radioAriaLabel(state));
      control.on('change', () => { sync({ value: control.getValue() ?? '' }); message(`Selected: ${control.getSelected()?.label}`); });
      return control;
    }
    case 'chips': {
      const config = components.chips.config(state);
      // The trailing menu's handler lives here: the shared config is data.
      config.chips = config.chips?.map(chip => chip.trailingMenu ? { ...chip, onTrailingClick: (c: ChipComponent) => message(`Open the ${c.getLabel()} menu`) } : chip);
      const control = createChips(config);
      if (state.draggable) control.getChips().forEach(chip => { chip.element.draggable = true; });
      control.on('change', () => {
        const values = control.getSelectedValues();
        if (state.chipSetDefault) {
          sync(Object.fromEntries(['hiking', 'music', 'food'].map(value => [value, values.includes(value)])));
        }
        message(values.length ? `Selected: ${values.join(', ')}` : 'Selection cleared');
      });
      control.on('remove', event => {
        message(`Removed: ${event.chip.getLabel()}`);
      });
      return control;
    }
    case 'slider': {
      const control = createSlider(components.slider.config(state));
      // A vertical slider takes its length from its height.
      if (state.orientation === 'vertical') control.element.style.height = '240px';
      control.on('input', () => {
        const value = control.getValue();
        const second = control.getSecondValue();
        // The value control is 0-100; a centred slider is shifted onto -50..50.
        const offset = state.variant === 'centered' ? 50 : 0;
        sync({ value: String(value + offset), ...(second !== null ? { secondValue: String(second) } : {}) });
        message(second === null ? `Value: ${value}` : `Range: ${value}–${second}`);
      });
      return control;
    }
    case 'text-field': {
      const config = components['text-field'].config(state);
      const control = createTextField(config);
      if (!String(state.label).trim()) control.input.setAttribute('aria-label', 'Text field');
      control.input.addEventListener('input', () => { sync({ value: control.getValue() }); message('Text updated'); });
      // The trailing button's behaviour is shared and keyed by the icon choice
      // (`trailingBehaviour`); the label is only the accessible name, so typing one cannot
      // change what the button does. The label's presence is what makes the icon a button:
      // a clear button empties the field and shows while there is a value (m3.material.io
      // text field guidelines); a password button swaps the type, the icon and its own
      // label (text field accessibility).
      const behaviour = config.trailingIconLabel ? trailingBehaviour(state) : undefined;
      if (behaviour === 'clear') {
        // A component stylesheet sets `display: flex` on this element, which outranks the
        // `hidden` attribute; an inline display wins over both, and `''` hands the button
        // back to the component's own rule.
        const reflect = () => { if (control.trailingIcon) control.trailingIcon.style.display = control.getValue() ? '' : 'none'; };
        control.input.addEventListener('input', reflect);
        reflect();
        control.on('trailing', () => { control.setValue(''); reflect(); sync({ value: '' }); message('Text cleared'); });
      }
      if (behaviour === 'show-password') {
        control.on('trailing', () => {
          // A single-line field: the factory types the input as input-or-textarea.
          const input = control.input;
          if (!(input instanceof HTMLInputElement)) return;
          const shown = input.type === 'text';
          input.type = shown ? 'password' : 'text';
          control.setTrailingIcon(shown ? symbols.visibility : symbols.visibilityOff, shown ? 'Show password' : 'Hide password');
          message(shown ? 'Password hidden' : 'Password shown');
        });
      }
      return control;
    }
    case 'select': {
      const control = createSelect(components.select.config(state));
      if (!String(state.label).trim()) control.textField.input.setAttribute('aria-label', 'Select an option');
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
      control.on('change', () => {
        const value = control.getValue();
        sync(value ? Array.isArray(value) ? { value: dateValue(value[0]), endDate: dateValue(value[1]) } : { value: dateValue(value), ...(state.range ? { endDate: '' } : {}) } : { value: '', endDate: '' });
        message(value ? `Selected: ${control.getFormattedValue()}` : 'Selection cleared');
      });
      control.on('open', () => message('Calendar opened'));
      control.on('close', () => message('Calendar closed'));
      return control;
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
      const report = (nextState: string) => {
        if (current) current.state = nextState;
        post({ type: 'md3:checkbox', state: nextState });
      };
      if (state.family !== true) {
        const checkbox = createCheckbox(components.checkbox.config(state));
        if (!String(state.label).trim()) checkbox.input.setAttribute('aria-label', 'Checkbox');
        checkbox.on('change', () => {
          const nextState = checkbox.isChecked() ? 'checked' : 'unchecked';
          report(nextState);
          message(`Checkbox ${nextState}`);
        });
        return checkbox;
      }
      // The m3.material.io checkbox guidelines' parent and children (FLO-269):
      // checking the parent checks every child, unchecking it unchecks them, and a mix
      // makes it indeterminate; checking an indeterminate parent checks them all.
      const { label, value: _value, checked: _checked, indeterminate: _indeterminate, name, ...common } = components.checkbox.config(state);
      const children = currentCheckboxChildren(state).map(child => createCheckbox({ ...common, name: name || 'additions', label: child.label, value: child.value, checked: checkboxChildChecked(state, child.value) }));
      const parentBox = createCheckbox({ ...common, label: label || 'Additions', checked: state.state === 'checked', indeterminate: state.state === 'indeterminate' });
      parentBox.input.setAttribute('aria-controls', children.map(child => child.input.id).join(' '));
      const reflect = () => {
        const on = children.filter(child => child.isChecked()).length;
        // uncheck() first: a mixed parent must not also be checked, or a click would uncheck it.
        if (on === children.length) parentBox.check();
        else if (on === 0) parentBox.uncheck();
        else { parentBox.uncheck(); parentBox.setIndeterminate(true); }
        const nextState = on === children.length ? 'checked' : on === 0 ? 'unchecked' : 'indeterminate';
        report(nextState);
        message(on === 0 ? `No ${label ? label.toLowerCase() : 'additions'}` : `${on} of ${children.length} ${label ? label.toLowerCase() : 'additions'}`);
      };
      // Only user changes: check() and uncheck() emit change as well, without nativeEvent.
      parentBox.on('change', ({ checked, nativeEvent }) => {
        if (!nativeEvent) return;
        children.forEach(child => (checked ? child.check() : child.uncheck()));
        reflect();
      });
      children.forEach(child => child.on('change', ({ nativeEvent }) => { if (nativeEvent) reflect(); }));
      // A checkbox is inline-flex: the children stack in a column, indented under the parent.
      const host = document.createElement('div');
      host.style.cssText = 'display:flex;flex-direction:column;align-items:flex-start';
      const list = document.createElement('div');
      list.style.cssText = 'display:flex;flex-direction:column;align-items:flex-start;padding-inline-start:24px';
      list.append(...children.map(child => child.element));
      host.append(parentBox.element, list);
      return { element: host, destroy: () => { parentBox.destroy(); children.forEach(child => child.destroy()); } };
    }
    case 'button': {
      const button = createButton(components.button.config(state));
      button.on('click', clicked);
      // The same path as the icon button: a toggle's change writes the Selected control.
      button.on('change', ({ selected }) => {
        if (current) current.selected = selected;
        post({ type: 'md3:selected', selected });
        message(selected ? 'Button selected' : 'Button deselected');
      });
      return button;
    }
    case 'icon-button': {
      const button = createIconButton(components['icon-button'].config(state));
      button.on('click', clicked);
      button.on('change', ({ selected }) => {
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
    case 'fab-menu': {
      const control = createFabMenu(components['fab-menu'].config(state));
      control.on('select', ({ id }) => message(`${id} chosen`));
      return control;
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
const fingerprint = ({ theme, mode, ...state }: ComponentState) => JSON.stringify(state);
function render(state: ComponentState, reset = false) {
  document.documentElement.dataset.theme = String(state.theme);
  document.documentElement.dataset.themeMode = String(state.mode);
  document.documentElement.style.colorScheme = String(state.mode);
  if (!reset && current && fingerprint(current) === fingerprint(state)) { current = state; return; }
  generation++;
  disposing = true;
  try { component?.destroy(); } finally { disposing = false; }
  component = create(state);
  stage.replaceChildren(component.element);
  current = state;
}
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== parent || event.data?.type !== 'md3:configure') return;
  try {
    render(normalizeComponentState(slug, event.data.state), event.data.reset === true);
    if (event.data.reset === true) post({ type: 'md3:reset' });
  }
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
