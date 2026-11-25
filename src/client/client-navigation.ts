// Progressive enhancement only: the server remains the source of every page and head.
// https://developer.mozilla.org/en-US/docs/Web/API/NavigateEvent/intercept
// https://developer.mozilla.org/en-US/docs/Web/API/Element/moveBefore
import './site-content';
import { closeSiteNavigation } from './site-navigation';
import { preparePage, enterPage, leavePage, pageInitializations, updatingPageURL } from './page-lifecycle';
import { currentAppearance } from './appearance';
import { applyTheme } from './theme-sheets';

const shell = document.documentElement.dataset.navigationShell;
const content = document.getElementById('content');
const layout = document.querySelector('.layout-main');
const api = window.navigation;
const positions = new Map<string, [number, number]>();
let fallbackKey = history.state?.md3Navigation ?? crypto.randomUUID();
let renderedURL = location.href;
let request: AbortController | undefined;
let persistentDrawer = document.querySelector<Drawer>('m-drawer.site-drawer');
const drawerStates = new Map<string, { expanded: string[]; scroll: number }>();
type Drawer = HTMLElement & { value: string; getExpandedSections?(): string[]; expandSection?(id: string): void };
const key = () => api?.currentEntry?.key ?? fallbackKey;
const remember = () => positions.set(key(), [scrollX, scrollY]);
if (!api) history.replaceState({ ...history.state, md3Navigation: fallbackKey }, '');
addEventListener('scroll', remember, { passive: true });
const status = document.createElement('span');
status.setAttribute('role', 'status');
status.setAttribute('aria-live', 'polite');
status.className = 'sr-only navigation-announcement';
document.body.append(status);

function eligible(url: URL) {
  // These HTML documents deliberately have a different shell and no site router.
  // Keep their native history entry rather than first committing an API intercept.
  const frame = /^\/preview\//.test(url.pathname) || url.pathname === '/styles/frame/' || /^\/showcase\/[^/]+\/frame\//.test(url.pathname);
  return !frame && url.origin === location.origin && /^https?:$/.test(url.protocol);
}
function excluded(link: Element | null | undefined) {
  return !!link?.closest('[data-full-load], [download], [target]');
}
function closeShell() {
  closeSiteNavigation();
  for (const dialog of document.querySelectorAll<HTMLDialogElement>('dialog[open]')) dialog.close();
  document.querySelector<HTMLElement & { hide?(): void }>('.header__themes m-menu')?.hide?.();
}
function move(node: Element, parent: Element, before: Node | null = null) {
  if (typeof parent.moveBefore === 'function') parent.moveBefore(node, before);
  else parent.insertBefore(node, before);
}
function drawerSignature(drawer: Element) {
  return [...drawer.querySelectorAll('m-drawer-item[href]')].map(item => item.getAttribute('href')).join('|');
}
/**
 * Another tab of the same component (Overview, Develop, Accessibility): the pages share their
 * hero and tab bar, so those stay as they are (the live scene keeps running) and only the
 * body under them changes.
 */
