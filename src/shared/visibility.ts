/**
 * Sections the site does not publish yet (the owner, 2026-11-21: "the components are not
 * finished"; "hide the showcase"). While a section is hidden nothing links to it: no
 * navigation entry, docs sidebar group, search result, sitemap entry, pager step or
 * "Used in" link. Its pages still answer for review, marked noindex. Flip to true to publish.
 */
export const addonsPublic = false;
export const showcasePublic = false;
// The owner, 2026-11-24: "hide the styles menu as it is messy and not finished".
export const stylesPublic = false;
// The owner, 2026-11-26 (FLO-1607): the specs matrix is reviewed by the owner before it is public.
export const specsPublic = false;

export const isAddonPath = (path: string): boolean => path.startsWith('/addons/') || path.startsWith('/docs/addons/');
export const isShowcasePath = (path: string): boolean => path.startsWith('/showcase/');
/** A Styles page; /styles/*.css are the site's own stylesheets, not pages. */
export const isStylesPath = (path: string): boolean => path.startsWith('/styles/') && !path.endsWith('.css');
export const isSpecsPath = (path: string): boolean => path.startsWith('/specs/') || /^\/components\/[a-z-]+\/specs\/$/.test(path);
/** A page of a hidden section: served, never linked, not indexed. */
export const isHiddenPath = (path: string): boolean => (!addonsPublic && isAddonPath(path)) || (!showcasePublic && isShowcasePath(path)) || (!stylesPublic && isStylesPath(path)) || (!specsPublic && isSpecsPath(path));
