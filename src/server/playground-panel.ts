// The playground's configuration panel on every component page: its controls as
// material's own elements, rendered on the server with material/ssr
// (`renderElement`, declarative shadow DOM, link mode) so the panel is styled
// at first paint, without JavaScript.
//
// The look is material out of the box: the baseline theme, light or dark with
// the site's mode, tokens scoped to the panel the way the catalog cards get
// theirs (`scopedTokens`), and little restyling of the elements from this site.
// The elements run at compact density and the groups at the xs size, close to
// the native controls' own heights. What the panel lays out around them — the
// row a control sits in, its label on the left and the control on the right —
// is still the site's own (styles/playground-material.css).
import { renderElement } from 'material/ssr';
import { componentIcons, initialComponentState } from '../shared/components';
import { FRAMEWORKS } from '../shared/frameworks';
import type { ComponentDefinition, Control } from '../shared/content/types';
import { scopedTokensSiteDefault } from './tokens';
import { root } from './content';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** The playground section's extra class, where the panel's mtrl tokens are set. */
export const PANEL_SCOPE = 'playground--material';
/** The site header's material scope (the Themes button and menu, base.eta). */
export const HEADER_SCOPE = 'site-material';
/** mtrl's baseline tokens on the material scopes (the playground panel, the header),
 *  on every page: dark by default like the site's own tokens, light when the site's
 *  inline script sets data-theme-mode=light; the chosen theme on a scope wins. */
export const materialTokens = scopedTokensSiteDefault([`.${PANEL_SCOPE}`, `.${HEADER_SCOPE}`]);

/**
 * How the elements get their shadow-root styles. Link mode (material/ssr) points
 * each shadow root at the shared copy the build writes (dist/element-css/<hash>/),
 * cached for a year; inline mode copies each component's whole stylesheet into
 * every element, which took the Button page from ~23 KB to ~202 KB of HTML.
 * Inline stays as the fallback when the build has not written the copy.
 */
const elementCssBase: string | null = (() => {
  try { return JSON.parse(readFileSync(resolve(root, 'dist/element-css/base.json'), 'utf8')).base; }
  catch { return null; }
})();
export const renderStyles = elementCssBase ? { styles: 'link', cssBase: elementCssBase } as const : { styles: 'inline' } as const;

/** Every piece of a panel's element markup, for linkedStylesheets. */
export const panelMarkup = (panel: ReturnType<typeof materialPanel>): string =>
  [panel.frameworks, panel.tabs, panel.appearance, panel.scenario, ...panel.sections.flatMap(section => section.items)].join('');

