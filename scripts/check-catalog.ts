// The components overview in a browser: each card's element loads as the card comes near
// the viewport, and every card shows mtrl's element upgraded once scrolled to, without
// moving; nothing opens in the top layer or as a modal, each card is one link whose visual
// is inert, the visuals follow the site's light and dark mode, and a phone has no
// horizontal scroll.
// BASE_URL checks a running server; without it the check serves the site itself.
import { chromium, type Locator, type Page } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { docGroups } from '../src/server/content';
import { componentSlugs, components } from '../src/shared/components';
import { baseline } from '../src/server/tokens';

const server = process.env.BASE_URL ? null : Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: (await import('../server')).handleRequest });
const base = (process.env.BASE_URL ?? server!.url.href).replace(/\/$/, '');
const output = resolve(import.meta.dir, '../analysis/browser');
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }

const sections = [
  { name: 'Buttons', slugs: ['button', 'button-group', 'extended-fab', 'fab', 'fab-menu', 'icon-button', 'split-button'] },
  { name: 'Date & time pickers', slugs: ['datepicker', 'timepicker'] },
  { name: 'Loading & progress', slugs: ['loading-indicator', 'progress'] },
  { name: 'Navigation', slugs: ['drawer', 'navigation-bar', 'navigation-rail'] },
  { name: 'Sheets', slugs: ['bottom-sheet', 'side-sheet'] },
  { name: 'All other components', slugs: ['badge', 'bottom-app-bar', 'card', 'carousel', 'checkbox', 'chips', 'dialog', 'divider', 'list', 'menu', 'radios', 'search', 'select', 'slider', 'snackbar', 'switch', 'tabs', 'text-field', 'toolbar', 'tooltip', 'top-app-bar'] },
] as const;
const catalogOrder = sections.flatMap(section => [...section.slugs]);
const families = sections.slice(0, -1);
const byName = (a: string, b: string) => a.localeCompare(b, 'en');
const equal = (actual: unknown, expected: unknown, message: string) =>
  assert(JSON.stringify(actual) === JSON.stringify(expected), message);

async function checkDirectory(pane: Locator, path: string, docs = false) {
  const headings = docs ? pane.getByRole('heading', { name: 'Components', exact: true }) : pane.getByRole('heading');
  equal(await headings.allTextContents(), ['Components'], 'The directory has one Components heading');
  const inventory = docs ? docGroups.flatMap(group => group.items) : componentSlugs.map(slug => ({
    slug, name: components[slug].name, href: `/components/${slug}/`,
  }));
  const directory = pane.locator('.component-directory');
  const rows = await directory.locator(':scope > li > :is(a, button)').evaluateAll(items => items.map(item => item.textContent!.trim()));
  const labels = inventory.filter(item => !families.some(family => family.slugs.some(slug => slug === item.slug))).map(item => item.name);
  equal(rows, ['Components overview', ...[...labels, ...families.map(family => family.name)].sort(byName)], 'The directory rows follow A–Z');
  const hrefs = await directory.locator('a').evaluateAll(links => links.map(link => link.getAttribute('href')));
  equal(hrefs.sort(), ['/components/', ...inventory.map(item => item.href)].sort(), 'Every component appears exactly once');
  for (const family of families) {
    const toggle = directory.getByRole('button', { name: family.name, exact: true });
    const id = await toggle.getAttribute('aria-controls');
    const list = directory.locator(`[id="${id}"]`);
    const expected = family.slugs.flatMap(slug => inventory.filter(item => item.slug === slug));
    assert(await toggle.evaluate(button => button.matches('button[type="button"]') && button.nextElementSibling?.id === button.getAttribute('aria-controls')),
      `${family.name}: a native button controls the following list`);
    equal(await list.locator('a').evaluateAll(links => links.map(link => link.getAttribute('href'))), expected.map(item => item.href),
      `${family.name}: the members follow the expected A–Z order`);
    const active = expected.some(item => item.href === path);
    assert(await toggle.getAttribute('aria-expanded') === String(active) && await list.isVisible() === active,
      `${family.name}: only the current family is open on load`);
  }
  const current = directory.locator('[aria-current="page"]');
  const currentHref = hrefs.includes(path) ? path : null;
  assert(await current.count() === Number(currentHref !== null), 'Current link count matches the route');
  if (currentHref) assert(await current.getAttribute('href') === currentHref && await current.isVisible(), 'The current link is visible and matches the route');
}

