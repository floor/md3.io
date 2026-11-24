/**
 * A card's overlay (snackbar, dialog) closing leaves focus and the page where they are.
 * Closing, material returns focus to whatever had it when the overlay opened (after a
 * client navigation, the page heading), and that focus scrolls the page there. On a
 * dismissal (a button press or Escape), focus moves to the card's title first; if the
 * overlay still sends focus elsewhere, the scroll position is put back and focus returns
 * to the title, in the same frame.
 */
export function keepFocusInCard(host: HTMLElement): void {
  const title = () => ((host.getRootNode() as ShadowRoot).host as HTMLElement | undefined)?.closest('.component-card')?.querySelector<HTMLElement>('h3 a');
  const dismissing = () => {
    const x = scrollX, y = scrollY;
    title()?.focus({ preventScroll: true });
    // Only material's own return is undone: once, and never after the person moves on
    // (a key or the pointer), whose Tab or click goes where they send it.
    const stop = () => {
      clearTimeout(timer);
      document.removeEventListener('focusin', away, true);
      document.removeEventListener('keydown', stop, true);
      document.removeEventListener('pointerdown', stop, true);
    };
    const away = (event: FocusEvent) => {
      const card = title()?.closest('.component-card');
      if (card?.contains(event.target as Node)) return;
      stop();
      scrollTo(x, y);
      title()?.focus({ preventScroll: true });
    };
    const timer = setTimeout(stop, 1000);
    document.addEventListener('focusin', away, true);
    // After the dismissing event itself has passed.
    setTimeout(() => {
      document.addEventListener('keydown', stop, true);
      document.addEventListener('pointerdown', stop, true);
    });
  };
  host.addEventListener('click', event => {
    if (event.composedPath().some(node => node instanceof HTMLButtonElement)) dismissing();
  }, true);
  host.addEventListener('keydown', event => { if (event.key === 'Escape') dismissing(); }, true);
}
