// The Themes page's colour engine: Google's material-color-utilities builds the
// scheme, and mtrl's own `schemeToTokens` and `THEME_ROLES` turn it into tokens. The
// scheme building mirrors mtrl's scripts/generate-themes.ts (`schemeFor`, `rolesOf`)
// line for line, so a theme made here and a theme mtrl ships cannot drift; a test
// (test/theme-engine.test.ts) holds every generated theme to it. Shared by the server,
// the page and the image worker; nothing here touches the DOM.
import {
  DynamicScheme,
  Hct,
  QuantizerCelebi,
  SchemeContent,
  SchemeExpressive,
  SchemeFidelity,
  SchemeFruitSalad,
  SchemeMonochrome,
  SchemeNeutral,
  SchemeRainbow,
  SchemeTonalSpot,
  SchemeVibrant,
  Score,
  TonalPalette,
  Variant,
  argbFromHex,
  hexFromArgb,
} from '@material/material-color-utilities';
import { schemeToTokens, THEME_ROLES, type ThemeTokens } from 'mtrl/core/theme';

export { THEME_ROLES };
export type VariantName =
  | 'tonal-spot' | 'neutral' | 'vibrant' | 'expressive' | 'fidelity'
  | 'content' | 'monochrome' | 'rainbow' | 'fruit-salad';

/** M3's dynamic-scheme variants, as generate-themes.ts names and titles them. */
export const VARIANTS: readonly { name: VariantName; label: string }[] = [
  { name: 'tonal-spot', label: 'Tonal Spot' }, { name: 'neutral', label: 'Neutral' }, { name: 'vibrant', label: 'Vibrant' },
  { name: 'expressive', label: 'Expressive' }, { name: 'fidelity', label: 'Fidelity' }, { name: 'content', label: 'Content' },
  { name: 'monochrome', label: 'Monochrome' }, { name: 'rainbow', label: 'Rainbow' }, { name: 'fruit-salad', label: 'Fruit Salad' },
];
/** M3's contrast levels: standard, medium and high. */
export const CONTRAST_LEVELS: readonly { value: number; label: string }[] = [
  { value: 0, label: 'Standard' }, { value: 0.5, label: 'Medium' }, { value: 1, label: 'High' },
];
/** The core colours a theme can pin, as MTB's "Core colors" lists them. */
export const CORE_COLORS = ['primary', 'secondary', 'tertiary', 'error', 'neutral', 'neutralVariant'] as const;
export type CoreColor = (typeof CORE_COLORS)[number];
export const CORE_LABELS: Record<CoreColor, string> = { primary: 'Primary', secondary: 'Secondary', tertiary: 'Tertiary', error: 'Error', neutral: 'Neutral', neutralVariant: 'Neutral Variant' };
/** The tones MTB shows for each tonal palette. */
export const PALETTE_TONES = [100, 99, 98, 95, 90, 80, 70, 60, 50, 40, 35, 30, 25, 20, 15, 10, 5, 0] as const;

/** What a colour theme is made from. Every field is plain data: it travels in share links. */
export interface ColorSpec {
  /** The source (seed) colour, #rrggbb. */
  source: string;
  variant: VariantName;
  /** 0 standard, 0.5 medium, 1 high. */
  contrast: number;
  /**
   * MTB's "Color match: stay true to my color inputs": the inputs fill the container
   * roles, as M3's Fidelity scheme maps them, whatever the variant.
   */
  match?: boolean;
  /** Pinned core colours. `primary` replaces the source; the others key their own palette. */
  core?: Partial<Record<CoreColor, string>>;
}

const SCHEMES: Record<VariantName, new (source: Hct, isDark: boolean, contrast: number) => DynamicScheme> = {
  'tonal-spot': SchemeTonalSpot, neutral: SchemeNeutral, vibrant: SchemeVibrant, expressive: SchemeExpressive,
  fidelity: SchemeFidelity, content: SchemeContent, monochrome: SchemeMonochrome, rainbow: SchemeRainbow,
  'fruit-salad': SchemeFruitSalad,
};
const VARIANT_ENUM: Record<VariantName, Variant> = {
  'tonal-spot': Variant.TONAL_SPOT, neutral: Variant.NEUTRAL, vibrant: Variant.VIBRANT, expressive: Variant.EXPRESSIVE,
  fidelity: Variant.FIDELITY, content: Variant.CONTENT, monochrome: Variant.MONOCHROME, rainbow: Variant.RAINBOW,
  'fruit-salad': Variant.FRUIT_SALAD,
};

export const HEX = /^#[0-9a-f]{6}$/i;
const camel = (role: string): string => role.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

