import { describe, expect, test } from 'bun:test';
import { components, initialComponentState, normalizeComponentState } from '../src/shared/components';
import { symbols } from '../src/shared/icons';

const scenario = (id: string) => {
  const found = components.fab.scenarios.find(item => item.id === id);
  if (!found) throw new Error(`missing fab scenario ${id}`);
  return found;
};
const configFor = (id: string) => {
  const state = normalizeComponentState('fab', { ...initialComponentState('fab'), ...scenario(id).options });
  return components.fab.config(state);
};

describe('fab scenarios', () => {
  test('the default page stays the add icon at the default size and primary container', () => {
    const config = components.fab.config(initialComponentState('fab'));
    expect(config.icon).toBe(symbols.add);
    expect(config.size).toBe('default');
    expect(config.variant).toBe('primary-container');
    expect(config.position).toBeUndefined();
    expect(config.ariaLabel).toBe('Create new item');
  });

  test('compose is a medium pencil at the lower right of an inbox', () => {
    const config = configFor('compose');
    expect(config.icon).toBe(symbols.edit);
    expect(config.ariaLabel).toBe('Compose');
    expect(config.size).toBe('medium');
    expect(config.variant).toBe('primary-container');
    expect(config.position).toBe('bottom-right');
    expect(scenario('compose').description).toBe('A medium pencil for starting a message, the size for most windows, at the lower right of an inbox.');
  });

  test('create is a large add button at the upper left of a wide screen', () => {
    const config = configFor('create');
    expect(config.icon).toBe(symbols.add);
    expect(config.ariaLabel).toBe('Create');
    expect(config.size).toBe('large');
    expect(config.variant).toBe('primary-container');
    expect(config.position).toBe('top-left');
    expect(scenario('create').description).toBe('A large add button at the upper left of a wide screen, the size for large windows, where the primary action is one of the first things people see.');
  });

  test('add uses the primary tone so it stays distinct from the surface', () => {
    const config = configFor('add');
    expect(config.icon).toBe(symbols.add);
    expect(config.ariaLabel).toBe('Add');
    expect(config.size).toBe('default');
    expect(config.variant).toBe('primary');
    expect(config.position).toBe('bottom-right');
    expect(scenario('add').description).toBe('An add button in the primary tone at the lower right, so the container stays distinct from the surface behind it.');
  });
});
