import { describe, expect, test } from 'bun:test';
import { applyScheme, createScheme, tonalSpot, vibrant, expressive, fidelity, content, neutral, monochrome } from 'material/theme';
import { createSchemeByName } from 'material/theme/variants';
import { LAB_DEFAULT, LAB_ROLES, LAB_VARIANTS, contrastGrade, labCss, labJavaScript, labSeed, type LabState } from '../src/shared/colour-lab';
import { contrastRatio } from '../src/shared/color';
import { handleRequest } from '../server';
import { searchSite } from '../src/server/search';

const factories = { tonalSpot, vibrant, expressive, fidelity, content, neutral, monochrome };
const tokensFor = (scheme: ReturnType<typeof createScheme>) => {
  const tokens: Record<string, string> = {};
  applyScheme(scheme, { style: { setProperty: (name: string, value: string) => { tokens[name.replace('--mtrl-sys-color-', '')] = value; } } } as unknown as Element);
  return tokens;
};

describe('Colour Lab', () => {
  test('has its own discoverable Styles route and page-specific assets', async () => {
    const response = await handleRequest(new Request('http://localhost/styles/color-lab/'));
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('<h1>Colour Lab</h1>');
    expect(html).toMatch(/href="\/styles\/color-lab\/" aria-current="page"/);
    expect(html).toMatch(/\/dist\/colour-lab\.[a-f0-9]{10}\.js/);
    expect(html).toMatch(/\/dist\/css\/colour-lab\.[a-f0-9]{10}\.css/);
    expect(html).not.toContain('material/styles/base.css');
    expect(html).not.toContain('id="styles-export"');
    expect(html).not.toContain('/dist/theme-app.');
    expect(html.match(/data-role-copy=/g)).toHaveLength(40);
    expect(html.match(/data-seed=/g)).toHaveLength(6);
    expect(html.match(/data-sample=/g)).toHaveLength(3);
    expect(await (await handleRequest(new Request('http://localhost/sitemap.xml'))).text()).toContain('https://md3.io/styles/color-lab/');
    expect(searchSite('sourceColorFromImage').some(item => item.url === '/styles/color-lab/')).toBe(true);
    const overview = await (await handleRequest(new Request('http://localhost/styles/'))).text();
    expect(overview).toContain('Open Colour Lab');
  });
  test('validates complete hex input, leaving unfinished input unusable', () => {
    expect(labSeed(' #006A6A ')).toBe('#006a6a');
    expect(labSeed('6750a4')).toBe('#6750a4');
    for (const invalid of ['', '#123', '#12345g', '#1234567', 'red', '#00<000']) expect(labSeed(invalid)).toBeNull();
  });
  test('the inspector and CSS export contain every role the public API actually writes', () => {
    const tokens = tokensFor(createSchemeByName(LAB_DEFAULT.seed));
    expect(LAB_ROLES).toHaveLength(40);
    expect(new Set(LAB_ROLES).size).toBe(40);
    expect([...Object.keys(tokens)].sort()).toEqual([...LAB_ROLES].sort());
    const css = labCss(tokens);
    expect(css).toStartWith(':root {');
    expect(css.match(/--mtrl-sys-color-/g)).toHaveLength(40);
    for (const role of LAB_ROLES) expect(css).toContain('--mtrl-sys-color-' + role + ': ' + tokens[role]);
  });
  test('three-line JavaScript exports use the corresponding tree-shakeable factory and current options', () => {
    for (const [variant, , factory] of LAB_VARIANTS) {
      const state: LabState = { seed: '#006a6a', variant, mode: 'dark', contrast: -0.35 };
      const js = labJavaScript(state);
      expect(js.split('\n')).toHaveLength(3);
      expect(js).toContain('variant: ' + factory + ', mode: "dark", contrast: -0.35');
      expect(js).toContain('applyScheme(scheme);');
      expect(tokensFor(createScheme(state.seed, { variant: factories[factory], mode: state.mode, contrast: state.contrast }))).toEqual(tokensFor(createSchemeByName(state.seed, state)));
    }
  });
  test('grades normal text without rounding a failing ratio up to a threshold', () => {
    expect(contrastGrade(4.499)).toBe('Below AA');
    expect(contrastGrade(4.5)).toBe('AA');
    expect(contrastGrade(6.999)).toBe('AA');
    expect(contrastGrade(7)).toBe('AAA');
    for (const [variant] of LAB_VARIANTS) for (const mode of ['light', 'dark'] as const) {
      const tokens = tokensFor(createSchemeByName('#6750a4', { variant, mode, contrast: 1 }));
      for (const role of ['error', 'success', 'warning', 'info']) expect(contrastRatio(tokens[role]!, tokens['on-' + role]!)!).toBeGreaterThanOrEqual(7);
    }
  });
});
