import { Eta } from 'eta';
import { resolve, extname, sep } from 'node:path';
import { IMMUTABLE_CACHE, SHORT_CACHE, isImmutableAsset, loadAssetManifest } from './src/server/assets';
import { root, addonDocGroup, componentName, docGroups, docHref, docSlugs, guideGroup, guideGroups, isGuide, renderDocument, renderInstall, installSpecifier, FRAMEWORK_GUIDES, frameworkHref } from './src/server/content';
import { themes } from './src/shared/button';
import { components, componentDeprecations, componentIcons, componentSlugs, isComponent } from './src/shared/components';
import { addons, addonSlugs, addonsPublic, isAddon, playgroundHref } from './src/shared/addons';
import { isHiddenPath, showcasePublic, stylesPublic } from './src/shared/visibility';
import { componentDirectory } from './src/server/component-directory';
import { componentOverview } from './src/server/component-overview';
import { componentTabMarkdown, documentMarkdown, llmsFullTxt, llmsTxt } from './src/server/markdown-docs';
import { componentDrawerEntries, drawerItems, renderSectionDrawer } from './src/server/section-drawer';
import { examples, exampleBySlug, exampleVariants, exampleComponents, exampleTags, examplesUsingComponent, filterChips } from './src/server/examples';
import { elementMeta } from './src/server/elements-meta';
import { catalogCard, docCard, catalogTokens, catalogVisuals } from './src/server/catalog';
import { HEADER_SCOPE, exampleViewTabs, frameworkChipsRow, linkedStylesheets, materialPanel, showcaseCopyButton, panelMarkup, renderStyles } from './src/server/playground-panel';
import { renderElement } from 'material/ssr';
import { searchSite } from './src/server/search';
import { componentSize, treeShaking } from './src/server/sizes';
import { LAB_SEEDS, LAB_VARIANTS, LAB_SAMPLES, LAB_ROLE_GROUPS } from './src/shared/colour-lab';
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
import { jsonForScript, robotsTxt, sitemapXml, structuredData, documentTitle } from './src/server/seo';

const eta = new Eta({ views: resolve(root, 'src/server/shells'), cache: process.env.NODE_ENV === 'production' });
const commonHeaders = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' };
// Logical path → content-hashed path. Written by scripts/write-asset-manifest.ts.
// Empty until the first build; the templates' own names are served then.
const assetManifest = loadAssetManifest();
// The site's small icons, inline SVG instead of text glyphs (↗, ←): a Material Symbol from
// icons/ or a brand mark from icons/brands/, sized by .inline-icon and hidden from
// assistive technology (the link text, or the link's aria-label, carries the meaning).
const iconCache = new Map<string, string>();
const icon = (name: string): string => {
  let svg = iconCache.get(name);
  if (!svg) {
    svg = readFileSync(resolve(root, 'icons', `${name}.svg`), 'utf8').trim()
      .replace(/^<svg /, '<svg class="inline-icon" focusable="false" ')
      .replace(/ width="24" height="24"/, '');
    if (!svg.includes('aria-hidden')) svg = svg.replace('<svg ', '<svg aria-hidden="true" ');
    iconCache.set(name, svg);
  }
  return svg;
};
// Every theme's two sheets as theme → [main hash, contrast hash] (theme-sheets-template.eta):
// about a tenth of the size of the 38 <link>s it replaces in each page. '' before a build.
// Baseline is in the map too: since the site's own colours take the theme's roles
// at <html data-theme>, the default palette needs its sheet like any other.
const sheetHash = (path: string) => assetManifest[path]?.match(/\.([a-f0-9]{10})\.css$/)?.[1] ?? '';
const themeSheets = JSON.stringify(Object.fromEntries(themes
  .map(theme => [theme, [sheetHash(`/dist/material/themes/${theme}.css`), sheetHash(`/dist/material/themes/${theme}-contrast.css`)]])))
  .replaceAll('<', '\\u003c');
// The header's Themes control, material's own: an icon button server-rendered on every
// page (styled before any script, from the shared element sheets it links), and the
// menu's items inert in a template until the first click loads the menu (site.ts).
const themeLabel = (theme: string) => (theme.charAt(0).toUpperCase() + theme.slice(1)).replaceAll('-', ' ');
const themeButton = renderElement('m-icon-button', { id: 'theme-picker', 'aria-label': 'Theme', 'aria-haspopup': 'menu', 'aria-expanded': 'false', icon: readFileSync(resolve(import.meta.dir, 'icons/palette.svg'), 'utf8') }, '', renderStyles);
const checkIcon = readFileSync(resolve(import.meta.dir, 'icons/check.svg'), 'utf8').trim().replaceAll('"', '&quot;');
const themeMenu = `<template id="theme-menu-template" data-check="${checkIcon}"><m-menu anchor="theme-picker" position="bottom-end" aria-label="Theme">${themes.map(theme => `<m-menu-item value="${theme}">${themeLabel(theme)}</m-menu-item>`).join('')}</m-menu></template>`;
// The mode button, material's icon button too: both Material Symbols in its icon slot,
// each shown by a root variable the mode sets (shell.css), so it is right at first
// paint. It shows where a click goes: the moon in light mode, the sun in dark; site.ts keeps its label ("Switch site to … mode") in step.
const modeIcon = (name: 'dark_mode' | 'light_mode', mode: 'dark' | 'light') =>
  readFileSync(resolve(import.meta.dir, `icons/${name}.svg`), 'utf8').trim().replace('<svg ', `<svg style="display: var(--site-mode-icon-${mode})" `);
