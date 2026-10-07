import { describe, expect, test } from 'bun:test';
import { handleRequest } from '../server';
import { components, componentCode, initialComponentState, normalizeComponentState } from '../src/shared/components';
import { controlConcealed } from '../src/shared/content/types';

const page = (path: string) => handleRequest(new Request(`http://localhost${path}`)).then(response => response.text());

/** The opening tag of the configuration row that holds this control. */
function rowOpen(html: string, name: string): string {
  const at = html.indexOf(`name="${name}"`);
  if (at < 0) throw new Error(`missing control ${name}`);
  const open = Math.max(html.lastIndexOf('<label class="ui-row', at), html.lastIndexOf('<div class="ui-row control-row"', at));
  if (open < 0) throw new Error(`missing row for ${name}`);
  return html.slice(open, html.indexOf('>', open) + 1);
}

const control = (slug: keyof typeof components, key: string) => {
  const found = components[slug].controls.find(item => item.key === key);
  if (!found) throw new Error(`missing ${slug}.${key}`);
  return found;
};

describe('a control a named set replaces', () => {
  test('hides under the named set and returns, with its value, under the default', () => {
    const lines = control('list', 'lines');
    const named = normalizeComponentState('list', { ...initialComponentState('list'), listSet: 'inbox-threads' });
    expect(named.listContentDefault).toBe(false);
    expect(controlConcealed(lines, named)).toBe(true);
    expect(named.lines).toBe('2');
    const back = initialComponentState('list');
    expect(controlConcealed(lines, back)).toBe(false);
    expect(back.lines).toBe('2');
  });

  test('leaves an exception control greyed, showing the value the stage reads', () => {
    const slide = control('carousel', 'initialSlide');
    expect(slide.replaced).toBeUndefined();
    expect(slide.enabledWhen).toBe('slidesDefault');
    const featured = normalizeComponentState('carousel', { ...initialComponentState('carousel'), carouselSet: 'featured-collection' });
    expect(featured.slidesDefault).toBe(false);
    // The existing disable path greys it; the new path does not hide it.
    expect(featured[slide.enabledWhen!] !== true).toBe(true);
    expect(controlConcealed(slide, featured)).toBe(false);
    expect(featured.initialSlide).toBe('0');
    expect((components.carousel.config(featured) as { initialSlide: number }).initialSlide).toBe(0);

    const actions = control('top-app-bar', 'actions');
    expect(actions.replaced).toBeUndefined();
    const trail = normalizeComponentState('top-app-bar', { ...initialComponentState('top-app-bar'), context: 'trail-guide', actions: '1' });
    expect(trail.contextDefault).toBe(false);
    expect(trail[actions.enabledWhen!] !== true).toBe(true);
    expect(controlConcealed(actions, trail)).toBe(false);
    expect(trail.actions).toBe('1');
  });

  test('leaves a dependent control greyed', () => {
    const end = control('slider', 'secondValue');
    expect(end.replaced).toBeUndefined();
    expect(end.enabledWhen).toBe('range');
    const volume = normalizeComponentState('slider', { ...initialComponentState('slider'), variant: 'standard' });
    expect(volume.range).toBe(false);
    expect(volume[end.enabledWhen!] !== true).toBe(true);
    expect(controlConcealed(end, volume)).toBe(false);
    expect(volume.secondValue).toBe('80');

  });

  test('overline stays shown and greyed on a two-line default, hides under a named list, and returns greyed with its value', () => {
    const overline = control('list', 'overline');
    expect(overline.replaced).toBe('listContentDefault');
    expect(overline.enabledWhen).toBe('threeLines');
    const twoLines = initialComponentState('list');
    expect(twoLines.lines).toBe('2');
    expect(twoLines.listContentDefault).toBe(true);
    expect(twoLines.threeLines).toBe(false);
    expect(controlConcealed(overline, twoLines)).toBe(false);
    expect(twoLines[overline.enabledWhen!] !== true).toBe(true);
    expect(twoLines.overline).toBe(false);

    const named = normalizeComponentState('list', { ...initialComponentState('list'), listSet: 'inbox-threads' });
    expect(named.listContentDefault).toBe(false);
    expect(controlConcealed(overline, named)).toBe(true);
    expect(named.overline).toBe(false);

    const back = initialComponentState('list');
    expect(controlConcealed(overline, back)).toBe(false);
    expect(back[overline.enabledWhen!] !== true).toBe(true);
    expect(back.overline).toBe(false);
  });

  test('a positional toggle stays shown and greyed on the default, hides under a named list, and returns greyed with its value', () => {
    const fourth = control('list', 'fourth');
    expect(fourth.replaced).toBe('listContentDefault');
    expect(fourth.enabledWhen).toBe('extraSelectable');
    const home = initialComponentState('list');
    expect(home.count).toBe('3');
    expect(home.listContentDefault).toBe(true);
    expect(home.extraSelectable).toBe(false);
    expect(controlConcealed(fourth, home)).toBe(false);
    expect(home[fourth.enabledWhen!] !== true).toBe(true);
    expect(home.fourth).toBe(false);

    const named = normalizeComponentState('list', { ...initialComponentState('list'), listSet: 'inbox-threads' });
    expect(controlConcealed(fourth, named)).toBe(true);
    expect(named.fourth).toBe(false);

    const back = initialComponentState('list');
    expect(controlConcealed(fourth, back)).toBe(false);
    expect(back[fourth.enabledWhen!] !== true).toBe(true);
    expect(back.fourth).toBe(false);
  });

  test('the chips avatar hides under a named set and stays greyed on the default', () => {
    const avatar = control('chips', 'avatar');
    expect(avatar.replaced).toBe('chipSetDefault');
    expect(avatar.enabledWhen).toBe('inputType');
    const home = initialComponentState('chips');
    expect(home.chipSetDefault).toBe(true);
    expect(home.inputType).toBe(false);
    expect(controlConcealed(avatar, home)).toBe(false);
    expect(home[avatar.enabledWhen!] !== true).toBe(true);
    expect(home.avatar).toBe(false);
    const named = normalizeComponentState('chips', { ...initialComponentState('chips'), chipSet: 'email-recipients', type: 'input' });
    expect(named.chipSetDefault).toBe(false);
    expect(controlConcealed(avatar, named)).toBe(true);
    expect(named.avatar).toBe(false);
  });

  test('a default page keeps its controls and only marks the rows a named set can replace', async () => {
    const list = await page('/components/list/');
    for (const key of ['lines', 'leading', 'trailing', 'dividers', 'subheader', 'count', 'ariaLabel', 'disableLast', 'supportingText', 'overline', 'first', 'fourth', 'fifth']) {
      const open = rowOpen(list, key);
      expect(open).toContain(' data-replaced="listContentDefault">');
      expect(open).not.toContain('hidden');
    }
    for (const key of ['variant', 'selection']) {
      expect(rowOpen(list, key)).not.toContain('data-replaced');
    }
    expect(list).toContain('name="lines" value="2" data-enabled-when="listContentDefault" checked');
    expect(list).toContain('name="count" value="3" data-enabled-when="listContentDefault" checked');
    expect(list).toContain('id="list-ariaLabel" name="ariaLabel" value="Ideas for today"');
    expect(list).toContain('>Text lines<');
    expect(list).toContain('>Item count<');
    expect(list).toContain('>Vanilla<');
    expect(list).toContain('>Web Components<');
    expect(list).toContain('>React<');
    expect(list).toContain('>Vue<');
    expect(list).toContain('>Svelte<');
    expect(list).toContain('>SolidJS<');
    expect(componentCode('list', initialComponentState('list'))).toContain('Ideas for today');
    expect(componentCode('list', initialComponentState('list'))).not.toContain('replaced');

    const carousel = await page('/components/carousel/');
    expect(rowOpen(carousel, 'captions')).toContain(' data-replaced="slidesDefault">');
    expect(rowOpen(carousel, 'initialSlide')).not.toContain('data-replaced');
    expect(carousel).toContain('name="initialSlide" data-enabled-when="slidesDefault"');
    expect(carousel).toContain('value="0" selected');

    const slider = await page('/components/slider/');
    expect(rowOpen(slider, 'secondValue')).not.toContain('data-replaced');
    expect(slider).toContain('name="secondValue" value="80"');
    expect(slider).toContain('data-enabled-when="range"');

    const checkbox = await page('/components/checkbox/');
    expect(rowOpen(checkbox, 'value')).not.toContain('data-replaced');
    expect(checkbox).toContain('name="value" value="on"');

    const chips = await page('/components/chips/');
    expect(rowOpen(chips, 'avatar')).toContain(' data-replaced="chipSetDefault">');
    expect(rowOpen(chips, 'icons')).not.toContain('data-replaced');
  });
});
