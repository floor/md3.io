// The live preview and the export panel every Styles page shares
// (src/server/shells/styles-preview.eta). Both only read the store; the base theme and
// mode controls write to it like any page control.
import { sections, sectionKeys, serialize, toCss, toTokens, type ThemeState } from '../shared/theme-state';
import { themeBase, themeStore } from './theme-store';

const status = document.querySelector<HTMLElement>('#styles-status');
export const announce = (message: string) => { if (status) status.textContent = message; };
export const themeName = (name: string) => (name.charAt(0).toUpperCase() + name.slice(1)).replaceAll('-', ' ');

/** Copies text, announcing the result; false when the clipboard is unavailable. */
export async function copy(text: string, what: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); announce(`Copied ${what}`); return true; }
  catch { announce(`Could not copy ${what}`); return false; }
}

// ─── Frames of real mtrl ────────────────────────────────────────────

// Every frame on the page that shows mtrl follows the store: data-theme-frame="theme"
// with your overrides, "base" without them. A frame marked data-autosize takes the
// height its content reports (the Shape page's gallery).
const themeFrames = () => [...document.querySelectorAll<HTMLIFrameElement>('iframe[data-theme-frame]')];
const sendTheme = (frame: HTMLIFrameElement, state = themeStore.get()) => {
  if (!frame.getAttribute('src')) return;
  const tokens = frame.dataset.themeFrame === 'theme' ? toTokens(state, themeBase) : {};
  frame.contentWindow?.postMessage({ type: 'md3:theme', base: state.base, mode: state.mode, tokens }, location.origin);
};
addEventListener('message', event => {
  if (event.origin !== location.origin) return;
  const frame = themeFrames().find(candidate => candidate.contentWindow === event.source);
  if (!frame) return;
  if (event.data?.type === 'md3:frame-ready') sendTheme(frame);
  if (event.data?.type === 'md3:frame-size' && frame.hasAttribute('data-autosize') && Number.isFinite(event.data.height)) frame.style.height = `${Math.min(4000, Math.max(80, event.data.height))}px`;
});
themeStore.subscribe(state => { for (const frame of themeFrames()) sendTheme(frame, state); });

// ─── Preview ────────────────────────────────────────────────────────

const panel = document.querySelector<HTMLElement>('#styles-preview');
if (panel) {
  const frames = panel.querySelector<HTMLElement>('.styles-preview__frames')!;
  const baseFigure = panel.querySelector<HTMLElement>('[data-frame="base"]')!;
  const baseFrame = baseFigure.querySelector('iframe')!;

  // Docked: a bar pinned to the bottom that opens upward. Always on narrow screens, and
  // on a page that asks for a collapsible preview (data-collapsible) while it is closed.
  const toggle = panel.querySelector<HTMLButtonElement>('#styles-preview-toggle')!;
  const narrow = matchMedia('(max-width: 1100px)');
  const OPEN_KEY = panel.hasAttribute('data-collapsible') ? 'md3-styles-preview-open-wide' : 'md3-styles-preview-open';
  const dock = () => panel.classList.toggle('styles-preview--docked', narrow.matches || (panel.hasAttribute('data-collapsible') && panel.dataset.open !== 'true'));
  const setOpen = (open: boolean, save = false) => {
    toggle.setAttribute('aria-expanded', String(open));
    panel.dataset.open = String(open);
    dock();
    if (save) try { localStorage.setItem(OPEN_KEY, String(open)); } catch { /* Storage may be unavailable. */ }
  };
  let open = false;
  try { open = localStorage.getItem(OPEN_KEY) === 'true'; } catch { /* Closed by default. */ }
  setOpen(open);
  narrow.addEventListener('change', dock);
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true', true));

  // Compare: the base theme beside yours, side by side where the panel is wide enough
  // (a container query), otherwise one at a time with the Yours / Base switch.
  const compare = panel.querySelector<HTMLInputElement>('#styles-compare')!;
  compare.addEventListener('change', () => {
    panel.classList.toggle('styles-preview--compare', compare.checked);
    baseFigure.hidden = !compare.checked;
    if (compare.checked && !baseFrame.getAttribute('src')) baseFrame.src = baseFrame.dataset.src!;
    if (!compare.checked) frames.dataset.show = 'theme';
    for (const input of panel.querySelectorAll<HTMLInputElement>('input[name="styles-show"]')) input.checked = input.value === frames.dataset.show;
    announce(compare.checked ? 'Comparing your theme with the base theme' : 'Showing your theme');
  });
  for (const input of panel.querySelectorAll<HTMLInputElement>('input[name="styles-show"]')) input.addEventListener('change', () => { frames.dataset.show = input.value; });

  // The base theme and mode, where the page has no controls of its own.
  const baseSelect = panel.querySelector<HTMLSelectElement>('#styles-base');
  const modeInputs = [...panel.querySelectorAll<HTMLInputElement>('input[name="styles-mode"]')];
  baseSelect?.addEventListener('change', () => themeStore.set({ base: baseSelect.value }));
  for (const input of modeInputs) input.addEventListener('change', () => themeStore.set({ mode: input.value === 'dark' ? 'dark' : 'light' }));
  themeStore.subscribe(state => {
    if (baseSelect) baseSelect.value = state.base;
    for (const input of modeInputs) input.checked = input.value === state.mode;
    document.documentElement.dataset.previewMode = state.mode;
    baseFigure.querySelector('figcaption')!.textContent = `${themeName(state.base)}, as the material library ships it`;
  });
}

