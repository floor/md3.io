import './search';
import { currentFocus } from './site-navigation';
import { applyTheme } from './theme-sheets';
import { currentAppearance, onAppearance, setAppearance } from './appearance';
const root = document.documentElement;
// The mode button is material's icon button (base.eta): its label goes on the host and,
// until the element is defined, on the inner button that carries it.
const themeToggle = document.querySelector<HTMLElement>('#theme-toggle');
function updateThemeLabel() {
  const label = `Switch site to ${root.dataset.themeMode === 'dark' ? 'light' : 'dark'} mode`;
  themeToggle?.setAttribute('aria-label', label);
  themeToggle?.shadowRoot?.querySelector('button')?.setAttribute('aria-label', label);
}
updateThemeLabel();
// One appearance for the whole site (base.eta's head script): the material theme from
// the Themes menu and the mode from the moon. appearance.ts is its only writer; the
// header, like every other place, applies the `md3:appearance` event it dispatches.
themeToggle?.addEventListener('click', () => {
  setAppearance({ mode: currentAppearance().mode === 'dark' ? 'light' : 'dark' });
});

// The header's Themes control (base.eta): material's icon button, server-rendered and
// styled before any script; its definition and material's menu load on the first
// hover, focus or click (theme-menu.ts), so most pages never fetch them. The header's
// scope takes the site theme like the panel's (theme-sheets.ts).
const themePicker = document.querySelector<HTMLElement>('#theme-picker');
const headerScope = document.querySelector<HTMLElement>('.header__themes');
// The inner button is the focusable control, so it carries the popup semantics: the
// server-rendered one now, and again after the element's definition loads, whose
// upgrade rebuilds the shadow root with a button that only gets aria-label from the
// host (review of #92) — and on every open and close.
const innerButton = () => themePicker?.shadowRoot?.querySelector('button') ?? null;
const markPopup = () => {
  const button = innerButton();
  button?.setAttribute('aria-haspopup', 'menu');
  button?.setAttribute('aria-expanded', themePicker?.getAttribute('aria-expanded') === 'true' ? 'true' : 'false');
};
markPopup();
// The upgrade also replaces the focused inner button, so focus fell to <body>: a
// keyboard user who tabbed to Theme pressed Enter on nothing. The header icon button
// that had focus when the definition arrived gets it back.
// The upgrade's removal fires a focusout with focus going nowhere, so the host is only
// forgotten when focus actually lands somewhere else on the page.
let focusedIconHost: HTMLElement | null = null;
document.addEventListener('focusin', event => {
  const host = [themePicker, themeToggle].find(candidate => candidate && candidate.contains(event.target as Node)) ?? null;
  focusedIconHost = host;
});
let loadingMenu: Promise<typeof import('./theme-menu')> | null = null;
const loadMenu = () => (loadingMenu ??= import('./theme-menu').then(module => {
  markPopup();
  const active = document.activeElement;
  if (focusedIconHost && (!active || active === document.body)) focusedIconHost.focus();
  return module;
}));
for (const intent of ['pointerenter', 'focusin'] as const) themePicker?.addEventListener(intent, () => void loadMenu(), { once: true });
const expanded = (open: boolean) => {
  themePicker?.setAttribute('aria-expanded', String(open));
  markPopup();
};
let menuMade = false;
themePicker?.addEventListener('click', async () => {
  // Once made, material's menu toggles itself from its anchor (this button); only the
  // first click, which makes it, opens it from here.
  if (menuMade) return;
  const module = await loadMenu();
  const menu = module.themeMenu(theme => setAppearance({ theme }), expanded);
  if (!menu) return;
  menuMade = true;
  module.markTheme(currentAppearance().theme);
  menu.show();
});
// The header follows the appearance, whoever changed it (its own buttons, a Styles
// page): the root's theme, the mode button's label, the menu's check, and its scope.
onAppearance(({ theme, mode }) => {
  root.dataset.siteTheme = theme;
  root.dataset.themeMode = mode;
  updateThemeLabel();
  if (menuMade) void loadMenu().then(module => module.markTheme(theme));
  if (!headerScope) return;
  headerScope.dataset.themeMode = mode;
  applyTheme(document, theme, [headerScope]);
});

const docToc = document.querySelector('.doc-toc');
if (docToc) {
  const tocHidden = matchMedia('(width < 1200px)');
  tocHidden.addEventListener('change', () => {
    const focused = currentFocus();
    if (!tocHidden.matches || !(focused instanceof HTMLAnchorElement) || !docToc.contains(focused)) return;
    const id = focused.getAttribute('href')?.slice(1) ?? '';
    const target = document.getElementById(id) ?? document.getElementById('content');
    if (target && !target.hasAttribute('tabindex')) target.tabIndex = -1;
    target?.focus();
  });
}

const componentList = document.querySelector<HTMLElement>('.component-list');
if (componentList) {
  const detail = componentList.closest('.component-list-layout--detail');
  const expanded = matchMedia('(min-width: 840px)');
  let focusedLink: HTMLAnchorElement | null = null;
  document.addEventListener('focusin', event => {
    focusedLink = event.target instanceof HTMLAnchorElement ? event.target : null;
  });
  const keepCurrentComponentInView = () => {
    if (!detail || !expanded.matches) return;
    const current = componentList.querySelector<HTMLElement>('[aria-current="page"]');
    if (!current) return;
    const pane = componentList.getBoundingClientRect();
    const row = current.getBoundingClientRect();
    if (row.top < pane.top || row.bottom > pane.bottom) {
      componentList.scrollTop += row.top - pane.top - (pane.height - row.height) / 2;
    }
  };
  expanded.addEventListener('change', () => {
    if (expanded.matches) {
      keepCurrentComponentInView();
      return;
    }
    if (detail && focusedLink && componentList.contains(focusedLink)) {
      detail.querySelector<HTMLElement>('.component-list-up')?.focus({ preventScroll: true });
    } else if (focusedLink?.matches('.component-card')) {
      componentList.querySelector<HTMLElement>(`a[href="${CSS.escape(focusedLink.pathname)}"]`)?.focus();
    }
  });
  keepCurrentComponentInView();
}

// The documentation's framework chips (document.eta): their code loads only on a page that
// has them (src/client/docs-frameworks.ts).
if (document.querySelector('.docs-frameworks')) void import('./docs-frameworks');

// The package manager of the `install` blocks: one choice for every block, remembered.
const managerOptions = [...document.querySelectorAll<HTMLButtonElement>('.doc-install__option')];
function showManager(manager: string) {
  root.dataset.packageManager = manager;
  for (const option of managerOptions) option.setAttribute('aria-pressed', String(option.dataset.packageManager === manager));
}
if (managerOptions.length) showManager(root.dataset.packageManager ?? 'bun');
for (const option of managerOptions) {
  option.addEventListener('click', () => {
    showManager(option.dataset.packageManager!);
    try { localStorage.setItem('md3-package-manager', option.dataset.packageManager!); } catch { /* Storage may be unavailable. */ }
  });
}

// Copy the command shown for the reader's package manager.
for (const copy of document.querySelectorAll<HTMLButtonElement>('.doc-install__copy')) {
  copy.addEventListener('click', async () => {
    const shown = [...copy.closest('.doc-install')!.querySelectorAll<HTMLElement>('.doc-install__command')].find(command => getComputedStyle(command).display !== 'none');
    copy.textContent = shown && await copyText(shown.textContent!.trim()) ? 'Copied' : 'Copy failed';
    setTimeout(() => { copy.textContent = 'Copy'; }, 1600);
  });
}

export async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; }
  catch { return false; }
}
