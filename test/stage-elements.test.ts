import { describe, expect, test } from 'bun:test';
import { handleRequest } from '../server';
import { elementMeta } from '../src/server/elements-meta';
import { components, elementConfig, initialComponentState, normalizeComponentState } from '../src/shared/components';
import { plannedElement } from '../src/shared/frameworks';

const get = (path: string) => handleRequest(new Request(`http://localhost${path}`));
const meta = elementMeta('slider');
if (!meta) throw new Error('slider has no element');
const sliderMeta = meta;

const attributes = (state: ReturnType<typeof initialComponentState>) =>
  Object.fromEntries(plannedElement(sliderMeta, elementConfig('slider', state)).attributes);

describe('slider stage elements', () => {
  test('the default element is the HTML tab’s slider, and the page stays a factory without the switch', async () => {
    const attrs = attributes(initialComponentState('slider'));
    expect(plannedElement(sliderMeta, elementConfig('slider', initialComponentState('slider'))).tag).toBe('m-slider');
    expect(attrs.value).toBe('40');
    expect(attrs.label).toBe('Volume');
    expect(attrs.min).toBe('0');
    expect(attrs.max).toBe('100');
    expect(attrs['show-value']).toBe('');
    expect(attrs.orientation).toBeUndefined();
    const plain = await (await get('/components/slider/')).text();
    expect(plain).toContain('src="/preview/slider/"');
    expect(plain).not.toContain('stage=elements');
    const switched = await (await get('/components/slider/?stage=elements')).text();
    expect(switched).toContain('src="/preview/slider/?stage=elements"');
  });

  test('a centred slider is shifted, a range writes both ends, and a vertical one names its orientation', () => {
    const centered = attributes(normalizeComponentState('slider', { ...initialComponentState('slider'), variant: 'centered', value: '40' }));
    expect(centered.value).toBe('-10');
    expect(centered.centered).toBe('');
    expect(centered.min).toBe('-50');
    const range = attributes(normalizeComponentState('slider', { ...initialComponentState('slider'), variant: 'range', value: '20', secondValue: '80' }));
    expect(range.value).toBe('20');
    expect(range['second-value']).toBe('80');
    expect(range.range).toBe('');
    const vertical = attributes(normalizeComponentState('slider', { ...initialComponentState('slider'), orientation: 'vertical' }));
    expect(vertical.orientation).toBe('vertical');
  });

  test('call volume carries the inset icons the figure uses', () => {
    const scenario = components.slider.scenarios.find(item => item.id === 'call-volume');
    if (!scenario) throw new Error('missing call-volume');
    const state = normalizeComponentState('slider', { ...initialComponentState('slider'), ...scenario.options });
    const attrs = attributes(state);
    expect(attrs.size).toBe('M');
    expect(attrs.label).toBe('Call volume');
    expect(attrs['inset-icon']).toContain('<svg');
    expect(attrs['inset-icon-at-min']).toContain('<svg');
  });

  test('the preview’s first HTML includes the slider element only behind the switch', async () => {
    const plain = await (await get('/preview/slider/')).text();
    expect(plain).toContain('<main id="stage" aria-label="Component preview"></main>');
    const switched = await (await get('/preview/slider/?stage=elements')).text();
    expect(switched).toContain('<m-slider');
    expect(switched).toContain('value="40"');
    expect(switched).toContain('shadowrootmode');
  });
});
