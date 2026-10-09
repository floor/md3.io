import { describe, expect, test } from 'bun:test';
import { components, initialComponentState } from '../src/shared/components';

describe('button group default', () => {
  test('the default page is a multi-select with Bold and Italic selected', () => {
    const config = components['button-group'].config(initialComponentState('button-group'));
    expect(config.kind).toBe('connected');
    expect(config.selection).toBe('multi');
    expect(config.buttons).toEqual([
      { value: 'bold', ariaLabel: 'Bold', text: 'Bold', selected: true },
      { value: 'italic', ariaLabel: 'Italic', text: 'Italic', selected: true },
      { value: 'underline', ariaLabel: 'Underline', text: 'Underline' },
    ]);
  });
});
