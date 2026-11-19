import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, type Locator } from 'playwright';
import { handleRequest } from '../server';
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
const widths = [360, 390, 412, 700, 1024, 1440];
const linkNames = (nav: Locator) => nav.getByRole('link').allTextContents();
const focused = (locator: Locator) => locator.evaluate(node => document.activeElement === node);

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
    await size(width);
    await goto('/components/button/');
    await assertDestinations(`${width}px`);
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
      await showRail();
      await assertDestinations(`modal rail at ${width}px`);
      assert.equal(await rail.getAttribute('inert'), '');
      const last = modal.getByRole('link', { name: 'Documentation', exact: true });
      await page.keyboard.press('Shift+Tab');
      assert.equal(await focused(last), true);
      await page.keyboard.press('Tab');
      assert.equal(await focused(close), true);
      await capture(`rail-open-${width}`);
      await page.keyboard.press('Escape');
      await assertClosedRail();

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
      await page.locator('summary').filter({ hasText: /^Browse components$/ }).click();
      await page.locator('#sidebar').getByRole('link', { name: 'Icon button', exact: true }).click();
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
  const [newPage] = await Promise.all([
    context.waitForEvent('page'),
    nav.getByRole('link', { name: 'Documentation', exact: true }).click({ modifiers: ['ControlOrMeta'] }),
  ]);
  await newPage.waitForURL(url('/docs/'));
  await newPage.close();

  const sections = [
    { label: 'Documentation', path: '/docs/frameworks/', hrefs: ['/docs/', ...[guideGroup, ...docGroups].flatMap(group => group.items.map(item => item.href))] },
    { label: 'Styles', path: '/styles/shape/', hrefs: stylePages.map(style => style.href) },
    { label: showcaseLabel, path: `${showcasePath}${examples[0]!.slug}/`, hrefs: [showcasePath, ...examples.map(example => `${showcasePath}${example.slug}/`)] },
  ];
  for (const { label, path, hrefs } of sections) for (const width of [...widths, 839, 840]) {
    await size(width);
    await goto(path);
    const index = page.locator('#section-index');
    const indexLinks = page.getByRole('navigation', { name: `${label} links`, exact: true });
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
    assert.deepEqual(await indexLinks.locator('.sidebar__link').evaluateAll(links => links.map(link => link.getAttribute('href'))), hrefs);
    assert.equal(await indexLinks.locator('[aria-current="page"]').getAttribute('href'), path);
    assert.ok(width < 840 ? geometry.y + geometry.height <= content.y + 1 : geometry.x + geometry.width <= content.x + 1,
      `${label} index uses the right placement at ${width}px`);
    if (width === 839 || width === 840) await capture(`index-${label.toLowerCase()}-${width}`);
  }

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
  await noScript.close();
  console.log(`Site navigation checks passed at ${widths.join(', ')}px, with 599/600 and 839/840 transitions. Captures: ${output}`);
} finally {
  await browser.close();
  server.stop(true);
}
