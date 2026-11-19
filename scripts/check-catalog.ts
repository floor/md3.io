// The components overview in a browser: each card's element loads as the card comes near
// the viewport, and every card shows mtrl's element upgraded once scrolled to, without
// moving; the card's title is its one link and its preview is live (controls respond,
// overlays open and close, nothing is nested in a link), the visuals follow the site's
// theme and mode live, and a phone has no horizontal scroll.
// BASE_URL checks a running server; without it the check serves the site itself.
import { chromium, type Page } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { componentSlugs, components, playgroundGroups } from '../src/shared/components';
import { baseline, themeTokens } from '../src/server/tokens';

const server = process.env.BASE_URL ? null : Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: (await import('../server')).handleRequest });
const base = (process.env.BASE_URL ?? server!.url.href).replace(/\/$/, '');
const output = resolve(import.meta.dir, '../analysis/browser');
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }

const headingNames = ['Components', 'Actions', 'Selection & input', 'Navigation', 'Containment', 'Communication'];
async function checkComponentList(page: Page, overview: boolean) {
  const pane = page.getByRole('navigation', { name: 'Component list', exact: true });
  assert(await pane.count() === 1, 'Expected one accessible component list pane');
  const headings = pane.getByRole('heading');
  assert(await headings.count() === headingNames.length, 'The list pane must expose exactly six headings');
  assert(await page.getByRole('heading', { level: 1 }).count() === 1, 'The page must expose one H1');
  const links = [
    [{ name: 'Overview', href: '/components/' }],
    ...playgroundGroups.map(group => group.slugs.map(slug => ({ name: components[slug].name, href: `/components/${slug}/` }))),
  ];
  assert(await pane.getByRole('list').count() === headingNames.length, 'Expected six accessible lists');
  for (const [index, name] of headingNames.entries()) {
    const level = overview && index === 0 ? 1 : 2;
    assert(await headings.nth(index).and(pane.getByRole('heading', { name, level, exact: true })).count() === 1,
      `Expected heading ${index + 1} to be H${level} "${name}"`);
    const group = pane.getByRole('list', { name, exact: true });
    assert(await group.count() === 1, `Missing list labelled "${name}"`);
    assert(await group.getByRole('link').count() === links[index]!.length, `${name}: unexpected link count`);
    for (const { name: linkName, href } of links[index]!) {
      const link = group.getByRole('link', { name: linkName, exact: true });
      assert(await link.getAttribute('href') === href && await link.evaluate(a => a.localName === 'a' && a.tabIndex === 0), `${name}: missing native link to ${href}`);
    }
  }
  assert(await pane.getByRole('button').count() === 0, 'Navigation rows exposed selection buttons');
  const current = pane.locator('[aria-current="page"]');
  assert(await current.count() === 1 && await current.getAttribute('href') === new URL(page.url()).pathname, 'The current component list link does not match the route');
  return pane;
}

