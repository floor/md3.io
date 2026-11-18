// The site's one appearance: the material theme (the header's Themes menu) and the
// mode (its light/dark button). This module is the only writer of the stored keys and
// the only source of the `md3:appearance` event. Every other place — the header, the
// playground's preview and panel, the Styles pages' theme store, the example frame —
// listens and applies; none writes the keys on its own, so no write is lost to another
// (a same-tab write fires no `storage` event in the tab that made it).
const root = document.documentElement;
export const APPEARANCE_KEY = 'md3-preview-appearance';
export const MODE_KEY = 'md3-site-mode';

export type Mode = 'light' | 'dark';
export interface Appearance { theme: string; mode: Mode }

/** The appearance the page shows now (base.eta's head script set it from storage). */
export function currentAppearance(): Appearance {
  return { theme: root.dataset.siteTheme ?? 'baseline', mode: root.dataset.themeMode === 'dark' ? 'dark' : 'light' };
}

/**
 * Changes the appearance: the page's root attributes first (the site's own tokens follow
 * the mode at once), then storage, then the event every listener applies.
 */
export function setAppearance(next: Partial<Appearance>): void {
  const theme = next.theme ?? currentAppearance().theme;
  const mode: Mode = (next.mode ?? currentAppearance().mode) === 'dark' ? 'dark' : 'light';
  root.dataset.siteTheme = theme;
  root.dataset.themeMode = mode;
  root.dataset.previewMode = mode;
  try {
    const saved = JSON.parse(localStorage.getItem(APPEARANCE_KEY) || '{}') || {};
    localStorage.setItem(APPEARANCE_KEY, JSON.stringify({ ...saved, theme, mode }));
    localStorage.setItem(MODE_KEY, mode);
  } catch { /* Storage may be unavailable; the page still changes. */ }
  window.dispatchEvent(new CustomEvent<Appearance>('md3:appearance', { detail: { theme, mode } }));
}

/** Calls `listener` on every appearance change; returns the unsubscribe. */
export function onAppearance(listener: (appearance: Appearance) => void): () => void {
  const handler = (event: Event) => listener((event as CustomEvent<Appearance>).detail);
  window.addEventListener('md3:appearance', handler);
  return () => window.removeEventListener('md3:appearance', handler);
}
