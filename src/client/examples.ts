// The example page: framework tabs switch the running frame and its source; the
// choice persists and the URL carries the framework; the frame follows the site's
// appearance (the header).
import { applyTheme } from './theme-sheets';
import 'material/elements/css/chips';
import 'material/elements/css/button';
import 'material/elements/css/snackbar';
import { defineButton, defineChips, defineSnackbar } from 'material/elements';
import { onAppearance } from './appearance';
import { copyText } from './site';
import { mountDeviceFrame } from './device-frame';
import { registerPage, replacePageURL } from './page-lifecycle';
registerPage('examples', (content, life) => {
  defineChips();
  defineButton();
  defineSnackbar();
  const page = content.querySelector<HTMLElement>('.example-page');
  if (page) {
    const slug = page.dataset.example!;
    const frame = content.querySelector<HTMLIFrameElement>('#example-frame')!;
    const status = content.querySelector<HTMLElement>('#example-status')!;
    // Mobile, Tablet or Desktop: the frame at that device's size (src/client/device-frame.ts).
    const device = mountDeviceFrame(frame, { label: 'Example device' });
    life.add(() => device.destroy());
    // The framework chips (material's filter chip set, server-rendered; the same picker as
    // the component playgrounds): a chip's change switches the frame and its source.
    const chips = content.querySelector<HTMLElement & { value: unknown }>('m-chips.framework-chips');
    const chipFor = (id: string) => chips?.querySelector<HTMLElement>(`m-chip[value="${CSS.escape(id)}"]`);
    const offered = (id: string | null) => !!id && !!chipFor(id) && !chipFor(id)!.hasAttribute('disabled');
    const first = chips?.querySelector<HTMLElement>('m-chip:not([disabled])')?.getAttribute('value') ?? 'vanilla';
    const FRAMEWORK = 'md3-example-framework';
    let current = '';

    // `remember`: write the shared choice (read by the playgrounds and the docs switch) only
    // for a framework this page offers, picked on a chip or named by the address; a fallback
    // stays on this page.
    const select = (id: string, remember = false): void => {
      const framework = offered(id) ? id : first;
      const keep = remember && offered(id);
      if (framework === current) return;
      current = framework;
      if (chips) {
        if (chips.matches(':defined')) { if (String(chips.value) !== framework) chips.value = framework; }
        else chips.setAttribute('value', framework);
      }
      const label = chipFor(framework)?.textContent?.trim() ?? framework;
      const src = `/showcase/${slug}/frame/${framework}/`;
      if (!frame.src.endsWith(src)) frame.src = src;
      frame.title = `${page.querySelector('h1')?.textContent} — ${label}`;
      for (const source of content.querySelectorAll<HTMLElement>('.example-source')) source.hidden = source.dataset.framework !== framework;
      for (const size of content.querySelectorAll<HTMLElement>('.example-sizes > div')) size.classList.toggle('is-current', size.dataset.framework === framework);
      status.textContent = `Running the ${label} version`;
      const url = new URL(location.href);
      url.searchParams.set('framework', framework);
      replacePageURL(url);
      if (keep) { try { localStorage.setItem(FRAMEWORK, framework); } catch { /* Storage may be unavailable. */ } }
    };

    life.events(chips)?.addEventListener('change', event => {
      const value = (event as CustomEvent<{ value?: unknown }>).detail?.value ?? chips!.value;
      const id = String(Array.isArray(value) ? value[0] ?? '' : value ?? '');
      if (id) select(id, true);
    });

    const asked = new URLSearchParams(location.search).get('framework');
    let saved: string | null = null;
    try { saved = localStorage.getItem(FRAMEWORK); } catch { /* Storage may be unavailable. */ }
    if (asked) select(asked, true); else select(saved ?? first);

    /** One material snackbar, made on first use in the chips row's scope (it takes the theme). */
    type SnackbarHost = HTMLElement & { show(): void };
    let snackbar: SnackbarHost | null = null;
    const showSnackbar = (message: string) => {
      if (!life.active) return;
      if (!snackbar) {
        snackbar = document.createElement('m-snackbar') as SnackbarHost;
        snackbar.setAttribute('duration', 'short');
        content.querySelector('.framework-chips-row')?.append(snackbar);
      }
      snackbar.setAttribute('message', message);
      snackbar.show();
    };

    // File tabs and copy, per framework.
    for (const source of content.querySelectorAll<HTMLElement>('.example-source')) {
      const fileTabs = [...source.querySelectorAll<HTMLButtonElement>('[data-file][role="tab"]')];
      const files = [...source.querySelectorAll<HTMLElement>('pre[data-file]')];
      fileTabs.forEach(tab => life.events(tab).addEventListener('click', () => {
        for (const t of fileTabs) { const on = t === tab; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; }
        for (const f of files) f.hidden = f.dataset.file !== tab.dataset.file;
      }));
      // material's Copy code button: a copy confirms with the snackbar (its own live region);
      // when the clipboard refuses, the button says so, as before.
      life.events(source.querySelector<HTMLElement>('[data-copy]'))?.addEventListener('click', async event => {
        const button = event.currentTarget as HTMLElement;
        const visible = files.find(f => !f.hidden);
        if (await copyText(visible?.textContent ?? '')) { showSnackbar('Code copied'); return; }
        button.textContent = 'Select and copy the code';
        life.timeout(() => { button.textContent = 'Copy code'; }, 2000);
      });
    }

    // Theme and mode come from the site header (appearance.ts): a frame reads them on load,
    // as the playground's preview does, and the open frame follows every change live.
    // The chips row (a material scope) follows too, as on the component pages.
    const scopes = [...content.querySelectorAll<HTMLElement>('.playground--material')];
    life.add(onAppearance(({ theme, mode }) => {
      for (const scope of scopes) scope.dataset.themeMode = mode;
      void applyTheme(document, theme, scopes);
      const root = frame.contentDocument?.documentElement;
      if (!root) return;
      void applyTheme(root.ownerDocument, theme);
      root.dataset.themeMode = mode;
      root.style.colorScheme = mode;
    }));
  }
});
