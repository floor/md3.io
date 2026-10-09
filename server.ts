import { Eta } from 'eta';
import { resolve, extname, sep } from 'node:path';
import { IMMUTABLE_CACHE, SHORT_CACHE, isImmutableAsset, loadAssetManifest } from './src/server/assets';
import { root, docGroups, guideGroup, isGuide, renderDocument, renderInstall, installSpecifier } from './src/server/content';
import { themes } from './src/shared/button';
import { components, componentIcons, elementConfig, initialComponentState, isComponent, normalizeComponentState, playgroundGroups } from './src/shared/components';
import { examples, exampleBySlug, exampleVariants } from './src/server/examples';
import { elementMeta } from './src/server/elements-meta';
import { plannedElement } from './src/shared/frameworks';
import { dividerFrame, isElementStage, stageRequestState } from './src/shared/stage-elements';
import { catalogTokens, catalogVisuals } from './src/server/catalog';
import { searchSite } from './src/server/search';
import { componentSize } from './src/server/sizes';
import { comingStyles, stylePages } from './src/server/styles';
import { builtInThemes } from './src/server/themes';
import { THEME_ROLES } from 'material/core/theme';
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
// Logical path → content-hashed path. Written by scripts/write-asset-manifest.ts.
// Empty until the first build; the templates' own names are served then.
const assetManifest = loadAssetManifest();
// Lazy chunks import their entry back by its plain name (`./preview.js`). The HTML
// loads the hashed name, so the import map sends the plain name to that same file,
// or the entry would run twice. Only the entries this page links, as before.
const importMap = (body: string) => {
  const entries = [...new Set([...body.matchAll(/src="(\/dist\/[^"/?#]+\.js)"/g)].map(match => match[1]!))];
  const imports = Object.fromEntries(entries.filter(entry => assetManifest[entry]).map(entry => [entry, assetManifest[entry]!]));
  return Object.keys(imports).length ? `<script type="importmap">${JSON.stringify({ imports })}</script>` : '';
};
const versionAssets = (body: string) => {
  const mapped = importMap(body);
  const rewritten = body.replace(/((?:src|href)=")(\/[^"?#]+)(")/g, (full, open, path, close) => {
    const hashed = assetManifest[path];
    return hashed ? `${open}${hashed}${close}` : full;
  });
  return mapped ? rewritten.replace('<head>', `<head>\n  ${mapped}`) : rewritten;
};
const html = (body: string, status = 200) => new Response(versionAssets(body), { status, headers: { ...commonHeaders, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': SHORT_CACHE } });
// Previews and example frames are pages inside pages: never a search result of their own.
const internalHtml = (body: string) => new Response(versionAssets(body), { headers: { ...commonHeaders, 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex', 'Cache-Control': SHORT_CACHE } });
const componentGroups = [{ label: 'Components', items: [{ name: 'Overview', href: '/components/' }] }, ...playgroundGroups.map(group => ({ label: group.label, items: group.slugs.map(slug => ({ name: components[slug].name, href: `/components/${slug}/` })) }))];
function page(path: string, title: string, description: string, template: string, data: Record<string, unknown> = {}, status = 200) {
  const isDocs = path.startsWith('/docs');
  const isExamples = path.startsWith('/examples');
  const isStyles = path.startsWith('/styles/');
  const isHome = path === '/';
  // The privacy page stands outside the sections: no sidebar and no breadcrumb (base.eta).
  const isPrivacy = template === 'privacy';
  const sidebarGroups = isDocs ? documentationGroups : isExamples ? exampleGroups : isStyles ? stylesGroups : isPrivacy ? [] : componentGroups;
  // Previous and next, in sidebar order, as on vlist.io, and on across sections: the
  // component docs lead to Styles, Styles to Examples. Not on the playgrounds, which
  // fill the window, nor outside the sidebar's pages.
  const chain = isDocs || isStyles || isExamples ? readingOrder : sidebarGroups.flatMap(group => group.items);
  const pager = status === 200 && !isHome && template !== 'component' && template !== 'styles-themes' ? pagerHtml(chain, path, chain === readingOrder) : '';
  const content = eta.render(template, { ...data, docGroups, guideGroup, components, playgroundGroups, pager });
  const section = isDocs ? 'Documentation' : isExamples ? 'Examples' : isStyles ? 'Styles' : isHome || isPrivacy ? '' : 'Components';
  // Where the title already names the section, the compact header can drop the breadcrumb.
  // On the pages it does not, the breadcrumb stays for assistive technology (base.eta).
  const sectionNamed = section !== '' && title.toLowerCase().includes(section.toLowerCase());
  // One built sheet per page type, the same files that page used to link. See stylesheetBundles.
  const css: StylesheetBundle = isHome ? 'home' : template === 'catalog' ? 'catalog' : isExamples ? 'examples' : template === 'styles-themes' ? 'themes' : isStyles ? 'styles' : 'page';
  const jsonLd = status === 200 ? structuredData(path, title.replace(/ — material$/, ''), description, section).map(jsonForScript) : [];
  return html(eta.render('base', {
    path, title, description, isHome, noSidebar: isPrivacy, isCatalog: template === 'catalog', catalogTokens, section, sectionNamed, sidebarGroups, jsonLd, css, script: template === 'styles-themes' ? 'theme-app' : undefined,
    content: template === 'document' || !pager ? content : `${content}<div class="page-wrap pager-wrap">${pager}</div>`,
  }), status);
}
const styleDescription = (href: string) => stylePages.find(entry => entry.href === href)!.description;
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

// material's light-DOM stylesheets for a set of components, dependencies first: each
// dist/material/styles/<name>.js imports the stylesheets its component needs.
function styleClosure(names: string[]): string[] {
  const order: string[] = [];
  const visit = (name: string) => {
    if (order.includes(name)) return;
    const module = resolve(root, 'dist/material/styles', `${name}.js`);
    const source = existsSync(module) ? readFileSync(module, 'utf8') : '';
    for (const [, dependency] of source.matchAll(/import "\.\/([a-z-]+)\.js"/g)) if (dependency !== name) visit(dependency!);
    order.push(name);
  };
  names.forEach(visit);
  return order;
}

/** The components in the Styles frames (src/client/styles-frame.ts): the preview's screen and the Shape gallery. */
const STYLES_FRAME_COMPONENTS = ['top-app-bar', 'icon-button', 'chips', 'card', 'text-field', 'switch', 'slider', 'button', 'fab', 'dialog', 'checkbox'];
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
    // The hashed copy is what new HTML links. This stable name stays for a page
    // cached earlier, on the same short lifetime as HTML.
    return new Response(body, { headers: { ...commonHeaders, 'Content-Type': 'text/css', 'Cache-Control': SHORT_CACHE } });
  }
  // Until 2027-01-03. Pages cached before this site's assets were content-hashed
  // (2026-10-03), and pages that still say /dist/mtrl/… from before the material
  // rename, request these stable names. They keep answering, with the short HTML
  // cache, so those pages still load. The current bytes are served: a `?v=` query
  // left over from the previous scheme does not select an old build.
  // After 2027-01-03, remove this alias and stop serving the unhashed names
  // (/dist/site.js, /dist/material/themes/*.css, /dist/css/*.css, /styles/*.css,
  // /examples-styles/*.css, /assets/brand/mark.svg). Also delete hashed files left
  // in dist that asset-manifest.json no longer lists (scripts/write-asset-manifest.ts).
  const assetPath = path.replace(/^\/dist\/mtrl\//, '/dist/material/');
  const staticMatch = /^\/(styles|fonts|dist|assets)\/(.+)$/.exec(assetPath);
  // /styles/ is also the Styles section: only a path with an extension is a file.
  if (staticMatch && extname(path)) {
    const base = resolve(root, staticMatch[1]!);
    const filePath = resolve(base, staticMatch[2]!);
    if (!filePath.startsWith(base + sep) || !mime[extname(filePath)]) return new Response('Not found', { status: 404 });
    const file = Bun.file(filePath);
    if (!await file.exists()) return new Response('Not found', { status: 404 });
    // A content hash in the name (or a font, whose name is the file) is cached for a
    // year. The stable names above stay on the short cache. Other assets (playground
    // images) revalidate, as they did.
    const immutable = isImmutableAsset(path);
    const short = path.startsWith('/dist/') || staticMatch[1] === 'styles' || path === '/assets/brand/mark.svg';
    const cache = immutable ? IMMUTABLE_CACHE : short ? SHORT_CACHE : 'no-cache';
    const type = mime[extname(filePath)]!;
    // Hashed CSS is already the minified bytes its name was hashed from. Minifying
    // again would not match that name. The stable path is minified on the way out.
    const body = request.method === 'HEAD' ? null : type === 'text/css' && !immutable ? minifyCss(await file.text()) : file;
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
  if (path === '/') response = page(path, 'material — Material Design for the web', 'Material Design 3 components in TypeScript. Explore the components, make them your own, and bring them to any web project.', 'homepage', { install: renderInstall(installSpecifier(mtrlVersion)) });
  else if (path === '/components/') response = page(path, 'Components — material', 'Explore the material library\'s components in an interactive playground.', 'catalog', { catalogVisuals });
  else if (componentMatch && isComponent(componentMatch[2]!)) {
    const slug = componentMatch[2]!;
    const component = components[slug];
    const stageElements = url.searchParams.get('stage') === 'elements';
    const requestedScenario = component.scenarios.find(item => item.id === url.searchParams.get('scenario'));
    // The scenario rides on the preview request only behind the switch, so the
    // first HTML is that scenario. Without the switch the iframe src is unchanged.
    const stageScenario = stageElements && requestedScenario ? requestedScenario.id : '';
    // The first HTML carries the element for a tier-1 page (and the slider), so it
    // can paint before the preview script. Anything else, and a page without the
    // switch, stays an empty stage.
    let stageMarkup = '';
    if (componentMatch[1] === 'preview' && stageElements && isElementStage(slug)) {
      const meta = elementMeta(slug);
      if (meta) {
        const { renderElement } = await import('material/ssr');
        const state = normalizeComponentState(slug, stageRequestState(initialComponentState(slug), requestedScenario));
        const planned = plannedElement(meta, elementConfig(slug, state));
        const attributes = Object.fromEntries(planned.attributes.map(([name, value]) => [name, value === '' ? true : value]));
        if (slug === 'divider') attributes.style = 'flex:1';
        const text = planned.text?.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;') ?? '';
        const markup = renderElement(planned.tag, attributes, text);
        stageMarkup = slug === 'divider' ? `<div style="${dividerFrame(state.orientation)}">${markup}</div>` : markup;
      }
    }
    response = componentMatch[1] === 'preview'
      ? internalHtml(eta.render('preview', { themes, slug, component, stageMarkup }))
      : page(path, `${component.name} — material`, component.description, 'component', { component, slug, icons: componentIcons, themes, element: elementMeta(slug), size: componentSize(slug), stageElements, stageScenario });
  }
  else if (path === '/examples/') response = page(path, 'Examples — material', 'The same interfaces in every framework: web components, React, Vue, Svelte, Solid and vanilla.', 'examples', { examples });
  else if (/^\/examples\/[a-z-]+\/(frame\/[a-z]+\/)?$/.test(path)) {
    const [, slug, , framework] = /^\/examples\/([a-z-]+)\/(frame\/([a-z]+)\/)?$/.exec(path)!;
    const example = exampleBySlug(slug!);
    const variants = example ? exampleVariants(slug!) : null;
    if (!example || !variants) response = page(path, 'Page not found — material', 'This page could not be found.', 'not-found', {}, 404);
    else if (framework) {
      response = variants.some(v => v.id === framework)
        ? internalHtml(eta.render('example-frame', { example, framework, themes, styles: styleClosure(example.components) }))
        : page(path, 'Page not found — material', 'This page could not be found.', 'not-found', {}, 404);
    }
    else response = page(path, `${example.title} example — material`, example.description, 'example', { example, variants, themes });
  }
  else if (path === '/styles/frame/') response = internalHtml(eta.render('styles-frame', { themes, styles: styleClosure(STYLES_FRAME_COMPONENTS) }));
  else if (path === '/styles/') response = page(path, 'Styles — material', styleDescription('/styles/'), 'styles-overview', { stylePages, comingStyles, themeBase });
  else if (path === '/styles/themes/') {
    const linked = url.searchParams.get('theme');
    response = page(path, 'Themes — material', styleDescription('/styles/themes/'), 'styles-themes', { themes: builtInThemes, roles: THEME_ROLES, selected: linked && themes.includes(linked as never) ? linked : 'baseline', mtrlVersion, themeBase });
  }
  else if (path === '/styles/color/') response = page(path, 'Color — material', styleDescription('/styles/color/'), 'styles-color', { themes, themeTokens, colorGroups, missingGroups, mtrlVersion, pairFor, contrastRatio, AA_TEXT, themeBase });
  else if (path === '/styles/typography/') response = page(path, 'Typography — material', styleDescription('/styles/typography/'), 'styles-typography', { typescale, unloadedFonts, mtrlVersion, roleUsage, fontWeights, components, themeBase });
  else if (path === '/styles/shape/') response = page(path, 'Shape — material', styleDescription('/styles/shape/'), 'styles-shape', { shape: themeBase.shape, mtrlVersion, themeBase, cornerMax: CORNER_MAX, m3Scale: M3_CORNER_SCALE, m3ShapeCount: M3_SHAPE_COUNT, library: shapeLibrary, libraryColors });
  else if (path === '/privacy/') response = page(path, 'Privacy — material', 'How md3.io counts visits, what it keeps in your browser, and how to reach us.', 'privacy');
  else if (path === '/docs/') response = page(path, 'Documentation — material', 'Configuration and API references for the material library\'s components.', 'docs');
  else if (path === '/docs/components/components/') response = new Response(null, { status: 301, headers: { ...commonHeaders, Location: '/docs/architecture/' } });
  else if (path === '/docs/components/segmented-button/') response = new Response(null, { status: 301, headers: { ...commonHeaders, Location: '/docs/components/button-group/' } });
  else if (path === '/components/textfield/' || path === '/preview/textfield/' || path === '/docs/components/textfield/') response = new Response(null, { status: 301, headers: { ...commonHeaders, Location: `${path.replace('textfield', 'text-field')}${url.search}` } });
  else if (/^\/docs\/[a-z-]+\/$/.test(path) && isGuide(path.slice(6, -1)) && renderDocument(path.slice(6, -1))) {
    const slug = path.slice(6, -1);
    const document = renderDocument(slug)!;
    response = page(path, `${document.title} — material`, document.description, 'document', { ...document, playground: null });
  }
  else {
    const match = /^\/docs\/components\/([a-z0-9-]+)\/$/.exec(path);
    // A guide has one URL, /docs/<slug>/
    if (match && isGuide(match[1]!)) return new Response(null, { status: 301, headers: { ...commonHeaders, Location: `/docs/${match[1]}/` } });
    const document = match ? renderDocument(match[1]!) : null;
    response = document
      ? page(path, `${document.title} documentation — material`, `Configuration, methods, and examples for the ${document.title.toLowerCase()} component of the material library.`, 'document', { ...document, playground: isComponent(match![1]!) ? `/components/${match![1]}/` : null })
      : page(path, 'Page not found — material', 'This page could not be found.', 'not-found', {}, 404);
  }
  return request.method === 'HEAD' ? new Response(null, { status: response.status, headers: response.headers }) : response;
}
if (import.meta.main) {
  const server = Bun.serve({ port: Number(process.env.PORT || 4300), hostname: process.env.HOST || '127.0.0.1', fetch: handleRequest });
  console.log(`md3.io ready at ${server.url}`);
}
