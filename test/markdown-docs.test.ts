// The documentation as Markdown for AI tools (FLO-1564): /llms.txt, /llms-full.txt and the
// .md twins of the guides and of a component's Develop and Accessibility tabs.
import { describe, expect, test } from 'bun:test';
import { handleRequest } from '../server';

const get = async (path: string) => {
  const response = await handleRequest(new Request(`http://localhost${path}`));
  return { status: response.status, type: response.headers.get('content-type') ?? '', robots: response.headers.get('x-robots-tag'), body: await response.text() };
};

describe('Markdown for AI tools', () => {
  test('/llms.txt maps the library, and every link it gives answers 200 with Markdown', async () => {
    const llms = await get('/llms.txt');
    expect([llms.status, llms.type, llms.robots]).toEqual([200, 'text/plain; charset=utf-8', null]);
    expect(llms.body).toStartWith('# md3.io: material, Material 3 Expressive components for the web\n\n> ');
    for (const heading of ['## Get started', '## Build', '## How it works', '## Components', '## Optional']) expect(llms.body).toContain(heading);
    const links = [...llms.body.matchAll(/https:\/\/md3\.io(\/[^)\s]+\.(?:md|txt))/g)].map(match => match[1]!);
    expect(links.length).toBeGreaterThan(40);
    for (const link of new Set(links)) {
      const page = await get(link);
      expect([link, page.status]).toEqual([link, 200]);
    }
  }, 30_000);
  test('a guide and a component tab have their Markdown twin, examples as code, facts filled in', async () => {
    const guide = await get('/docs/theming.md');
    expect([guide.status, guide.type]).toEqual([200, 'text/markdown; charset=utf-8']);
    expect(guide.body).toStartWith('# Theming');
    const develop = await get('/components/slider/develop.md');
    expect(develop.body).toStartWith('# Slider');
    expect(develop.body).not.toContain('```example');
    expect(develop.body).toContain("```js\nimport { createSlider } from 'material';");
    expect(develop.body).not.toMatch(/^## Accessibility/m);
    const accessibility = await get('/components/slider/accessibility.md');
    expect(accessibility.body).toStartWith('# Slider: accessibility');
    expect(accessibility.body).toContain('role="slider"');
    expect((await get('/llms-full.txt')).body).not.toContain('{{material.');
  });
  test('an HTML page points to its Markdown twin', async () => {
    expect((await get('/components/slider/develop/')).body).toContain('<link rel="alternate" type="text/markdown" href="/components/slider/develop.md" />');
    expect((await get('/docs/theming/')).body).toContain('<link rel="alternate" type="text/markdown" href="/docs/theming.md" />');
  });
});