function sameComponentTabs(next: Document): boolean {
  const seed = (doc: Document | Element) => doc.querySelector<HTMLElement>('.component-hero .page-hero__art')?.dataset.seed;
  const here = content ? seed(content) : undefined;
  return !!here && here === seed(next) && !!content?.querySelector('.component-tabs') && !!next.querySelector('.component-tabs');
}
function swapBody(next: Document, keepHeader = false) {
  if (!content || !layout) throw new Error('Missing site shell');
  const nextMain = next.getElementById('content')!;
  const oldChildren = [...content.childNodes];
  const oldIndex = layout.querySelector(':scope > #section-index');
  const nextIndex = next.getElementById('section-index');
  const oldPane = persistentDrawer?.closest<HTMLElement>('.component-list, #sidebar');
  const previousScroll = oldPane?.scrollTop ?? 0;
  const signature = persistentDrawer ? drawerSignature(persistentDrawer) : '';
  if (persistentDrawer && oldPane) drawerStates.set(signature, {
    expanded: persistentDrawer.getExpandedSections?.() ?? [], scroll: previousScroll,
  });
  // Insert the destination while connected, then move the live drawer before removing
  // old content. moveBefore preserves its custom-element instance and pill animation.
  // Adopted, not imported: an import copies nodes without their shadow roots, so the
  // server-rendered material elements (cards, drawers) arrived empty and unstyled.
  // The destination drawer's selection, read before adoption empties the parsed page.
  const destinationValue = nextMain.querySelector('m-drawer')?.getAttribute('value') ?? nextIndex?.querySelector('m-drawer')?.getAttribute('value') ?? '';
  if (nextIndex) layout.insertBefore(document.adoptNode(nextIndex), content);
  content.append(...[...nextMain.childNodes].map(node => document.adoptNode(node)));
  if (keepHeader) {
    const fresh = (selector: string) => [...content.querySelectorAll<HTMLElement>(selector)].find(node => !oldChildren.some(old => old.contains(node)));
    const kept = (selector: string) => [...content.querySelectorAll<HTMLElement>(selector)].find(node => oldChildren.some(old => old.contains(node)));
    for (const selector of ['.component-hero', '.component-tabs']) {
      const old = kept(selector), incoming = fresh(selector);
      if (!old || !incoming) continue;
      // The destination's current tab, on the bar that stays.
      if (selector === '.component-tabs') for (const link of old.querySelectorAll('a')) {
        const current = incoming.querySelector(`a[href="${CSS.escape(link.getAttribute('href') ?? '')}"]`)?.getAttribute('aria-current');
        if (current) link.setAttribute('aria-current', current); else link.removeAttribute('aria-current');
      }
      move(old, incoming.parentElement!, incoming);
      incoming.remove();
    }
  }
  const replacement = [...layout.querySelectorAll<Drawer>('m-drawer.site-drawer:not(.site-rail-drawer m-drawer)')].find(drawer => drawer !== persistentDrawer && !oldChildren.some(node => node.contains(drawer)) && !oldIndex?.contains(drawer));
  const nextSignature = replacement ? drawerSignature(replacement) : '';
  if (replacement && persistentDrawer && nextSignature !== signature) {
    // Another section: use the destination's server-rendered drawer, exactly as a direct
    // load does. Re-filling a live drawer with another section's items can leave its
    // shadow list unrendered (blank Showcase drawer after Docs -> Showcase).
    const previous = persistentDrawer;
    persistentDrawer = replacement;
    if (previous.closest('#navigation-drawer-parking')) previous.remove();
    const state = drawerStates.get(nextSignature);
    queueMicrotask(() => {
      for (const id of state?.expanded ?? []) replacement.expandSection?.(id);
      const pane = replacement.closest<HTMLElement>('.component-list, #sidebar');
      if (pane) pane.scrollTop = state?.scroll ?? 0;
    });
  } else if (replacement && persistentDrawer) {
    // Same section: keep the live drawer so its selection pill animates to the new item.
    move(persistentDrawer, replacement.parentElement!, replacement);
    replacement.remove();
    const selected = destinationValue;
    persistentDrawer.value = selected;
    persistentDrawer.setAttribute('value', selected);
    // Declarative changes are observed in a microtask; expand through the public API.
    queueMicrotask(() => {
      if (persistentDrawer) persistentDrawer.value = selected;
      const state = drawerStates.get(nextSignature);
      for (const id of state?.expanded ?? []) persistentDrawer?.expandSection?.(id);
      const current = persistentDrawer?.querySelector(`m-drawer-item[href="${CSS.escape(new URL(location.href).pathname)}"]`);
      const family = current?.parentElement;
      if (family?.localName === 'm-drawer-item') persistentDrawer?.expandSection?.(family.getAttribute('value')!);
      const pane = persistentDrawer?.closest<HTMLElement>('.component-list, #sidebar');
      if (pane) pane.scrollTop = state?.scroll ?? previousScroll;
    });
  } else if (replacement) persistentDrawer = replacement;
  else if (persistentDrawer) {
    let parking = document.getElementById('navigation-drawer-parking');
    if (!parking) { parking = document.createElement('div'); parking.id = 'navigation-drawer-parking'; parking.hidden = true; document.body.append(parking); }
    move(persistentDrawer, parking);
  }
  oldIndex?.remove();
  for (const node of oldChildren) node.remove();
  document.body.className = next.body.className;
  document.querySelector('.skip-link')?.setAttribute('href', next.querySelector('.skip-link')?.getAttribute('href') ?? '#content');
  const nextLinks = next.querySelectorAll('.site-nav-link');
  document.querySelectorAll('.site-nav-link').forEach((link, index) => {
    const current = nextLinks[index]?.getAttribute('aria-current');
    if (current) link.setAttribute('aria-current', current); else link.removeAttribute('aria-current');
  });
  const railSelector = '#site-primary-rail m-navigation-rail';
  const railValue = next.querySelector(railSelector)?.getAttribute('value');
  const rail = document.querySelector<HTMLElement & { value: string | null }>(railSelector);
  if (railValue) rail?.setAttribute('value', railValue); else rail?.removeAttribute('value');
  // After a click the element follows its property, not the attribute: Back needs both.
  if (rail && customElements.get('m-navigation-rail')) rail.value = railValue ?? null;
}
function pageScripts(doc: Document, origin = location.origin) {
  return [...doc.querySelectorAll<HTMLScriptElement>('script[type="module"][src]')].flatMap(script => {
    const src = new URL(script.getAttribute('src')!, origin);
    // Third-party scripts the host injects into every page (Cloudflare Web Analytics in
    // production) already run once in the shell; they are not page modules.
    if (src.origin !== origin) return [];
    const match = /^\/dist\/(catalog|examples|playground-material|playground|styles|theme-app|colour-lab)(?:\.[a-f0-9]{10})?\.js$/.exec(src.pathname);
    if (/^\/dist\/site(?:\.[a-f0-9]{10})?\.js$/.test(src.pathname)) return [];
    if (!match) throw new Error('Unmanaged page script');
    return [{ src, name: match[1]! }];
  });
}
const pageStyles = (doc: Document) => [...doc.querySelectorAll<HTMLLinkElement>('head link[rel="stylesheet"]')]
  .filter(link => new URL(link.getAttribute('href')!, location.origin).pathname.startsWith('/dist/css/'));
