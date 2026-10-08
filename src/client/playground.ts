import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import { components, componentCode, elementConfig, initialComponentState, isComponent, normalizeComponentState, type ComponentState, type Scenario } from '../shared/components';
import { checkboxEditClearsCheckedSet } from '../shared/content/checkbox';
import { controlConcealed, sectionConcealed } from '../shared/content/types';
import { drawerActiveOptions } from '../shared/content/drawer';
import { barActiveOptions } from '../shared/content/navigation-bar';
import { railActiveOptions } from '../shared/content/navigation-rail';
import { tabActiveOptions } from '../shared/content/tabs';
import { FRAMEWORKS, frameworkCode, type ElementMeta, type Framework } from '../shared/frameworks';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('xml', xml);

const componentSlug = document.querySelector<HTMLElement>('[data-component]')!.dataset.component!;
if (!isComponent(componentSlug)) throw new Error('Unknown component');
const slug = componentSlug;

const form = document.querySelector<HTMLFormElement>('#configuration')!;
const frame = document.querySelector<HTMLIFrameElement>('#preview')!;
const code = document.querySelector<HTMLElement>('#generated-code')!;
const status = document.querySelector<HTMLElement>('#playground-status')!;
const scenarios = components[slug].scenarios;
// Only a component with scenarios renders the Scenario section; without it there is no
// select to read, so every scenario path below is inert, `?scenario=` included.
const scenarioSelect = document.querySelector<HTMLSelectElement>('#scenario');
const scenarioDescription = document.querySelector<HTMLElement>('#scenario-description');
let unknownScenario = false;
const tabs = [...document.querySelectorAll<HTMLButtonElement>('.preview-tab')];
const copyButton = document.querySelector<HTMLButtonElement>('#copy-code')!;
const previewDot = document.querySelector<HTMLElement>('.preview-dot')!;
let state: ComponentState = initialComponentState(slug);

// Framework tabs in the code view: generated from the same configuration, through
// the web component's spec. Without one, only vanilla is available.
const elementMetaScript = document.querySelector<HTMLScriptElement>('#element-meta');
const element: ElementMeta | null = elementMetaScript ? JSON.parse(elementMetaScript.textContent || 'null') : null;
const frameworkTabs = [...document.querySelectorAll<HTMLButtonElement>('.framework-tab')];
const FRAMEWORK_KEY = 'md3-example-framework';
const codeTab = document.querySelector<HTMLButtonElement>('#code-tab')!;
let framework: Framework = 'vanilla';
try {
  const saved = localStorage.getItem(FRAMEWORK_KEY) as Framework | null;
  // Vanilla by default; a framework chosen on any page is remembered.
  framework = element && saved && FRAMEWORKS.some(f => f.id === saved) ? saved : 'vanilla';
} catch { framework = 'vanilla'; }

function currentCode(): { text: string; language: string } {
  const language = FRAMEWORKS.find(f => f.id === framework)!.language;
  if (framework === 'vanilla' || !element) return { text: componentCode(slug, state), language: 'javascript' };
  return { text: frameworkCode(framework, element, elementConfig(slug, state), { theme: String(state.theme), mode: String(state.mode) }), language };
}
// Only a choice made here is saved: a page without the element shows vanilla
// without forgetting the framework picked elsewhere.
function selectFramework(next: Framework, focus = false, save = false) {
  framework = element || next === 'vanilla' ? next : 'vanilla';
  for (const tab of frameworkTabs) {
    const on = tab.dataset.framework === framework;
    tab.setAttribute('aria-selected', String(on));
    tab.tabIndex = on ? 0 : -1;
    if (on && focus) tab.focus();
  }
  for (const size of document.querySelectorAll<HTMLElement>('.component-size [data-flavour]')) size.hidden = size.dataset.flavour !== (framework === 'vanilla' ? 'factory' : 'element');
  if (save) {
    try { localStorage.setItem(FRAMEWORK_KEY, framework); } catch { /* Storage may be unavailable. */ }
  }
  renderCode();
}
function renderCode() {
  const { text, language } = currentCode();
  code.className = `hljs language-${language}`;
  code.innerHTML = hljs.highlight(text, { language }).value;
}
frameworkTabs.forEach(tab => {
  // The preview is the same in every framework: picking one shows its code.
  tab.addEventListener('click', () => { selectFramework(tab.dataset.framework as Framework, false, true); selectTab(codeTab, true); });
  tab.addEventListener('keydown', event => {
    const enabled = frameworkTabs.filter(t => !t.disabled);
    const index = enabled.indexOf(tab);
    const target = event.key === 'ArrowRight' ? enabled[(index + 1) % enabled.length]
      : event.key === 'ArrowLeft' ? enabled[(index + enabled.length - 1) % enabled.length]
      : event.key === 'Home' ? enabled[0] : event.key === 'End' ? enabled.at(-1) : undefined;
    if (!target) return;
    event.preventDefault();
    selectFramework(target.dataset.framework as Framework, true, true);
    selectTab(codeTab, true);
  });
});
const appearanceKey = 'md3-preview-appearance';
const themeSelect = document.querySelector<HTMLSelectElement>('#preview-theme')!;
const modeInputs = [...document.querySelectorAll<HTMLInputElement>('.preview-appearance input[name="mode"]')];

