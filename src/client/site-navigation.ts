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
  const lastLink = Array.from(dialog.querySelectorAll<HTMLAnchorElement>('a')).at(-1)!;

  const syncNavigation = () => {
    const focused = currentFocus();
    const target = compact.matches ? bar : rail;
    const leaving = compact.matches ? rail.contains(focused) || dialog.contains(focused) : bar.contains(focused);
    const href = focused?.closest('a')?.getAttribute('href');
    bar.hidden = !compact.matches;
    rail.hidden = compact.matches;
    if (compact.matches && dialog.open) dialog.close();
    if (leaving) {
      const links = Array.from(target.querySelectorAll('a'));
      (links.find(link => href && link.getAttribute('href') === href)
        ?? links.find(link => link.hasAttribute('aria-current')) ?? links[0])?.focus();
    }
  };

  opener.hidden = false;
  opener.addEventListener('click', () => {
    if (compact.matches || dialog.open) return;
    dialog.showModal();
    rail.inert = true;
    rail.setAttribute('aria-hidden', 'true');
    opener.setAttribute('aria-expanded', 'true');
  });
  closer.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    rail.inert = false;
    rail.removeAttribute('aria-hidden');
    opener.setAttribute('aria-expanded', 'false');
    if (!compact.matches) opener.focus();
  });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    // Keep Tab inside the modal at both ends, including browsers that can
    // otherwise move keyboard focus to their chrome.
    const active = document.activeElement;
    if (event.shiftKey ? active === closer : active === lastLink) {
      event.preventDefault();
      (event.shiftKey ? lastLink : closer).focus();
    }
  });
  compact.addEventListener('change', syncNavigation);
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
