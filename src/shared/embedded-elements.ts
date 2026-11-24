// The material elements sheet content can hold. Sheet content is markup, so each one
// must be defined before it mounts: the preview does it, and so does every code tab.
export const embeddedElements = [
  { css: 'checkbox', define: 'defineCheckbox', tags: ['m-checkbox'] },
  { css: 'radios', define: 'defineRadios', tags: ['m-radios', 'm-radio'] },
  { css: 'button', define: 'defineButton', tags: ['m-button'] },
  { css: 'icon-button', define: 'defineIconButton', tags: ['m-icon-button'] },
  { css: 'chips', define: 'defineChips', tags: ['m-chips', 'm-chip'] },
  { css: 'list', define: 'defineList', tags: ['m-list', 'm-list-item'] },
  { css: 'divider', define: 'defineDivider', tags: ['m-divider'] },
  { css: 'slider', define: 'defineSlider', tags: ['m-slider'] },
  { css: 'progress', define: 'defineProgress', tags: ['m-progress'] },
] as const;

/** The entries whose tags `has` finds. */
export const embeddedIn = (has: (tag: string) => boolean) =>
  embeddedElements.filter(entry => entry.tags.some(has));

export const embeddedImports = (entry: (typeof embeddedElements)[number]): string[] =>
  [`import 'material/elements/css/${entry.css}';`, `import { ${entry.define} } from 'material/elements';`];
