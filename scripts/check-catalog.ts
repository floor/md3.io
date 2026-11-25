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
  // The Buttons family keeps M3's own order (src/server/component-directory.ts).
  { name: 'Buttons', slugs: ['button-group', 'button', 'extended-fab', 'fab-menu', 'fab', 'icon-button', 'split-button'] },
  { name: 'Date & time pickers', slugs: ['datepicker', 'timepicker'] },
  { name: 'Loading & progress', slugs: ['loading-indicator', 'progress'] },
  { name: 'Navigation', slugs: ['navigation-bar', 'navigation-drawer', 'navigation-rail'] },
  { name: 'Sheets', slugs: ['bottom-sheet', 'side-sheet'] },
  { name: 'All other components', slugs: ['app-bar', 'badge', 'card', 'carousel', 'checkbox', 'chips', 'dialog', 'divider', 'list', 'menu', 'radios', 'search', 'select', 'slider', 'snackbar', 'switch', 'tabs', 'text-field', 'toolbar', 'tooltip'] },
] as const;
const catalogOrder = sections.flatMap(section => [...section.slugs]);
const families = sections.slice(0, -1);
const byName = (a: string, b: string) => a.localeCompare(b, 'en');
const equal = (actual: unknown, expected: unknown, message: string) =>
  assert(JSON.stringify(actual) === JSON.stringify(expected), message);

async function checkDirectory(pane: Locator, path: string, docs = false) {
  // Cover the reviewed phone and desktop widths; existing breakpoint layout checks remain below.
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
  // The component list opens with the overview link; the Docs list's Components group is
  // the reference pages alone.
  const overview = docs ? [] : ['Components overview'];
  const componentsEnd = docs ? rows.length - addonDocs.length : rows.length;
  const componentsStart = docs ? componentsEnd - labels.length - families.length : rows.indexOf('Components overview');
  equal(rows.slice(componentsStart, componentsEnd), [...overview, ...[...labels, ...families.map(family => family.name)].sort(byName)], 'The directory rows follow A–Z');
  if (docs) equal(rows.slice(componentsEnd), addonDocs.map(item => item.name), 'Add-on docs follow the Components group A–Z');
  const hrefs = await pane.locator('a[part~="item"]').evaluateAll(links => links.map(link => link.getAttribute('href')));
  const firstComponent = docs ? hrefs.findIndex(href => inventory.some(item => item.href === href)) : hrefs.indexOf('/components/');
  equal(hrefs.slice(firstComponent).sort(), [...(docs ? [] : ['/components/']), ...inventory.map(item => item.href), ...(docs ? addonDocs.map(item => item.href) : [])].sort(), 'Every component is a real link and appears exactly once');
  for (const family of families) {
    const toggle = pane.getByRole('button', { name: family.name, exact: true });
    const id = await toggle.getAttribute('aria-controls');
    const list = pane.locator(`[id="${id}"]`);
    const expected = family.slugs.flatMap(slug => inventory.filter(item => item.slug === slug));
    assert(await toggle.evaluate(button => button.matches('button[type="button"]') && button.nextElementSibling?.id === button.getAttribute('aria-controls')),
      `${family.name}: a native button controls the following list`);
    equal(await list.locator('a').evaluateAll(links => links.map(link => link.getAttribute('href'))), expected.map(item => item.href),
      `${family.name}: the members follow the expected A–Z order`);
    // A component's Develop or Accessibility tab belongs to the component.
    const active = expected.some(item => item.href === path.replace(/(?:develop|accessibility)\/$/, ''));
    assert(await toggle.getAttribute('aria-expanded') === String(active) && await list.isVisible() === active,
      `${family.name}: only the current family is open on load`);
  }
  const current = pane.locator('a[aria-current="page"]');
  const route = path.replace(/(?:develop|accessibility)\/$/, '');
  const currentHref = hrefs.includes(route) ? route : null;
  assert(await current.count() === Number(currentHref !== null), 'Current link count matches the route');
  if (currentHref) assert(await current.getAttribute('href') === currentHref && await current.isVisible(), 'The current link is visible and matches the route');
}

/**
 * A section's list lives in the rail's drawer: docked open from 1600px, opened by resting on
 * the rail's destination from 840px, and from the navigation button below that.
 */
