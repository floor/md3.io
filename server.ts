import { Eta } from 'eta';
import { resolve, extname, sep, basename } from 'node:path';
import { root, docGroups, guideGroup, isGuide, renderDocument, renderInstall } from './src/server/content';
import { themes } from './src/shared/button';
import { components, componentIcons, isComponent, playgroundGroups } from './src/shared/components';
import { examples, exampleBySlug, exampleVariants } from './src/server/examples';
import { elementMeta } from './src/server/elements-meta';
import { catalogTokens, catalogVisuals } from './src/server/catalog';
import { searchSite } from './src/server/search';
import { componentSize } from './src/server/sizes';
import { comingStyles, stylePages } from './src/server/styles';
import { minifyCss, type StylesheetBundle } from './src/server/css';
import { AA_TEXT, contrastRatio } from './src/shared/color';
import { colorGroups, missingGroups, mtrlVersion, pairFor, themeTokens, typescale, unloadedFonts, roleUsage, fontWeights, shapeUsage, themeBase } from './src/server/tokens';
import { CORNER_MAX } from './src/shared/theme-state';
import { M3_CORNER_SCALE, M3_SHAPE_COUNT } from './src/shared/m3-shape';
import { SHAPE_LABELS, SHAPE_NAMES, shapePath } from './src/shared/shape-library';
import { readFileSync, existsSync } from 'node:fs';
import { jsonForScript, robotsTxt, sitemapXml, structuredData } from './src/server/seo';

