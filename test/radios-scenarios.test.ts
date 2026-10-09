import { describe, expect, test } from 'bun:test';
import { components, initialComponentState, normalizeComponentState } from '../src/shared/components';

describe('radios scenarios', () => {
  test('notifications lists Allow notifications and Turn off notifications, vertically', () => {
    const scenario = components.radios.scenarios.find(item => item.id === 'notifications');
    if (!scenario) throw new Error('missing radios scenario notifications');
    expect(scenario.options.direction).toBe('vertical');
    expect(scenario.options.value).toBe('allow');
    const state = normalizeComponentState('radios', { ...initialComponentState('radios'), ...scenario.options });
    const config = components.radios.config(state);
    expect(config.direction).toBe('vertical');
    expect(config.value).toBe('allow');
    expect(config.name).toBe('notifications');
    expect(config.options.map(option => option.label)).toEqual(['Allow notifications', 'Turn off notifications']);
    expect(config.options.map(option => option.value)).toEqual(['allow', 'off']);
  });
});
