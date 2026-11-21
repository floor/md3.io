import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, type Locator } from 'playwright';
import { handleRequest } from '../server';
import { componentDirectory } from '../src/server/component-directory';
import { addonDocGroup, docGroups, guideGroup } from '../src/server/content';
import { examples } from '../src/server/examples';
import { addonsPublic, showcasePublic } from '../src/shared/visibility';
import { stylePages } from '../src/server/styles';

const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: handleRequest });
const browser = await chromium.launch();
const output = resolve(import.meta.dir, '../analysis/browser/site-navigation');
await mkdir(output, { recursive: true });
const url = (path: string) => new URL(path, server.url).href;
const showcaseLabel = 'Showcase';
const showcasePath = '/showcase/';
// Hidden sections (src/shared/visibility.ts) have no navigation entry.
const destinations = ['Components', ...(addonsPublic ? ['Add-ons'] : []), 'Styles', ...(showcasePublic ? [showcaseLabel] : []), 'Docs'];
const widths = [360, 390, 412, 700, 840, 1024, 1440];
const linkNames = (nav: Locator) => nav.getByRole('link').allTextContents();
const focused = (locator: Locator) => locator.evaluate(node => (node.getRootNode() as Document | ShadowRoot).activeElement === node);

try {
  const context = await browser.newContext({ hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  const nav = page.getByRole('navigation', { name: 'Primary navigation', exact: true });
  const modal = page.getByRole('dialog', { name: 'Navigation', exact: true });
  const close = modal.getByRole('button', { name: 'Close navigation', exact: true });
  const open = page.locator('#site-nav-open');
  const searchTrigger = page.locator('#search-trigger');
  const size = (width: number) => page.setViewportSize({ width, height: 900 });
  const goto = (path: string) => page.goto(url(path));
  const capture = (name: string) => page.screenshot({ path: `${output}/${name}.png` });

  const assertDestinations = async (label: string) => {
    assert.equal(await nav.count(), 1, `${label}: one primary navigation landmark`);
    assert.deepEqual((await linkNames(nav)).map(name => name.trim()), destinations, label);
  };
  const showRail = async () => {
    await open.press('Enter');
    await modal.waitFor();
    assert.equal(await open.getAttribute('aria-expanded'), 'true');
    assert.equal(await open.getAttribute('aria-haspopup'), 'dialog');
    assert.equal(await focused(close), true, 'modal puts initial focus on Close navigation');
  };
  const assertClosedRail = async () => {
    await modal.waitFor({ state: 'hidden' });
    await page.waitForFunction(() => document.activeElement?.id === 'site-nav-open');
    assert.equal(await open.getAttribute('aria-expanded'), 'false');
  };

  for (const width of widths) {
    const compact = width < 600;
    const medium = width >= 600 && width < 840;
    await size(width);
    await goto('/components/button/');
    await assertDestinations(`${width}px`);
    const visibleOpener = page.getByRole('button', { name: 'Expand navigation', exact: true });
    assert.equal(await visibleOpener.count(), medium ? 1 : 0, `${width}px rail opener`);
    const bar = page.locator('#site-primary-bar');
    const rail = page.locator('#site-primary-rail');
    const shown = compact ? bar : rail;
    const inactive = compact ? rail : bar;
    await inactive.waitFor({ state: 'hidden' });
    assert.equal(await inactive.getAttribute('hidden'), '', 'enhanced inactive pattern is hidden');
    const hiddenLink = inactive.locator('a').first();
    await hiddenLink.evaluate(node => node.focus());
    assert.equal(await focused(hiddenLink), false, 'inactive links cannot take focus');
    assert.equal(await nav.getByRole('link', { name: 'Components', exact: true }).getAttribute('aria-current'), 'location');
    assert.equal(await nav.locator('[aria-current]').count(), 1);
    const chrome = (await shown.boundingBox())!;
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `shell fits at ${width}px`);

    if (compact) {
      assert.equal(chrome.y + chrome.height, 900, 'bar sits at the viewport bottom');
      assert.ok(chrome.width >= width - 1);
      await capture(`bar-${width}`);
      await searchTrigger.click();
      await page.getByRole('dialog', { name: 'Search the site' }).waitFor();
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.activeElement?.id === 'search-trigger');
      await assertDestinations(`bar after search at ${width}px`);
      const footerLink = page.locator('.site-footer').getByRole('link', { name: 'Privacy', exact: true });
      await footerLink.focus();
      await footerLink.evaluate(node => node.scrollIntoView({ block: 'end' }));
      const footer = (await footerLink.boundingBox())!;
      assert.ok(footer.y + footer.height <= chrome.y - 1, 'focused footer link clears the bar');
      assert.deepEqual((await shown.boundingBox())!.y, chrome.y, 'bar stays reachable at the end of the page');
    } else {
      assert.equal(chrome.width, 96, 'collapsed rail uses its layout width');
      await capture(`rail-${width}`);
    }
    if (medium) {
      assert.equal((await open.boundingBox())?.height, 40, 'rail opener keeps its Material visual height');
      await showRail();
      assert.equal((await close.boundingBox())?.height, 40, 'rail closer keeps its Material visual height');
      await assertDestinations(`modal rail at ${width}px`);
      assert.equal(await rail.getAttribute('inert'), '');
      const section = modal.getByRole('navigation', { name: 'Component list', exact: true });
      assert.equal(await page.locator('.component-list').count(), 1, 'the drawer uses a single component list');
      assert.equal(await section.getByRole('link', { name: 'Button', exact: true }).getAttribute('aria-current'), 'page');
      const last = section.getByRole('link').last();
      await page.keyboard.press('Shift+Tab');
      assert.equal(await focused(last), true);
      await page.keyboard.press('Tab');
      assert.equal(await focused(close), true);
      await capture(`rail-open-${width}`);
      await page.keyboard.press('Escape');
      await assertClosedRail();
      assert.equal(await page.locator('main .component-list').count(), 1, 'closing restores the component pane');

      const searchBox = (await searchTrigger.boundingBox())!;
      const x = searchBox.x + searchBox.width / 2;
      const y = searchBox.y + searchBox.height / 2;
      for (const activate of [() => page.mouse.click(x, y), () => page.touchscreen.tap(x, y)]) {
        await showRail();
        await activate();
        assert.equal(await page.locator('#search-dialog').getAttribute('open'), null, 'background search remains inert');
        await page.keyboard.press('Control+K');
        assert.equal(await page.locator('#search-dialog').getAttribute('open'), null, 'shortcut respects the active modal');
        await close.click();
        await assertClosedRail();
      }
    }

    if (width < 840) {
      await page.getByRole('link', { name: 'All components', exact: true }).click();
      await page.locator('#component-catalog-index summary').click();
      const directory = page.getByRole('navigation', { name: 'Component list', exact: true });
      // A client visit retains the Buttons section opened on the Button page.
      const buttons = directory.getByRole('button', { name: 'Buttons', exact: true });
      assert.equal(await buttons.getAttribute('aria-expanded'), 'true', 'client navigation retains the open Buttons family');
      await directory.getByRole('link', { name: 'Icon button', exact: true }).click();
      await page.waitForURL(url('/components/icon-button/'));
    }
  }

  // At desktop the detail drawer is visible, so verify that a card visit opens
  // its collapsed family and exposes the current item, as on a direct load.
  await size(1440);
  await goto('/components/button/');
  await page.getByRole('link', { name: 'All components', exact: true }).click();
  await page.locator('.component-catalog').waitFor();
  const directory = page.getByRole('navigation', { name: 'Component list', exact: true });
  const buttons = directory.getByRole('button', { name: 'Buttons', exact: true });
  assert.equal(await buttons.getAttribute('aria-expanded'), 'true', 'desktop client visit retains the open family');
  await buttons.click();
  assert.equal(await buttons.getAttribute('aria-expanded'), 'false', 'the destination family starts collapsed');
  await page.locator('.component-card h3').getByRole('link', { name: 'Icon button', exact: true }).click();
  await page.waitForURL(url('/components/icon-button/'));
  const current = directory.getByRole('link', { name: 'Icon button', exact: true });
  await current.waitFor();
  assert.equal(await current.getAttribute('aria-current'), 'page', 'the destination item becomes current');
  assert.equal(await buttons.getAttribute('aria-expanded'), 'true', 'client navigation opens the collapsed destination family');

  await size(700);
  await goto('/styles/');
  assert.equal(await nav.getByRole('link', { name: 'Styles', exact: true }).getAttribute('aria-current'), 'page');
  await showRail();
  await modal.getByRole('link', { name: 'Docs', exact: true }).focus();
  await size(599);
  await modal.waitFor({ state: 'hidden' });
  await page.waitForFunction(() => document.activeElement?.closest('#site-primary-bar') && document.activeElement?.getAttribute('href') === '/docs/');
  await size(600);
  await page.waitForFunction(() => document.activeElement?.closest('#site-primary-rail') && document.activeElement?.getAttribute('href') === '/docs/');
  await showRail();
  await modal.getByRole('link', { name: 'Color', exact: true }).focus();
  await size(840);
  await modal.waitFor({ state: 'hidden' });
  await open.waitFor({ state: 'hidden' });
  await page.waitForFunction(() => document.activeElement?.closest('#sidebar') &&
    document.activeElement.shadowRoot?.activeElement?.matches('a[href="/styles/color/"]'));
  const [newPage] = await Promise.all([
    context.waitForEvent('page'),
    nav.getByRole('link', { name: 'Docs', exact: true }).click({ modifiers: ['ControlOrMeta'] }),
  ]);
  await newPage.waitForURL(url('/docs/'));
  await newPage.close();

  const docsEntries = componentDirectory(docGroups.filter(group => group !== addonDocGroup).flatMap(group => group.items)).entries;
  const docsLinks = docsEntries.flatMap(entry => 'items' in entry ? entry.items : [entry]);
  const sections = [
    { label: 'Docs', path: '/docs/frameworks/', hrefs: ['/docs/', ...guideGroup.items.map(item => item.href), '/components/', ...docsLinks.map(item => item.href), ...(addonsPublic ? addonDocGroup.items.map(item => item.href) : [])] },
    { label: 'Styles', path: '/styles/shape/', hrefs: stylePages.map(style => style.href) },
    ...(showcasePublic ? [{ label: showcaseLabel, path: `${showcasePath}${examples[0]!.slug}/`, hrefs: [showcasePath, ...examples.map(example => `${showcasePath}${example.slug}/`)] }] : []),
  ];
  for (const { label, path, hrefs } of sections) for (const width of [...widths, 839]) {
    await size(width);
    await goto(path);
    const index = page.locator('#section-index');
    const indexLinks = index.getByRole('navigation', { name: `${label} links`, exact: true });
    const summary = index.locator('summary');
    assert.equal(await index.count(), 1);
    if (width < 840) await summary.click(); else await summary.waitFor({ state: 'hidden' });
    const activeLabel = nav.locator('[aria-current] .site-nav-link__label');
    assert.equal(await activeLabel.evaluate(async node => {
      await document.fonts.ready;
      const text = document.createRange();
      text.selectNodeContents(node);
      return text.getClientRects().length;
    }), 1, `${label} fits its primary navigation label on one line at ${width}px`);
    const geometry = (await index.boundingBox())!;
    const content = (await page.locator('#content').boundingBox())!;
    assert.equal(await indexLinks.count(), 1);
    assert.deepEqual(await indexLinks.locator('a[part~="item"]').evaluateAll(links => links.map(link => link.getAttribute('href'))), hrefs);
    assert.equal(await indexLinks.locator('[aria-current="page"]').getAttribute('href'), path);
    assert.ok(width < 840 ? geometry.y + geometry.height <= content.y + 1 : geometry.x + geometry.width <= content.x + 1,
      `${label} index uses the right placement at ${width}px`);
    if (width === 839 || width === 840) await capture(`index-${label.toLowerCase()}-${width}`);
    if (width === 700) {
      await showRail();
      const modalLinks = modal.getByRole('navigation', { name: `${label} links`, exact: true });
      assert.equal(await modal.locator('#sidebar m-drawer').count(), 1, 'the modal borrows the inline drawer');
      assert.deepEqual(await modalLinks.locator('a[part~="item"]').evaluateAll(links => links.map(link => link.getAttribute('href'))), hrefs);
      assert.equal(await modalLinks.locator('[aria-current="page"]').getAttribute('href'), path);
      await page.keyboard.press('Escape');
      await assertClosedRail();
      await indexLinks.waitFor();
    }
  }

  if (addonsPublic) for (const width of [390, 1440]) {
    await size(width);
    await goto('/components/button/');
    await nav.getByRole('link', { name: 'Add-ons', exact: true }).click();
    await page.waitForURL(url('/addons/'));
    await page.getByRole('heading', { name: 'Add-ons', level: 1, exact: true }).waitFor();
    await assertDestinations(`Add-ons at ${width}px`);
    assert.equal(await nav.getByRole('link', { name: 'Add-ons', exact: true }).getAttribute('aria-current'), 'page');
    await page.locator('.component-card').getByRole('link', { name: 'Avatar', exact: true }).click();
    await page.waitForURL(url('/addons/avatar/'));
    await page.getByRole('heading', { name: 'Avatar', level: 1, exact: true }).waitFor();
    assert.equal(await nav.getByRole('link', { name: 'Add-ons', exact: true }).getAttribute('aria-current'), 'location');
    const current = page.locator('main m-drawer.site-drawer a[aria-current="page"][href="/addons/avatar/"]');
    await current.waitFor({ state: 'attached' });
    await page.goBack();
    await page.waitForURL(url('/addons/'));
    await page.getByRole('heading', { name: 'Add-ons', level: 1, exact: true }).waitFor();
    assert.equal(await page.locator('.component-card').count(), 7, 'Back restores the add-on overview cards');
    assert.equal(await nav.getByRole('link', { name: 'Add-ons', exact: true }).getAttribute('aria-current'), 'page');
    await page.locator('main m-drawer.site-drawer a[aria-current="page"][href="/addons/"]').waitFor({ state: 'attached' });
    await page.goBack();
    await page.waitForURL(url('/components/button/'));
    await page.getByRole('heading', { name: 'Button', level: 1, exact: true }).waitFor();
    assert.equal(await nav.getByRole('link', { name: 'Components', exact: true }).getAttribute('aria-current'), 'location');
    await page.locator('main m-drawer.site-drawer a[aria-current="page"][href="/components/button/"]').waitFor({ state: 'attached' });
    await page.goForward();
    await page.waitForURL(url('/addons/'));
    await page.getByRole('heading', { name: 'Add-ons', level: 1, exact: true }).waitFor();
    await page.goForward();
    await page.waitForURL(url('/addons/avatar/'));
    await page.getByRole('heading', { name: 'Avatar', level: 1, exact: true }).waitFor();
    await current.waitFor({ state: 'attached' });
    await page.getByRole('link', { name: 'Docs', exact: true }).and(page.locator('main a')).click();
    await page.waitForURL(url('/docs/addons/avatar/'));
    const menu = page.locator('#section-index');
    if (width === 390) await menu.locator('summary').click();
    const drawer = menu.getByRole('navigation', { name: 'Docs links', exact: true });
    const selected = drawer.locator('a[aria-current="page"][href="/docs/addons/avatar/"]');
    await selected.waitFor();
    const headings = await drawer.locator('[part~="section-label"]').allTextContents();
    assert.equal(headings.at(-2), 'Components');
    assert.equal(headings.at(-1), 'Add-ons');
  }
  for (const slug of ['colorpicker', 'form']) {
    const response = await page.request.get(url(`/docs/components/${slug}/?ref=legacy`), { maxRedirects: 0 });
    assert.equal(response.status(), 301);
    assert.equal(response.headers()['location'], `/docs/addons/${slug}/?ref=legacy`);
  }

  const railCaptures = resolve(output, 'drawer-pane');
  await mkdir(railCaptures, { recursive: true });
  const itemStyle = (item: Locator) => item.evaluate(node => {
    const style = getComputedStyle(node);
    const indicator = node.querySelector('.mtrl-drawer__active-indicator')!;
    const fill = getComputedStyle(indicator, '::before');
    const label = getComputedStyle(node.querySelector('.mtrl-drawer__item-label')!);
    return {
      height: node.getBoundingClientRect().height, padding: style.padding, radius: style.borderRadius,
      color: label.color, background: fill.backgroundColor, opacity: fill.opacity, border: style.borderInlineStartWidth,
      fontFamily: label.fontFamily, fontSize: label.fontSize, lineHeight: label.lineHeight,
      fontWeight: label.fontWeight, letterSpacing: label.letterSpacing,
    };
  });
  const activeFills = new Set<string>();
  for (const [theme, mode] of [['baseline', 'light'], ['spring', 'light'], ['ocean', 'dark']] as const) {
    const themed = await browser.newContext({ reducedMotion: 'reduce', colorScheme: mode, viewport: { width: 1440, height: 900 } });
    try {
      await themed.addInitScript(([name, appearance]) => {
        localStorage.setItem('md3-site-mode', appearance);
        localStorage.setItem('md3-preview-appearance', JSON.stringify({ theme: name, mode: appearance }));
      }, [theme, mode]);
      const themedPage = await themed.newPage();
      await themedPage.goto(url('/components/'));
      await themedPage.locator(`html[data-theme="${theme}"][data-theme-mode="${mode}"]`).waitFor();
      const selected = themedPage.locator('main .site-drawer:defined a[aria-current="page"]');
      await selected.waitFor({ state: 'visible' });
      const selectedStyle = await itemStyle(selected);
      assert.equal(selectedStyle.height, 36, 'section row uses the compact (dense) drawer');
      assert.equal(selectedStyle.opacity, '1', 'active indicator fills the pill');
      assert.equal(selectedStyle.border, '0px');
      activeFills.add(selectedStyle.background);
      const family = themedPage.locator('main .site-drawer button[aria-expanded]').first();
      const familyStyle = await itemStyle(family);
      for (const prop of ['height', 'padding', 'radius'] as const) assert.equal(familyStyle[prop], selectedStyle[prop], `family ${prop}`);

      const materialDrawer = themedPage.locator('.catalog-visual md3-catalog-drawer');
      await materialDrawer.scrollIntoViewIfNeeded();
      await themedPage.locator('.catalog-visual md3-catalog-drawer:defined').waitFor();
      await materialDrawer.evaluate(node => {
        node.setAttribute('dense', '');
      });
      const reference = materialDrawer.locator('.mtrl-drawer__item--active');
      await themedPage.waitForFunction(() => document.querySelector('.catalog-visual md3-catalog-drawer')?.shadowRoot
        ?.querySelector('.mtrl-drawer__item--active')?.getBoundingClientRect().height === 36);
      const { fontFamily, ...listStyle } = selectedStyle;
      const { fontFamily: materialFont, ...drawerStyle } = await itemStyle(reference);
      assert.match(fontFamily, /DIN Alternate/);
      assert.match(materialFont, /Roboto/);
      assert.deepEqual(drawerStyle, listStyle, `${theme} ${mode} matches the real drawer geometry, typescale and colours`);

      if (theme === 'spring') continue;
      for (const width of [700, 1440]) for (const [name, path] of [['component-button', '/components/button/'], ['docs-button', '/docs/components/button/']]) {
        await themedPage.setViewportSize({ width, height: 900 });
        await themedPage.goto(url(path!));
        await themedPage.evaluate(() => document.fonts.ready);
        const save = (kind: string) => themedPage.screenshot({ path: `${railCaptures}/${kind}-${name}-${width}-${theme}-${mode}.png`, animations: 'disabled' });
        const checkActiveRow = async () => {
          const active = themedPage.locator('.site-drawer a[aria-current="page"]');
          await active.scrollIntoViewIfNeeded();
          assert(await active.evaluate(node => {
            const host = (node.getRootNode() as ShadowRoot).host.getBoundingClientRect();
            const row = node.getBoundingClientRect();
            return row.left >= host.left && row.right <= host.right;
          }), `${name} at ${width}px: the active row fits inside the pane`);
        };
        if (width === 1440) await checkActiveRow();
        await save('page');
        if (width === 700) {
          await themedPage.getByRole('button', { name: 'Expand navigation', exact: true }).click();
          await themedPage.getByRole('dialog', { name: 'Navigation', exact: true }).waitFor();
          await checkActiveRow();
          await save('rail-open');
        }
      }
    } finally {
      await themed.close();
    }
  }
  assert.equal(activeFills.size, 3, 'selection follows Baseline, Spring, and Ocean dark');

  await size(390);
  await goto('/docs/theming/');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await skip.press('Enter');
  assert.equal(await focused(page.locator('#content')), true);
  await page.locator('.md a[href="#runtime-colour"]').click();
  const heading = page.locator('#runtime-colour');
  const target = (await heading.boundingBox())!;
  const compactBar = (await page.locator('#site-primary-bar').boundingBox())!;
  assert.ok(target.y >= (await page.locator('.header').boundingBox())!.height && target.y + target.height < compactBar.y,
    'fragment heading clears both fixed bars');

  await searchTrigger.click();
  const search = page.getByRole('dialog', { name: 'Search the site' });
  const searchField = search.getByRole('combobox', { name: showcasePublic ? `Search components, docs and ${showcaseLabel.toLowerCase()}` : 'Search components and docs', exact: true });
  if (showcasePublic) {
    await searchField.fill(examples[0]!.title);
    const exampleResult = search.locator(`a[href="${showcasePath}${examples[0]!.slug}/"]`);
    await exampleResult.waitFor();
    await exampleResult.click();
    await page.waitForURL(url(`${showcasePath}${examples[0]!.slug}/`));
  } else {
    await searchField.fill('Switch');
    await search.locator('a[href="/components/switch/"]').first().click();
    await page.waitForURL(url('/components/switch/'));
  }

  await goto('/styles/');
  const stylesPreview = page.locator('#styles-preview');
  const previewToggle = stylesPreview.getByRole('button', { name: 'Preview', exact: true });
  if (await previewToggle.getAttribute('aria-expanded') !== 'true') await previewToggle.click();
  await stylesPreview.locator('[data-frame="theme"] iframe').waitFor();
  for (const selector of ['#styles-preview-toggle', '#styles-export-open']) {
    const control = (await stylesPreview.locator(selector).boundingBox())!;
    assert.ok(control.y >= 0 && control.y + control.height < compactBar.y, 'Styles controls clear the bottom bar');
  }
  await capture('styles-preview-over-bar-390');
  const theme = page.locator('#theme-picker');
  await theme.click();
  const themeMenu = page.locator('m-menu[anchor="theme-picker"] [part="menu"]');
  await themeMenu.waitFor();
  await page.keyboard.press('Escape');
  await themeMenu.waitFor({ state: 'hidden' });
  await page.waitForFunction(() => document.activeElement?.id === 'theme-picker');

  const noScript = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await noScript.newPage();
  for (const width of [390, 700]) {
    await staticPage.setViewportSize({ width, height: 900 });
    await staticPage.goto(url('/'));
    const primary = staticPage.getByRole('navigation', { name: 'Primary navigation', exact: true });
    assert.equal(await primary.count(), 1);
    assert.deepEqual((await linkNames(primary)).map(name => name.trim()), destinations);
    await primary.getByRole('link', { name: 'Styles', exact: true }).click();
    await staticPage.waitForURL(url('/styles/'));
  }
  await staticPage.setViewportSize({ width: 1440, height: 900 });
  await staticPage.goto(url('/components/button/'));
  const staticDrawer = staticPage.getByRole('navigation', { name: 'Component list', exact: true });
  const staticLink = staticDrawer.getByRole('link', { name: 'Navigation rail', exact: true });
  await staticLink.click();
  await staticPage.waitForURL(url('/components/navigation-rail/'));
  await noScript.close();

  // Production pages carry a host-injected third-party script (Cloudflare Web Analytics).
  // Navigation must still swap only the content, keep the shell, and match a direct load's head.
  // Full motion: the blank-drawer bug only happened inside a view transition.
  const hosted = await browser.newContext({ reducedMotion: 'no-preference' });
  const beacon = 'https://static.cloudflareinsights.com/beacon.min.js/check';
  await hosted.route(beacon, route => route.fulfill({ contentType: 'text/javascript', body: '' }));
  await hosted.route(`${server.url}**`, async route => {
    const response = await route.fetch();
    if (!response.headers()['content-type']?.includes('text/html')) return route.fulfill({ response });
    const body = (await response.text()).replace('</body>', `<script type="module" src="${beacon}"></script></body>`);
    await route.fulfill({ response, body });
  });
  const hostedPage = await hosted.newPage();
  hostedPage.setDefaultTimeout(8000);
  await hostedPage.setViewportSize({ width: 1440, height: 900 });
  const head = () => hostedPage.evaluate(() => ({
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? null,
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
    ogUrl: document.querySelector('meta[property="og:url"]')?.getAttribute('content') ?? null,
    h1: document.querySelector('#content h1')?.textContent?.trim() ?? null,
  }));
  const hostedNav = hostedPage.getByRole('navigation', { name: 'Primary navigation', exact: true });
  const visits: { label: string; click: () => Promise<void>; path: string }[] = [
    ...[...destinations.filter(name => name !== 'Components'), 'Components'].map(name => ({
      label: `rail ${name}`,
      click: () => hostedNav.getByRole('link', { name, exact: true }).click(),
      path: name === showcaseLabel ? showcasePath : name === 'Docs' ? '/docs/' : name === 'Add-ons' ? '/addons/' : `/${name.toLowerCase()}/`,
    })),
    { label: 'component drawer Card', click: () => hostedPage.getByRole('navigation', { name: 'Component list', exact: true }).getByRole('link', { name: 'Card', exact: true }).click(), path: '/components/card/' },
  ];
  const directHead = async (path: string) => {
    const direct = await hosted.newPage();
    await direct.goto(url(path));
    const loaded = await direct.evaluate(() => ({
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? null,
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
      ogUrl: document.querySelector('meta[property="og:url"]')?.getAttribute('content') ?? null,
      h1: document.querySelector('#content h1')?.textContent?.trim() ?? null,
    }));
    await direct.close();
    return loaded;
  };
  await hostedPage.goto(url('/components/button/'));
  for (const visit of visits) {
    if (visit.label.startsWith('component drawer')) await hostedPage.goto(url('/components/button/'));
    const loaded = await directHead(visit.path);
    let documentLoads = 0;
    const counted = () => { documentLoads++; };
    hostedPage.on('load', counted);
    await hostedPage.evaluate(() => { (window as unknown as { __shell?: number }).__shell = 1; });
    await visit.click();
    // The URL commits before the swap; wait for the destination's own heading and title.
    await hostedPage.waitForFunction(({ h1, title }) => document.querySelector('#content h1')?.textContent?.trim() === h1 && document.title === title, { h1: loaded.h1, title: loaded.title });
    hostedPage.off('load', counted);
    const kept = await hostedPage.evaluate(() => (window as unknown as { __shell?: number }).__shell ?? null);
    assert.equal(documentLoads, 0, `${visit.label}: navigating with a host-injected analytics script loads a new document`);
    assert.equal(kept, 1, `${visit.label}: navigating with a host-injected analytics script reloads the whole page`);
    assert.equal(hostedPage.url(), url(visit.path), `${visit.label}: the address is the real path`);
    assert.deepEqual(await head(), loaded, `${visit.label}: the head after client navigation matches a direct load`);
  }
  // Crossing sections repeatedly must leave each section's drawer drawn (it once went
  // blank on Showcase after Components -> Showcase -> Components -> Showcase -> Docs -> Showcase).
  await hostedPage.goto(url('/components/button/'));
  const crossings: [string, string][] = showcasePublic
    ? [['Showcase', showcasePath], ['Components', '/components/'], ['Showcase', showcasePath], ['Docs', '/docs/'], [showcaseLabel, showcasePath], ['Styles', '/styles/'], [showcaseLabel, showcasePath]]
    : [['Styles', '/styles/'], ['Components', '/components/'], ['Styles', '/styles/'], ['Docs', '/docs/'], ['Styles', '/styles/'], ['Components', '/components/'], ['Docs', '/docs/']];
  if (addonsPublic) crossings.push(['Add-ons', '/addons/']);
  for (const [name, path] of crossings) {
    await hostedNav.getByRole('link', { name, exact: true }).click();
    await hostedPage.waitForFunction(target => location.pathname === target && document.querySelector('m-drawer.site-drawer')?.getAttribute('value') !== null, path);
    // Judge the settled page: the drawer could draw, then blank after the view transition.
    await hostedPage.waitForTimeout(1500);
    const drawn = await hostedPage.evaluate(() => {
      const drawer = document.querySelector('m-drawer.site-drawer');
      const links = drawer?.shadowRoot?.querySelectorAll('a[href]').length ?? 0;
      return !!drawer && drawer.checkVisibility() && drawer.getBoundingClientRect().height > 0 && links > 0;
    });
    assert.ok(drawn, `${name} drawer is drawn after a cross-section client navigation`);
  }
  // The wheel over a long drawer scrolls its section pane (a nested scroller inside the
  // drawer once swallowed the gesture and the pane never moved).
  for (const path of ['/components/button/', '/docs/components/button/']) {
    await hostedPage.goto(url(path));
    const drawer = hostedPage.locator('m-drawer.site-drawer');
    await drawer.waitFor();
    const box = (await drawer.boundingBox())!;
    const paneTop = () => drawer.evaluate(node => node.closest<HTMLElement>('.component-list, #sidebar')!.scrollTop);
    const start = await paneTop();
    await hostedPage.mouse.move(box.x + box.width / 2, 400);
    await hostedPage.mouse.wheel(0, 400);
    await hostedPage.waitForFunction(([selector, from]) => (document.querySelector(selector)?.closest<HTMLElement>('.component-list, #sidebar')?.scrollTop ?? 0) > from + 100, ['m-drawer.site-drawer', start] as const, { timeout: 3000 }).catch(() => {});
    assert.ok(await paneTop() > start + 100, `${path}: the wheel over the drawer scrolls the section pane`);
    const nested = await drawer.evaluate(node => [...node.shadowRoot!.querySelectorAll('*')].filter(element => element.scrollHeight > element.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(element).overflowY)).length);
    assert.equal(nested, 0, `${path}: no scroller inside the drawer competes with the pane`);
  }
  await hosted.unrouteAll({ behavior: 'ignoreErrors' });
  await hosted.close();
  console.log(`Site navigation checks passed at ${widths.join(', ')}px, with 599/600 and 839/840 transitions. Captures: ${output}`);
} finally {
  await browser.close();
  server.stop(true);
}