async function revealSectionList(page: Page, name: string, href: string) {
  const pane = page.getByRole('navigation', { name, exact: true });
  if (await pane.isVisible()) return pane;
  const width = page.viewportSize()!.width;
  if (width >= 840) await page.locator(`m-navigation-rail a[href="${href}"]`).hover();
  else await page.getByRole('button', { name: width < 600 ? 'Open section navigation' : 'Expand navigation', exact: true }).click();
  await pane.waitFor();
  return pane;
}

/** Closes a list revealSectionList opened: Escape for the modal, the pointer away for the floating drawer. */
async function dismissSectionList(page: Page) {
  const width = page.viewportSize()!.width;
  if (width >= 1600) return;
  if (width < 840) { await page.keyboard.press('Escape'); return; }
  await page.mouse.move(width - 10, 450);
  await page.locator('.site-rail-drawer[data-open]').waitFor({ state: 'detached' }).catch(async () => {
    await page.waitForFunction(() => !document.querySelector('.site-rail-drawer')?.hasAttribute('data-open'));
  });
}

async function checkComponentList(page: Page) {
  const pane = await revealSectionList(page, 'Component list', '/components/');
  assert(await pane.count() === 1, 'Expected one accessible component list pane');
  // Live examples can expose their own headings inside their shadow roots.
  const pageHeadings = await page.locator('main').evaluate(main => [...main.querySelectorAll('h1')]
    .filter(heading => !heading.closest('.catalog-visual')).length);
  assert(pageHeadings === 1, 'The page shell must expose one H1');
  await checkDirectory(pane, new URL(page.url()).pathname);
  return pane;
}

