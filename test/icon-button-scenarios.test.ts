import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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
  test('the other four stay the size their figures draw: the hand is medium, the stop is extra large', () => {
    expect(scenario('raise-hand').description).toBe('A tonal raised hand for asking to speak, sized with the call\'s main controls.');
    expect(scenario('stop-timer').description).toBe('A filled stop for ending a timer, the one large action on that screen.');
    expect(components['icon-button'].config(stateFor('reservation-date')).size).toBe('s');
    expect(components['icon-button'].config(stateFor('browse-albums')).size).toBe('s');
    expect(components['icon-button'].config(stateFor('raise-hand')).size).toBe('m');
    const stop = components['icon-button'].config(stateFor('stop-timer'));
    expect(stop.size).toBe('xl');
    expect(stop.toggle).toBe(false);
    expect(stop.selectedIcon).toBeUndefined();
  });
  test('the default page does not become a toggle', () => {
    const code = componentCode('icon-button', initialComponentState('icon-button'));
    expect(code).toContain('toggle: false');
    expect(code).not.toContain('favorite-fill');
    expect(code).not.toContain('selectedIcon');
  });
  test('the ten-icon chooser wraps and keeps each glyph at least 32px wide', () => {
    const css = readFileSync(resolve(import.meta.dir, '../styles/site.css'), 'utf8');
    expect(css).toContain('.choice-group--icons { flex-wrap: wrap; }');
    expect(css).toContain('.choice-group--icons .choice { flex: 1 0 32px; min-width: 32px; }');
  });
});
