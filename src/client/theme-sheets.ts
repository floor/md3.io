// Switches a frame's material theme without loading every theme up front. The frame's
// head holds only the active theme's two sheets (src/server/shells/theme-sheets.eta);
// another theme's come from the inert #theme-sheets template on first use, the theme
// before contrast.css and its contrast variant after it, as the static links were.
// data-theme switches once both have loaded, so the old theme stays on screen until
// then. Works on the frame's own document or, from the parent page, on a frame's.
const loads = new WeakMap<Document, Map<string, Promise<void>>>();
const wanted = new WeakMap<Document, string>();

function loadTheme(doc: Document, theme: string): Promise<void> {
  if (theme === 'baseline') return Promise.resolve();
  const started = loads.get(doc) ?? new Map<string, Promise<void>>();
  loads.set(doc, started);
  let loading = started.get(theme);
  if (!loading) {
    const template = doc.querySelector<HTMLTemplateElement>('#theme-sheets');
    const contrast = doc.getElementById('contrast-sheet');
    // Only the parts not already in the head (a page or frame writes the active
    // theme's main sheet before its first paint).
    const sheets = [...template?.content.querySelectorAll<HTMLLinkElement>(`[data-theme-sheet="${theme}"]`) ?? []]
      .filter(link => !doc.querySelector(`head > link[data-theme-sheet="${theme}"][data-part="${link.dataset.part}"]`))
      .map(link => doc.importNode(link, true) as HTMLLinkElement);
    loading = Promise.all(sheets.map(link => new Promise<void>(resolve => {
      link.addEventListener('load', () => resolve(), { once: true });
      link.addEventListener('error', () => resolve(), { once: true });
      if (contrast && link.dataset.part === 'theme') contrast.before(link);
      else if (contrast) contrast.after(link);
      else doc.head.append(link);
    }))).then(() => undefined);
    started.set(theme, loading);
  }
  return loading;
}

/**
 * Shows `theme` in `doc` once its sheets are in; the latest call wins. The theme goes
 * on `targets` (the page's panel scopes) or, by default, on the document's root.
 */
export function applyTheme(doc: Document, theme: string, targets: readonly HTMLElement[] = [doc.documentElement]): void {
  wanted.set(doc, theme);
  void loadTheme(doc, theme).then(() => {
    if (wanted.get(doc) !== theme) return;
    for (const target of targets) target.dataset.theme = theme;
  });
}