const headSelector = 'meta[name="description"], meta[property^="og:"], meta[name^="twitter:"], link[rel="canonical"], script[type="application/ld+json"], [data-page-head]';
function swapHead(next: Document, url: URL) {
  document.title = next.title;
  document.querySelectorAll(`head > :is(${headSelector})`).forEach(node => node.remove());
  for (const node of next.head.querySelectorAll(headSelector)) document.head.append(document.importNode(node, true));
  // Keep runtime theme and package-manager choices. Server attributes such as lang,
  // dir and framework still follow the destination, then its URL/storage preference.
  for (const attribute of [...document.documentElement.attributes]) {
    if (!attribute.name.startsWith('data-theme') && !['data-nav-drawer-leaving', 'data-site-theme', 'data-preview-mode', 'data-package-manager', 'style'].includes(attribute.name)) document.documentElement.removeAttribute(attribute.name);
  }
  for (const attribute of next.documentElement.attributes) document.documentElement.setAttribute(attribute.name, attribute.value);
  let saved: string | null = null;
  try { saved = localStorage.getItem('md3-example-framework'); } catch { /* Optional storage. */ }
  const asked = url.pathname.startsWith('/docs/') ? url.searchParams.get('framework') : null;
  const frameworks = ['vanilla', 'html', 'react', 'vue', 'svelte', 'solid'];
  const framework = asked && frameworks.includes(asked) ? asked : saved;
  if (framework && frameworks.includes(framework)) {
    document.documentElement.dataset.framework = framework;
    if (framework === asked) try { localStorage.setItem('md3-example-framework', framework); } catch { /* Optional storage. */ }
  }
}
async function styles(next: Document, signal: AbortSignal) {
  const needed = [...next.querySelectorAll<HTMLLinkElement>('head link[rel="stylesheet"]:not([data-theme-sheet])')];
  await Promise.all(needed.map(sheet => {
    const href = new URL(sheet.getAttribute('href')!, location.origin).href;
    const existing = [...document.querySelectorAll<HTMLLinkElement>('head link[rel="stylesheet"]')].find(link => link.href === href);
    if (existing?.sheet) return;
    const link = existing ?? document.importNode(sheet, true);
    link.href = href;
    if (!existing) link.media = 'not all';
    return new Promise<void>((resolve, reject) => {
      const clean = () => { link.removeEventListener('load', loaded); link.removeEventListener('error', failed); signal.removeEventListener('abort', failed); };
      const loaded = () => { clean(); resolve(); };
      const failed = () => { clean(); if (!existing) link.remove(); reject(new Error('Stylesheet unavailable')); };
      link.addEventListener('load', loaded, { once: true });
      link.addEventListener('error', failed, { once: true });
      signal.addEventListener('abort', failed, { once: true });
      if (!existing) document.head.append(link);
    });
  }));
}
// Only the closing modal drawer is snapshotted: it slides out while the page changes live
// behind it. Nothing else is captured, so nothing can be stretched between two pages.
function nameTransitionContent() {
  document.documentElement.style.viewTransitionName = 'none';
  // Shell chrome stays out of snapshots, so the real drawer pill keeps animating on screen.
  for (const shellElement of document.querySelectorAll<HTMLElement>('.header, #site-primary-rail, #site-primary-bar, m-drawer.site-drawer')) shellElement.style.viewTransitionName = 'none';
  // The modal drawer leaves as part of the same transition: it slides out from its last frame
  // while the content changes behind it, instead of vanishing when the page swaps.
  const modalDrawer = document.querySelector<HTMLDialogElement>('#site-nav-dialog');
  if (modalDrawer?.open) {
    modalDrawer.style.viewTransitionName = 'site-nav-drawer';
    document.documentElement.dataset.navDrawerLeaving = '';
  } else if (modalDrawer) modalDrawer.style.viewTransitionName = '';
  content!.style.viewTransitionName = '';
}
function hashTarget(url: URL) {
  let id: string;
  try { id = decodeURIComponent(url.hash.slice(1)); } catch { id = url.hash.slice(1); }
  return document.getElementById(id) ?? document.getElementById(`${document.documentElement.dataset.framework}-${id}`);
}
/**
 * After a tab switch the tabs stay where they were: stuck at the top, the new body starts
 * under them; not yet stuck, the page does not move. Focus goes to the page's title, as on
 * any navigation, without scrolling.
 */