const modeButton = renderElement('m-icon-button', { id: 'theme-toggle', 'aria-label': 'Switch site mode', icon: modeIcon('dark_mode', 'light') + modeIcon('light_mode', 'dark') }, '', renderStyles);
// The search trigger, material's button. Until its definition loads on a page, the rendered inner
// button is the control, so it carries the popup semantics; search.ts restores them after an upgrade.
const searchKeys = '<span class="header__search-kbd" aria-hidden="true"><kbd>⌘</kbd><kbd>K</kbd></span>';
const searchButton = renderElement('m-button', { id: 'search-trigger', class: 'header__search', variant: 'tonal', 'aria-label': 'Search (⌘K)', icon: readFileSync(resolve(import.meta.dir, 'icons/search.svg'), 'utf8').trim() }, `<span class="header__search-label">Search</span>${searchKeys}`, renderStyles)
  .replace('<button part="button"', '<button aria-haspopup="dialog" aria-keyshortcuts="Meta+K Control+K" part="button"');
// The site header, material's app bar. The logo is a link in the leading slot, so the bar's empty
// headline is not a heading: each page keeps its own single h1 (site.ts repeats this after an upgrade).
const headerLogo = '<a slot="leading" class="header__logo" href="/" aria-label="material, home"><img class="header__mark" src="/assets/brand/mark.svg" width="20" height="20" alt="" aria-hidden="true">material</a>';
const headerScopeScript = '<script>(s => { const r = document.documentElement; s.dataset.theme = r.dataset.siteTheme || \'baseline\'; s.dataset.themeMode = r.dataset.themeMode; })(document.currentScript.parentElement);</script>';
// A phone has no rail: this opens the section's list in the modal drawer (site-navigation.ts).
const sectionMenuButton = renderElement('m-icon-button', { id: 'site-section-open', 'aria-label': 'Open section navigation', icon: readFileSync(resolve(import.meta.dir, 'icons/menu.svg'), 'utf8').trim() }, '', renderStyles)
  .replace('<button ', '<button aria-haspopup="dialog" aria-expanded="false" aria-controls="site-nav-dialog" ');
const appBar = renderElement('m-top-app-bar', { class: 'header', 'no-scroll': true, 'aria-label': 'Site header' }, `${headerLogo}<div slot="trailing" class="header__actions ${HEADER_SCOPE}">HEADER_ACTIONS</div>`, renderStyles)
  .replace('<h1 part="headline"', '<h1 role="presentation" part="headline"')
  // renderElement refuses light-DOM children that already hold a shadow root, so the button goes in after.
  .replace('HEADER_ACTIONS', () => headerScopeScript + searchButton)
  .replace('<a slot="leading"', () => `<div slot="leading" class="header__menu ${HEADER_SCOPE}">${headerScopeScript}${sectionMenuButton}</div><a slot="leading"`);
