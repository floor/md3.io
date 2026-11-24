// The Button playground pilot: /components/button/ renders its configuration
// panel as material's own elements, server-rendered with declarative shadow
// DOM, on every component page.
import { describe, expect, test } from 'bun:test';
import { handleRequest } from '../server';
import { bundleCss } from '../src/server/css';
import { components, componentSlugs } from '../src/shared/components';

const get = (path: string) => handleRequest(new Request(`http://localhost${path}`));

describe('the material playground panel', () => {
  test('the Button page renders the panel as material elements', async () => {
    const html = await (await get('/components/button/')).text();
    expect(html).toContain('playground--material');
    // Every element ships its shadow root and its styles in the markup, so the
    // panel is styled before any script runs.
    expect(html).toContain('shadowrootmode');
    expect(html).toContain('data-mtrl-ssr');
    // Preview / Code in the heading; the theme and mode come from the site
    // header (one appearance for the whole site), the heading keeps the form's copy.
    expect(html).toMatch(/<m-tabs[^>]*aria-label="Playground view"/);
    expect(html).not.toContain('id="preview-theme"');
    expect(html).toContain('<input type="hidden" name="theme" value="baseline" form="configuration" data-appearance="theme">');
    expect(html).toContain('<input type="hidden" name="mode" value="light" form="configuration" data-appearance="mode">');
    // The header's Themes control is material's own: the icon button rendered on the
    // server, the menu's items inert until the first click loads the menu.
    expect(html).toMatch(/<m-icon-button [^>]*id="theme-picker"/);
    expect(html).toContain('<m-menu-item value="ocean">Ocean</m-menu-item>');
    expect(html).toMatch(/<template id="theme-menu-template"/);
    // Every row is the site's own: label on the left, control on the right,
    // the element named for the input inside it (an outside label alone does
    // not reach it), the elements at compact density, the groups at xs.
    expect(html).toContain('<label class="control-label" for="scenario">Scenario</label>');
    expect(html).toContain('<label class="control-label" for="control-variant">Variant</label>');
    expect(html).toContain('<label class="control-label" for="button-text">Text</label>');
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
    // No heading row and no Reset: the panel opens on the scenario row, whose
    // Default is the way back; the form keeps its heading for assistive technology.
    expect(html).not.toMatch(/type="reset"/);
    expect(html).toContain('<h2 class="sr-only">Configuration</h2>');
    // Nor a description line under the scenario select.
    expect(html).not.toContain('id="scenario-description"');
    // mtrl's baseline tokens are scoped to the panel under the site's own mode
    // rule (tokens.css): dark by default, light once [data-theme-mode=light] is set.
    // Both at specificity 0 (:where) so the site's chosen theme on the scope wins,
    // the dark default first and the light roles after it.
    // They ship in the page's stylesheet bundle (cached), not inline in the HTML.
    expect(html).not.toMatch(/<style>[^<]*\.playground--material/);
    const sheet = bundleCss('material-panel');
    const dark = sheet.indexOf(':where(.playground--material,.site-material){color-scheme:dark');
    const light = sheet.indexOf(':where(:root[data-theme-mode=light] .playground--material, :root[data-theme-mode=light] .site-material){color-scheme:light');
    expect(dark).toBeGreaterThan(-1);
    expect(light).toBeGreaterThan(dark);
    // Every theme's sheets are named in a compact map; the chosen theme's main sheet
    // is written into the head for the panel's first paint, and no contrast.css.
    expect(html).toMatch(/<script type="application\/json" id="theme-sheets">\{"baseline":\["[a-f0-9]{10}","[a-f0-9]{10}"\]/);
    expect(html).not.toContain('id="contrast-sheet"');
    // The glue module loads, and only this page maps it.
    expect(html).toContain('"/dist/playground-material.js":');
    expect(html).toMatch(/<script type="module" src="\/dist\/playground-material\.[a-f0-9]+\.js"><\/script>/);
  });

  test('every component page renders the material panel, native rows only where no element is used yet', async () => {
    for (const slug of componentSlugs) {
      const html = await (await get(`/components/${slug}/`)).text();
      expect(html, slug).toContain('playground--material');
      expect(html, slug).toContain('id="configuration"');
      expect(html, slug).toContain('"/dist/playground-material.js":');
      // Switches, selects, groups and text fields are elements on every page; a
      // native checkbox, or a radio outside an icon row past five, would mean a
      // kind slipped past the material panel.
      expect(html, slug).not.toMatch(/<input type="(?:checkbox|radio)" name=/);
      // Every control kind renders as one of material's elements.
      for (const control of components[slug].controls) {
        const pastFive = control.kind === 'icons' && (control.options?.length ?? 0) > 5;
        // A range is material's slider, beside the numeric read-out.
        if (control.kind === 'range') {
          expect(html, `${slug}.${control.key}`).toMatch(new RegExp(`<m-slider [^>]*name="${control.key}"`));
          expect(html, `${slug}.${control.key}`).toContain(`data-value-for="${control.key}"`);
        }
        // A date or time is material's text field whose trailing icon opens material's
        // date picker or time picker (data-picker names which).
        if (control.kind === 'date' || control.kind === 'time') expect(html, `${slug}.${control.key}`).toMatch(new RegExp(`<m-text-field [^>]*name="${control.key}"[^>]*data-picker="${control.kind}"|<m-text-field [^>]*data-picker="${control.kind}"[^>]*name="${control.key}"`));
        // An icon row up to five options is a connected group; past five, a select
        // whose options carry their icon.
        if (control.kind === 'icons') expect(html.includes(`data-group-for="${control.key}"`), `${slug}.${control.key}`).toBe(!pastFive);
        if (pastFive) expect(html, `${slug}.${control.key}`).toMatch(new RegExp(`<m-select [^>]*name="${control.key}"[\\s\\S]*?<m-select-option value="${control.options![1]}" icon="`));
      }
    }
  });
});
