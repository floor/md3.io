import { describe, expect, test } from 'bun:test';
import { checkTabsRecycle, checkTabsSlugs } from '../scripts/check-tabs-options';

const known = ['button', 'icon-button', 'tabs'] as const;

describe('CHECK_TABS', () => {
  test('unset runs every known component, in that order', () => {
    expect(checkTabsSlugs(undefined, known)).toEqual({ ok: true, slugs: ['button', 'icon-button', 'tabs'] });
  });

  test('an empty value runs every known component', () => {
    expect(checkTabsSlugs('', known)).toEqual({ ok: true, slugs: ['button', 'icon-button', 'tabs'] });
  });

  test('a comma list runs those slugs, in the order written', () => {
    expect(checkTabsSlugs('tabs, button', known)).toEqual({ ok: true, slugs: ['tabs', 'button'] });
  });

  test('spaces and a repeated slug are dropped', () => {
    expect(checkTabsSlugs(' button, button ,icon-button, ', known)).toEqual({ ok: true, slugs: ['button', 'icon-button'] });
  });

  test('an unknown slug is an error', () => {
    expect(checkTabsSlugs('button,nope', known)).toEqual({ ok: false, error: 'CHECK_TABS: unknown component: nope' });
  });

  test('a list that names nothing is an error', () => {
    expect(checkTabsSlugs(',', known)).toEqual({ ok: false, error: 'CHECK_TABS names no component' });
  });
});

describe('CHECK_TABS_RECYCLE', () => {
  test('unset gives 6', () => {
    expect(checkTabsRecycle(undefined)).toBe(6);
  });

  test('an empty value gives 6', () => {
    expect(checkTabsRecycle('')).toBe(6);
  });

  test('"1" gives 1', () => {
    expect(checkTabsRecycle('1')).toBe(1);
  });

  test('"6" gives 6', () => {
    expect(checkTabsRecycle('6')).toBe(6);
  });

  test('"12" gives 12', () => {
    expect(checkTabsRecycle('12')).toBe(12);
  });

  test.each(['0', '06', '6.0', 'x', '-1'])('%s gives 6', value => {
    expect(checkTabsRecycle(value)).toBe(6);
  });
});
