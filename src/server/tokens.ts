// mtrl's design tokens, read from its compiled CSS when the server starts: the
// Styles pages show what mtrl ships, never a copy kept by hand.
//
//   - Colour: `--mtrl-sys-color-<role>` per theme and mode. The baseline is
//     dist/styles/base.css (`:root` light, `.dark-theme` dark); each theme is
//     dist/themes/<theme>.css (`[data-theme=x]`, `[data-theme=x][data-theme-mode=dark]`).
//     A role a theme leaves out is inherited, as the cascade does, and marked so.
//   - Typescale: `--mtrl-sys-typescale-<role>-<property>`, with `var(--mtrl-ref-*)` resolved.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { root } from './content';
import { themes } from '../shared/button';
import { pairOf } from '../shared/color';
import type { ThemeBase } from '../shared/theme-state';

const mtrlDir = resolve(root, 'node_modules/material');
const read = (path: string) => readFileSync(resolve(mtrlDir, path), 'utf8');

export const mtrlVersion: string = JSON.parse(read('package.json')).version;

export interface CssBlock {
  /** Enclosing at-rules and the selector, outermost first: ['@layer mtrl.base', ':root']. */
  path: string[];
  declarations: Map<string, string>;
}

/** Every rule block of a stylesheet with its custom-property and other declarations. */
export function parseCss(css: string): CssBlock[] {
  const blocks: CssBlock[] = [];
  const stack: string[] = [];
  let buffer = '';
  let quote = '';
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const ch of source) {
    if (quote) { buffer += ch; if (ch === quote) quote = ''; continue; }
    if (ch === '"' || ch === "'") { quote = ch; buffer += ch; continue; }
    if (ch === '{') { stack.push(buffer.trim()); buffer = ''; }
    else if (ch === '}') {
      const selector = stack.pop() ?? '';
      if (buffer.trim()) blocks.push({ path: [...stack, selector], declarations: parseDeclarations(buffer) });
      buffer = '';
    }
    // A statement at-rule (`@layer a, b;`, `@import …;`) outside any block.
    else if (ch === ';' && stack.length === 0) buffer = '';
    else buffer += ch;
  }
  return blocks;
}

/** `a: 1; b: var(--x, 2)` → Map; splits on `;` outside parentheses and strings. */
export function parseDeclarations(text: string): Map<string, string> {
  const declarations = new Map<string, string>();
  let depth = 0;
  let quote = '';
  let current = '';
  const flush = () => {
    const colon = current.indexOf(':');
    if (colon > 0) declarations.set(current.slice(0, colon).trim(), current.slice(colon + 1).trim());
    current = '';
  };
  for (const ch of text) {
    if (quote) { if (ch === quote) quote = ''; }
    else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    else if (ch === ';' && depth === 0) { flush(); continue; }
    current += ch;
  }
  flush();
  return declarations;
}

const COLOR_PREFIX = '--mtrl-sys-color-';
/** The colour roles a block declares: role → value, the `-rgb` twins left out. */
function colorRoles(block: CssBlock | undefined): Map<string, string> {
  const roles = new Map<string, string>();
  for (const [name, value] of block?.declarations ?? []) {
    if (name.startsWith(COLOR_PREFIX) && !name.endsWith('-rgb')) roles.set(name.slice(COLOR_PREFIX.length), normalizeColor(value));
  }
  return roles;
}
/** Hex colours lower-cased and expanded to six digits; anything else as written. */
function normalizeColor(value: string): string {
  const hex = /^#([0-9a-f]{3})$/i.exec(value);
  if (hex) return `#${[...hex[1]!].map(c => c + c).join('')}`.toLowerCase();
  return /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(value) ? value.toLowerCase() : value;
}
const findBlock = (blocks: CssBlock[], selector: string, inMedia = false) => blocks.find(block =>
  block.path.at(-1) === selector && block.path.some(part => part.startsWith('@media')) === inMedia
  && [...block.declarations.keys()].some(name => name.startsWith(COLOR_PREFIX)));

export type Mode = 'light' | 'dark';
export interface ColorValue {
  value: string;
  /** Not declared by the theme for this mode: the value comes from `from`. */
  inherited: boolean;
  from?: string;
}
export type ColorScheme = Record<string, ColorValue>;
export interface ThemeColors { light: ColorScheme; dark: ColorScheme }

