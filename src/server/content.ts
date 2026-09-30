import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Marked, type Tokens } from 'marked';
import { renderExample } from './example-block';
import { FRAMEWORKS } from '../shared/frameworks';

export const root = resolve(import.meta.dir, '../..');
export const docsDir = resolve(root, 'docs/components');
const groups: Record<string, string[]> = {
  'Actions': ['button', 'icon-button', 'button-group', 'split-button', 'fab', 'extended-fab'],
  'Selection & input': ['checkbox', 'switch', 'radios', 'chips', 'slider', 'textfield', 'select', 'search', 'datepicker', 'timepicker'],
  'Navigation': ['navigation-rail', 'drawer', 'tabs', 'menu', 'top-app-bar', 'bottom-app-bar', 'navigation'],
  'Containment': ['card', 'list', 'carousel', 'divider', 'dialog', 'bottom-sheet', 'side-sheet'],
  'Communication': ['badge', 'progress', 'loading-indicator', 'snackbar', 'tooltip'],
  'Additional references': ['form', 'colorpicker', 'segmented-button'],
};
const names: Record<string, string> = { fab: 'FAB', 'extended-fab': 'Extended FAB', textfield: 'Text field', datepicker: 'Date picker', timepicker: 'Time picker', radios: 'Radio buttons', 'top-app-bar': 'Top app bar', 'bottom-app-bar': 'Bottom app bar' };
export const componentName = (slug: string) => names[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1).replaceAll('-', ' ');
const slugs = new Set(readdirSync(docsDir).filter(name => name.endsWith('.md') && !name.startsWith('_')).map(name => name.slice(0, -3)));
export const docSlugs = [...slugs];
export const docGroups = Object.entries(groups).map(([label, items]) => ({ label, items: items.filter(slug => slugs.has(slug)).map(slug => ({ slug, name: componentName(slug), href: `/docs/components/${slug}/` })) }));
export function escapeHTML(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}
/** A document's markdown, without its front matter. */
export const documentSource = (slug: string): string =>
  readFileSync(resolve(docsDir, `${slug}.md`), 'utf8').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
/** One document's heading ids, in order: a slug of the title, numbered when it repeats. */
export function headingIds(): (text: string) => { title: string; id: string } {
  const ids = new Map<string, number>();
  return text => {
    const title = text.replace(/[`*_]/g, '');
    const base = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-') || 'section';
    const count = ids.get(base) ?? 0; ids.set(base, count + 1);
    return { title, id: count ? `${base}-${count}` : base };
  };
}
export function renderDocument(slug: string) {
  if (!slugs.has(slug)) return null;
  const source = documentSource(slug);
  const toc: { title: string; id: string }[] = [];
  const headingId = headingIds();
  const parser = new Marked();
  // The page's `example` blocks follow the reader's framework, which a switch at the top
  // of the page picks (document.eta): the same choice as the playgrounds and the Examples.
  let examples = false;
  parser.use({ renderer: {
    code(token: Tokens.Code) {
      if (token.lang !== 'example') return false;
      examples = true;
      return renderExample(token.text);
    },
    heading(this: { parser: { parseInline: (tokens: Tokens.Generic[]) => string } }, token: Tokens.Heading) {
      const { title, id } = headingId(token.text);
      if (token.depth === 2) toc.push({ title, id });
      return `<h${token.depth} id="${id}">${this.parser.parseInline(token.tokens)}</h${token.depth}>\n`;
    },
    link(this: { parser: { parseInline: (tokens: Tokens.Generic[]) => string } }, token: Tokens.Link) {
      let href = token.href;
      const local = /^(?:\.\/)?([a-z0-9-]+)\.md(#[\w-]+)?$/.exec(href);
      if (local) {
        // The old sheet API was replaced by bottom-sheet and side-sheet.
        const target = local[1] === 'sheet' ? 'bottom-sheet' : local[1]!;
        href = `/docs/components/${target}/${local[2] ?? ''}`;
      }
      if (/^\s*(javascript|data|vbscript):/i.test(href)) return this.parser.parseInline(token.tokens);
      return `<a href="${escapeHTML(href)}"${token.title ? ` title="${escapeHTML(token.title)}"` : ''}>${this.parser.parseInline(token.tokens)}</a>`;
    },
  } });
  const html = parser.parse(source) as string;
  return { html, toc, title: componentName(slug), frameworkSwitch: examples ? frameworkSwitch() : '' };
}

/**
 * The framework switch at the top of a documentation page with examples, where the
 * component pages have their framework tabs. Which button is on is CSS, from
 * `:root[data-framework]`, so it is right before any script runs; the script keeps
 * `aria-pressed` in step (src/client/site.ts).
 */
const frameworkSwitch = (): string =>
  `<div class="framework-tabs framework-switch" role="group" aria-label="Framework for the examples">${FRAMEWORKS.map(({ id, label }) =>
    `<button type="button" class="framework-tab framework-switch__option" data-framework="${id}" aria-pressed="${id === 'vanilla'}">${label}</button>`).join('')}</div>\n`;
