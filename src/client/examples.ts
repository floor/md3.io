// The example page: Preview and Code share one card. Preview keeps the device
// frame; Code shows the selected framework's files. The framework choice persists
// and the URL carries it (`?framework=`), plus `?view=code` when Code is open
// (`#code` opens Code too). Back and Forward follow the view.
import { applyTheme } from './theme-sheets';
import 'material/elements/css/chips';
import 'material/elements/css/button';
import 'material/elements/css/snackbar';
import 'material/elements/css/tabs';
import { defineButton, defineChips, defineSnackbar, defineTabs } from 'material/elements';
import { onAppearance } from './appearance';
import { copyText } from './site';
import { mountDeviceFrame } from './device-frame';
import { registerPage, replacePageURL } from './page-lifecycle';

registerPage('examples', (content, life) => {
  defineChips();
  defineButton();
  defineSnackbar();
  defineTabs();
  const page = content.querySelector<HTMLElement>('.example-page');
  if (page) {
    const slug = page.dataset.example!;
    const card = page.querySelector<HTMLElement>('.example-stage')!;
    const frame = content.querySelector<HTMLIFrameElement>('#example-frame')!;
    const status = content.querySelector<HTMLElement>('#example-status')!;
    const previewPanel = content.querySelector<HTMLElement>('#example-preview')!;
    const codePanel = content.querySelector<HTMLElement>('#example-code')!;
    const heading = page.querySelector<HTMLElement>('.example-heading')!;
    // Mobile, Tablet or Desktop: the frame at that device's size (src/client/device-frame.ts).
    // The toolbar sits in the card's header, to the right of Preview / Code.
    const device = mountDeviceFrame(frame, { label: 'Example device', barParent: heading });
    life.add(() => device.destroy());
    // A phone only has room for the Mobile frame. Hold that size without overwriting
    // the device the viewer picked for a wider window.
    const phone = matchMedia('(width < 600px)');
    const applyPhone = () => device.hold(phone.matches ? { device: 'mobile', landscape: false } : null);
    life.events(phone).addEventListener('change', applyPhone);
    applyPhone();
    // The framework chips (material's filter chip set, server-rendered; the same picker as
    // the component playgrounds): a chip's change switches the frame and its source.
    const chips = content.querySelector<HTMLElement & { value: unknown }>('m-chips.framework-chips');
    const chipFor = (id: string) => chips?.querySelector<HTMLElement>(`m-chip[value="${CSS.escape(id)}"]`);
    const offered = (id: string | null) => !!id && !!chipFor(id) && !chipFor(id)!.hasAttribute('disabled');
    const first = chips?.querySelector<HTMLElement>('m-chip:not([disabled])')?.getAttribute('value') ?? 'vanilla';
    const FRAMEWORK = 'md3-example-framework';
    let current = '';
    type HistoryMode = 'push' | 'replace' | 'none';
    let view: 'preview' | 'code' = 'preview';

    const readView = (): 'preview' | 'code' => {
      const url = new URL(location.href);
      return url.searchParams.get('view') === 'code' || url.hash === '#code' ? 'code' : 'preview';
    };
    const writeUrl = (mode: HistoryMode) => {
      if (mode === 'none' || !current) return;
      const url = new URL(location.href);
      url.searchParams.set('framework', current);
      if (view === 'code') url.searchParams.set('view', 'code');
      else url.searchParams.delete('view');
      if (url.hash === '#code') url.hash = '';
      const next = `${url.pathname}${url.search}${url.hash}`;
      if (next === `${location.pathname}${location.search}${location.hash}`) return;
      if (mode === 'push') history.pushState(history.state, '', url);
      else replacePageURL(url);
    };
    type TabsHost = HTMLElement & { value: string | null };
    const viewTabs = page.querySelector<TabsHost>('m-tabs[aria-label="Example view"]');
    const applyView = (next: 'preview' | 'code') => {
      view = next;
      card.dataset.view = next;
      previewPanel.hidden = next !== 'preview';
      codePanel.hidden = next !== 'code';
      if (!viewTabs) return;
      // Before the element is defined, the property would shadow its setter.
      if (viewTabs.matches(':defined')) { if (viewTabs.value !== next) viewTabs.value = next; }
      else viewTabs.setAttribute('value', next);
    };

    // `remember`: write the shared choice (read by the playgrounds and the docs switch) only
    // for a framework this page offers, picked on a chip or named by the address; a fallback
    // stays on this page.
    const select = (id: string, remember = false, mode: HistoryMode = 'replace'): void => {
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
      writeUrl(mode);
      if (keep) { try { localStorage.setItem(FRAMEWORK, framework); } catch { /* Storage may be unavailable. */ } }
    };

    life.events(chips)?.addEventListener('change', event => {
      const value = (event as CustomEvent<{ value?: unknown }>).detail?.value ?? chips!.value;
      const id = String(Array.isArray(value) ? value[0] ?? '' : value ?? '');
      if (id) select(id, true);
    });

    // Arrow keys move between Preview and Code (m-tabs). Enter or Space opens the
    // focused tab; a keyboard open of Code moves focus into that panel.
    let fromKeyboard = false;
    life.events(viewTabs)?.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') fromKeyboard = true;
    }, true);
    life.events(viewTabs)?.addEventListener('pointerdown', () => { fromKeyboard = false; }, true);
    life.events(viewTabs)?.addEventListener('change', () => {
      const keyboard = fromKeyboard;
      fromKeyboard = false;
      const next = String(viewTabs!.value) === 'code' ? 'code' : 'preview';
      if (next === view) return;
      applyView(next);
      writeUrl('push');
      if (keyboard && next === 'code') codePanel.focus();
    });

    applyView(readView());
    const asked = new URLSearchParams(location.search).get('framework');
    let saved: string | null = null;
    try { saved = localStorage.getItem(FRAMEWORK); } catch { /* Storage may be unavailable. */ }
    if (asked) select(asked, true); else select(saved ?? first);
    // The first paint followed the query. A `#code` link still needs the query form,
    // so Back and Forward share one shape of address.
    writeUrl('replace');

    life.events(window).addEventListener('popstate', () => {
      const id = new URLSearchParams(location.search).get('framework');
      if (id) select(id, false, 'none');
      applyView(readView());
    });

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

    // File tabs and copy, per framework. The file tabs are a real tablist: arrows
    // move the selection and the focus, as the view tabs do.
    for (const source of content.querySelectorAll<HTMLElement>('.example-source')) {
      const fileTabs = [...source.querySelectorAll<HTMLButtonElement>('[data-file][role="tab"]')];
      const files = [...source.querySelectorAll<HTMLElement>('pre[data-file]')];
      const selectFile = (tab: HTMLButtonElement) => {
        for (const t of fileTabs) { const on = t === tab; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; }
        for (const f of files) f.hidden = f.dataset.file !== tab.dataset.file;
      };
      fileTabs.forEach(tab => {
        life.events(tab).addEventListener('click', () => selectFile(tab));
        life.events(tab).addEventListener('keydown', event => {
          const index = fileTabs.indexOf(tab);
          const target = event.key === 'ArrowRight' ? fileTabs[(index + 1) % fileTabs.length]
            : event.key === 'ArrowLeft' ? fileTabs[(index + fileTabs.length - 1) % fileTabs.length]
            : event.key === 'Home' ? fileTabs[0] : event.key === 'End' ? fileTabs.at(-1) : undefined;
          if (!target) return;
          event.preventDefault();
          selectFile(target);
          target.focus();
        });
      });
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

  // The overview gallery (/showcase/): material filter chips by component and by
  // tag, the choice kept in the URL query, and each card's live preview frame
  // loaded only when the card nears the viewport (data-src becomes src) — a live
  // frame per card would otherwise pull every example's bundle on first paint.
  const overview = content.querySelector<HTMLElement>('.showcase-overview');
  if (overview) {
    const cards = [...overview.querySelectorAll<HTMLElement>('.showcase-card-item')];
    const count = overview.querySelector<HTMLElement>('#showcase-count');
    const state: Record<'component' | 'tag', string> = { component: '', tag: '' };
    const params = new URLSearchParams(location.search);
    state.component = params.get('component') ?? '';
    state.tag = params.get('tag') ?? '';

    const apply = (): void => {
      let shown = 0;
      for (const card of cards) {
        const components = (card.dataset.components ?? '').split(' ').filter(Boolean);
        const tags = (card.dataset.tags ?? '').split(' ').filter(Boolean);
        const visible = (!state.component || components.includes(state.component)) && (!state.tag || tags.includes(state.tag));
        card.hidden = !visible;
        if (visible) shown++;
      }
      if (count) count.textContent = `${shown} ${shown === 1 ? 'example' : 'examples'}`;
      const url = new URL(location.href);
      for (const group of ['component', 'tag'] as const) {
        if (state[group]) url.searchParams.set(group, state[group]);
        else url.searchParams.delete(group);
      }
      replacePageURL(url);
    };

    for (const set of overview.querySelectorAll<HTMLElement>('m-chips[data-filter-group]')) {
      const group = set.dataset.filterGroup as 'component' | 'tag';
      const initial = state[group];
      if (initial) {
        const host = set as HTMLElement & { value: unknown };
        if (set.matches(':defined')) host.value = initial;
        else set.setAttribute('value', initial);
      }
      life.events(set).addEventListener('change', event => {
        const detail = (event as CustomEvent<{ value?: unknown }>).detail?.value ?? (set as HTMLElement & { value: unknown }).value;
        const value = String(Array.isArray(detail) ? detail[0] ?? '' : detail ?? '');
        state[group] = value === 'all' ? '' : value;
        apply();
      });
    }
    apply();

    const frames = [...overview.querySelectorAll<HTMLIFrameElement>('.example-card__frame')];
    const load = (frame: HTMLIFrameElement): void => { if (frame.dataset.src && !frame.src) frame.src = frame.dataset.src; };
    if ('IntersectionObserver' in window) {
      const observer = life.observer(new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) { load(entry.target as HTMLIFrameElement); observer.unobserve(entry.target); }
        }
      }, { rootMargin: '400px' }));
      for (const frame of frames) observer.observe(frame);
    } else for (const frame of frames) load(frame);

    const scopes = [...overview.querySelectorAll<HTMLElement>('.playground--material')];
    life.add(onAppearance(({ theme, mode }) => {
      for (const scope of scopes) scope.dataset.themeMode = mode;
      void applyTheme(document, theme, scopes);
    }));
  }
});