function applyAppearance(appearance: ComponentState) {
  document.documentElement.dataset.previewMode = String(appearance.mode);
  // Keep the user's appearance as the reset defaults, too.
  for (const option of themeSelect.options) option.defaultSelected = option.value === appearance.theme;
  themeSelect.value = String(appearance.theme);
  for (const input of modeInputs) input.checked = input.defaultChecked = input.value === appearance.mode;
}
try {
  applyAppearance(normalizeComponentState(slug, JSON.parse(localStorage.getItem(appearanceKey) || '{}')));
} catch { /* Keep the default appearance when storage is unavailable or invalid. */ }

const VIEW_KEY = 'md3-playground-view';
function selectTab(selected: HTMLButtonElement, save = false) {
  for (const tab of tabs) {
    const active = tab === selected;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')!)!.hidden = !active;
  }
  const showingCode = selected.id === 'code-tab';
  copyButton.hidden = !showingCode;
  previewDot.hidden = showingCode;
  if (save) {
    try { localStorage.setItem(VIEW_KEY, showingCode ? 'code' : 'preview'); } catch { /* Storage may be unavailable. */ }
  }
}
for (const tab of tabs) {
  tab.addEventListener('click', () => selectTab(tab, true));
  tab.addEventListener('keydown', event => {
    const index = tabs.indexOf(tab);
    const target = event.key === 'ArrowRight' ? tabs[(index + 1) % tabs.length]
      : event.key === 'ArrowLeft' ? tabs[(index + tabs.length - 1) % tabs.length]
      : event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs.at(-1) : undefined;
    if (!target) return;
    event.preventDefault();
    selectTab(target, true);
    target.focus();
  });
}

