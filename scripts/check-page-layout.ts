import assert from 'node:assert/strict';
import { addonsPublic, showcasePublic } from '../src/shared/visibility';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Browser, Frame, Locator, Page } from 'playwright';
import { examples } from '../examples';
import { stylePages } from '../src/server/styles';
import { checkTargets as checkTargetAreas } from './check-input-targets';

const viewports = [
  { width: 360, height: 640 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 700, height: 900 },
  { width: 1024, height: 900 },
  { width: 1440, height: 900 },
];

const fixedRoutes = [
  ['home', '/'],
  ['component-overview', '/components/'],
  ['component-detail', '/components/button/', '#preview'],
  ['documentation', '/docs/'],
  ['guide', '/docs/frameworks/'],
  ['api-reference', '/docs/components/button/'],
  ['privacy', '/privacy/'],
  ['not-found', '/layout-check-missing-page/'],
] as const;

type RouteCase = {
  name: string;
  path: string;
  frame?: string;
  runFrame?: (frame: Frame) => Promise<void>;
};

type Box = { x: number; y: number; width: number; height: number };
type Geometry = Awaited<ReturnType<typeof geometry>>;

async function geometry(page: Page) {
  return page.evaluate(() => {
    const box = (node: Element | null) => {
      if (!node?.getClientRects().length) return null;
      const { x, y, width, height } = node.getBoundingClientRect();
      return { x: x + scrollX, y: y + scrollY, width, height };
    };
    return {
      header: box(document.querySelector('.header')),
      main: box(document.querySelector('main')),
      heading: box(document.querySelector('main h1')),
      frames: [...document.querySelectorAll('main iframe[title]')].map(frame => ({
        key: frame.id || frame.getAttribute('src') || frame.getAttribute('data-src'),
        title: frame.getAttribute('title'), box: box(frame), autosize: frame.hasAttribute('data-autosize'),
        toolbarHeight: box(frame.closest('.device')?.querySelector('.device__bar') ?? null)?.height ?? 0,
      })),
    };
  });
}

function stableBox(before: Box | null, after: Box | null, keys: (keyof Box)[], tolerance: number, label: string) {
  assert(before && after, `${label} must have geometry before and after upgrades`);
  const movement = keys.filter(key => Math.abs(before[key] - after[key]) > tolerance);
  assert.deepEqual(movement, [], `${label} moved: ${JSON.stringify({ before, after })}`);
}

async function checkChrome(page: Page, destinations: string[], width: number, label: string) {
  // The media-query handler updates the inactive landmark on its next frame.
  await page.locator(width < 600 ? '#site-primary-bar' : '#site-primary-rail').waitFor();
  const dimensions = await page.evaluate(() => ({ viewport: innerWidth, root: document.documentElement.scrollWidth }));
  assert.equal(dimensions.viewport, width, `${label}: CSS viewport width`);
  assert(dimensions.root <= dimensions.viewport, `${label}: document is ${dimensions.root}px in a ${dimensions.viewport}px viewport`);
  const nav = page.getByRole('navigation', { name: 'Primary navigation', exact: true });
  assert.equal(await nav.count(), 1, `${label}: one primary navigation landmark`);
  assert.deepEqual(await nav.getByRole('link').evaluateAll(nodes => nodes.map(node => node.getAttribute('href'))), destinations, label);
  return nav;
}

async function checkTargets(page: Page, label: string) {
  const selector = [
    'button', 'summary', 'select', 'textarea', 'input:not([type="hidden"])',
    '.header__logo', '.site-nav-link', '.mtrl-drawer__item', '.doc-toc a', '.site-footer__links a',
    '.component-card h3 a', 'a.styles-card', 'a.doc-card', 'a.example-card', 'a.btn', '.page-nav__link', '.not-found > a',
    '.page-heading__top a', '.doc-toolbar a', '.catalog-note a', '.lab-api-link', '.lab-upload', '.search-dialog__result',
    '[part~="container"].mtrl-slider__container',
  ].join(', ');
  await checkTargetAreas(page.locator(selector), label, true);
}

async function checkFooter(page: Page, label: string) {
  const footer = page.locator('.site-footer');
  await footer.getByRole('link', { name: 'Source on GitHub' }).focus();
  await page.keyboard.press('Tab');
  const privacy = footer.getByRole('link', { name: 'Privacy', exact: true });
  assert(await privacy.evaluate(node => document.activeElement === node && node.matches(':focus-visible')), `${label}: the final site link receives visible keyboard focus`);
  assert(await privacy.evaluate(node => {
    const rect = node.getBoundingClientRect();
    const bar = document.getElementById('site-primary-bar')!;
    const bottom = bar.getClientRects().length ? bar.getBoundingClientRect().top : innerHeight;
    return rect.top >= 0 && rect.bottom <= bottom + 1 && node.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
  }), `${label}: the focused footer link clears sticky UI`);
}

async function loadedFrame(target: Locator) {
  const handle = await target.elementHandle();
  const frame = await handle?.contentFrame();
  assert(frame, 'The visible iframe has a loaded document');
  assert(await target.getAttribute('title'), 'The iframe has an accessible title');
  return frame;
}