/** The stylesheets a rendered panel links from its shadow roots, for the page to preload. */
export const linkedStylesheets = (html: string): string[] =>
  elementCssBase ? [...new Set([...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(([, href]) => href!).filter(href => href.startsWith(elementCssBase)))] : [];

/** A configuration section: its controls' element markup. */
export interface PanelSection { id: string; title: string; items: string[] }

const escape = (text: string) => text.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
/** An option's label, as the native panel's template wrote it. */
const optionLabel = (control: Control, value: string) => control.labels?.[value] || (value ? value.replaceAll('-', ' ') : 'None');
/** A segmented choice's label: sizes read uppercase, a missing icon reads None. */
const choiceLabel = (control: Control, value: string) =>
  control.labels?.[value] || (control.key === 'size' && value.length <= 2 ? value.toUpperCase() : value === 'none' && control.kind === 'icons' ? 'None' : value);

/** The trailing icons of the date and time rows: Material Symbols from icons/. */
const pickerIcons = {
  date: readFileSync(resolve(root, 'icons/calendar_today.svg'), 'utf8'),
  time: readFileSync(resolve(root, 'icons/schedule.svg'), 'utf8'),
};

/**
 * A framework's logo for its chip, from icons/brands/. All six chips render in one shadow
 * root, so every internal id (gradients: the Web Components logo's a…d, SolidJS's sheen)
 * is prefixed with the framework, and so is every url(#…) and href="#…" pointing at it.
 * Hidden from assistive technology: the chip's label names the framework.
 */
const LOGO_FILES: Record<string, string> = { vanilla: 'javascript', html: 'webcomponent', react: 'react', vue: 'vue', svelte: 'svelte', solid: 'solidjs' };
const logoCache = new Map<string, string>();
function frameworkLogo(id: string): string {
  let svg = logoCache.get(id);
  if (svg === undefined) {
    const file = LOGO_FILES[id];
    const raw = file ? readFileSync(resolve(root, 'icons/brands', `${file}.svg`), 'utf8').trim() : '';
    const prefix = `fw-${id}-`;
    svg = raw
      .replace(/ id="([^"]+)"/g, (_, name: string) => ` id="${prefix}${name}"`)
      .replace(/url\(#([^)]+)\)/g, (_, name: string) => `url(#${prefix}${name})`)
      .replace(/href="#([^"]+)"/g, (_, name: string) => `href="#${prefix}${name}"`)
      // A logo's near-black ink (the Web Components logo's C) reads a variable, so a dark
      // page can lighten it (playground-material.css); its own black stays the default.
      .replace(/fill="#010101"/gi, 'fill="var(--brand-ink, #010101)"')
      .replace(/^<svg /, '<svg aria-hidden="true" focusable="false" ');
    logoCache.set(id, svg);
  }
  return svg;
}

/** An icon's name as a select option reads it: calendarToday → calendar today, none → none. */
const iconName = (value: string) => value.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();

/** One `<m-select-option>` (or tab, or group item): its value and its label. */
const declaration = (tag: string, value: string, label: string) =>
  `<m-${tag} value="${escape(value)}">${escape(label)}</m-${tag}>`;

/** A segmented control's glue: the hidden input that carries the group's name. */
const groupInput = (name: string, value: string, associated = false) =>
  `<input type="hidden" name="${escape(name)}" value="${escape(value)}" data-input-for="${escape(name)}"${associated ? ' form="configuration"' : ''}>`;

/** The row a control sits in: the site's own, label left, control right. */
const row = (control: Control, content: string, extra = '', labelledBy = '') =>
  `<div class="ui-row${extra}"${labelledBy ? ` role="group" aria-labelledby="${labelledBy}"` : ''}${control.replaced ? ` data-replaced="${escape(control.replaced)}"` : ''}>${content}</div>`;

/** The row's label: the site's own, as the native panel wrote it, plus the
 *  same text as the element's aria-label — material's inputs take their name
 *  only from the host (an outside label alone does not reach them). */
const rowLabel = (id: string, label: string) =>
  `<label class="control-label" for="${escape(id)}">${escape(label)}</label>`;
/** The element's own copy of that name, for the input inside it. */
const ariaName = (label: string) => ({ 'aria-label': label });

/** One control, as material's own element. The row and label around it stay the site's. */
export function materialControl(control: Control, slug: string, initial: Record<string, unknown> = {}): string {
  const enabledWhen = control.enabledWhen ? { 'data-enabled-when': control.enabledWhen } : {};
  if (control.kind === 'date' || control.kind === 'time') {
    // material's text field holding the ISO value, with a trailing calendar or
    // clock icon that opens material's own date picker (modal) or time picker
    // dialog (playground-material.ts): the pages about those components pick with
    // them, not with the browser's picker. A text input, not type=date/time, so the
    // browser adds no second icon; typing the value stays a direct path.
    const date = control.kind === 'date';
    return row(control,
      rowLabel(`${slug}-${control.key}`, control.label)
      + renderElement('m-text-field', { ...enabledWhen, ...ariaName(control.label), variant: 'outlined', density: 'compact', name: control.key, id: `${slug}-${control.key}`, value: String(control.initial), autocomplete: 'off', placeholder: date ? 'YYYY-MM-DD' : 'HH:MM', 'trailing-icon': date ? pickerIcons.date : pickerIcons.time, 'trailing-icon-label': date ? 'Choose date' : 'Choose time', 'data-picker': control.kind }, '', renderStyles),
      ' control-row');
  }
  if (control.kind === 'toggle') {
    // The switch's label is slotted into it: material's switch takes its name
    // only from slotted children (an outside label or aria-label on the host
    // is not forwarded to the input inside). The slot holds the site's own
    // .control-label span, so the label reads like every other row's, and the
    // switch's own space-between container carries it left with the track at
    // the row's end once the host fills the row (playground-material.css).
    return row(control, renderElement('m-switch', { ...enabledWhen, name: control.key, ...(control.initial === true ? { checked: true } : {}) }, `<span class="control-label">${escape(control.label)}</span>`, renderStyles));
  }
  if (control.kind === 'icons' && (control.options?.length ?? 0) > 5) {
    // An icon row past five options (icon button, extended FAB, split button, text
    // field): a connected group stops at five (M3, segmented-buttons guidelines, read
    // 2026-11-18: "Don't use more than five segments"), and chips need a word per
    // option, so the row is material's select, each option with its icon and name.
    const options = control.options!.map(value => `<m-select-option value="${escape(value)}"${value !== 'none' && componentIcons[value] ? ` icon="${escape(componentIcons[value]!)}"` : ''}>${escape(iconName(value))}</m-select-option>`).join('');
    return row(control,
      rowLabel(`control-${control.key}`, control.label)
      + renderElement('m-select', { ...enabledWhen, ...ariaName(control.label), variant: 'outlined', density: 'compact', name: control.key, id: `control-${control.key}`, value: String(control.initial) }, options, renderStyles),
      ' control-row');
  }
  if (control.kind === 'select') {
    const options = control.options?.map(value => declaration('select-option', value, optionLabel(control, value))).join('') ?? '';
    return row(control,
      rowLabel(`control-${control.key}`, control.label)
      + renderElement('m-select', { ...enabledWhen, ...ariaName(control.label), variant: 'outlined', density: 'compact', name: control.key, id: `control-${control.key}`, value: String(control.initial) }, options, renderStyles),
      ' control-row');
  }
  if (control.kind === 'range') {
    // material's slider, form-associated, with the native row's numeric read-out
    // beside it (an <output> the panel keeps in step, as it did for the range input).
    const id = `control-${control.key}`;
    return row(control,
      rowLabel(id, control.label)
      + `<div class="control-range"><output for="${escape(id)}" data-value-for="${escape(control.key)}">${escape(String(control.initial))}</output>`
      + renderElement('m-slider', { ...enabledWhen, ...ariaName(control.label), name: control.key, id, min: control.min ?? 0, max: control.max ?? 100, step: control.stepFrom ? Number(initial[control.stepFrom]) || control.step || 1 : control.step ?? 1, value: Number(control.initial) }, '', renderStyles)
      + '</div>',
      ' control-row');
  }
  if (control.kind === 'text') {
    return row(control,
      rowLabel(`${slug}-${control.key}`, control.label)
      + renderElement('m-text-field', { ...enabledWhen, ...ariaName(control.label), variant: 'outlined', density: 'compact', name: control.key, id: `${slug}-${control.key}`, value: String(control.initial), maxlength: 80, autocomplete: 'off' }, '', renderStyles),
      ' control-row');
  }
  // A segmented choice or an icon row: material's connected button group, M3's
  // segmented button, at the xs size, with the hidden input beside it for the
  // form. The group's own label stays on the left, as the native row's was.
  const items = control.options?.map(value => control.kind === 'icons' && value !== 'none'
    ? `<m-button-group-item value="${escape(value)}" icon="${escape(componentIcons[value] ?? '')}" aria-label="${escape(value)}"></m-button-group-item>`
    : declaration('button-group-item', value, choiceLabel(control, value))).join('') ?? '';
  return row(control,
    `<span class="control-label" id="label-${escape(control.key)}">${escape(control.label)}</span>`
    + groupInput(control.key, String(control.initial))
    // required: a click on the selected segment keeps it, as the radio it replaced did
    // (material's single-selection group clears on that click otherwise).
    // filled: the selected segment takes the theme's primary (owner, 2026-11-18); material's
    // default outlined style selects with inverse-surface, near-black in light, so the
    // chosen theme barely showed. M3: "Button groups have no color properties. They can use
    // the default button or toggle button color styles, like filled, tonal, and outlined."
    // (button-groups specs, local copy dated 2026-09-23).
    + renderElement('m-button-group', { ...enabledWhen, selection: 'single', required: true, kind: 'connected', size: 'xs', variant: 'filled', value: String(control.initial), 'data-group-for': control.key }, items, renderStyles),
    ' control-row', `label-${control.key}`);
}

/** The panel's markup, piece by piece, for the component template to place. */
export function materialPanel(component: ComponentDefinition, slug: string, themes: readonly string[], hasElement: boolean): { frameworks: string; tabs: string; appearance: string; scenario: string; sections: PanelSection[] } {
  // The framework picker above the heading: a single-select filter chip set.
  // Six choices are past the five a segmented button (now the connected button
  // group) takes, and M3 points to chips beyond that; single choice is a filter
  // chip's job since choice chips folded into filter chips. Read 2026-11-18:
  // https://m3.material.io/components/segmented-buttons/guidelines ("Don't use
  // more than five segments … consider using another component, such as chips")
  // https://m3.material.io/components/chips/overview ("Choice chips are now a
  // subset of filter chips"). No chip is selected on the server, as no native
  // tab was: the client selects the saved framework (Vanilla by default), so a
  // remembered choice never flashes Vanilla first. Without the component's web
  // component only the factory is available, as on the native tabs.
  // The vanilla entry reads Factory here: what it gives is the library's
  // factories (createButton()), the size readout's own word for it. Its id stays
  // 'vanilla', so a choice saved on another page still applies.
  const chipLabel = (id: string, label: string) => id === 'vanilla' ? 'Factory' : label;
  // Each chip leads with its framework's logo (icons/brands/, sources in SOURCES.md):
  // M3's chips "can contain a logo, icon, or circular image" (chips guidelines, read
  // 2026-11-18).
  const frameworks = renderElement('m-chips', { selection: 'single', 'selection-required': true, scrollable: true, 'aria-label': 'Framework', class: 'framework-chips' },
    FRAMEWORKS.map(({ id, label }) => `<m-chip value="${escape(id)}" icon="${escape(frameworkLogo(id))}"${hasElement || id === 'vanilla' ? '' : ' disabled'}>${escape(chipLabel(id, label))}</m-chip>`).join(''), renderStyles);
  // Live preview / View code.
  const tabs = renderElement('m-tabs', { value: 'live', 'aria-label': 'Playground view' },
    declaration('tab', 'live', 'Live preview') + declaration('tab', 'code', 'View code'), renderStyles);
  // Theme and mode come from the site header (one appearance for the whole site,
  // site.ts): the heading keeps only the form's copy of them, for the state and the
  // generated code. playground.ts sets them from the site and on md3:appearance.
  const appearance = '<input type="hidden" name="theme" value="baseline" form="configuration" data-appearance="theme">'
    + '<input type="hidden" name="mode" value="light" form="configuration" data-appearance="mode">';
  // Every page has the Scenario row, Default and Custom at least: with no Reset, its
  // Default is the way back to the starting options, also on the pages that have no
  // named scenarios (divider, badge, progress, loading indicator).
  const scenario = rowLabel('scenario', 'Scenario')
    + renderElement('m-select', { variant: 'outlined', density: 'compact', 'aria-label': 'Scenario', id: 'scenario', value: 'default' },
      declaration('select-option', 'default', 'Default') + component.scenarios.map(scenario => declaration('select-option', scenario.id, scenario.name)).join('') + declaration('select-option', 'custom', 'Custom'), renderStyles);
  // Each section's controls: an element's markup, or the control for the native partial.
  const sections = [...new Set(component.controls.map(control => control.section))].map(section => ({
    id: section!.toLowerCase(),
    title: section!,
    items: component.controls.filter(control => control.section === section).map(control => materialControl(control, slug, initialComponentState(slug as Parameters<typeof initialComponentState>[0]))),
  }));
  // No Reset button: the Scenario select is the way back. Choosing Default applies
  // the playground's starting options, which is all Reset restored (the theme and
  // mode were already kept), so the panel opens on the scenario row.
  return { frameworks, tabs, appearance, scenario, sections };
}
