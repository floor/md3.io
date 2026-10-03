// Content-hashed asset names, and the two cache lifetimes the site serves.
// scripts/write-asset-manifest.ts writes dist/asset-manifest.json: each logical
// path the templates use (`/dist/site.js`) maps to the hashed file the HTML
// should reference (`/dist/site.<hash>.js`). The server never invents a hash.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dir, '../..');

/** A year, and the browser may not revalidate. Only for a URL whose name is the content. */
export const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable';
/**
 * HTML, and the unhashed asset paths a page cached before hashed names still
 * requests. Sixty seconds fresh, then ten minutes stale while the next copy loads.
 */
export const SHORT_CACHE = 'public, max-age=60, stale-while-revalidate=600';

/** Ten hex digits of sha256, the suffix scripts/write-asset-manifest.ts appends. */
export const CONTENT_HASH = /\.[a-f0-9]{10}\.(?:js|css|svg)$/;
/** Bun names a split chunk `chunk-<hash>.js`. That name is already the content. */
export const CHUNK_HASH = /(?:^|\/)chunk-[0-9a-z]+\.js$/;

/**
 * True when this request URL is safe to cache for a year.
 * `/dist/mtrl/…` is the old tree (see server.ts): it always takes the short cache,
 * even when the file it aliases has a hash in its name.
 */
export function isImmutableAsset(urlPath: string): boolean {
  if (urlPath.startsWith('/dist/mtrl/')) return false;
  return urlPath.startsWith('/fonts/') || CONTENT_HASH.test(urlPath) || CHUNK_HASH.test(urlPath);
}

export function loadAssetManifest(): Record<string, string> {
  const file = resolve(root, 'dist/asset-manifest.json');
  if (!existsSync(file)) return {};
  return JSON.parse(readFileSync(file, 'utf8')) as Record<string, string>;
}
