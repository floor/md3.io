// Switches a frame's material theme without loading every theme up front. The frame's
// head holds only the active theme's two sheets (src/server/shells/theme-sheets.eta);
// another theme's are named in the #theme-sheets map and load on first use, the theme
// before contrast.css and its contrast variant after it, as the static links were.
// data-theme switches once both have loaded, so the old theme stays on screen until
// then. Works on the frame's own document or, from the parent page, on a frame's.
const loads = new WeakMap<Document, Map<string, Promise<boolean>>>();
const wanted = new WeakMap<Document, string>();

/** True once every sheet of the theme loaded; a failed sheet leaves the last theme applied. */
function loadTheme(doc: Document, theme: string): Promise<boolean> {
  const started = loads.get(doc) ?? new Map<string, Promise<boolean>>();
  loads.set(doc, started);
  let loading = started.get(theme);
  if (!loading) {
    const contrast = doc.getElementById('contrast-sheet');
    let hashes: [string, string] | undefined;
    try { hashes = JSON.parse(doc.getElementById('theme-sheets')?.textContent || '{}')[theme]; } catch { hashes = undefined; }
    // Only the parts not already in the head (a page or frame writes the active
    // theme's main sheet before its first paint).
    const sheets = (hashes ? (['theme', 'contrast'] as const) : [])
      .filter(part => !doc.querySelector(`head > link[data-theme-sheet="${theme}"][data-part="${part}"]`))
      .map(part => {
        const hash = hashes![part === 'theme' ? 0 : 1];
        const link = doc.createElement('link');
        link.rel = 'stylesheet';
        link.dataset.themeSheet = theme;
        link.dataset.part = part;
        link.href = `/dist/material/themes/${theme}${part === 'contrast' ? '-contrast' : ''}${hash ? `.${hash}` : ''}.css`;
        return link;
      });
    loading = Promise.all(sheets.map(link => new Promise<boolean>(resolve => {
      // Both listeners go once either fires: a loaded sheet keeps no handler behind.
      const onLoad = () => { cleanup(); resolve(true); };
      const onError = () => { cleanup(); resolve(false); };
      const cleanup = () => { link.removeEventListener('load', onLoad); link.removeEventListener('error', onError); };
      link.addEventListener('load', onLoad);
      link.addEventListener('error', onError);
      if (contrast && link.dataset.part === 'theme') contrast.before(link);
      else if (contrast) contrast.after(link);
      else doc.head.append(link);
    }))).then(results => {
      const loaded = results.every(Boolean);
      // A failed theme is not cached: the next attempt loads its sheets again.
      if (!loaded) started.delete(theme);
      return loaded;
    });
    started.set(theme, loading);
  }
  return loading;
}

/**
 * Shows `theme` in `doc` once its sheets are in; the latest call wins. The theme goes
 * on `targets` (the page's panel scopes) or, by default, on the document's root. The
 * promise settles once that has happened, or once a later call has taken over.
 */
export function applyTheme(doc: Document, theme: string, targets: readonly HTMLElement[] = [doc.documentElement]): Promise<void> {
  wanted.set(doc, theme);
  return loadTheme(doc, theme).then(loaded => {
    // A theme whose sheet failed is never applied: the last loaded theme stays.
    if (!loaded || wanted.get(doc) !== theme) return;
    for (const target of targets) target.dataset.theme = theme;
  });
}
