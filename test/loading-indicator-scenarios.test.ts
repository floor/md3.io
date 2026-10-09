import { describe, expect, test } from 'bun:test';
import { components, initialComponentState, normalizeComponentState } from '../src/shared/components';

const scenario = (id: string) => {
  const found = components['loading-indicator'].scenarios.find(item => item.id === id);
  if (!found) throw new Error(`missing loading indicator scenario ${id}`);
  return found;
};
const stateFor = (id: string) => normalizeComponentState('loading-indicator', { ...initialComponentState('loading-indicator'), ...scenario(id).options });

describe('loading indicator scenarios', () => {
  test('three jobs, and each option is a control the page already has', () => {
    expect(components['loading-indicator'].scenarios.map(item => item.name)).toEqual([
      'Getting ready', 'Loading photos', 'Loading the page',
    ]);
    const keys = new Set(components['loading-indicator'].controls.map(control => control.key));
    for (const item of components['loading-indicator'].scenarios) {
      expect(item.source).toBe('https://m3.material.io/components/loading-indicator/guidelines');
      for (const key of Object.keys(item.options)) expect(keys.has(key)).toBe(true);
    }
  });

  test('getting ready is the contained indicator, at the default size', () => {
    expect(scenario('getting-ready').description).toBe('The device is still getting ready, so the indicator sits in a circle where it has to stand out. This page draws that indicator by itself.');
    expect(scenario('getting-ready').options.size).toBeUndefined();
    expect(scenario('getting-ready').options.indeterminate).toBeUndefined();
    expect(scenario('getting-ready').options.value).toBeUndefined();
    const config = components['loading-indicator'].config(stateFor('getting-ready'));
    expect(config.contained).toBe(true);
    expect(config.ariaLabel).toBe('Getting your device ready');
    expect(config.size).toBe(48);
    expect(config.value).toBeNull();
  });

  test('loading photos leaves the bare indicator at the page default', () => {
    expect(scenario('loading-photos').description).toBe('Photos are still on the way, and the indicator waits on the open surface. This page draws that indicator by itself.');
    expect(scenario('loading-photos').options.contained).toBeUndefined();
    expect(scenario('loading-photos').options.size).toBeUndefined();
    expect(scenario('loading-photos').options.indeterminate).toBeUndefined();
    const config = components['loading-indicator'].config(stateFor('loading-photos'));
    expect(config.contained).toBe(false);
    expect(config.ariaLabel).toBe('Loading photos');
    expect(config.size).toBe(48);
    expect(config.value).toBeNull();
  });

  test('loading the page is the small indicator, and the container stays off', () => {
    expect(scenario('loading-the-page').description).toBe('A page is loading in a tight spot, so the indicator stays small. This page draws that indicator by itself.');
    expect(scenario('loading-the-page').options.contained).toBeUndefined();
    expect(scenario('loading-the-page').options.indeterminate).toBeUndefined();
    const config = components['loading-indicator'].config(stateFor('loading-the-page'));
    expect(config.contained).toBe(false);
    expect(config.size).toBe(24);
    expect(config.ariaLabel).toBe('Loading page');
    expect(config.value).toBeNull();
  });
});