const baseBlocks = parseCss(read('dist/styles/base.css'));
/** Type roles, role utilities and font-weight utilities left base.css (material 3). */
const typographyBlocks = parseCss(read('dist/styles/typography.css'));
const typeBlocks = [...baseBlocks, ...typographyBlocks];
/** Baseline light (`:root`) and dark (`.dark-theme`) from base.css. */
export const baseline: Record<Mode, Map<string, string>> = {
  light: colorRoles(findBlock(baseBlocks, ':root')),
  dark: colorRoles(findBlock(baseBlocks, '.dark-theme')),
};

function themeColors(theme: string): ThemeColors {
  const file = `dist/themes/${theme}.css`;
  const blocks = existsSync(resolve(mtrlDir, file)) ? parseCss(read(file)) : [];
  const light = colorRoles(findBlock(blocks, `[data-theme=${theme}]`));
  const dark = colorRoles(findBlock(blocks, `[data-theme=${theme}][data-theme-mode=dark]`));
  const scheme = (own: Map<string, string>, fallbacks: [string, Map<string, string>][]): ColorScheme => {
    const result: ColorScheme = {};
    const names = new Set([...fallbacks.flatMap(([, roles]) => [...roles.keys()]), ...own.keys()]);
    for (const role of names) {
      if (own.has(role)) { result[role] = { value: own.get(role)!, inherited: false }; continue; }
      const [from, roles] = fallbacks.find(([, roles]) => roles.has(role))!;
      result[role] = { value: roles.get(role)!, inherited: true, from };
    }
    return result;
  };
  return {
    light: scheme(light, [['baseline', baseline.light]]),
    // With data-theme-mode=dark the theme's light block still matches: a role the dark
    // block leaves out comes from it before the baseline.
    dark: scheme(dark, [[`${theme} light`, light], ['baseline', baseline.light]]),
  };
}

export const themeTokens: Record<string, ThemeColors> = Object.fromEntries(themes.map(theme => [theme, themeColors(theme)]));

/** M3's colour groups. A role shows only when some theme declares it. */
const M3_GROUPS: { label: string; roles: string[] }[] = [
  { label: 'Primary', roles: ['primary', 'on-primary', 'primary-container', 'on-primary-container'] },
  { label: 'Secondary', roles: ['secondary', 'on-secondary', 'secondary-container', 'on-secondary-container'] },
  { label: 'Tertiary', roles: ['tertiary', 'on-tertiary', 'tertiary-container', 'on-tertiary-container'] },
  { label: 'Error', roles: ['error', 'on-error', 'error-container', 'on-error-container'] },
  { label: 'Surface', roles: ['surface', 'surface-dim', 'surface-bright', 'surface-container-lowest', 'surface-container-low', 'surface-container', 'surface-container-high', 'surface-container-highest', 'on-surface', 'surface-variant', 'on-surface-variant'] },
  { label: 'Outline', roles: ['outline', 'outline-variant'] },
  { label: 'Inverse', roles: ['inverse-surface', 'inverse-on-surface', 'inverse-primary'] },
  { label: 'Fixed', roles: ['primary', 'secondary', 'tertiary'].flatMap(c => [`${c}-fixed`, `${c}-fixed-dim`, `on-${c}-fixed`, `on-${c}-fixed-variant`]) },
  { label: 'Other', roles: ['shadow', 'scrim'] },
];
/** mtrl's status roles, beyond M3's scheme, in every theme since mtrl#291 (badges read them). */
const STATUS_GROUP = { label: 'Status', note: 'mtrl adds these to every theme, beyond the M3 scheme.', roles: ['success', 'on-success', 'warning', 'on-warning', 'info', 'on-info'] };

/** Every role any theme declares, in either mode. */
export const allRoles: Set<string> = new Set([
  ...baseline.light.keys(), ...baseline.dark.keys(),
  ...Object.values(themeTokens).flatMap(t => [...Object.keys(t.light), ...Object.keys(t.dark)]),
]);

