// The theme shown, as a file: CSS or JSON, from mtrl's menu on the download
// button. The files are written by the Styles section's exporter (theme-state.ts) from
// mtrl's own schemeToTokens, so they are mtrl's theme shape.
import createMenu from 'material/components/menu';
import { schemeToTokens } from 'material/core/theme';
import { colorThemeCss, colorThemeJson, downloadName, type ColorThemeFile } from '../../../shared/theme-state';
import type { App } from '../core/foundation';
import type { ThemeData } from './withThemeSource';
import { CONTRASTS, VARIANTS } from './withVariant';

const FORMATS = { css: colorThemeCss, json: colorThemeJson } as const;
type Format = keyof typeof FORMATS;
/** The download menu's items, from the formats: CSS, JSON. */
export const FORMAT_ITEMS: { id: Format; text: string }[] = (Object.keys(FORMATS) as Format[]).map(id => ({ id, text: id.toUpperCase() }));

/** The Theme name field's supporting row: why the typed name is refused, or the blank
    the row is held open for (styles/theme-app.css reserves its height: a whitespace-only
    helper draws no line box). One body-small line: "Built-in name: taken" fits the
    200 px field with room to spare. */
export const nameSupportingText = (raw: unknown): string => downloadName(raw) === null ? 'Built-in name: taken' : ' ';

/** What a theme was generated from, for the file's header: its name no longer says. */
const generatedFrom = ({ seed, variant, contrast, secondary }: NonNullable<ThemeData['spec']>) => [
  `seed ${seed}`, VARIANTS.find(([name]) => name === variant)?.[1] ?? variant,
  ...(secondary ? [`secondary ${secondary}`] : []), `${CONTRASTS.find(([value]) => value === contrast)?.[1] ?? contrast} contrast`,
].join(', ');

/** The file for a theme shown: `mtrl-theme-<name>.<format>`, the name in its selector and name field. */
export const themeFile = (format: Format, theme: ThemeData, roles: string[], rawName?: unknown): { name: string; text: string } => {
  const name = downloadName(rawName) ?? 'custom';
  const byRole = (colors: string[]) => Object.fromEntries(roles.map((role, i) => [role, colors[i]!]));
  const data: ColorThemeFile = {
    name, origin: theme.spec ?? undefined, tokens: schemeToTokens({ light: byRole(theme.light), dark: byRole(theme.dark) }),
    note: theme.spec ? `generated from ${generatedFrom(theme.spec)}` : 'colours as mtrl ships them, set by hand',
  };
  return { name: `mtrl-theme-${name}.${format}`, text: FORMATS[format](data) };
};

export const withDownload = () => (app: App) => {
  const { ui, roles, copy } = app;
  /** The file for the theme shown, under the name typed for the download (empty → custom). */
  const file = (format: Format): { name: string; text: string } => themeFile(format, app.variant.shown(), roles as string[], app.state.get('name'));
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
