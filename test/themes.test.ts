// The Themes page's viewer, server side: every built-in theme with its roles from
// mtrl's CSS, the seed read from generate-themes.ts's SCSS header, and the page.
import { describe, expect, test } from 'bun:test';
import { handleRequest } from '../server';
import { builtInThemes, originOf } from '../src/server/themes';
import { themeTokens } from '../src/server/tokens';
import { themes } from '../src/shared/button';
import { THEME_ROLES } from '../src/shared/theme-engine';

describe('Themes page', () => {
  test('every built-in theme, every role, as mtrl\'s CSS declares it', () => {
    expect(builtInThemes.map(theme => theme.name)).toEqual([...themes]);
    for (const theme of builtInThemes) for (const mode of ['light', 'dark'] as const) for (const role of THEME_ROLES) {
      expect(theme.roles[mode][role]).toMatch(/^#[0-9a-f]{6}$/);
      expect(theme.roles[mode][role]).toBe(themeTokens[theme.name]![mode][role]!.value);
    }
  });
  test('seeds come from the generated SCSS; hand-kept themes have none', () => {
    expect(originOf('seed #9a7a3e, variant Tonal Spot, secondary #4a87c4')).toEqual({ source: '#9a7a3e', variant: 'tonal-spot', contrast: 0, core: { secondary: '#4a87c4' } });
    expect(originOf('seed #6750A4, variant Tonal Spot, contrastLevel 1.0')).toEqual({ source: '#6750a4', variant: 'tonal-spot', contrast: 1 });
    const byName = Object.fromEntries(builtInThemes.map(theme => [theme.name, theme]));
    for (const name of ['baseline', 'vibrant', 'desert', 'highcontrast']) expect(byName[name]!.palettes?.primary.length).toBe(18);
    for (const name of ['ocean', 'forest', 'spring', 'sunset', 'autumn']) {
      expect(byName[name]!.origin).toBeUndefined();
      // Their variants are generated from their light primary, as are their palettes.
      expect(byName[name]!.handSeed).toBe(byName[name]!.roles.light.primary);
      expect(byName[name]!.palettes.primary.length).toBe(18);
    }
  });
  test('the page mounts the app with every theme\'s data and the linked one selected', async () => {
    const html = await (await handleRequest(new Request('http://localhost/styles/themes/?theme=summer'))).text();
    const summer = builtInThemes.find(theme => theme.name === 'summer')!;
    const data = JSON.parse(/<script type="application\/json" id="themes-data">([^<]*)<\/script>/.exec(html)![1]!);
    expect(data.selected).toBe('summer');
    expect(data.roles).toEqual([...THEME_ROLES]);
    expect(data.themes.map((theme: { name: string }) => theme.name)).toEqual([...themes]);
    expect(data.themes.find((theme: { name: string }) => theme.name === 'summer').light[THEME_ROLES.indexOf('primary')]).toBe(summer.roles.light.primary);
    expect(html).toContain('<div class="theme-app" id="theme-app"');
    expect(html).toMatch(/src="\/dist\/theme-app\.[a-f0-9]{10}\.js"/);
    expect(html).not.toContain('src="/dist/styles.js');
    expect(html).toContain('id="theme-base"');
    const unknown = await (await handleRequest(new Request('http://localhost/styles/themes/?theme=nope'))).text();
    expect(unknown).toContain('"selected":"baseline"');
  });
});
