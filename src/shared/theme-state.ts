// The Styles section's theme: a plain, serialisable model of what the user changed on
// top of one of mtrl's themes. It holds overrides only; a missing section, or a missing
// value in one, means "the base theme's value", so links made before a section existed
// keep working. Every value is validated here: state arrives from URLs and storage.
//
// Adding a section (elevation, motion, colour…):
//   1. add its type to `Sections`;
//   2. add a `ThemeSection` for it to `sections`: how to validate it, which tokens it
//      writes (only what differs from mtrl), and a one-line summary.
// The store, the preview, the export and the share link pick it up from there.
import { themes as builtInThemeNames } from './button';

/** mtrl's own values, read from its compiled CSS by the server (src/server/tokens.ts). */
export interface ThemeBase {
  themes: readonly string[];
  /** The corner scale, step → radius in px, in mtrl's order: none, extra-small… full. */
  shape: Record<string, number>;
}
export type Mode = 'light' | 'dark';

export interface ShapeState {
  /** A step's own radius in px, where it differs from mtrl's. */
  corners?: Record<string, number>;
}
/** The sections a page can change; each is optional. */
export interface Sections { shape: ShapeState }
export type SectionKey = keyof Sections;
export type ThemeState = { v: 1; base: string; mode: Mode } & Partial<Sections>;

export interface ThemeSection<S> {
  label: string;
  /** The section's page. */
  href: string;
  /** A valid section from anything, or undefined when nothing in it differs from mtrl. */
  normalize(raw: unknown, base: ThemeBase): S | undefined;
  /** The custom properties it overrides, name → value. */
  tokens(value: S, base: ThemeBase): Record<string, string>;
  summary(value: S, base: ThemeBase): string;
}

export const CORNER_MAX = 120;
const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const clamp = (value: unknown, min: number, max: number): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : undefined;

/**
 * Whether a step can be edited. `none` is square by definition; `full` (9999px) and
 * `pill` (100px) mean "fully round" at any component height, so a px value makes no sense.
 */
export const isEditable = (radius: number) => radius > 0 && radius < 100;
/** A corner step's radius in px under this state. */
export function cornerRadius(shape: ShapeState | undefined, base: ThemeBase, step: string): number {
  const radius = base.shape[step] ?? 0;
  return isEditable(radius) ? shape?.corners?.[step] ?? radius : radius;
}

export const sections: { [K in SectionKey]: ThemeSection<Sections[K]> } = {
  shape: {
    label: 'Shape',
    href: '/styles/shape/',
    // Links made while the page had a global "roundness" carry it: it is dropped here.
    normalize(raw, base) {
      const corners: Record<string, number> = {};
      for (const [step, value] of Object.entries(object(object(raw).corners))) {
        const radius = clamp(value, 0, CORNER_MAX);
        const own = base.shape[step];
        if (radius !== undefined && Object.hasOwn(base.shape, step) && isEditable(own!) && radius !== own) corners[step] = radius;
      }
      return Object.keys(corners).length ? { corners } : undefined;
    },
    tokens(shape, base) {
      const tokens: Record<string, string> = {};
      for (const [step, radius] of Object.entries(base.shape)) {
        const value = cornerRadius(shape, base, step);
        if (value !== radius) tokens[`--mtrl-sys-shape-corner-${step}`] = `${value}px`;
      }
      return tokens;
    },
    summary(shape, base) {
      return Object.entries(shape.corners ?? {}).map(([step, radius]) => `${step.replaceAll('-', ' ')} ${base.shape[step]}→${radius}px`).join(', ');
    },
  },
};
export const sectionKeys = Object.keys(sections) as SectionKey[];

export const defaultState = (): ThemeState => ({ v: 1, base: 'baseline', mode: 'light' });

/** A valid state from anything: unknown keys dropped, values clamped, sections without a change left out. */
export function normalize(raw: unknown, base: ThemeBase): ThemeState {
  const input = object(raw);
  const state: ThemeState = {
    v: 1,
    base: typeof input.base === 'string' && base.themes.includes(input.base) ? input.base : 'baseline',
    mode: input.mode === 'dark' ? 'dark' : 'light',
  };
  for (const key of sectionKeys) {
    const value = sections[key].normalize(input[key], base);
    if (value !== undefined) state[key] = value;
  }
  return state;
}

/** The custom properties that differ from the base theme, by section, then flat. */
export function tokensBySection(state: ThemeState, base: ThemeBase): Partial<Record<SectionKey, Record<string, string>>> {
  const out: Partial<Record<SectionKey, Record<string, string>>> = {};
  for (const key of sectionKeys) {
    const value = state[key];
    if (value === undefined) continue;
    const tokens = (sections[key] as ThemeSection<typeof value>).tokens(value, base);
    if (Object.keys(tokens).length) out[key] = tokens;
  }
  return out;
}
export const toTokens = (state: ThemeState, base: ThemeBase): Record<string, string> => Object.assign({}, ...Object.values(tokensBySection(state, base)));

