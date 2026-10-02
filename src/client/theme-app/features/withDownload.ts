// The theme shown, as a file: CSS or JSON, from mtrl's menu on the download
// button. The files are written by the Styles section's exporter (theme-state.ts) from
// mtrl's own schemeToTokens, so they are mtrl's theme shape.
import createMenu from 'mtrl/components/menu';
import { schemeToTokens } from 'mtrl/core/theme';
import { colorThemeCss, colorThemeJson, type ColorThemeFile } from '../../../shared/theme-state';
import type { App } from '../core/foundation';

const FORMATS = { css: colorThemeCss, json: colorThemeJson } as const;
type Format = keyof typeof FORMATS;
/** The download menu's items, from the formats: CSS, JSON. */
export const FORMAT_ITEMS: { id: Format; text: string }[] = (Object.keys(FORMATS) as Format[]).map(id => ({ id, text: id.toUpperCase() }));

export const withDownload = () => (app: App) => {
  const { ui, roles, copy } = app;
  /** The file for the theme shown. */
  const file = (format: Format): { name: string; text: string } => {
    const theme = app.variant.shown();
    const params = app.variant.params();
    const byRole = (colors: string[]) => Object.fromEntries((roles as string[]).map((role, i) => [role, colors[i]!]));
    // The theme's name, or its seed, then any variant and contrast not its own.
    const name = [theme.seed ? `seed-${theme.seed.slice(1)}` : theme.name, params.get('variant'), params.get('contrast')].filter(Boolean).join('-');
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
    items: FORMAT_ITEMS,
    position: 'bottom-end',
  });
  menu.on('select', event => save(event.itemId as Format));
  app.teardown.add(() => menu.destroy());
  return { ...app, download: { file, save, menu } };
};