function keepTabs(scrolled: number) {
  const tabs = content?.querySelector<HTMLElement>('.component-tabs');
  const hero = content?.querySelector<HTMLElement>('.component-hero');
  const title = content?.querySelector<HTMLElement>('h1');
  if (title) { if (!title.hasAttribute('tabindex')) title.tabIndex = -1; title.focus({ preventScroll: true }); }
  if (!tabs || !hero) return;
  // The bar's place in the flow: under the hero, 8px apart (.component-hero's margin).
  const natural = hero.getBoundingClientRect().bottom + scrollY + 8;
  const stickyTop = parseFloat(getComputedStyle(tabs).top) || 0;
  scrollTo({ left: 0, top: Math.min(scrolled, Math.max(0, natural - stickyTop)), behavior: 'instant' });
  status.textContent = document.title;
}
function restore(url: URL, position?: [number, number]) {
  const target = content?.querySelector<HTMLElement>('h1') ?? content;
  if (target) { if (!target.hasAttribute('tabindex')) target.tabIndex = -1; target.focus({ preventScroll: true }); }
  // A new page starts where it lands, at once: the site's smooth scrolling (shell.css) is for
  // moving within a page, not for arriving on another.
  if (position) scrollTo({ left: position[0], top: position[1], behavior: 'instant' });
  else if (url.hash) hashTarget(url)?.scrollIntoView({ behavior: 'instant' });
  else scrollTo({ left: 0, top: 0, behavior: 'instant' });
  status.textContent = document.title;
}
/** Dynamic imports cannot be cancelled; stop waiting on them when a visit expires. */
function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const aborted = () => reject(signal.reason);
    if (signal.aborted) { reject(signal.reason); return; }
    signal.addEventListener('abort', aborted, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', aborted));
  });
}
async function navigate(url: URL, position: [number, number] | undefined, commit: () => void, outerSignal?: AbortSignal) {
  request?.abort();
  const controller = new AbortController();
  request = controller;
  const { signal } = controller;
  let superseded = false;
  const abortForNavigation = () => { if (!updatingPageURL) { superseded = true; controller.abort(); } };
  outerSignal?.addEventListener('abort', abortForNavigation, { once: true });
  // A timeout falls back to a full page load, so it must only catch a stalled request.
  const timer = setTimeout(() => controller.abort('timeout'), 15000);
  let swapped = false;
  let leaving: Animation | undefined;
  try {
    const response = await fetch(url, { signal, headers: { Accept: 'text/html' } });
    if (!response.ok || !response.headers.get('content-type')?.includes('text/html') || new URL(response.url).origin !== location.origin) throw new Error('Not a site page');
    const next = parsePage(await response.text());
    if (next.documentElement.dataset.navigationShell !== shell || !next.getElementById('content') || !next.querySelector('.layout-main')) throw new Error('Different layout');
    // A redirected URL needs the server's normal history semantics.
    if (new URL(response.url).pathname !== url.pathname || new URL(response.url).search !== url.search) throw new Error('Redirect');
    await styles(next, signal);
    if (signal.aborted) throw signal.reason;
    // Load module code while the old page remains visible and interactive. Registration
    // is inert until enterPage receives the destination's actual content root.
    preparePage();
    const scripts = pageScripts(next);
    for (const script of scripts) {
      await abortable(import(script.src.href), signal);
      if (signal.aborted) throw signal.reason;
    }
    if (next.querySelector('.docs-frameworks')) await abortable(import('./docs-frameworks'), signal);
    if (next.querySelector('m-drawer.site-drawer')) await abortable(import('./catalog/drawer').then(module => module.defineSiteDrawer()), signal);
    if (signal.aborted) throw signal.reason;
    // The new page fades in where the old one was: no snapshots, so nothing to stretch between
    // two pages of different heights, nothing for the browser to abort, and the rail and the
    // drawer stay live throughout. Only a closing modal drawer uses a view transition, to slide
    // out over the whole window while the page changes behind it.
    const motion = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tabSwitch = sameComponentTabs(next);
    const scrolled = scrollY;
    const modalClosing = !!document.querySelector<HTMLDialogElement>('#site-nav-dialog')?.open;
    const transitionEnabled = motion && modalClosing && !!document.startViewTransition;
    const swap = async () => {
      if (signal.aborted) return;
      swapped = true;
      closeShell();
      leavePage();
      commit();
      swapHead(next, url);
      swapBody(next, tabSwitch);
      if (transitionEnabled) nameTransitionContent();
      for (const link of pageStyles(document)) {
        const wanted = pageStyles(next).find(sheet => new URL(sheet.getAttribute('href')!, location.origin).href === link.href);
        link.media = wanted?.media ?? 'not all';
      }
      const { theme, mode } = currentAppearance();
      const scopes = [...content!.querySelectorAll<HTMLElement>('.playground--material, .docs-frameworks')];
      for (const scope of scopes) scope.dataset.themeMode = mode;
      await abortable(applyTheme(document, theme, scopes), signal);
      enterPage(['site-content', ...(content!.querySelector('#styles-preview') ? ['styles-panel'] : []), ...scripts.map(script => script.name), ...(content!.querySelector('.docs-frameworks') ? ['docs-frameworks'] : [])]);
      await abortable(applyTheme(document, currentAppearance().theme, scopes), signal);
      renderedURL = location.href;
      if (tabSwitch && !position && !url.hash) keepTabs(scrolled);
      else restore(new URL(location.href), position);
      document.dispatchEvent(new CustomEvent('md3:navigated', { detail: { url: renderedURL, initializations: { ...pageInitializations } } }));
    };
    if (transitionEnabled) {
      nameTransitionContent();
      const transition = document.startViewTransition(swap);
      // A newer navigation can skip an in-flight animation without failing its swap.
      void transition.ready.catch(() => {});
      void transition.finished.catch(() => {}).finally(() => { delete document.documentElement.dataset.navDrawerLeaving; });
      await transition.updateCallbackDone;
    } else {
      // Material's fade-through, outgoing half: once the next page is ready, the old one fades
      // out (90ms), so the page is never blank while the next one loads.
      if (motion && !tabSwitch) {
        leaving = content!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 90, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' });
        await leaving.finished.catch(() => {});
      }
      if (signal.aborted) throw signal.reason;
      await swap();
      // Material's fade-through, incoming half: the new page fades in where the old one was.
      leaving?.cancel();
      leaving = undefined;
      // A tab switch fades in only the body under the tabs; any other page fades in whole.
      const incoming = tabSwitch ? [...content!.querySelectorAll<HTMLElement>('.component-tabs ~ *')] : [content!];
      if (motion && swapped) for (const element of incoming) element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 210, easing: 'cubic-bezier(0, 0, 0.2, 1)' });
    }
  } catch {
    if (request === controller && !superseded) {
      // The API has already committed the destination entry; reload that entry.
      // A failed click fallback has not pushed yet, so preserve its source entry.
      if (api) location.replace(url.href);
      else location.assign(url.href);
    }
  } finally {
    clearTimeout(timer);
    outerSignal?.removeEventListener('abort', abortForNavigation);
    // An outgoing fade never outlives its navigation: nothing swapped in, the old page shows
    // again; swapped in and then superseded (slow theme CSS), the new page must not stay at
    // opacity 0 under a later navigation that does not fade (the modal's view transition).
    leaving?.cancel();
  }
}
/**
 * The fetched page as a document, with its declarative shadow roots: the server renders
 * material elements (the cards, the drawer) with `<template shadowrootmode>`, which
 * DOMParser leaves as inert templates, so those elements arrived unstyled and empty.
 */
