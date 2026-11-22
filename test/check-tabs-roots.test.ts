import { describe, expect, test } from 'bun:test';
import { assertComponentRoot, componentRootClass, isRootClass } from '../scripts/check-tabs-roots';
import { eligibleTabComponents } from '../scripts/check-tabs-eligible';

describe('framework root coverage', () => {
  test('renamed pages use the installed CSS roots', () => {
    expect(componentRootClass('app-bar')).toBe('mtrl-top-app-bar');
    expect(componentRootClass('navigation-drawer')).toBe('mtrl-drawer');
    for (const root of ['mtrl-top-app-bar', 'mtrl-drawer', 'mtrl-bottom-app-bar']) expect(isRootClass(root)).toBe(true);
    expect(isRootClass('mtrl-app-bar')).toBe(false);
    expect(isRootClass('mtrl-navigation-drawer')).toBe(false);
  });

  test('every selectable component has a registered root check', () => {
    for (const slug of eligibleTabComponents()) expect(isRootClass(componentRootClass(slug)), slug).toBe(true);
  });

  test('nested controls and modifiers cannot stand in for a missing component root', () => {
    for (const slug of ['app-bar', 'navigation-drawer']) {
      const root = componentRootClass(slug);
      expect(() => assertComponentRoot(slug, [], 'preview')).toThrow(`no ${root} root`);
      expect(() => assertComponentRoot(slug, ['mtrl-icon-button', `${root}--open`, `${root}__headline`], 'tab')).toThrow(`no ${root} root`);
      expect(() => assertComponentRoot(slug, [root, 'mtrl-icon-button'], 'tab')).not.toThrow();
    }
  });

  test('unregistered roots fail rather than silently skipping verification', () => {
    expect(() => assertComponentRoot('new-widget', ['mtrl-new-widget'], 'preview')).toThrow('root check is not registered');
    expect(isRootClass('button')).toBe(false);
    expect(isRootClass('mtrl-button--filled')).toBe(false);
    expect(isRootClass('mtrl-button__label')).toBe(false);
  });
});
