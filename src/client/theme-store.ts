// The Styles section's theme store: the only place that writes theme state. Pages call
// get, set, reset and subscribe; the preview, the export and the other tabs follow.
//
// Load order: a `?theme=` link wins (and leaves the address bar), then what this browser
// saved, then mtrl's baseline. `?theme=<built-in name>` (`?theme=ocean`, the Themes
// page's link) picks that base theme over what was saved, and stays in the address bar.
//
// The base theme and mode are the site's one appearance (appearance.ts). This store
// never writes that key: a base or mode change here goes through setAppearance at once,
// and a change made anywhere else (the header) arrives as `md3:appearance` and is
// applied without saving. Its own key (`md3-styles-theme`) keeps the rest.
import { defaultState, normalize, parse, serialize, type SectionKey, type ThemeBase, type ThemeState } from '../shared/theme-state';
import { APPEARANCE_KEY, onAppearance, setAppearance } from './appearance';

const STORAGE_KEY = 'md3-styles-theme';
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
  if (linked !== null && themeBase.themes.includes(linked)) {
    const saved = parse(read(STORAGE_KEY) ?? '', themeBase) ?? defaultState();
    return { state: normalize({ ...saved, base: linked }, themeBase), fromLink: true };
  }
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
  try { localStorage.setItem(STORAGE_KEY, serialize(state)); }
  catch { /* The page works without storage; the theme lasts until it closes. */ }
}
// Throttled: a slider drag writes once it rests, the preview follows every tick.
const scheduleSave = () => { saveTimer ??= setTimeout(save, SAVE_DELAY); };
addEventListener('pagehide', () => { if (saveTimer !== undefined) save(); });

function commit(next: ThemeState, persist = true) {
  const appearanceChanged = next.base !== state.base || next.mode !== state.mode;
  state = next;
  if (persist) scheduleSave();
  for (const listener of listeners) listener(state);
  // A base or mode chosen here is the site's appearance: written now, through the one
  // writer, which tells the header and the rest (the event comes back here as a no-op).
  if (persist && appearanceChanged) setAppearance({ theme: state.base, mode: state.mode === 'dark' ? 'dark' : 'light' });
}

export const themeStore = {
  get: (): ThemeState => state,
  /**
   * Changes the theme. Top-level keys replace: `set({ mode: 'dark' })`, or a whole
   * section, `set({ shape: { corners: { medium: 24 } } })`. The result is validated.
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

// A link's base theme becomes the site's appearance once every module script has run
// (the header listens from site.js, which may execute after this one).
if (openedFromLink) {
  save();
  const share = () => setAppearance({ theme: state.base, mode: state.mode === 'dark' ? 'dark' : 'light' });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', share, { once: true }); else share();
}
// The header (or any other place) changed the appearance: applied here, not saved again.
onAppearance(({ theme, mode }) => {
  if (theme === state.base && mode === state.mode) return;
  commit(normalize({ ...state, base: theme, mode }, themeBase), false);
});
// Another tab changed the theme, or the playground the appearance.
addEventListener('storage', (event: StorageEvent) => {
  if (event.key !== STORAGE_KEY && event.key !== APPEARANCE_KEY) return;
  const next = load().state;
  if (serialize(next) !== serialize(state)) commit(next, false);
});
