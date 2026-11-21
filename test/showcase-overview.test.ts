import { describe, expect, test } from 'bun:test';
import { handleRequest } from '../server';
import { examples } from '../examples';
import { exampleComponents, exampleTags, examplesUsingComponent } from '../src/server/examples';

const get = (path: string) => handleRequest(new Request(`http://localhost${path}`));

describe('showcase overview', () => {
  test('every registered example renders as a card with a lazy preview frame', async () => {
    const response = await get('/showcase/');
    expect(response.status).toBe(200);
    const html = await response.text();
    for (const example of examples) {
      expect(html).toContain(`href="/showcase/${example.slug}/"`);
      expect(html).toContain(example.title);
      expect(html).toContain(`data-src="/showcase/${example.slug}/frame/html/"`);
      expect(html).toContain(`data-tags="${(example.tags ?? []).join(' ')}"`);
    }
    expect(html).toContain('data-filter-group="component"');
    expect(html).toContain('data-filter-group="tag"');
  });

  test('filter values come from the examples meta', () => {
    for (const example of examples) {
      for (const component of example.components) expect(exampleComponents).toContain(component);
      for (const tag of example.tags ?? []) expect(exampleTags).toContain(tag);
    }
    expect(exampleTags).toContain('Apps');
  });

  test('component pages link the examples that use them, and those links resolve', async () => {
    expect(examplesUsingComponent('card').map(example => example.slug).sort()).toEqual(['booking', 'notes']);
    expect(examplesUsingComponent('button').map(example => example.slug).sort()).toEqual(['booking', 'notes', 'settings']);
    expect(examplesUsingComponent('tabs').map(example => example.slug)).toEqual(['settings']);
    const card = await (await get('/components/card/')).text();
    expect(card).toContain('Used in:');
    expect(card).toContain('href="/showcase/booking/"');
    expect(card).toContain('href="/showcase/notes/"');
    for (const example of examples) {
      expect((await get(`/showcase/${example.slug}/`)).status).toBe(200);
    }
  });
});
