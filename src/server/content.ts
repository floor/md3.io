import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Marked, type Tokens } from 'marked';
import hljs from 'highlight.js';
import { renderExample } from './example-block';
import { FRAMEWORKS } from '../shared/frameworks';
import { addons, addonsPublic, isAddon } from '../shared/addons';
import { isHiddenPath } from '../shared/visibility';

export const root = resolve(import.meta.dir, '../..');
export const docsDir = resolve(root, 'docs/components');
export const addonDocsDir = resolve(root, 'docs/addons');
const groups: Record<string, string[]> = {
  'Actions': ['button', 'icon-button', 'button-group', 'split-button', 'fab', 'extended-fab', 'fab-menu'],
  'Selection & input': ['checkbox', 'switch', 'radios', 'chips', 'slider', 'text-field', 'select', 'search', 'datepicker', 'timepicker'],
  'Navigation': ['navigation-rail', 'navigation-bar', 'navigation-drawer', 'tabs', 'menu', 'app-bar', 'toolbar', 'navigation'],
  'Containment': ['card', 'list', 'carousel', 'divider', 'dialog', 'bottom-sheet', 'side-sheet'],
  'Communication': ['badge', 'progress', 'loading-indicator', 'snackbar', 'tooltip'],
};
/** The guides, before the components: how to start, how mtrl is built, and how to use it in each framework (one Frameworks page). */
export const GUIDES = ['why-material', 'getting-started', 'architecture', 'frameworks', 'theming', 'server-rendering', 'events-and-overlays'];
/**
 * The six framework guides, now one Frameworks page (/docs/frameworks/) that shows the
 * reader's framework: each guide's source stays in docs/components/<slug>.md (docs:check
 * still checks its code), and its old URLs answer 301 to the page with that framework.
 * Guide slug → framework id (the chips' value, :root[data-framework]).
 */
export const FRAMEWORK_GUIDES: Record<string, string> = { vanilla: 'vanilla', 'web-components': 'html', react: 'react', vue: 'vue', svelte: 'svelte', solid: 'solid' };
/** The Frameworks page with one framework chosen, and an anchor in its guide. */
export const frameworkHref = (id: string, anchor = '') => `/docs/frameworks/?framework=${id}${anchor ? `#${id}-${anchor}` : ''}`;
const names: Record<string, string> = { frameworks: 'Frameworks', 'why-material': 'Why material', 'getting-started': 'Getting started', 'web-components': 'Web Components', solid: 'SolidJS', 'server-rendering': 'Server rendering', 'events-and-overlays': 'Events and overlays', fab: 'FAB', 'extended-fab': 'Extended FAB', 'text-field': 'Text field', datepicker: 'Date picker', timepicker: 'Time picker', radios: 'Radio buttons', 'app-bar': 'App bar', 'bottom-app-bar': 'Bottom app bar', 'fab-menu': 'FAB menu' };
export const isGuide = (slug: string) => GUIDES.includes(slug);
const markdownSlugs = (dir: string) => readdirSync(dir)
  .filter(name => name.endsWith('.md') && !name.startsWith('_'))
  .map(name => name.slice(0, -3));
export const addonDocSlugs = markdownSlugs(addonDocsDir);
const addonDocuments = new Set(addonDocSlugs);
/** A document's canonical URL and the markdown that backs it. */
// A component's documentation is its Develop tab (and its Accessibility tab): Docs holds the
// guides, and add-ons until their section has tabs of its own. /docs/components/<slug>/
// redirects to the tab (server.ts).
export const docHref = (slug: string) => isGuide(slug) ? `/docs/${slug}/` : addonDocuments.has(slug) ? `/docs/addons/${slug}/` : `/components/${slug}/develop/`;
/** Where a link into a document's section goes: a component's Accessibility section is its own tab. */
export const docAnchorHref = (slug: string, anchor = '') => !isGuide(slug) && !addonDocuments.has(slug) && anchor === 'accessibility'
  ? `/components/${slug}/accessibility/`
  : `${docHref(slug)}${anchor ? `#${anchor}` : ''}`;
