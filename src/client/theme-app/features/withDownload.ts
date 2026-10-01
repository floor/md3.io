// The theme shown, as a file: CSS, SCSS or JSON, from mtrl's menu on the download
// button. The files are written by the Styles section's exporter (theme-state.ts) from
// mtrl's own schemeToTokens, so they are mtrl's theme shape.
import createMenu from 'mtrl/components/menu';
import { schemeToTokens } from 'mtrl/core/theme';
import { colorThemeCss, colorThemeJson, colorThemeScss, type ColorThemeFile } from '../../../shared/theme-state';
import type { App } from '../core/foundation';

const FORMATS = { css: colorThemeCss, scss: colorThemeScss, json: colorThemeJson } as const;
type Format = keyof typeof FORMATS;

export const withDownload = () => (app: App) => {
  const { ui, source, roles, copy } = app;
  /** The file for the theme shown. */
  const file = (format: Format): { name: string; text: string } => {
    const theme = source.current();
    const byRole = (colors: string[]) => Object.fromEntries((roles as string[]).map((role, i) => [role, colors[i]!]));
    const name = theme.seed ? `seed-${theme.seed.slice(1)}` : theme.name;
    const origin = theme.spec ?? undefined;
    const data: ColorThemeFile = {
      name, origin, tokens: schemeToTokens({ light: byRole(theme.light), dark: byRole(theme.dark) }),
      note: theme.spec ? `generated from ${theme.origin}` : 'colours as mtrl ships them, set by hand',
    };
    return { name: `mtrl-theme-${name}.${format}`, text: FORMATS[format](data) };
  };
  const save = (format: Format) => {
    const { name, text } = file(format);
    const url = URL.createObjectURL(new Blob([text], { type: format === 'json' ? 'application/json' : 'text/plain' }));
    Object.assign(document.createElement('a'), { href: url, download: name }).click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    copy.tell(`Downloading ${name}`);
  };
  const menu = createMenu({
    opener: ui.download.element,
    items: [{ id: 'css', text: 'CSS' }, { id: 'scss', text: 'SCSS' }, { id: 'json', text: 'JSON' }],
    position: 'bottom-end',
  });
  menu.on('select', event => save(event.itemId as Format));
  app.teardown.add(() => menu.destroy());
  return { ...app, download: { file, save, menu } };
};
