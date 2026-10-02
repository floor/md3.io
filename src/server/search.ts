// Site search: one MiniSearch index over the components, the docs and the
// examples, built once when the server starts. GET /api/search?q= reads it.
//
//   - Components: name, group, description, and from the element: its <m-*> tag
//     and its children's, the framework component names, every attribute and event.
//   - Docs:       every markdown document, one entry per section, so a match in a
//                 section links to its heading's anchor.
//   - Examples:   title, description, the components used, and the side panel text.
//   - Styles:     the Styles pages, with the colour roles and type scale roles they list.
import MiniSearch, { type SearchResult as Hit } from 'minisearch';
import { Marked, type Token } from 'marked';
import { componentName, docGroups, docSlugs, documentSource, headingIds, docHref } from './content';
import { elementMeta } from './elements-meta';
import { examples } from './examples';
import { components, componentSlugs } from '../shared/components';
import { stylePages } from './styles';
import { colorGroups, shapeScale, typescale } from './tokens';
import { themes } from '../shared/button';

export const SECTIONS = ['Components', 'Styles', 'Docs', 'Examples'] as const;
type Section = (typeof SECTIONS)[number];

interface IndexDocument {
  id: string;
  section: Section;
  /** The page's title: the component, the document or the example. */
  title: string;
  /** The docs section's heading; empty for the page itself. */
  heading: string;
  group: string;
  description: string;
  /** Tag names: `m-dialog`, children's tags, the slug. */
  tags: string;
  /** API names: attributes, events, framework components, the factory. */
  api: string;
  body: string;
  url: string;
  /** The page the entry belongs to: one result per page. */
  page: string;
}

export interface SearchResult {
  title: string;
  url: string;
  section: Section;
  group: string;
  snippet: string;
  /** The words matched, for the dialog to highlight. */
  terms: string[];
}

const DEFAULT_LIMIT = 10;
const SNIPPET_LENGTH = 120;

