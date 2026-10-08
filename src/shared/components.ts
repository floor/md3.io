import type { ToolbarConfig, ToolbarButtonItem } from 'material/components/toolbar';
import { symbols } from './icons';
import { nameIcons } from './icon-code';
import { icons as buttonIcons, themes } from './button';

export const componentIcons: Record<string, string> = {
  ...buttonIcons,
  menu: symbols.menu,
  inbox: symbols.inbox,
  add: symbols.add,
  edit: symbols.edit,
  bold: symbols.bold,
  italic: symbols.italic,
  underline: symbols.underline,
  // The text field's leading and trailing icons: mail and search describe the input,
  // the close and error icons are the clear and error signifiers (m3.material.io text
  // fields), and the eye pair swaps on a password's show or hide button.
  mail: symbols.mail,
  search: symbols.search,
  close: symbols.close,
  error: symbols.error,
  visibility: symbols.visibility,
  visibilityOff: symbols.visibilityOff,
  calendarToday: symbols.calendarToday,
  chevronRight: symbols.chevronRight,
  frontHand: symbols.frontHand,
  stop: symbols.stop,
  playCircle: symbols.playCircle,
  shoppingCart: symbols.shoppingCart,
  arrowUpward: symbols.arrowUpward,
  flight: symbols.flight,
};
// The types and control helpers live in content/types.ts so the content modules can
// import them without importing this registry; re-exported here for their consumers.
import { type ComponentState, type Control, string, bool } from './content/types';
export type { ComponentState, Control, Scenario } from './content/types';
// Every component's content module, one per component.
import { buttonComponent } from './content/button';
import { buttonGroupComponent } from './content/button-group';
import { extendedFabComponent } from './content/extended-fab';
import { fabComponent } from './content/fab';
import { fabMenuComponent } from './content/fab-menu';
import { iconButtonComponent } from './content/icon-button';
import { splitButtonComponent } from './content/split-button';
import { checkboxChildChecked, checkboxComponent, currentCheckboxChildren } from './content/checkbox';
import { chipsComponent } from './content/chips';
import { datepickerComponent } from './content/datepicker';
import { radiosComponent, radioAriaLabel } from './content/radios';
import { searchComponent } from './content/search';
import { selectComponent } from './content/select';
import { sliderComponent } from './content/slider';
import { switchComponent } from './content/switch';
import { textFieldComponent, trailingBehaviour, type TrailingBehaviour } from './content/text-field';
import { timePickerComponent } from './content/timepicker';
import { bottomAppBarComponent } from './content/bottom-app-bar';
import { drawerActiveOptions, drawerComponent } from './content/drawer';
import { menuComponent, menuSelectedId } from './content/menu';
import { navigationRailComponent, railActiveOptions, railHeaderForm } from './content/navigation-rail';
import { tabActiveOptions, tabsAriaLabel, tabsComponent } from './content/tabs';
import { toolbarComponent, toolbarContent } from './content/toolbar';
import { appBarActions, appBarContent, topAppBarComponent } from './content/top-app-bar';
import { bottomSheetComponent } from './content/bottom-sheet';
import { cardComponent } from './content/card';
import { carouselComponent } from './content/carousel';
import { dialogComponent } from './content/dialog';
import { dividerComponent } from './content/divider';
import { listComponent } from './content/list';
import { sideSheetComponent } from './content/side-sheet';
import { badgeComponent } from './content/badge';
import { loadingIndicatorComponent } from './content/loading-indicator';
import { progressComponent } from './content/progress';
import { snackbarComponent } from './content/snackbar';
import { tooltipComponent, tooltipTarget } from './content/tooltip';

/**
 * The toolbar's config as its element takes it: icon buttons in `items`, text buttons in
 * `buttons`, the FAB slotted beside them, and the overflow menu from `overflow` as a
 * slotted `slot="overflow"` element the element anchors to its own more button, with
 * `overflowPosition` as the menu's `position` — the generator writes it in the tabs.
 */
