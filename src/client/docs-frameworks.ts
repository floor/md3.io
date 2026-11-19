// The documentation's framework chips (document.eta): material's filter chip set, the same
// picker as the playgrounds and the Showcase. The choice is :root[data-framework], which
// the head script sets before paint (base.eta) and the page's CSS reads to show that
// framework's examples, guide and steps; a chip saves it for the whole site.
import 'material/elements/css/chips';
import { defineChips } from 'material/elements';
import { applyTheme } from './theme-sheets';
import { onAppearance } from './appearance';

defineChips();
const root = document.documentElement;
const FRAMEWORK = 'md3-example-framework';
const chips = document.querySelector<HTMLElement & { value: unknown }>('.docs-frameworks m-chips.framework-chips');
if (chips) {
  chips.value = root.dataset.framework ?? 'vanilla';
  chips.addEventListener('change', event => {
    const value = (event as CustomEvent<{ value?: unknown }>).detail?.value ?? chips.value;
    const framework = String(Array.isArray(value) ? value[0] ?? '' : value ?? '');
    if (!framework || framework === root.dataset.framework) return;
    root.dataset.framework = framework;
    try { localStorage.setItem(FRAMEWORK, framework); } catch { /* Storage may be unavailable. */ }
    // The address keeps the choice when it named one (a shared link stays true to the page).
    const url = new URL(location.href);
    if (url.searchParams.has('framework')) { url.searchParams.set('framework', framework); history.replaceState(null, '', url); }
  });
}
// The chips row is a material scope: it follows the header's theme and mode, as on the
// component pages (its first frame is themed by the row's own parse-time script).
const scopes = [...document.querySelectorAll<HTMLElement>('.docs-frameworks')];
onAppearance(({ theme, mode }) => {
  for (const scope of scopes) scope.dataset.themeMode = mode;
  void applyTheme(document, theme, scopes);
});

// An old guide link's anchor (/docs/react/#events, redirected here with the hash kept)
// names the guide's own heading; on this page the headings are prefixed with the
// framework (react-events). Map it, once the markup exists, and go there.
if (location.pathname === '/docs/frameworks/' && location.hash.length > 1) {
  const anchor = decodeURIComponent(location.hash.slice(1));
  const framework = root.dataset.framework ?? 'vanilla';
  const prefixed = document.getElementById(`${framework}-${anchor}`);
  if (!document.getElementById(anchor) && prefixed) {
    history.replaceState(null, '', `${location.pathname}${location.search}#${prefixed.id}`);
    prefixed.scrollIntoView();
  }
}
