// The components overview in a browser: each card's element loads as the card comes near
// the viewport, and every card shows mtrl's element upgraded once scrolled to, without
// moving; nothing opens in the top layer or as a modal, each card is one link whose visual
// is inert, the visuals follow the site's light and dark mode, and a phone has no
// horizontal scroll.
// BASE_URL checks a running server; without it the check serves the site itself.
import { chromium, type Page } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { componentSlugs, components } from '../src/shared/components';
import { baseline } from '../src/server/tokens';

const server = process.env.BASE_URL ? null : Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: (await import('../server')).handleRequest });
const base = (process.env.BASE_URL ?? server!.url.href).replace(/\/$/, '');
const output = resolve(import.meta.dir, '../analysis/browser');
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }

/** Per card: its custom elements, how many are not upgraded, and what is open over the page. */
const inspect = (page: Page) => page.evaluate(() => {
  const roots = (root: Document | ShadowRoot): (Document | ShadowRoot)[] =>
    [root, ...[...root.querySelectorAll('*')].flatMap(element => element.shadowRoot ? roots(element.shadowRoot) : [])];
  const all = roots(document);
  return {
    cards: [...document.querySelectorAll<HTMLAnchorElement>('.component-card')].map(card => {
      const visual = card.querySelector<HTMLElement>('.catalog-visual');
      const custom = [...(visual?.querySelectorAll('*') ?? [])].filter(element => element.localName.includes('-'));
      return {
        href: card.getAttribute('href'),
        tag: card.localName,
        elements: custom.map(element => element.localName),
        undefined: custom.filter(element => !element.matches(':defined')).map(element => element.localName),
        // Every top-level element in the visual renders something once upgraded: itself, or
        // what its shadow root holds (a bar pinned to the edge leaves its host empty).
        empty: [...(visual?.children ?? [])].filter(child => ![child, ...(child.shadowRoot?.children ?? [])]
          .some(element => element.getBoundingClientRect().height > 0)).map(child => child.localName),
        inert: visual?.inert === true && visual.getAttribute('aria-hidden') === 'true',
        // Light-DOM controls a link must not nest (the elements' own are in inert shadow roots).
        nested: card.querySelectorAll('a, button, input, select, textarea, [tabindex]').length,
        arrow: card.textContent?.includes('↗') ?? false,
      };
    }),
    modal: all.flatMap(root => [...root.querySelectorAll(':modal')]).length,
    popovers: all.flatMap(root => [...root.querySelectorAll(':popover-open')]).length,
    dialogs: all.flatMap(root => [...root.querySelectorAll('dialog[open]')]).filter(dialog => dialog.matches(':modal')).length,
  };
});

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light', reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });

  // Before the script: the pre-upgrade rules and the fixed visual keep every card's box.
  await page.route('**/dist/catalog.js', route => route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
  await page.goto(`${base}/components/`);
  // Each card's box on the page, wherever it is scrolled to.
  const boxes = () => page.locator('.component-card').evaluateAll(cards => cards.map(card => { const box = card.getBoundingClientRect(); return [Math.round(box.top + scrollY), Math.round(box.left), Math.round(box.width), Math.round(box.height)]; }));
  const before = await boxes();
  await page.unroute('**/dist/catalog.js');
  // Scrolls through the page, so every card comes near the viewport and loads its element,
  // then back to the top once all are upgraded.
  const loadAll = async () => {
    const step = await page.evaluate(() => innerHeight / 2);
    // Two frames at each stop, for the observer to see the cards there.
    const scrollAndPaint = (top: number) => page.evaluate(y => { scrollTo(0, y); return new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))); }, top);
    for (let y = 0; y < await page.evaluate(() => document.documentElement.scrollHeight); y += step) await scrollAndPaint(y);
    await scrollAndPaint(await page.evaluate(() => document.documentElement.scrollHeight));
    await page.waitForFunction(() => document.querySelectorAll('.catalog-visual :not(:defined)').length === 0);
    await page.evaluate(() => scrollTo(0, 0));
  };

  console.log('Checking /components/');
  await page.goto(`${base}/components/`);
  // Lazily: the first card upgrades, and a card more than two viewports down has not
  // loaded its element (the page loads a card a viewport before it is seen).
  await page.waitForFunction(() => document.querySelector('.catalog-visual')?.querySelector(':not(:defined)') === null);
  const far = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.catalog-visual')]
    .filter(visual => visual.getBoundingClientRect().top > innerHeight * 2.5)
    // Its own element is still undefined (the icon buttons some cards share may be defined).
    .map(visual => ({ slug: visual.className, loaded: visual.querySelector(':not(:defined)') === null })));
  assert(far.length > 0, 'No card is far enough down the overview to check it loads lazily');
  assert(far.every(card => !card.loaded), `Cards far below the viewport loaded at once: ${far.filter(card => card.loaded).map(card => card.slug).join(', ')}`);
  await loadAll();
  const state = await inspect(page);
  assert(state.cards.length === componentSlugs.length, `The overview shows ${state.cards.length} cards, not ${componentSlugs.length}`);
  for (const [index, card] of state.cards.entries()) {
    const slug = componentSlugs[index]!;
    assert(card.href === `/components/${slug}/` && card.tag === 'a', `${slug}: the card is not its playground's link`);
    assert(card.elements.some(name => name.startsWith('m-') || name.startsWith('md3-catalog-')), `${slug}: no mtrl element in the card`);
    assert(card.undefined.length === 0, `${slug}: not upgraded: ${card.undefined.join(', ')}`);
    assert(card.empty.length === 0, `${slug}: renders nothing: ${card.empty.join(', ')}`);
    assert(card.inert, `${slug}: the visual is not inert and aria-hidden`);
    assert(card.nested === 0, `${slug}: a control is nested in the link`);
    assert(!card.arrow, `${slug}: the card still has its ↗`);
  }
  assert(state.modal === 0 && state.dialogs === 0, 'A modal dialog is open on the overview');
  assert(state.popovers === 0, 'A popover is open in the top layer');
  assert(JSON.stringify(await boxes()) === JSON.stringify(before), 'The cards moved when the elements upgraded');

  // One link per card, named by its title and summary, and one tab stop each.
  for (const slug of ['button', 'dialog', 'menu', 'tooltip'] as const) {
    const { name, summary } = components[slug];
    assert(await page.getByRole('link', { name: `${name} ${summary}`, exact: true }).count() === 1, `${slug}: the card's link is not named by its title and summary`);
  }
  await page.locator('.component-card').first().focus();
  for (const slug of componentSlugs.slice(1)) {
    await page.keyboard.press('Tab');
    assert(await page.evaluate(() => document.activeElement?.getAttribute('href')) === `/components/${slug}/`, `Tab does not go from card to card at ${slug}`);
  }
  // A click on what a card shows is a click on the card.
  await page.locator('.catalog-visual--dialog').click();
  await page.waitForURL('**/components/dialog/');
  await page.goBack();
  await loadAll();

  // Light and dark follow the site, from mtrl's baseline.
  const surface = () => page.locator('.catalog-visual--button').evaluate(element => getComputedStyle(element).backgroundColor);
  const filled = () => page.locator('.catalog-visual--button m-button').first().evaluate(element => getComputedStyle(element.shadowRoot!.querySelector('button')!).backgroundColor);
  const rgb = (hex: string) => `rgb(${hex.slice(1).match(/../g)!.map(part => parseInt(part, 16)).join(', ')})`;
  const setMode = async (mode: 'light' | 'dark') => {
    if (await page.locator('html').getAttribute('data-theme-mode') !== mode) await page.locator('#theme-toggle').click();
    // The button's colour transitions to the new mode.
    await page.locator('.catalog-visual--button m-button').first().evaluate(element => Promise.all(element.shadowRoot!.getAnimations().map(animation => animation.finished)));
  };
  await setMode('light');
  assert(await surface() === rgb(baseline.light.get('surface')!) && await filled() === rgb(baseline.light.get('primary')!), 'Light site: the visuals are not mtrl baseline light');
  await page.screenshot({ animations: 'disabled', path: `${output}/catalog-light.png`, fullPage: true });
  await setMode('dark');
  assert(await surface() === rgb(baseline.dark.get('surface')!) && await filled() === rgb(baseline.dark.get('primary')!), 'Dark site: the visuals are not mtrl baseline dark');
  await page.screenshot({ animations: 'disabled', path: `${output}/catalog-dark.png`, fullPage: true });
  // The page around them keeps md3.io's own tokens.
  assert(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--mtrl-sys-color-primary')) === '', 'mtrl tokens leaked onto :root');

  // A phone: no horizontal scroll, in either mode.
  await page.setViewportSize({ width: 390, height: 844 });
  for (const mode of ['dark', 'light'] as const) {
    await setMode(mode);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `390 px ${mode}: the overview overflows`);
  }
  await page.screenshot({ animations: 'disabled', path: `${output}/catalog-mobile.png`, fullPage: true });
  assert((await inspect(page)).modal === 0, 'A modal opened on the phone');

  assert(errors.length === 0, errors.join('\n'));
  console.log('All catalog browser checks passed.');
} finally {
  await browser.close();
  server?.stop(true);
}
