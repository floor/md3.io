import assert from 'node:assert/strict';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, type Page } from 'playwright';
import { handleRequest } from '../server';
import * as panel from './panel-driver';

const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: handleRequest });
const browser = await chromium.launch();
const output = resolve(import.meta.dir, '../analysis/browser/client-navigation');
await mkdir(output, { recursive: true });
const href = (path: string) => new URL(path, server.url).href;
const paths = ['/components/button/', '/docs/frameworks/', '/showcase/', '/showcase/settings/', '/styles/color/', '/styles/shape/', '/styles/typography/', '/styles/themes/', '/styles/color-lab/', '/components/'];
// Compare the page's actual content; scripts, transient status and framework-generated
// app controls are tested separately below rather than included as prose.
async function mainText(page: Page) {
  return page.locator('#content').evaluate(main => {
    const clone = main.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('script, style, [role="status"], #playground-status, #styles-status, #example-status, #theme-app, #colour-lab, .device__bar, #generated-code').forEach(node => node.remove());
    return clone.textContent?.replace(/\s+/g, ' ').trim();
  });
}
async function settled(page: Page) {
  if (await page.locator('#preview').count()) await page.frameLocator('#preview').locator('#stage > *').first().waitFor();
  if (await page.locator('#example-frame').count()) await page.frameLocator('#example-frame').locator('body > *').first().waitFor();
  if (await page.locator('#theme-app').count()) await page.locator('#theme-app button').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
}
async function listenerCount(page: Page) {
  const session = await page.context().newCDPSession(page);
  const counts: number[] = [];
  for (const expression of ['window', 'document']) {
    const { result } = await session.send('Runtime.evaluate', { expression });
    const { listeners } = await session.send('DOMDebugger.getEventListeners', { objectId: result.objectId! });
    counts.push(listeners.length);
  }
  await session.detach();
  return counts;
}
try {
  // Both paths run the same navigation and widget assertions; removing the API before
  // modules load exercises Safari/older-browser click and popstate enhancement.
  for (const fallback of [false, true]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] });
    if (fallback) await context.addInitScript(() => Object.defineProperty(window, 'navigation', { value: undefined }));
    await context.addInitScript(() => {
      (window as any).visits = [];
      document.addEventListener('md3:navigated', event => (window as any).visits.push((event as CustomEvent).detail));
    });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(href('/components/button/'));
    await settled(page);
    await page.locator('m-drawer.site-drawer:defined').waitFor();
    const drawer = await page.locator('m-drawer.site-drawer').elementHandle();
    const header = await page.locator('header.header').elementHandle();
    const drawerInstance = await drawer!.evaluateHandle(node => (node as any).component);
    const go = async (path: string) => {
      const visits = await page.evaluate(() => (window as any).visits.length);
      await page.evaluate(path => {
        const link = document.createElement('a'); link.href = path; document.body.append(link); link.click(); link.remove();
      }, path);
      await page.waitForFunction(n => (window as any).visits.length === n + 1, visits);
      assert.equal(new URL(page.url()).pathname, new URL(path, server.url).pathname);
      assert.equal(await drawer!.evaluate(node => node === document.querySelector('m-drawer.site-drawer')), true, `${path}: drawer stays mounted`);
      assert.equal(await drawerInstance.evaluate(instance => instance === (document.querySelector('m-drawer.site-drawer') as any)?.component), true, `${path}: drawer component remains mounted`);
      assert.equal(await header!.evaluate(node => node === document.querySelector('header.header')), true, `${path}: header stays mounted`);
      await settled(page);
      const direct = await context.newPage();
      await direct.goto(href(path));
      await settled(direct);
      assert.equal(await page.title(), await direct.title(), `${path}: title`);
      assert.equal(await page.locator('h1').first().textContent(), await direct.locator('h1').first().textContent(), `${path}: h1`);
      for (const selector of ['meta[name="description"]', 'link[rel="canonical"]', 'meta[property="og:url"]']) {
        const attr = selector.startsWith('link') ? 'href' : 'content';
        assert.equal(await page.locator(selector).getAttribute(attr), await direct.locator(selector).getAttribute(attr), `${path}: ${selector}`);
      }
      assert.equal(await mainText(page), await mainText(direct), `${path}: direct and swapped main text`);
      assert.deepEqual(await page.locator('head script[type="application/ld+json"]').allTextContents(), await direct.locator('head script[type="application/ld+json"]').allTextContents());
      await direct.close();
      assert.equal(await page.evaluate(() => document.activeElement?.matches('h1, #content')), true, 'focus moves to content');
    };
    // Start with a real drawer click (including the selected-pill API and section state).
    await page.locator('m-drawer.site-drawer').getByRole('button', { name: 'Navigation', exact: true }).click();
    const visits = await page.evaluate(() => (window as any).visits.length);
    await page.locator('m-drawer.site-drawer').getByRole('link', { name: 'Icon button', exact: true }).click();
    await page.waitForFunction(n => (window as any).visits.length === n + 1, visits);
    assert.equal(await drawer!.evaluate(node => node === document.querySelector('m-drawer.site-drawer')), true);
    await page.locator('m-drawer.site-drawer').getByRole('link', { name: 'Icon button', exact: true }).getAttribute('aria-current').then(value => assert.equal(value, 'page'));
    assert.equal(await drawer!.evaluate(node => (node as any).isSectionExpanded('navigation')), true, 'other drawer sections remain open');
    await go('/components/button/');
    await panel.choose(page, 'variant', 'outlined');
    await page.waitForFunction(() => document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelector('.mtrl-button--outlined'));
    await page.getByRole('tab', { name: 'View code', exact: true }).click();
    await page.getByRole('button', { name: 'Copy code', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Code copied' }).waitFor();
    assert.match(await page.evaluate(() => navigator.clipboard.readText()), /outlined/);
    for (const path of paths.slice(1)) {
      await go(path);
      if (path === '/docs/frameworks/') {
        await page.locator('.docs-frameworks m-chip[value="react"]').click();
        await page.waitForFunction(() => document.documentElement.dataset.framework === 'react');
      }
      if (path === '/showcase/settings/') {
        await page.locator('m-chip[value="html"]').click();
        await page.waitForFunction(() => document.querySelector<HTMLIFrameElement>('#example-frame')?.src.includes('/frame/html/'));
      }
      if (path === '/styles/typography/') {
        await page.locator('#type-sample').fill('Navigation remains interactive');
        assert.equal(await page.locator('.type-sample').first().textContent(), 'Navigation remains interactive');
      }
    }
    await go('/docs/frameworks/');
    await page.evaluate(() => scrollTo(0, 500));
    const scroll = await page.evaluate(() => scrollY);
    await go('/styles/color/');
    await page.goBack();
    await page.waitForFunction(() => location.pathname === '/docs/frameworks/' && document.querySelector('.docs-frameworks'));
    await page.waitForFunction(y => Math.abs(scrollY - y) < 2, scroll);
    await page.goForward();
    await page.waitForFunction(() => location.pathname === '/styles/color/' && document.querySelector('#color-tokens'));
    // An anchor on a new page scrolls after its content exists.
    await go('/docs/frameworks/#react-events');
    await page.waitForFunction(() => (document.getElementById('react-events')?.getBoundingClientRect().top ?? Infinity) < 200);
    await go('/components/button/');
    const listenersBefore = await listenerCount(page);
    for (let i = 0; i < 10; i++) await go(i % 2 ? '/components/button/' : '/docs/frameworks/');
    assert.deepEqual(await listenerCount(page), listenersBefore, 'window/document listeners do not accumulate across ten visits');
    const counters = await page.evaluate(() => (window as any).visits.at(-1).initializations);
    assert.equal(counters['site-content'], await page.evaluate(() => (window as any).visits.length + 1), 'one site init per navigation');
    assert.equal(counters.playground, counters['playground-material'], 'panel and preview each initialize once');
    // Modifier clicks remain browser-owned and never produce a swap in this document.
    const beforeModifier = await page.evaluate(() => (window as any).visits.length);
    const popup = context.waitForEvent('page');
    await page.locator('#site-primary-rail a[href="/docs/"]').click({ modifiers: ['ControlOrMeta'] });
    const opened = await popup; await opened.waitForLoadState(); await opened.close();
    assert.equal(await page.evaluate(() => (window as any).visits.length), beforeModifier);
    assert.deepEqual(errors, [], `${fallback ? 'fallback' : 'Navigation API'} console errors`);
    await context.close();
  }
  // Browser-owned exits: fetch failures, unsuitable responses, differing shells,
  // explicit full loads and timeout all replace the document instead of leaving a
  // half-initialized route. Exercise both interception implementations.
  for (const fallback of [false, true]) {
    const exits = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    if (fallback) await exits.addInitScript(() => Object.defineProperty(window, 'navigation', { value: undefined }));
    const exit = await exits.newPage();
    for (const kind of ['non-html', 'error', 'timeout', 'full-load', 'shell']) {
      await exit.goto(href('/components/button/'));
      await settled(exit);
      await exit.evaluate(() => { (window as any).documentToken = 'same document'; });
      const path = kind === 'shell' ? '/preview/button/' : `/docs/?navigation-fixture=${kind}`;
      let fetches = 0;
      await exit.route(href(path), async route => {
        if (route.request().resourceType() !== 'fetch') { await route.continue(); return; }
        ++fetches;
        if (kind === 'error') { await route.abort('failed'); return; }
        if (kind === 'timeout') { await new Promise(resolve => setTimeout(resolve, 3400)); await route.fulfill({ body: 'late', contentType: 'text/plain' }).catch(() => {}); return; }
        if (kind === 'non-html') { await route.fulfill({ body: 'Not HTML', contentType: 'text/plain' }); return; }
        await route.continue();
      });
      await exit.evaluate(({ path, kind }) => {
        const link = document.createElement('a'); link.href = path;
        if (kind === 'full-load') link.dataset.fullLoad = '';
        document.body.append(link); link.click();
      }, { path, kind });
      await exit.waitForFunction(() => !(window as any).documentToken);
      assert.equal(new URL(exit.url()).pathname, new URL(path, server.url).pathname, `${kind}: full-load destination`);
      assert.equal(fetches, kind === 'full-load' ? 0 : 1, `${kind}: expected fetch path`);
      await exit.unrouteAll({ behavior: 'wait' });
    }
    await exits.close();
  }
  const nojs = await browser.newContext({ javaScriptEnabled: false });
  const plain = await nojs.newPage();
  for (const path of paths.slice(0, 5)) {
    await plain.goto(href(path));
    assert.ok(await plain.locator('#content h1').textContent(), `${path}: complete server page with JS off`);
    await plain.locator('#site-primary-rail a[href="/docs/"]').click();
    assert.equal(new URL(plain.url()).pathname, '/docs/');
  }
  await nojs.close();
  // Capture with motion enabled: before, immediately after click, and settled.
  const captureContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: output }, reducedMotion: 'no-preference' });
  const capture = await captureContext.newPage();
  await capture.goto(href('/components/button/')); await settled(capture);
  await capture.screenshot({ path: resolve(output, '01-before.png') });
  await capture.locator('m-drawer.site-drawer').getByRole('link', { name: 'Icon button', exact: true }).click();
  await capture.screenshot({ path: resolve(output, '02-click.png') });
  await capture.waitForFunction(() => location.pathname === '/components/icon-button/' && document.querySelector('h1')?.textContent === 'Icon button');
  await settled(capture);
  await capture.screenshot({ path: resolve(output, '03-swapped.png') });
  const video = capture.video()!; await captureContext.close();
  await video.saveAs(resolve(output, 'drawer-navigation.webm'));
  const bytes = (await stat(resolve(import.meta.dir, '../dist/site.js'))).size;
  await writeFile(resolve(output, 'result.txt'), `site.js entry bytes: ${bytes}\n`);
  console.log('Client navigation browser checks passed (Navigation API, click fallback, history, widgets, SSR, JS off, listeners, modifier clicks).');
} finally { await browser.close(); server.stop(true); }
