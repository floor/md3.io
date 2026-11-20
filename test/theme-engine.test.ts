// The Themes page's engine against mtrl's own theme generator: for every theme
// mtrl generates from a seed, the page builds the same colour for every role, light
// and dark, and mtrl's schemeToTokens names them. If mtrl changes how it builds a
// scheme, this fails until the page follows.
import { describe, expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { CONTRAST_LEVELS, PALETTE_TONES, THEME_ROLES, VARIANTS, argbFromRgba, rolesOf, schemeFor, seedsFromPixels, themeColors, toneOf, type ColorSpec, type VariantName } from '../src/shared/theme-engine';

interface ThemeSpec {
  name: string;
  description: string;
  seed: string;
  variant: VariantName;
  contrast?: number;
  secondary?: string;
  tertiary?: string;
  standalone?: boolean;
}
interface ThemeGenerator {
  BASELINE_SEED: string;
  THEMES: ThemeSpec[];
  rolesOf: (scheme: unknown) => Record<string, string>;
  schemeFor: (spec: ThemeSpec, isDark: boolean) => unknown;
}

// The pinned upstream fixture runs from a temporary directory, so its imports
// must resolve from this project's installed dependencies and Material package.
const mtrl = resolve(import.meta.dir, '../node_modules/material');
const installedVersion = (JSON.parse(readFileSync(join(mtrl, 'package.json'), 'utf8')) as { version: string }).version;
const loadGenerateThemesScript = (): string => {
  const fixture = join(import.meta.dir, 'fixtures', `material-${installedVersion}-generate-themes.ts.txt`);
  const metadataFile = join(import.meta.dir, 'fixtures', `material-${installedVersion}-generator.json`);
  if (!existsSync(fixture) || !existsSync(metadataFile)) {
    throw new Error(`No pinned generator reference for material@${installedVersion}; refresh test/fixtures from the matching upstream version`);
  }
  const metadata = JSON.parse(readFileSync(metadataFile, 'utf8')) as { version: string; sha256: string };
  const source = readFileSync(fixture, 'utf8');
  if (metadata.version !== installedVersion || createHash('sha256').update(source).digest('hex') !== metadata.sha256) {
    throw new Error(`Material ${installedVersion} generator reference failed its integrity check`);
  }
  return source;
};
const rewrite = (source: string, specifier: string, target: string): string => {
  const from = `from ${JSON.stringify(specifier)}`;
  // If mtrl respells an import, the rewrite would miss and the copy would run
  // half-rewritten; fail loudly, naming the rewrite, instead.
  if (!source.includes(from)) throw new Error(`generate-themes.ts no longer has ${from}: update the copy's import rewrites`);
  return source.replace(from, `from ${JSON.stringify(target)}`);
};
let script = loadGenerateThemesScript();
script = rewrite(script, '@material/material-color-utilities', Bun.resolveSync('@material/material-color-utilities', import.meta.dir));
script = rewrite(script, 'sass', Bun.resolveSync('sass', import.meta.dir));
const coreThemeTarget = existsSync(join(mtrl, 'src/core/theme/index.ts'))
  ? join(mtrl, 'src/core/theme/index.ts')
  : join(mtrl, 'dist/core/theme/index.js');
script = rewrite(script, '../src/core/theme', coreThemeTarget);
const themeTarget = existsSync(join(mtrl, 'src/theme/index.ts'))
  ? join(mtrl, 'src/theme/index.ts')
  : join(mtrl, 'dist/theme/index.js');
const sideEffectImport = 'import "../src/theme";';
if (!script.includes(sideEffectImport)) throw new Error(`generate-themes.ts no longer has ${sideEffectImport}: update the copy's import rewrites`);
script = script.replace(sideEffectImport, `import ${JSON.stringify(themeTarget)};`);
const dynamicColorsTarget = existsSync(join(mtrl, 'src/theme/vendor/dynamiccolor/material_dynamic_colors.js'))
  ? join(mtrl, 'src/theme/vendor/dynamiccolor/material_dynamic_colors.js')
  : join(mtrl, 'dist/theme/vendor/dynamiccolor/material_dynamic_colors.js');
script = rewrite(script, '../src/theme/vendor/dynamiccolor/material_dynamic_colors', dynamicColorsTarget);
// The script reads files cwd-relative too: importing it lists src/styles/themes
// (HAND_THEMES), and standardTokens compiles from src/styles/themes and reads its
// _baseline.scss. Point that literal, with its opening quote, at mtrl's tree, as
// the imports are; the quote keeps the doc comment and renderThemes' template
// paths (src/styles/themes/_<name>.scss) out of the rewrite.
const themes = '"src/styles/themes';
if (!script.includes(themes)) throw new Error(`generate-themes.ts no longer has ${themes}: update the copy's path rewrite`);
script = script.replaceAll(themes, JSON.stringify(join(mtrl, 'src/styles/themes')).slice(0, -1));
const copy = join(mkdtempSync(join(tmpdir(), 'md3-themes-')), 'generate-themes.ts');
writeFileSync(copy, script);
const generator = await import(copy) as ThemeGenerator;
const { BASELINE_SEED, THEMES, rolesOf: mtrlRolesOf, schemeFor: mtrlSchemeFor } = generator;

const specOf = (theme: ThemeSpec): ColorSpec => ({ source: theme.seed, variant: theme.variant, contrast: theme.contrast ?? 0, ...(theme.secondary ? { core: { secondary: theme.secondary } } : {}) });

describe('theme engine', () => {
  test(`${BASELINE_SEED} / Tonal Spot equals mtrl's generate-themes.ts for every role`, () => {
    const mtrl: ThemeSpec = { name: 'parity', description: '', seed: BASELINE_SEED, variant: 'tonal-spot' };
    for (const isDark of [false, true]) {
      const ours = rolesOf(schemeFor({ source: '#6750A4', variant: 'tonal-spot', contrast: 0 }, isDark));
      const theirs = mtrlRolesOf(mtrlSchemeFor(mtrl, isDark));
      expect(Object.keys(ours)).toEqual([...THEME_ROLES]);
      for (const role of THEME_ROLES) expect(`${role} ${ours[role]}`).toBe(`${role} ${theirs[role]}`);
    }
  });

  test('every theme mtrl generates from a seed is rebuilt identically', () => {
    expect(THEMES.length).toBeGreaterThan(10);
    for (const theme of THEMES) for (const isDark of [false, true]) {
      const ours = rolesOf(schemeFor(specOf(theme), isDark));
      const theirs = mtrlRolesOf(mtrlSchemeFor(theme, isDark));
      const theirThemeRoles = Object.fromEntries(THEME_ROLES.map(role => [role, theirs[role]]));
      expect({ theme: theme.name, isDark, roles: ours }).toEqual({ theme: theme.name, isDark, roles: theirThemeRoles });
    }
  });

  test('the shipped theme CSS carries the same tokens the page exports', async () => {
    for (const theme of THEMES) {
      const css = await Bun.file(`node_modules/material/dist/themes/${theme.name}.css`).text();
      const { tokens } = themeColors(specOf(theme));
      const light = css.slice(0, css.indexOf('[data-theme-mode=dark]'));
      // The last declaration wins: the status-colour mixin sets error before the scheme does.
      const declared = (name: string) => [...light.matchAll(new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, 'gi'))].at(-1)?.[1]?.toLowerCase();
      for (const [name, value] of Object.entries(tokens.light)) expect(`${theme.name} ${name}: ${declared(name)}`).toBe(`${theme.name} ${name}: ${value}`);
    }
  });

  test('tokens cover every role in both modes, palettes every tone', () => {
    const { tokens, palettes } = themeColors({ source: '#006a6a', variant: 'vibrant', contrast: 0.5, core: { tertiary: '#b3261e' } });
    for (const mode of ['light', 'dark'] as const) expect(Object.keys(tokens[mode])).toEqual(THEME_ROLES.map(role => `--mtrl-sys-color-${role}`));
    for (const tones of Object.values(palettes)) { expect(tones.length).toBe(PALETTE_TONES.length); expect(tones[0]).toBe('#ffffff'); expect(tones.at(-1)).toBe('#000000'); }
  });

  test('variants, contrast and color match change the scheme', () => {
    const base: ColorSpec = { source: '#6750a4', variant: 'tonal-spot', contrast: 0 };
    const primary = (spec: ColorSpec) => themeColors(spec).roles.light.primary;
    expect(new Set(VARIANTS.map(({ name }) => primary({ ...base, variant: name }))).size).toBeGreaterThan(5);
    expect(new Set(CONTRAST_LEVELS.map(({ value }) => primary({ ...base, contrast: value }))).size).toBe(3);
    // Color match: the input sits in the container role, as Fidelity maps it.
    const input = '#4caf50';
    const matched = themeColors({ ...base, match: true, core: { primary: input } }).roles.light['primary-container'];
    expect(Math.abs(toneOf(matched!) - toneOf(input))).toBeLessThan(1);
  });

  test('image seeds: a two-colour image gives its colours, best first', () => {
    const red = [200, 30, 40, 255];
    const blue = [20, 60, 200, 255];
    const rgba = [...Array.from({ length: 300 }, () => red), ...Array.from({ length: 100 }, () => blue)].flat();
    const seeds = seedsFromPixels(argbFromRgba(rgba));
    expect(seeds.length).toBeGreaterThanOrEqual(1);
    expect(seeds[0]).toBe('#c81e28');
  });
});
