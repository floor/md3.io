import { describe, expect, test } from 'bun:test';
import { cornerRadius, defaultState, normalize, parse, serialize, toCss, toTokens, type ThemeBase } from '../src/shared/theme-state';
import { themeBase } from '../src/server/tokens';

// A small base keeps the expectations readable; the last test runs against mtrl's own.
const base: ThemeBase = { themes: ['baseline', 'ocean'], shape: { none: 0, small: 8, medium: 12, 'extra-large': 28, full: 9999, pill: 100 } };

describe('theme state', () => {
  test('round trip: serialize then parse gives the same state', () => {
    const state = normalize({ v: 1, base: 'ocean', mode: 'dark', shape: { roundness: 150, corners: { small: 3 } } }, base);
    const text = serialize(state);
    expect(text).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(parse(text, base)).toEqual(state);
  });
  test('parse rejects what is not a state', () => {
    for (const text of ['', 'not base64!', serialize({ ...defaultState(), v: 2 } as never), btoa('[1,2]'), 'e30', 'x'.repeat(5000)]) expect(parse(text, base)).toBeNull();
  });
  test('validation drops unknown keys and clamps values', () => {
    const state = normalize({ v: 1, base: 'nope', mode: 'dim', extra: 1, shape: { roundness: 9000, corners: { medium: -4, small: 7.6, full: 3, unknown: 5, 'extra-large': 'big' }, junk: true } }, base);
    expect(state).toEqual({ v: 1, base: 'baseline', mode: 'light', shape: { roundness: 300, corners: { medium: 0, small: 8 } } });
    expect(normalize(null, base)).toEqual(defaultState());
    // A section with nothing different from mtrl is left out.
    expect(normalize({ shape: { roundness: 100, corners: {} } }, base)).toEqual(defaultState());
  });
  test('toTokens gives only what differs from the base theme', () => {
    expect(toTokens(defaultState(), base)).toEqual({});
    expect(toTokens(normalize({ shape: { roundness: 200 } }, base), base)).toEqual({
      '--mtrl-sys-shape-corner-small': '16px', '--mtrl-sys-shape-corner-medium': '24px', '--mtrl-sys-shape-corner-extra-large': '56px',
    });
    // A fine-tuned step wins over roundness; one equal to mtrl's value is no override.
    expect(toTokens(normalize({ shape: { roundness: 0, corners: { medium: 12 } } }, base), base)).toEqual({ '--mtrl-sys-shape-corner-small': '0px', '--mtrl-sys-shape-corner-extra-large': '0px' });
  });
  test('roundness keeps none square and full and pill as they are', () => {
    const shape = { roundness: 250 };
    expect([cornerRadius(shape, base, 'none'), cornerRadius(shape, base, 'full'), cornerRadius(shape, base, 'pill')]).toEqual([0, 9999, 100]);
  });
  test('the CSS loads the base theme and overrides by section', () => {
    const css = toCss(normalize({ base: 'ocean', mode: 'dark', shape: { roundness: 50 } }, base), base);
    expect(css).toContain("import 'mtrl/styles/base';");
    expect(css).toContain("import 'mtrl/themes/ocean';");
    expect(css).toContain('<html data-theme="ocean" data-theme-mode="dark">');
    expect(css).toContain('  /* Shape */\n  --mtrl-sys-shape-corner-small: 4px;');
    expect(toCss(defaultState(), base)).not.toContain('mtrl/themes/');
  });
  test('mtrl\'s own scale: every scalable step follows roundness', () => {
    const tokens = toTokens(normalize({ shape: { roundness: 0 } }, themeBase), themeBase);
    for (const [step, radius] of Object.entries(themeBase.shape)) expect(tokens[`--mtrl-sys-shape-corner-${step}`]).toBe((radius > 0 && radius < 100 ? '0px' : undefined) as string);
  });
});