const headerStylesheets = linkedStylesheets(appBar + themeButton + modeButton);
// Lazy chunks import their entry back by its plain name (`./preview.js`). The HTML
// loads the hashed name, so the import map sends the plain name to that same file,
// or the entry would run twice. Site pages retain this map across navigations.
const importMap = (body: string) => {
  // A persistent document can later visit any site page. Map all site entry URLs
  // up front so lazy chunks never evaluate a plain and hashed entry twice.
  const entries = body.includes('data-navigation-shell="site-v1"')
    ? Object.keys(assetManifest).filter(path => /^\/dist\/[^/]+\.js$/.test(path))
    : [...new Set([...body.matchAll(/src="(\/dist\/[^"/?#]+\.js)"/g)].map(match => match[1]!))];
  const imports = Object.fromEntries(entries.filter(entry => assetManifest[entry]).map(entry => [entry, assetManifest[entry]!]));
  return Object.keys(imports).length ? `<script type="importmap">${JSON.stringify({ imports })}</script>` : '';
};
const versionAssets = (body: string) => {
  const mapped = importMap(body);
  const rewritten = body.replace(/((?:src|href)=")(\/[^"?#]+)(")/g, (full, open, path, close) => {
    const hashed = assetManifest[path];
    return hashed ? `${open}${hashed}${close}` : full;
  });
  return mapped ? rewritten.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n  ${mapped}`) : rewritten;
};
// Set only by scripts/dev.ts: reloads the page after a successful rebuild. Never set in production.
const liveReloadPort = process.env.MD3_LIVE_RELOAD_PORT;
const liveReloadScript = liveReloadPort
  ? `<script>if(window===top&&!window.__md3LiveReload){window.__md3LiveReload=new EventSource('http://127.0.0.1:${liveReloadPort}/');window.__md3LiveReload.onmessage=()=>location.reload()}</script>`
  : '';
const withLiveReload = (body: string) => liveReloadScript ? body.replace('</head>', `${liveReloadScript}</head>`) : body;
const html = (body: string, status = 200) => new Response(versionAssets(withLiveReload(body)), { status, headers: { ...commonHeaders, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': SHORT_CACHE } });
// Previews and example frames are pages inside pages: never a search result of their own.
const internalHtml = (body: string) => new Response(versionAssets(body), { headers: { ...commonHeaders, 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex', 'Cache-Control': SHORT_CACHE } });
const playgroundDirectory = componentDirectory(componentSlugs.map(slug => ({
  slug, name: components[slug].name, href: `/components/${slug}/`,
})));
const addonEntries = addonSlugs.map(slug => ({ slug, name: addons[slug].name, href: playgroundHref(slug) }))
  .sort((a, b) => a.name.localeCompare(b.name, 'en'));
const addonDirectory = { entries: addonEntries, sections: [{ id: 'addons', name: 'Add-ons', items: addonEntries }] };
function page(path: string, title: string, description: string, template: string, data: Record<string, unknown> = {}, status = 200) {
  const isDocs = path.startsWith('/docs');
  const isExamples = path.startsWith('/showcase');
  const isStyles = path.startsWith('/styles/');
  const isHome = path === '/';
  const isCatalog = template === 'catalog';
  const isComponentDetail = template === 'component' || template === 'component-tab';
  const isComponents = isCatalog || isComponentDetail;
  const isAddons = path.startsWith('/addons/');
  const directory = isAddons ? addonDirectory : playgroundDirectory;
  const sidebarGroups = isDocs ? documentationGroups : isExamples ? exampleGroups : isStyles ? stylesGroups : [];
  // Component docs lead to Styles, and Styles to the Showcase.
  const pager = status !== 200 ? ''
    // Components read in their drawer's order, the overview first (add-ons stay apart).
    : isComponents && !isAddons ? pagerHtml(componentsOrder, path, true)
    : sidebarGroups.length && template !== 'styles-themes' && template !== 'styles-color-lab' ? pagerHtml(readingOrder, path, true) : '';
  const componentDrawer = isComponents
    ? isAddons
      ? renderSectionDrawer(path, 'Add-ons list', [{ name: 'Add-ons overview', href: '/addons/' }, ...addonEntries])
      // A component's Develop or Accessibility tab marks the component itself.
      : renderSectionDrawer(path.replace(/(?:develop|accessibility)\/$/, ''), 'Component list', componentDrawerEntries(playgroundDirectory.entries))
    : '';
  const content = eta.render(template, { ...data, path, isCatalog, isAddons, icon, playgroundHref, linkable: (slug: string) => addonsPublic || !isAddon(slug), docGroups, guideGroup, guideGroups, components, componentDeprecations, playgroundDirectory: directory, componentDrawer, pager });
  const section = isDocs ? 'Docs' : isExamples ? 'Showcase' : isStyles ? 'Styles' : isAddons ? 'Add-ons' : isComponents ? 'Components' : '';
  const sectionDrawer = sidebarGroups.length ? renderSectionDrawer(path, `${section} links`, sidebarEntries(sidebarGroups, isDocs)) : '';
  // One built sheet per page type, the same files that page used to link. See stylesheetBundles.
  const catalogStyles = isAddons ? 'addons-catalog' : 'catalog';
  const panelStyles = isAddons ? 'addon-panel' : 'material-panel';
  const css: StylesheetBundle = isHome ? 'home' : isCatalog ? catalogStyles : isExamples ? 'examples' : isComponentDetail && data.panel ? panelStyles : template === 'component-tab' ? 'component-tab' : template === 'styles-themes' ? 'themes' : template === 'styles-color-lab' ? 'colour-lab' : isStyles ? 'styles' : 'page';
  const pageName = title.replace(/ — material$/, '');
  const jsonLd = status === 200 ? structuredData(path, pageName, description, section).map(jsonForScript) : [];
  return html(eta.render('base', {
    icon,
    skipTarget: isComponentDetail ? 'component-content' : 'content',
    // The page's Markdown twin, for AI tools (a guide, or a component's Develop or Accessibility tab).
    markdown: /^\/docs\/([a-z-]+)\/$/.exec(path) && isGuide(path.slice(6, -1)) ? `/docs/${path.slice(6, -1)}.md` : /^\/components\/[a-z-]+\/(develop|accessibility)\/$/.test(path) ? `${path.slice(0, -1)}.md` : null,
    path, title: documentTitle(path, pageName), description, noindex: isHiddenPath(path), showcasePublic, isHome, isExamples, themes, appBar, primaryRail: primaryRail(path === '/' ? '/' : primaryDestinations.find(item => item.label === section)?.href ?? ''), themeButton, themeMenu, modeButton, headerScope: HEADER_SCOPE, themeSheets, isCatalog, heroScene: isComponentDetail && !isAddons, catalogTokens, panelStylesheets: [...new Set([...[...new Set([...headerStylesheets, ...linkedStylesheets(primaryRail('/'))])], ...(data.panel ? linkedStylesheets(panelMarkup(data.panel as ReturnType<typeof materialPanel>)) : [])])], section, sectionDrawer, primaryDestinations, railSections: railSections(), jsonLd, css, script: template === 'styles-themes' ? 'theme-app' : template === 'styles-color-lab' ? 'colour-lab' : undefined,
    // The pager takes the page's own content width: the overviews' inset body, or a component
    // page's side padding.
    content: template === 'document' || template === 'component-tab' || !pager ? content
      : template === 'catalog' || template === 'docs' ? `${content}<div class="pager-wrap pager-wrap--overview"><div class="page-hero-body">${pager}</div></div>`
      : `${content}<div class="page-wrap pager-wrap${isComponentDetail ? ' pager-wrap--component' : ''}">${pager}</div>`,
  }), status);
}
const styleDescription = (href: string) => stylePages.find(entry => entry.href === href)!.description;
const stylesGroups = [{ label: 'Styles', items: stylePages.map(({ name, href }) => ({ name, href })) }];
const documentationGroups = [{ label: 'Docs', items: [{ name: 'Docs overview', href: '/docs/' }] }, ...guideGroups];
const escapeHtml = (text: string) => text.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
/**
 * A component's pages, as tabs under one header: the overview (the playground), its
 * developer documentation, and its accessibility notes, each its own page.
 */
type ComponentTab = 'overview' | 'playground' | 'develop' | 'accessibility';
const componentTabLabels: Record<ComponentTab, string> = { overview: 'Overview', playground: 'Playground', develop: 'Develop', accessibility: 'Accessibility' };
const componentTabIcons: Record<ComponentTab, string> = { overview: 'explore', playground: 'play_circle', develop: 'article', accessibility: 'accessibility_new' };
const componentTabHref = (slug: string, tab: ComponentTab) => tab === 'overview' ? `/components/${slug}/` : `/components/${slug}/${tab}/`;
/**
 * The API reference tables (options, methods, events, properties, fields) as entries: a
 * name, its type values as chips, its default, then its description, its parameters and
 * return value, or its payload. Other tables (keys, tokens) stay tables.
 */
function apiEntries(html: string): string {
  const cells = (row: string, tag: 'th' | 'td') => [...row.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'g'))].map(match => match[1]!.trim());
  return html.replace(/<div class="md-table"><table>([\s\S]*?)<\/table><\/div>/g, (table, body: string) => {
    const head = cells(/<thead>([\s\S]*?)<\/thead>/.exec(body)?.[1] ?? '', 'th').map(text => text.replace(/<[^>]+>/g, '').trim());
    if (!['Option', 'Method', 'Event', 'Property', 'Field'].includes(head[0] ?? '')) return table;
    const kind = head[0]!.toLowerCase();
    const rows = [...(/<tbody>([\s\S]*?)<\/tbody>/.exec(body)?.[1] ?? '').matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(match => cells(match[1]!, 'td'));
    const column = (row: string[], name: string) => { const index = head.indexOf(name); return index < 0 ? '' : row[index] ?? ''; };
    const blank = (value: string) => !value || value === '—' || value === '-';
    const entries = rows.map(row => {
      const type = column(row, 'Type'), fallback = column(row, 'Default'), parameters = column(row, 'Parameters'), returns = column(row, 'Returns'), payload = column(row, 'Data') || column(row, 'Payload');
      const facts = [
        blank(type) ? '' : `<div class="api-entry__fact"><span class="api-entry__key">Type</span><span class="api-entry__type">${type}</span></div>`,
        blank(fallback) ? '' : `<div class="api-entry__fact"><span class="api-entry__key">Default</span><span>${fallback}</span></div>`,
        blank(parameters) ? '' : `<div class="api-entry__fact"><span class="api-entry__key">Parameters</span><span class="api-entry__type">${parameters}</span></div>`,
        blank(returns) ? '' : `<div class="api-entry__fact"><span class="api-entry__key">Returns</span><span class="api-entry__type">${returns}</span></div>`,
        blank(payload) ? '' : `<div class="api-entry__fact"><span class="api-entry__key">Payload</span><span class="api-entry__type">${payload}</span></div>`,
      ].join('');
      return `<div class="api-entry api-entry--${kind}"><div class="api-entry__name">${row[0] ?? ''}</div>${blank(column(row, 'Description')) ? '' : `<p class="api-entry__description">${column(row, 'Description')}</p>`}${facts ? `<div class="api-entry__facts">${facts}</div>` : ''}</div>`;
    }).join('');
    return `<div class="api-list" role="list">${entries.replaceAll('<div class="api-entry ', '<div role="listitem" class="api-entry ')}</div>`;
  });
}

/** The developer documentation split at its Accessibility section: the Develop and Accessibility tabs. */
/**
 * A component's pages do not link to m3.material.io (the owner, 2026-11-25): a "See the M3 …
 * guidelines" sentence goes, and a citation inside the text keeps its words without the link.
 */
const withoutM3Links = (html: string) => html
  .replace(/\s*See\s+the\s+<a href="https:\/\/m3\.material\.io[^"]*">[^<]*<\/a>[^.<]*\./g, '')
  .replace(/<a href="https:\/\/m3\.material\.io[^"]*">([\s\S]*?)<\/a>/g, '$1');
function componentDocument(slug: string) {
  const rendered = renderDocument(slug);
  if (!rendered) return null;
  const document = { ...rendered, html: withoutM3Links(rendered.html) };
  // The tab's header carries the title: the document's own h1 goes.
  const html = document.html.replace(/<h1 id="[^"]*">[\s\S]*?<\/h1>\n?/, '');
  const start = html.indexOf('<h2 id="accessibility">');
  const end = start < 0 ? -1 : html.indexOf('<h2 ', start + 1);
  const accessibility = start < 0 ? '' : html.slice(start, end < 0 ? undefined : end);
  return {
    ...document,
    develop: apiEntries(start < 0 ? html : html.slice(0, start) + (end < 0 ? '' : html.slice(end))),
    developToc: document.toc.filter(item => item.id !== 'accessibility'),
    accessibility,
  };
}
/** A component's presentation: its document's opening paragraph. */
const componentIntro = (slug: string): string => componentDocument(slug)?.develop.match(/<p>[\s\S]*?<\/p>/)?.[0] ?? '';
const componentTabs = (slug: string): ComponentTab[] => ['overview', 'playground', 'develop', ...(componentDocument(slug)?.accessibility ? ['accessibility' as const] : [])];
/** The header every tab of a component shares: the overview's hero, then the tab bar. */
function componentHeader(slug: string, current: ComponentTab): string {
  const component = components[slug as keyof typeof components];
  const deprecation = componentDeprecations[slug as keyof typeof componentDeprecations];
  const note = deprecation ? `<p role="note"><strong>Deprecated.</strong> Use <a class="text-link" href="${escapeHtml(deprecation.href)}">${escapeHtml(deprecation.replacement)}</a> instead.</p>` : '';
  const tabs = componentTabs(slug).map(tab => `<a class="component-tabs__tab" href="${componentTabHref(slug, tab)}"${tab === current ? ' aria-current="page"' : ''}>${icon(componentTabIcons[tab])}<span>${componentTabLabels[tab]}</span></a>`).join('');
  return `<header class="page-hero component-hero"><div class="page-hero__text"><h1>${escapeHtml(component.name)}</h1><p>${escapeHtml(component.description)}</p>${note}</div>`
    // The art is a stage: the generated waves, and over them the component's live scene from
    // its overview card (a demo app bar's headline is not a heading of this page).
    + `<div class="component-hero__visual"><div class="page-hero__art" aria-hidden="true" data-seed="${escapeHtml(slug)}"></div>`
    + `<div class="component-hero__scene">${catalogVisuals[slug as keyof typeof catalogVisuals].replaceAll('<h1 part="headline"', '<h1 part="headline" role="presentation"')}</div></div></header>`
    + `<nav class="component-tabs" aria-label="${escapeHtml(component.name)} pages">${tabs}</nav>`;
}

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
    `<a href="${escapeHtml(item.href)}" rel="${rel}" class="page-nav__link page-nav__link--${rel}"><span class="page-nav__label">${rel === 'prev' ? `${icon('arrow_back')} Previous` : `Next ${icon('arrow_forward')}`}</span><span class="page-nav__title">${escapeHtml(title(item))}</span></a>`;
  return `<nav class="page-nav" aria-label="Previous and next">${prev ? link(prev, 'prev') : '<span></span>'}${next ? link(next, 'next') : ''}</nav>`;
}
// A document's framework chips row sits directly under its title and
// description: after the first paragraph that follows the h1.
const withFrameworkChips = (document: ReturnType<typeof renderDocument>) => {
  if (!document?.frameworks) return document;
  const row = frameworkChipsRow(() => true, 'docs-frameworks');
  const at = document.html.indexOf('</p>');
  return { ...document, html: at < 0 ? row + document.html : document.html.slice(0, at + 4) + '\n' + row + document.html.slice(at + 4) };
};
const exampleGroups = [{ label: 'Showcase', items: [{ name: 'Overview', href: '/showcase/' }, ...examples.map(example => ({ name: example.title, href: `/showcase/${example.slug}/` }))] }];
const primaryDestinations = [
  { label: 'Components', href: '/components/', icon: 'tab' },
  ...(addonsPublic ? [{ label: 'Add-ons', href: '/addons/', icon: 'add' }] : []),
  ...(stylesPublic ? [{ label: 'Styles', href: '/styles/', icon: 'palette' }] : []),
  ...(showcasePublic ? [{ label: exampleGroups[0]!.label, href: exampleGroups[0]!.items[0]!.href, icon: 'desktop_windows' }] : []),
  { label: 'Docs', href: '/docs/', icon: 'article' },
];
// The site's rail is material's navigation rail. The header slot holds search, which the
// page moves in from the phone's bar, and the button that opens the modal drawer on a tablet.
const railAttr = (value: string) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const railMark = '<img src="/assets/brand/mark.svg" width="24" height="24" alt="">';
const railMoveSearch = "<script>if (matchMedia('(width >= 600px)').matches) document.currentScript.parentElement.append(document.querySelector('#search-trigger'));</script>";
const railCache = new Map<string, string>();
const primaryRail = (current: string): string => {
  let markup = railCache.get(current);
  if (!markup) {
    const items = [{ label: 'Material', href: '/', markup: railMark }, ...primaryDestinations.map(item => ({ label: item.label, href: item.href, markup: icon(item.icon) }))]
      .map(item => `<m-navigation-rail-item value="${item.href}" href="${item.href}" icon="${railAttr(item.markup)}">${item.label}</m-navigation-rail-item>`).join('');
    const opener = `<button type="button" class="site-icon-button site-nav-button" id="site-nav-open" aria-label="Expand navigation" aria-haspopup="dialog" aria-expanded="false" aria-controls="site-nav-dialog" hidden>${icon('menu')}</button>`;
    markup = renderElement('m-navigation-rail', { ...(current ? { value: current } : {}), 'no-toggle': true, 'aria-label': 'Primary navigation' }, `<div slot="header" class="site-rail-top ${HEADER_SCOPE}">RAIL_HEADER</div>${items}`, renderStyles)
      .replace('RAIL_HEADER', () => headerScopeScript + opener + railMoveSearch);
    railCache.set(current, markup);
  }
  return markup;
};
/** A section page's own drawer: its groups, and on Docs every component's reference. */
function sidebarEntries(groups: readonly { label: string; items: readonly { name: string; href: string }[] }[], isDocs: boolean) {
  return [
    // Docs' first group is its overview alone, under no header (as Components overview is).
    ...groups.flatMap((group, index) => [...(isDocs && index === 0 ? [] : [{ name: group.label }]), ...group.items]),
    // Docs is the guides: a component's documentation is its Develop tab. Add-ons stay here
    // while they are public without tabs of their own.
    ...(isDocs && addonsPublic ? [{ name: addonDocGroup.label }, ...addonDocGroup.items] : []),
  ];
}
/** Each rail destination's drawer rows, in the page, so resting on the rail fills the drawer at once. */
let railSectionsJson = '';
function railSections(): string {
  if (railSectionsJson) return railSectionsJson;
  const sections: Record<string, { label: string; rows: string }> = {
    '/components/': { label: 'Component list', rows: drawerItems(componentDrawerEntries(playgroundDirectory.entries)) },
    ...(stylesPublic ? { '/styles/': { label: 'Styles links', rows: drawerItems(sidebarEntries(stylesGroups, false)) } } : {}),
    '/docs/': { label: 'Docs links', rows: drawerItems(sidebarEntries(documentationGroups, true)) },
  };
  if (addonsPublic) sections['/addons/'] = { label: 'Add-ons list', rows: drawerItems([{ name: 'Add-ons overview', href: '/addons/' }, ...addonEntries]) };
  if (showcasePublic) sections['/showcase/'] = { label: 'Showcase links', rows: drawerItems(sidebarEntries(exampleGroups, false)) };
  // Safe inside a script element: no "</script" can survive the escape.
  return railSectionsJson = JSON.stringify(sections).replaceAll('<', '\\u003c');
}
/** The reading order across sections, a cycle: the documentation, Styles, the Showcase, and back. */
const documentationOrder = [...documentationGroups, ...(addonsPublic ? [addonDocGroup] : [])];
/** The components overview, then every component in the drawer's order: a loop. */
const componentsOrder: PagerItem[] = [{ name: 'Components overview', href: '/components/' }, ...playgroundDirectory.entries.flatMap(entry => 'items' in entry ? entry.items : [entry])
  // Each component's tabs in turn: "Button: Develop".
  .flatMap(({ name, slug }) => componentTabs(slug).map(tab => ({ name: tab === 'overview' ? name : `${name}: ${componentTabLabels[tab]}`, href: componentTabHref(slug, tab) })))]
  .map(({ name, href }) => ({ name, href, section: 'Components' }));
const readingOrder = [documentationOrder, ...(stylesPublic ? [stylesGroups] : []), ...(showcasePublic ? [exampleGroups] : [])].flatMap(groups => groups.flatMap(group => group.items.map(item => ({ ...item, section: groups[0]!.label }))));

// material's light-DOM stylesheets for a set of components, dependencies first: each
// dist/material/styles/<name>.js imports the stylesheets its component needs.
// material-addons' components are not material's: their light-DOM styles ship as that
// package's one stylesheet (dist/material-addons/styles.css, copied by the build), so an
// example using any of them links that sheet instead.
const ADDONS_COMPONENTS = new Set<string>(addonSlugs);
const addonsStylesheet = (names: string[]): string[] => (names.some(name => ADDONS_COMPONENTS.has(name)) ? ['styles'] : []);
function styleClosure(names: string[]): string[] {
  const order: string[] = [];
  const visit = (slug: string) => {
    // Site slugs can lead a library rename; CSS still uses the installed module name.
    const name = slug === 'app-bar' ? 'top-app-bar' : slug === 'navigation-drawer' ? 'drawer' : slug;
    if (order.includes(name) || ADDONS_COMPONENTS.has(name)) return;
    const module = resolve(root, 'dist/material/styles', `${name}.js`);
    const source = existsSync(module) ? readFileSync(module, 'utf8') : '';
    for (const [, dependency] of source.matchAll(/import "\.\/([a-z-]+)\.js"/g)) if (dependency !== name) visit(dependency!);
    order.push(name);
  };
  names.forEach(visit);
  return order;
}

/** The components in the Styles frames (src/client/styles-frame.ts): the preview's screen and the Shape gallery. */
const STYLES_FRAME_COMPONENTS = ['app-bar', 'icon-button', 'chips', 'card', 'text-field', 'switch', 'slider', 'button', 'fab', 'dialog', 'checkbox'];
/** The Shape page's expressive shapes, drawn by mtrl/core/shapes, and each theme's primary container to fill them. */
const shapeLibrary = SHAPE_NAMES.map(name => ({ name, label: SHAPE_LABELS[name], path: shapePath(name) }));
const libraryColors = Object.fromEntries(Object.entries(themeTokens).map(([theme, modes]) => [theme, Object.fromEntries((['light', 'dark'] as const).map(mode => [mode, [modes[mode]['primary-container']?.value, modes[mode]['on-primary-container']?.value]]))]));
const mime: Record<string, string> = { '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8' };
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
  // The documentation as Markdown, for AI tools and crawlers (markdown-docs.ts).
  if (path === '/llms.txt') return text(request.method === 'HEAD' ? null : llmsTxt(), 'text/plain');
  if (path === '/llms-full.txt') return text(request.method === 'HEAD' ? null : llmsFullTxt(), 'text/plain');
  const guideMarkdown = /^\/docs\/([a-z-]+)\.md$/.exec(path);
  if (guideMarkdown && isGuide(guideMarkdown[1]!)) return text(request.method === 'HEAD' ? null : documentMarkdown(guideMarkdown[1]!), 'text/markdown');
  const tabMarkdown = /^\/components\/([a-z-]+)\/(develop|accessibility)\.md$/.exec(path);
  if (tabMarkdown && isComponent(tabMarkdown[1]!) && !isAddon(tabMarkdown[1]!)) {
    const body = componentTabMarkdown(tabMarkdown[1]!, tabMarkdown[2] as 'develop' | 'accessibility');
    if (body) return text(request.method === 'HEAD' ? null : body, 'text/markdown');
  }
  // GET /api/search?q=…&limit=… — the site search dialog's results.
  if (path === '/api/search' || path === '/api/search/') {
    const q = url.searchParams.get('q') ?? '';
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 10));
    const body = request.method === 'HEAD' ? null : JSON.stringify({ query: q, results: searchSite(q, limit) });
    return new Response(body, { headers: { ...commonHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Robots-Tag': 'noindex' } });
  }
  if (!path.endsWith('/') && !extname(path)) return new Response(null, { status: 308, headers: { Location: `${url.pathname}/${url.search}` } });
  let response: Response;
  const componentMatch = /^\/(components|addons|preview)\/([a-z-]+)\/$/.exec(path);
  // A component's Playground tab: the playground, on its own page.
  const playgroundMatch = /^\/components\/([a-z-]+)\/playground\/$/.exec(path);
  const componentTabMatch = /^\/components\/([a-z-]+)\/(develop|accessibility)\/$/.exec(path);
  // A renamed component's old documentation address goes straight to its Develop tab, in one redirect.
  const movedDoc = (to: string) => to.startsWith('/docs/components/') ? `/components/${to.slice(17, -1)}/develop/` : to;
  if (path === '/') response = page(path, 'material — Material Design for the web', 'Material Design 3 components in TypeScript. Explore the components, make them your own, and bring them to any web project.', 'homepage', { install: renderInstall(installSpecifier(mtrlVersion)), shaking: treeShaking(Object.fromEntries(componentSlugs.map(slug => [slug, components[slug].name])), [['Actions', ['button', 'fab']], ['Selection & input', ['checkbox', 'text-field']], ['Navigation', ['tabs', 'navigation-bar']], ['Containment', ['card', 'dialog']], ['Communication', ['snackbar', 'tooltip']]]) });
  else if (path === '/components/top-app-bar/' || path === '/docs/components/top-app-bar/' || path === '/preview/top-app-bar/') response = new Response(null, { status: 301, headers: { ...commonHeaders, Location: movedDoc(path.replace('top-app-bar', 'app-bar')) + url.search } });
  else if (path === '/components/drawer/' || path === '/docs/components/drawer/' || path === '/preview/drawer/') response = new Response(null, { status: 301, headers: { ...commonHeaders, Location: movedDoc(path.replace('/drawer/', '/navigation-drawer/')) + url.search } });
  // Bottom app bar left the site for Toolbar; its published URLs keep working.
  else if (path === '/components/bottom-app-bar/' || path === '/docs/components/bottom-app-bar/' || path === '/preview/bottom-app-bar/') response = new Response(null, { status: 301, headers: { ...commonHeaders, Location: movedDoc(path.replace('bottom-app-bar', 'toolbar')) + url.search } });
  else if (path === '/components/') response = page(path, 'Components — material', 'Material 3 Expressive components for the web, Material Design 3\'s latest: try each one live, then copy its code for React, Vue, Svelte, SolidJS or vanilla JS.', 'catalog', { catalogCard: (slug: Parameters<typeof catalogCard>[0], href: string, deprecated: boolean) => catalogCard(slug, href, deprecated, isComponent(slug) && !isAddon(slug) ? componentTabs(slug).filter(tab => tab !== 'overview').map(tab => ({ label: componentTabLabels[tab], href: componentTabHref(slug, tab), icon: tab === 'playground' ? undefined : icon(tab === 'develop' ? 'code' : componentTabIcons[tab]) })) : []), catalogVisuals });
  else if (path === '/addons/') response = page(path, 'Add-ons — material', 'Explore add-on components built on Material design tokens.', 'catalog', { catalogCard, catalogVisuals, install: renderInstall('material-addons material') });
  else if (componentMatch && isComponent(componentMatch[2]!) &&
    (componentMatch[1] === 'preview' || path === playgroundHref(componentMatch[2]!))
    || (playgroundMatch && isComponent(playgroundMatch[1]!) && !isAddon(playgroundMatch[1]!))) {
    const slug = (playgroundMatch?.[1] ?? componentMatch![2])! as keyof typeof components;
    const component = components[slug];
    const onPlayground = !!playgroundMatch;
    response = componentMatch?.[1] === 'preview'
      ? internalHtml(eta.render('preview', { themes, themeSheets, slug, component, addonStyles: isAddon(slug) ? ['styles'] : [] }))
      // The Overview: one section per scenario, each live (component-overview.ts).
      : !onPlayground && !isAddon(slug) ? page(path, `${component.name} — material`, `The Material 3 Expressive ${component.name.toLowerCase()} for the web: each way to use it, live, with its code for React, Vue, Svelte, SolidJS or vanilla JS. ${component.description}`, 'component-tab', {
        // The component's intro leads the Overview; the framework chips stay on the Playground.
        slug, componentHeader: componentHeader(slug, 'overview'), frameworksRow: `<div class="component-intro component-intro--overview">${componentIntro(slug)}</div>`,
        ...componentOverview(slug, { playground: componentTabHref(slug, 'playground'), develop: componentTabHref(slug, 'develop'), codeIcon: icon('code'), playIcon: icon('play_circle') }),
      })
      : page(path, `${component.name}: Playground — material`, `The Material 3 Expressive ${component.name.toLowerCase()} for the web, live: copy its code for React, Vue, Svelte, SolidJS or vanilla JS. ${component.description}`, 'component', { component, slug, componentHeader: isAddon(slug) ? '' : componentHeader(slug, 'playground'), intro: isAddon(slug) ? '' : componentIntro(slug), documentationHref: docHref(slug), icons: componentIcons, themes, element: elementMeta(slug), size: componentSize(slug), usedIn: showcasePublic ? examplesUsingComponent(slug) : [], panel: materialPanel(component, slug, themes, !!elementMeta(slug)) });
  }
  else if (path === '/showcase/') response = page(path, 'Showcase — material', 'The same interfaces in every framework: web components, React, Vue, Svelte, Solid and vanilla.', 'examples', { examples, componentFilters: filterChips('Filter by component', 'component', exampleComponents), tagFilters: filterChips('Filter by tag', 'tag', exampleTags) });
  // Examples became the Showcase (owner, 2026-11-18): every old /examples/… page answers 301
  // to its /showcase/ twin, the query kept (the browser keeps the fragment).
  else if (path === '/examples/' || /^\/examples\/[a-z-]+\/(frame\/[a-z]+\/)?$/.test(path)) {
    response = new Response(null, { status: 301, headers: { ...commonHeaders, Location: `/showcase/${path.slice('/examples/'.length)}${url.search}` } });
  }
  else if (/^\/showcase\/[a-z-]+\/(frame\/[a-z]+\/)?$/.test(path)) {
    const [, slug, , framework] = /^\/showcase\/([a-z-]+)\/(frame\/([a-z]+)\/)?$/.exec(path)!;
    const example = exampleBySlug(slug!);
    const variants = example ? exampleVariants(slug!) : null;
    if (!example || !variants) response = page(path, 'Page not found — material', 'This page could not be found.', 'not-found', {}, 404);
    else if (framework) {
      response = variants.some(v => v.id === framework)
        ? internalHtml(eta.render('example-frame', { example, framework, themes, themeSheets, styles: styleClosure(example.components), addonStyles: addonsStylesheet(example.components) }))
        : page(path, 'Page not found — material', 'This page could not be found.', 'not-found', {}, 404);
    }
    else response = page(path, `${example.title} example — material`, example.description, 'example', { example, variants, themes, frameworksRow: frameworkChipsRow(id => variants.some(variant => variant.id === id)), copyButton: showcaseCopyButton(),
      // The address's framework when the example has it, so the first paint (frame and source)
      // is the one the address names; otherwise its first variant. The client keeps it in step.
      // ?view=code opens Code at first paint (the fragment #code is client-only).
      framework: variants.some(variant => variant.id === url.searchParams.get('framework')) ? url.searchParams.get('framework')! : variants[0]!.id,
      view: url.searchParams.get('view') === 'code' ? 'code' : 'preview',
      viewTabs: exampleViewTabs(url.searchParams.get('view') === 'code' ? 'code' : 'preview') });
  }
  else if (path === '/styles/frame/') response = internalHtml(eta.render('styles-frame', { themes, themeSheets, styles: styleClosure(STYLES_FRAME_COMPONENTS) }));
  else if (path === '/styles/') response = page(path, 'Styles — material', styleDescription('/styles/'), 'styles-overview', { stylePages, comingStyles, themeBase });
  else if (path === '/styles/themes/') {
    const linked = url.searchParams.get('theme');
    response = page(path, 'Themes — material', styleDescription('/styles/themes/'), 'styles-themes', { themes: builtInThemes, roles: THEME_ROLES, selected: linked && themes.includes(linked as never) ? linked : 'baseline', mtrlVersion, themeBase });
  }
  else if (path === '/styles/color/') response = page(path, 'Color — material', styleDescription('/styles/color/'), 'styles-color', { themes, themeTokens, colorGroups, missingGroups, mtrlVersion, pairFor, contrastRatio, AA_TEXT, themeBase });
  else if (path === '/styles/color-lab/') response = page(path, 'Colour Lab — material', styleDescription('/styles/color-lab/'), 'styles-color-lab', { seeds: LAB_SEEDS, variants: LAB_VARIANTS, samples: LAB_SAMPLES, roleGroups: LAB_ROLE_GROUPS });
  else if (path === '/styles/typography/') response = page(path, 'Typography — material', styleDescription('/styles/typography/'), 'styles-typography', { typescale, unloadedFonts, mtrlVersion, roleUsage, fontWeights, components, themeBase });
  else if (path === '/styles/shape/') response = page(path, 'Shape — material', styleDescription('/styles/shape/'), 'styles-shape', { shape: themeBase.shape, mtrlVersion, themeBase, cornerMax: CORNER_MAX, m3Scale: M3_CORNER_SCALE, m3ShapeCount: M3_SHAPE_COUNT, library: shapeLibrary, libraryColors });
  else if (path === '/privacy/') response = page(path, 'Privacy — material', 'How md3.io counts visits, what it keeps in your browser, and how to reach us.', 'privacy');
  else if (path === '/credits/') response = page(path, 'Credits — material', 'The design system, fonts and icons md3.io and the material library build on.', 'credits');
  else if (path === '/docs/') response = page(path, 'Docs — material', 'Guides to Material Design 3 on the web: getting started, frameworks, theming, server rendering and how the material library works.', 'docs', { docCard });
  else if (path === '/docs/components/components/') response = new Response(null, { status: 301, headers: { ...commonHeaders, Location: '/docs/architecture/' } });
  else if (path === '/docs/components/segmented-button/') response = new Response(null, { status: 301, headers: { ...commonHeaders, Location: `/components/button-group/develop/${url.search}` } });
  else if (path === '/components/textfield/' || path === '/preview/textfield/' || path === '/docs/components/textfield/') response = new Response(null, { status: 301, headers: { ...commonHeaders, Location: `${movedDoc(path.replace('textfield', 'text-field'))}${url.search}` } });
  // The six framework guides are one Frameworks page: their URLs, and the guides' older
  // /docs/components/<slug>/ ones, answer 301 to it with that framework chosen.
  else if (componentTabMatch && isComponent(componentTabMatch[1]!) && !isAddon(componentTabMatch[1]!) && componentTabs(componentTabMatch[1]!).includes(componentTabMatch[2] as ComponentTab)) {
    const slug = componentTabMatch[1]!;
    const tab = componentTabMatch[2] as 'develop' | 'accessibility';
    const document = componentDocument(slug)!;
    const component = components[slug];
    response = page(path, `${component.name}: ${componentTabLabels[tab]} — material`, tab === 'develop' ? `${component.name} API: options, methods, events and examples, for vanilla JS, Web Components, React, Vue, Svelte and SolidJS. Material Design 3 for the web.` : `How the Material Design 3 ${component.name.toLowerCase()} works with a keyboard and a screen reader: its roles, names and focus, in the material library.`, 'component-tab', {
      slug, componentHeader: componentHeader(slug, tab),
      // The framework switcher heads every tab, icons only, at the right.
      frameworksRow: frameworkChipsRow(() => true, 'docs-frameworks component-frameworks'),
      html: tab === 'develop' ? document.develop : document.accessibility,
      toc: [...(tab === 'develop' ? document.developToc : [{ id: 'accessibility', title: 'Accessibility' }])],
      frameworks: tab === 'develop' && document.frameworks,
    });
  }
  else if (/^\/docs\/(?:components\/)?[a-z-]+\/$/.test(path) && path.split('/').at(-2)! in FRAMEWORK_GUIDES) {
    // The request's other query parameters carry over; the fragment stays with the browser
    // (a Location without one keeps the request's), and the Frameworks page maps an old
    // guide anchor to its prefixed heading (docs-frameworks.ts).
    const location = new URL(frameworkHref(FRAMEWORK_GUIDES[path.split('/').at(-2)!]!), url);
    for (const [key, value] of url.searchParams) if (key !== 'framework') location.searchParams.append(key, value);
    response = new Response(null, { status: 301, headers: { ...commonHeaders, Location: location.pathname + location.search } });
  }
  else if (/^\/docs\/[a-z-]+\/$/.test(path) && isGuide(path.slice(6, -1)) && renderDocument(path.slice(6, -1))) {
    const slug = path.slice(6, -1);
    const document = renderDocument(slug)!;
    response = page(path, `${document.title} — material`, document.description, 'document', { ...withFrameworkChips(document)!, playground: null });
  }
  else {
    const match = /^\/docs\/(components|addons)\/([a-z0-9-]+)\/$/.exec(path);
    const slug = match?.[2];
    // A component's documentation moved to its Develop tab (the browser keeps the #anchor;
    // site-content.ts sends #accessibility on to the Accessibility tab).
    if (slug && match?.[1] === 'components' && (isGuide(slug) || slug === 'form' || slug === 'colorpicker' || isComponent(slug))) {
      return new Response(null, { status: 301, headers: { ...commonHeaders, Location: docHref(slug) + url.search } });
    }
    const document = slug && path === docHref(slug) ? renderDocument(slug) : null;
    response = document
      ? page(path, `${document.title} documentation — material`, `Configuration, methods, and examples for ${document.title}.`, 'document', { ...withFrameworkChips(document)!, playground: slug && isComponent(slug) ? playgroundHref(slug) : null })
      : page(path, 'Page not found — material', 'This page could not be found.', 'not-found', {}, 404);
  }
  return request.method === 'HEAD' ? new Response(null, { status: response.status, headers: response.headers }) : response;
}
if (import.meta.main) {
  const server = Bun.serve({ port: Number(process.env.PORT || 4300), hostname: process.env.HOST || '127.0.0.1', fetch: handleRequest });
  console.log(`md3.io ready at ${server.url}`);
}