/** The variant the roles are mapped with: color match maps as Fidelity does. */
export const effectiveVariant = (spec: ColorSpec): VariantName => (spec.match ? 'fidelity' : spec.variant);

/**
 * The scheme for a spec, in one mode: generate-themes.ts's `schemeFor`, with every
 * core colour where it has `secondary` (a palette keyed from the colour's own hue and
 * chroma), and the primary as the source.
 */
export function schemeFor(spec: ColorSpec, isDark: boolean): DynamicScheme {
  const variant = effectiveVariant(spec);
  const source = Hct.fromInt(argbFromHex(spec.core?.primary ?? spec.source));
  const base = new SCHEMES[variant](source, isDark, spec.contrast);
  const pinned = (['secondary', 'tertiary', 'error', 'neutral', 'neutralVariant'] as const).filter(key => spec.core?.[key]);
  if (!pinned.length) return base;
  const palette = (key: CoreColor, fallback: TonalPalette) => (spec.core?.[key] ? TonalPalette.fromInt(argbFromHex(spec.core[key]!)) : fallback);
  return new DynamicScheme({
    sourceColorHct: source,
    variant: VARIANT_ENUM[variant],
    contrastLevel: spec.contrast,
    isDark,
    primaryPalette: base.primaryPalette,
    secondaryPalette: palette('secondary', base.secondaryPalette),
    tertiaryPalette: palette('tertiary', base.tertiaryPalette),
    neutralPalette: palette('neutral', base.neutralPalette),
    neutralVariantPalette: palette('neutralVariant', base.neutralVariantPalette),
    errorPalette: palette('error', base.errorPalette),
  });
}

/** A scheme's colours by role, as hex: generate-themes.ts's `rolesOf`. */
export const rolesOf = (scheme: DynamicScheme): Record<string, string> =>
  Object.fromEntries(THEME_ROLES.map(role => {
    const argb = (scheme as unknown as Record<string, number>)[camel(role)];
    if (typeof argb !== 'number') throw new Error(`material-color-utilities has no ${camel(role)}`);
    return [role, hexFromArgb(argb)];
  }));

export interface ThemeColors {
  /** Role → #rrggbb, every THEME_ROLES role, per mode. */
  roles: { light: Record<string, string>; dark: Record<string, string> };
  /** mtrl's colour tokens, from mtrl's own `schemeToTokens`. */
  tokens: ThemeTokens;
  /** The six key palettes at PALETTE_TONES, as hex. */
  palettes: Record<CoreColor, string[]>;
}

/** Everything the page shows for a spec: roles, tokens and palettes, light and dark. */
export function themeColors(spec: ColorSpec): ThemeColors {
  const light = schemeFor(spec, false);
  const roles = { light: rolesOf(light), dark: rolesOf(schemeFor(spec, true)) };
  const keyed: Record<CoreColor, TonalPalette> = {
    primary: light.primaryPalette, secondary: light.secondaryPalette, tertiary: light.tertiaryPalette,
    error: light.errorPalette, neutral: light.neutralPalette, neutralVariant: light.neutralVariantPalette,
  };
  const palettes = Object.fromEntries(CORE_COLORS.map(key => [key, PALETTE_TONES.map(tone => hexFromArgb(keyed[key].tone(tone)))])) as Record<CoreColor, string[]>;
  return { roles, tokens: schemeToTokens(roles), palettes };
}

/** HCT tone (0–100) of a hex colour. */
export const toneOf = (hex: string): number => Hct.fromInt(argbFromHex(hex)).tone;

/** A random, theme-worthy source: any hue, enough chroma to colour a scheme. */
export function randomSource(random = Math.random): string {
  return hexFromArgb(Hct.from(random() * 360, 40 + random() * 40, 40 + random() * 20).toInt());
}

/**
 * The best source colours in an image, as M3's wallpaper theming picks them: Celebi
 * quantisation to 128 colours, then Score (which filters unsuitable colours and falls
 * back to Google Blue). `pixels` are ARGB ints; transparent ones are skipped.
 */
export function seedsFromPixels(pixels: ArrayLike<number>, desired = 4): string[] {
  const opaque: number[] = [];
  for (let i = 0; i < pixels.length; i++) if (pixels[i]! >>> 24 === 255) opaque.push(pixels[i]!);
  return Score.score(QuantizerCelebi.quantize(opaque, 128), { desired }).map(argb => hexFromArgb(argb));
}

/** RGBA bytes (ImageData) as ARGB ints. */
export function argbFromRgba(data: ArrayLike<number>): number[] {
  const out: number[] = new Array(data.length / 4);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) out[j] = ((data[i + 3]! << 24) | (data[i]! << 16) | (data[i + 1]! << 8) | data[i + 2]!) >>> 0;
  return out;
}