export const documentFile = (slug: string) => `docs/${addonDocuments.has(slug) ? 'addons' : 'components'}/${slug}.md`;
export const componentName = (slug: string) => isAddon(slug) ? addons[slug].name : names[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1).replaceAll('-', ' ');
const slugs = new Set([...markdownSlugs(docsDir), ...addonDocSlugs].filter(slug => !(slug in FRAMEWORK_GUIDES)));
export const docSlugs = [...slugs];
/** The package managers of an `install` block, in switch order, with their add commands. */
export const PACKAGE_MANAGERS = [
  { id: 'bun', command: 'bun add' },
  { id: 'npm', command: 'npm install' },
  { id: 'pnpm', command: 'pnpm add' },
  { id: 'yarn', command: 'yarn add' },
] as const;

/**
 * The package a reader installs for this version of the library. A prerelease (a hyphen
 * in the version) is published on the `next` dist-tag; a release is `material`.
 */
export function installSpecifier(version: string): string {
  return version.includes('-') ? 'material@next' : 'material';
}

/** The library this site is built against (`node_modules/material`). */
const libraryVersion = (): string =>
  JSON.parse(readFileSync(resolve(root, 'node_modules/material/package.json'), 'utf8')).version as string;

/**
 * An install fence is authored as package names (`material`). That one name follows
 * {@link installSpecifier} for the version installed here; any other name is unchanged.
 */
const resolveInstallPackages = (packages: string): string => {
  const version = libraryVersion();
  return packages.split(/\s+/).filter(Boolean).map(name => name === 'material' ? installSpecifier(version) : name).join(' ');
};

/**
 * An `install` fence (its text is the packages) as one command per package manager, with a
 * switch between them. The reader's choice is on :root[data-package-manager] before paint
 * (base.eta), and site.ts remembers it; bun without it.
 */