// ─── Export ─────────────────────────────────────────────────────────

/** The share link for a state, on this site. */
export const shareLink = (state: ThemeState) => `${location.origin}/styles/?theme=${serialize(state)}`;
/** What differs from mtrl, one line per section. */
export const changes = (state: ThemeState) => sectionKeys.flatMap(key => {
  const value = state[key];
  return value === undefined ? [] : [{ key, label: sections[key].label, href: sections[key].href, summary: sections[key].summary(value as never, themeBase) }];
});

const exportDialog = document.querySelector<HTMLDialogElement>('#styles-export');
if (exportDialog) {
  const css = exportDialog.querySelector<HTMLElement>('#styles-export-css')!;
  const link = exportDialog.querySelector<HTMLInputElement>('#styles-export-link')!;
  const summary = exportDialog.querySelector<HTMLElement>('#styles-export-summary')!;
  const resets = exportDialog.querySelector<HTMLElement>('#styles-export-resets')!;
  const render = (state: ThemeState) => {
    css.textContent = toCss(state, themeBase);
    link.value = shareLink(state);
    const changed = changes(state);
    summary.textContent = `${themeName(state.base)}, ${state.mode}${changed.length ? ` · ${changed.map(change => `${change.label}: ${change.summary}`).join(' · ')}` : ' · no changes yet'}`;
    resets.querySelectorAll('[data-theme-reset]:not([data-theme-reset=""])').forEach(button => button.remove());
    resets.prepend(...changed.map(change => {
      const button = Object.assign(document.createElement('button'), { type: 'button', className: 'ui-btn', textContent: `Reset ${change.label.toLowerCase()}` });
      button.dataset.themeReset = change.key;
      return button;
    }));
  };
  themeStore.subscribe(state => { if (exportDialog.open) render(state); });
  document.addEventListener('click', event => {
    if (!(event.target as Element | null)?.closest('[data-open-export]')) return;
    render(themeStore.get());
    exportDialog.showModal();
  });
  exportDialog.querySelector('#styles-export-close')!.addEventListener('click', () => exportDialog.close());
  // A click on the backdrop (the dialog itself, outside its panel) closes it.
  exportDialog.addEventListener('click', event => { if (event.target === exportDialog) exportDialog.close(); });
  exportDialog.querySelector('#styles-export-copy')!.addEventListener('click', () => copy(css.textContent ?? '', 'the theme CSS'));
  exportDialog.querySelector('#styles-export-copy-link')!.addEventListener('click', () => copy(link.value, 'the share link'));
  exportDialog.querySelector('#styles-export-download')!.addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([css.textContent ?? ''], { type: 'text/css' }));
    Object.assign(document.createElement('a'), { href: url, download: 'mtrl-theme.css' }).click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    announce('Downloading mtrl-theme.css');
  });
}

// Reset buttons anywhere on a Styles page: data-theme-reset="shape", or "" for everything.
document.addEventListener('click', event => {
  const button = (event.target as Element | null)?.closest<HTMLElement>('[data-theme-reset]');
  if (!button) return;
  const section = button.dataset.themeReset as keyof typeof sections | '';
  const scope = button.closest('dialog') ?? button.closest<HTMLElement>('[data-reset-scope]');
  themeStore.reset(section || undefined);
  // The button may be gone with what it reset: keep focus nearby.
  if (!button.isConnected) (scope?.querySelector<HTMLElement>('[data-theme-reset=""]') ?? scope as HTMLElement | null)?.focus();
  announce(section ? `${sections[section].label} reset to the material library's values` : 'Theme reset to the material library\'s baseline');
});
