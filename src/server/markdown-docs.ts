// The documentation as Markdown, for AI tools and crawlers (FLO-1564): /llms.txt (a map),
// /llms-full.txt (everything at once), and a .md twin of every guide and of a component's
// Develop and Accessibility tabs. The sources are the docs' own Markdown, with the library's
// facts filled in, links made absolute (to the .md twins), and each ```example block turned
// into the code the page shows, framework by framework.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { FRAMEWORKS, type Framework } from '../shared/frameworks';
import { components, componentSlugs } from '../shared/components';
import { docsDir, documentSource, FRAMEWORK_GUIDES, guideGroups, isGuide, addonDocSlugs } from './content';
import { exampleCode, parseExample } from './example-block';
import { SITE } from './seo';

/** The fence language of each framework's code, as Markdown readers know them. */
const FENCE: Record<Framework, string> = { vanilla: 'js', html: 'html', react: 'tsx', vue: 'vue', svelte: 'svelte', solid: 'tsx' };

const isComponentDoc = (slug: string) => !isGuide(slug) && !addonDocSlugs.includes(slug) && (componentSlugs as readonly string[]).includes(slug);

/** A document's Markdown address: a guide's twin, or a component's Develop tab's. */
export const markdownHref = (slug: string, anchor = ''): string =>
  isGuide(slug) ? `/docs/${slug}.md` : isComponentDoc(slug)
    ? `/components/${slug}/${anchor === 'accessibility' ? 'accessibility' : 'develop'}.md`
    : `/docs/addons/${slug}.md`;

/** Each ```example block as the code the page shows: one fenced block per framework. */
function expandExamples(source: string): string {
  return source.replace(/^```example\n([\s\S]*?)^```$/gm, (_, body: string) => {
    const { code } = exampleCode(parseExample(body));
    return FRAMEWORKS.filter(({ id }) => code[id])
      .map(({ id, label }) => `${label}:\n\n\`\`\`${FENCE[id]}\n${code[id]!.trimEnd()}\n\`\`\``).join('\n\n');
  });
}

/** Relative links (`button.md`, `button.md#api`) become absolute links to the .md twins. */
const absoluteLinks = (source: string): string =>
  source.replace(/\]\((?:\.\/)?([a-z0-9-]+)\.md(?:#([\w-]+))?\)/g, (_, target: string, anchor?: string) => {
    const slug = target === 'sheet' ? 'bottom-sheet' : target;
    return `](${SITE}${markdownHref(slug, anchor ?? '')}${anchor && anchor !== 'accessibility' ? `#${anchor}` : ''})`;
  });

/** A guide's or a component's whole document, as Markdown. */
export function documentMarkdown(slug: string): string {
  let source = documentSource(slug);
  // The Frameworks page holds the six framework guides: each follows, whole.
  if (slug === 'frameworks') {
    const guides = Object.keys(FRAMEWORK_GUIDES).map(guide =>
      readFileSync(resolve(docsDir, `${guide}.md`), 'utf8').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').replace(/^# /m, '## ')).join('\n\n');
    source = source.replace('<!-- framework-guides -->', guides);
  }
  return absoluteLinks(expandExamples(source)).trim() + '\n';
}

/** A component's Develop or Accessibility tab: its document split at `## Accessibility`. */
export function componentTabMarkdown(slug: string, tab: 'develop' | 'accessibility'): string | null {
  if (!isComponentDoc(slug)) return null;
  const whole = documentMarkdown(slug);
  const start = whole.search(/^## Accessibility\s*$/m);
  const name = components[slug as keyof typeof components].name;
  if (tab === 'accessibility') {
    if (start < 0) return null;
    const rest = whole.slice(start);
    const end = rest.slice(1).search(/^## /m);
    return `# ${name}: accessibility\n\n${(end < 0 ? rest : rest.slice(0, end + 1)).replace(/^## Accessibility\s*\n/, '').trim()}\n`;
  }
  if (start < 0) return whole;
  const rest = whole.slice(start);
  const end = rest.slice(1).search(/^## /m);
  return (whole.slice(0, start) + (end < 0 ? '' : rest.slice(end + 1))).trim() + '\n';
}

const INTRO = 'material is an independent Material Design 3 component library for the web, with M3 Expressive components: plain JavaScript factories (`createButton()`), web components (`<m-button>`), and React, Vue, Svelte and SolidJS wrappers, in TypeScript, with no runtime dependencies. Install it with `npm install material`. md3.io is its site: a live playground for every component, its API, and guides.';

/** /llms.txt: the library in a paragraph, then every page as Markdown, grouped. */
export function llmsTxt(): string {
  const line = (name: string, href: string, note = '') => `- [${name}](${SITE}${href})${note ? `: ${note}` : ''}`;
  const guides = guideGroups.map(group => `## ${group.label}\n\n${group.items.map(item => line(item.name, markdownHref(item.slug), item.summary)).join('\n')}`).join('\n\n');
  const list = [...componentSlugs].filter(isComponentDoc).sort((a, b) => components[a].name.localeCompare(components[b].name, 'en'));
  // A component's accessibility notes are listed when its document has them.
  const componentLines = list.map(slug => line(`${components[slug].name}`, markdownHref(slug), `${components[slug].description}${componentTabMarkdown(slug, 'accessibility') ? ` Accessibility: ${SITE}${markdownHref(slug, 'accessibility')}` : ''}`));
  return `# md3.io: material, Material 3 Expressive components for the web\n\n> ${INTRO}\n\n${guides}\n\n## Components\n\nEach component's API, usage and examples (and, after it, its accessibility notes).\n\n${componentLines.join('\n')}\n\n## Optional\n\n${line('Everything at once', '/llms-full.txt', 'every guide and component document in one file')}\n`;
}

/** /llms-full.txt: every guide, then every component, whole. */
export function llmsFullTxt(): string {
  const guides = guideGroups.flatMap(group => group.items.map(item => item.slug));
  const list = [...componentSlugs].filter(isComponentDoc).sort((a, b) => components[a].name.localeCompare(components[b].name, 'en'));
  const part = (slug: string) => `<!-- ${SITE}${markdownHref(slug)} -->\n\n${documentMarkdown(slug)}`;
  return `# md3.io: material, Material 3 Expressive components for the web\n\n> ${INTRO}\n\n${[...guides, ...list].map(part).join('\n---\n\n')}`;
}