export function renderInstall(packages: string): string {
  const options = PACKAGE_MANAGERS.map(({ id }) =>
    `<button type="button" class="doc-install__option" data-package-manager="${id}" aria-pressed="${id === 'bun'}">${id}</button>`).join('');
  const commands = PACKAGE_MANAGERS.map(({ id, command }) =>
    `<pre class="doc-install__command" data-package-manager="${id}" tabindex="0" role="group" aria-label="Bash code"><code class="hljs language-bash">${hljs.highlight(`${command} ${packages}`, { language: 'bash' }).value}</code></pre>`).join('');
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

/** A code block's accessible name, from its language: scrollable blocks are keyboard-focusable in every browser. */
export const codeLabel = (language: string): string => (language ? `${hljs.getLanguage(language)?.name ?? language} code` : "Code");
/**
 * A page's summary: the first sentence of its opening paragraph, which the page
 * template makes "what the component is", as plain text.
 */
function docSummary(slug: string): string {
  const source = readFileSync(resolve(root, documentFile(slug)), 'utf8').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
  const paragraph = source.split(/\r?\n\s*\r?\n/).map(block => block.trim()).find(block => block && !/^(#|```|<|\||>|-|\*|\d+\.)/.test(block)) ?? '';
  const text = paragraph.replace(/\s+/g, ' ').replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[`*_]/g, '');
  return (/^.*?[.!?](?=\s|$)/.exec(text)?.[0] ?? text).trim();
}
const entry = (slug: string) => ({ slug, name: componentName(slug), href: docHref(slug), summary: docSummary(slug) });
/** The guides that exist yet, in their order. */
export const guideGroup = { label: 'Guides', items: GUIDES.filter(slug => slugs.has(slug)).map(entry) };
export const addonDocGroup = { label: 'Add-ons', items: addonDocSlugs.map(entry).sort((a, b) => a.name.localeCompare(b.name, 'en')) };
/** The components' documents, by group: their Develop tabs now, no longer Docs pages. */
export const componentDocGroups = Object.entries(groups).map(([label, items]) => ({ label, items: items.filter(slug => slugs.has(slug)).map(entry) }));
/** Docs' own groups after the guides: the add-ons, while they are public and have no tabs. */
export const docGroups = addonsPublic ? [addonDocGroup] : [];
export function escapeHTML(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}
/**
 * Facts a document quotes from the installed material package, so a release cannot leave the
 * page behind: `{{material.version}}`, `{{material.sizes}}` (the README's CI-measured size
 * table, between its `<!-- sizes -->` markers) and `{{material.stylesheet}}` (the full
 * stylesheet's gzip size from that table, in whole kB). A missing table fails the build.
 */
let facts: Record<string, string> | undefined;
const libraryFacts = (): Record<string, string> => {
  if (facts) return facts;
  const readme = readFileSync(resolve(root, 'node_modules/material/README.md'), 'utf8');
  const sizes = /<!-- sizes -->\r?\n([\s\S]*?)\r?\n<!-- \/sizes -->/.exec(readme)?.[1]?.trim();
  if (!sizes) throw new Error('node_modules/material/README.md has no <!-- sizes --> table');
  const stylesheet = /^\|\s*`material\/styles`, the full stylesheet\s*\|\s*([\d.]+) kB\s*\|$/m.exec(sizes)?.[1];
  if (!stylesheet) throw new Error('The material README size table has no full stylesheet row');
  return facts = { version: libraryVersion(), sizes, stylesheet: String(Math.round(Number(stylesheet))) };
};
const withLibraryFacts = (source: string): string => source.includes('{{material.')
  ? source.replace(/\{\{material\.(\w+)\}\}/g, (token, name: string) => {
    const value = libraryFacts()[name];
    if (value === undefined) throw new Error(`Unknown document fact ${token}`);
    return value;
  })
  : source;
/** A document's markdown, without its front matter, with the library's facts filled in. */
export const documentSource = (slug: string): string =>
  withLibraryFacts(readFileSync(resolve(root, documentFile(slug)), 'utf8').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, ''));
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
/** A page's front matter (created, updated, status, and an optional description), as vlist.io's docs carry it. */
export function documentMeta(slug: string): Record<string, string> {
  const head = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(readFileSync(resolve(root, documentFile(slug)), 'utf8'))?.[1] ?? '';
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
/**
 * Markdown to the page's HTML: the `example` and `install` fences, highlighted code, heading
 * ids and the h2 table of contents, and the documentation's own links. `idPrefix` namespaces
 * every heading id and in-page anchor (the Frameworks page holds six guides in one
 * document). A link to one of the six framework guides lands on the Frameworks page with
 * that framework chosen.
 */
function renderMarkdown(source: string, idPrefix = '') {
  const toc: { title: string; id: string }[] = [];
  const headingId = headingIds();
  const parser = new Marked();
  // The page's `example` blocks follow the reader's framework, which the chips at the top
  // of the page pick (document.eta): the same choice as the playgrounds and the Showcase.
  let examples = false;
  parser.use({ renderer: {
    code(token: Tokens.Code) {
      if (token.lang === 'example') {
        examples = true;
        return renderExample(token.text);
      }
      if (token.lang === 'install') return renderInstall(resolveInstallPackages(token.text.trim()));
      // Every other block highlighted like the examples: the fence's first word is the
      // language (after it come docs:check's flags, such as `fragment`).
      const language = codeLanguage(token.lang);
      const body = language ? hljs.highlight(token.text, { language }).value : escapeHTML(token.text);
      return `<pre tabindex="0" role="group" aria-label="${escapeHTML(codeLabel(language))}"><code class="hljs${language ? ` language-${language}` : ''}">${body}</code></pre>\n`;
    },
    heading(this: { parser: { parseInline: (tokens: Tokens.Generic[]) => string } }, token: Tokens.Heading) {
      const { title, id: bare } = headingId(token.text);
      const id = `${idPrefix}${bare}`;
      if (token.depth === 2) toc.push({ title, id });
      return `<h${token.depth} id="${id}">${this.parser.parseInline(token.tokens)}</h${token.depth}>\n`;
    },
    link(this: { parser: { parseInline: (tokens: Tokens.Generic[]) => string } }, token: Tokens.Link) {
      let href = token.href;
      const local = /^(?:\.\/)?([a-z0-9-]+)\.md(?:#([\w-]+))?$/.exec(href) ?? /^\.\.\/([a-z0-9-]+)\/(?:#([\w-]+))?$/.exec(href);
      if (local) {
        // The old sheet API was replaced by bottom-sheet and side-sheet.
        const target = local[1] === 'sheet' ? 'bottom-sheet' : local[1]!;
        const framework = FRAMEWORK_GUIDES[target];
        if (framework) href = frameworkHref(framework, local[2] ?? '');
        else if (href.endsWith('.md') || href.includes('.md#')) href = docAnchorHref(target, local[2] ?? '');
      }
      // An anchor in this document follows its ids.
      else if (idPrefix && href.startsWith('#')) href = `#${idPrefix}${href.slice(1)}`;
      if (/^\s*(javascript|data|vbscript):/i.test(href)) return this.parser.parseInline(token.tokens);
      return `<a href="${escapeHTML(href)}"${token.title ? ` title="${escapeHTML(token.title)}"` : ''}>${this.parser.parseInline(token.tokens)}</a>`;
    },
  } });
  // Each table fills the column and scrolls sideways in its own box when it is wider.
  const html = (parser.parse(source) as string)
    .replaceAll('<table>', '<div class="md-table"><table>')
    .replaceAll('</table>', '</table></div>');
  return { html, toc, examples };
}

