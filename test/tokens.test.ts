import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { themes } from '../src/shared/button';
import { contrastRatio, pairOf } from '../src/shared/color';
import { allRoles, baseline, colorGroups, parseCss, parseDeclarations, themeTokens, TYPE_ROLES, typescale } from '../src/server/tokens';

const baseCss = readFileSync(resolve(import.meta.dir, '../node_modules/material/dist/styles/base.css'), 'utf8');
const CORE_ROLES = ['primary', 'on-primary', 'primary-container', 'on-primary-container', 'secondary', 'on-secondary', 'tertiary', 'on-tertiary', 'error', 'on-error', 'surface', 'on-surface', 'on-surface-variant', 'outline', 'outline-variant', 'inverse-surface', 'inverse-on-surface', 'inverse-primary'];

describe('mtrl tokens', () => {
  test('declarations split on `;` outside parentheses', () => {
    expect([...parseDeclarations('--a: 1; --b: var(--c, x;y) ; color:red')]).toEqual([['--a', '1'], ['--b', 'var(--c, x;y)'], ['color', 'red']]);
    expect(parseCss('@layer a,b;@layer a{:root{--x: #fff}}')).toEqual([{ path: ['@layer a', ':root'], declarations: new Map([['--x', '#fff']]) }]);
  });
  test('baseline light primary is the value in base.css', () => {
    const rootBlock = /:root\{([^}]*--mtrl-sys-color-primary:[^}]*)\}/.exec(baseCss)![1]!;
    const primary = /--mtrl-sys-color-primary:\s*([^;]+);/.exec(rootBlock)![1]!.trim().toLowerCase();
    expect(baseline.light.get('primary')).toBe(primary);
    expect(themeTokens.baseline!.light.primary!.value).toBe(primary);
  });
  test('-rgb twins are not roles', () => {
    expect([...allRoles].some(role => role.endsWith('-rgb'))).toBe(false);
  });
  test('every theme parses, light and dark, with the core roles as hex', () => {
    for (const theme of themes) {
      for (const mode of ['light', 'dark'] as const) {
        const scheme = themeTokens[theme]![mode];
        for (const role of CORE_ROLES) {
          expect(scheme[role], `${theme} ${mode} ${role}`).toBeDefined();
          expect(scheme[role]!.value).toMatch(/^#[0-9a-f]{6}$/);
          // The core roles are the theme's own, not inherited.
          expect(scheme[role]!.inherited, `${theme} ${mode} ${role}`).toBe(false);
        }
      }
      expect(themeTokens[theme]!.light.primary!.value, theme).not.toBe(themeTokens[theme]!.dark.primary!.value);
    }
  });
  test('a role a theme leaves out is inherited and marked so', () => {
    const ocean = themeTokens.ocean!.light;
    expect(ocean.scrim).toEqual({ value: baseline.light.get('scrim')!, inherited: true, from: 'baseline' });
  });
  test('every role the color page lists exists in the CSS', () => {
    const listed = colorGroups.flatMap(group => group.roles);
    expect(listed.length).toBeGreaterThan(30);
    for (const role of listed) expect(baseCss.includes(`--mtrl-sys-color-${role}:`) || themes.some(theme => readFileSync(resolve(import.meta.dir, `../node_modules/material/dist/themes/${theme}.css`), 'utf8').includes(`--mtrl-sys-color-${role}:`)), role).toBe(true);
  });
  test('the type scale has 15 roles with numeric sizes', () => {
    expect(typescale.map(style => style.role)).toEqual(TYPE_ROLES);
    expect(typescale).toHaveLength(15);
    for (const style of typescale) {
      for (const value of [style.fontSize, style.lineHeight]) expect(Number.isFinite(parseFloat(value)), `${style.role} ${value}`).toBe(true);
      expect(Number(style.fontWeight)).toBeGreaterThan(0);
      expect(style.font).not.toContain('var(');
    }
    expect(typescale[0]).toMatchObject({ role: 'display-large', fontSize: '57px', lineHeight: '64px' });
  });
});

describe('color helpers', () => {
  test('contrast ratio of known pairs', () => {
    expect(contrastRatio('#000', '#fff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 2);
    expect(contrastRatio('red', '#fff')).toBeNull();
  });
  test('each role pairs with its content colour', () => {
    const has = (role: string) => allRoles.has(role);
    expect(pairOf('primary', has)).toBe('on-primary');
    expect(pairOf('on-primary-container', has)).toBe('primary-container');
    expect(pairOf('surface-container-high', has)).toBe('on-surface');
    expect(pairOf('inverse-on-surface', has)).toBe('inverse-surface');
    expect(pairOf('outline', has)).toBeNull();
  });
});
