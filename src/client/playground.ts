import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import { components, componentCode, elementConfig, initialComponentState, isComponent, normalizeComponentState, type ComponentState, type Scenario } from '../shared/components';
import { checkboxEditClearsCheckedSet } from '../shared/content/checkbox';
import { controlConcealed, sectionConcealed } from '../shared/content/types';
import { drawerActiveOptions } from '../shared/content/navigation-drawer';
import { barActiveOptions } from '../shared/content/navigation-bar';
import { railActiveOptions } from '../shared/content/navigation-rail';
import { tabActiveOptions } from '../shared/content/tabs';
import { applyTheme } from './theme-sheets';
import { FRAMEWORKS, frameworkCode, type ElementMeta, type Framework } from '../shared/frameworks';
import { registerPage, replacePageURL } from './page-lifecycle';
registerPage('playground', (content, life) => {
  hljs.registerLanguage('javascript', javascript);
  hljs.registerLanguage('typescript', typescript);
  hljs.registerLanguage('xml', xml);

  const componentSlug = content.querySelector<HTMLElement>('[data-component]')!.dataset.component!;
  if (!isComponent(componentSlug)) throw new Error('Unknown component');
  const slug = componentSlug;

  const form = content.querySelector<HTMLFormElement>('#configuration')!;
  const frame = content.querySelector<HTMLIFrameElement>('#preview')!;
  const code = content.querySelector<HTMLElement>('#generated-code')!;
  const status = content.querySelector<HTMLElement>('#playground-status')!;
  // The panel's controls are material's own elements, server-rendered
  // (src/server/playground-panel.ts) and defined by playground-material.js, which
  // loads before this file.
  /** The panel's elements: what this file reads off them, once they are defined. */
  type FieldHost = HTMLElement & { value: string | null };
  type SwitchHost = HTMLElement & { checked: boolean };
  type GroupHost = HTMLElement & { value: string | string[] | null };
  type TabsHost = HTMLElement & { value: string | null };
  const defined = <T extends HTMLElement>(element: T | null): element is T => !!element && element.matches(':defined');
  const scenarios = components[slug].scenarios;
  // Only a component with scenarios renders the Scenario section; without it there is no
  // select to read, so every scenario path below is inert, `?scenario=` included.
  const scenarioSelect = content.querySelector<HTMLSelectElement | FieldHost>('#scenario');
  const scenarioDescription = content.querySelector<HTMLElement>('#scenario-description');
  let unknownScenario = false;
  const tabs = [...content.querySelectorAll<HTMLButtonElement>('.preview-tab')];
  // The view switcher: <m-tabs>, whose value is the showing panel.
  const viewTabs = content.querySelector<TabsHost>('m-tabs[aria-label="Playground view"]');
  const copyButton = content.querySelector<HTMLElement>('#copy-code')!;
  const previewDot = content.querySelector<HTMLElement>('.preview-dot')!;
  let state: ComponentState = initialComponentState(slug);

  // Framework tabs in the code view: generated from the same configuration, through
  // the web component's spec. Without one, only vanilla is available.
  const elementMetaScript = content.querySelector<HTMLScriptElement>('#element-meta');
  const element: ElementMeta | null = elementMetaScript ? JSON.parse(elementMetaScript.textContent || 'null') : null;
  // The framework picker: material's single-select filter chip set in
  // place of the tabs (playground-panel.ts). Picking a chip does what a tab click
  // did: show that framework's code, and remember it.
  type ChipsHost = HTMLElement & { value: string | string[] | null };
  const frameworkChips = content.querySelector<ChipsHost>('m-chips.framework-chips');
  life.events(frameworkChips)?.addEventListener('change', event => {
    const value = (event as CustomEvent<{ value?: unknown }>).detail?.value ?? frameworkChips!.value;
    const next = String(Array.isArray(value) ? value[0] ?? '' : value ?? '');
    if (!FRAMEWORKS.some(f => f.id === next) || next === framework) return;
    selectFramework(next as Framework, false, true);
    switchView('code');
  });
  const FRAMEWORK_KEY = 'md3-example-framework';
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
    // The chip set: its value is the framework (setting it to the same
    // value is a no-op, so the chips' own change does not loop back here).
    // Before the element is defined the property would shadow its setter: the
    // attribute carries the value until the upgrade reads it.
    if (frameworkChips && !frameworkChips.matches(':defined')) frameworkChips.setAttribute('value', framework);
    else if (frameworkChips && String(frameworkChips.value) !== framework) {
      frameworkChips.value = framework;
      // material's chip set keeps its tab stop on the first chip until focus
      // moves (features/controller.js syncTabStop); the native tabs kept it on
      // the selected one. A value set from here (the saved framework on load)
      // moves the tab stop to the selected chip, so Tab lands on the choice.
      for (const cell of frameworkChips.shadowRoot?.querySelectorAll<HTMLElement>('[role="gridcell"]') ?? []) cell.tabIndex = cell.getAttribute('aria-selected') === 'true' ? 0 : -1;
    }
    for (const size of content.querySelectorAll<HTMLElement>('.component-size [data-flavour]')) size.hidden = size.dataset.flavour !== (framework === 'vanilla' ? 'factory' : 'element');
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
  // Theme and mode are the site's (the header's Themes menu and moon, site.ts): the
  // heading's hidden inputs carry them into the form, the preview follows through
  // update(), and the panel's scopes take them so its material elements are themed.
  const themeInput = content.querySelector<HTMLInputElement>('input[data-appearance="theme"]')!;
  const modeInput = content.querySelector<HTMLInputElement>('input[data-appearance="mode"]')!;
  const panelScopes = [...content.querySelectorAll<HTMLElement>('.playground--material')];
  function applyAppearance(theme: string, mode: string) {
    themeInput.value = theme;
    modeInput.value = mode;
    document.documentElement.dataset.previewMode = mode;
    for (const scope of panelScopes) scope.dataset.themeMode = mode;
    applyTheme(document, theme, panelScopes);
  }
  applyAppearance(document.documentElement.dataset.siteTheme ?? 'baseline', document.documentElement.dataset.themeMode === 'dark' ? 'dark' : 'light');

  /** The panels and the controls that belong to the showing view. */
  function showPanel(showingCode: boolean) {
    content.querySelector<HTMLElement>('#live-panel')!.hidden = showingCode;
    content.querySelector<HTMLElement>('#code-panel')!.hidden = !showingCode;
    previewDot.hidden = showingCode;
  }
  function selectTab(selected: HTMLButtonElement) {
    for (const tab of tabs) {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      content.querySelector<HTMLElement>(`#${CSS.escape(tab.getAttribute('aria-controls')!)}`)!.hidden = !active;
    }
    const showingCode = selected.id === 'code-tab';
    previewDot.hidden = showingCode;
  }
  // The tabs select by value; the element keeps its own roving focus and
  // arrow keys, and reports a choice with `change`.
  function selectView(view: 'live' | 'code') {
    if (defined(viewTabs)) viewTabs!.value = view;
    showPanel(view === 'code');
  }
  /** Shows a view on either panel: the branch every caller takes. */
  const switchView = (view: 'live' | 'code') => (viewTabs ? selectView(view) : selectTab(content.querySelector<HTMLButtonElement>(view === 'code' ? '#code-tab' : '#live-tab')!));
  life.events(viewTabs)?.addEventListener('change', () => selectView(String(viewTabs!.value) === 'code' ? 'code' : 'live'));
  for (const tab of tabs) {
    life.events(tab).addEventListener('click', () => selectTab(tab));
    life.events(tab).addEventListener('keydown', event => {
      const index = tabs.indexOf(tab);
      const target = event.key === 'ArrowRight' ? tabs[(index + 1) % tabs.length]
        : event.key === 'ArrowLeft' ? tabs[(index + tabs.length - 1) % tabs.length]
        : event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs.at(-1) : undefined;
      if (!target) return;
      event.preventDefault();
      selectTab(target);
      target.focus();
    });
  }

  function readForm(): ComponentState {
    const values = Object.fromEntries(new FormData(form));
    // Disabled dependent controls retain their configured value: a disabled
    // form-associated element is left out of FormData, and `:disabled` matches its
    // disabled attribute. The name attribute: material's hosts (m-text-field,
    // m-switch, m-select) have no `name` property.
    for (const control of form.querySelectorAll<HTMLElement>('[data-enabled-when]:disabled')) {
      values[control.getAttribute('name') ?? ''] = control.tagName === 'M-SWITCH' ? ((control as SwitchHost).checked ? 'on' : '') : String((control as FieldHost).value ?? '');
    }
    const input: Record<string, unknown> = { ...values };
    for (const control of components[slug].controls) if (control.kind === 'toggle') input[control.key] = values[control.key] === 'on';
    return normalizeComponentState(slug, input);
  }
  function syncControls(next: ComponentState) {
    // A range that steps by another control (stepFrom) takes that step first: material's
    // slider snaps a value to its step, so a scenario's 72 under the default step of 10
    // would land on 70.
    for (const control of components[slug].controls) {
      if (!control.stepFrom) continue;
      const range = form.querySelector<HTMLElement>(`[name="${control.key}"]`);
      const step = String(next[control.stepFrom] ?? control.step ?? 1);
      if (range && range.getAttribute('step') !== step) range.setAttribute('step', step);
    }
    for (const control of components[slug].controls) {
      for (const input of form.querySelectorAll<HTMLElement>(`[name="${control.key}"]`)) {
        // A group's hidden input belongs to the glue (playground-material.ts); the
        // group itself is moved just below.
        if (input instanceof HTMLInputElement && input.hasAttribute('data-input-for')) continue;
        if (input.tagName === 'M-SWITCH') (input as SwitchHost).checked = next[control.key] === true;
        else (input as FieldHost).value = String(next[control.key]);
      }
    }
    // The groups show a value their hidden input carries into the form; the
    // glue moves them when the input changes, and this moves them with a sync. Only
    // the component's own controls: the heading's mode group is the viewer's
    // appearance, which a scenario (Default included) leaves as it is.
    const controlKeys = new Set(components[slug].controls.map(control => control.key));
    for (const group of content.querySelectorAll<GroupHost>('m-button-group[data-group-for]')) {
      const key = group.getAttribute('data-group-for')!;
      if (!controlKeys.has(key)) continue;
      const value = next[key];
      if (typeof value === 'string' && defined(group)) group.value = value;
    }
    for (const output of form.querySelectorAll<HTMLOutputElement>('[data-value-for]')) output.value = String(next[output.dataset.valueFor!]);
    const selectedChipsInput = form.querySelector<HTMLInputElement>('[name="selectedChips"]');
    if (selectedChipsInput) selectedChipsInput.value = next.selectedChips !== undefined ? String(next.selectedChips) : '';
    const checkedChildrenInput = form.querySelector<HTMLInputElement>('[name="checkedChildren"]');
    if (checkedChildrenInput) checkedChildrenInput.value = next.checkedChildren !== undefined ? String(next.checkedChildren) : '';
  }
  /** The Selected list names only the destinations on the stage. */
  function refreshActiveSelect(next: ComponentState) {
    const options = slug === 'navigation-rail' ? railActiveOptions(next) : slug === 'navigation-bar' ? barActiveOptions(next) : slug === 'navigation-drawer' ? drawerActiveOptions(next) : slug === 'tabs' ? tabActiveOptions(next) : null;
    if (!options) return;
    const select = form.querySelector<HTMLElement>('[name="active"]');
    if (!select) return;
    // The material panel's select declares its options as <m-select-option> children,
    // which the element observes; a native select has <option>s.
    const tag = select.tagName === 'M-SELECT' ? 'm-select-option' : 'option';
    const current = [...select.querySelectorAll(`:scope > ${tag}`)];
    const same = current.length === options.length && options.every((option, index) => current[index]?.getAttribute('value') === option.value && current[index]?.textContent === option.label);
    if (same) return;
    select.replaceChildren(...options.map(option => {
      const element = document.createElement(tag);
      element.setAttribute('value', option.value);
      element.textContent = option.label;
      return element;
    }));
    // material's select applies new options in its MutationObserver, a microtask,
    // keeping its value only if the new options carry it, so a value set now (by
    // syncControls) is lost and the select reads null. Once it has applied them, set
    // the wanted value (or the first option, a native select's fallback) and update
    // again if the state moved. This microtask is queued after the observer's.
    if (tag === 'm-select-option') {
      const wanted = String(next.active ?? '');
      queueMicrotask(() => {
        const host = select as HTMLElement & { value?: unknown };
        const target = options.some(option => option.value === wanted) ? wanted : options[0]?.value;
        if (target !== undefined && String(host.value ?? '') !== target) {
          host.value = target;
          update();
        }
      });
    }
  }
  function update(send = true, reset = false) {
    state = readForm();
    refreshActiveSelect(state);
    syncControls(state);
    // A disabled state reaches an element through its attribute (the property the
    // native input has is not one the element exposes), and the form's disable hook
    // takes it from there.
    for (const input of form.querySelectorAll<HTMLElement>('[data-enabled-when]')) {
      const off = state[input.dataset.enabledWhen!] !== true;
      if (input.tagName.startsWith('M-')) off ? input.setAttribute('disabled', '') : input.removeAttribute('disabled');
      else (input as HTMLInputElement).disabled = off;
    }
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
    if (!scenarioSelect) return;
    scenarioSelect.value = id;
    // The material panel has no description line: the select's value says it all.
    if (!scenarioDescription) return;
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
    replacePageURL(url);
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
  life.events(scenarioSelect)?.addEventListener('change', () => {
    const id = String(scenarioSelect!.value ?? '');
    // Choosing Custom leaves the controls as they are; the address drops the scenario.
    if (id === 'custom') { setScenarioParam(null); return; }
    const scenario = scenarioById(id);
    if (scenario) applyScenario(scenario); else applyOptions('default', {});
  });
  // The panel's elements report with `change` (the text field with both); the same
  // handler serves both events, and an element's `change` is dropped when the
  // state already holds its value — one edit, one update, as before.
  const signature = (target: EventTarget | null): string => {
    const element = target as (HTMLElement & { value?: unknown; checked?: unknown }) | null;
    if (!element || (element.tagName.startsWith('M-') && !element.matches(':defined'))) return '';
    const value = 'checked' in element ? String(element.checked) : String(element.value ?? '');
    return `${element.tagName}:${value}`;
  };
  /** Whether the playground's state already holds what the control shows. */
  const stateHolds = (element: HTMLElement & { value?: unknown; checked?: unknown }): boolean => {
    const name = element.getAttribute('name');
    if (!name || !(name in state)) return true;
    return 'checked' in element ? (state[name] === true) === (element.checked === true) : String(state[name]) === String(element.value ?? '');
  };
  const onEdit = (event: Event) => {
    const target = event.target;
    // The scenario select is a command, not an option: its own change handler applies it.
    if (target === scenarioSelect) return;
    // The switch's inner checkbox leaks a composed `input` before the element has
    // reported to its form internals; reading the form then would see the switch
    // unchecked and stomp it back. The element's own `change` is the report.
    if (event.type === 'input' && target instanceof HTMLElement && target.tagName === 'M-SWITCH') return;
    if (event.type === 'change') {
      // The text field reports live through `input`; its `change` adds nothing.
      if (target instanceof HTMLElement && target.tagName === 'M-TEXT-FIELD') return;
      const seen = signature(target);
      // A change the state already holds is no edit: the `input` that came first
      // carried it, or the person re-picked the option the control already showed
      // (which must not turn the scenario to Custom). The preview can write a control
      // between two edits (a click in the checkbox preview sets State to checked); a
      // pick back to an earlier value then differs from the state and goes through.
      if (seen !== '' && stateHolds(target as HTMLElement)) return;
    }
    // The edited control's name: a native input's or select's, or a material element's
    // name attribute (m-select, m-switch, m-text-field), which the panel now renders on
    // every page. Reading only native targets left both rules below dead there.
    const edited = target instanceof HTMLElement ? target.getAttribute('name') ?? '' : '';
    const rows = ['first', 'second', 'third', 'fourth', 'fifth'];
    const isOn = (element: Element) => element instanceof HTMLInputElement ? element.checked : (element as SwitchHost).checked === true;
    if (slug === 'list' && state.selection === 'single' && target instanceof HTMLElement && rows.includes(edited) && isOn(target)) {
      for (const other of form.querySelectorAll<HTMLElement>('input[type="checkbox"], m-switch')) {
        if (other === target || !rows.includes(other.getAttribute('name') ?? '')) continue;
        if (other instanceof HTMLInputElement) other.checked = false;
        else (other as SwitchHost).checked = false;
      }
    }
    // State replaces the stored mix on the way through normalize. The option set and the family drop it.
    if (slug === 'checkbox' && checkboxEditClearsCheckedSet(edited)) {
      const stored = form.querySelector<HTMLInputElement>('[name="checkedChildren"]');
      if (stored) stored.value = '';
    }
    update();
    markCustom();
  };
  life.events(form).addEventListener('input', onEdit);
  life.events(form).addEventListener('change', onEdit);
  // The site stored the choice already (site.ts); the page applies it and the preview follows.
  life.events(window).addEventListener('md3:appearance', event => {
    const { theme, mode } = (event as CustomEvent<{ theme: string; mode: string }>).detail;
    applyAppearance(theme, mode);
    update();
  });
  life.events(form).addEventListener('submit', event => event.preventDefault());
  life.events(frame).addEventListener('load', () => update());
  life.events(window).addEventListener('message', event => {
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
  /** One material snackbar, made on first use inside the panel's scope (it takes the theme). */
  type SnackbarHost = HTMLElement & { show(): void };
  let snackbar: SnackbarHost | null = null;
  function showSnackbar(message: string) {
    if (!life.active) return;
    if (!snackbar) {
      snackbar = document.createElement('m-snackbar') as SnackbarHost;
      snackbar.setAttribute('duration', 'short');
      content.querySelector('.playground.playground--material')?.append(snackbar);
    }
    snackbar.setAttribute('message', message);
    snackbar.show();
  }
  life.events(copyButton).addEventListener('click', async () => {
    // The snackbar is the confirmation and its own live region (role="status"), so the
    // footer's status stays quiet on success: one announcement, not two.
    try { await navigator.clipboard.writeText(currentCode().text); showSnackbar('Code copied'); }
    catch {
      switchView('code');
      const range = document.createRange(); range.selectNodeContents(code);
      const selection = window.getSelection(); selection?.removeAllRanges(); selection?.addRange(range);
      status.textContent = 'Code selected. Use your copy shortcut.';
    }
  });
  selectFramework(framework);
  // `?scenario=` is the only configuration parameter a load reads: a known id applies over
  // any control-key parameter, an unknown one falls back to Default and says so. A page
  // without a Scenario section does not read it at all, so the parameter is left as it is.
  const requested = scenarioSelect ? new URL(location.href).searchParams.get('scenario') : null;
  const requestedScenario = requested ? scenarioById(requested) : undefined;
  if (requested && !requestedScenario) { unknownScenario = true; setScenarioParam(null); }
  if (requestedScenario) applyScenario(requestedScenario); else update();
});
