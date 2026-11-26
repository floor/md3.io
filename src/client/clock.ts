// The phones drawn across the site (their status bar, `statusBar` in src/server/catalog.ts) show the
// visitor's own time instead of a fixed 9:30: hours and minutes in their locale, without AM or PM, as a
// phone's status bar has it. Rendered as 9:30 on the server; set on load, on each page a client
// navigation brings in, and at every minute.
const format = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const now = (): string => format.formatToParts(new Date()).filter(part => part.type === 'hour' || part.type === 'minute' || (part.type === 'literal' && /^[:.h]\s?$/.test(part.value))).map(part => part.value).join('').trim();

const update = (root: ParentNode = document): void => {
  const time = now();
  for (const clock of root.querySelectorAll<HTMLElement>('[data-clock]')) if (clock.textContent !== time) clock.textContent = time;
};

export function startClocks(): void {
  update();
  // New pages from client navigation, and any figure added later.
  new MutationObserver(records => {
    if (records.some(record => [...record.addedNodes].some(node => node instanceof Element && (node.matches('[data-clock]') || node.querySelector('[data-clock]'))))) update();
  }).observe(document.body, { childList: true, subtree: true });
  // At the turn of each minute.
  const tick = () => { update(); window.setTimeout(tick, 60_000 - (Date.now() % 60_000) + 50); };
  window.setTimeout(tick, 60_000 - (Date.now() % 60_000) + 50);
}