export function toolbarElementConfig(state: ComponentState): Record<string, unknown> {
  const { items: allItems, ...config } = components.toolbar.config(state) as ToolbarConfig;
  const items = (allItems ?? []).filter(item => typeof (item as ToolbarButtonItem).text !== 'string');
  const buttons = (allItems ?? []).filter((item): item is ToolbarButtonItem => typeof (item as ToolbarButtonItem).text === 'string');
  const content = toolbarContent(state);
  return {
    ...config, ...(items.length ? { items } : {}), ...(buttons.length ? { buttons } : {}), ...(content.fab ? { fab: content.fab } : {}),
    ...(content.overflow ? { overflow: content.overflow } : {}), ...(content.overflowPosition ? { overflowPosition: content.overflowPosition } : {}),
  };
}
export const components = {
  button: buttonComponent,
  'icon-button': iconButtonComponent,
  'button-group': buttonGroupComponent,
  'split-button': splitButtonComponent,
  fab: fabComponent,
  'fab-menu': fabMenuComponent,
  'extended-fab': extendedFabComponent,
  checkbox: checkboxComponent,
  switch: switchComponent,
  radios: radiosComponent,
  chips: chipsComponent,
  slider: sliderComponent,
  'text-field': textFieldComponent,
  select: selectComponent,
  search: searchComponent,
  datepicker: datepickerComponent,
  timepicker: timePickerComponent,
  'navigation-rail': navigationRailComponent,
  drawer: drawerComponent,
  tabs: tabsComponent,
  menu: menuComponent,
  'top-app-bar': topAppBarComponent,
  'bottom-app-bar': bottomAppBarComponent,
  toolbar: toolbarComponent,
  card: cardComponent,
  list: listComponent,
  carousel: carouselComponent,
  divider: dividerComponent,
  dialog: dialogComponent,
  'bottom-sheet': bottomSheetComponent,
  'side-sheet': sideSheetComponent,
  badge: badgeComponent,
  progress: progressComponent,
  'loading-indicator': loadingIndicatorComponent,
  snackbar: snackbarComponent,
  tooltip: tooltipComponent,
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
  if (slug === 'navigation-rail') {
    const allowed = railActiveOptions(state);
    if (!allowed.some(option => option.value === state.active)) state.active = allowed[0]?.value ?? 'inbox';
  }
  if (slug === 'drawer') {
    const allowed = drawerActiveOptions(state);
    if (!allowed.some(option => option.value === state.active)) state.active = allowed[0]?.value ?? 'inbox';
  }
  if (slug === 'button-group') state.groupDefault = !state.groupSet || state.groupSet === 'default';
  if (slug === 'fab-menu') state.menuSetDefault = !state.menuSet || state.menuSet === 'default';
  if (slug === 'tabs') {
    state.tabsDefault = !state.tabSet || state.tabSet === 'default';
    if (state.tabsDefault && state.count === '3' && ['drafts', 'archive', 'trash'].includes(String(state.active))) state.active = 'inbox';
    const allowed = tabActiveOptions(state);
    if (!allowed.some(option => option.value === state.active)) state.active = allowed[0]?.value ?? 'inbox';
  }
  if (slug === 'badge') state.hasLabel = state.variant === 'large';
  if (slug === 'progress' || slug === 'loading-indicator') state.determinate = !state.indeterminate;
  if (slug === 'progress') {
    state.circular = state.variant === 'circular';
    state.linear = !state.circular;
    state.linearDeterminate = state.linear && state.determinate;
  }
  if (slug === 'list') {
    // A named list fixes its items: the layout and content controls are for the default's own.
    state.listContentDefault = !state.listSet || state.listSet === 'default';
    state.hasSupporting = state.lines !== '1' && state.listContentDefault;
    state.threeLines = state.lines === '3' && state.listContentDefault;
    state.selectable = state.selection !== 'none' && state.listContentDefault;
    state.extraSelectable = state.selectable && state.count === '5';
    let selected = false;
    ['first', 'second', 'third', 'fourth', 'fifth'].forEach((key, index) => {
      const keep = !!state[key] && !!state.listContentDefault && state.selection !== 'none' && index < Number(state.count) && (state.selection === 'multi' || !selected);
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
    state.chipSetDefault = !state.chipSet || state.chipSet === 'default';
    state.selectable = state.type === 'filter' || state.type === 'input';
    state.elevatedAllowed = state.type !== 'input';
    state.inputType = state.type === 'input';
    state.filterType = state.type === 'filter';
    if (typeof raw.selectedChips === 'string' && raw.selectedChips !== '') state.selectedChips = raw.selectedChips;
  }
  // The trailing label is only meaningful beside a trailing icon.
  if (slug === 'text-field') state.hasTrailingIcon = state.trailingIcon !== 'none';
  // Text buttons have no toggle style (m3.material.io button specs).
  if (slug === 'button') {
    state.toggleAllowed = state.variant !== 'text';
    if (!state.toggleAllowed) state.toggle = false;
  }
  if (slug === 'checkbox') {
    state.familySetDefault = !state.familySet || state.familySet === 'default';
    // The Value control is for the one standalone box; a parent-and-children group's
    // boxes submit their own values, so it disables while the family is on.
    state.standalone = state.family !== true;
    // The visitor's mix. Checked and unchecked replace it; a set from another option
    // list, or a standalone box, is dropped. Absent, the family's own mix applies.
    const stored = typeof raw.checkedChildren === 'string' ? raw.checkedChildren : '';
    if (state.family === true && state.state === 'checked') state.checkedChildren = currentCheckboxChildren(state).map(child => child.value).join(',');
    else if (state.family === true && state.state === 'unchecked') state.checkedChildren = '__none__';
    else if (state.family === true && stored === '__none__') state.checkedChildren = '__none__';
    else if (state.family === true && stored !== '') {
      const allowed = new Set(currentCheckboxChildren(state).map(child => child.value));
      const parts = stored.split(',').filter(Boolean);
      if (parts.length > 0 && parts.every(part => allowed.has(part))) state.checkedChildren = parts.join(',');
    }
  }
  // A named toolbar action set fixes the item list: the count and toggle controls are for the default sets.
  if (slug === 'toolbar') state.actionsDefault = state.actions === 'default';
  if (slug === 'menu') state.itemsDefault = !state.menuSet || state.menuSet === 'default';
  // A named collection fixes the slides: the captions and the current-slide control are for the default's twenty-four.
  if (slug === 'carousel') state.slidesDefault = !state.carouselSet || state.carouselSet === 'default';
  if (slug === 'top-app-bar') state.contextDefault = !state.context || state.context === 'default';
  // A named sheet fixes the content: the title and body controls are for the default's own.
  if (slug === 'bottom-sheet') state.sheetContentDefault = !state.sheetSet || state.sheetSet === 'default';
  if (slug === 'side-sheet') state.sheetContentDefault = !state.sheetSet || state.sheetSet === 'default';
  // A named card fixes its words the same way: the title, subtitle and body controls are for the default's own.
  if (slug === 'card') state.cardContentDefault = !state.cardSet || state.cardSet === 'default';
  // So does a named dialog: its title, subtitle and body controls are for the default's own.
  if (slug === 'dialog') state.dialogContentDefault = !state.dialogSet || state.dialogSet === 'default';
  if (slug === 'datepicker') {
    // A named picker fixes its label and dates: those controls are for the default's own.
    state.dateContentDefault = !state.dateSet || state.dateSet === 'default';
    state.dateOpen = !state.dateContentDefault;
    state.rangeEndEnabled = !!state.range && !!state.dateContentDefault;
    if (state.value && state.endDate && String(state.endDate) < String(state.value)) state.endDate = state.value!;
  }
  if (slug === 'radios') {
    state.isDelivery = !state.optionSet || state.optionSet === 'default' || state.optionSet === 'express-delivery' || state.optionSet === 'delivery';
    state.optionSetDefault = !state.optionSet || state.optionSet === 'default';
    if (state.disableExpress && state.value === 'express') state.value = 'standard';
  }
  if (slug === 'select') {
    // A named field fixes its label, value and options: those controls are for the fruit field.
    state.selectContentDefault = !state.selectSet || state.selectSet === 'default';
    if (state.disableBanana && state.value === 'banana') state.value = 'apple';
  }
  if (slug === 'search') state.searchContentDefault = !state.searchSet || state.searchSet === 'default';
  if (slug === 'timepicker') state.timeContentDefault = !state.timeSet || state.timeSet === 'default';
  state.theme = themes.find(theme => theme === raw.theme) ?? 'baseline';
  state.mode = raw.mode === 'dark' ? 'dark' : 'light';
  return state;
}
export function initialComponentState(slug: ComponentSlug): ComponentState {
  return normalizeComponentState(slug, Object.fromEntries(components[slug].controls.map(control => [control.key, control.initial])));
}
/** The configuration the framework code is generated from: the config, and what the preview adds beside it. */
export function elementConfig(slug: ComponentSlug, state: ComponentState): Record<string, unknown> {
  const config = components[slug].config(state) as Record<string, unknown>;
  if (slug === 'top-app-bar' || slug === 'bottom-app-bar') return { ...config, ...appBarContent(slug, state) };
  // The button beside an overlay that opens it: the drawer's while it is modal or closed.
  const trigger = (text: string, ariaLabel?: string) => ({ trigger: { text, variant: 'tonal', ...(ariaLabel ? { ariaLabel } : {}) } });
  switch (slug) {
    case 'toolbar': return toolbarElementConfig(state);
    case 'menu': {
      const selected = menuSelectedId(state);
      const items = selected && Array.isArray(config.items)
        ? config.items.map(item => item && typeof item === 'object' && 'id' in item && item.id === selected ? { ...item, selected: true } : item)
        : config.items;
      return { ...config, items, ...trigger(String(state.text), String(state.text).trim() ? undefined : 'Open menu') };
    }
    case 'dialog': case 'bottom-sheet': case 'side-sheet': return { ...config, ...trigger(`Open ${components[slug].name.toLowerCase()}`) };
    case 'drawer': return state.variant === 'modal' || !state.open ? { ...config, ...trigger('Open drawer') } : config;
    // The rail's while nothing else expands it, as the preview shows it.
    case 'navigation-rail': {
      const header = railHeaderForm(state);
      const headerSlot = header?.kind === 'extended'
        ? { headerExtended: { icon: header.icon, text: header.text, ariaLabel: header.ariaLabel } }
        : header ? { headerFab: { icon: header.icon, ariaLabel: header.ariaLabel } } : {};
      return state.layout === 'modal' || state.hideWhenCollapsed || !state.showToggle
        ? { ...config, ...headerSlot, ...trigger('Open navigation') }
        : { ...config, ...headerSlot };
    }
    case 'timepicker': return { ...config, ...trigger('Choose time') };
    // The factory config has no `open`. The element attribute does
    // (`material/src/elements/datepicker.ts`, `open`), written when the scenario's calendar is open.
    case 'datepicker': return state.dateOpen === true ? { ...config, open: true } : config;
    case 'snackbar': return { ...config, open: state.visible === true, ...trigger('Show snackbar') };
    case 'tooltip': return { ...config, target: tooltipTarget(state) };
    case 'select': return String(state.label).trim() ? config : { ...config, ariaLabel: 'Select an option' };
    // The factory opens with `open()`. The element tabs declare the same thing
    // with the `open` attribute, which the generator writes from this key.
    case 'fab-menu': return { ...config, open: state.open === true };
    // The factory takes `trailingItems`. The element takes `trailing-icon`
    // (`material/src/elements/search.ts`, the attribute, mapped into `trailingItems` at create).
    case 'search': {
      const items = config.trailingItems;
      if (!Array.isArray(items) || items.length === 0) return config;
      const first = items[0];
      if (!first || typeof first !== 'object' || !('content' in first)) return config;
      const rest = { ...config };
      delete rest.trailingItems;
      const label = 'ariaLabel' in first && typeof first.ariaLabel === 'string' ? first.ariaLabel : undefined;
      return { ...rest, trailingIcon: first.content, ...(label ? { trailingLabel: label } : {}) };
    }
    // A parent over its children is not one element: m-checkbox's only slot is its
    // label (material/src/elements/checkbox.ts), so the element tabs render the
    // parent and carry the children as a stated gap (`Not yet exposed by the
    // element: children.`).
    case 'checkbox': return state.family === true
      ? { ...config, children: currentCheckboxChildren(state).map(child => ({
          label: child.label, value: child.value, ...(checkboxChildChecked(state, child.value) ? { checked: true } : {}),
        })) }
      : config;
    default: return config;
  }
}
/** The vanilla code of a playground, with its icons as named constants (`editIcon`). */
export function componentCode(slug: ComponentSlug, state: ComponentState): string {
  return nameIcons(buildComponentCode(slug, state), trailingHandler(slug, state)?.icons ?? []);
}

/**
 * The text field's trailing button handler, which JSON cannot carry. Keyed by
 * `trailingBehaviour`, like the preview behaviour it mirrors, so the icon decides and the
 * label is only the accessible name. The two icons the password code names are declared
 * with `icons`: the code shows no literals for them, so `componentCode` imports them as
 * `visibilityIcon` and `visibilityOffIcon` (their icons/ files' names, as `nameIcons`
 * spells them).
 */
function trailingHandler(slug: ComponentSlug, state: ComponentState): { code: string; icons: readonly string[] } | undefined {
  if (slug !== 'text-field') return undefined;
  const behaviour = trailingBehaviour(state);
  if (!behaviour) return undefined;
  const handlers: Record<TrailingBehaviour, { code: string; icons: readonly string[] }> = {
    // m3.material.io text fields: "Clear icons let a person clear an entire input field."
    clear: { code: `onTrailingClick: () => textField.setValue(''),`, icons: [] },
    // m3.material.io text field accessibility: hidden, the label is "Show password"; visible, "Hide password".
    'show-password': { code: `onTrailingClick: () => {
  const shown = textField.input.type === 'text';
  textField.input.type = shown ? 'password' : 'text';
  textField.setTrailingIcon(shown ? visibilityIcon : visibilityOffIcon, shown ? 'Show password' : 'Hide password');
},`, icons: [symbols.visibility, symbols.visibilityOff] },
  };
  return handlers[behaviour];
}

function buildComponentCode(slug: ComponentSlug, state: ComponentState): string {
  if (components[slug].group === 'Navigation') return navigationCode(slug, state);
  if (components[slug].group === 'Containment') return containmentCode(slug, state);
  if (components[slug].group === 'Communication') return communicationCode(slug, state);
  const component = components[slug];
  // A filter chip's trailing menu needs its handler, which JSON cannot carry.
  const trailing = trailingHandler(slug, state);
  const config = JSON.stringify(component.config(state), null, 2).replace(/^(\s*)"([a-zA-Z]+)":/gm, '$1$2:')
    .replace(/^(\s*)trailingMenu: true/gm, '$1trailingMenu: true,\n$1onTrailingClick: (chip) => openMenu(chip)')
    // Same for a labelled trailing button: its handler follows the label it belongs to.
    .replace(/^(\s*)trailingIconLabel: "[^"]*",$/m, (line: string, indent: string) =>
      trailing ? `${line}\n${trailing.code.split('\n').map(part => indent + part).join('\n')}` : line);
  const chipsSetup = slug === 'chips'
    ? `${state.filterType && state.trailingMenu ? "// Anchor a material menu to chip.trailingAction here.\nfunction openMenu(chip) { console.log('Open the menu for', chip.getLabel()); }\n" : ''}` +
      `${state.draggable ? 'chips.getChips().forEach(chip => { chip.element.draggable = true; });\n' : ''}`
    : '';
  if (slug === 'checkbox' && state.family === true) return checkboxFamilyCode(state);
  const checkboxSetup = slug === 'checkbox' && !string(state, 'label').trim()
    ? "checkbox.input.setAttribute('aria-label', 'Checkbox');\n"
    : '';
  const setup = checkboxSetup + chipsSetup + (
    slug === 'radios' ? `radios.element.setAttribute('aria-label', '${radioAriaLabel(state)}');\n` :
    slug === 'text-field' && !string(state, 'label').trim() ? `textField.input.setAttribute('aria-label', 'Text field');\n` :
    slug === 'select' && !string(state, 'label').trim() ? `select.textField.input.setAttribute('aria-label', 'Select an option');\n` :
    slug === 'timepicker' ? "const openButton = createButton({ text: `Choose time · ${timePicker.getValue()}`, variant: 'tonal' });\nopenButton.on('click', () => timePicker.open());\ntimePicker.on('change', () => openButton.setText(`Choose time · ${timePicker.getValue()}`));\ntimePicker.on('confirm', () => openButton.setText(`Choose time · ${timePicker.getValue()}`));\ntimePicker.element.append(openButton.element);\n" : '');
  const calls = `${state.collapsed === true ? `${component.variable}.collapse();\n` : ''}${state.lowered === true ? `${component.variable}.lower();\n` : ''}${slug === 'fab-menu' && state.open === true ? `${component.variable}.open();\n` : ''}`;
  // After the picker is in the page: a modal's dialog opens only once it is connected.
  const openAfter = slug === 'datepicker' && state.dateOpen === true ? `${component.variable}.open();\n` : '';
  const styles = component.styles.includes('full') ? "import 'material/styles';\n" : ["base", ...component.styles].map(style => `import 'material/styles/${style}';\n`).join('');
  return `import { ${component.factory}${slug === 'timepicker' ? ', createButton' : ''} } from 'material';\n${styles}${state.theme === 'baseline' ? '' : `import 'material/themes/${state.theme}';\n`}\n` +
    `document.documentElement.dataset.theme = '${state.theme}';\ndocument.documentElement.dataset.themeMode = '${state.mode}';\n\n` +
    `const ${component.variable} = ${component.factory}(${config});\n${calls}${setup}\ndocument.body.append(${component.variable}.element);\n${openAfter}\n// When the view is removed:\n${slug === 'timepicker' ? '// openButton.destroy();\n' : ''}// ${component.variable}.destroy();\n`;
}

function checkboxFamilyCode(state: ComponentState): string {
  // The options every box shares, as the playground sets them.
  const rest = `${state.labelPosition === 'start' ? ", labelPosition: 'start'" : ''}${bool(state, 'error') ? ', error: true' : ''}` +
    `${bool(state, 'required') ? ', required: true' : ''}${bool(state, 'disabled') ? ', disabled: true' : ''}`;
  const children = currentCheckboxChildren(state).map(child => `  { label: '${child.label}', value: '${child.value}'${checkboxChildChecked(state, child.value) ? ', checked: true' : ''} }`).join(',\n');
  const theme = state.theme === 'baseline' ? '' : `import 'material/themes/${state.theme}';\n`;
  return `import { createCheckbox } from 'material';\nimport 'material/styles/base';\nimport 'material/styles/checkbox';\n${theme}\n` +
    `document.documentElement.dataset.theme = '${state.theme}';\ndocument.documentElement.dataset.themeMode = '${state.mode}';\n\n` +
    `// A parent over its children (m3.material.io checkbox guidelines): checking the\n// parent checks every child, and a mix makes it indeterminate.\n` +
    `const children = [\n${children}\n].map(child => createCheckbox({ ...child, name: '${string(state, 'name') || 'additions'}'${rest} }));\n` +
    `const parent = createCheckbox({ label: '${string(state, 'label') || 'Additions'}'${state.state === 'checked' ? ', checked: true' : state.state === 'indeterminate' ? ', indeterminate: true' : ''}${rest} });\n` +
    `parent.input.setAttribute('aria-controls', children.map(child => child.input.id).join(' '));\n\n` +
    `const reflect = () => {\n  const on = children.filter(child => child.isChecked()).length;\n` +
    `  if (on === children.length) parent.check();\n  else if (on === 0) parent.uncheck();\n  else { parent.uncheck(); parent.setIndeterminate(true); }\n};\n` +
    `// Only user changes: check() and uncheck() emit change too, without nativeEvent.\n` +
    `parent.on('change', ({ checked, nativeEvent }) => {\n  if (nativeEvent) children.forEach(child => (checked ? child.check() : child.uncheck()));\n});\n` +
    `children.forEach(child => child.on('change', ({ nativeEvent }) => { if (nativeEvent) reflect(); }));\n\n` +
    `// A checkbox is inline-flex: stack the children in a column, indented under the parent.\n` +
    `const group = document.createElement('div');\ngroup.style.cssText = 'display: flex; flex-direction: column; align-items: flex-start';\n` +
    `const list = document.createElement('div');\nlist.style.cssText = 'display: flex; flex-direction: column; align-items: flex-start; padding-inline-start: 24px';\n` +
    `list.append(...children.map(child => child.element));\ngroup.append(parent.element, list);\ndocument.body.append(group);\n\n` +
    `// When the view is removed:\n// parent.destroy(); children.forEach(child => child.destroy());\n`;
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
    const selected = menuSelectedId(state);
    if (selected) after += `menu.setSelected('${selected}');\n`;
    cleanup = '// trigger.destroy();\n';
  }
  if (slug === 'drawer' || slug === 'navigation-rail') {
    // The opener is on the stage only while the rail or drawer does not show itself:
    // a standard open drawer and a rail with its own toggle have none.
    const showTrigger = slug === 'drawer'
      ? state.variant === 'modal' || !state.open
      : state.layout === 'modal' || state.hideWhenCollapsed || !state.showToggle;
    const method = slug === 'drawer' ? 'open' : 'expand';
    after = `${component.variable}.on('select', event => console.log(event.id));\n`;
    if (showTrigger) {
      imports.push('createButton');
      after = `const trigger = createButton({ text: 'Open ${slug === 'drawer' ? 'drawer' : 'navigation'}', variant: 'tonal' });\ntrigger.on('click', () => ${component.variable}.${method}());\ndocument.body.append(trigger.element);\n` + after;
      cleanup = '// trigger.destroy();\n';
    }
  }
  if (slug === 'navigation-rail') {
    const header = railHeaderForm(state);
    if (header) {
      const extended = header.kind === 'extended';
      imports.push(extended ? 'createExtendedFab' : 'createFab');
      const fabConfig = extended
        ? { icon: header.icon, text: header.text, ariaLabel: header.ariaLabel }
        : { icon: header.icon, ariaLabel: header.ariaLabel };
      before = `const header = ${extended ? 'createExtendedFab' : 'createFab'}(${literal(fabConfig)});\n\n`;
      cleanup = `// header.destroy();\n${cleanup}`;
    }
  }
  if (slug === 'tabs') after = `tabs.element.setAttribute('aria-label', '${tabsAriaLabel(state)}');\ntabs.on('change', event => console.log(event.value));\n`;
  if (slug === 'top-app-bar' && state.context && state.context !== 'default') {
    const content = appBarContent('top-app-bar', state);
    if (content.actions.length || content.leading) imports.push('createIconButton');
    if (content.actions.length) {
      after = `const actions = ${literal(content.actions)}.map(config => createIconButton(config));\nactions.forEach(button => topBar.addTrailingElement(button.element));\n`;
      cleanup = '// actions.forEach(button => button.destroy());\n';
    }
    if (content.leading) {
      after += `const navigation = createIconButton(${literal(content.leading)});\ntopBar.addLeadingElement(navigation.element);\n`;
      cleanup += '// navigation.destroy();\n';
    }
    if (content.trailingButton) {
      imports.push('createButton');
      after += `const action = createButton(${literal(content.trailingButton)});\ntopBar.addTrailingElement(action.element);\n`;
      cleanup += '// action.destroy();\n';
    }
    after += `topBar.setScrollState(${state.scrolled});\n`;
  } else if (slug === 'top-app-bar' || slug === 'bottom-app-bar') {
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
  // A toolbar's named action set pairs a FAB with the bar (passed at creation, as the
  // factory takes it) and opens a menu from the trailing more button it adds itself.
  let config = literal(component.config(state));
  if (slug === 'toolbar') {
    const content = toolbarContent(state);
    if (content.fab) {
      imports.push('createFab');
      before = `const fab = createFab(${literal(content.fab)});\n\n`;
      cleanup = '// fab.destroy();\n';
    }
    if (content.overflow) imports.push('createMenu');
    // The menu's items, indented to sit inside the createMenu call in the config literal.
    const menuItems = content.overflow ? literal(content.overflow).split('\n').map((line, index) => index ? `  ${line}` : line).join('\n') : '';
    const extras = [
      ...(content.fab ? ['fab: fab.element', ...(content.fabPosition === 'start' ? ["fabPosition: 'start'"] : [])] : []),
      ...(content.overflow ? [`overflow: (opener) => createMenu({ opener,${content.overflowPosition ? ` position: '${content.overflowPosition}',` : ''} items: ${menuItems} })`] : []),
    ];
    if (extras.length) config = config.replace(/\n\}$/, `,\n  ${extras.join(',\n  ')}\n}`);
  }
  const headerForm = slug === 'navigation-rail' ? railHeaderForm(state) : undefined;
  if (headerForm) config = config.replace(/\n\}$/, ',\n  header: header.element\n}');
  const headerStyle = headerForm?.kind === 'extended' ? 'extended-fab' : headerForm ? 'fab' : '';
  const buttonStyle = slug === 'top-app-bar' && appBarContent('top-app-bar', state).trailingButton ? 'button' : '';
  const styles = ['base', ...component.styles, ...(headerStyle ? [headerStyle] : []), ...(buttonStyle ? [buttonStyle] : [])].map(style => `import 'material/styles/${style}';\n`).join('');
  return `import { ${imports.join(', ')} } from 'material';\n${styles}${state.theme === 'baseline' ? '' : `import 'material/themes/${state.theme}';\n`}\n` +
    `document.documentElement.dataset.theme = '${state.theme}';\ndocument.documentElement.dataset.themeMode = '${state.mode}';\n\n` +
    `${before}const ${component.variable} = ${component.factory}(${config});\n${after}\ndocument.body.append(${component.variable}.element);\n\n// When the view is removed:\n${cleanup}// ${component.variable}.destroy();\n`;
}