async function checkDetailFocusOrder(page: Page, width: number) {
  const main = page.getByRole('main');
  const detail = '#component-content';
  const inDetail = () => page.evaluate(selector => !!document.activeElement?.closest(selector), detail);
  // The component list is in the rail's drawer, outside main: Tab from main enters the detail.
  await main.focus();
  await page.keyboard.press('Tab');
  assert(await inDetail(), `${width}px: Tab did not reach the component detail`);
  assert(await main.getByRole('heading', { level: 1 }).first().textContent() === 'Tooltip', `${width}px: the detail H1 is not the first heading`);

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
  // Known: the shell's rail and buttons are material elements from the site bundle, and the
  // cards' lazy chunks carry their own copy (a separate build group, kept so the other pages
  // do not load the cards' code). The second copy cannot register; the first serves both.
  const duplicateDefinition = /^<m-[a-z-]+> is already defined by another script; keeping the first definition\.$/;
  page.on('console', message => { if ((message.type() === 'error' || message.type() === 'warning') && !duplicateDefinition.test(message.text())) errors.push(message.text()); });
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
    // The site's own rail is an <m-navigation-rail>: that element is defined on every page.
    .filter(visual => !visual.classList.contains('catalog-visual--navigation-rail'))
    // Its own element is still undefined (the icon buttons some cards share may be defined).
    .map(visual => ({ slug: visual.className, loaded: visual.querySelector(':not(:defined)') === null })));
  assert(far.length > 0, 'No card is far enough down the overview to check it loads lazily');
  assert(far.every(card => !card.loaded), `Cards far below the viewport loaded at once: ${far.filter(card => card.loaded).map(card => card.slug).join(', ')}`);
  await loadAll();
  const state = await inspect(page);
  assert(state.cards.length === componentSlugs.length, `The overview shows ${state.cards.length} cards, not ${componentSlugs.length}`);
  for (const [index, card] of state.cards.entries()) {
    const slug = catalogOrder[index]!;
    assert(card.tag === 'm-card' && (card.links === 3 || card.links === 4) && card.href === `/components/${slug}/` && card.name === components[slug].name, `${slug}: the card's links are not its title to the playground and its Playground, Develop (and Accessibility) actions`);
    assert(card.elements.some(name => name.startsWith('m-') || name.startsWith('md3-catalog-')), `${slug}: no mtrl element in the card`);
    assert(card.undefined.length === 0, `${slug}: not upgraded: ${card.undefined.join(', ')}`);
    assert(card.empty.length === 0, `${slug}: renders nothing: ${card.empty.join(', ')}`);
    assert(!card.inert, `${slug}: the visual is inert or aria-hidden`);
    assert(card.nested === 0, `${slug}: a control is nested in the link`);
    assert(!card.arrow, `${slug}: the card still has its ↗`);
  }
  assert(state.modal === 0 && state.dialogs === 0, 'A modal dialog is open on the overview before anyone opens one');
  // The dialog card shows its dialog open in place; no other dialog is open on the overview.
  assert(await page.getByRole('alertdialog').and(page.locator(':not(.catalog-visual--dialog *)')).count() === 0, 'A catalog dialog is open outside its card');
  assert(state.popovers === 0, 'A popover is open in the top layer before anyone opens one');
  assert(JSON.stringify(await boxes()) === JSON.stringify(before), 'The cards moved when the elements upgraded');

  // One link per card, named by the component's name. Focus follows what is seen: a
  // card's preview (its media, on top) comes before its title, and a person can tab past
  // a card's controls to its title.
  for (const slug of ['button', 'dialog', 'menu', 'tooltip'] as const) {
    assert(await page.getByRole('region', { name: 'Component previews' }).getByRole('link', { name: components[slug].name, exact: true }).count() === 1, `${slug}: the card's link is not named by its name`);
  }
  const titleLink = (slug: string) => page.locator(`.component-card:has(.catalog-visual--${slug})`).getByRole('link', { name: components[slug as keyof typeof components].name, exact: true });
  // From a title, Tab goes through that card's actions (Playground, Develop, Accessibility),
  // then into the next card's preview.
  await titleLink('button-group').focus();
  const actions = await page.locator('.component-card:has(.catalog-visual--button-group) .component-card__actions a').count();
  for (let index = 0; index < actions; index++) {
    await page.keyboard.press('Tab');
    assert(await page.evaluate(() => !!document.activeElement?.closest('.component-card__actions')), 'Tab from a title reaches its card\'s actions first');
  }
  await page.keyboard.press('Tab');
  const firstControl = page.locator('.catalog-visual--button m-button').first();
  assert(await firstControl.evaluate(host => document.activeElement === host && !!host.shadowRoot?.activeElement),
    'Tab from a title enters the next card\'s first preview control');
  let pastCard = false;
  for (let i = 0; i < 80 && !pastCard; i++) {
    await page.keyboard.press('Tab');
    pastCard = await titleLink('button').evaluate(link => document.activeElement === link).catch(() => false);
  }
  assert(pastCard, 'Tab could not get past the Button card\'s preview to its title link');

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
  const sliderBefore = Number(await prop('slider', 'm-slider[aria-label="Media volume"]', 'value'));
  await visual('slider').getByRole('slider').first().focus();
  await page.keyboard.press('ArrowRight');
  assert(Number(await prop('slider', 'm-slider[aria-label="Media volume"]', 'value')) > sliderBefore, 'slider: the preview did not move');
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
  // The dialog card shows the dialog open in place: OK waits for a choice, then closes
  // it, and a fresh one opens again.
  await visual('dialog').scrollIntoViewIfNeeded();
  const dialogOk = visual('dialog').getByRole('button', { name: 'OK', exact: true });
  await dialogOk.waitFor();
  assert(await dialogOk.isDisabled(), 'dialog: OK is on before a choice is made');
  await visual('dialog').getByText('Chimes', { exact: true }).click();
  await dialogOk.click();
  await visual('dialog').getByText('Alarm sound').waitFor({ state: 'hidden' });
  await visual('dialog').getByText('Alarm sound').waitFor();
  await staysOnOverview('dialog');
  await openClose('menu', 'Show menu',
    async () => {
      const item = page.getByRole('menuitem').first();
      await item.waitFor();
      // In the top layer, not clipped by the card: the item's box is on screen.
      const viewport = await item.evaluate(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth; });
      assert(viewport, 'menu: the open item does not intersect the viewport');
    },
    async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(200); });
  // The FAB menu card shows its menu open, as a list in the card: its items are there
  // to use where they stand.
  await visual('fab-menu').scrollIntoViewIfNeeded();
  const fabItem = visual('fab-menu').getByRole('menuitem', { name: 'First', exact: true });
  // It closes on a click elsewhere, as a menu does; Create opens it again.
  if (!await fabItem.isVisible()) await visual('fab-menu').getByRole('button', { name: 'Create', exact: true }).click();
  await fabItem.waitFor();
  assert(await visual('fab-menu').getByRole('menuitem').count() === 3, 'fab-menu: the open menu does not list its three items');
  await fabItem.click();
  await staysOnOverview('fab-menu');
  // The snackbar card shows the snackbar in its phone: Retry closes it, and a fresh one returns.
  await visual('snackbar').scrollIntoViewIfNeeded();
  const snack = visual('snackbar').getByText('Retrying in 5 seconds', { exact: false });
  await snack.waitFor();
  await visual('snackbar').getByRole('button', { name: 'Retry', exact: true }).click();
  await snack.waitFor({ state: 'hidden' });
  await snack.waitFor();
  await staysOnOverview('snackbar');
  // The tooltip card shows a plain and a rich tooltip, in place.
  await visual('tooltip').scrollIntoViewIfNeeded();
  await visual('tooltip').getByText('Add to playlist', { exact: true }).waitFor();
  await visual('tooltip').getByText('Photos upload in full quality', { exact: false }).waitFor();
  // The time picker card shows the picker itself: an hour on its dial is chosen in place.
  await visual('timepicker').scrollIntoViewIfNeeded();
  await visual('timepicker').getByRole('option', { name: "3 o'clock", exact: true }).click();
  await staysOnOverview('timepicker');
  await openClose('bottom-sheet', 'Show bottom sheet',
    async () => { await page.getByText('Plan your visit').waitFor({ state: 'visible' }); },
    async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(200); });
  await openClose('side-sheet', 'Show side sheet',
    async () => { await page.getByText('Details', { exact: true }).waitFor({ state: 'visible' }); },
    async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(200); });
  await visual('datepicker').scrollIntoViewIfNeeded();
  // The card shows the calendar itself: a day is chosen in place.
  await visual('datepicker').getByRole('gridcell').nth(12).click();
  await staysOnOverview('datepicker');

  // Light and dark follow the site, from mtrl's baseline.
  const surface = () => page.locator('.catalog-visual--button').evaluate(element => getComputedStyle(element).backgroundColor);
  // The stage is the surface tinted with 14% of the primary (styles/catalog.css --catalog-stage).
  const stage = (mode: 'light' | 'dark') => page.evaluate(([primary, base]) => {
    const probe = document.body.appendChild(document.createElement('div'));
    probe.style.background = `color-mix(in srgb, ${primary} 14%, ${base})`;
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  }, [baseline[mode].get('primary')!, baseline[mode].get('surface')!] as const);
  // The filled button (no variant): the card's first button is tonal.
  const filled = () => page.locator('.catalog-visual--button m-button:not([variant])').first().evaluate(element => getComputedStyle(element.shadowRoot!.querySelector('button')!).backgroundColor);
  const rgb = (hex: string) => `rgb(${hex.slice(1).match(/../g)!.map(part => parseInt(part, 16)).join(', ')})`;
  const setMode = async (mode: 'light' | 'dark') => {
    if (await page.locator('html').getAttribute('data-theme-mode') !== mode) await page.locator('#theme-toggle').click();
    // The button's colour transitions to the new mode.
    await page.locator('.catalog-visual--button m-button').first().evaluate(element => Promise.all(element.shadowRoot!.getAnimations().map(animation => animation.finished.catch(() => undefined))));
  };
  await setMode('light');
  assert(await surface() === await stage('light') && await filled() === rgb(baseline.light.get('primary')!), 'Light site: the visuals are not mtrl baseline light');
  await page.screenshot({ animations: 'disabled', path: `${output}/catalog-light.png`, fullPage: true });
  await setMode('dark');
  assert(await surface() === await stage('dark') && await filled() === rgb(baseline.dark.get('primary')!), 'Dark site: the visuals are not mtrl baseline dark');
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
    const got = await themedPage.locator('.catalog-visual--button m-button:not([variant])').first().evaluate(el => getComputedStyle(el.shadowRoot!.querySelector('button')!).backgroundColor);
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
  // On a phone the dialog card's open dialog fits its card, and Cancel works by touch.
  const compactDialog = narrow.locator('.catalog-visual--dialog');
  await compactDialog.scrollIntoViewIfNeeded();
  const phoneDialog = compactDialog.getByText('Alarm sound');
  await phoneDialog.waitFor();
  assert(await compactDialog.evaluate(visual => {
    const card = visual.getBoundingClientRect();
    const dialog = visual.querySelector('md3-catalog-dialog')!.shadowRoot!.querySelector('.mtrl-dialog')!.getBoundingClientRect();
    return dialog.left >= card.left && dialog.right <= card.right && dialog.top >= card.top && dialog.bottom <= card.bottom;
  }), 'The compact catalog dialog fits its card');
  await compactDialog.getByRole('button', { name: 'Cancel', exact: true }).tap();
  await phoneDialog.waitFor({ state: 'hidden' });
  assert(narrow.url() === `${base}/components/`, 'The compact preview navigated away when used');
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
  for (const width of [360, 390, 412, 700, 1024, 1440, 1700]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${base}/components/`);
    const index = await checkComponentList(page);
    // Close the list before reading the page behind it.
    await dismissSectionList(page);
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
    if (width >= 1600) {
      // Docked: the list and the previews sit side by side.
      const previewBox = await gallery.boundingBox();
      const listBox = await index.boundingBox();
      assert(previewBox && listBox && listBox.x + listBox.width <= previewBox.x, `${width}px: the previews and list do not sit side by side`);
    }
    await page.screenshot({ animations: 'disabled', path: `${captures}/overview-${width}.png` });
    await page.goto(`${base}/components/tooltip/`);
    assert(await page.getByRole('heading', { name: 'Tooltip', level: 1, exact: true }).count() === 1, `${width}px: the detail heading is missing`);
    // A component page's tabs: its Overview is the page itself.
    const overviewTab = page.locator('.component-tabs a[aria-current="page"]');
    assert(await overviewTab.getAttribute('href') === '/components/tooltip/', `${width}px: missing the Overview tab`);
    assert(await page.getByText('Browse components', { exact: true }).count() === 0, `${width}px: temporary component picker on the detail`);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px: the detail overflows`);
    // The page's own copy of the list stays hidden: the rail's drawer is the list.
    const inPage = page.locator('main .component-list');
    assert(!await inPage.isVisible() && await inPage.getByRole('link').count() === 0, `${width}px: the page's own list is exposed`);
    const pane = await checkComponentList(page);
    const current = pane.getByRole('link', { name: 'Tooltip', exact: true });
    assert(await current.isVisible() && await page.evaluate(() => scrollY === 0), `${width}px: the current link is not in view, or the page scrolled to show it`);
    if (width >= 1600) {
      const paneBox = await page.locator('.site-rail-drawer').boundingBox();
      const detailBox = await page.locator('.component-page, .component-tab-page').boundingBox();
      assert(paneBox && detailBox && paneBox.x + paneBox.width <= detailBox.x, `${width}px: the list and detail do not sit side by side`);
    }
    await dismissSectionList(page);
    await page.screenshot({ animations: 'disabled', path: `${captures}/detail-${width}.png` });
    await checkDetailFocusOrder(page, width);
    await page.getByRole('navigation', { name: 'Primary navigation', exact: true }).getByRole('link', { name: 'Components', exact: true }).click();
    await page.waitForURL(`${base}/components/`);
  }

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
      }
      // A component's documentation is its Develop tab: the old Docs address lands there, and
      // the tab keeps the component list, as its Overview does.
      await page.goto(`${base}/docs/components/${slug}/`);
      assert(new URL(page.url()).pathname === `/components/${slug}/develop/`, `${slug}: the old documentation address lands on the Develop tab`);
      if (width === 1440) await checkComponentList(page);
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
    // A hidden Add-ons section has no rail destination, so no list to open.
    if (addonsPublic) {
      const drawer = await revealSectionList(page, 'Add-ons list', '/addons/');
      equal(await drawer.locator('a[part~="item"]').evaluateAll(links => links.map(link => link.getAttribute('href'))), ['/addons/', ...ordered.map(playgroundHref)], `${width}px: Add-ons drawer is A–Z`);
      assert(await drawer.locator('[aria-current="page"]').getAttribute('href') === '/addons/', 'The Add-ons overview is current');
      assert(await drawer.locator('button[aria-expanded]').count() === 0, 'The Add-ons drawer has no families');
      await dismissSectionList(page);
    }
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
    if (addonsPublic) {
      const detailPane = await revealSectionList(page, 'Add-ons list', '/addons/');
      assert(await detailPane.locator('a[aria-current="page"]').getAttribute('href') === '/addons/avatar/', 'Avatar is current in the detail drawer');
      await dismissSectionList(page);
    }
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
