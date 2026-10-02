// The Themes page's engine against mtrl's own theme generator: for every theme
// mtrl generates from a seed, the page builds the same colour for every role, light
// and dark, and mtrl's schemeToTokens names them. If mtrl changes how it builds a
// scheme, this fails until the page follows.
import { describe, expect, test } from 'bun:test';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { ThemeSpec } from '../node_modules/material/scripts/generate-themes';

// mtrl's script, copied to a temp directory and run from there, has to resolve its
// imports from md3.io, not from mtrl's checkout (file:../material): that checkout may
// not have its devDependencies installed, and a temp directory has no package tree
// at all. Three of its four imports need pointing elsewhere: the two bare packages,
// material-color-utilities (the same pinned 0.4.0) and sass, at md3.io's own
// installed copies, and the relative ../src/core/theme at mtrl's source. The
// fourth, node:fs, is a builtin and resolves as it is.
const mtrl = resolve(import.meta.dir, '../node_modules/material');
const rewrite = (source: string, specifier: string, target: string): string => {
  const from = `from ${JSON.stringify(specifier)}`;
  // If mtrl respells an import, the rewrite would miss and the copy would run
  // half-rewritten; fail loudly, naming the rewrite, instead.
  if (!source.includes(from)) throw new Error(`generate-themes.ts no longer has ${from}: update the copy's import rewrites`);
  return source.replace(from, `from ${JSON.stringify(target)}`);
};
let script = await Bun.file(join(mtrl, 'scripts/generate-themes.ts')).text();
script = rewrite(script, '@material/material-color-utilities', Bun.resolveSync('@material/material-color-utilities', import.meta.dir));
script = rewrite(script, 'sass', Bun.resolveSync('sass', import.meta.dir));
script = rewrite(script, '../src/core/theme', join(mtrl, 'src/core/theme/index.ts'));
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
const generator = await import(copy) as typeof import('../node_modules/material/scripts/generate-themes');
const { BASELINE_SEED, THEMES, rolesOf: mtrlRolesOf, schemeFor: mtrlSchemeFor } = generator;
import { CONTRAST_LEVELS, PALETTE_TONES, THEME_ROLES, VARIANTS, argbFromRgba, rolesOf, schemeFor, seedsFromPixels, themeColors, toneOf, type ColorSpec } from '../src/shared/theme-engine';

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
      expect({ theme: theme.name, isDark, roles: rolesOf(schemeFor(specOf(theme), isDark)) }).toEqual({ theme: theme.name, isDark, roles: mtrlRolesOf(mtrlSchemeFor(theme, isDark)) });
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
