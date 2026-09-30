// Every page the sitemap lists, as a search engine reads it: status 200, one title and
// one description each, unique across the site, the description short enough to show
// whole (160 characters), and the canonical and preview image in the head.
// BASE_URL checks a running server; without it the check serves the site itself.
import { SITE } from '../src/server/seo';

const server = process.env.BASE_URL ? null : Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: (await import('../server')).handleRequest });
const base = (process.env.BASE_URL ?? server!.url.href).replace(/\/$/, '');

const decode = (text: string) => text.replace(/&(amp|lt|gt|quot|#39);/g, (_, name: string) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" })[name]!);
const all = (html: string, pattern: RegExp) => [...html.matchAll(pattern)].map(match => decode(match[1]!.trim()));
const problems: string[] = [];
const seen = { title: new Map<string, string>(), description: new Map<string, string>() };
try {
  const robots = await (await fetch(`${base}/robots.txt`)).text();
  if (!robots.includes(`Sitemap: ${SITE}/sitemap.xml`)) problems.push('robots.txt: no Sitemap line');
  const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
  const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]!.replace(SITE, ''));
  for (const path of paths) {
    const response = await fetch(`${base}${path}`, { redirect: 'manual' });
    if (response.status !== 200) { problems.push(`${path}: status ${response.status}`); continue; }
    const html = await response.text();
    const head = html.slice(0, html.indexOf('</head>'));
    const titles = all(head, /<title>([^<]*)<\/title>/g);
    const descriptions = all(head, /<meta name="description" content="([^"]*)"/g);
    for (const [kind, values] of [['title', titles], ['description', descriptions]] as const) {
      if (values.length !== 1 || !values[0]) { problems.push(`${path}: ${values.length} ${kind}s`); continue; }
      const other = seen[kind].get(values[0]);
      if (other) problems.push(`${path}: same ${kind} as ${other}: "${values[0]}"`);
      else seen[kind].set(values[0], path);
    }
    if (descriptions[0] && descriptions[0].length > 160) problems.push(`${path}: description is ${descriptions[0].length} characters`);
    if (!head.includes(`<link rel="canonical" href="${SITE}${path}" />`)) problems.push(`${path}: no canonical to itself`);
    if (!head.includes(`<meta property="og:image" content="${SITE}/og-image.png" />`)) problems.push(`${path}: no og:image`);
    if (!head.includes('application/ld+json')) problems.push(`${path}: no structured data`);
  }
  for (const problem of problems) console.log(problem);
  console.log(`${paths.length} pages checked, ${problems.length} problem${problems.length === 1 ? '' : 's'}.`);
  if (problems.length) process.exitCode = 1;
}
finally {
  server?.stop(true);
}