async function checkRouteFrame(page: Page, entry: RouteCase) {
  if (entry.frame) {
    const target = page.locator(entry.frame);
    await target.waitFor();
    const frame = await loadedFrame(target);
    if (entry.frame === '#example-frame') {
      await frame.locator('#app > *').first().waitFor();
      await entry.runFrame?.(frame);
      assert(await frame.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${entry.path}: the embedded app fits its frame`);
    } else {
      const button = frame.getByRole('button', { name: 'Button', exact: true });
      await button.click();
      await page.getByRole('status').filter({ hasText: 'Button clicked' }).waitFor();
      await page.evaluate(() => scrollTo(0, 0));
    }
  }
  const preview = page.locator('#styles-preview');
  if (await preview.count()) {
    const toggle = preview.getByRole('button', { name: 'Preview', exact: true });
    const closed = await toggle.isVisible() && await toggle.getAttribute('aria-expanded') === 'false';
    if (closed) await toggle.click();
    const frame = await loadedFrame(preview.locator('iframe[data-theme-frame="theme"]'));
    const search = frame.getByRole('button', { name: 'Search', exact: true });
    await search.waitFor();
    if (closed) await toggle.click();
  }
}

async function checkOverlays(page: Page, captures: string, width: number) {
  const capture = (name: string) => page.screenshot({ path: `${captures}/${name}-${width}.png`, animations: 'disabled' });
  const search = page.locator('#search-trigger');
  await search.tap();
  const dialog = page.getByRole('dialog', { name: 'Search the site' });
  const input = dialog.getByRole('combobox');
  await input.fill('dialog');
  await dialog.getByRole('option').first().waitFor();
  await checkTargets(page, `${width}px search open`);
  const height = page.viewportSize()!.height;
  await page.setViewportSize({ width, height: 280 });
  await page.waitForFunction(() => {
    const panel = document.querySelector('.search-dialog')!.getBoundingClientRect();
    const viewport = window.visualViewport;
    const results = document.getElementById('search-results')!;
    return panel.bottom <= (viewport?.offsetTop ?? 0) + (viewport?.height ?? innerHeight) + 1 &&
      results.scrollHeight > results.clientHeight && results.clientHeight >= 48;
  });
  await input.press('ArrowDown');
  await capture('focused-search-short');
  await page.setViewportSize({ width, height });
  await input.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  await page.locator('#search-trigger:focus-visible').waitFor();
  if (width >= 600 && width < 840) {
    const open = page.locator('#site-nav-open');
    await open.press('Enter');
    const rail = page.getByRole('dialog', { name: 'Navigation', exact: true });
    await rail.waitFor();
    assert.match(await rail.ariaSnapshot(), /button "Close navigation"[\s\S]*navigation "Primary navigation"[\s\S]*link "Documentation"/);
    await checkTargets(page, `${width}px rail open`);
    await capture('open-rail');
    await page.keyboard.press('Escape');
    await rail.waitFor({ state: 'hidden' });
    await page.locator('#site-nav-open:focus-visible').waitFor();
  }
}

export async function checkPageLayout(browser: Browser, base: string, output: string) {
  const captures = resolve(output, 'page-layout');
  await mkdir(captures, { recursive: true });
  const url = (path: string) => new URL(path, base).href;
  const showcase = '/showcase/';
  const routes: RouteCase[] = [
    ...fixedRoutes.map(([name, path, frame]) => ({ name, path, frame })),
    { name: 'showcase-overview', path: showcase },
    ...await Promise.all(examples.map(async ({ slug }) => ({
      name: `showcase-${slug}`,
      path: `${showcase}${slug}/`,
      frame: '#example-frame',
      runFrame: (await import(`../examples/${slug}/check.ts`)).checkFrame as RouteCase['runFrame'],
    }))),
    ...stylePages.map(({ href }) => ({ name: href.replace(/^\/|\/$/g, '').replaceAll('/', '-'), path: href })),
  ];
  // Hidden sections (src/shared/visibility.ts) have no navigation entry.
  const destinations = ['/components/', ...(addonsPublic ? ['/addons/'] : []), '/styles/', ...(showcasePublic ? [showcase] : []), '/docs/'];
  const measurements: { viewport: typeof viewports[number]; path: string; cold: Geometry; settled: Geometry; delayed: { fonts: number; scripts: number } }[] = [];
  const context = await browser.newContext({ hasTouch: true, reducedMotion: 'reduce', deviceScaleFactor: 1 });
  try {
    for (const [index, viewport] of viewports.entries()) {
      console.log(`Checking ${routes.length} page routes at ${viewport.width} × ${viewport.height}px`);
      for (const entry of routes) {
        const label = `${viewport.width}px ${entry.path}`;
        const page = await context.newPage();
        await page.setViewportSize(viewport);
        page.setDefaultTimeout(12000);
        const errors: string[] = [];
        page.on('pageerror', error => errors.push(error.message));
        const pending = Promise.withResolvers<void>();
        const delayed = { fonts: 0, scripts: 0 };
        await page.route('**/*', async route => {
          const request = route.request();
          const type = request.resourceType();
          if (type === 'font' || (type === 'script' && request.url().startsWith(base))) {
            delayed[type === 'font' ? 'fonts' : 'scripts']++;
            await pending.promise;
          }
          await route.continue();
        });
        try {
          const response = await page.goto(url(entry.path), { waitUntil: 'commit' });
          assert.equal(response?.status(), entry.name === 'not-found' ? 404 : 200, label);
          const heading = page.getByRole('heading', { level: 1 });
          await heading.waitFor();
          assert(await heading.textContent(), `${label}: main heading has a name`);
          assert.equal(await page.getByRole('main').getByRole('heading', { level: 1 }).count(), 1, label);
          if (entry.frame) await page.locator(entry.frame).waitFor();
          await page.waitForFunction(() => document.fonts.status === 'loading');
          const cold = await geometry(page);
          assert(delayed.fonts > 0 && delayed.scripts > 0, `${label}: must sample with fonts and modules still held`);
          pending.resolve();

          await page.waitForLoadState('load');
          await page.evaluate(() => document.fonts.ready);
          if (entry.frame) {
            const frame = await loadedFrame(page.locator(entry.frame));
            await frame.waitForLoadState('load');
            await frame.evaluate(() => document.fonts.ready);
          }
          if (entry.frame === '#example-frame') {
            const deviceButton = page.locator('.device__bar button').first();
            await deviceButton.waitFor({ state: 'attached' });
            if (viewport.width >= 600) await deviceButton.waitFor();
          }
          const settled = await geometry(page);
          stableBox(cold.header, settled.header, ['x', 'y', 'width', 'height'], 1, `${label} header`);
          stableBox(cold.main, settled.main, ['x', 'y', 'width'], 1, `${label} main`);
          // The centered Privacy article can change width when its font loads.
          const headingPosition = (heading: Box | null) => entry.name === 'privacy' && heading
            ? { ...heading, x: heading.x + heading.width / 2 }
            : heading;
          stableBox(headingPosition(cold.heading), headingPosition(settled.heading), ['x', 'y'], 8, `${label} heading`);
          assert.deepEqual(cold.frames.map(frame => frame.key), settled.frames.map(frame => frame.key), `${label}: frame identity`);
          for (const [index, frame] of cold.frames.entries()) {
            const final = settled.frames[index]!;
            if (frame.box || final.box) {
              // On a phone the script holds the Mobile frame, so the iframe box
              // changes once the module runs. Horizontal overflow is still rejected.
              if (viewport.width < 600 && entry.frame === '#example-frame') continue;
              // The Showcase toolbar accounts for the frame's vertical move.
              // The Shape gallery below the fold negotiates its own height.
              const expected = frame.box && { ...frame.box, y: frame.box.y + final.toolbarHeight - frame.toolbarHeight };
              const keys: (keyof Box)[] = frame.autosize ? ['x', 'width'] : ['x', 'y', 'width', 'height'];
              stableBox(expected, final.box, keys, 8, `${label} ${frame.title}`);
            }
          }
          measurements.push({ viewport, path: entry.path, cold, settled, delayed });

          const nav = await checkChrome(page, destinations, viewport.width, label);
          await checkTargets(page, label);
          await page.screenshot({ path: `${captures}/${entry.name}-${viewport.width}-initial.png`, animations: 'disabled' });
          await page.screenshot({ path: `${captures}/${entry.name}-${viewport.width}-full.png`, animations: 'disabled', fullPage: true });
          await checkRouteFrame(page, entry);
          if (entry.name === 'home') await checkOverlays(page, captures, viewport.width);
          if (entry.name === 'component-detail') {
            const field = page.getByRole('textbox', { name: 'Text', exact: true });
            await field.fill('Phone and resize');
            await page.frameLocator('#preview').getByRole('button', { name: 'Phone and resize', exact: true }).waitFor();
            await page.screenshot({ path: `${captures}/configured-playground-${viewport.width}.png`, animations: 'disabled' });
          }
          await checkFooter(page, label);
          const resized = viewports[(index + 1) % viewports.length]!;
          await page.setViewportSize(resized);
          await checkChrome(page, destinations, resized.width, `${label} resized to ${resized.width}px`);
          if (entry.name === 'component-detail') {
            assert.equal(await page.getByRole('textbox', { name: 'Text', exact: true }).inputValue(), 'Phone and resize', label);
          }
          const destination = nav.getByRole('link', { name: 'Docs', exact: true });
          await destination.click();
          await page.waitForURL(url('/docs/'));
          assert.deepEqual(errors, [], label);
        } finally {
          pending.resolve();
          await page.close();
        }
      }
    }
    await writeFile(`${captures}/geometry.json`, JSON.stringify(measurements, null, 2) + '\n');
  } finally {
    await context.close();
  }
  console.log(`Page layout checks passed: ${measurements.length} cold loads and resizes across ${viewports.length} widths (${showcase}).`);
}
