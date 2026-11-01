import { describe, expect, test } from 'bun:test';
import { components, initialComponentState, normalizeComponentState } from '../src/shared/components';
import { symbols } from '../src/shared/icons';

const scenario = (id: string) => {
  const found = components['fab-menu'].scenarios.find(item => item.id === id);
  if (!found) throw new Error(`missing fab menu scenario ${id}`);
  return found;
};
const stateFor = (id: string) => normalizeComponentState('fab-menu', { ...initialComponentState('fab-menu'), ...scenario(id).options });

describe('fab menu scenarios', () => {
  test('four jobs, the first three unchanged, and each option is a control the page already has', () => {
    expect(components['fab-menu'].scenarios.map(item => item.id)).toEqual(['new-music', 'photo-categories', 'share', 'add-to-the-trip']);
    expect(scenario('new-music').options).toEqual({ menuSet: 'new-music', color: 'tertiary', open: true });
    expect(scenario('photo-categories').options).toEqual({ menuSet: 'photo-categories', color: 'primary', open: true });
    expect(scenario('share').options).toEqual({ menuSet: 'share', color: 'primary', open: true });
    const keys = new Set(components['fab-menu'].controls.map(control => control.key));
    for (const item of components['fab-menu'].scenarios) {
      expect(item.source).toBe('https://m3.material.io/components/fab-menu/guidelines');
      for (const key of Object.keys(item.options)) expect(keys.has(key)).toBe(true);
    }
  });

  test('add to the trip is the secondary menu on the trailing corner, at the default size', () => {
    expect(scenario('add-to-the-trip').name).toBe('Add to the trip');
    expect(scenario('add-to-the-trip').description).toBe('A trip note offers an album, a photo, or a video. The menu uses the secondary colour, and it sits on the trailing corner.');
    expect(scenario('add-to-the-trip').options.size).toBeUndefined();
    expect(scenario('add-to-the-trip').options.presentation).toBeUndefined();
    expect(scenario('add-to-the-trip').options.itemIcons).toBeUndefined();
    const config = components['fab-menu'].config(stateFor('add-to-the-trip'));
    expect(config.color).toBe('secondary');
    expect(config.placement).toBe('bottom-end');
    expect(config.size).toBe('default');
    expect(config.presentation).toBe('list');
    expect(config.ariaLabel).toBe('Add to the trip');
    expect(config.items.map(item => item.text)).toEqual(['Album', 'Photo', 'Video']);
    expect(config.items.map(item => item.icon)).toEqual([symbols.photoLibrary, symbols.image, symbols.videocam]);
    expect(stateFor('add-to-the-trip').open).toBe(true);
  });
});
