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

/** mtrl's own values, read from its compiled CSS by the server (src/server/tokens.ts). */
export interface ThemeBase {
  themes: readonly string[];
  /** The corner scale, step → radius in px, in mtrl's order: none, extra-small… full. */
  shape: Record<string, number>;
}
export type Mode = 'light' | 'dark';

export interface ShapeState {
  /** Scales every scalable step, in percent: 0 is square, 100 is mtrl's scale. */
  roundness?: number;
  /** A step's own radius in px, which wins over roundness. */
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

export const ROUNDNESS = { min: 0, max: 300, step: 5 } as const;
export const CORNER_MAX = 120;
const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const clamp = (value: unknown, min: number, max: number): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : undefined;

/**
 * Whether roundness scales a step. `none` stays square; `full` (9999px) and `pill`
 * (100px) are "fully round" at any component height, so they stay as they are.
 */
export const isScalable = (radius: number) => radius > 0 && radius < 100;
/** A corner step's radius in px under this state. */
export function cornerRadius(shape: ShapeState | undefined, base: ThemeBase, step: string): number {
  const radius = base.shape[step] ?? 0;
  if (!isScalable(radius)) return radius;
  return shape?.corners?.[step] ?? Math.round(radius * (shape?.roundness ?? 100) / 100);
}

export const sections: { [K in SectionKey]: ThemeSection<Sections[K]> } = {
  shape: {
    label: 'Shape',
    href: '/styles/shape/',
    normalize(raw, base) {
      const input = object(raw);
      const roundness = clamp(input.roundness, ROUNDNESS.min, ROUNDNESS.max);
      const corners: Record<string, number> = {};
      for (const [step, value] of Object.entries(object(input.corners))) {
        const radius = clamp(value, 0, CORNER_MAX);
        if (radius !== undefined && Object.hasOwn(base.shape, step) && isScalable(base.shape[step]!)) corners[step] = radius;
      }
      const shape: ShapeState = { ...(roundness !== undefined && roundness !== 100 ? { roundness } : {}), ...(Object.keys(corners).length ? { corners } : {}) };
      return Object.keys(shape).length ? shape : undefined;
    },
    tokens(shape, base) {
      const tokens: Record<string, string> = {};
      for (const [step, radius] of Object.entries(base.shape)) {
        const value = cornerRadius(shape, base, step);
        if (value !== radius) tokens[`--mtrl-sys-shape-corner-${step}`] = `${value}px`;
      }
      return tokens;
    },
    summary(shape) {
      const tuned = Object.keys(shape.corners ?? {}).length;
      return [`Roundness ${shape.roundness ?? 100}%`, tuned ? `${tuned} step${tuned === 1 ? '' : 's'} fine-tuned` : ''].filter(Boolean).join(', ');
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
    '/* mtrl theme, made on md3.io/styles/',
    ' *',
    ` * Load mtrl's base styles${state.base === 'baseline' ? '' : ` and the ${state.base} theme`}, then this file:`,
    ' *   import \'mtrl/styles/base\';',
    ...(state.base === 'baseline' ? [] : [` *   import 'mtrl/themes/${state.base}';`]),
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
  lines.push('', blocks.length ? `:root {\n${blocks.join('\n\n')}\n}` : '/* No overrides yet: the base theme as mtrl ships it. */', '');
  return lines.join('\n');
}
