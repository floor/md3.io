import { containsFocus, currentFocus, initSiteNavigation } from './site-navigation';
import { copyText } from './site';
import { registerPage, mountPage } from './page-lifecycle';
import { drawWaves } from './hero-waves';
registerPage('site-content', (content, life) => {
  const root = document.documentElement;
  initSiteNavigation(content, life);
  // The overview heroes' art tile: a fresh drawing in the theme's colours on each visit.
  for (const tile of content.querySelectorAll<HTMLElement>('.page-hero__art')) drawWaves(tile);
  const docToc = content.querySelector('.doc-toc');
  if (docToc) {
    const tocHidden = matchMedia('(width < 1200px)');
    life.events(tocHidden).addEventListener('change', () => {
      const focused = currentFocus();
      if (!tocHidden.matches || !(focused instanceof HTMLAnchorElement) || !docToc.contains(focused)) return;
      const id = focused.getAttribute('href')?.slice(1) ?? '';
      const target = document.getElementById(id) ?? document.getElementById('content');
      if (target && !target.hasAttribute('tabindex')) target.tabIndex = -1;
      target?.focus();
    });

    // The section being read is marked in the list: the last heading that has
    // reached the top fifth of the window, or the last one at the page's end.
    const links = [...docToc.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')];
    let frame = 0;
    const markCurrent = () => {
      frame = 0;
      const shown = links.filter(link => link.getClientRects().length);
      const line = innerHeight / 5;
      let current: HTMLAnchorElement | undefined = shown[0];
      for (const link of shown) {
        const heading = document.getElementById(decodeURIComponent(link.hash.slice(1)));
        if (heading && heading.getBoundingClientRect().top <= line) current = link;
      }
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) current = shown.at(-1);
      for (const link of links) {
        if (link === current) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    };
    const schedule = () => { frame ||= requestAnimationFrame(markCurrent); };
    life.events(window).addEventListener('scroll', schedule, { passive: true });
    life.events(window).addEventListener('resize', schedule);
    life.add(() => cancelAnimationFrame(frame));
    // A framework switch changes which headings are shown.
    const observer = new MutationObserver(schedule);
    observer.observe(root, { attributes: true, attributeFilter: ['data-framework'] });
    life.add(() => observer.disconnect());
    markCurrent();
  }

  const componentList = content.querySelector<HTMLElement>('.component-list-layout--detail .component-list');
  if (componentList) {
    const detail = componentList.closest('.component-list-layout--detail');
    const drawer = componentList.querySelector('m-drawer');
    const expanded = matchMedia('(min-width: 840px)');
    const keepCurrentComponentInView = () => {
      if (!expanded.matches) return;
      const current = drawer?.shadowRoot?.querySelector<HTMLElement>('[aria-current="page"]');
      if (!current?.getClientRects().length) return;
      const pane = componentList.getBoundingClientRect();
      const row = current.getBoundingClientRect();
      if (row.top < pane.top || row.bottom > pane.bottom) {
        componentList.scrollTop += row.top - pane.top - (pane.height - row.height) / 2;
      }
    };
    life.events(expanded).addEventListener('change', () => {
      if (expanded.matches) keepCurrentComponentInView();
      else if (containsFocus(componentList, currentFocus())) {
        detail?.querySelector<HTMLElement>('.component-list-up')?.focus({ preventScroll: true });
      }
    });
    keepCurrentComponentInView();
    // The lazy drawer definition rebuilds its rows after this page initializes.
    // Recheck the selected row once that upgrade has established its geometry.
    void customElements.whenDefined('m-drawer').then(() => {
      if (life.active) keepCurrentComponentInView();
    });
  }

  // The package manager of the `install` blocks: one choice for every block, remembered.
  const managerOptions = [...content.querySelectorAll<HTMLButtonElement>('.doc-install__option')];
  function showManager(manager: string) {
    root.dataset.packageManager = manager;
    for (const option of managerOptions) option.setAttribute('aria-pressed', String(option.dataset.packageManager === manager));
  }
  if (managerOptions.length) showManager(root.dataset.packageManager ?? 'bun');
  for (const option of managerOptions) {
    life.events(option).addEventListener('click', () => {
      showManager(option.dataset.packageManager!);
      try { localStorage.setItem('md3-package-manager', option.dataset.packageManager!); } catch { /* Storage may be unavailable. */ }
    });
  }

  // Copy the command shown for the reader's package manager.
  for (const copy of content.querySelectorAll<HTMLButtonElement>('.doc-install__copy')) {
    life.events(copy).addEventListener('click', async () => {
      const shown = [...copy.closest('.doc-install')!.querySelectorAll<HTMLElement>('.doc-install__command')].find(command => getComputedStyle(command).display !== 'none');
      copy.textContent = shown && await copyText(shown.textContent!.trim()) ? 'Copied' : 'Copy failed';
      life.timeout(() => { copy.textContent = 'Copy'; }, 1600);
    });
  }

  if (content.querySelector('.docs-frameworks')) void import('./docs-frameworks').then(() => { if (life.active) mountPage('docs-frameworks'); });
});
