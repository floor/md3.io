const bar = document.querySelector<HTMLElement>('#site-primary-bar');
const rail = document.querySelector<HTMLElement>('#site-primary-rail');
const dialog = document.querySelector<HTMLDialogElement>('#site-nav-dialog');
const opener = document.querySelector<HTMLButtonElement>('#site-nav-open');
const closer = document.querySelector<HTMLButtonElement>('#site-nav-close');

// Resizing can hide the focused element before the media query's event fires.
let lastFocus = document.activeElement;
document.addEventListener('focusin', event => {
  if (event.target instanceof Element) lastFocus = event.target;
});
export const currentFocus = () => document.activeElement === document.body ? lastFocus : document.activeElement;

if (bar && rail && dialog && opener && closer) {
  const compact = matchMedia('(width < 600px)');
  const medium = matchMedia('(600px <= width < 840px)');
  // Move the server-rendered section list so its links and disclosure state serve both layouts.
  const section = document.querySelector('.component-list, #sidebar');
  const sectionParent = section?.parentNode;
  const sectionNext = section?.nextSibling ?? null;

  const syncModal = () => {
    if (section && section.parentNode === dialog && !dialog.open) sectionParent?.insertBefore(section, sectionNext);
    rail.inert = dialog.open;
    if (dialog.open) rail.setAttribute('aria-hidden', 'true');
    else rail.removeAttribute('aria-hidden');
    opener.setAttribute('aria-expanded', String(dialog.open));
  };

  const syncNavigation = () => {
    const focused = currentFocus();
    const target = compact.matches ? bar : rail;
    const leavingPrimary = compact.matches ? rail.contains(focused) : bar.contains(focused);
    const leavingModal = !medium.matches && (dialog.contains(focused) || focused === opener);
    const closeForResize = !medium.matches && dialog.open;
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
      const sectionFocus = !compact.matches && focused instanceof HTMLElement && section?.contains(focused)
        && focused.getClientRects().length ? focused : null;
      (sectionFocus ?? links.find(link => href && link.getAttribute('href') === href)
        ?? links.find(link => link.hasAttribute('aria-current')) ?? links[0])?.focus();
    };
    // Let the dialog release focus and the desktop index open before transferring it.
    if (closeForResize) requestAnimationFrame(moveFocus);
    else moveFocus();
  };

  opener.addEventListener('click', () => {
    if (!medium.matches || dialog.open) return;
    if (section) dialog.append(section);
    dialog.showModal();
    syncModal();
  });
  closer.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    syncModal();
    if (medium.matches && !dialog.open) opener.focus();
  });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    // Keep Tab inside the modal at both ends, including browsers that can
    // otherwise move keyboard focus to their chrome. Families can hide links.
    const last = Array.from(dialog.querySelectorAll<HTMLElement>('a[href], button'))
      .findLast(control => control.getClientRects().length);
    const active = document.activeElement;
    if (last && (event.shiftKey ? active === closer : active === last)) {
      event.preventDefault();
      (event.shiftKey ? last : closer).focus();
    }
  });
  compact.addEventListener('change', syncNavigation);
  medium.addEventListener('change', syncNavigation);
  syncNavigation();
}

const index = document.querySelector<HTMLDetailsElement>('#section-index, #component-catalog-index');
const summary = index?.querySelector<HTMLElement>('summary');
const indexLinks = index?.querySelector<HTMLElement>('nav');
if (index && summary && indexLinks) {
  const expanded = matchMedia('(min-width: 840px)');
  let openInline = index.open;
  index.addEventListener('toggle', () => {
    if (!expanded.matches) openInline = index.open;
  });
  const syncIndex = () => {
    const focused = currentFocus();
    if (expanded.matches) {
      index.open = true;
      summary.hidden = true;
      if (focused === summary) {
        const current = indexLinks.querySelector<HTMLElement>('[aria-current]');
        (current?.getClientRects().length ? current : indexLinks.querySelector('a'))?.focus();
      }
    } else {
      summary.hidden = false;
      index.open = openInline || indexLinks.contains(focused);
    }
  };
  expanded.addEventListener('change', syncIndex);
  syncIndex();
}
