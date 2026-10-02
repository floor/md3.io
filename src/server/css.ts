// One minified stylesheet per page type. The lists are the <link> order in
// shells/base.eta: a page gets exactly the files it used to request, in that order.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dir, '../..');
const style = (name: string) => resolve(root, 'styles', `${name}.css`);
const shell = ['tokens', 'shell', 'ui', 'content', 'syntax'] as const;

export const stylesheetBundles = {
  // homepage.css sits between syntax.css and site.css, as the home page's links did.
  home: [...shell, 'homepage', 'site', 'search'],
  // Docs, a component playground, and every other page: the shell, without the homepage.
  page: [...shell, 'site', 'search'],
  // The components overview adds Roboto, the elements' pre-upgrade rules, then the catalog.
  catalog: [...shell, 'site', 'search', 'roboto', 'preupgrade', 'catalog'],
  // Examples add the device chooser: mtrl's button group and icon button, then its sheet.
  examples: [...shell, 'site', 'search', 'examples', 'mtrl:button', 'mtrl:icon-button', 'mtrl:button-group', 'device-frame'],
  // Styles pages add Roboto, then their own sheet.
  styles: [...shell, 'site', 'search', 'roboto', 'styles-pages'],
  // The Themes app: the Styles sheet, mtrl's type and shape tokens and ripple, the mtrl
  // components it is built from, then its own sheet.
  themes: [...shell, 'site', 'search', 'roboto', 'styles-pages', 'mtrl-tokens', 'mtrl:text-field', 'mtrl:menu', 'mtrl:select', 'mtrl:top-app-bar', 'mtrl:button', 'mtrl:icon-button', 'mtrl:button-group', 'mtrl:snackbar', 'mtrl:tooltip', 'theme-app'],
} as const;

export type StylesheetBundle = keyof typeof stylesheetBundles;

/**
 * mtrl's system tokens other than colour (type scale, shape), its ripple, and its
 * button and list resets, from base.css: without base.css itself, whose page resets and
 * body styles are for an mtrl app, not a page of this site. The resets stay in mtrl's
 * base layer, scoped to the Themes app and the popups it puts on <body>. Colour comes
 * from the theme the app shows.
 */
export function mtrlTokens(css = readFileSync(resolve(root, 'node_modules/material/dist/styles/base.css'), 'utf8')): string {
  const start = css.indexOf(':root{--mtrl-ref-typeface');
  const ripple = css.indexOf('.mtrl-ripple{');
  const rippleEnd = css.indexOf('}}', css.indexOf('@keyframes mtrl-ripple-expand')) + 2;
  const resets = [...css.matchAll(/(?<=[}])(button|ul,ol)(\{[^}]*\})/g)].map(([, selector, body]) => `:where(.theme-app,.mtrl-menu,.mtrl-snackbar) :is(${selector})${body}`);
  if (start < 0 || ripple < 0 || rippleEnd < 2 || resets.length !== 2) throw new Error('mtrl base.css: tokens, ripple or resets not found');
  return `${css.slice(start, css.indexOf('}', start) + 1)}\n${css.slice(ripple, rippleEnd)}\n@layer mtrl.base{${resets.join('')}}`;
}

const fileFor = (name: string) => name === 'preupgrade'
  ? resolve(root, 'node_modules/material/dist/elements/preupgrade.css')
  : name.startsWith('mtrl:') ? resolve(root, 'node_modules/material/dist/styles', `${name.slice(5)}.css`)
  : style(name);

type Token = { kind: 'raw' | 'string' | 'space' | 'keep'; value: string };

/** Tokens of a stylesheet. Strings stay intact; comments are dropped, except `/*!` licenses. */
function tokenize(css: string): Token[] {
  const tokens: Token[] = [];
  let raw = '';
  const flush = () => { if (raw) { tokens.push({ kind: 'raw', value: raw }); raw = ''; } };
  for (let i = 0; i < css.length;) {
    const c = css[i]!;
    if (c === '/' && css[i + 1] === '*') {
      flush();
      const end = css.indexOf('*/', i + 2);
      const comment = end < 0 ? css.slice(i) : css.slice(i, end + 2);
      if (comment.startsWith('/*!')) tokens.push({ kind: 'keep', value: comment });
      i = end < 0 ? css.length : end + 2;
      continue;
    }
    if (c === '"' || c === "'") {
      flush();
      let j = i + 1;
      while (j < css.length) {
        if (css[j] === '\\') { j += 2; continue; }
        if (css[j] === c) { j++; break; }
        j++;
      }
      tokens.push({ kind: 'string', value: css.slice(i, j) });
      i = j;
      continue;
    }
    if (c === ' ' || c === '\n' || c === '\r' || c === '\t' || c === '\f') {
      flush();
      if (tokens.at(-1)?.kind !== 'space') tokens.push({ kind: 'space', value: ' ' });
      i++;
      continue;
    }
    raw += c;
    i++;
  }
  flush();
  return tokens;
}

// A space is optional beside punctuation, and required where two tokens would
// otherwise merge (.a .b, 0 0) or where +/− would change meaning (calc).
// Space after ] stays: `[open] .dialog` is a descendant, `[open].dialog` is not.
const dropSpaceBefore = new Set('{;,)>]}'.split(''));
const dropSpaceAfter = new Set('{;,:([>}'.split(''));

function significant(tokens: Token[], index: number, direction: -1 | 1): Token | undefined {
  for (let i = index + direction; i >= 0 && i < tokens.length; i += direction) {
    const token = tokens[i]!;
    if (token.kind !== 'space') return token;
  }
  return undefined;
}

const edge = (token: Token | undefined, side: 'start' | 'end') => {
  if (!token || token.kind === 'keep') return '';
  return side === 'start' ? token.value[0] ?? '' : token.value.at(-1) ?? '';
};

function keepSpace(left: Token | undefined, right: Token | undefined): boolean {
  const a = edge(left, 'end');
  const b = edge(right, 'start');
  if (!a || !b) return false;
  // A space before : is a descendant combinator (`.item :is(button)`, `{ :hover`)
  // or the optional gap in `prop : value`. Dropping it changes the selector.
  if (b === ':') return true;
  if (dropSpaceAfter.has(a) || dropSpaceBefore.has(b)) return false;
  if (b === '!' || b === '{') return false;
  return true;
}

/** Minify CSS. Strings, including data URLs, are copied unchanged. */
export function minifyCss(css: string): string {
  const tokens = tokenize(css);
  let out = '';
  const emit = (value: string) => {
    if (value.startsWith('}') && out.endsWith(';')) out = out.slice(0, -1);
    out += value.replace(/;+(?=})/g, '');
  };
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;
    if (token.kind === 'space') {
      if (keepSpace(significant(tokens, i, -1), significant(tokens, i, 1))) out += ' ';
      continue;
    }
    if (token.kind === 'keep') {
      if (out && !out.endsWith(' ')) out += ' ';
      out += token.value;
      continue;
    }
    if (token.kind === 'string') { out += token.value; continue; }
    emit(token.value);
  }
  return out.trim();
}

export function bundleCss(name: StylesheetBundle): string {
  const css = stylesheetBundles[name].map(file => file === 'mtrl-tokens' ? mtrlTokens() : readFileSync(fileFor(file), 'utf8')).join('\n');
  return minifyCss(css);
}