function communicationCode(slug: ComponentSlug, state: ComponentState): string {
  const component = components[slug];
  const literal = (value: unknown) => JSON.stringify(value, null, 2).replace(/^(\s*)"([a-zA-Z]+)":/gm, '$1$2:');
  const hasTarget = slug === 'badge' || slug === 'tooltip';
  const uploadTarget = slug === 'tooltip' && state.target === 'upload';
  const presentTarget = slug === 'tooltip' && state.target === 'present';
  // `fab` is a preview style, not one of `styles`: the default tabs do not import it.
  const styles = ['base', ...component.styles, ...(uploadTarget ? ['fab'] : [])].map(style => `import 'material/styles/${style}';\n`).join('');
  let before = '';
  let config = literal(component.config(state));
  let after = `document.body.append(${component.variable}.element);\n`;
  let cleanup = '';
  if (uploadTarget) {
    const target = tooltipTarget(state);
    before = `const target = createFab(${literal({ icon: target.icon, ariaLabel: target.ariaLabel })});\ndocument.body.append(target.element);\n\n`;
    config = config.replace(/\n}$/, ',\n  target: target.element\n}');
    after = '';
    cleanup = '// target.destroy();\n';
  } else if (presentTarget) {
    const target = tooltipTarget(state);
    before = `const target = createIconButton(${literal({ icon: target.icon, ariaLabel: target.ariaLabel, variant: target.variant })});\ndocument.body.append(target.element);\n\n`;
    config = config.replace(/\n}$/, ',\n  target: target.element\n}');
    after = '';
    cleanup = '// target.destroy();\n';
  } else if (hasTarget) {
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
  return `import { ${component.factory}${uploadTarget ? ', createFab' : hasTarget ? ', createIconButton' : slug === 'snackbar' ? ', createButton' : ''} } from 'material';\n${styles}${state.theme === 'baseline' ? '' : `import 'material/themes/${state.theme}';\n`}\n` +
    `document.documentElement.dataset.theme = '${state.theme}';\ndocument.documentElement.dataset.themeMode = '${state.mode}';\n\n` +
    `${before}const ${component.variable} = ${component.factory}(${config});\n${after}\n// When the view is removed:\n${slug === 'snackbar' ? '// snackbar.hide();\n' : ''}// ${component.variable}.destroy();\n${cleanup}`;
}