// A hyphenated word is a term of its own (`peek-height`, `m-menu-item`) and its
// parts are too, so both `peek-height` and `peek` find the bottom sheet.
export function tokenize(text: string): string[] {
  const tokens: string[] = [];
  for (const [word] of text.matchAll(/[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*/gu)) {
    tokens.push(word);
    if (word.includes('-')) tokens.push(...word.split('-').filter(part => part.length > 1));
  }
  return tokens;
}

const pascal = (name: string): string => name.replace(/(?:^|-)([a-z])/g, (_, c: string) => c.toUpperCase());

/** Markdown or HTML as plain text: code blocks dropped, inline code kept. */
function plainText(source: string): string {
  return source
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*\|?[\s:|-]+\|?\s*$/gm, '')
    .replace(/\|/g, ' ')
    .replace(/(\*{1,3}|~~)/g, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function componentDocuments(): IndexDocument[] {
  return componentSlugs.map(slug => {
    const component = components[slug];
    const meta = elementMeta(slug);
    const elements = meta ? [meta.name, ...(meta.children ? [meta.children.name] : [])] : [];
    return {
      id: `components:${slug}`, section: 'Components', title: component.name, heading: '', group: component.group,
      description: component.description,
      tags: [slug, ...elements.map(name => `m-${name}`)].join(' '),
      api: [
        component.factory,
        ...elements.flatMap(name => [pascal(name), `M${pascal(name)}`]),
        ...Object.keys(meta?.attributes ?? {}),
        ...(meta?.events ?? []),
      ].join(' '),
      body: '', url: `/components/${slug}/`, page: `/components/${slug}/`,
    };
  });
}

/** One entry for a document's introduction, one for each section, with its anchor. */
function docDocuments(): IndexDocument[] {
  const groupOf = new Map(docGroups.flatMap(group => group.items.map(item => [item.slug, group.label] as const)));
  const lexer = new Marked();
  return docSlugs.flatMap(slug => {
    const title = componentName(slug);
    const page = docHref(slug);
    const group = groupOf.get(slug) ?? 'Documentation';
    const headingId = headingIds();
    const sections: { heading: string; id: string; text: string[] }[] = [{ heading: '', id: '', text: [] }];
    for (const token of lexer.lexer(documentSource(slug)) as Token[]) {
      if (token.type === 'heading') {
        // Every heading takes an id, as the rendered page numbers them.
        const { title: heading, id } = headingId(token.text);
        if (token.depth > 1) sections.push({ heading, id, text: [] });
      }
      else if (token.type !== 'code') sections.at(-1)!.text.push(token.raw);
    }
    const intro = plainText(sections[0]!.text.join('\n'));
    return sections.map(({ heading, id, text }, index): IndexDocument => ({
      id: `docs:${slug}${id ? `#${id}` : ''}`, section: 'Docs', title: index ? '' : title, heading, group,
      description: index ? '' : intro.slice(0, 200), tags: '', api: '',
      body: plainText(text.join('\n')), url: id ? `${page}#${id}` : page, page,
    }));
  });
}

function exampleDocuments(): IndexDocument[] {
  return examples.map(example => ({
    id: `examples:${example.slug}`, section: 'Examples', title: example.title, heading: '', group: '',
    description: example.description,
    tags: example.components.flatMap(slug => [slug, `m-${slug}`]).join(' '),
    api: example.components.map(slug => components[slug as keyof typeof components]?.name ?? slug).join(' '),
    body: plainText([...example.about, ...example.how].join(' ')),
    url: `/examples/${example.slug}/`, page: `/examples/${example.slug}/`,
  }));
}

/** The Styles pages; the colour and typography pages list their roles, spaced and hyphenated. */
function styleDocuments(): IndexDocument[] {
  const roleWords = (role: string) => `${role} ${role.replaceAll('-', ' ')}`;
  const extra: Record<string, { api: string; body: string }> = {
    '/styles/': { api: '', body: 'Shape your own Material: theme builder, live preview, export theme CSS, share link. Color, typography, shape. Coming: elevation, motion, states, icons.' },
    '/styles/shape/': {
      api: Object.keys(shapeScale).map(step => `--mtrl-sys-shape-corner-${step}`).join(' '),
      body: `Shape, corner radius, border radius, rounded corners, roundness. ${Object.keys(shapeScale).map(roleWords).join(', ')}.`,
    },
    '/styles/themes/': {
      api: 'material/themes data-theme data-theme-mode',
      body: `Themes, theme builder, light scheme, dark scheme, tonal palettes, seed color, Material Theme Builder. ${themes.map(name => name.replaceAll('-', ' ')).join(', ')}.`,
    },
    '/styles/color/': {
      api: colorGroups.flatMap(group => group.roles.map(role => `--mtrl-sys-color-${role}`)).join(' '),
      body: `Color roles, themes, light and dark, WCAG contrast. ${colorGroups.map(group => `${group.label}: ${group.roles.map(roleWords).join(', ')}.`).join(' ')}`,
    },
    '/styles/typography/': {
      api: typescale.flatMap(style => [`mtrl-${style.role}`, `--mtrl-sys-typescale-${style.role}-font-size`]).join(' '),
      body: `Typography, type scale, typescale, font, font size, line height, weight, tracking. ${typescale.map(style => roleWords(style.role)).join(', ')}.`,
    },
  };
  return stylePages.map(page => ({
    id: `styles:${page.href}`, section: 'Styles', title: page.title, heading: '', group: 'Styles',
    description: page.description, tags: page.title.toLowerCase(), ...extra[page.href]!,
    url: page.href, page: page.href,
  }));
}

const started = performance.now();
const documents = [...componentDocuments(), ...styleDocuments(), ...docDocuments(), ...exampleDocuments()];
const titles = new Map(documents.filter(document => document.title).map(document => [document.page, document.title]));

const index = new MiniSearch<IndexDocument>({
  fields: ['title', 'tags', 'api', 'heading', 'group', 'description', 'body'],
  storeFields: ['section', 'heading', 'group', 'description', 'tags', 'api', 'body', 'url', 'page'],
  tokenize,
  searchOptions: {
    boost: { title: 10, tags: 6, api: 6, heading: 4, description: 3, group: 2, body: 1 },
    prefix: term => term.length > 2,
    fuzzy: term => (term.length > 4 ? 0.2 : false),
  },
});
index.addAll(documents);
console.log(`Search index: ${documents.length} entries, ${index.termCount} terms, built in ${Math.round(performance.now() - started)} ms`);

/** The component's tag and the tags and API names matched, or its description. */
function componentSnippet(hit: Hit, terms: string[]): string {
  const matches = (name: string) => terms.some(term => tokenize(name.toLowerCase()).includes(term));
  const tags = (hit.tags as string).split(' ').filter(name => name.startsWith('m-')).map(tag => `<${tag}>`);
  const names = [...tags, ...(hit.api as string).split(' ')].filter(matches);
  return names.length ? [...new Set([tags[0]!, ...names])].join(' · ') : hit.description as string;
}

/** About 120 characters of the body around the first matched term, else the description. */
function textSnippet(body: string, description: string, terms: string[]): string {
  const lower = body.toLowerCase();
  const position = terms.map(term => lower.search(new RegExp(`(?<![\\p{L}\\p{N}])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'u')))
    .filter(found => found !== -1).sort((a, b) => a - b)[0];
  if (position === undefined) return description || body.slice(0, SNIPPET_LENGTH);
  let start = Math.max(0, Math.min(position - SNIPPET_LENGTH / 2, body.length - SNIPPET_LENGTH));
  let end = Math.min(body.length, start + SNIPPET_LENGTH);
  if (start > 0) {
    const space = body.indexOf(' ', start);
    if (space !== -1 && space < position) start = space + 1;
  }
  if (end < body.length) {
    const space = body.lastIndexOf(' ', end);
    if (space > position) end = space;
  }
  return `${start > 0 ? '…' : ''}${body.slice(start, end).trim()}${end < body.length ? '…' : ''}`;
}

/** Ranked results, the best entry of each page, grouped Components · Styles · Docs · Examples. */
export function searchSite(query: string, limit = DEFAULT_LIMIT): SearchResult[] {
  const q = query.trim();
  if (!q) return [];
  const seen = new Set<string>();
  const results: SearchResult[] = [];
  for (const hit of index.search(q)) {
    if (seen.has(hit.page as string)) continue;
    seen.add(hit.page as string);
    const terms = [...new Set([...hit.terms, ...hit.queryTerms])];
    const section = hit.section as Section;
    const title = titles.get(hit.page as string) ?? '';
    results.push({
      title: hit.heading ? `${title} › ${hit.heading as string}` : title,
      url: hit.url as string, section, group: hit.group as string,
      snippet: section === 'Components' ? componentSnippet(hit, terms) : textSnippet(hit.body as string, hit.description as string, terms),
      // A prefix match marks what was typed: `peek` in `peek-height`.
      terms: [...new Set(terms.map(term => hit.queryTerms.find(typed => term.startsWith(typed)) ?? term))],
    });
    if (results.length === limit) break;
  }
  return results.sort((a, b) => SECTIONS.indexOf(a.section) - SECTIONS.indexOf(b.section));
}
