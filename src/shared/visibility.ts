/**
 * Sections the site does not publish yet (the owner, 2026-11-21: "the components are not
 * finished"; "hide the showcase"). While a section is hidden nothing links to it: no
 * navigation entry, docs sidebar group, search result, sitemap entry, pager step or
 * "Used in" link. Its pages still answer for review, marked noindex. Flip to true to publish.
 */
export const addonsPublic = false;
export const showcasePublic = false;

export const isAddonPath = (path: string): boolean => path.startsWith('/addons/') || path.startsWith('/docs/addons/');
export const isShowcasePath = (path: string): boolean => path.startsWith('/showcase/');
/** A page of a hidden section: served, never linked, not indexed. */
export const isHiddenPath = (path: string): boolean => (!addonsPublic && isAddonPath(path)) || (!showcasePublic && isShowcasePath(path));
