// The Themes app's download, unit-tested: the menu's items and the files it writes.
// scripts/check-styles.ts runs the same flows in a browser.
import { describe, expect, test } from 'bun:test';
import { FORMAT_ITEMS, themeFile } from '../src/client/theme-app/features/withDownload';
import type { ThemeData } from '../src/client/theme-app/features/withThemeSource';
import { THEME_ROLES } from '../src/shared/theme-engine';

// schemeToTokens needs every role: colours per mode, one role by another.
const ROLES = [...THEME_ROLES];
const roles = (hex: string) => ROLES.map(() => hex);
const desert: ThemeData = {
  name: 'desert', label: 'Desert', light: roles('#9a7a3e'), dark: roles('#e0c38c'),
  origin: 'seed #9a7a3e, Tonal Spot', palettes: null, spec: { seed: '#9a7a3e', variant: 'tonal-spot', contrast: 0 },
};

describe('theme download', () => {
  test('the menu offers the files as CSS and JSON: the SCSS item is gone', () => {
    expect(FORMAT_ITEMS).toEqual([{ id: 'css', text: 'CSS' }, { id: 'json', text: 'JSON' }]);
  });
  test('the file is mtrl-theme-<name>.<format>, and its selector and name field carry that name', () => {
    const css = themeFile('css', desert, ROLES, 'My Theme');
    expect(css.name).toBe('mtrl-theme-my-theme.css');
    expect(css.text).toContain('[data-theme="my-theme"]');
    expect(css.text).not.toContain('[data-theme="desert"]');
    const json = themeFile('json', desert, ROLES, 'My Theme');
    expect(json.name).toBe('mtrl-theme-my-theme.json');
    expect(JSON.parse(json.text).name).toBe('my-theme');
  });
  test('no name typed (and no field yet): custom', () => {
    expect(themeFile('css', desert, ROLES).name).toBe('mtrl-theme-custom.css');
    expect(themeFile('json', desert, ROLES, '').name).toBe('mtrl-theme-custom.json');
  });
  test('a built-in theme\'s name is refused: the file falls back to custom', () => {
    expect(themeFile('css', desert, ROLES, 'desert').name).toBe('mtrl-theme-custom.css');
    expect(themeFile('json', desert, ROLES, 'Desert').text).toContain('"name": "custom"');
  });
  test('the CSS header says what the theme was generated from: seed, variant and contrast', () => {
    const css = themeFile('css', desert, ROLES, 'custom');
    expect(css.text).toContain('generated from seed #9a7a3e, Tonal Spot, standard contrast');
    const hand: ThemeData = { ...desert, spec: null, origin: null };
    expect(themeFile('css', hand, ROLES, 'custom').text).toContain('colours as mtrl ships them, set by hand');
  });
});