function readForm(): ComponentState {
  const values = Object.fromEntries(new FormData(form));
  // Disabled dependent controls retain their configured value.
  for (const control of form.querySelectorAll<HTMLInputElement>('[data-enabled-when]:disabled')) {
    if (control.type === 'radio' && !control.checked) continue;
    values[control.name] = control.type === 'checkbox' ? (control.checked ? 'on' : '') : control.value;
  }
  const input: Record<string, unknown> = { ...values };
  for (const control of components[slug].controls) if (control.kind === 'toggle') input[control.key] = values[control.key] === 'on';
  return normalizeComponentState(slug, input);
}
function syncControls(next: ComponentState) {
  for (const control of components[slug].controls) {
    for (const input of form.querySelectorAll<HTMLInputElement | HTMLSelectElement>(`[name="${control.key}"]`)) {
      if (input instanceof HTMLInputElement && input.type === 'checkbox') input.checked = next[control.key] === true;
      else if (input instanceof HTMLInputElement && input.type === 'radio') input.checked = input.value === next[control.key];
      else input.value = String(next[control.key]);
    }
  }
  for (const output of form.querySelectorAll<HTMLOutputElement>('[data-value-for]')) output.value = String(next[output.dataset.valueFor!]);
  const selectedChipsInput = form.querySelector<HTMLInputElement>('[name="selectedChips"]');
  if (selectedChipsInput) selectedChipsInput.value = next.selectedChips !== undefined ? String(next.selectedChips) : '';
  const checkedChildrenInput = form.querySelector<HTMLInputElement>('[name="checkedChildren"]');
  if (checkedChildrenInput) checkedChildrenInput.value = next.checkedChildren !== undefined ? String(next.checkedChildren) : '';
}
/** The Selected list names only the destinations on the stage. */
function refreshActiveSelect(next: ComponentState) {
  const options = slug === 'navigation-rail' ? railActiveOptions(next) : slug === 'navigation-bar' ? barActiveOptions(next) : slug === 'drawer' ? drawerActiveOptions(next) : slug === 'tabs' ? tabActiveOptions(next) : null;
  if (!options) return;
  const select = form.querySelector<HTMLSelectElement>('[name="active"]');
  if (!select) return;
  const same = select.options.length === options.length && options.every((option, index) => select.options[index]?.value === option.value && select.options[index]?.textContent === option.label);
  if (same) return;
  select.replaceChildren(...options.map(option => {
    const element = document.createElement('option');
    element.value = option.value;
    element.textContent = option.label;
    return element;
  }));
}
function update(send = true, reset = false) {
  state = readForm();
  refreshActiveSelect(state);
  syncControls(state);
  for (const input of form.querySelectorAll<HTMLInputElement>('[data-enabled-when]')) input.disabled = state[input.dataset.enabledWhen!] !== true;
  // A control a named set replaces leaves the panel while that key is off,
  // whatever its sibling gate says. The input stays, so the value comes back
  // with the default. `hidden` takes the row out of sight, the accessibility
  // tree, and the tab order.
  for (const control of components[slug].controls) {
    if (!control.replaced) continue;
    const field = form.querySelector<HTMLElement>(`[name="${control.key}"]`);
    const row = field?.closest<HTMLElement>('[data-replaced]');
    if (row) row.hidden = controlConcealed(control, state);
  }
  // A heading over no row reads as something broken. The section leaves with
  // its last row and comes back with the first one that shows. The server
  // ships the default, where no section is empty.
  for (const section of form.querySelectorAll<HTMLElement>('section.configuration-controls')) {
    const rows = [...section.querySelectorAll<HTMLElement>(':scope > .ui-row')];
    section.hidden = sectionConcealed(rows.map(row => row.hidden));
  }
  renderCode();
  if (send) frame.contentWindow?.postMessage({ type: 'md3:configure', state, reset }, location.origin);
}

