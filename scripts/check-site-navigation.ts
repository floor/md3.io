import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, type Locator } from 'playwright';
import { handleRequest } from '../server';
import { componentDirectory } from '../src/server/component-directory';
import { docGroups, guideGroup } from '../src/server/content';
import { examples } from '../src/server/examples';
import { stylePages } from '../src/server/styles';

const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: handleRequest });
const browser = await chromium.launch();
const output = resolve(import.meta.dir, '../analysis/browser/site-navigation');
await mkdir(output, { recursive: true });
const url = (path: string) => new URL(path, server.url).href;
const showcaseLabel = 'Showcase';
const showcasePath = '/showcase/';
const destinations = ['Components', 'Styles', showcaseLabel, 'Documentation'];
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
      await directory.getByRole('button', { name: 'Buttons', exact: true }).click();
      await directory.getByRole('link', { name: 'Icon button', exact: true }).click();
      await page.waitForURL(url('/components/icon-button/'));
    }
  }

  await size(700);
  await goto('/styles/');
  assert.equal(await nav.getByRole('link', { name: 'Styles', exact: true }).getAttribute('aria-current'), 'page');
  await showRail();
  await modal.getByRole('link', { name: 'Documentation', exact: true }).focus();
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
    nav.getByRole('link', { name: 'Documentation', exact: true }).click({ modifiers: ['ControlOrMeta'] }),
  ]);
  await newPage.waitForURL(url('/docs/'));
  await newPage.close();

  const docsEntries = componentDirectory(docGroups.flatMap(group => group.items)).entries;
  const docsLinks = docsEntries.flatMap(entry => 'items' in entry ? entry.items : [entry]);
  const sections = [
    { label: 'Documentation', path: '/docs/frameworks/', hrefs: ['/docs/', ...guideGroup.items.map(item => item.href), '/components/', ...docsLinks.map(item => item.href)] },
    { label: 'Styles', path: '/styles/shape/', hrefs: stylePages.map(style => style.href) },
    { label: showcaseLabel, path: `${showcasePath}${examples[0]!.slug}/`, hrefs: [showcasePath, ...examples.map(example => `${showcasePath}${example.slug}/`)] },
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
      assert.equal(selectedStyle.height, 48, 'section row matches the live sidebar density');
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
        node.removeAttribute('dense');
        node.style.setProperty('--mtrl-density', '-2');
      });
      const reference = materialDrawer.locator('.mtrl-drawer__item--active');
      await themedPage.waitForFunction(() => document.querySelector('.catalog-visual md3-catalog-drawer')?.shadowRoot
        ?.querySelector('.mtrl-drawer__item--active')?.getBoundingClientRect().height === 48);
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
  const searchField = search.getByRole('combobox', { name: `Search components, docs and ${showcaseLabel.toLowerCase()}`, exact: true });
  await searchField.fill(examples[0]!.title);
  const exampleResult = search.locator(`a[href="${showcasePath}${examples[0]!.slug}/"]`);
  await exampleResult.waitFor();
  await exampleResult.click();
  await page.waitForURL(url(`${showcasePath}${examples[0]!.slug}/`));

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
    await primary.getByRole('link', { name: showcaseLabel, exact: true }).click();
    await staticPage.waitForURL(url(showcasePath));
  }
  await staticPage.setViewportSize({ width: 1440, height: 900 });
  await staticPage.goto(url('/components/button/'));
  const staticDrawer = staticPage.getByRole('navigation', { name: 'Component list', exact: true });
  const staticLink = staticDrawer.getByRole('link', { name: 'Navigation rail', exact: true });
  await staticLink.click();
  await staticPage.waitForURL(url('/components/navigation-rail/'));
  await noScript.close();
  console.log(`Site navigation checks passed at ${widths.join(', ')}px, with 599/600 and 839/840 transitions. Captures: ${output}`);
} finally {
  await browser.close();
  server.stop(true);
}
