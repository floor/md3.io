// The Styles section's theme store: the only place that writes theme state. Pages call
// get, set, reset and subscribe; the preview, the export and the other tabs follow.
//
// Load order: a `?theme=` link wins (and leaves the address bar), then what this browser
// saved, then mtrl's baseline. The base theme and mode are also the playground's
// appearance (`md3-preview-appearance`), so a theme picked in either place is the other's.
import { defaultState, normalize, parse, serialize, type SectionKey, type ThemeBase, type ThemeState } from '../shared/theme-state';

const STORAGE_KEY = 'md3-styles-theme';
const APPEARANCE_KEY = 'md3-preview-appearance';
const SAVE_DELAY = 300;

export const themeBase: ThemeBase = JSON.parse(document.querySelector('#theme-base')?.textContent || '{"themes":["baseline"],"shape":{}}');

type Listener = (state: ThemeState) => void;
const listeners = new Set<Listener>();
const read = (key: string): string | null => { try { return localStorage.getItem(key); } catch { return null; } };
const readJson = (key: string): Record<string, unknown> => {
  try { const value = JSON.parse(read(key) || '{}'); return value && typeof value === 'object' ? value : {}; } catch { return {}; }
};

function load(): { state: ThemeState; fromLink: boolean } {
  const url = new URL(location.href);
  const linked = url.searchParams.get('theme');
  if (linked !== null) {
    url.searchParams.delete('theme');
    history.replaceState(history.state, '', url.pathname + url.search + url.hash);
    const state = parse(linked, themeBase);
    if (state) return { state, fromLink: true };
  }
  const saved = parse(read(STORAGE_KEY) ?? '', themeBase) ?? defaultState();
  // The playground may have changed the appearance since: its key has the last word.
  const appearance = readJson(APPEARANCE_KEY);
  return { state: normalize({ ...saved, ...(appearance.theme !== undefined ? { base: appearance.theme } : {}), ...(appearance.mode !== undefined ? { mode: appearance.mode } : {}) }, themeBase), fromLink: false };
}

const loaded = load();
let state = loaded.state;
/** Whether this page opened from a share link. */
export const openedFromLink = loaded.fromLink;

let saveTimer: ReturnType<typeof setTimeout> | undefined;
function save() {
  clearTimeout(saveTimer);
  saveTimer = undefined;
  try {
    localStorage.setItem(STORAGE_KEY, serialize(state));
    // Keep whatever else the playground stores beside theme and mode.
    const appearance = readJson(APPEARANCE_KEY);
    if (appearance.theme !== state.base || appearance.mode !== state.mode) localStorage.setItem(APPEARANCE_KEY, JSON.stringify({ ...appearance, theme: state.base, mode: state.mode }));
  } catch { /* The page works without storage; the theme lasts until it closes. */ }
}
// Throttled: a slider drag writes once it rests, the preview follows every tick.
const scheduleSave = () => { saveTimer ??= setTimeout(save, SAVE_DELAY); };
addEventListener('pagehide', () => { if (saveTimer !== undefined) save(); });

function commit(next: ThemeState, persist = true) {
  state = next;
  if (persist) scheduleSave();
  for (const listener of listeners) listener(state);
}

export const themeStore = {
  get: (): ThemeState => state,
  /**
   * Changes the theme. Top-level keys replace: `set({ mode: 'dark' })`, or a whole
   * section, `set({ shape: { roundness: 150 } })`. The result is validated.
   */
  set(partial: Partial<ThemeState>) { commit(normalize({ ...state, ...partial }, themeBase)); },
  /** One section back to mtrl's values, or, without one, everything (base theme and mode too). */
  reset(section?: SectionKey) {
    if (section) { const { [section]: _, ...rest } = state; commit(normalize(rest, themeBase)); }
    else commit(defaultState());
  },
  /** Calls `listener` now and on every change, from this tab or another; returns the unsubscribe. */
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    listener(state);
    return () => listeners.delete(listener);
  },
};

if (openedFromLink) save();
// Another tab changed the theme, or the playground the appearance.
addEventListener('storage', (event: StorageEvent) => {
  if (event.key !== STORAGE_KEY && event.key !== APPEARANCE_KEY) return;
  const next = load().state;
  if (serialize(next) !== serialize(state)) commit(next, false);
});
