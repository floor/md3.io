import { describe, expect, test } from 'bun:test';
import * as themeState from '../src/shared/theme-state';
import { cornerRadius, defaultState, downloadName, normalize, parse, serialize, toCss, toTokens, type ThemeBase } from '../src/shared/theme-state';
import { themeBase } from '../src/server/tokens';

// A small base keeps the expectations readable; the last test runs against mtrl's own.
const base: ThemeBase = { themes: ['baseline', 'ocean'], shape: { none: 0, small: 8, medium: 12, 'extra-large': 28, full: 9999, pill: 100 } };

describe('theme state', () => {
  test('round trip: serialize then parse gives the same state', () => {
    const state = normalize({ v: 1, base: 'ocean', mode: 'dark', shape: { corners: { small: 3, medium: 20 } } }, base);
    const text = serialize(state);
    expect(text).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(parse(text, base)).toEqual(state);
  });
  test('parse rejects what is not a state', () => {
    for (const text of ['', 'not base64!', serialize({ ...defaultState(), v: 2 } as never), btoa('[1,2]'), 'e30', 'x'.repeat(5000)]) expect(parse(text, base)).toBeNull();
  });
  test('validation drops unknown keys, clamps values, and leaves out what equals mtrl', () => {
    const state = normalize({ v: 1, base: 'nope', mode: 'dim', extra: 1, shape: { corners: { medium: -4, small: 7.6, 'extra-large': 999, full: 3, none: 5, unknown: 5, large: 'big' }, junk: true } }, base);
    expect(state).toEqual({ v: 1, base: 'baseline', mode: 'light', shape: { corners: { medium: 0, 'extra-large': 120 } } });
    expect(normalize(null, base)).toEqual(defaultState());
    expect(normalize({ shape: { corners: { medium: 12 } } }, base)).toEqual(defaultState());
  });
  test('an old link with the global roundness still opens, without it', () => {
    const old = serialize({ v: 1, base: 'ocean', mode: 'light', shape: { roundness: 150, corners: { small: 3 } } } as never);
    expect(parse(old, base)).toEqual({ v: 1, base: 'ocean', mode: 'light', shape: { corners: { small: 3 } } });
    expect(parse(serialize({ v: 1, base: 'baseline', mode: 'dark', shape: { roundness: 200 } } as never), base)).toEqual({ v: 1, base: 'baseline', mode: 'dark' });
  });
  test('toTokens gives only what differs from the base theme', () => {
    expect(toTokens(defaultState(), base)).toEqual({});
    expect(toTokens(normalize({ shape: { corners: { medium: 24, small: 8 } } }, base), base)).toEqual({ '--mtrl-sys-shape-corner-medium': '24px' });
  });
  test('none, full and pill cannot be edited', () => {
    const shape = { corners: { none: 4, full: 20, pill: 10 } };
    expect([cornerRadius(shape, base, 'none'), cornerRadius(shape, base, 'full'), cornerRadius(shape, base, 'pill')]).toEqual([0, 9999, 100]);
  });
  test('the CSS loads the base theme and overrides by section', () => {
    const css = toCss(normalize({ base: 'ocean', mode: 'dark', shape: { corners: { small: 4 } } }, base), base);
    expect(css).toContain("import 'mtrl/styles/base';");
    expect(css).toContain("import 'mtrl/themes/ocean';");
    expect(css).toContain('<html data-theme="ocean" data-theme-mode="dark">');
    expect(css).toContain('  /* Shape */\n  --mtrl-sys-shape-corner-small: 4px;');
    expect(toCss(defaultState(), base)).not.toContain('mtrl/themes/');
  });
  test('the colour theme files are CSS and JSON only: SCSS is gone', () => {
    expect(Object.keys(themeState).filter(key => key.startsWith('colorTheme'))).toEqual(['colorThemeCss', 'colorThemeJson']);
  });
  test('a downloaded theme\'s name is trimmed, lower-cased and [a-z0-9-]: other runs become one hyphen', () => {
    expect(downloadName('  Desert  Oasis! ')).toBe('desert-oasis');
    expect(downloadName('My__Theme!!!2')).toBe('my-theme-2');
    expect(downloadName('--Edge--Case--')).toBe('edge-case');
    expect(downloadName('Ünicode-Ærø')).toBe('nicode-r');
  });
  test('an empty name, or nothing left of one, is custom', () => {
    for (const value of ['', '   ', '!!!', '-', '---', undefined, null]) expect(downloadName(value)).toBe('custom');
  });
  test('a downloaded theme\'s name stops at 40 characters, without a trailing hyphen from the cut', () => {
    expect(downloadName('a'.repeat(60))).toBe('a'.repeat(40));
    expect(downloadName(`${'a'.repeat(39)}-b`)).toBe('a'.repeat(39));
    expect(downloadName(`${'a'.repeat(38)}!!b`)).toBe(`${'a'.repeat(38)}-b`);
  });
  test('a built-in theme\'s name is refused, typed as it is or as a name', () => {
    for (const name of ['desert', 'Desert', 'desert!', 'baseline', 'highcontrast', 'neutral', 'vibrant', 'ocean']) expect(downloadName(name)).toBeNull();
    expect(downloadName('custom')).toBe('custom');
    expect(downloadName('Custom')).toBe('custom');
  });
  // mtrl 0.10 ships 24 theme files and offers 20: the four it keeps for old users
  // (deprecated in 0.10, removed in 1.0) are built into mtrl all the same.
  test('the themes mtrl still ships but no longer offers are refused too: built in is built in', () => {
    for (const name of ['material', 'winter', 'browngreen', 'legacy']) expect(downloadName(name), name).toBeNull();
  });
  test('mtrl\'s own scale: every editable step can be overridden', () => {
    const editable = Object.entries(themeBase.shape).filter(([, radius]) => radius > 0 && radius < 100);
    expect(editable.map(([step]) => step)).toContain('medium');
    const tokens = toTokens(normalize({ shape: { corners: Object.fromEntries(editable.map(([step]) => [step, 0])) } }, themeBase), themeBase);
    expect(Object.keys(tokens).sort()).toEqual(editable.map(([step]) => `--mtrl-sys-shape-corner-${step}`).sort());
  });
});
