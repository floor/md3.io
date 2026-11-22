// The components overview in a browser: each card's element loads as the card comes near
// the viewport, and every card shows mtrl's element upgraded once scrolled to, without
// moving; the card's title is its one link and its preview is live (controls respond,
// overlays open and close, nothing is nested in a link), the visuals follow the site's
// theme and mode live, and a phone has no horizontal scroll.
// BASE_URL checks a running server; without it the check serves the site itself.
import { addonsPublic } from '../src/shared/visibility';
import { chromium, type Locator, type Page } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { addonDocGroup, docGroups } from '../src/server/content';
import { checkBottomAppBarRow } from './check-drawer-row';
import { componentSlugs, components } from '../src/shared/components';
import { addonSlugs, addons, playgroundHref } from '../src/shared/addons';
import { baseline, themeTokens } from '../src/server/tokens';

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
  { name: 'Navigation', slugs: ['navigation-bar', 'navigation-drawer', 'navigation-rail'] },
  { name: 'Sheets', slugs: ['bottom-sheet', 'side-sheet'] },
  { name: 'All other components', slugs: ['app-bar', 'badge', 'bottom-app-bar', 'card', 'carousel', 'checkbox', 'chips', 'dialog', 'divider', 'list', 'menu', 'radios', 'search', 'select', 'slider', 'snackbar', 'switch', 'tabs', 'text-field', 'toolbar', 'tooltip'] },
] as const;
const catalogOrder = sections.flatMap(section => [...section.slugs]);
const families = sections.slice(0, -1);
const byName = (a: string, b: string) => a.localeCompare(b, 'en');
const equal = (actual: unknown, expected: unknown, message: string) =>
  assert(JSON.stringify(actual) === JSON.stringify(expected), message);

async function checkDirectory(pane: Locator, path: string, docs = false) {
  await checkBottomAppBarRow(pane);
  // A hidden Add-ons section (src/shared/visibility.ts) has no docs group.
  const addonDocs = addonsPublic ? addonDocGroup.items : [];
  if (docs) assert(await pane.locator('[part~="section-label"]').filter({ hasText: /^Components$/ }).count() === 1, 'Docs has a Components section');
  const inventory = docs ? docGroups.filter(group => group !== addonDocGroup).flatMap(group => group.items) : componentSlugs.map(slug => ({
    slug, name: components[slug].name, href: `/components/${slug}/`,
  }));
  const rows = await pane.locator('[part~="items"]').evaluate(items => [...items.children].flatMap(item => {
    const row = item.matches('a') ? item : item.querySelector('button[aria-expanded]');
    return row ? [(row.querySelector('[part~="item-label"]')?.textContent ?? row.textContent)!.trim()] : [];
  }));
  const labels = inventory.filter(item => !families.some(family => family.slugs.some(slug => slug === item.slug))).map(item => item.name);
  // The Components pane lists components only; the docs pane keeps its overview link.
  const overview = docs ? ['Components overview'] : [];
  const componentsStart = docs ? rows.indexOf('Components overview') : 0;
  const componentsEnd = docs ? rows.length - addonDocs.length : rows.length;
  equal(rows.slice(componentsStart, componentsEnd), [...overview, ...[...labels, ...families.map(family => family.name)].sort(byName)], 'The directory rows follow A–Z');
  if (docs) equal(rows.slice(componentsEnd), addonDocs.map(item => item.name), 'Add-on docs follow the Components group A–Z');
  const hrefs = await pane.locator('a[part~="item"]').evaluateAll(links => links.map(link => link.getAttribute('href')));
  equal(hrefs.slice(docs ? hrefs.indexOf('/components/') : 0).sort(), [...(docs ? ['/components/'] : []), ...inventory.map(item => item.href), ...(docs ? addonDocs.map(item => item.href) : [])].sort(), 'Every component is a real link and appears exactly once');
  for (const family of families) {
    const toggle = pane.getByRole('button', { name: family.name, exact: true });
    const id = await toggle.getAttribute('aria-controls');
    const list = pane.locator(`[id="${id}"]`);
    const expected = family.slugs.flatMap(slug => inventory.filter(item => item.slug === slug));
    assert(await toggle.evaluate(button => button.matches('button[type="button"]') && button.nextElementSibling?.id === button.getAttribute('aria-controls')),
      `${family.name}: a native button controls the following list`);
    equal(await list.locator('a').evaluateAll(links => links.map(link => link.getAttribute('href'))), expected.map(item => item.href),
      `${family.name}: the members follow the expected A–Z order`);
    const active = expected.some(item => item.href === path);
    assert(await toggle.getAttribute('aria-expanded') === String(active) && await list.isVisible() === active,
      `${family.name}: only the current family is open on load`);
  }
  const current = pane.locator('a[aria-current="page"]');
  const currentHref = hrefs.includes(path) ? path : null;
  assert(await current.count() === Number(currentHref !== null), 'Current link count matches the route');
  if (currentHref) assert(await current.getAttribute('href') === currentHref && await current.isVisible(), 'The current link is visible and matches the route');
}

