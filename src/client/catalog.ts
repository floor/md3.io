// The components overview: the cards' visuals are mtrl's elements, rendered by the
// server (src/server/catalog.ts) and defined by src/client/catalog/<slug>.ts, with
// mtrl's CSS in their shadow roots. Loaded on this page only.
//
// Each card's module, with its element's JS and CSS, is imported when the card comes
// within a viewport of being seen: the build splits it into its own chunk, beside
// the chunks the cards share (mtrl's core, defineElement). Until then the page's
// pre-upgrade rules keep the card's box, so nothing moves when it upgrades.
//
// A module defines its elements when `define` is called, not on import: code
// splitting keeps the modules' side effects but not their order across chunks, so a
// define at import could run before the CSS it needs is registered.
import type { ComponentSlug } from '../shared/components';

const modules: Record<ComponentSlug, () => Promise<{ define: () => void }>> = {
  button: () => import('./catalog/button'),
  'icon-button': () => import('./catalog/icon-button'),
  'button-group': () => import('./catalog/button-group'),
  'split-button': () => import('./catalog/split-button'),
  fab: () => import('./catalog/fab'),
  'extended-fab': () => import('./catalog/extended-fab'),
  checkbox: () => import('./catalog/checkbox'),
  switch: () => import('./catalog/switch'),
  radios: () => import('./catalog/radios'),
  chips: () => import('./catalog/chips'),
  slider: () => import('./catalog/slider'),
  textfield: () => import('./catalog/textfield'),
  select: () => import('./catalog/select'),
  search: () => import('./catalog/search'),
  datepicker: () => import('./catalog/datepicker'),
  timepicker: () => import('./catalog/timepicker'),
  'navigation-rail': () => import('./catalog/navigation-rail'),
  drawer: () => import('./catalog/drawer'),
  tabs: () => import('./catalog/tabs'),
  menu: () => import('./catalog/menu'),
  'top-app-bar': () => import('./catalog/top-app-bar'),
  'bottom-app-bar': () => import('./catalog/bottom-app-bar'),
  card: () => import('./catalog/card'),
  list: () => import('./catalog/list'),
  carousel: () => import('./catalog/carousel'),
  divider: () => import('./catalog/divider'),
  dialog: () => import('./catalog/dialog'),
  'bottom-sheet': () => import('./catalog/bottom-sheet'),
  'side-sheet': () => import('./catalog/side-sheet'),
  badge: () => import('./catalog/badge'),
  progress: () => import('./catalog/progress'),
  'loading-indicator': () => import('./catalog/loading-indicator'),
  snackbar: () => import('./catalog/snackbar'),
  tooltip: () => import('./catalog/tooltip'),
};

/** The visuals' class: CATALOG_SCOPE in src/server/catalog.ts, which is server code. */
const scope = 'catalog-visual';
const prefix = `${scope}--`;
const slugOf = (visual: Element) => [...visual.classList].find(name => name.startsWith(prefix))?.slice(prefix.length) as ComponentSlug | undefined;

// A card a viewport away starts loading, so it is usually upgraded before it is seen.
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    observer.unobserve(entry.target);
    const slug = slugOf(entry.target);
    if (slug && Object.hasOwn(modules, slug)) modules[slug]().then(module => module.define()).catch(error => console.error(`Could not load the ${slug} card`, error));
  }
}, { rootMargin: '100% 0px' });
for (const visual of document.querySelectorAll(`.${scope}`)) observer.observe(visual);
