// Icons in the playground's code: each SVG becomes one constant named after its
// Material Symbol (`editIcon`), declared once however often it is used, under a
// comment naming the source, instead of a path inlined in every attribute.
import { symbolName } from './icons';

const camel = (name: string): string => name.replace(/[-_]([a-z])/g, (_, c: string) => c.toUpperCase());

export interface IconNamer {
  /** The constant for this SVG; `fallback` names it when it is not a known symbol. */
  name: (svg: string, fallback: string) => string;
  /** The declarations, one per icon, under the source comment; empty without icons. */
  declarations: (indent?: string) => string;
}

export const isMarkup = (value: unknown): value is string => typeof value === 'string' && value.trimStart().startsWith('<svg');

export function createIconNamer(): IconNamer {
  const bySvg = new Map<string, string>();
  const used = new Set<string>();
  const symbolsUsed: string[] = [];
  return {
    name(svg, fallback) {
      const known = bySvg.get(svg);
      if (known) return known;
      const symbol = symbolName(svg);
      if (symbol) symbolsUsed.push(symbol);
      let name = camel(`${symbol ?? fallback}-icon`);
      for (let n = 2; used.has(name); n++) name = camel(`${symbol ?? fallback}-icon-${n}`);
      used.add(name);
      bySvg.set(svg, name);
      return name;
    },
    declarations(indent = '') {
      if (!bySvg.size) return '';
      const source = symbolsUsed.length
        ? `${indent}// Material Symbols Rounded (fonts.google.com/icons): ${symbolsUsed.join(', ')}.\n` : '';
      return source + [...bySvg].map(([svg, name]) => `${indent}const ${name} = ${JSON.stringify(svg)};\n`).join('');
    },
  };
}

/**
 * Names the icons of generated vanilla code: every `key: "<svg…>"` becomes
 * `key: editIcon`, declared after the theme lines (or the imports).
 */
export function nameIcons(code: string): string {
  const icons = createIconNamer();
  const named = code.replace(/^(\s*)(\w+): ("<svg(?:[^"\\]|\\.)*")/gm, (_, indent: string, key: string, literal: string) =>
    `${indent}${key}: ${icons.name(JSON.parse(literal) as string, key)}`);
  const declarations = icons.declarations();
  if (!declarations) return code;
  const anchor = /^document\.documentElement\.dataset\.themeMode = .*\n\n/m.exec(named) ?? /\n\n/.exec(named);
  if (!anchor) return `${declarations}\n${named}`;
  const at = anchor.index + anchor[0].length;
  return `${named.slice(0, at)}${declarations}\n${named.slice(at)}`;
}
