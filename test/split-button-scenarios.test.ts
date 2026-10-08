import { describe, expect, test } from 'bun:test';
import { components, componentCode, initialComponentState, normalizeComponentState } from '../src/shared/components';
import { symbols } from '../src/shared/icons';

const scenario = (id: string) => {
  const found = components['split-button'].scenarios.find(item => item.id === id);
  if (!found) throw new Error(`missing split button scenario ${id}`);
  return found;
};
const stateFor = (id: string) => normalizeComponentState('split-button', { ...initialComponentState('split-button'), ...scenario(id).options });
const configFor = (id: string) => components['split-button'].config(stateFor(id));

describe('split button follow-ups', () => {
  test('the default page stays a small filled Save, with the save menu and no icon', () => {
    const config = components['split-button'].config(initialComponentState('split-button'));
    expect(config.variant).toBe('filled');
    expect(config.size).toBe('s');
    expect(config.text).toBe('Save');
    expect(config.icon).toBeUndefined();
    expect(config.trailingLabel).toBe('More save options');
    expect(config.items?.map(item => 'text' in item ? item.text : item.type)).toEqual(['Save as…', 'Save a copy', 'Download']);
    const code = componentCode('split-button', initialComponentState('split-button'));
    expect(code).not.toContain('addIcon');
    expect(code).not.toContain('enamel');
  });

  test('playback stays the smaller tonal speed control, and slideshow stays the filled start', () => {
    const speed = configFor('playback-speed');
    expect(speed.variant).toBe('tonal');
    expect(speed.size).toBe('s');
    expect(speed.text).toBe('1.5x');
    expect(speed.icon).toBeUndefined();
    expect(scenario('playback-speed').description).toBe('Someone watching a video sets playback to 1.5x, or opens the menu for a slower or faster speed.');
    const show = configFor('slideshow');
    expect(show.variant).toBe('filled');
    expect(show.size).toBe('s');
    expect(show.text).toBe('Slideshow');
    expect(show.icon).toBe(symbols.playCircle);
    expect(scenario('slideshow').description).toBe('Someone presenting starts the slideshow, or opens the menu for presenter view and where to begin.');
  });

  test('enamel mugs is the large purchase, with the plus and the colors the product line names', () => {
    const item = scenario('enamel-mugs');
    expect(item.name).toBe('Enamel mugs');
    expect(item.description).toBe('Someone buying an enamel mug on a small screen uses the large button for the $7.49 purchase, and the menu offers the colors the product line names.');
    const config = configFor('enamel-mugs');
    expect(config.variant).toBe('filled');
    expect(config.size).toBe('l');
    expect(config.text).toBe('$7.49');
    expect(config.icon).toBe(symbols.add);
    expect(config.trailingLabel).toBe('Choose a color');
    expect(config.items?.map(entry => 'text' in entry ? entry.text : '')).toEqual(['Navy', 'Black', 'White', 'Forest', 'Cherry']);
    const code = componentCode('split-button', stateFor('enamel-mugs'));
    expect(code).toContain('addIcon');
    expect(code).toContain("from './icons/add.svg?raw'");
    expect(code).toContain('$7.49');
    expect(code).toContain("size: 'l'");
  });
});
