import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Marked, type Tokens } from 'marked';
import hljs from 'highlight.js';
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
/** The guides, before the components: how to start, how mtrl is built, and one page per way of using it. */
export const GUIDES = ['getting-started', 'architecture', 'vanilla', 'web-components', 'react', 'vue', 'svelte', 'solid', 'theming', 'server-rendering'];
const names: Record<string, string> = { 'getting-started': 'Getting started', 'web-components': 'Web Components', solid: 'SolidJS', 'server-rendering': 'Server rendering', fab: 'FAB', 'extended-fab': 'Extended FAB', textfield: 'Text field', datepicker: 'Date picker', timepicker: 'Time picker', radios: 'Radio buttons', 'top-app-bar': 'Top app bar', 'bottom-app-bar': 'Bottom app bar' };
export const isGuide = (slug: string) => GUIDES.includes(slug);
/** A document's URL: a guide at /docs/<slug>/, a component under /docs/components/. */
export const docHref = (slug: string) => isGuide(slug) ? `/docs/${slug}/` : `/docs/components/${slug}/`;
export const componentName = (slug: string) => names[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1).replaceAll('-', ' ');
const slugs = new Set(readdirSync(docsDir).filter(name => name.endsWith('.md') && !name.startsWith('_')).map(name => name.slice(0, -3)));
export const docSlugs = [...slugs];
/** The package managers of an `install` block, in switch order, with their add commands. */
export const PACKAGE_MANAGERS = [
  { id: 'bun', command: 'bun add' },
  { id: 'npm', command: 'npm install' },
  { id: 'pnpm', command: 'pnpm add' },
  { id: 'yarn', command: 'yarn add' },
] as const;

/**
 * An `install` fence (its text is the packages) as one command per package manager, with a
 * switch between them. The reader's choice is on :root[data-package-manager] before paint
 * (base.eta), and site.ts remembers it; bun without it.
 */
function renderInstall(packages: string): string {
  const options = PACKAGE_MANAGERS.map(({ id }) =>
    `<button type="button" class="doc-install__option" data-package-manager="${id}" aria-pressed="${id === 'bun'}">${id}</button>`).join('');
  const commands = PACKAGE_MANAGERS.map(({ id, command }) =>
    `<pre class="doc-install__command" data-package-manager="${id}"><code class="hljs language-bash">${hljs.highlight(`${command} ${packages}`, { language: 'bash' }).value}</code></pre>`).join('');
  return `<div class="doc-install"><div class="doc-install__bar"><div class="doc-install__switch" role="group" aria-label="Package manager">${options}</div>` +
    `<button type="button" class="doc-install__copy">Copy</button></div>${commands}</div>\n`;
}

/** A fence's language as highlight.js names it; nothing for a fence without one. */
const LANGUAGES: Record<string, string> = { ts: 'typescript', js: 'javascript', html: 'xml', sh: 'bash', shell: 'bash', svelte: 'xml', vue: 'xml' };
function codeLanguage(lang = ''): string {
  const name = lang.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
  const language = LANGUAGES[name] ?? name;
  return language && hljs.getLanguage(language) ? language : '';
}
/**
 * A page's summary: the first sentence of its opening paragraph, which the page
 * template makes "what the component is", as plain text.
 */
function docSummary(slug: string): string {
  const source = readFileSync(resolve(docsDir, `${slug}.md`), 'utf8').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
  const paragraph = source.split(/\r?\n\s*\r?\n/).map(block => block.trim()).find(block => block && !/^(#|```|<|\||>|-|\*|\d+\.)/.test(block)) ?? '';
  const text = paragraph.replace(/\s+/g, ' ').replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[`*_]/g, '');
  return (/^.*?[.!?](?=\s|$)/.exec(text)?.[0] ?? text).trim();
}
const entry = (slug: string) => ({ slug, name: componentName(slug), href: docHref(slug), summary: docSummary(slug) });
/** The guides that exist yet, in their order. */
export const guideGroup = { label: 'Guides', items: GUIDES.filter(slug => slugs.has(slug)).map(entry) };
export const docGroups = Object.entries(groups).map(([label, items]) => ({ label, items: items.filter(slug => slugs.has(slug)).map(entry) }));
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
/** A page's front matter (created, updated, status), as vlist.io's docs carry it. */
export function documentMeta(slug: string): Record<string, string> {
  const head = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(readFileSync(resolve(docsDir, `${slug}.md`), 'utf8'))?.[1] ?? '';
  return Object.fromEntries(head.split(/\r?\n/).map(line => /^([a-z]+):\s*(.*)$/.exec(line.trim())).filter(Boolean).map(match => [match![1]!, match![2]!.trim()]));
}
const STATUS: Record<string, string> = { draft: 'Draft', review: 'In review', published: 'Published' };
const formatDate = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
/** The status badge and the date under a page's title. */
function metaHtml(meta: Record<string, string>): string {
  const parts: string[] = [];
  if (meta.status) parts.push(`<span class="meta__badge meta__badge--${STATUS[meta.status] ? meta.status : 'draft'}">${escapeHTML(STATUS[meta.status] ?? meta.status)}</span>`);
  const date = meta.updated ?? meta.created;
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) parts.push(`<span class="meta__item">${meta.updated ? 'Updated' : 'Created'} <time datetime="${date}">${formatDate(date)}</time></span>`);
  return parts.length ? `<div class="meta">${parts.join('')}</div>` : '';
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
      if (token.lang === 'example') {
        examples = true;
        return renderExample(token.text);
      }
      if (token.lang === 'install') return renderInstall(token.text.trim());
      // Every other block highlighted like the examples: the fence's first word is the
      // language (after it come docs:check's flags, such as `fragment`).
      const language = codeLanguage(token.lang);
      const body = language ? hljs.highlight(token.text, { language }).value : escapeHTML(token.text);
      return `<pre><code class="hljs${language ? ` language-${language}` : ''}">${body}</code></pre>\n`;
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
        href = `${docHref(target)}${local[2] ?? ''}`;
      }
      if (/^\s*(javascript|data|vbscript):/i.test(href)) return this.parser.parseInline(token.tokens);
      return `<a href="${escapeHTML(href)}"${token.title ? ` title="${escapeHTML(token.title)}"` : ''}>${this.parser.parseInline(token.tokens)}</a>`;
    },
  } });
  const html = parser.parse(source) as string;
  // The metadata sits under the title
  const withMeta = html.replace(/(<\/h1>\n?)/, `$1${metaHtml(documentMeta(slug))}`);
  return { html: withMeta, toc, title: componentName(slug), summary: docSummary(slug), frameworkSwitch: examples ? frameworkSwitch() : '' };
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