async function checkComponentList(page: Page) {
  const pane = page.getByRole('navigation', { name: 'Component list', exact: true });
  assert(await pane.count() === 1, 'Expected one accessible component list pane');
  assert(await page.getByRole('heading', { level: 1 }).count() === 1, 'The page must expose one H1');
  await checkDirectory(pane, new URL(page.url()).pathname);
  return pane;
}

async function openCompactIndex(page: Page) {
  const index = page.locator('#component-catalog-index');
  const summary = index.locator('summary');
  if (await summary.isVisible() && (await index.getAttribute('open')) === null) await summary.click();
}

async function checkDetailFocusOrder(page: Page, width: number) {
  const main = page.getByRole('main');
  const detail = '#component-content';
  const inDetail = () => page.evaluate(selector => !!document.activeElement?.closest(selector), detail);
  await main.focus();
  await page.keyboard.press('Tab');
  if (width >= 840) {
    const pane = main.getByRole('navigation', { name: 'Component list', exact: true });
    const focused = await pane.getByRole('link', { name: 'Components overview', exact: true }).evaluate(link => document.activeElement === link);
    assert(focused, `${width}px: Tab enters the detail before the component list`);
    const headings = main.getByRole('heading');
    assert(await headings.nth(1).and(main.getByRole('heading', { name: 'Tooltip', level: 1, exact: true })).count() === 1,
      `${width}px: the detail H1 must follow the component list heading`);
    await pane.getByRole('link', { name: 'Top app bar', exact: true }).focus();
    await page.keyboard.press('Tab');
  }
  assert(await inDetail(), `${width}px: Tab did not reach the component detail`);

  await page.getByRole('link', { name: 'Skip to content', exact: true }).press('Enter');
  assert(await page.locator(detail).evaluate(node => document.activeElement === node), `${width}px: Skip to content did not focus the detail`);
  await page.keyboard.press('Tab');
  assert(await inDetail(), `${width}px: Tab after the skip link left the detail`);
}

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
  await page.route('**/dist/catalog*.js', route => route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
  await page.goto(`${base}/components/`);
  // Each card's box on the page, wherever it is scrolled to.
  const boxes = () => page.locator('.component-card').evaluateAll(cards => cards.map(card => { const box = card.getBoundingClientRect(); return [Math.round(box.top + scrollY), Math.round(box.left), Math.round(box.width), Math.round(box.height)]; }));
  const before = await boxes();
  await page.unroute('**/dist/catalog*.js');
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
    const slug = catalogOrder[index]!;
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
  for (const slug of catalogOrder.slice(1)) {
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

  // Fresh narrow visits keep card elements and their chunks unloaded.
  const narrowContext = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light', reducedMotion: 'reduce' });
  const narrow = await narrowContext.newPage();
  const requests = new Set<string>();
  narrow.on('request', request => requests.add(request.url()));
  await narrow.goto(`${base}/components/`);
  const compactGallery = narrow.getByRole('region', { name: 'Component previews' });
  assert(await compactGallery.getByRole('link').count() === componentSlugs.length, 'The compact overview exposes all text cards');
  assert(!await compactGallery.locator('.catalog-visual').first().isVisible(), 'The compact overview shows a live visualization');
  assert(await narrow.locator('.catalog-visual--button m-button').first().evaluate(element => !element.matches(':defined')), 'The compact overview upgraded a hidden card');
  const catalogEntry = await narrow.locator('script[src^="/dist/catalog."]').getAttribute('src');
  assert(catalogEntry, 'The catalog module is missing');
  const entryUrl = new URL(catalogEntry, base);
  const entryScript = await (await narrow.request.get(entryUrl.href)).text();
  const cardModules = [...entryScript.matchAll(/import\(["'](\.\/[^"']+)["']\)/g)].map(match => new URL(match[1]!, entryUrl).href);
  assert(cardModules.length >= componentSlugs.length, 'Could not find the lazy card modules in the catalog entry');
  assert(!cardModules.some(url => requests.has(url)), 'The compact overview requested a hidden card module');
  assert(![...requests].some(url => new URL(url).hostname === 'picsum.photos'), 'The compact overview requested a carousel photo');
  const lastLink = compactGallery.locator('.component-card[href="/components/tooltip/"]');
  await lastLink.scrollIntoViewIfNeeded();
  const listPosition = await narrow.evaluate(() => scrollY);
  assert(listPosition > 0, 'The history check did not scroll the compact overview');
  await lastLink.click();
  await narrow.waitForURL(`${base}/components/tooltip/`);
  await narrow.goBack();
  await narrow.waitForFunction(before => Math.abs(scrollY - before) <= 1, listPosition);
  await narrowContext.close();

  // At each tier the index and detail expose the expected panes and headings.
  const captures = resolve(output, 'component-list-detail');
  await mkdir(captures, { recursive: true });
  for (const width of [360, 390, 412, 700, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${base}/components/`);
    await openCompactIndex(page);
    const index = await checkComponentList(page);
    const gallery = page.getByRole('region', { name: 'Component previews' });
    equal(await gallery.getByRole('heading', { level: 2 }).allTextContents(), sections.map(section => section.name),
      `${width}px: the overview exposes the six sections in order`);
    for (const { name, slugs } of sections) {
      const section = gallery.getByRole('region', { name, exact: true });
      equal(await section.getByRole('link').evaluateAll(links => links.map(link => link.getAttribute('href'))),
        slugs.map(slug => `/components/${slug}/`), `${width}px: ${name} contains its A–Z card links`);
    }
    assert(await gallery.getByRole('heading', { level: 3 }).count() === componentSlugs.length, `${width}px: every card has an H3 title`);
    assert(await page.getByText('Browse components', { exact: true }).count() === 0, `${width}px: temporary component picker on the overview`);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px: the index overflows`);
    if (width >= 840) {
      const previewBox = await gallery.boundingBox();
      const listBox = await index.boundingBox();
      assert(previewBox && listBox && listBox.x + listBox.width <= previewBox.x, `${width}px: the previews and list do not sit side by side`);
    }
    await page.screenshot({ animations: 'disabled', path: `${captures}/overview-${width}.png` });
    await page.goto(`${base}/components/tooltip/`);
    assert(await page.getByRole('heading', { name: 'Tooltip', level: 1, exact: true }).count() === 1, `${width}px: the detail heading is missing`);
    const up = page.getByRole('link', { name: 'All components', exact: true });
    assert(await up.getAttribute('href') === '/components/', `${width}px: missing up link`);
    assert(await page.getByText('Browse components', { exact: true }).count() === 0, `${width}px: temporary component picker on the detail`);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px: the detail overflows`);
    if (width < 840) {
      const inactivePane = page.locator('.component-list');
      assert(!await inactivePane.isVisible() && await inactivePane.getByRole('link').count() === 0, `${width}px: detail exposes list links`);
      await inactivePane.locator('a[aria-current="page"]').evaluate(a => (a as HTMLElement).focus());
      assert(await page.evaluate(() => !document.activeElement?.closest('.component-list')), `${width}px: a hidden list link took focus`);
    } else {
      const pane = await checkComponentList(page);
      const paneBox = await pane.boundingBox();
      const detailBox = await page.locator('.component-page').boundingBox();
      const currentBox = await pane.getByRole('link', { name: 'Tooltip', exact: true }).boundingBox();
      assert(paneBox && detailBox && paneBox.x + paneBox.width <= detailBox.x, `${width}px: the list and detail do not sit side by side`);
      assert(currentBox && currentBox.y >= paneBox.y && currentBox.y + currentBox.height <= paneBox.y + paneBox.height, `${width}px: the current link is outside the list viewport`);
      assert(await pane.evaluate(list => list.scrollTop > 0 && list.scrollHeight > list.clientHeight) && await page.evaluate(() => scrollY === 0),
        `${width}px: showing the current link did not scroll only the list`);
    }
    await page.screenshot({ animations: 'disabled', path: `${captures}/detail-${width}.png` });
    await checkDetailFocusOrder(page, width);
    await up.click();
    await page.waitForURL(`${base}/components/`);
  }

  await page.setViewportSize({ width: 839, height: 900 });
  await page.goto(`${base}/components/tooltip/`);
  assert(!await page.locator('.component-list').isVisible(), '839px: the detail list is visible');
  await page.screenshot({ animations: 'disabled', path: `${captures}/detail-839.png` });
  await page.setViewportSize({ width: 840, height: 900 });
  const expandedList = await checkComponentList(page);
  await checkDetailFocusOrder(page, 840);
  await expandedList.getByRole('link', { name: 'Tooltip', exact: true }).focus();
  await page.screenshot({ animations: 'disabled', path: `${captures}/detail-840.png` });
  await page.setViewportSize({ width: 839, height: 900 });
  await page.waitForFunction(() => document.activeElement?.matches('.component-list-up'));
  await page.goto(`${base}/components/`);
  await openCompactIndex(page);
  await checkComponentList(page);
  await page.screenshot({ animations: 'disabled', path: `${captures}/overview-839.png` });
  await page.setViewportSize({ width: 840, height: 900 });
  const firstCard = page.locator('.component-card').first();
  await firstCard.waitFor({ state: 'visible' });
  await firstCard.focus();
  await page.screenshot({ animations: 'disabled', path: `${captures}/overview-840.png` });
  await page.setViewportSize({ width: 839, height: 900 });
  await page.waitForFunction(() => document.activeElement?.matches('.component-card[href="/components/button/"]'));

  // A phone: no horizontal scroll, in either mode.
  await page.setViewportSize({ width: 390, height: 844 });
  for (const mode of ['dark', 'light'] as const) {
    await setMode(mode);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `390 px ${mode}: the overview overflows`);
  }
  await page.screenshot({ animations: 'disabled', path: `${output}/catalog-mobile.png`, fullPage: true });
  assert((await inspect(page)).modal === 0, 'A modal opened on the phone');

  const azCaptures = resolve(output, 'components-az');
  await mkdir(azCaptures, { recursive: true });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${base}/components/`);
    if (width === 1440) await loadAll();
    await page.screenshot({ animations: 'disabled', path: `${azCaptures}/overview-${width}.png`, fullPage: true });
    await openCompactIndex(page);
    const pane = await checkComponentList(page);
    const toggle = pane.getByRole('button', { name: 'Buttons', exact: true });
    const button = pane.getByRole('link', { name: 'Button', exact: true });
    await toggle.press('Enter');
    assert(await toggle.getAttribute('aria-expanded') === 'true' && await button.isVisible(), 'Enter opens the Buttons family');
    await toggle.press('Space');
    assert(await toggle.getAttribute('aria-expanded') === 'false' && await button.count() === 0, 'Space closes the Buttons family');
    await toggle.press('Space');
    await page.screenshot({ animations: 'disabled', path: `${azCaptures}/sidebar-${width}.png` });

    for (const family of families) {
      const slug = family.slugs[0];
      if (width === 1440) {
        await page.goto(`${base}/components/${slug}/`);
        await checkComponentList(page);
        const activeToggle = page.getByRole('navigation', { name: 'Component list' }).getByRole('button', { name: family.name, exact: true });
        await activeToggle.focus();
        await page.setViewportSize({ width: 839, height: 900 });
        await page.waitForFunction(() => document.activeElement?.matches('.component-list-up'));
        await page.setViewportSize({ width, height: 900 });
      }
      await page.goto(`${base}/docs/components/${slug}/`);
      if (width === 390) await page.locator('#section-index summary').click();
      const docs = page.getByRole('navigation', { name: 'Documentation links' });
      await checkDirectory(docs, new URL(page.url()).pathname, true);
      if (slug === 'button') {
        await docs.getByRole('button', { name: 'Buttons', exact: true }).scrollIntoViewIfNeeded();
        await page.screenshot({ animations: 'disabled', path: `${azCaptures}/docs-sidebar-${width}.png` });
      }
    }
  }

  assert(errors.length === 0, errors.join('\n'));
  console.log('All catalog browser checks passed.');
} finally {
  await browser.close();
  server?.stop(true);
}
