// The Button playground pilot: the configuration panel's controls as material's
// own elements, rendered on the server with material/ssr (`renderElement`,
// declarative shadow DOM) so the panel is styled at first paint, without
// JavaScript. Only /components/button/ renders it (the rollout to the other
// pages comes later); every other page keeps the native controls the
// component.eta template builds.
//
// The look is material out of the box: the baseline theme, light or dark with
// the site's mode, tokens scoped to the panel the way the catalog cards get
// theirs (`scopedTokens`), and no restyling of the elements from this site.
// The elements run at compact density and the groups at the xs size, close to
// the native controls' own heights. What the panel lays out around them — the
// row a control sits in, its label on the left and the control on the right —
// is still the site's own (styles/playground-material.css).
import { renderElement } from 'material/ssr';
import { componentIcons } from '../shared/components';
import { FRAMEWORKS } from '../shared/frameworks';
import type { ComponentDefinition, Control } from '../shared/content/types';
import { scopedTokensSiteDefault } from './tokens';
import { root } from './content';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** The playground section's extra class, where the panel's mtrl tokens are set. */
export const PANEL_SCOPE = 'playground--material';
/** mtrl's baseline tokens on the panel: dark by default like the site's own
 *  tokens, light when the site's inline script sets data-theme-mode=light. */
export const panelTokens = scopedTokensSiteDefault(`.${PANEL_SCOPE}`);

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
const renderStyles = elementCssBase ? { styles: 'link', cssBase: elementCssBase } as const : { styles: 'inline' } as const;

/** The stylesheets a rendered panel links from its shadow roots, for the page to preload. */
export const linkedStylesheets = (html: string): string[] =>
  elementCssBase ? [...new Set([...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(([, href]) => href!).filter(href => href.startsWith(elementCssBase)))] : [];

/** The pages this pilot covers. */
export const isMaterialPanel = (slug: string): boolean => slug === 'button';

const escape = (text: string) => text.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
/** An option's label, as the native panel's template wrote it. */
const optionLabel = (control: Control, value: string) => control.labels?.[value] || (value ? value.replaceAll('-', ' ') : 'None');
/** A segmented choice's label: sizes read uppercase, a missing icon reads None. */
const choiceLabel = (control: Control, value: string) =>
  control.labels?.[value] || (control.key === 'size' && value.length <= 2 ? value.toUpperCase() : value === 'none' && control.kind === 'icons' ? 'None' : value);

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
function materialControl(control: Control, slug: string): string {
  const enabledWhen = control.enabledWhen ? { 'data-enabled-when': control.enabledWhen } : {};
  if (control.kind === 'toggle') {
    // The switch's label is slotted into it: material's switch takes its name
    // only from slotted children (an outside label or aria-label on the host
    // is not forwarded to the input inside). The slot holds the site's own
    // .control-label span, so the label reads like every other row's, and the
    // switch's own space-between container carries it left with the track at
    // the row's end once the host fills the row (playground-material.css).
    return row(control, renderElement('m-switch', { ...enabledWhen, name: control.key, ...(control.initial === true ? { checked: true } : {}) }, `<span class="control-label">${escape(control.label)}</span>`, renderStyles));
  }
  if (control.kind === 'select') {
    const options = control.options?.map(value => declaration('select-option', value, optionLabel(control, value))).join('') ?? '';
    return row(control,
      rowLabel(`control-${control.key}`, control.label)
      + renderElement('m-select', { ...enabledWhen, ...ariaName(control.label), variant: 'outlined', density: 'compact', name: control.key, id: `control-${control.key}`, value: String(control.initial) }, options, renderStyles),
      ' control-row');
  }
  if (control.kind === 'text' || control.kind === 'date' || control.kind === 'time') {
    // Date and time fields are not part of the pilot (no Button page control uses them);
    // they keep the native input until the rollout gives them an element.
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
    + renderElement('m-button-group', { ...enabledWhen, selection: 'single', kind: 'connected', size: 'xs', value: String(control.initial), 'data-group-for': control.key }, items, renderStyles),
    ' control-row', `label-${control.key}`);
}

/** The panel's markup, piece by piece, for the component template to place. */
export function materialPanel(component: ComponentDefinition, slug: string, themes: readonly string[], hasElement: boolean): { frameworks: string; tabs: string; appearance: string; scenario: string | null; sections: string } {
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
  const frameworks = renderElement('m-chips', { selection: 'single', 'selection-required': true, scrollable: true, 'aria-label': 'Framework', class: 'framework-chips' },
    FRAMEWORKS.map(({ id, label }) => `<m-chip value="${escape(id)}"${hasElement || id === 'vanilla' ? '' : ' disabled'}>${escape(chipLabel(id, label))}</m-chip>`).join(''), renderStyles);
  // Live preview / View code. The framework tabs above stay native in the pilot.
  const tabs = renderElement('m-tabs', { value: 'live', 'aria-label': 'Playground view' },
    declaration('tab', 'live', 'Live preview') + declaration('tab', 'code', 'View code'), renderStyles);
  // Theme and mode, the native heading's own row: label, compact select, xs
  // group. The mode group is not form-associated: its hidden input carries the
  // name (associated to the configuration form from outside it).
  const appearance = `<label for="preview-theme">Theme</label>`
    + renderElement('m-select', { variant: 'outlined', density: 'compact', 'aria-label': 'Theme', id: 'preview-theme', name: 'theme', form: 'configuration', value: themes[0] },
      themes.map(theme => declaration('select-option', theme, (theme.charAt(0).toUpperCase() + theme.slice(1)).replaceAll('-', ' '))).join(''), renderStyles)
    + renderElement('m-button-group', { selection: 'single', kind: 'connected', size: 'xs', value: 'light', 'aria-label': 'Preview mode', 'data-group-for': 'mode' },
      declaration('button-group-item', 'light', 'Light') + declaration('button-group-item', 'dark', 'Dark'), renderStyles)
    + groupInput('mode', 'light', true);
  const scenario = component.scenarios.length
    ? rowLabel('scenario', 'Scenario')
      + renderElement('m-select', { variant: 'outlined', density: 'compact', 'aria-label': 'Scenario', id: 'scenario', value: 'default' },
        declaration('select-option', 'default', 'Default') + component.scenarios.map(scenario => declaration('select-option', scenario.id, scenario.name)).join('') + declaration('select-option', 'custom', 'Custom'), renderStyles)
    : null;
  const sections = [...new Set(component.controls.map(control => control.section))].map(section =>
    `<section class="ui-section configuration-controls" aria-labelledby="section-${section!.toLowerCase()}"><h3 class="ui-title" id="section-${section!.toLowerCase()}">${escape(section!)}</h3>`
    + component.controls.filter(control => control.section === section).map(control => materialControl(control, slug)).join('')
    + '</section>').join('');
  // No Reset button: the Scenario select is the way back. Choosing Default applies
  // the playground's starting options, which is all Reset restored (the theme and
  // mode were already kept), so the panel opens on the scenario row.
  return { frameworks, tabs, appearance, scenario, sections };
}
