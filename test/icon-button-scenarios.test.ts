import { describe, expect, test } from 'bun:test';
import { components, componentCode, initialComponentState, normalizeComponentState } from '../src/shared/components';
import { symbols } from '../src/shared/icons';

const scenario = (id: string) => {
  const found = components['icon-button'].scenarios.find(item => item.id === id);
  if (!found) throw new Error(`missing icon button scenario ${id}`);
  return found;
};
const stateFor = (id: string) => normalizeComponentState('icon-button', { ...initialComponentState('icon-button'), ...scenario(id).options });

describe('icon button follow-ups', () => {
  test('favorite is a toggle, unselected until chosen, and filled once selected', () => {
    const item = scenario('favorite');
    expect(item.description).toBe('A heart for marking a restaurant a favorite: outlined until someone chooses it, and filled once they have.');
    const state = stateFor('favorite');
    const config = components['icon-button'].config(state);
    expect(config.toggle).toBe(true);
    expect(config.selected).toBe(false);
    expect(config.icon).toBe(symbols.heart);
    expect(config.selectedIcon).toBe(symbols.heartFill);
    expect(config.size).toBe('s');
    const chosen = components['icon-button'].config({ ...state, selected: true });
    expect(chosen.selected).toBe(true);
    expect(chosen.selectedIcon).toBe(symbols.heartFill);
    const code = componentCode('icon-button', state);
    expect(code).toContain('toggle: true');
    expect(code).toContain('favoriteFillIcon');
    expect(code).toContain("from './icons/favorite-fill.svg?raw'");
  });
  test('the other four stay the size their figures draw, and only the timer stop is large', () => {
    expect(components['icon-button'].config(stateFor('reservation-date')).size).toBe('s');
    expect(components['icon-button'].config(stateFor('browse-albums')).size).toBe('s');
    expect(components['icon-button'].config(stateFor('raise-hand')).size).toBe('s');
    const stop = components['icon-button'].config(stateFor('stop-timer'));
    expect(stop.size).toBe('l');
    expect(stop.toggle).toBe(false);
    expect(stop.selectedIcon).toBeUndefined();
  });
  test('the default page does not become a toggle', () => {
    const code = componentCode('icon-button', initialComponentState('icon-button'));
    expect(code).toContain('toggle: false');
    expect(code).not.toContain('favorite-fill');
    expect(code).not.toContain('selectedIcon');
  });
});
