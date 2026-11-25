import { describe, expect, test } from 'bun:test';
import { components, initialComponentState, normalizeComponentState } from '../src/shared/components';

const scenario = (id: string) => {
  const found = components.badge.scenarios.find(item => item.id === id);
  if (!found) throw new Error(`missing badge scenario ${id}`);
  return found;
};
const stateFor = (id: string) => normalizeComponentState('badge', { ...initialComponentState('badge'), ...scenario(id).options });

describe('badge scenarios', () => {
  test('the inbox button has three jobs, and each option is a control the page already has', () => {
    expect(components.badge.scenarios.map(item => item.name)).toEqual(['Packed inbox', 'Ten unread', 'New mail']);
    const keys = new Set(components.badge.controls.map(control => control.key));
    for (const item of components.badge.scenarios) {
      expect(item.source).toBe('https://m3.material.io/components/badges/guidelines');
      for (const key of Object.keys(item.options)) expect(keys.has(key)).toBe(true);
    }
  });

  test('packed inbox sets a count past the 999 maximum', () => {
    expect(scenario('packed-inbox').description).toBe('An inbox with more mail than the badge can spell out, so the count stops at 999+. The same count is on Photos in the Files drawer and on Mail in the navigation bar.');
    const state = stateFor('packed-inbox');
    expect(state.hasLabel).toBe(true);
    const config = components.badge.config(state);
    expect(config.variant).toBe('large');
    expect(config.label).toBe('1250');
    expect(config.max).toBe(999);
    expect(config.color).toBe('error');
    expect(config.position).toBe('top-right');
    expect(config.visible).toBe(true);
  });

  test('ten unread is a count the badge can still show', () => {
    expect(scenario('ten-unread').description).toBe('Ten new messages, a count the badge can still show. The same count is on Music and on Chat in the navigation bar.');
    const config = components.badge.config(stateFor('ten-unread'));
    expect(config.variant).toBe('large');
    expect(config.label).toBe('10');
    expect(scenario('ten-unread').options.max).toBeUndefined();
    expect(config.max).toBe(99);
    expect(config.color).toBe('error');
    expect(config.visible).toBe(true);
  });

  test('new mail is a dot, so the label control is off', () => {
    expect(scenario('new-mail').description).toBe('New mail, before there is a number to show, so the badge is only a dot. The same dot is on Music and on Rooms in the navigation bar.');
    const state = stateFor('new-mail');
    expect(state.variant).toBe('small');
    expect(state.hasLabel).toBe(false);
    const config = components.badge.config(state);
    expect(config.variant).toBe('small');
    expect(config.color).toBe('error');
    expect(config.position).toBe('top-right');
    expect(config.visible).toBe(true);
  });
});