async function checkDetailFocusOrder(page: Page, width: number) {
  const main = page.getByRole('main');
  const detail = '#component-content';
  const inDetail = () => page.evaluate(selector => !!document.activeElement?.closest(selector), detail);
  await main.focus();
  await page.keyboard.press('Tab');
  if (width >= 840) {
    const pane = main.getByRole('navigation', { name: 'Component list', exact: true });
    const focused = await pane.getByRole('link', { name: 'Overview', exact: true }).evaluate(link => document.activeElement === link);
    assert(focused, `${width}px: Tab enters the detail before the component list`);
    const headings = main.getByRole('heading');
    assert(await headings.nth(6).and(main.getByRole('heading', { name: 'Tooltip', level: 1, exact: true })).count() === 1,
      `${width}px: the detail H1 must follow the six list headings`);
    await pane.getByRole('link', { name: 'Tooltip', exact: true }).focus();
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
    cards: [...document.querySelectorAll<HTMLElement>('.component-card')].map(card => {
      const visual = card.querySelector<HTMLElement>('.catalog-visual');
      const custom = [...(visual?.querySelectorAll('*') ?? [])].filter(element => element.localName.includes('-'));
      const link = card.querySelector<HTMLAnchorElement>('h3 a');
      return {
        href: link?.getAttribute('href'),
        name: link?.textContent?.trim(),
        tag: card.localName,
        links: card.querySelectorAll('a').length,
        elements: custom.map(element => element.localName),
        undefined: custom.filter(element => !element.matches(':defined')).map(element => element.localName),
        // Every top-level element in the visual renders something once upgraded: itself, or
        // what its shadow root holds (a bar pinned to the edge leaves its host empty).
        empty: [...(visual?.children ?? [])].filter(child => ![child, ...(child.shadowRoot?.children ?? [])]
          .some(element => element.getBoundingClientRect().height > 0)).map(child => child.localName),
        inert: visual?.inert === true || visual?.getAttribute('aria-hidden') === 'true',
        // No interactive element sits inside a link.
        nested: [...card.querySelectorAll('a')].filter(a => a.querySelector('button, input, select, textarea, [tabindex], m-button, m-switch, m-checkbox, m-slider, m-select, m-text-field, md3-catalog-dialog, md3-catalog-menu') !== null).length,
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
    const slug = componentSlugs[index]!;
    assert(card.tag === 'article' && card.links === 1 && card.href === `/components/${slug}/` && card.name === components[slug].name, `${slug}: the card's one link is not its title to the playground`);
    assert(card.elements.some(name => name.startsWith('m-') || name.startsWith('md3-catalog-')), `${slug}: no mtrl element in the card`);
    assert(card.undefined.length === 0, `${slug}: not upgraded: ${card.undefined.join(', ')}`);
    assert(card.empty.length === 0, `${slug}: renders nothing: ${card.empty.join(', ')}`);
    assert(!card.inert, `${slug}: the visual is inert or aria-hidden`);
    assert(card.nested === 0, `${slug}: a control is nested in the link`);
    assert(!card.arrow, `${slug}: the card still has its ↗`);
  }
  assert(state.modal === 0 && state.dialogs === 0, 'A modal dialog is open on the overview before anyone opens one');
  assert(state.popovers === 0, 'A popover is open in the top layer before anyone opens one');
  assert(JSON.stringify(await boxes()) === JSON.stringify(before), 'The cards moved when the elements upgraded');

  // One link per card, named by the component's name; the preview's controls
  // follow it in the tab order, and a person can tab past a card.
  for (const slug of ['button', 'dialog', 'menu', 'tooltip'] as const) {
    assert(await page.getByRole('region', { name: 'Component previews' }).getByRole('link', { name: components[slug].name, exact: true }).count() === 1, `${slug}: the card's link is not named by its name`);
  }
  const titleLink = (slug: string) => page.locator(`.component-card:has(.catalog-visual--${slug})`).getByRole('link', { name: components[slug as keyof typeof components].name, exact: true });
  await titleLink('button').focus();
  // Link first, then the preview's controls, then the next card's link.
  await page.keyboard.press('Tab');
  assert(await page.evaluate(() => document.activeElement?.closest('.catalog-visual--button') !== null), 'Tab from the title link did not reach the preview controls first');
  await page.keyboard.press('Shift+Tab');
  assert(await titleLink('button').evaluate(link => document.activeElement === link), 'Shift+Tab from the preview controls did not return to the title link');
  await page.keyboard.press('Tab');
  let pastCard = false;
  for (let i = 0; i < 80 && !pastCard; i++) {
    await page.keyboard.press('Tab');
    pastCard = await titleLink('icon-button').evaluate(link => document.activeElement === link).catch(() => false);
  }
  assert(pastCard, 'Tab could not get past the first card to the next title link');

  // Live previews: the control in the card responds where it stands, and the
  // page does not navigate. Overlays open from their card and close normally.
  const visual = (slug: string) => page.locator(`.catalog-visual--${slug}`);
  const prop = (slug: string, selector: string, name: string) => visual(slug).locator(selector).evaluate((el, n) => (el as unknown as Record<string, unknown>)[n], name);
  const staysOnOverview = async (slug: string) => assert(page.url().endsWith('/components/'), `${slug}: using the preview navigated away`);
  await visual('switch').scrollIntoViewIfNeeded();
  await visual('switch').getByRole('switch').click();
  assert(await prop('switch', 'm-switch', 'checked') === false, 'switch: the preview did not toggle');
  await visual('checkbox').getByRole('checkbox', { name: 'Pickles' }).click();
  assert(await visual('checkbox').locator('m-checkbox').nth(1).evaluate(el => (el as unknown as { checked: boolean }).checked), 'checkbox: the preview did not check');
  await visual('radios').scrollIntoViewIfNeeded();
  await visual('radios').getByRole('radio', { name: 'Express' }).click().catch(async () => { await visual('radios').locator('label', { hasText: 'Express' }).click(); });
  assert(await prop('radios', 'm-radios', 'value') === 'express', 'radios: the preview did not choose');
  await visual('chips').scrollIntoViewIfNeeded();
  await visual('chips').evaluate(v => {
    const chip = [...v.querySelector('m-chips')!.shadowRoot!.querySelectorAll<HTMLElement>('.mtrl-chip')].find(c => c.textContent?.includes('Music'))!;
    (chip.querySelector('button') ?? chip).click();
  });
  assert(JSON.stringify(await prop('chips', 'm-chips', 'value')).includes('music'), 'chips: the preview did not select');
  await visual('slider').getByRole('slider').first().focus();
  await page.keyboard.press('ArrowRight');
  assert(await prop('slider', 'm-slider', 'value') === 50, 'slider: the preview did not move');
  await visual('text-field').getByRole('textbox').fill('Ada');
  assert(await visual('text-field').getByRole('textbox').inputValue() === 'Ada', 'text-field: typing did not land');
  await visual('select').scrollIntoViewIfNeeded();
  await visual('select').getByRole('combobox').focus();
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(250); await page.keyboard.press('ArrowDown'); await page.waitForTimeout(150); await page.keyboard.press('Enter'); await page.waitForTimeout(150);
  assert(await prop('select', 'm-select', 'value') === 'banana', 'select: the preview did not choose');
  await visual('search').scrollIntoViewIfNeeded();
  const searchBox = visual('search').getByRole('searchbox');
  await searchBox.fill('par').catch(async () => { await visual('search').locator('input').fill('par'); });
  assert((await searchBox.inputValue().catch(() => '')) === 'par' || (await visual('search').locator('input').inputValue()) === 'par', 'search: typing did not land');
  // Overlays, each from its own card.
  const openClose = async (slug: string, trigger: string, open: () => Promise<void>, close: () => Promise<void>) => {
    await visual(slug).scrollIntoViewIfNeeded();
    await visual(slug).getByRole('button', { name: trigger, exact: true }).click();
    await open();
    await close();
    await staysOnOverview(slug);
  };
  await openClose('dialog', 'Show dialog',
    async () => { await page.getByRole('alertdialog').waitFor(); },
    async () => { await page.getByRole('button', { name: 'Cancel', exact: true }).click(); await page.getByRole('alertdialog').waitFor({ state: 'detached' }).catch(() => page.getByRole('alertdialog').waitFor({ state: 'hidden' })); });
  await openClose('menu', 'Show menu',
    async () => {
      const item = page.getByRole('menuitem').first();
      await item.waitFor();
      // In the top layer, not clipped by the card: the item's box is on screen.
      const viewport = await item.evaluate(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth; });
      assert(viewport, 'menu: the open item does not intersect the viewport');
    },
    async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(200); });
  // FAB menu likewise opens in the top layer (the menu presentation): the open
  // item's box is inside the viewport, not clipped by the card (a layout-box
  // height check cannot see clipping).
  await visual('fab-menu').scrollIntoViewIfNeeded();
  await visual('fab-menu').getByRole('button', { name: 'Reply options' }).click();
  const fabItem = page.getByRole('menuitem').first();
  await fabItem.waitFor();
  assert(await fabItem.evaluate(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth; }), 'fab-menu: the open item does not intersect the viewport');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  await staysOnOverview('fab-menu');
  await openClose('snackbar', 'Show snackbar',
    async () => { await page.getByText('Your changes have been saved.').waitFor(); },
    async () => { await page.getByRole('button', { name: 'Dismiss' }).click().catch(() => page.keyboard.press('Escape')); await page.waitForTimeout(200); });
  await openClose('timepicker', 'Show time picker',
    async () => { await page.getByRole('button', { name: 'OK', exact: true }).waitFor(); },
    async () => { await page.getByRole('button', { name: 'Cancel', exact: true }).click(); await page.waitForTimeout(200); });
  await openClose('bottom-sheet', 'Show bottom sheet',
    async () => { await page.getByText('Plan your visit').waitFor({ state: 'visible' }); },
    async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(200); });
  await openClose('side-sheet', 'Show side sheet',
    async () => { await page.getByText('Details', { exact: true }).waitFor({ state: 'visible' }); },
    async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(200); });
  await visual('datepicker').scrollIntoViewIfNeeded();
  await visual('datepicker').getByRole('button').first().click();
  await visual('datepicker').getByRole('gridcell').nth(12).click();
  await staysOnOverview('datepicker');

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
  // The page around them takes the same roles at the root (layout step 8): the
  // site's own colours follow the chosen theme from <html data-theme>.
  assert(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--mtrl-sys-color-primary').trim()) === baseline.dark.get('primary'), 'The chosen theme’s roles are not on :root');
  // And the previews follow the chosen theme: with Spring saved, then Ocean
  // dark, a filled preview takes each theme's primary (this fails with
  // Baseline tokens pinned on .catalog-visual).
  for (const [theme, mode, hex] of [['spring', 'light', themeTokens.spring!.light.primary!.value], ['ocean', 'dark', themeTokens.ocean!.dark.primary!.value]] as const) {
    const themedContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await themedContext.addInitScript(([t2, m]) => {
      localStorage.setItem('md3-preview-appearance', JSON.stringify({ theme: t2, mode: m }));
      localStorage.setItem('md3-site-mode', m!);
    }, [theme, mode]);
    const themedPage = await themedContext.newPage();
    await themedPage.goto(`${base}/components/`);
    await themedPage.locator('.catalog-visual--button m-button').first().waitFor();
    const want = rgb(hex);
    const got = await themedPage.locator('.catalog-visual--button m-button').first().evaluate(el => getComputedStyle(el.shadowRoot!.querySelector('button')!).backgroundColor);
    assert(got === want, `${theme}/${mode}: the preview fill is ${got}, want the theme primary ${want}`);
    if (theme === 'ocean') await themedPage.screenshot({ animations: 'disabled', path: `${output}/catalog-ocean-dark.png`, fullPage: true });
    await themedContext.close();
  }


  // Fresh narrow visits keep card elements and their chunks unloaded.
  const narrowContext = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light', reducedMotion: 'reduce' });
  const narrow = await narrowContext.newPage();
  const requests = new Set<string>();
  narrow.on('request', request => requests.add(request.url()));
  await narrow.goto(`${base}/components/`);
  const hiddenCards = narrow.locator('.component-catalog');
  assert(!await hiddenCards.isVisible() && await hiddenCards.getByRole('link').count() === 0, 'The compact overview exposes catalog cards');
  await narrow.locator('.component-card').first().evaluate(card => (card as HTMLElement).focus());
  assert(await narrow.evaluate(() => !document.activeElement?.matches('.component-card')), 'A hidden card took focus');
  assert(await narrow.locator('.catalog-visual--button m-button').first().evaluate(element => !element.matches(':defined')), 'The compact overview upgraded a hidden card');
  const catalogEntry = await narrow.locator('script[src^="/dist/catalog."]').getAttribute('src');
  assert(catalogEntry, 'The catalog module is missing');
  const entryUrl = new URL(catalogEntry, base);
  const entryScript = await (await narrow.request.get(entryUrl.href)).text();
  const cardModules = [...entryScript.matchAll(/import\(["'](\.\/[^"']+)["']\)/g)].map(match => new URL(match[1]!, entryUrl).href);
  assert(cardModules.length >= componentSlugs.length, 'Could not find the lazy card modules in the catalog entry');
  assert(!cardModules.some(url => requests.has(url)), 'The compact overview requested a hidden card module');
  assert(![...requests].some(url => new URL(url).hostname === 'picsum.photos'), 'The compact overview requested a carousel photo');
  const lastLink = narrow.getByRole('navigation', { name: 'Component list' }).getByRole('link', { name: 'Tooltip', exact: true });
  await lastLink.scrollIntoViewIfNeeded();
  const listPosition = await narrow.evaluate(() => scrollY);
  assert(listPosition > 0, 'The history check did not scroll the compact list');
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
    const index = await checkComponentList(page, true);
    const gallery = page.getByRole('region', { name: 'Component previews' });
    assert(await gallery.count() === Number(width >= 840), `${width}px: unexpected gallery visibility`);
    assert(await page.getByText('Browse components', { exact: true }).count() === 0, `${width}px: temporary component picker on the overview`);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px: the index overflows`);
    if (width >= 840) {
      const previewBox = await gallery.boundingBox();
      const listBox = await index.boundingBox();
      assert(previewBox && listBox && listBox.x + listBox.width <= previewBox.x, `${width}px: the previews and list do not sit side by side`);
      assert(await gallery.getByRole('heading', { name: 'Button', level: 3, exact: true }).count() === 1, `${width}px: the card title lost its heading`);
      assert(await gallery.getByRole('heading').count() === componentSlugs.length, `${width}px: unexpected headings in the companion catalog`);
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
      const pane = await checkComponentList(page, false);
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
  const expandedList = await checkComponentList(page, false);
  await checkDetailFocusOrder(page, 840);
  await expandedList.getByRole('link', { name: 'Tooltip', exact: true }).focus();
  await page.screenshot({ animations: 'disabled', path: `${captures}/detail-840.png` });
  await page.setViewportSize({ width: 839, height: 900 });
  await page.waitForFunction(() => document.activeElement?.matches('.component-list-up'));
  await page.goto(`${base}/components/`);
  await checkComponentList(page, true);
  await page.screenshot({ animations: 'disabled', path: `${captures}/overview-839.png` });
  await page.setViewportSize({ width: 840, height: 900 });
  const firstCard = page.locator('.component-card').first();
  await firstCard.waitFor({ state: 'visible' });
  await firstCard.getByRole('link', { name: 'Button', exact: true }).focus();
  await page.screenshot({ animations: 'disabled', path: `${captures}/overview-840.png` });
  await page.setViewportSize({ width: 839, height: 900 });
  await page.waitForFunction(() => document.activeElement?.matches('.component-list a[href="/components/button/"]'));

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
