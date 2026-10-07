// Icons in the playground's code: each Material Symbol is imported from its SVG file
// (`import editIcon from './icons/edit.svg?raw'`), once however often it is used, under
// a line crediting Google; an SVG that is not one of ours stays a named constant.
import { symbolFile } from './icons';

/** The credit and the one bundler note every import of an icon carries. */
export const ICON_CREDIT = 'Material Symbols by Google, fonts.google.com/icons';

const camel = (name: string): string => name.replace(/[-_]([a-z])/g, (_, c: string) => c.toUpperCase());

export interface IconNamer {
  /** The constant for this SVG; `fallback` names it when it is not a known symbol. */
  name: (svg: string, fallback: string) => string;
  /** The icon imports under the credit, as `import` lines; empty without symbols. */
  imports: (indent?: string) => string;
  /** Constants for SVGs that are not symbols; empty without them. */
  declarations: (indent?: string) => string;
}

export const isMarkup = (value: unknown): value is string => typeof value === 'string' && value.trimStart().startsWith('<svg');

export function createIconNamer(): IconNamer {
  const bySvg = new Map<string, string>();
  const imported = new Map<string, string>();
  const constants = new Map<string, string>();
  const used = new Set<string>();
  const unique = (base: string): string => {
    // The suffix is appended, not hyphenated: a hyphen before a digit survives
    // `camel` and is not a valid identifier (`contentIcon-2`).
    const stem = camel(`${base}-icon`);
    let name = stem;
    for (let n = 2; used.has(name); n++) name = `${stem}${n}`;
    used.add(name);
    return name;
  };
  return {
    name(svg, fallback) {
      const known = bySvg.get(svg);
      if (known) return known;
      const file = symbolFile(svg);
      const name = unique(file ?? fallback);
      if (file) imported.set(name, file); else constants.set(name, svg);
      bySvg.set(svg, name);
      return name;
    },
    imports(indent = '') {
      if (!imported.size) return '';
      return `${indent}// ${ICON_CREDIT}\n` +
        [...imported].map(([name, file]) => `${indent}import ${name} from './icons/${file}.svg?raw';\n`).join('');
    },
    declarations(indent = '') {
      return [...constants].map(([name, svg]) => `${indent}const ${name} = ${JSON.stringify(svg)};\n`).join('');
    },
  };
}

/**
 * Names the icons of generated vanilla code: every `key: "<svg…>"` becomes
 * `key: editIcon`, declared after the theme lines (or the imports). `extra` are
 * SVGs a generated handler names itself (`visibilityOffIcon`), which the code
 * cannot show as literals: they are imported like the rest.
 */
export function nameIcons(code: string, extra: readonly string[] = []): string {
  const icons = createIconNamer();
  for (const svg of extra) icons.name(svg, 'icon');
  let named = code.replace(/^(\s*)(\w+): ("<svg(?:[^"\\]|\\.)*")/gm, (_, indent: string, key: string, literal: string) =>
    `${indent}${key}: ${icons.name(JSON.parse(literal) as string, key)}`);
  const imports = icons.imports();
  const declarations = icons.declarations();
  if (!imports && !declarations) return code;
  if (declarations) {
    const anchor = /^document\.documentElement\.dataset\.themeMode = .*\n\n/m.exec(named) ?? /\n\n/.exec(named);
    const at = anchor ? anchor.index + anchor[0].length : 0;
    named = `${named.slice(0, at)}${declarations}\n${named.slice(at)}`;
  }
  if (imports) {
    // After the last top-level import line.
    const lines = named.split('\n');
    let last = -1;
    lines.forEach((line, i) => { if (line.startsWith('import ')) last = i; });
    lines.splice(last + 1, 0, '', imports.replace(/\n$/, ''));
    named = lines.join('\n');
  }
  return named;
}
