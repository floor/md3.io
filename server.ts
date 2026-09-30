import { Eta } from 'eta';
import { resolve, extname, sep } from 'node:path';
import { root, docGroups, renderDocument } from './src/server/content';
import { themes } from './src/shared/button';
import { components, componentIcons, isComponent, playgroundGroups } from './src/shared/components';
import { examples, exampleBySlug, exampleVariants } from './src/server/examples';
import { elementMeta } from './src/server/elements-meta';
import { searchSite } from './src/server/search';
import { comingStyles, stylePages } from './src/server/styles';
import { AA_TEXT, contrastRatio } from './src/shared/color';
import { colorGroups, missingGroups, mtrlVersion, pairFor, themeTokens, typescale, unloadedFonts } from './src/server/tokens';
import { readFileSync, existsSync } from 'node:fs';

const eta = new Eta({ views: resolve(root, 'src/server/shells'), cache: process.env.NODE_ENV === 'production' });
const commonHeaders = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' };
const html = (body: string, status = 200) => new Response(body, { status, headers: { ...commonHeaders, 'Content-Type': 'text/html; charset=utf-8' } });
const componentGroups = [{ label: 'Components', items: [{ name: 'Overview', href: '/components/' }] }, ...playgroundGroups.map(group => ({ label: group.label, items: group.slugs.map(slug => ({ name: components[slug].name, href: `/components/${slug}/` })) }))];
function page(path: string, title: string, description: string, template: string, data: Record<string, unknown> = {}, status = 200) {
  const isDocs = path.startsWith('/docs');
  const isExamples = path.startsWith('/examples');
  const isStyles = path.startsWith('/styles/');
  const isHome = path === '/';
  const sidebarGroups = isDocs
    ? [{ label: 'Documentation', items: [{ name: 'Overview', href: '/docs/' }, { name: 'Component architecture', href: '/docs/components/components/' }] }, ...docGroups]
    : isExamples ? exampleGroups : isStyles ? stylesGroups : componentGroups;
  return html(eta.render('base', {
    path, title, description, isHome, section: isDocs ? 'Documentation' : isExamples ? 'Examples' : isStyles ? 'Styles' : isHome ? '' : 'Components', sidebarGroups,
    content: eta.render(template, { ...data, docGroups, components, playgroundGroups }),
  }), status);
}
const stylesGroups = [{ label: 'Styles', items: stylePages.map(({ name, href }) => ({ name, href })) }];
const exampleGroups = [{ label: 'Examples', items: [{ name: 'Overview', href: '/examples/' }, ...examples.map(example => ({ name: example.title, href: `/examples/${example.slug}/` }))] }];

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

const mime: Record<string, string> = { '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' };
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
    return new Response(request.method === 'HEAD' ? null : file, { headers: { ...commonHeaders, 'Content-Type': 'text/css', 'Cache-Control': 'no-cache' } });
  }
  const staticMatch = /^\/(styles|fonts|dist|assets)\/(.+)$/.exec(path);
  // /styles/ is also the Styles section: only a path with an extension is a file.
  if (staticMatch && extname(path)) {
    const base = resolve(root, staticMatch[1]!);
    const filePath = resolve(base, staticMatch[2]!);
    if (!filePath.startsWith(base + sep) || !mime[extname(filePath)]) return new Response('Not found', { status: 404 });
    const file = Bun.file(filePath);
    if (!await file.exists()) return new Response('Not found', { status: 404 });
    // Fonts never change under a name (a new font gets a new file), so a reload
    // uses the cached copy at once instead of revalidating and swapping late.
    const cache = staticMatch[1] === 'fonts' ? 'public, max-age=31536000, immutable' : 'no-cache';
    return new Response(request.method === 'HEAD' ? null : file, { headers: { ...commonHeaders, 'Content-Type': mime[extname(filePath)]!, 'Cache-Control': cache } });
  }
  if (path === '/favicon.ico') return new Response(null, { status: 204 });
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
  if (path === '/') response = page(path, 'mtrl — Material Design for the web', 'Material Design 3 components in TypeScript. Explore the components, make them your own, and bring them to any web project.', 'homepage');
  else if (path === '/components/') response = page(path, 'Components — mtrl', 'Explore mtrl components in an interactive playground.', 'catalog');
  else if (componentMatch && isComponent(componentMatch[2]!)) {
    const slug = componentMatch[2]!;
    const component = components[slug];
    response = componentMatch[1] === 'preview'
      ? html(eta.render('preview', { themes, slug, component }))
      : page(path, `${component.name} — mtrl`, component.description, 'component', { component, slug, icons: componentIcons, themes, element: elementMeta(slug) });
  }
  else if (path === '/examples/') response = page(path, 'Examples — mtrl', 'The same interfaces in every framework: web components, React, Vue, Svelte, Solid and vanilla.', 'examples', { examples });
  else if (/^\/examples\/[a-z-]+\/(frame\/[a-z]+\/)?$/.test(path)) {
    const [, slug, , framework] = /^\/examples\/([a-z-]+)\/(frame\/([a-z]+)\/)?$/.exec(path)!;
    const example = exampleBySlug(slug!);
    const variants = example ? exampleVariants(slug!) : null;
    if (!example || !variants) response = page(path, 'Page not found — mtrl', 'This page could not be found.', 'not-found', {}, 404);
    else if (framework) {
      response = variants.some(v => v.id === framework)
        ? html(eta.render('example-frame', { example, framework, themes, styles: styleClosure(example.components) }))
        : page(path, 'Page not found — mtrl', 'This page could not be found.', 'not-found', {}, 404);
    }
    else response = page(path, `${example.title} example — mtrl`, example.description, 'example', { example, variants, themes });
  }
  else if (path === '/styles/') response = page(path, 'Styles — mtrl', stylePages[0].description, 'styles-overview', { stylePages, comingStyles });
  else if (path === '/styles/color/') response = page(path, 'Color — mtrl', stylePages[1].description, 'styles-color', { themes, themeTokens, colorGroups, missingGroups, mtrlVersion, pairFor, contrastRatio, AA_TEXT });
  else if (path === '/styles/typography/') response = page(path, 'Typography — mtrl', stylePages[2].description, 'styles-typography', { typescale, unloadedFonts, mtrlVersion });
  else if (path === '/docs/') response = page(path, 'Documentation — mtrl', 'Configuration and API references for mtrl components.', 'docs');
  else {
    const match = /^\/docs\/components\/([a-z0-9-]+)\/$/.exec(path);
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
