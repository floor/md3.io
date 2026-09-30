// The site search dialog: ⌘K / Ctrl+K or the header button opens it, the input
// queries /api/search, the arrows move through the results, Enter opens one.
interface Result { title: string; url: string; section: string; group: string; snippet: string; terms: string[] }

const dialog = document.querySelector<HTMLDialogElement>('#search-dialog');
const input = document.querySelector<HTMLInputElement>('#search-input');
const results = document.querySelector<HTMLElement>('#search-results');
const trigger = document.querySelector<HTMLButtonElement>('#search-trigger');

if (dialog && input && results) {
  let current: Result[] = [];
  let active = -1;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let request: AbortController | null = null;
  let returnFocus: HTMLElement | null = null;

  // The shortcut hint reads Ctrl K off Apple platforms.
  if (!/Mac|iPhone|iPad/.test(navigator.platform)) {
    const kbd = trigger?.querySelector('.header__search-kbd');
    if (kbd) kbd.innerHTML = '<kbd>Ctrl</kbd><kbd>K</kbd>';
  }

  const open = (): void => {
    if (dialog.open) return;
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
    input.focus();
  };
  const close = (): void => {
    if (dialog.open) dialog.close();
  };
  // Escape (the dialog's cancel), the Esc button, a click outside, a result: all end here.
  dialog.addEventListener('close', () => {
    clearTimeout(timer);
    request?.abort();
    input.value = '';
    show([]);
    results.replaceChildren();
    returnFocus?.focus();
  });

  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (dialog.open) close(); else open();
    }
  });
  trigger?.addEventListener('click', open);
  document.querySelector('#search-esc')?.addEventListener('click', close);
  // The dialog fills the viewport; a click on it, not on the panel, is outside.
  dialog.addEventListener('click', event => { if (event.target === dialog) close(); });

  input.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!current.length) return;
      active = event.key === 'ArrowDown' ? (active + 1) % current.length : (active <= 0 ? current.length : active) - 1;
      updateActive();
    }
    else if (event.key === 'Enter') {
      event.preventDefault();
      const result = current[active];
      if (result) { close(); location.href = result.url; }
    }
  });

  input.addEventListener('input', () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (!q) { request?.abort(); show([]); results.replaceChildren(); return; }
    timer = setTimeout(() => void search(q), 150);
  });

  async function search(q: string): Promise<void> {
    request?.abort();
    request = new AbortController();
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: request.signal });
      const data = await response.json() as { results: Result[] };
      show(data.results);
      render(q);
    }
    catch (error) {
      if ((error as Error).name !== 'AbortError') console.error('Search failed:', error);
    }
  }

  function show(items: Result[]): void {
    current = items;
    active = items.length ? 0 : -1;
    input!.setAttribute('aria-expanded', String(items.length > 0));
    input!.removeAttribute('aria-activedescendant');
  }

  const escape = (text: string): string => text.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
  // The matched words, marked where a word starts: `peek` in `peek-height`.
  function highlight(text: string, terms: string[]): string {
    const words = [...new Set(terms)].filter(Boolean).sort((a, b) => b.length - a.length).map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (!words.length) return escape(text);
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}])(?:${words.join('|')})`, 'giu');
    let html = '';
    let last = 0;
    for (const match of text.matchAll(pattern)) {
      html += `${escape(text.slice(last, match.index))}<mark>${escape(match[0])}</mark>`;
      last = match.index + match[0].length;
    }
    return html + escape(text.slice(last));
  }

  function render(q: string): void {
    if (!current.length) {
      results!.innerHTML = `<div class="search-dialog__empty" role="status">No results for “${escape(q)}”</div>`;
      return;
    }
    const sections = [...new Set(current.map(result => result.section))];
    results!.innerHTML = `<div role="listbox" id="search-listbox" aria-label="Search results">${sections.map((section, s) => `
      <div class="search-dialog__group" role="group" aria-labelledby="search-group-${s}">
        <div class="search-dialog__group-label" id="search-group-${s}">${escape(section)}</div>
        ${current.map((result, i) => result.section !== section ? '' : `
        <a href="${escape(result.url)}" class="search-dialog__result" id="search-result-${i}" role="option" aria-selected="false" tabindex="-1" data-index="${i}">
          <div class="search-dialog__result-body">
            <div class="search-dialog__result-title">${highlight(result.title, result.terms)}</div>
            <div class="search-dialog__result-snippet${result.snippet.startsWith('<m-') ? ' search-dialog__result-snippet--code' : ''}">${highlight(result.snippet, result.terms)}</div>
          </div>
          <span class="search-dialog__result-badge">${escape(result.group || result.section)}</span>
          <svg class="search-dialog__result-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
        </a>`).join('')}
      </div>`).join('')}</div>`;
    for (const link of results!.querySelectorAll<HTMLAnchorElement>('.search-dialog__result')) {
      link.addEventListener('mouseenter', () => { active = Number(link.dataset.index); updateActive(); });
      link.addEventListener('click', close);
    }
    updateActive();
  }

  function updateActive(): void {
    for (const link of results!.querySelectorAll<HTMLElement>('.search-dialog__result')) {
      const on = Number(link.dataset.index) === active;
      link.classList.toggle('search-dialog__result--active', on);
      link.setAttribute('aria-selected', String(on));
      if (on) {
        link.scrollIntoView({ block: 'nearest' });
        input!.setAttribute('aria-activedescendant', link.id);
      }
    }
  }

  // /?q=term opens the search on that term: the home page's SearchAction (src/server/seo.ts).
  // The address loses the query, so a reload does not open it again.
  const params = new URLSearchParams(location.search);
  const query = params.get('q')?.trim();
  if (query) {
    open();
    input.value = query;
    void search(query);
    params.delete('q');
    history.replaceState(history.state, '', `${location.pathname}${params.size ? `?${params}` : ''}${location.hash}`);
  }
}
