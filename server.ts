import { Eta } from 'eta';
import { resolve, extname, sep } from 'node:path';
import { root, docGroups, renderDocument } from './src/server/content';
import { themes } from './src/shared/button';
import { components, componentIcons, isComponent, playgroundGroups } from './src/shared/components';

const eta = new Eta({ views: resolve(root, 'src/server/shells'), cache: process.env.NODE_ENV === 'production' });
const commonHeaders = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' };
const html = (body: string, status = 200) => new Response(body, { status, headers: { ...commonHeaders, 'Content-Type': 'text/html; charset=utf-8' } });
const componentGroups = [{ label: 'Components', items: [{ name: 'Overview', href: '/components/' }] }, ...playgroundGroups.map(group => ({ label: group.label, items: group.slugs.map(slug => ({ name: components[slug].name, href: `/components/${slug}/` })) }))];
function page(path: string, title: string, description: string, template: string, data: Record<string, unknown> = {}, status = 200) {
  const isDocs = path.startsWith('/docs');
  const isHome = path === '/';
  const sidebarGroups = isDocs
    ? [{ label: 'Documentation', items: [{ name: 'Overview', href: '/docs/' }, { name: 'Component architecture', href: '/docs/components/components/' }] }, ...docGroups]
    : componentGroups;
  return html(eta.render('base', {
    path, title, description, isHome, section: isDocs ? 'Documentation' : isHome ? '' : 'Components', sidebarGroups,
    content: eta.render(template, { ...data, docGroups, components, playgroundGroups }),
  }), status);
}
const mime: Record<string, string> = { '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' };
export async function handleRequest(request: Request): Promise<Response> {
  if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  const url = new URL(request.url);
  let path: string;
  try { path = decodeURIComponent(url.pathname); } catch { return new Response('Bad request', { status: 400 }); }
  if (/(?:^|\/)\.[^/]/.test(path)) return new Response('Not found', { status: 404 });
  const staticMatch = /^\/(styles|fonts|dist|assets)\/(.+)$/.exec(path);
  if (staticMatch) {
    const base = resolve(root, staticMatch[1]!);
    const filePath = resolve(base, staticMatch[2]!);
    if (!filePath.startsWith(base + sep) || !mime[extname(filePath)]) return new Response('Not found', { status: 404 });
    const file = Bun.file(filePath);
    if (!await file.exists()) return new Response('Not found', { status: 404 });
    return new Response(request.method === 'HEAD' ? null : file, { headers: { ...commonHeaders, 'Content-Type': mime[extname(filePath)]!, 'Cache-Control': 'no-cache' } });
  }
  if (path === '/favicon.ico') return new Response(null, { status: 204 });
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
      : page(path, `${component.name} — mtrl`, component.description, 'component', { component, slug, icons: componentIcons, themes });
  }
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
  const server = Bun.serve({ port: Number(process.env.PORT || 3339), hostname: process.env.HOST || '127.0.0.1', fetch: handleRequest });
  console.log(`md3.io ready at ${server.url}`);
}
