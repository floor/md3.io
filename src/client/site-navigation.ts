import type { PageLifecycle } from './page-lifecycle';
const bar = document.querySelector<HTMLElement>('#site-primary-bar');
const rail = document.querySelector<HTMLElement>('#site-primary-rail');
const dialog = document.querySelector<HTMLDialogElement>('#site-nav-dialog');
const opener = document.querySelector<HTMLButtonElement>('#site-nav-open');
const closer = document.querySelector<HTMLButtonElement>('#site-nav-close');
const sectionOpener = document.querySelector<HTMLElement>('#site-section-open');

// Resizing can hide the focused element before the media query's event fires.
let lastFocus = document.activeElement;
document.addEventListener('focusin', event => {
  const target = event.composedPath()[0];
  if (target instanceof Element) lastFocus = target;
});
export const currentFocus = () => {
  const active = document.activeElement;
  return active?.shadowRoot?.activeElement ?? (active === document.body ? lastFocus : active);
};
export const containsFocus = (container: Element, target: Element | null) => {
  const root = target?.getRootNode();
  return container.contains(root instanceof ShadowRoot ? root.host : target);
};

let restoreSection = () => {};
export function closeSiteNavigation() {
  // close is queued: the next page's handler may be installed before it fires.
  // A navigation hands focus to its heading, rather than back to the rail opener.
  if (dialog?.open) dialog.addEventListener('close', event => event.stopImmediatePropagation(), { once: true, capture: true });
  restoreSection();
}