/** Framework-specific blocks in a guide's markdown (getting-started.md): `<div data-for-framework="react">`. */
const hasFrameworkBlocks = (source: string) => /data-for-framework=/.test(source);

/** Links into a hidden section (src/shared/visibility.ts) render as their text, so the
 * documents keep their wording and the links return when the section is published. */
export function unlinkHidden(html: string): string {
  return html.replace(/<a href="(\/(?:showcase|addons|docs\/addons|styles)\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/g, (link, href: string, text: string) => isHiddenPath(href) ? text : link);
}
export function renderDocument(slug: string) {
  if (!slugs.has(slug)) return null;
  const source = documentSource(slug);
  const rendered = renderMarkdown(source);
  const { toc, examples } = rendered;
  const html = unlinkHidden(rendered.html);
  // The metadata sits under the title
  const meta = documentMeta(slug);
  let withMeta = html.replace(/(<\/h1>\n?)/, `$1${metaHtml(meta)}`);
  // The Frameworks page: its own introduction, then the six guides, each shown only for its
  // framework (CSS from :root[data-framework], before any script), with its own table of
  // contents. Each guide keeps its text; its h1 gives way to the page's, and its ids are
  // prefixed with the framework so the six never collide.
  let tocs: { framework: string; items: { title: string; id: string }[] }[] | null = null;
  if (slug === 'frameworks') {
    tocs = [];
    const guides = Object.entries(FRAMEWORK_GUIDES).map(([guide, framework]) => {
      const rendered = renderMarkdown(readFileSync(resolve(docsDir, `${guide}.md`), 'utf8').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, ''), `${framework}-`);
      tocs!.push({ framework, items: rendered.toc });
      const body = rendered.html.replace(/<h1 id="[^"]*">[\s\S]*?<\/h1>\n?/, '');
      return `<section class="framework-guide" data-for-framework="${framework}" aria-label="${escapeHTML(componentName(guide))}">${metaHtml(documentMeta(guide))}${body}</section>\n`;
    }).join('');
    withMeta = withMeta.replace('<!-- framework-guides -->', guides);
  }
  const summary = docSummary(slug);
  // The meta description: the summary, unless the front matter gives a shorter one for
  // search results, which show about 160 characters.
  return {
    html: withMeta, toc, tocs, title: componentName(slug), summary, description: meta.description ?? summary,
    // The framework chips (server.ts renders them) on a page whose content follows the
    // framework: its examples, its framework blocks, or the Frameworks page.
    frameworks: examples || hasFrameworkBlocks(source) || slug === 'frameworks',
  };
}
