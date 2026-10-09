import { describe, expect, test } from 'bun:test';
import { checkTabsSlugs } from '../scripts/check-tabs-options';

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
