import './search';
const root = document.documentElement;
const themeToggle = document.querySelector<HTMLButtonElement>('#theme-toggle');
function updateThemeLabel() {
  themeToggle?.setAttribute('aria-label', `Switch site to ${root.dataset.themeMode === 'dark' ? 'light' : 'dark'} mode`);
}
updateThemeLabel();
themeToggle?.addEventListener('click', () => {
  root.dataset.themeMode = root.dataset.themeMode === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('md3-site-mode', root.dataset.themeMode); } catch { /* Storage may be unavailable. */ }
  updateThemeLabel();
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
// The homepage's install command follows the package manager the reader chose in the docs; bun without one.
const INSTALL: Record<string, string> = { bun: 'bun add mtrl', npm: 'npm install mtrl', pnpm: 'pnpm add mtrl', yarn: 'yarn add mtrl' };
const installCommand = document.querySelector<HTMLElement>('#install-command');
if (installCommand && root.dataset.packageManager && INSTALL[root.dataset.packageManager]) installCommand.textContent = INSTALL[root.dataset.packageManager]!;
document.querySelector<HTMLButtonElement>('#copy-install')?.addEventListener('click', async event => {
  const button = event.currentTarget as HTMLButtonElement;
  button.textContent = await copyText(installCommand?.textContent ?? 'bun add mtrl') ? 'Copied!' : 'Select and copy the command';
  setTimeout(() => { button.textContent = 'Copy'; }, 2000);
});
