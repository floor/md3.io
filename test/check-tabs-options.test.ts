import { describe, expect, test } from 'bun:test';
import { checkTabsBatch, checkTabsBatches, checkTabsOnlyBatch, checkTabsRecycle, checkTabsSlugs } from '../scripts/check-tabs-options';

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

describe('CHECK_TABS_BATCH', () => {
  test('unset gives 6', () => {
    expect(checkTabsBatch(undefined)).toBe(6);
  });

  test('an empty value gives 6', () => {
    expect(checkTabsBatch('')).toBe(6);
  });

  test('"1" gives 1', () => {
    expect(checkTabsBatch('1')).toBe(1);
  });

  test('"6" gives 6', () => {
    expect(checkTabsBatch('6')).toBe(6);
  });

  test('"12" gives 12', () => {
    expect(checkTabsBatch('12')).toBe(12);
  });

  test.each(['0', '06', '6.0', 'x', '-1'])('%s gives 6', value => {
    expect(checkTabsBatch(value)).toBe(6);
  });

  test('batches keep order and leave the last one short', () => {
    expect(checkTabsBatches(['a', 'b', 'c', 'd', 'e'], 2)).toEqual([['a', 'b'], ['c', 'd'], ['e']]);
  });

  test('a size that covers the list is one batch', () => {
    expect(checkTabsBatches(['a', 'b'], 6)).toEqual([['a', 'b']]);
  });
});

describe('CHECK_TABS_ONLY_BATCH', () => {
  test('unset runs every batch', () => {
    expect(checkTabsOnlyBatch(undefined)).toEqual({ ok: true });
  });

  test('an empty value runs every batch', () => {
    expect(checkTabsOnlyBatch('')).toEqual({ ok: true });
  });

  test('"1" is the first batch', () => {
    expect(checkTabsOnlyBatch('1')).toEqual({ ok: true, index: 1 });
  });

  test('"3" is the third batch', () => {
    expect(checkTabsOnlyBatch('3')).toEqual({ ok: true, index: 3 });
  });

  test.each(['0', '01', '1.5', 'x'])('%s is an error', value => {
    expect(checkTabsOnlyBatch(value)).toEqual({ ok: false, error: 'CHECK_TABS_ONLY_BATCH must be a whole number from 1' });
  });
});