export function initSiteNavigation(content: HTMLElement, life: PageLifecycle) {
  if (bar && rail && dialog && opener && closer) {
    const compact = matchMedia('(width < 600px)');
    const medium = matchMedia('(600px <= width < 840px)');
    // Move the server-rendered section list so its links and disclosure state serve both layouts.
    const section = document.querySelector('.component-list, #sidebar');
    const drawer = section?.querySelector('m-drawer');
    const sectionParent = section?.parentNode;
    const sectionNext = section?.nextSibling ?? null;

    if (drawer) void import('./catalog/drawer').then(({ defineSiteDrawer }) => {
      const id = drawer.shadowRoot?.activeElement?.getAttribute('data-id');
      if (!life.active) return;
      defineSiteDrawer();
      if (id) drawer.shadowRoot?.querySelector<HTMLElement>(`[data-id="${CSS.escape(id)}"]`)?.focus();
    });

    // The phone's opener is material's icon button: its inner button carries the popup state,
    // and an upgrade rebuilds that button.
    const markSectionOpener = () => {
      const button = sectionOpener?.shadowRoot?.querySelector('button');
      button?.setAttribute('aria-haspopup', 'dialog');
      button?.setAttribute('aria-controls', 'site-nav-dialog');
      button?.setAttribute('aria-expanded', String(dialog.open));
    };
    void customElements.whenDefined('m-icon-button').then(() => { if (life.active) markSectionOpener(); });
    const modalWindow = () => compact.matches || medium.matches;

    const syncModal = () => {
      if (section && section.parentNode === dialog && !dialog.open) sectionParent?.insertBefore(section, sectionNext);
      rail.inert = dialog.open;
      if (dialog.open) rail.setAttribute('aria-hidden', 'true');
      else rail.removeAttribute('aria-hidden');
      opener.setAttribute('aria-expanded', String(dialog.open));
      markSectionOpener();
    };

    restoreSection = () => { dialog.close(); syncModal(); };
    life.add(() => { syncModal(); restoreSection = () => {}; });

    const syncNavigation = () => {
      const focused = currentFocus();
      const target = compact.matches ? bar : rail;
      const leavingPrimary = compact.matches ? rail.contains(focused) : bar.contains(focused);
      const leavingModal = !modalWindow() && (containsFocus(dialog, focused) || focused === opener);
      const closeForResize = !modalWindow() && dialog.open;
      const href = focused?.closest('a')?.getAttribute('href');
      bar.hidden = !compact.matches;
      rail.hidden = compact.matches;
      opener.hidden = !medium.matches;
      if (closeForResize) {
        dialog.close();
        syncModal();
      }
      if (!leavingPrimary && !leavingModal) return;
      const moveFocus = () => {
        if (target.hidden) return;
        const links = Array.from(target.querySelectorAll('a'));
        const sectionFocus = !compact.matches && focused instanceof HTMLElement && section && containsFocus(section, focused)
          && focused.getClientRects().length ? focused : null;
        (sectionFocus ?? links.find(link => href && link.getAttribute('href') === href)
          ?? links.find(link => link.hasAttribute('aria-current')) ?? links[0])?.focus();
      };
      // Let the dialog release focus and the desktop index open before transferring it.
      if (closeForResize) requestAnimationFrame(moveFocus);
      else moveFocus();
    };

    const openModal = () => {
      if (!modalWindow() || dialog.open) return;
      if (section) dialog.append(section);
      dialog.showModal();
      syncModal();
    };
    life.events(opener).addEventListener('click', openModal);
    if (sectionOpener) {
      // As for search: Escape must not draw the keyboard ring for someone who opened with the pointer.
      life.events(sectionOpener).addEventListener('click', event => {
        sectionOpener.toggleAttribute('data-quiet-focus', (event as MouseEvent).detail > 0);
        openModal();
      });
      life.events(sectionOpener).addEventListener('focusout', () => {
        if (!dialog.open) sectionOpener.removeAttribute('data-quiet-focus');
      });
    }
    life.events(closer).addEventListener('click', () => dialog.close());
    // As on desktop, the selection moves on the click, before the next page has arrived.
    life.events(dialog).addEventListener('click', event => {
      const mouse = event as MouseEvent;
      if (mouse.button !== 0 || mouse.metaKey || mouse.ctrlKey || mouse.shiftKey || mouse.altKey || !drawer) return;
      const link = event.composedPath().find(node => node instanceof HTMLAnchorElement) as HTMLAnchorElement | undefined;
      if (link && new URL(link.href).origin === location.origin) (drawer as HTMLElement & { value: string }).value = new URL(link.href).pathname;
    });
    life.events(dialog).addEventListener('close', () => {
      syncModal();
      if (life.active && modalWindow() && !dialog.open) (compact.matches ? sectionOpener : opener)?.focus();
    });
    life.events(dialog).addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      // Keep Tab inside the modal at both ends, including browsers that can
      // otherwise move keyboard focus to their chrome. Families can hide links.
      const visible = (control: HTMLElement) => control.getClientRects().length && !control.closest('[inert]');
      const controls = 'a[href], button';
      const last = Array.from(drawer?.shadowRoot?.querySelectorAll<HTMLElement>(controls) ?? []).findLast(visible)
        ?? Array.from(dialog.querySelectorAll<HTMLElement>(controls)).findLast(visible);
      const active = currentFocus();
      if (last && (event.shiftKey ? active === closer : active === last)) {
        event.preventDefault();
        (event.shiftKey ? last : closer).focus();
      }
    });
    life.events(compact).addEventListener('change', syncNavigation);
    life.events(medium).addEventListener('change', syncNavigation);
    syncNavigation();
  }

  const index = document.querySelector<HTMLDetailsElement>('#section-index, #component-catalog-index');
  const summary = index?.querySelector<HTMLElement>('summary');
  const indexLinks = index?.querySelector<HTMLElement>('m-drawer');
  if (index && summary && indexLinks) {
    const expanded = matchMedia('(min-width: 840px)');
    // The catalog's parser-time script cannot run in fetched HTML. Apply the same
    // initial responsive state on every visit before tracking user disclosures.
    if (index.id === 'component-catalog-index') index.open = expanded.matches;
    let openInline = index.open;
    life.events(index).addEventListener('toggle', () => {
      if (!expanded.matches) openInline = index.open;
    });
    const syncIndex = () => {
      const focused = currentFocus();
      if (expanded.matches) {
        index.open = true;
        summary.hidden = true;
        if (focused === summary) {
          const current = indexLinks.shadowRoot?.querySelector<HTMLElement>('[aria-current]');
          (current?.getClientRects().length ? current : indexLinks.shadowRoot?.querySelector('a'))?.focus();
        }
      } else {
        summary.hidden = false;
        index.open = openInline || containsFocus(indexLinks, focused);
      }
    };
    life.events(expanded).addEventListener('change', syncIndex);
    syncIndex();
  }
}
