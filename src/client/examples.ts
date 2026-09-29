// The example page: framework tabs switch the running frame and its source; the
// choice and the frame's appearance persist, and the URL carries the framework.
import { copyText } from './site';

const page = document.querySelector<HTMLElement>('.example-page');
if (page) {
  const slug = page.dataset.example!;
  const frame = document.querySelector<HTMLIFrameElement>('#example-frame')!;
  const status = document.querySelector<HTMLElement>('#example-status')!;
  const tabs = [...document.querySelectorAll<HTMLButtonElement>('.framework-tab')];
  const APPEARANCE = 'md3-preview-appearance';
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

  // Theme and mode: the frame reads them on load, as the playground's preview does.
  const theme = document.querySelector<HTMLSelectElement>('#example-theme')!;
  const modes = [...document.querySelectorAll<HTMLInputElement>('input[name="example-mode"]')];
  try {
    const saved = JSON.parse(localStorage.getItem(APPEARANCE) || '{}') as { theme?: string; mode?: string };
    if (saved.theme && [...theme.options].some(o => o.value === saved.theme)) theme.value = saved.theme;
    for (const m of modes) m.checked = m.value === (saved.mode === 'dark' ? 'dark' : 'light');
  } catch { /* Storage may be unavailable. */ }
  const applyAppearance = (): void => {
    const mode = modes.find(m => m.checked)?.value ?? 'light';
    try { localStorage.setItem(APPEARANCE, JSON.stringify({ theme: theme.value, mode })); } catch { /* Storage may be unavailable. */ }
    const root = frame.contentDocument?.documentElement;
    if (root) { root.dataset.theme = theme.value; root.dataset.themeMode = mode; root.style.colorScheme = mode; }
  };
  theme.addEventListener('change', applyAppearance);
  for (const m of modes) m.addEventListener('change', applyAppearance);
}