// The Scenario select: Default, the component's named scenarios, and Custom. Custom is
// how the select reports options that no longer match a scenario; it is not a
// destination.
const scenarioById = (id: string) => scenarios.find(scenario => scenario.id === id);
/** The select and its one-line description, from the selected entry. */
function showScenario(id: string) {
  if (!scenarioSelect || !scenarioDescription) return;
  scenarioSelect.value = id;
  scenarioDescription.textContent = id === 'default' ? 'The options this playground starts with.'
    : id === 'custom' ? 'These options were changed from a scenario.'
    : scenarioById(id)?.description ?? 'The options this playground starts with.';
}
/** `?scenario=`, written over the address as it is: path, other keys and hash stay. */
function setScenarioParam(id: string | null) {
  if (!scenarioSelect) return;
  const url = new URL(location.href);
  if ((url.searchParams.get('scenario') ?? null) === id) return;
  if (id === null) url.searchParams.delete('scenario'); else url.searchParams.set('scenario', id);
  history.replaceState(null, '', url);
}
/** A hand edit: the options no longer match a scenario, so the select says Custom. */
function markCustom() {
  if (!scenarioSelect || scenarioSelect.value === 'custom') return;
  showScenario('custom');
  setScenarioParam(null);
}
/** Applies options over the initials, then updates through the same path as a hand edit. */
function applyOptions(id: string, options: Readonly<Record<string, string | boolean>>) {
  const next = normalizeComponentState(slug, { ...initialComponentState(slug), ...options });
  refreshActiveSelect(next);
  syncControls(next);
  showScenario(id);
  setScenarioParam(id === 'default' ? null : id);
  update();
}
/** Applies a named scenario's options. */
function applyScenario(scenario: Scenario) {
  applyOptions(scenario.id, scenario.options);
}
scenarioSelect?.addEventListener('change', () => {
  const id = scenarioSelect.value;
  // Choosing Custom leaves the controls as they are; the address drops the scenario.
  if (id === 'custom') { setScenarioParam(null); return; }
  const scenario = scenarioById(id);
  if (scenario) applyScenario(scenario); else applyOptions('default', {});
});
form.addEventListener('input', event => {
  const target = event.target;
  // The scenario select is a command, not an option: its own change handler applies it.
  if (target === scenarioSelect) return;
  if (slug === 'list' && state.selection === 'single' && target instanceof HTMLInputElement && target.checked && ['first', 'second', 'third', 'fourth', 'fifth'].includes(target.name)) {
    for (const input of form.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')) if (input !== target && ['first', 'second', 'third', 'fourth', 'fifth'].includes(input.name)) input.checked = false;
  }
  // State replaces the stored mix on the way through normalize. The option set and the family drop it.
  const edited = target instanceof HTMLInputElement || target instanceof HTMLSelectElement ? target.name : '';
  if (slug === 'checkbox' && checkboxEditClearsCheckedSet(edited)) {
    const stored = form.querySelector<HTMLInputElement>('[name="checkedChildren"]');
    if (stored) stored.value = '';
  }
  update();
  markCustom();
});
// Form-associated footer controls participate in FormData/reset, but events bubble through the footer.
document.querySelector('.preview-appearance')!.addEventListener('input', () => {
  update();
  applyAppearance(state);
  try { localStorage.setItem(appearanceKey, JSON.stringify({ theme: state.theme, mode: state.mode })); }
  catch { /* The controls still work when storage is unavailable. */ }
});
form.addEventListener('submit', event => event.preventDefault());
form.addEventListener('reset', () => {
  status.textContent = 'Resetting configuration…';
  // The scenario select resets with the form: its default is Default.
  setTimeout(() => { showScenario('default'); setScenarioParam(null); update(true, true); }, 0);
});
frame.addEventListener('load', () => update());
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
  // The unknown-id message belongs to the load that carried it: the flag is cleared here,
  // so a later preview reload reports ready again.
  if (event.data?.type === 'md3:ready') {
    update();
    status.textContent = unknownScenario ? 'Unknown scenario. Showing Default.' : 'Ready to try';
    unknownScenario = false;
  }
  if (event.data?.type === 'md3:reset') status.textContent = 'Configuration reset';
  if (event.data?.type === 'md3:click') status.textContent = `${components[slug].name} clicked · ${event.data.count}`;
  if (event.data?.type === 'md3:event' && typeof event.data.message === 'string') status.textContent = event.data.message;
  // A change coming back from the preview writes a control, so the options are the
  // person's own from here on, as a hand edit is.
  if (event.data?.type === 'md3:selected' && typeof event.data.selected === 'boolean') {
    const selected = form.querySelector<HTMLInputElement>('[name="selected"]');
    if (selected) { selected.checked = event.data.selected; update(false); markCustom(); }
  }
  if (event.data?.type === 'md3:checkbox' && slug === 'checkbox' && ['checked', 'unchecked', 'indeterminate'].includes(event.data.state)) {
    const control = form.querySelector<HTMLSelectElement>('[name="state"]')!;
    control.value = event.data.state;
    update(false);
    markCustom();
  }
  if (event.data?.type === 'md3:values' && event.data.values && typeof event.data.values === 'object') {
    syncControls(normalizeComponentState(slug, { ...state, ...event.data.values }));
    update(false);
    markCustom();
  }
  if (event.data?.type === 'md3:error') status.textContent = 'Preview could not load. Please reload the page.';
});
copyButton.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(currentCode().text); status.textContent = 'Code copied'; }
  catch {
    selectTab(document.querySelector<HTMLButtonElement>('#code-tab')!);
    const range = document.createRange(); range.selectNodeContents(code);
    const selection = window.getSelection(); selection?.removeAllRanges(); selection?.addRange(range);
    status.textContent = 'Code selected. Use your copy shortcut.';
  }
});
selectFramework(framework);
try { if (localStorage.getItem(VIEW_KEY) === 'code') selectTab(codeTab); } catch { /* Storage may be unavailable. */ }
// `?scenario=` is the only configuration parameter a load reads: a known id applies over
// any control-key parameter, an unknown one falls back to Default and says so. A page
// without a Scenario section does not read it at all, so the parameter is left as it is.
const requested = scenarioSelect ? new URL(location.href).searchParams.get('scenario') : null;
const requestedScenario = requested ? scenarioById(requested) : undefined;
if (requested && !requestedScenario) { unknownScenario = true; setScenarioParam(null); }
if (requestedScenario) applyScenario(requestedScenario); else update();
