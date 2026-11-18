// The example page: framework tabs switch the running frame and its source; the
// choice persists and the URL carries the framework; the frame follows the site's
// appearance (the header).
import { applyTheme } from './theme-sheets';
import { onAppearance } from './appearance';
import { copyText } from './site';
import { mountDeviceFrame } from './device-frame';

const page = document.querySelector<HTMLElement>('.example-page');
if (page) {
  const slug = page.dataset.example!;
  const frame = document.querySelector<HTMLIFrameElement>('#example-frame')!;
  const status = document.querySelector<HTMLElement>('#example-status')!;
  // Mobile, Tablet or Desktop: the frame at that device's size (src/client/device-frame.ts).
  mountDeviceFrame(frame, { label: 'Example device' });
  const tabs = [...document.querySelectorAll<HTMLButtonElement>('.framework-tab')];
  const FRAMEWORK = 'md3-example-framework';

  const select = (id: string, focus = false): void => {
    const tab = tabs.find(t => t.dataset.framework === id) ?? tabs[0]!;
    for (const t of tabs) {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    }
    if (focus) tab.focus();
    const framework = tab.dataset.framework!;
    const src = `/examples/${slug}/frame/${framework}/`;
    if (!frame.src.endsWith(src)) frame.src = src;
    frame.title = `${page.querySelector('h1')?.textContent} — ${tab.textContent}`;
    for (const source of document.querySelectorAll<HTMLElement>('.example-source')) source.hidden = source.dataset.framework !== framework;
    for (const size of document.querySelectorAll<HTMLElement>('.example-sizes > div')) size.classList.toggle('is-current', size.dataset.framework === framework);
    status.textContent = `Running the ${tab.textContent} version`;
    const url = new URL(location.href);
    url.searchParams.set('framework', framework);
    history.replaceState(null, '', url);
    try { localStorage.setItem(FRAMEWORK, framework); } catch { /* Storage may be unavailable. */ }
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab.dataset.framework!));
    tab.addEventListener('keydown', event => {
      const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      const target = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : step ? (i + step + tabs.length) % tabs.length : -1;
      if (target < 0) return;
      event.preventDefault();
      select(tabs[target]!.dataset.framework!, true);
    });
  });

  let initial = new URLSearchParams(location.search).get('framework');
  try { initial ??= localStorage.getItem(FRAMEWORK); } catch { /* Storage may be unavailable. */ }
  select(initial ?? tabs[0]!.dataset.framework!);

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