export interface ColorGroup { label: string; note?: string; roles: string[] }
const known = new Set([...M3_GROUPS, STATUS_GROUP].flatMap(group => group.roles));
/** Roles outside M3's scheme (success, warning, info, accent…), X next to on-X. */
const extraRoles = [...allRoles].filter(role => !known.has(role))
  .sort((a, b) => a.replace(/^on-/, '').localeCompare(b.replace(/^on-/, '')) || (a.startsWith('on-') ? 1 : -1));
export const colorGroups: ColorGroup[] = [
  ...[...M3_GROUPS, STATUS_GROUP].map(group => ({ ...group, roles: group.roles.filter(role => allRoles.has(role)) })),
  { label: 'Theme extras', note: 'Roles outside the M3 scheme that some themes add.', roles: extraRoles },
].filter(group => group.roles.length);
/** M3 groups whose roles mtrl does not ship at all. */
export const missingGroups: string[] = M3_GROUPS.filter(group => !group.roles.some(role => allRoles.has(role))).map(group => group.label);

/** A swatch's content-colour role in a theme's mode. */
export const pairFor = (role: string, scheme: ColorScheme) => pairOf(role, candidate => candidate in scheme);

// ─── Typescale ──────────────────────────────────────────────────────

export const TYPE_ROLES = ['display', 'headline', 'title', 'body', 'label'].flatMap(kind => ['large', 'medium', 'small'].map(size => `${kind}-${size}`));
export interface TypeStyle {
  role: string;
  font: string;
  fontSize: string;
  lineHeight: string;
  letterSpacing: string;
  fontWeight: string;
  /** mtrl ships a `.mtrl-<role>` utility class. */
  utility: boolean;
}

const rootDeclarations = new Map(typeBlocks.filter(block => block.path.at(-1) === ':root').flatMap(block => [...block.declarations]));
/** `var(--a, fallback)` resolved against base.css's `:root` declarations. */
function resolveVar(value: string, seen = new Set<string>()): string {
  return value.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*))?\)/g, (whole, name: string, fallback?: string) => {
    if (seen.has(name)) return whole;
    const found = rootDeclarations.get(name);
    return found !== undefined ? resolveVar(found, new Set([...seen, name])) : fallback?.trim() ?? whole;
  });
}
const utilities = new Set(typeBlocks.map(block => block.path.at(-1)!).filter(selector => /^\.mtrl-[a-z]+-(large|medium|small)$/.test(selector)).map(selector => selector.slice(6)));

export const typescale: TypeStyle[] = TYPE_ROLES.flatMap(role => {
  const get = (property: string) => {
    const value = rootDeclarations.get(`--mtrl-sys-typescale-${role}-${property}`);
    return value === undefined ? undefined : resolveVar(value);
  };
  const [font, fontSize, lineHeight, letterSpacing, fontWeight] = ['font', 'font-size', 'line-height', 'letter-spacing', 'font-weight'].map(get);
  if (!fontSize) return [];
  return [{ role, font: font ?? '', fontSize, lineHeight: lineHeight ?? '', letterSpacing: letterSpacing ?? '0', fontWeight: fontWeight ?? '400', utility: utilities.has(role) }];
});

