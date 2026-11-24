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

/** A pointer passing over the rail changes nothing: a destination opens once it rests there. */
const RAIL_HOVER_DELAY = 140;
/** The section whose rail item was just clicked: its drawer stays open through the navigation. */
let keptSection = '';

/** Each destination's drawer rows, rendered by the server into the shell beside the rail. */
type SectionRows = { rows: string; label: string };
let railSections: Record<string, SectionRows> | undefined;
const rowsFor = (href: string): SectionRows | null => {
  if (!railSections) {
    try { railSections = JSON.parse(document.getElementById('site-rail-sections')?.textContent || '{}'); } catch { railSections = {}; }
  }
  return railSections?.[href] ?? null;
};

/**
 * The site's one drawer, from 840px with a pointer. It stays in the shell across pages, and
 * resting on a rail destination puts that section's rows in it. It floats over the page, as
 * M3's does: no scrim, nothing pushed, and the page stays usable.
 */
function initRailDrawer(rail: HTMLElement, life: PageLifecycle) {
  const pointer = matchMedia('(min-width: 840px) and (hover: hover)');
  // From 1600px the drawer is docked: the page's own section stays open beside the rail.
  const wide = matchMedia('(min-width: 1600px) and (hover: hover)');
  const homeSection = () => document.querySelector('.component-list m-drawer, #sidebar m-drawer')
    ? rail.querySelector('m-navigation-rail')?.getAttribute('value') ?? ''
    : '';
  const docked = () => wide.matches && homeSection() !== '';
  let panel = document.querySelector<HTMLElement>('.site-rail-drawer');
  if (!panel) {
    panel = document.createElement('div');
    panel.className = 'site-rail-drawer';
    panel.inert = true;
    rail.after(panel);
  }
  const drawerPanel = panel;
  let intent: ReturnType<typeof setTimeout> | undefined;
  let closing: ReturnType<typeof setTimeout> | undefined;
  let wanted = '';
  let opener: HTMLElement | null = null;
  const hide = () => {
    clearTimeout(intent);
    clearTimeout(closing);
    keptSection = '';
    // Docked, the drawer never closes: it goes back to the page's own section.
    if (docked()) { void show(homeSection()); return; }
    wanted = '';
    drawerPanel.removeAttribute('data-open');
    drawerPanel.inert = true;
  };
  // Focus leaving (say, to the new page's heading) does not close a drawer the pointer is on.
  const hideSoon = () => {
    clearTimeout(closing);
    closing = setTimeout(() => { if (!rail.matches(':hover') && !drawerPanel.matches(':hover')) hide(); }, 160);
  };
  const show = async (href: string) => {
    clearTimeout(closing);
    if (!pointer.matches) return false;
    wanted = href;
    // Rows already there: open in this frame, so the page and the drawer move together.
    if (drawerPanel.dataset.section === href && drawerPanel.querySelector('m-drawer')) {
      drawerPanel.inert = false;
      drawerPanel.setAttribute('data-open', '');
    }
    const section = rowsFor(href);
    const { defineSiteDrawer } = await import('./catalog/drawer');
    if (!life.active || wanted !== href) return false;
    if (!section) { if (href !== homeSection()) hide(); return false; }
    defineSiteDrawer();
    let drawer = drawerPanel.querySelector<HTMLElement & { value: string }>('m-drawer');
    if (!drawer) {
      drawer = document.createElement('m-drawer') as HTMLElement & { value: string };
      drawer.className = 'site-drawer';
      drawer.toggleAttribute('open', true);
      drawer.toggleAttribute('dense', true);
      drawerPanel.append(drawer);
    }
    const sameSection = drawerPanel.dataset.section === href;
    if (!sameSection) {
      const rows = document.createElement('template');
      rows.innerHTML = section.rows;
      drawer.setAttribute('aria-label', section.label);
      drawer.replaceChildren(rows.content);
      drawerPanel.dataset.section = href;
      drawerPanel.scrollTop = 0;
    }
    if (drawer.value !== location.pathname) {
      // Moving the selection must not move the list the person is looking at.
      const top = drawerPanel.scrollTop;
      drawer.value = location.pathname;
      if (sameSection) {
        drawerPanel.scrollTop = top;
        requestAnimationFrame(() => { drawerPanel.scrollTop = top; });
      }
    }
    drawerPanel.inert = false;
    drawerPanel.setAttribute('data-open', '');
    return true;
  };
  // The rail's items live in its shadow root and an upgrade rebuilds them, so the rail listens.
  const railLink = (event: Event) => event.composedPath().find(node => node instanceof HTMLAnchorElement) as HTMLAnchorElement | undefined;
  const pathOf = (link: HTMLAnchorElement) => new URL(link.href).pathname;
  let overLink: HTMLAnchorElement | undefined;
  const trackPointer = (event: Event) => {
    const link = railLink(event);
    if (link === overLink) return;
    overLink = link;
    clearTimeout(intent);
    if (!link) { hideSoon(); return; }
    clearTimeout(closing);
    const href = pathOf(link);
    // Home has no section, so resting on it just closes the drawer.
    if (href === '/') {
      intent = setTimeout(hide, RAIL_HOVER_DELAY);
      return;
    }
    intent = setTimeout(() => void show(href), RAIL_HOVER_DELAY);
  };
  // Moves as well as overs: after a page transition Chrome sends no pointerover until the
  // pointer leaves the rail, though it still reports each move.
  life.events(rail).addEventListener('pointerover', trackPointer);
  life.events(rail).addEventListener('pointermove', trackPointer);
  life.events(rail).addEventListener('pointerleave', () => { overLink = undefined; clearTimeout(intent); hideSoon(); });
  life.events(rail).addEventListener('click', event => {
    const link = railLink(event);
    const mouse = event as MouseEvent;
    if (!link || mouse.button !== 0 || mouse.metaKey || mouse.ctrlKey || mouse.shiftKey || mouse.altKey) return;
    // Already there: a repeated click does nothing, and the drawer stays as it is.
    if (pathOf(link) === location.pathname) {
      event.preventDefault();
      return;
    }
    if (pathOf(link) === '/' || !pointer.matches) return;
    // The click changes the page only: the drawer keeps its rows, scroll and open groups.
    clearTimeout(intent);
    keptSection = pathOf(link);
  });
  life.events(rail).addEventListener('focusin', event => {
    const link = railLink(event);
    if (link && pathOf(link) !== '/' && link.matches(':focus-visible')) void show(pathOf(link));
  });
  life.events(rail).addEventListener('keydown', event => {
    const link = railLink(event);
    if ((event as KeyboardEvent).key !== 'ArrowRight' || !link || pathOf(link) === '/') return;
    event.preventDefault();
    opener = link;
    void show(pathOf(link)).then(shown => {
      if (shown) requestAnimationFrame(() => drawerPanel.querySelector('m-drawer')?.shadowRoot?.querySelector<HTMLElement>('a, button')?.focus());
    });
  });
  life.events(rail).addEventListener('focusout', event => {
    const next = (event as FocusEvent).relatedTarget as Element | null;
    if (!(next && (containsFocus(drawerPanel, next) || rail.contains(next)))) hideSoon();
  });
  life.events(drawerPanel).addEventListener('pointerenter', () => clearTimeout(closing));
  life.events(drawerPanel).addEventListener('pointerleave', () => { if (!containsFocus(drawerPanel, currentFocus())) hideSoon(); });
  life.events(drawerPanel).addEventListener('focusout', event => {
    const next = (event as FocusEvent).relatedTarget as Element | null;
    if (!(next && (containsFocus(drawerPanel, next) || rail.contains(next)))) hideSoon();
  });
  life.events(drawerPanel).addEventListener('click', event => {
    const link = event.composedPath().find(node => node instanceof HTMLAnchorElement) as HTMLAnchorElement | undefined;
    if (!link) return;
    const drawer = drawerPanel.querySelector<HTMLElement & { value: string }>('m-drawer');
    if (drawer && new URL(link.href).origin === location.origin) drawer.value = new URL(link.href).pathname;
    if (!docked()) hide();
  });
  life.events(document).addEventListener('keydown', event => {
    if ((event as KeyboardEvent).key !== 'Escape' || !drawerPanel.hasAttribute('data-open')) return;
    const inside = containsFocus(drawerPanel, currentFocus());
    hide();
    if (inside) opener?.focus();
  });
  life.events(document).addEventListener('pointerdown', event => {
    const path = event.composedPath();
    if (!path.includes(drawerPanel) && !path.includes(rail)) hide();
  });
  const syncDock = () => document.documentElement.toggleAttribute('data-drawer-docked', docked());
  life.events(pointer).addEventListener('change', hide);
  life.events(wide).addEventListener('change', () => { syncDock(); hide(); });
  life.add(() => {
    clearTimeout(intent);
    clearTimeout(closing);
    // A docked drawer stays through the navigation; the next page shows its own section.
    if (!keptSection && !wide.matches) hide();
  });
  syncDock();
  if (docked() && !keptSection) {
    // Already docked on arrival: it is simply there, with no slide.
    if (!drawerPanel.hasAttribute('data-open')) drawerPanel.setAttribute('data-instant', '');
    void show(homeSection()).then(() => requestAnimationFrame(() => drawerPanel.removeAttribute('data-instant')));
  } else if (wide.matches && !keptSection) hide();
  // Arrived from a rail click: the drawer stays, as the page changed beside it.
  if (keptSection) {
    const kept = keptSection;
    keptSection = '';
    void show(kept);
  }
}

export function initSiteNavigation(content: HTMLElement, life: PageLifecycle) {
  if (bar && rail && dialog && opener && closer) {
    const compact = matchMedia('(width < 600px)');
    // Touch screens have no hover to open the floating drawer, so they keep the modal one longer.
    const medium = matchMedia('(600px <= width < 840px), (min-width: 840px) and (hover: none)');
    // Move the server-rendered section list so its links and disclosure state serve both layouts.
    const section = document.querySelector('.component-list, #sidebar');
    const drawer = section?.querySelector('m-drawer');
    const sectionParent = section?.parentNode;
    const sectionNext = section?.nextSibling ?? null;

    void import('./catalog/navigation-rail').then(({ define }) => { if (life.active) define(); });
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
      const leavingPrimary = compact.matches ? containsFocus(rail, focused) : bar.contains(focused);
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
        const links = [...target.querySelectorAll('a'), ...(target.querySelector('m-navigation-rail')?.shadowRoot?.querySelectorAll('a') ?? [])];
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
    initRailDrawer(rail, life);
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
