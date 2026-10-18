// The Button playground pilot: /components/button/ renders its configuration
// panel as material's own elements, server-rendered with declarative shadow
// DOM, and every other component page keeps the native panel it had.
import { describe, expect, test } from 'bun:test';
import { handleRequest } from '../server';
import { componentSlugs } from '../src/shared/components';

const get = (path: string) => handleRequest(new Request(`http://localhost${path}`));

describe('the material playground panel', () => {
  test('the Button page renders the panel as material elements', async () => {
    const html = await (await get('/components/button/')).text();
    expect(html).toContain('playground--material');
    // Every element ships its shadow root and its styles in the markup, so the
    // panel is styled before any script runs.
    expect(html).toContain('shadowrootmode');
    expect(html).toContain('data-mtrl-ssr');
    // Live preview / View code, and the appearance controls in the heading.
    expect(html).toMatch(/<m-tabs[^>]*aria-label="Playground view"/);
    expect(html).toMatch(/<m-select[^>]*name="theme"[^>]*id="preview-theme"/);
    // Every row is the site's own: label on the left, control on the right,
    // the element named for the input inside it (an outside label alone does
    // not reach it), the elements at compact density, the groups at xs.
    expect(html).toContain('<label class="control-label" for="scenario">Scenario</label>');
    expect(html).toContain('<label class="control-label" for="control-variant">Variant</label>');
    expect(html).toContain('<label class="control-label" for="button-text">Text</label>');
    expect(html).toContain('<label for="preview-theme">Theme</label>');
    expect(html).toMatch(/<m-select[^>]*aria-label="Variant"/);
    expect(html).toMatch(/<m-text-field[^>]*aria-label="Text"/);
    expect(html).toMatch(/<m-select[^>]*density="compact"/);
    expect(html).toMatch(/<m-text-field[^>]*density="compact"/);
    expect(html).toMatch(/<m-button-group[^>]*size="xs"/);
    // The toggles keep their control names, so the form model is unchanged.
    for (const key of ['square', 'toggle', 'selected', 'disabled']) expect(html).toMatch(new RegExp(`<m-switch[^>]*name="${key}"`));
    // The switch's label is slotted into it as the site's own .control-label:
    // the only name material's switch takes, in the same look as the other rows.
    expect(html).toMatch(new RegExp(`<m-switch[^>]*name="square"[^>]*>[\\s\\S]*?<span class="control-label">Square shape</span>[\\s\\S]*?</m-switch>`));
    expect(html).not.toContain('<label class="control-label" for="square"');
    // The text field keeps the native panel's 80-character cap.
    expect(html).toMatch(/<m-text-field[^>]*(maxlength="80"[^>]*id="button-text"|id="button-text"[^>]*maxlength="80")/);
    // The scenario select and the outlined selects keep their ids and names.
    expect(html).toMatch(/<m-select[^>]*id="scenario"/);
    expect(html).toMatch(/<m-select[^>]*name="variant"/);
    // The groups are not form-associated: a hidden input carries each name.
    expect(html).toContain('<input type="hidden" name="size" value="s" data-input-for="size">');
    expect(html).toMatch(/<input type="hidden" name="icon" value="none" data-input-for="icon">/);
    expect(html).toMatch(/<input type="hidden" name="mode" value="light" data-input-for="mode" form="configuration">/);
    // Reset is material's own text button, still a form reset.
    expect(html).toMatch(/<m-button[^>]*type="reset"/);
    // mtrl's baseline tokens are scoped to the panel, light and dark, the way
    // the catalog cards get theirs.
    expect(html).toMatch(/<style>[^<]*\.playground--material/);
    expect(html).toContain(':root[data-theme-mode=dark] .playground--material');
    // The glue module loads, and only this page maps it.
    expect(html).toContain('"/dist/playground-material.js":');
    expect(html).toMatch(/<script type="module" src="\/dist\/playground-material\.[a-f0-9]+\.js"><\/script>/);
  });

  test('every other component page keeps the native panel', async () => {
    for (const slug of componentSlugs.filter(slug => slug !== 'button')) {
      const html = await (await get(`/components/${slug}/`)).text();
      expect(html).not.toContain('playground--material');
      expect(html).not.toContain('data-mtrl-ssr');
      expect(html).not.toContain('<m-switch');
      expect(html).not.toContain('playground-material');
      expect(html).toContain('id="configuration"');
    }
  });
});
