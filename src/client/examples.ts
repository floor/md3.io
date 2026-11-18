// The example page: framework tabs switch the running frame and its source; the
// choice persists and the URL carries the framework; the frame follows the site's
// appearance (the header).
import { applyTheme } from './theme-sheets';
import 'material/elements/css/chips';
import { defineChips } from 'material/elements';
import { onAppearance } from './appearance';
import { copyText } from './site';
import { mountDeviceFrame } from './device-frame';

defineChips();
const page = document.querySelector<HTMLElement>('.example-page');
if (page) {
  const slug = page.dataset.example!;
  const frame = document.querySelector<HTMLIFrameElement>('#example-frame')!;
  const status = document.querySelector<HTMLElement>('#example-status')!;
  // Mobile, Tablet or Desktop: the frame at that device's size (src/client/device-frame.ts).
  mountDeviceFrame(frame, { label: 'Example device' });
  // The framework chips (material's filter chip set, server-rendered; the same picker as
  // the component playgrounds): a chip's change switches the frame and its source.
  const chips = document.querySelector<HTMLElement & { value: unknown }>('m-chips.framework-chips');
  const chipFor = (id: string) => chips?.querySelector<HTMLElement>(`m-chip[value="${CSS.escape(id)}"]`);
  const offered = (id: string | null) => !!id && !!chipFor(id) && !chipFor(id)!.hasAttribute('disabled');
  const first = chips?.querySelector<HTMLElement>('m-chip:not([disabled])')?.getAttribute('value') ?? 'vanilla';
  const FRAMEWORK = 'md3-example-framework';
  let current = '';

  const select = (id: string): void => {
    const framework = offered(id) ? id : first;
    if (framework === current) return;
    current = framework;
    if (chips) {
      if (chips.matches(':defined')) { if (String(chips.value) !== framework) chips.value = framework; }
      else chips.setAttribute('value', framework);
    }
    const label = chipFor(framework)?.textContent?.trim() ?? framework;
    const src = `/examples/${slug}/frame/${framework}/`;
    if (!frame.src.endsWith(src)) frame.src = src;
    frame.title = `${page.querySelector('h1')?.textContent} — ${label}`;
    for (const source of document.querySelectorAll<HTMLElement>('.example-source')) source.hidden = source.dataset.framework !== framework;
    for (const size of document.querySelectorAll<HTMLElement>('.example-sizes > div')) size.classList.toggle('is-current', size.dataset.framework === framework);
    status.textContent = `Running the ${label} version`;
    const url = new URL(location.href);
    url.searchParams.set('framework', framework);
    history.replaceState(null, '', url);
    try { localStorage.setItem(FRAMEWORK, framework); } catch { /* Storage may be unavailable. */ }
  };

  chips?.addEventListener('change', event => {
    const value = (event as CustomEvent<{ value?: unknown }>).detail?.value ?? chips.value;
    const id = String(Array.isArray(value) ? value[0] ?? '' : value ?? '');
    if (id) select(id);
  });

  let initial = new URLSearchParams(location.search).get('framework');
  try { initial ??= localStorage.getItem(FRAMEWORK); } catch { /* Storage may be unavailable. */ }
  select(initial ?? first);

  // File tabs and copy, per framework.
  for (const source of document.querySelectorAll<HTMLElement>('.example-source')) {
    const fileTabs = [...source.querySelectorAll<HTMLButtonElement>('[data-file][role="tab"]')];
    const files = [...source.querySelectorAll<HTMLElement>('pre[data-file]')];
    fileTabs.forEach(tab => tab.addEventListener('click', () => {
      for (const t of fileTabs) { const on = t === tab; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; }
      for (const f of files) f.hidden = f.dataset.file !== tab.dataset.file;
    }));
    source.querySelector<HTMLButtonElement>('[data-copy]')?.addEventListener('click', async event => {
      const button = event.currentTarget as HTMLButtonElement;
      const visible = files.find(f => !f.hidden);
      button.textContent = await copyText(visible?.textContent ?? '') ? 'Copied!' : 'Select and copy the code';
      setTimeout(() => { button.textContent = 'Copy code'; }, 2000);
    });
  }

  // Theme and mode come from the site header (appearance.ts): a frame reads them on load,
  // as the playground's preview does, and the open frame follows every change live.
  onAppearance(({ theme, mode }) => {
    const root = frame.contentDocument?.documentElement;
    if (!root) return;
    void applyTheme(root.ownerDocument, theme);
    root.dataset.themeMode = mode;
    root.style.colorScheme = mode;
  });
}
