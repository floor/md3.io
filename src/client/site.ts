import './search';
import { applyTheme } from './theme-sheets';
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
// the Themes menu and the mode from the moon. Both are stored, reach the playground's
// preview and panel through the `md3:appearance` event, and the frames read them on load.
const APPEARANCE_KEY = 'md3-preview-appearance';
function saveAppearance() {
  const theme = root.dataset.siteTheme ?? 'baseline';
  const mode = root.dataset.themeMode === 'dark' ? 'dark' : 'light';
  root.dataset.previewMode = mode;
  try {
    const saved = JSON.parse(localStorage.getItem(APPEARANCE_KEY) || '{}') || {};
    localStorage.setItem(APPEARANCE_KEY, JSON.stringify({ ...saved, theme, mode }));
    localStorage.setItem('md3-site-mode', mode);
  } catch { /* Storage may be unavailable. */ }
  window.dispatchEvent(new CustomEvent('md3:appearance', { detail: { theme, mode } }));
}
themeToggle?.addEventListener('click', () => {
  root.dataset.themeMode = root.dataset.themeMode === 'dark' ? 'light' : 'dark';
  updateThemeLabel();
  saveAppearance();
});

// The header's Themes control (base.eta): material's icon button, server-rendered and
// styled before any script; its definition and material's menu load on the first
// hover, focus or click (theme-menu.ts), so most pages never fetch them. The header's
// scope takes the site theme like the panel's (theme-sheets.ts).
const themePicker = document.querySelector<HTMLElement>('#theme-picker');
const headerScope = document.querySelector<HTMLElement>('.header__themes');
// Until the element is defined, its inner button carries the popup semantics itself.
const innerButton = () => themePicker?.shadowRoot?.querySelector('button') ?? null;
innerButton()?.setAttribute('aria-haspopup', 'menu');
innerButton()?.setAttribute('aria-expanded', 'false');
let loadingMenu: Promise<typeof import('./theme-menu')> | null = null;
const loadMenu = () => (loadingMenu ??= import('./theme-menu'));
for (const intent of ['pointerenter', 'focusin'] as const) themePicker?.addEventListener(intent, () => void loadMenu(), { once: true });
const expanded = (open: boolean) => {
  themePicker?.setAttribute('aria-expanded', String(open));
  innerButton()?.setAttribute('aria-expanded', String(open));
};
let menuMade = false;
themePicker?.addEventListener('click', async () => {
  // Once made, material's menu toggles itself from its anchor (this button); only the
  // first click, which makes it, opens it from here.
  if (menuMade) return;
  const module = await loadMenu();
  const menu = module.themeMenu(theme => {
    root.dataset.siteTheme = theme;
    module.markTheme(theme);
    saveAppearance();
  }, expanded);
  if (!menu) return;
  menuMade = true;
  module.markTheme(root.dataset.siteTheme ?? 'baseline');
  menu.show();
});
// The header scope follows the appearance, as the panel does (playground.ts).
window.addEventListener('md3:appearance', event => {
  const { theme, mode } = (event as CustomEvent<{ theme: string; mode: string }>).detail;
  if (!headerScope) return;
  headerScope.dataset.themeMode = mode;
  applyTheme(document, theme, [headerScope]);
});

const hamburger = document.querySelector<HTMLButtonElement>('#hamburger');
const sidebar = document.querySelector<HTMLElement>('#sidebar');
const overlay = document.querySelector<HTMLButtonElement>('#overlay');
const mobile = matchMedia('(max-width: 720px)');
function setMenu(open: boolean, restoreFocus = false) {
  sidebar?.classList.toggle('sidebar--open', open);
  overlay?.classList.toggle('overlay--visible', open);
  hamburger?.setAttribute('aria-expanded', String(open));
  if (sidebar) sidebar.inert = mobile.matches && !open;
  if (overlay) overlay.hidden = !open;
  if (restoreFocus) hamburger?.focus();
}
setMenu(false);
mobile.addEventListener('change', () => setMenu(false));
hamburger?.addEventListener('click', () => setMenu(hamburger.getAttribute('aria-expanded') !== 'true'));
overlay?.addEventListener('click', () => setMenu(false, true));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && hamburger?.getAttribute('aria-expanded') === 'true') setMenu(false, true);
});

// The documentation's framework switch: the choice shows every example of the page in that
// framework, and is the one the playgrounds and the Examples remember.
const switchOptions = [...document.querySelectorAll<HTMLButtonElement>('.framework-switch__option')];
function showFramework(framework: string) {
  root.dataset.framework = framework;
  for (const option of switchOptions) option.setAttribute('aria-pressed', String(option.dataset.framework === framework));
}
if (switchOptions.length) showFramework(root.dataset.framework ?? 'vanilla');
for (const option of switchOptions) {
  option.addEventListener('click', () => {
    showFramework(option.dataset.framework!);
    try { localStorage.setItem('md3-example-framework', option.dataset.framework!); } catch { /* Storage may be unavailable. */ }
  });
}

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