// base64url of the JSON: compact, URL-safe, versioned by `v`.
export function serialize(state: ThemeState): string {
  const bytes = new TextEncoder().encode(JSON.stringify(state));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
/** A state from a share link or storage; null when the text isn't one (or is from a newer version). */
export function parse(text: string, base: ThemeBase): ThemeState | null {
  if (!text || text.length > 4096 || !/^[A-Za-z0-9_-]+$/.test(text)) return null;
  try {
    const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
    const raw = JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, c => c.charCodeAt(0))));
    return object(raw).v === 1 ? normalize(raw, base) : null;
  } catch { return null; }
}

/** The theme as a stylesheet: how to load the base theme, then the overrides by section. */
export function toCss(state: ThemeState, base: ThemeBase): string {
  const lines = [
    '/* material theme, made on md3.io/styles/',
    ' *',
    ` * Load material's base styles${state.base === 'baseline' ? '' : ` and the ${state.base} theme`}, then this file:`,
    ' *   import \'material/styles/base\';',
    ...(state.base === 'baseline' ? [] : [` *   import 'material/themes/${state.base}';`]),
    ' *   import \'./mtrl-theme.css\';',
    ' * and name the theme on <html> (or any element):',
    ` *   <html data-theme="${state.base}" data-theme-mode="${state.mode}">`,
    ' */',
  ];
  const bySection = tokensBySection(state, base);
  const blocks = sectionKeys.filter(key => bySection[key]).map(key =>
    `  /* ${sections[key].label} */\n${Object.entries(bySection[key]!).map(([name, value]) => `  ${name}: ${value};`).join('\n')}`);
  // :root and not the theme's selector: shape and type are system-wide in mtrl
  // (base/_tokens.scss), and an unlayered rule wins over mtrl's layered base.
  lines.push('', blocks.length ? `:root {\n${blocks.join('\n\n')}\n}` : '/* No overrides yet: the base theme as material ships it. */', '');
  return lines.join('\n');
}

// ─── Colour theme files ─────────────────────────────────────────────
// A colour theme as files, in mtrl's own shapes: the Themes app's download writes
// them, and the colour section's export will. `tokens` are mtrl's schemeToTokens output.

export interface ColorThemeFile {
  /** The theme's name: its data-theme. */
  name: string;
  tokens: { light: Record<string, string>; dark: Record<string, string> };
  /** What it was made from, when it was made from a seed. */
  origin?: { seed: string; variant: string; contrast: number; secondary?: string };
  /** One line on where it comes from. */
  note: string;
}
const lines = (tokens: Record<string, string>, indent: string) => Object.entries(tokens).map(([property, value]) => `${indent}${property}: ${value};`).join('\n');

/** A downloaded theme's name is at most this long. */
const NAME_MAX = 40;

/** Theme names a download refuses: every theme material ships and the select offers. Contrast files are not themes. */
const REFUSED_NAMES = new Set<string>(builtInThemeNames);

/**
 * The name a downloaded theme takes: trimmed, lower-case letters, digits and single
 * hyphens (runs of anything else become one hyphen), no leading or trailing hyphen, at
 * most 40 characters. Empty, or nothing usable left of it, is `custom`; a theme
 * material ships (the theme select's list) is refused as null, so a download never
 * writes a file or `data-theme` over material's own.
 */
export function downloadName(raw: unknown): string | null {
  const name = String(raw ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, NAME_MAX).replace(/-+$/, '');
  if (!name) return 'custom';
  return REFUSED_NAMES.has(name) ? null : name;
}

/** CSS: light on [data-theme="name"], dark with data-theme-mode="dark", as mtrl's themes are. */
export const colorThemeCss = ({ name, tokens, note }: ColorThemeFile): string => [
  `/* material theme "${name}", from md3.io/styles/themes/: ${note}`,
  ' *',
  ' * Load material\'s base styles, then this file, and name the theme on <html> (or any element):',
  ' *   import \'material/styles/base\';',
  ` *   import './mtrl-theme-${name}.css';`,
  ` *   <html data-theme="${name}" data-theme-mode="light">`,
  ' */',
  `[data-theme="${name}"] {\n${lines(tokens.light, '  ')}\n}`,
  '',
  `[data-theme="${name}"][data-theme-mode="dark"] {\n${lines(tokens.dark, '  ')}\n}`,
  '',
].join('\n');

/** JSON: design tokens (role → colour, light and dark), with what the theme was made from. */
export const colorThemeJson = ({ name, tokens, origin, note }: ColorThemeFile): string => {
  const roles = (mode: Record<string, string>) => Object.fromEntries(Object.entries(mode).map(([property, value]) => [property.replace(/^--mtrl-sys-color-/, ''), { $type: 'color', $value: value }]));
  return `${JSON.stringify({ $description: `material theme "${name}", from md3.io/styles/themes/: ${note}`, name, ...(origin ? { seed: origin.seed, variant: origin.variant, contrast: origin.contrast, ...(origin.secondary ? { secondary: origin.secondary } : {}) } : {}), light: roles(tokens.light), dark: roles(tokens.dark) }, null, 2)}\n`;
};
