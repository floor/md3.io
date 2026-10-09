import { describe, expect, test } from 'bun:test';
import { components, initialComponentState, normalizeComponentState } from '../src/shared/components';
import { symbols } from '../src/shared/icons';

const scenario = (id: string) => {
  const found = components['extended-fab'].scenarios.find(item => item.id === id);
  if (!found) throw new Error(`missing extended fab scenario ${id}`);
  return found;
};
const stateFor = (id: string) => normalizeComponentState('extended-fab', { ...initialComponentState('extended-fab'), ...scenario(id).options });

describe('extended fab scenarios', () => {
  test('seven jobs, the first six unchanged, and each option is a control the page already has', () => {
    expect(components['extended-fab'].scenarios.map(item => item.id)).toEqual([
      'compose', 'check-out', 'publish', 'new-task', 'find-flights', 'save-draft', 'add-to-basket',
    ]);
    expect(scenario('compose').options).toEqual({ text: 'Compose', icon: 'edit', variant: 'tertiary-container' });
    expect(scenario('check-out').options).toEqual({ text: 'Check out', icon: 'shoppingCart', variant: 'tertiary-container', position: 'center' });
    expect(scenario('publish').options).toEqual({ text: 'Publish', icon: 'arrowUpward' });
    expect(scenario('new-task').options).toEqual({ text: 'New task', icon: 'add' });
    expect(scenario('find-flights').options).toEqual({ text: 'Find flights', icon: 'flight', variant: 'primary', position: 'center' });
    expect(scenario('save-draft').options).toEqual({ text: 'Save draft', icon: 'none' });
    const keys = new Set(components['extended-fab'].controls.map(control => control.key));
    for (const item of components['extended-fab'].scenarios) {
      expect(item.source).toBe('https://m3.material.io/components/extended-fab/guidelines');
      for (const key of Object.keys(item.options)) expect(keys.has(key)).toBe(true);
    }
  });

  test('add to basket is the dark primary pill on the trailing corner, at the small size', () => {
    expect(scenario('add-to-basket').name).toBe('Add to basket');
    expect(scenario('add-to-basket').description).toBe('A record is ready to buy. Add to basket sits on the trailing corner, in the darker primary colour, with a cart.');
    expect(scenario('add-to-basket').options.size).toBeUndefined();
    expect(scenario('add-to-basket').options.width).toBeUndefined();
    expect(scenario('add-to-basket').options.iconPosition).toBeUndefined();
    const config = components['extended-fab'].config(stateFor('add-to-basket'));
    expect(config.text).toBe('Add to basket');
    expect(config.icon).toBe(symbols.shoppingCart);
    expect(config.variant).toBe('primary');
    expect(config.position).toBe('bottom-right');
    expect(config.size).toBe('small');
    expect(config.width).toBe('fixed');
    expect(config.iconPosition).toBe('start');
    expect(components['extended-fab'].config(stateFor('check-out')).position).toBeUndefined();
  });
});
