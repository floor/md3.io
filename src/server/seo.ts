// What search engines and link previews read: the public pages with their lastmod
// (sitemap.xml), robots.txt, and each page's JSON-LD. The pages come from the data the
// routes serve, so a new component, document, style page or example is listed at once.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { root, docSlugs, docHref, isGuide } from './content';
import { componentSlugs } from '../shared/components';
import { examples } from './examples';
import { stylePages } from './styles';
import { mtrlVersion } from './tokens';

export const SITE = 'https://md3.io';
/** Routes for the site's own use, never a page to index: robots.txt disallows them. */
export const INTERNAL_PREFIXES = ['/api/', '/preview/'];

const today = new Date().toISOString().slice(0, 10);
/**
 * Every file's last commit date from one `git log` at startup (newest first, so a file's
 * first date is its latest). Empty without git or history: every page then gets today.
 */
export function gitDates(dir = root): Map<string, string> {
  const dates = new Map<string, string>();
  try {
    const log = execFileSync('git', ['log', '--format=%cd', '--date=short', '--name-only', 'HEAD'], { cwd: dir, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
    let date = '';
    for (const line of log.split('\n')) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(line)) date = line;
      else if (line && date && !dates.has(line)) dates.set(line, date);
    }
  } catch {}
  return dates;
}
const dates = gitDates();
/** The latest date of some files; a path ending in / stands for everything under it. */
const lastmod = (...files: string[]): string => files.reduce((latest, file) => {
  const found = file.endsWith('/') ? [...dates].filter(([name]) => name.startsWith(file)).map(([, date]) => date) : [dates.get(file) ?? ''];
  return found.reduce((a, b) => b > a ? b : a, latest);
}, '') || today;

const shell = (name: string) => `src/server/shells/${name}.eta`;
/** A component's playground: its definition, and its own module where it has one (src/shared/button.ts). */
const componentFiles = (slug: string) => ['src/shared/components.ts', ...existsSync(resolve(root, `src/shared/${slug}.ts`)) ? [`src/shared/${slug}.ts`] : []];
const STYLE_SHELLS: Record<string, string> = { '/styles/': 'styles-overview', '/styles/color/': 'styles-color', '/styles/typography/': 'styles-typography' };

export interface SitemapPage { path: string; lastmod: string; priority: string }
/** Every public page, from the routes' own data, with its sources' last commit. */
export function sitemapPages(): SitemapPage[] {
  const pages: SitemapPage[] = [];
  const add = (path: string, priority: string, ...files: string[]) => pages.push({ path, priority, lastmod: lastmod(...files) });
  add('/', '1.0', shell('homepage'));
  add('/components/', '0.9', shell('catalog'), 'src/server/catalog.ts');
  for (const slug of componentSlugs) add(`/components/${slug}/`, '0.8', ...componentFiles(slug), shell('component'));
  add('/docs/', '0.9', shell('docs'));
  // Guides first, then the component references; docHref gives each its one URL.
  for (const slug of [...docSlugs].sort((a, b) => Number(isGuide(b)) - Number(isGuide(a)))) add(docHref(slug), isGuide(slug) ? '0.8' : '0.7', `docs/components/${slug}.md`);
  for (const { href } of stylePages) add(href, href === '/styles/' ? '0.8' : '0.7', shell(STYLE_SHELLS[href] ?? 'styles-overview'), 'src/server/tokens.ts');
  add('/examples/', '0.8', shell('examples'), 'examples/index.ts');
  for (const { slug } of examples) add(`/examples/${slug}/`, '0.6', `examples/${slug}/`);
  return pages;
}

const escapeXml = (text: string) => text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!);
export function sitemapXml(): string {
  const urls = sitemapPages().map(page => `  <url><loc>${escapeXml(SITE + page.path)}</loc><lastmod>${page.lastmod}</lastmod><priority>${page.priority}</priority></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}
export const robotsTxt = (): string =>
  `User-agent: *\nAllow: /\n${INTERNAL_PREFIXES.map(prefix => `Disallow: ${prefix}\n`).join('')}\nSitemap: ${SITE}/sitemap.xml\n`;

const SECTIONS: Record<string, string> = { Components: '/components/', Documentation: '/docs/', Styles: '/styles/', Examples: '/examples/' };
const author = { '@type': 'Organization', name: 'Floor IO', url: 'https://floor.io' };
/**
 * A page's structured data: on the home page mtrl itself and the site, with the search
 * that /?q= opens; elsewhere the trail Home → section → page. `name` is the page's own
 * name, its title without the site suffix.
 */
export function structuredData(path: string, name: string, description: string, section: string): object[] {
  if (path === '/') return [
    {
      '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'mtrl', applicationCategory: 'DeveloperApplication', operatingSystem: 'Web',
      url: SITE, description, author, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, softwareVersion: mtrlVersion,
      license: 'https://opensource.org/licenses/MIT', codeRepository: 'https://github.com/floor/mtrl', programmingLanguage: { '@type': 'ComputerLanguage', name: 'TypeScript' },
    },
    {
      '@context': 'https://schema.org', '@type': 'WebSite', name: 'md3.io', url: SITE, publisher: author,
      potentialAction: { '@type': 'SearchAction', target: `${SITE}/?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
    },
  ];
  const sectionPath = SECTIONS[section];
  if (!sectionPath) return [];
  const trail = [{ name: 'Home', path: '/' }, { name: section, path: sectionPath }, ...path === sectionPath ? [] : [{ name, path }]];
  return [{
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: SITE + item.path })),
  }];
}
/** JSON for a <script> element: `<` escaped, so no text in it can close the element. */
export const jsonForScript = (value: unknown): string =>
  JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