const GENERIC_FAMILIES = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-sans-serif', 'ui-serif', 'ui-monospace', 'math', 'emoji', 'fangsong']);
const unquote = (family: string) => family.trim().replace(/^["']|["']$/g, '');
/** The families md3.io declares with @font-face: its own, and Roboto for mtrl's type scale. */
export const siteFonts: Set<string> = new Set(['styles/tokens.css', 'styles/roboto.css']
  .flatMap(file => parseCss(readFileSync(resolve(root, file), 'utf8')))
  .filter(block => block.path.at(-1) === '@font-face')
  .map(block => unquote(block.declarations.get('font-family') ?? '')).filter(Boolean));
/** Named families in mtrl's typescale that md3.io does not load. */
export const unloadedFonts: string[] = [...new Set(typescale.flatMap(style => style.font.split(',').map(unquote)))]
  .filter(family => family && !GENERIC_FAMILIES.has(family.toLowerCase()) && !siteFonts.has(family));

/**
 * Where mtrl's components use each type role: the component stylesheets that include
 * `m.typography('<role>')` literally (roles picked from a map at compile time are not
 * seen). Read from mtrl's published SCSS, so the list follows the library.
 */
export const roleUsage: Record<string, string[]> = (() => {
  const dir = resolve(mtrlDir, 'src/styles/components');
  const usage: Record<string, Set<string>> = {};
  if (!existsSync(dir)) return {};
  for (const file of readdirSync(dir).filter(name => /^_[a-z-]+\.scss$/.test(name))) {
    const component = file.slice(1, -5);
    for (const [, role] of readFileSync(resolve(dir, file), 'utf8').matchAll(/typography\(\s*['"]([a-z]+-(?:large|medium|small))['"]/g)) (usage[role!] ??= new Set()).add(component);
  }
  return Object.fromEntries(Object.entries(usage).map(([role, components]) => [role, [...components].sort()]));
})();

// ─── Scoped tokens ──────────────────────────────────────────────────

/**
 * mtrl's baseline tokens as CSS for a scope instead of `:root`: every custom
 * property of base.css's `:root` (colour, state, typeface, typescale, shape) on
 * `scope`, and the dark colour roles (`.dark-theme`) on `darkScope`. Custom
 * properties inherit into shadow roots, so mtrl's elements inside the scope take
 * them, while the page around it, which does not load base.css, keeps its own.
 */
export function scopedTokens(scope: string, darkScope: string): string {
  const inMedia = (block: CssBlock) => block.path.some(part => part.startsWith('@media'));
  const custom = (blocks: CssBlock[]) => new Map(blocks.flatMap(block => [...block.declarations].filter(([name]) => name.startsWith('--mtrl-'))));
  const rule = (selector: string, scheme: Mode, declarations: Map<string, string>) =>
    `${selector}{color-scheme:${scheme};${[...declarations].map(([name, value]) => `${name}:${value}`).join(';')}}`;
  return [
    rule(scope, 'light', custom(baseBlocks.filter(block => block.path.at(-1) === ':root' && !inMedia(block)))),
    rule(darkScope, 'dark', custom(baseBlocks.filter(block => block.path.at(-1) === '.dark-theme'))),
  ].join('\n');
}

/** mtrl's font-weight utility classes (`.mtrl-font-<name>`), lightest first. */
export const fontWeights: { name: string; weight: string }[] = typeBlocks
  .flatMap(block => {
    const match = /^\.mtrl-font-([a-z]+)$/.exec(block.path.at(-1) ?? '');
    const weight = block.declarations.get('font-weight');
    return match && weight ? [{ name: match[1]!, weight }] : [];
  })
  .sort((a, b) => Number(a.weight) - Number(b.weight));

// ─── Shape ──────────────────────────────────────────────────────────

/** The corner scale, `--mtrl-sys-shape-corner-<step>` on base.css's `:root`, step → px, in mtrl's order. */
export const shapeScale: Record<string, number> = Object.fromEntries([...rootDeclarations].flatMap(([name, value]) => {
  const step = /^--mtrl-sys-shape-corner-([a-z-]+)$/.exec(name)?.[1];
  const px = /^(\d+(?:\.\d+)?)(px)?$/.exec(value.trim());
  return step && px && (px[2] || px[1] === '0') ? [[step, Number(px[1])]] : [];
}));

/**
 * Which components read each corner step: the component stylesheets in mtrl's dist
 * that reference `--mtrl-sys-shape-corner-<step>`. A component that picks a radius
 * some other way (a fixed value, half its height) is not listed.
 */
export const shapeUsage: Record<string, string[]> = (() => {
  const dir = resolve(mtrlDir, 'dist/styles');
  const usage: Record<string, Set<string>> = {};
  if (!existsSync(dir)) return {};
  for (const file of readdirSync(dir).filter(name => name.endsWith('.css') && name !== 'base.css')) {
    for (const [, step] of readFileSync(resolve(dir, file), 'utf8').matchAll(/--mtrl-sys-shape-corner-([a-z-]+)/g)) (usage[step!] ??= new Set()).add(file.slice(0, -4));
  }
  return Object.fromEntries(Object.entries(usage).map(([step, components]) => [step, [...components].sort()]));
})();

/** What the Styles pages' theme state validates against and diffs from (src/shared/theme-state.ts). */
export const themeBase: ThemeBase = { themes, shape: shapeScale };