const eta = new Eta({ views: resolve(root, 'src/server/shells'), cache: process.env.NODE_ENV === 'production' });
const commonHeaders = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' };
// Every script and stylesheet link carries the build it belongs to. Their names stay the
// same between deploys, so without it a browser or Cloudflare (whose default browser
// cache is 4 hours) kept last deploy's playground.js against a new page's components.
// Each build restarts the server, so the start time identifies the build.
export const BUILD = Date.now().toString(36);
// Lazy chunks import their entry back by its plain name (`./preview.js`); an import map
// sends that to the versioned URL the page loaded, or the entry would run twice.
// Only the entries the page loads: a page names no bundle it does not use.
const importMap = (body: string) => {
  const entries = [...new Set([...body.matchAll(/src="(\/dist\/[^"/?#]+\.js)"/g)].map(match => match[1]!))];
  return entries.length ? `<script type="importmap">${JSON.stringify({ imports: Object.fromEntries(entries.map(entry => [entry, `${entry}?v=${BUILD}`])) })}</script>` : '';
};
const versionAssets = (body: string) => body
  .replace('<head>', `<head>\n  ${importMap(body)}`)
  .replace(/((?:src|href)="\/(?:dist|styles)\/[^"?#]+\.(?:js|css))"/g, `$1?v=${BUILD}"`)
  // The mark keeps its name across deploys, so the query is what makes the URL new.
  .replace(/((?:src|href)="\/assets\/brand\/mark\.svg)"/g, `$1?v=${BUILD}"`);
const html = (body: string, status = 200) => new Response(versionAssets(body), { status, headers: { ...commonHeaders, 'Content-Type': 'text/html; charset=utf-8' } });
// Previews and example frames are pages inside pages: never a search result of their own.
const internalHtml = (body: string) => new Response(versionAssets(body), { headers: { ...commonHeaders, 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex' } });
const componentGroups = [{ label: 'Components', items: [{ name: 'Overview', href: '/components/' }] }, ...playgroundGroups.map(group => ({ label: group.label, items: group.slugs.map(slug => ({ name: components[slug].name, href: `/components/${slug}/` })) }))];
function page(path: string, title: string, description: string, template: string, data: Record<string, unknown> = {}, status = 200) {
  const isDocs = path.startsWith('/docs');
  const isExamples = path.startsWith('/examples');
  const isStyles = path.startsWith('/styles/');
  const isHome = path === '/';
  const sidebarGroups = isDocs ? documentationGroups : isExamples ? exampleGroups : isStyles ? stylesGroups : componentGroups;
  // Previous and next, in sidebar order, as on vlist.io, and on across sections: the
  // component docs lead to Styles, Styles to Examples. Not on the playgrounds, which
  // fill the window, nor outside the sidebar's pages.
  const chain = isDocs || isStyles || isExamples ? readingOrder : sidebarGroups.flatMap(group => group.items);
  const pager = status === 200 && !isHome && template !== 'component' ? pagerHtml(chain, path, chain === readingOrder) : '';
  const content = eta.render(template, { ...data, docGroups, guideGroup, components, playgroundGroups, pager });
  const section = isDocs ? 'Documentation' : isExamples ? 'Examples' : isStyles ? 'Styles' : isHome ? '' : 'Components';
  // One built sheet per page type, the same files that page used to link. See stylesheetBundles.
  const css: StylesheetBundle = isHome ? 'home' : template === 'catalog' ? 'catalog' : isExamples ? 'examples' : isStyles ? 'styles' : 'page';
  const jsonLd = status === 200 ? structuredData(path, title.replace(/ — mtrl$/, ''), description, section).map(jsonForScript) : [];
  return html(eta.render('base', {
    path, title, description, isHome, isCatalog: template === 'catalog', catalogTokens, section, sidebarGroups, jsonLd, css,
    content: template === 'document' || !pager ? content : `${content}<div class="page-wrap pager-wrap">${pager}</div>`,
  }), status);
}
const stylesGroups = [{ label: 'Styles', items: stylePages.map(({ name, href }) => ({ name, href })) }];
const documentationGroups = [{ label: 'Documentation', items: [{ name: 'Overview', href: '/docs/' }] }, guideGroup, ...docGroups];
const escapeHtml = (text: string) => text.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
/** The previous and next links for a page, from the sidebar's items in order. */
type PagerItem = { name: string; href: string; section?: string };
function pagerHtml(items: PagerItem[], path: string, cycle = false): string {
  const index = items.findIndex(item => item.href === path);
  if (index < 0) return '';
  // A cycle wraps: the last page leads back to the first (the last example to the documentation).
  const at = (i: number) => cycle ? items[(i + items.length) % items.length] : items[i];
  const [current, prev, next] = [items[index]!, at(index - 1), at(index + 1)];
  if (!prev && !next) return '';
  // Crossing into another section names it: "Styles: Overview".
  const title = (item: PagerItem) => item.section && item.section !== current.section ? `${item.section}: ${item.name}` : item.name;
  const link = (item: PagerItem, rel: 'prev' | 'next') =>
    `<a href="${escapeHtml(item.href)}" rel="${rel}" class="page-nav__link page-nav__link--${rel}"><span class="page-nav__label">${rel === 'prev' ? '← Previous' : 'Next →'}</span><span class="page-nav__title">${escapeHtml(title(item))}</span></a>`;
  return `<nav class="page-nav" aria-label="Previous and next">${prev ? link(prev, 'prev') : '<span></span>'}${next ? link(next, 'next') : ''}</nav>`;
}
const exampleGroups = [{ label: 'Examples', items: [{ name: 'Overview', href: '/examples/' }, ...examples.map(example => ({ name: example.title, href: `/examples/${example.slug}/` }))] }];
/** The reading order across sections, a cycle: the documentation, Styles, Examples, and back. */
const readingOrder = [documentationGroups, stylesGroups, exampleGroups].flatMap(groups => groups.flatMap(group => group.items.map(item => ({ ...item, section: groups[0]!.label }))));

// mtrl's light-DOM stylesheets for a set of components, dependencies first: each
// dist/mtrl/styles/<name>.js imports the stylesheets its component needs.
function styleClosure(names: string[]): string[] {
  const order: string[] = [];
  const visit = (name: string) => {
    if (order.includes(name)) return;
    const module = resolve(root, 'dist/mtrl/styles', `${name}.js`);
    const source = existsSync(module) ? readFileSync(module, 'utf8') : '';
    for (const [, dependency] of source.matchAll(/import "\.\/([a-z-]+)\.js"/g)) if (dependency !== name) visit(dependency!);
    order.push(name);
  };
  names.forEach(visit);
  return order;
}

/** The components in the Styles frames (src/client/styles-frame.ts): the preview's screen and the Shape gallery. */
const STYLES_FRAME_COMPONENTS = ['top-app-bar', 'icon-button', 'chips', 'card', 'textfield', 'switch', 'slider', 'button', 'fab', 'dialog', 'checkbox'];
/** The Shape page's expressive shapes, drawn by mtrl/core/shapes, and each theme's primary container to fill them. */
const shapeLibrary = SHAPE_NAMES.map(name => ({ name, label: SHAPE_LABELS[name], path: shapePath(name) }));
const libraryColors = Object.fromEntries(Object.entries(themeTokens).map(([theme, modes]) => [theme, Object.fromEntries((['light', 'dark'] as const).map(mode => [mode, [modes[mode]['primary-container']?.value, modes[mode]['on-primary-container']?.value]]))]));
const mime: Record<string, string> = { '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
/** The files browsers and link previews ask for at the root, from public/ (scripts/brand-images.ts makes them). */
const rootFiles = new Set(['/favicon.ico', '/favicon.svg', '/apple-touch-icon.png', '/og-image.png']);
const text = (body: string | null, type: string) => new Response(body, { headers: { ...commonHeaders, 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'public, max-age=3600' } });
export async function handleRequest(request: Request): Promise<Response> {
  if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  const url = new URL(request.url);
  let path: string;
  try { path = decodeURIComponent(url.pathname); } catch { return new Response('Bad request', { status: 400 }); }
  if (/(?:^|\/)\.[^/]/.test(path)) return new Response('Not found', { status: 404 });
  // An example's own layout CSS lives beside its code: /examples-styles/<slug>.css.
  const exampleStyle = /^\/examples-styles\/([a-z-]+)\.css$/.exec(path);
  if (exampleStyle && exampleBySlug(exampleStyle[1]!)) {
    const file = Bun.file(resolve(root, 'examples', exampleStyle[1]!, 'styles.css'));
    const body = request.method === 'HEAD' ? null : minifyCss(await file.text());
    return new Response(body, { headers: { ...commonHeaders, 'Content-Type': 'text/css', 'Cache-Control': 'no-cache' } });
  }
  const staticMatch = /^\/(styles|fonts|dist|assets)\/(.+)$/.exec(path);
  // /styles/ is also the Styles section: only a path with an extension is a file.
  if (staticMatch && extname(path)) {
    const base = resolve(root, staticMatch[1]!);
    const filePath = resolve(base, staticMatch[2]!);
    if (!filePath.startsWith(base + sep) || !mime[extname(filePath)]) return new Response('Not found', { status: 404 });
    const file = Bun.file(filePath);
    if (!await file.exists()) return new Response('Not found', { status: 404 });
    // Fonts never change under a name (a new font gets a new file), and a versioned
    // script or stylesheet (?v=, see versionAssets) is a new URL each build: both are
    // cached for good. A lazy chunk's name is its content hash (chunk-<hash>.js), so
    // that URL is new when its bytes change, and it is cached the same way. The rest
    // revalidates.
    const hashedChunk = staticMatch[1] === 'dist' && /^chunk-[0-9a-z]+\.js$/.test(basename(filePath));
    const cache = staticMatch[1] === 'fonts' || url.searchParams.has('v') || hashedChunk ? 'public, max-age=31536000, immutable' : 'no-cache';
    const type = mime[extname(filePath)]!;
    const body = request.method === 'HEAD' ? null : type === 'text/css' ? minifyCss(await file.text()) : file;
    return new Response(body, { headers: { ...commonHeaders, 'Content-Type': type, 'Cache-Control': cache } });
  }
  if (rootFiles.has(path)) {
    const file = Bun.file(resolve(root, 'public', path.slice(1)));
    if (!await file.exists()) return new Response('Not found', { status: 404 });
    // Not versioned by name, so a day's cache: a new icon reaches everyone by the next day.
    return new Response(request.method === 'HEAD' ? null : file, { headers: { ...commonHeaders, 'Content-Type': mime[extname(path)]!, 'Cache-Control': 'public, max-age=86400' } });
  }
  if (path === '/robots.txt') return text(request.method === 'HEAD' ? null : robotsTxt(), 'text/plain');
  if (path === '/sitemap.xml') return text(request.method === 'HEAD' ? null : sitemapXml(), 'application/xml');
  // GET /api/search?q=…&limit=… — the site search dialog's results.
  if (path === '/api/search' || path === '/api/search/') {
    const q = url.searchParams.get('q') ?? '';
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 10));
    const body = request.method === 'HEAD' ? null : JSON.stringify({ query: q, results: searchSite(q, limit) });
    return new Response(body, { headers: { ...commonHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache' } });
  }
  if (!path.endsWith('/') && !extname(path)) return new Response(null, { status: 308, headers: { Location: `${url.pathname}/${url.search}` } });
  let response: Response;
  const componentMatch = /^\/(components|preview)\/([a-z-]+)\/$/.exec(path);
  if (path === '/') response = page(path, 'mtrl — Material Design for the web', 'Material Design 3 components in TypeScript. Explore the components, make them your own, and bring them to any web project.', 'homepage', { install: renderInstall('mtrl') });
  else if (path === '/components/') response = page(path, 'Components — mtrl', 'Explore mtrl components in an interactive playground.', 'catalog', { catalogVisuals });
  else if (componentMatch && isComponent(componentMatch[2]!)) {
    const slug = componentMatch[2]!;
    const component = components[slug];
    response = componentMatch[1] === 'preview'
      ? internalHtml(eta.render('preview', { themes, slug, component }))
      : page(path, `${component.name} — mtrl`, component.description, 'component', { component, slug, icons: componentIcons, themes, element: elementMeta(slug), size: componentSize(slug) });
  }
  else if (path === '/examples/') response = page(path, 'Examples — mtrl', 'The same interfaces in every framework: web components, React, Vue, Svelte, Solid and vanilla.', 'examples', { examples });
  else if (/^\/examples\/[a-z-]+\/(frame\/[a-z]+\/)?$/.test(path)) {
    const [, slug, , framework] = /^\/examples\/([a-z-]+)\/(frame\/([a-z]+)\/)?$/.exec(path)!;
    const example = exampleBySlug(slug!);
    const variants = example ? exampleVariants(slug!) : null;
    if (!example || !variants) response = page(path, 'Page not found — mtrl', 'This page could not be found.', 'not-found', {}, 404);
    else if (framework) {
      response = variants.some(v => v.id === framework)
        ? internalHtml(eta.render('example-frame', { example, framework, themes, styles: styleClosure(example.components) }))
        : page(path, 'Page not found — mtrl', 'This page could not be found.', 'not-found', {}, 404);
    }
    else response = page(path, `${example.title} example — mtrl`, example.description, 'example', { example, variants, themes });
  }
  else if (path === '/styles/frame/') response = internalHtml(eta.render('styles-frame', { themes, styles: styleClosure(STYLES_FRAME_COMPONENTS) }));
  else if (path === '/styles/') response = page(path, 'Styles — mtrl', stylePages[0].description, 'styles-overview', { stylePages, comingStyles, themeBase });
  else if (path === '/styles/color/') response = page(path, 'Color — mtrl', stylePages[1].description, 'styles-color', { themes, themeTokens, colorGroups, missingGroups, mtrlVersion, pairFor, contrastRatio, AA_TEXT, themeBase });
  else if (path === '/styles/typography/') response = page(path, 'Typography — mtrl', stylePages[2].description, 'styles-typography', { typescale, unloadedFonts, mtrlVersion, roleUsage, fontWeights, components, themeBase });
  else if (path === '/styles/shape/') response = page(path, 'Shape — mtrl', stylePages[3].description, 'styles-shape', { shape: themeBase.shape, mtrlVersion, themeBase, cornerMax: CORNER_MAX, m3Scale: M3_CORNER_SCALE, m3ShapeCount: M3_SHAPE_COUNT, library: shapeLibrary, libraryColors });
  else if (path === '/docs/') response = page(path, 'Documentation — mtrl', 'Configuration and API references for mtrl components.', 'docs');
  else if (path === '/docs/components/components/') response = new Response(null, { status: 301, headers: { ...commonHeaders, Location: '/docs/architecture/' } });
  else if (/^\/docs\/[a-z-]+\/$/.test(path) && isGuide(path.slice(6, -1)) && renderDocument(path.slice(6, -1))) {
    const slug = path.slice(6, -1);
    const document = renderDocument(slug)!;
    response = page(path, `${document.title} — mtrl`, document.description, 'document', { ...document, playground: null });
  }
  else {
    const match = /^\/docs\/components\/([a-z0-9-]+)\/$/.exec(path);
    // A guide has one URL, /docs/<slug>/
    if (match && isGuide(match[1]!)) return new Response(null, { status: 301, headers: { ...commonHeaders, Location: `/docs/${match[1]}/` } });
    const document = match ? renderDocument(match[1]!) : null;
    response = document
      ? page(path, `${document.title} documentation — mtrl`, `Configuration, methods, and examples for the mtrl ${document.title.toLowerCase()} component.`, 'document', { ...document, playground: isComponent(match![1]!) ? `/components/${match![1]}/` : null })
      : page(path, 'Page not found — mtrl', 'This page could not be found.', 'not-found', {}, 404);
  }
  return request.method === 'HEAD' ? new Response(null, { status: response.status, headers: response.headers }) : response;
}
if (import.meta.main) {
  const server = Bun.serve({ port: Number(process.env.PORT || 4300), hostname: process.env.HOST || '127.0.0.1', fetch: handleRequest });
  console.log(`md3.io ready at ${server.url}`);
}