function parsePage(html: string): Document {
  const parse = (Document as unknown as { parseHTMLUnsafe?: (html: string) => Document }).parseHTMLUnsafe;
  if (parse) return parse(html);
  const page = new DOMParser().parseFromString(html, 'text/html');
  // A shadow root's own content can hold further templates: attach those first.
  const attach = (scope: ParentNode): void => {
    for (const template of [...scope.querySelectorAll<HTMLTemplateElement>('template[shadowrootmode]')]) {
      attach(template.content);
      const host = template.parentElement;
      if (!host || host.shadowRoot) continue;
      const root = host.attachShadow({ mode: template.getAttribute('shadowrootmode') === 'closed' ? 'closed' : 'open', delegatesFocus: template.hasAttribute('shadowrootdelegatesfocus') });
      root.append(template.content);
      template.remove();
    }
  };
  attach(page);
  return page;
}
if (shell && content && layout) {
  if (api) {
    api.addEventListener('navigate', event => {
      const url = new URL(event.destination.url);
      if (!event.canIntercept || event.hashChange || event.downloadRequest !== null || event.formData || event.navigationType === 'reload' || !eligible(url) || excluded(event.sourceElement)) return;
      // Do not intercept replaceState/pushState used by framework chips and theme links.
      if (event.navigationType !== 'traverse' && !event.sourceElement) return;
      remember();
      const position = event.navigationType === 'traverse' ? positions.get(event.destination.key) : undefined;
      event.intercept({ focusReset: 'manual', scroll: 'manual', handler: () => navigate(url, position, () => {}, event.signal) });
    });
  } else {
    history.scrollRestoration = 'manual';
    document.addEventListener('click', event => {
      const link = event.composedPath().find(node => node instanceof HTMLAnchorElement) as HTMLAnchorElement | undefined;
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || !link || excluded(link)) return;
      const url = new URL(link.href);
      if (!eligible(url)) return;
      event.preventDefault();
      remember();
      if (url.pathname === location.pathname && url.search === location.search && url.hash) {
        request?.abort();
        if (url.href !== location.href) {
          fallbackKey = crypto.randomUUID();
          history.pushState({ md3Navigation: fallbackKey }, '', url);
        }
        renderedURL = url.href;
        const target = hashTarget(url);
        if (target) { if (!target.hasAttribute('tabindex')) target.tabIndex = -1; target.focus({ preventScroll: true }); target.scrollIntoView(); }
        remember();
        return;
      }
      void navigate(url, undefined, () => {
        fallbackKey = crypto.randomUUID();
        history.pushState({ md3Navigation: fallbackKey }, '', url);
      });
    });
    addEventListener('popstate', () => {
      fallbackKey = history.state?.md3Navigation ?? crypto.randomUUID();
      const url = new URL(location.href);
      if (new URL(renderedURL).pathname === url.pathname && new URL(renderedURL).search === url.search) { restore(url, positions.get(key())); renderedURL = url.href; return; }
      void navigate(url, positions.get(key()), () => {});
    });
  }
}