async function checkComponentList(page: Page) {
  const pane = page.getByRole('navigation', { name: 'Component list', exact: true });
  assert(await pane.count() === 1, 'Expected one accessible component list pane');
  // Live examples can expose their own headings inside their shadow roots.
  const pageHeadings = await page.locator('main').evaluate(main => [...main.querySelectorAll('h1')]
    .filter(heading => !heading.closest('.catalog-visual')).length);
  assert(pageHeadings === 1, 'The page shell must expose one H1');
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
    const focused = await pane.getByRole('link', { name: 'App bar', exact: true }).evaluate(link => (link.getRootNode() as ShadowRoot).activeElement === link);
    assert(focused, `${width}px: Tab enters the detail before the component list`);
    const headings = main.getByRole('heading');
    assert(await headings.nth(0).and(main.getByRole('heading', { name: 'Tooltip', level: 1, exact: true })).count() === 1,
      `${width}px: the detail H1 is the first heading (the list has none)`);
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
    const slug = catalogOrder[index]!;
    assert(card.tag === 'article' && card.links === 1 && card.href === `/components/${slug}/` && card.name === components[slug].name, `${slug}: the card's one link is not its title to the playground`);
    assert(card.elements.some(name => name.startsWith('m-') || name.startsWith('md3-catalog-')), `${slug}: no mtrl element in the card`);
    assert(card.undefined.length === 0, `${slug}: not upgraded: ${card.undefined.join(', ')}`);
    assert(card.empty.length === 0, `${slug}: renders nothing: ${card.empty.join(', ')}`);
    assert(!card.inert, `${slug}: the visual is inert or aria-hidden`);
    assert(card.nested === 0, `${slug}: a control is nested in the link`);
    assert(!card.arrow, `${slug}: the card still has its ↗`);
  }
  assert(state.modal === 0 && state.dialogs === 0, 'A modal dialog is open on the overview before anyone opens one');
  assert(await page.getByRole('alertdialog').count() === 0, 'The closed catalog dialog is visible on the overview');
  assert(state.popovers === 0, 'A popover is open in the top layer before anyone opens one');
  assert(JSON.stringify(await boxes()) === JSON.stringify(before), 'The cards moved when the elements upgraded');

  // One link per card, named by the component's name; the preview's controls
  // follow it in the tab order, and a person can tab past a card.
  for (const slug of ['button', 'dialog', 'menu', 'tooltip'] as const) {
    assert(await page.getByRole('region', { name: 'Component previews' }).getByRole('link', { name: components[slug].name, exact: true }).count() === 1, `${slug}: the card's link is not named by its name`);
  }
  const titleLink = (slug: string) => page.locator(`.component-card:has(.catalog-visual--${slug})`).getByRole('link', { name: components[slug as keyof typeof components].name, exact: true });
  await titleLink('button').focus();
  await page.keyboard.press('Tab');
  const firstControl = page.locator('.catalog-visual--button m-button').first();
  assert(await firstControl.evaluate(host => document.activeElement === host && !!host.shadowRoot?.activeElement),
    'Tab from the title enters the first preview control');
  let pastCard = false;
  for (let i = 0; i < 80 && !pastCard; i++) {
    await page.keyboard.press('Tab');
    pastCard = await titleLink('button-group').evaluate(link => document.activeElement === link).catch(() => false);
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
    async () => { await visual('dialog').locator('dialog:modal').waitFor(); },
    async () => {
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      await page.getByRole('alertdialog').waitFor({ state: 'hidden' });
    });
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


  // Compact cards are live and still load just before entering the viewport.
  const narrowContext = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, colorScheme: 'light', reducedMotion: 'reduce' });
  const narrow = await narrowContext.newPage();
  const requests = new Set<string>();
  narrow.on('request', request => requests.add(request.url()));
  await narrow.goto(`${base}/components/`);
  const compactGallery = narrow.getByRole('region', { name: 'Component previews' });
  assert(await compactGallery.locator('.component-card h3 a').count() === componentSlugs.length, 'The compact overview exposes every card title');
  await narrow.locator('.catalog-visual--button m-button:defined').first().waitFor();
  assert(await compactGallery.locator('.catalog-visual').first().isVisible(), 'The compact overview shows the live preview');
  assert(await narrow.locator('md3-catalog-tooltip').evaluate(element => !element.matches(':defined')), 'The compact overview upgraded a far-off card on load');
  const catalogEntry = await narrow.locator('script[src^="/dist/catalog."]').getAttribute('src');
  assert(catalogEntry, 'The catalog module is missing');
  const entryUrl = new URL(catalogEntry, base);
  const entryScript = await (await narrow.request.get(entryUrl.href)).text();
  const cardModules = [...entryScript.matchAll(/import\(["'](\.\/[^"']+)["']\)/g)].map(match => new URL(match[1]!, entryUrl).href);
  assert(cardModules.length >= componentSlugs.length, 'Could not find the lazy card modules in the catalog entry');
  const requested = cardModules.filter(url => requests.has(url));
  assert(requested.length > 0 && requested.length < componentSlugs.length, 'The compact overview did not load the preview chunks lazily');
  const compactDialog = narrow.locator('.catalog-visual--dialog');
  await compactDialog.scrollIntoViewIfNeeded();
  await compactDialog.getByRole('button', { name: 'Show dialog', exact: true }).tap();
  const phoneModal = compactDialog.locator('dialog:modal');
  await phoneModal.waitFor();
  assert(await phoneModal.evaluate(dialog => {
    const { left, right, top, bottom } = dialog.getBoundingClientRect();
    return left >= 0 && right <= innerWidth && top >= 0 && bottom <= innerHeight;
  }), 'The compact catalog dialog fits the viewport');
  await narrow.getByRole('button', { name: 'Cancel', exact: true }).tap();
  await narrow.getByRole('alertdialog').waitFor({ state: 'hidden' });
  assert(narrow.url() === `${base}/components/`, 'The compact preview navigated away when opened');
  const lastLink = compactGallery.getByRole('link', { name: 'Tooltip', exact: true });
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
    const sectionHeadings = gallery.getByRole('heading', { level: 2 }).and(gallery.locator('.component-catalog__section > h2'));
    equal(await sectionHeadings.allTextContents(), sections.map(section => section.name),
      `${width}px: the overview exposes the six sections in order`);
    for (const { name, slugs } of sections) {
      const section = gallery.getByRole('region', { name, exact: true });
      equal(await section.locator('.component-card h3 a').evaluateAll(links => links.map(link => link.getAttribute('href'))),
        slugs.map(slug => `/components/${slug}/`), `${width}px: ${name} contains its A–Z card links`);
    }
    const titles = gallery.getByRole('heading', { level: 3 }).and(gallery.locator('.component-card__body > h3'));
    assert(await titles.count() === componentSlugs.length, `${width}px: every card has an H3 title`);
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
      const wrapper = page.locator('main .component-list');
      const paneBox = await wrapper.boundingBox();
      const detailBox = await page.locator('.component-page').boundingBox();
      const currentBox = await pane.getByRole('link', { name: 'Tooltip', exact: true }).boundingBox();
      assert(paneBox && detailBox && paneBox.x + paneBox.width <= detailBox.x, `${width}px: the list and detail do not sit side by side`);
      assert(currentBox && currentBox.y >= paneBox.y && currentBox.y + currentBox.height <= paneBox.y + paneBox.height, `${width}px: the current link is outside the list viewport`);
      assert(await wrapper.evaluate(list => list.scrollTop > 0 && list.scrollHeight > list.clientHeight) && await page.evaluate(() => scrollY === 0),
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
  await firstCard.getByRole('link', { name: 'Button', exact: true }).focus();
  await page.screenshot({ animations: 'disabled', path: `${captures}/overview-840.png` });
  await page.setViewportSize({ width: 839, height: 900 });
  await page.waitForFunction(() => document.activeElement?.matches('.component-card h3 a[href="/components/button/"]'));

  // A phone: no horizontal scroll, in either mode.
  await page.setViewportSize({ width: 390, height: 844 });
  for (const mode of ['dark', 'light'] as const) {
    await setMode(mode);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `390 px ${mode}: the overview overflows`);
  }
  await loadAll();
  await page.screenshot({ animations: 'disabled', path: `${output}/catalog-mobile.png`, fullPage: true });
  assert((await inspect(page)).modal === 0, 'A modal opened on the phone');

  const azCaptures = resolve(output, 'components-az');
  await mkdir(azCaptures, { recursive: true });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${base}/components/`);
    await loadAll();
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
      const docs = page.getByRole('navigation', { name: 'Docs links' });
      await checkDirectory(docs, new URL(page.url()).pathname, true);
      if (slug === 'button') {
        const current = docs.getByRole('link', { name: 'Button', exact: true });
        if (width === 390) await current.evaluate(link => link.scrollIntoView({ block: 'center', behavior: 'instant' }));
        else await current.scrollIntoViewIfNeeded();
        await page.screenshot({ animations: 'disabled', path: `${azCaptures}/docs-sidebar-${width}.png` });
      }
    }
  }

  const addonCaptures = resolve(output, 'addons');
  await mkdir(addonCaptures, { recursive: true });
  const ordered = [...addonSlugs].sort((a, b) => byName(addons[a].name, addons[b].name));
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${base}/addons/`);
    const gallery = page.getByRole('region', { name: 'Add-on previews', exact: true });
    equal(await gallery.locator('.component-card h3 a').evaluateAll(links => links.map(link => link.getAttribute('href'))), ordered.map(playgroundHref), `${width}px: Add-ons cards are A–Z`);
    assert(await gallery.locator('.component-catalog__section > h2').count() === 0, 'Add-ons has no families');
    await openCompactIndex(page);
    const drawer = page.getByRole('navigation', { name: 'Add-ons list', exact: true });
    equal(await drawer.locator('a[part~="item"]').evaluateAll(links => links.map(link => link.getAttribute('href'))), ['/addons/', ...ordered.map(playgroundHref)], `${width}px: Add-ons drawer is A–Z`);
    assert(await drawer.locator('[aria-current="page"]').getAttribute('href') === '/addons/', 'The Add-ons overview is current');
    assert(await drawer.locator('button[aria-expanded]').count() === 0, 'The Add-ons drawer has no families');
    if (width === 390) await page.locator('#component-catalog-index summary').click();
    await gallery.locator('m-avatar:defined').waitFor();
    await gallery.locator('m-autocomplete:defined').waitFor();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Add-ons overview fits the viewport');
    await page.screenshot({ animations: 'disabled', path: `${addonCaptures}/overview-${width}.png` });

    const swatch = gallery.getByRole('button', { name: 'Ocean', exact: true });
    await swatch.scrollIntoViewIfNeeded();
    assert((await swatch.boundingBox())!.width >= 28, 'Color picker swatches receive their light-DOM styles');
    await swatch.click();

    const expansion = gallery.getByRole('button', { name: 'Delivery details', exact: true });
    await expansion.click();
    assert(await expansion.getAttribute('aria-expanded') === 'true', 'The expansion card opens from its header');
    await expansion.press('Enter');
    assert(await expansion.getAttribute('aria-expanded') === 'false', 'The header closes the expansion card with Enter');

    await gallery.locator('.component-card h3 a[href="/addons/avatar/"]').click();
    await page.waitForURL(`${base}/addons/avatar/`);
    await page.getByRole('heading', { name: 'Avatar', level: 1, exact: true }).waitFor();
    const detailPane = page.locator('main m-drawer.site-drawer');
    await detailPane.locator('a[aria-current="page"]').waitFor({ state: 'attached' });
    assert(await detailPane.locator('a[aria-current="page"]').getAttribute('href') === '/addons/avatar/', 'Avatar is current in the detail drawer');
    await page.frameLocator('#preview').getByText('Ada Lovelace', { exact: true }).waitFor();
    assert(await page.locator('.device__bar').count() === 0, 'Add-on playgrounds have no device chooser, like component playgrounds');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Add-on playground fits the viewport');
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ animations: 'disabled', path: `${addonCaptures}/avatar-${width}.png` });
  }

  assert(errors.length === 0, errors.join('\n'));
  console.log('All catalog browser checks passed.');
} finally {
  await browser.close();
  server?.stop(true);
}
