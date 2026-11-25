// A playground's vanilla code as a CodePen pen, for "Open in CodePen": CodePen's prefill
// (a form POST of `data` to https://codepen.io/pen/define, read 2026-11-25) opens the
// editor with the pen filled in. A pen cannot install from npm, so the library comes from
// jsDelivr: its JavaScript as an ES module (`+esm`), its stylesheets as links. Checked on
// 2026-11-25: material 3.16.4's loading indicator renders from these URLs in Chromium.
import { symbols } from './icons';

export const CODEPEN_DEFINE = 'https://codepen.io/pen/define';

/** An icon file the code imports (`./icons/<name>.svg?raw`), as the site's symbol key. */
const ICON_KEYS: Record<string, string> = { favorite: 'heart', format_bold: 'bold', format_italic: 'italic', format_underlined: 'underline' };
const iconSvg = (name: string): string | undefined => {
  const key = ICON_KEYS[name] ?? name.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
  return (symbols as Record<string, string>)[key];
};

export interface PenInput {
  /** The playground's vanilla code, as Copy code gives it. */
  code: string;
  /** The material version the site runs (package.json's pin). */
  version: string;
  title: string;
  description: string;
}

export interface Pen {
  title: string;
  description: string;
  html: string;
  css: string;
  js: string;
  css_external: string;
  editors: string;
  layout: string;
}

/** The pen CodePen's prefill takes. */
export function codepenPen({ code, version, title, description }: PenInput): Pen {
  const cdn = `https://cdn.jsdelivr.net/npm/material@${version}`;
  const stylesheets: string[] = [];
  const js = code
    // Stylesheet imports become links (in order); theme imports too.
    .replace(/^import\s+['"]material\/(styles|themes)\/([a-z0-9-]+)['"];?\n/gm, (_, folder: string, name: string) => {
      stylesheets.push(`${cdn}/dist/${folder}/${name}.css`);
      return '';
    })
    // The library itself, as an ES module.
    .replace(/from\s+['"]material['"]/g, `from '${cdn}/+esm'`)
    // An icon file becomes its SVG, inline.
    .replace(/^import\s+(\w+)\s+from\s+['"]\.\/icons\/([a-z0-9_]+)\.svg\?raw['"];?$/gm, (line, binding: string, name: string) => {
      const svg = iconSvg(name);
      return svg ? `const ${binding} = ${JSON.stringify(svg)};` : line;
    })
    .replace(/^\n+/, '');
  // The theme the code names: on md3.io the site has its sheet, a pen needs the link.
  const theme = /dataset\.theme\s*=\s*['"]([a-z0-9-]+)['"]/.exec(code)?.[1];
  if (theme && !stylesheets.some(sheet => sheet.endsWith(`/themes/${theme}.css`))) stylesheets.push(`${cdn}/dist/themes/${theme}.css`);
  return {
    title,
    description,
    html: '',
    css: 'body {\n  margin: 0;\n  padding: 24px;\n  background: var(--mtrl-sys-color-surface);\n}\n',
    js,
    css_external: stylesheets.join(';'),
    // JavaScript open, HTML and CSS folded; the result beside the code.
    editors: '001',
    layout: 'left',
  };
}