function containmentCode(slug: ComponentSlug, state: ComponentState): string {
  const component = components[slug];
  const hasTrigger = ['dialog', 'bottom-sheet', 'side-sheet'].includes(slug);
  const shown = component.config(state) as Record<string, unknown>;
  // Card media that is inline art: the library's media API takes an element, which the
  // code builds from the shared markup before the card, so the same art shows everywhere.
  const art = slug === 'card' && !!shown.media && typeof shown.media === 'object' && typeof (shown.media as { markup?: unknown }).markup === 'string'
    ? (shown.media as { markup: string }).markup : undefined;
  const elementRef = '"\\u0000media"';
  const printable = art
    ? { ...shown, media: { element: '\u0000media', aspectRatio: (shown.media as { aspectRatio?: string }).aspectRatio, position: (shown.media as { position?: string }).position } }
    : shown;
  // The Vanilla snippet lists every slide the preview and the other tabs list.
  const config = JSON.stringify(printable, null, 2).replace(/^(\s*)"([a-zA-Z]+)":/gm, '$1$2:')
    .replace(elementRef, 'media');
  const styles = ['base', ...component.styles].map(style => `import 'material/styles/${style}';\n`).join('');
  // A checkbox or a radio group in the markup upgrades only once its element is defined.
  const needsCheckbox = config.includes('<m-checkbox');
  const needsRadios = config.includes('<m-radios') || config.includes('<m-radio ');
  const embedded = `${needsCheckbox ? `import 'material/elements/css/checkbox';\nimport { defineCheckbox } from 'material/elements';\n` : ''}${needsRadios ? `import 'material/elements/css/radios';\nimport { defineRadios } from 'material/elements';\n` : ''}`;
  const define = `${needsCheckbox ? 'defineCheckbox();\n' : ''}${needsRadios ? 'defineRadios();\n' : ''}`;
  const before = art ? `// The demo art is inline SVG, so this snippet needs no image files.\nconst media = document.createElement('div');\nmedia.setHTML(${JSON.stringify(art)});\n` : '';
  let setup = '';
  if (slug === 'list' && state.trailing === 'control') setup += `const onListAction = (event) => {\n  const action = event.target.closest('[data-list-action]');\n  if (action) console.log('Saved:', action.dataset.listAction);\n};\nlist.element.addEventListener('click', onListAction);\n`;
  if (hasTrigger) setup = `const trigger = createButton({ text: 'Open ${component.name.toLowerCase()}', variant: 'tonal' });\ntrigger.on('click', () => ${component.variable}.${slug === 'bottom-sheet' ? 'expand' : 'open'}());\ndocument.body.append(trigger.element);\n`;
  else {
    if (slug === 'divider') setup += `const container = document.createElement('div');\ncontainer.style.cssText = 'display:flex;align-items:center;width:100%;max-width:400px;flex-direction:${state.orientation === 'vertical' ? 'column' : 'row'};${state.orientation === 'vertical' ? 'height:200px;' : ''}';\ndivider.element.style.flex = '1';\ncontainer.append(divider.element);\ndocument.body.append(container);\n`;
    if (slug === 'carousel') setup += "// A carousel needs a container with a defined height.\ncarousel.element.style.height = '320px';\n" + (state.slidesDefault ? '' : "// Capped as the playground's preview caps it, so the same photos stay in view.\ncarousel.element.style.maxWidth = '560px';\n");
    if (slug !== 'divider') setup += `document.body.append(${component.variable}.element);\n`;
    if (slug === 'carousel') setup += "\n// Drive it from your own controls: carousel.next(), carousel.prev(), carousel.goTo(index).\n// 'change' reports every move: from the API, a swipe, the keyboard or a trackpad.\ncarousel.on('change', ({ value }) => console.log(`Slide ${value + 1} of ${carousel.slides.getCount()}`));\n";
  }
  return `import { ${component.factory}${hasTrigger ? ', createButton' : ''} } from 'material';\n${styles}${embedded}${state.theme === 'baseline' ? '' : `import 'material/themes/${state.theme}';\n`}\n` +
    `document.documentElement.dataset.theme = '${state.theme}';\ndocument.documentElement.dataset.themeMode = '${state.mode}';\n\n` +
    `${before}${define}${slug === 'card' && state.media && !art || slug === 'carousel' || slug === 'list' && ['image', 'video'].includes(String(state.leading)) ? '// Replace the demo image paths with your own images.\n' : ''}const ${component.variable} = ${component.factory}(${config});\n${setup}\n// When the view is removed:\n// ${component.variable}.destroy();\n${slug === 'list' && state.trailing === 'control' ? '// list.element.removeEventListener(\'click\', onListAction);\n' : hasTrigger ? '// trigger.destroy();\n' : slug === 'divider' ? '// container.remove();\n' : ''}`;
}
