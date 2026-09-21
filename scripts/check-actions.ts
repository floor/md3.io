import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { handleRequest } from '../server';
import { components, componentSlugs } from '../src/shared/components';

const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: handleRequest });
const output = resolve(import.meta.dir, '../analysis/browser');
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark', permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  const frame = page.frameLocator('#preview');
  const checkbox = (name: string) => page.locator(`label:has(input[type="checkbox"][name="${name}"])`);
  const choose = async (name: string, value: string) => {
    const select = page.locator(`select[name="${name}"]`);
    if (await select.count()) await select.selectOption(value);
    else await page.locator(`label.choice:has(input[name="${name}"][value="${value}"])`).click();
  };
  for (const slug of componentSlugs.filter(value => value !== 'button' && components[value].group === 'Actions')) {
    await page.goto(`${server.url}components/${slug}/`);
    const root = frame.locator(`#stage > .mtrl-${slug}`);
    await root.waitFor();
    console.log(`Checking ${slug}`);
    for (const viewport of [{ width: 1440, height: 900 }, { width: 1366, height: 768 }, { width: 1280, height: 640 }]) {
      await page.setViewportSize(viewport);
      const geometry = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight, panels: [...document.querySelectorAll('.component-page, .playground, .configuration, .configuration-body, .preview-panel')].map(e => ({ name: e.className, y: e.getBoundingClientRect().y, height: e.getBoundingClientRect().height })) }));
      assert(geometry.scrollHeight <= geometry.height && geometry.scrollWidth <= geometry.width, `${slug}: desktop playground overflows at ${viewport.width}×${viewport.height}: ${JSON.stringify(geometry)}`);
      const panel = await page.locator('.configuration').boundingBox();
      assert(panel && panel.y + panel.height <= viewport.height, `${slug}: configuration extends below viewport`);
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ animations: 'disabled', path: `${output}/${slug}-desktop.png`, fullPage: true });
    for (const key of ['variant', 'size']) {
      const control = components[slug].controls.find(value => value.key === key)!;
      for (const value of control.options!) {
        await choose(key, value);
        await page.waitForFunction(({ slug, key, value }) => {
          const element = document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelector('#stage > *');
          return element?.classList.contains(`mtrl-${slug}--${value}`) || element?.getAttribute(`data-${key}`) === value || (slug === 'fab' && key === 'size' && value === 'default' && !element?.className.match(/--(?:small|medium|large)/));
        }, { slug, key, value });
      }
    }
    await checkbox('disabled').click();
    await page.waitForFunction(() => {
      const buttons = document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelectorAll<HTMLButtonElement>('#stage button');
      return buttons?.length && [...buttons].every(button => button.disabled);
    });
    await page.getByRole('tab', { name: 'View code', exact: true }).click();
    await page.getByRole('button', { name: 'Copy code', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Code copied' }).waitFor();
    const source = await page.evaluate(() => navigator.clipboard.readText());
    assert(source.includes(components[slug].factory) && source.includes('disabled: true'), `${slug}: copied code does not reflect controls`);
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Configuration reset' }).waitFor();
    await page.getByRole('tab', { name: 'Live preview' }).click();
    await root.waitFor();

    if (slug === 'icon-button') {
      await checkbox('toggle').click();
      await frame.locator('button[aria-pressed]').waitFor();
      await frame.getByRole('button', { name: 'Add to favorites' }).click();
      await page.waitForFunction(() => document.querySelector<HTMLInputElement>('input[name="selected"]')?.checked);
      assert(await page.locator('input[name="selected"]').isChecked(), 'Icon selection did not synchronize');
      await page.getByRole('tab', { name: 'View code', exact: true }).click();
      assert((await page.locator('#generated-code').textContent())?.includes('selected: true'), 'Code lost icon toggle state');
      await page.getByRole('tab', { name: 'Live preview' }).click();
      assert(await frame.getByRole('button').getAttribute('aria-pressed') === 'true', 'Icon selection lost on view switch');
    } else if (slug === 'button-group') {
      await choose('kind', 'connected');
      await choose('selection', 'single');
      await frame.locator('[data-kind="connected"][data-selection="single"]').waitFor();
      await frame.getByRole('button', { name: 'Bold', exact: true }).click();
      assert(await frame.getByRole('button', { name: 'Bold', exact: true }).getAttribute('aria-pressed') === 'true', 'Single selection did not select Bold');
      await frame.getByRole('button', { name: 'Italic', exact: true }).click();
      assert(await frame.getByRole('button', { name: 'Bold', exact: true }).getAttribute('aria-pressed') === 'false', 'Single selection did not clear Bold');
      await choose('selection', 'multi');
      await frame.locator('[data-selection="multi"]').waitFor();
      await frame.getByRole('button', { name: 'Bold', exact: true }).click();
      await frame.getByRole('button', { name: 'Italic', exact: true }).click();
      assert(await frame.locator('button[aria-pressed="true"]').count() === 2, 'Multi-selection failed');
      await choose('orientation', 'vertical');
      await page.waitForFunction(() => document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelector('.mtrl-button-group')?.getAttribute('data-orientation') === 'vertical');
      await choose('content', 'icons');
      assert(await frame.getByRole('button', { name: 'Bold', exact: true }).count() === 1, 'Icon-only group lost accessible name');
    } else if (slug === 'split-button') {
      await frame.getByRole('button', { name: 'More save options' }).click();
      await frame.getByRole('menuitem', { name: 'Save a copy' }).waitFor();
      await page.screenshot({ animations: 'disabled', path: `${output}/split-button-menu.png`, fullPage: true });
      await frame.getByRole('menuitem', { name: 'Save a copy' }).click();
      await page.waitForFunction(() => document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelector('[aria-haspopup="menu"]')?.getAttribute('aria-expanded') === 'false');
      await frame.getByRole('button', { name: 'More save options' }).click();
      await page.getByLabel('Text', { exact: true }).fill('Publish');
      await frame.getByRole('button', { name: 'Publish', exact: true }).waitFor();
      assert(await frame.locator('[role="menu"]:visible').count() === 0, 'Reconfiguration left an old menu open');
    } else {
      await choose('position', 'bottom-right');
      await page.waitForFunction(slug => document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelector(`#stage > .mtrl-${slug}`)?.classList.contains(`mtrl-${slug}--bottom-right`), slug);
      assert(await root.evaluate(element => getComputedStyle(element).position) === 'fixed', 'FAB is not floating inside preview');
      await checkbox('lowered').click();
      await page.waitForFunction(slug => document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelector(`#stage > .mtrl-${slug}`)?.classList.contains(`mtrl-${slug}--lowered`), slug);
      if (slug === 'extended-fab') {
        await checkbox('collapsed').click();
        await page.waitForFunction(() => document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelector('.mtrl-extended-fab')?.classList.contains('mtrl-extended-fab--collapsed'));
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Configuration reset' }).waitFor();
    await page.screenshot({ animations: 'disabled', path: `${output}/${slug}-mobile.png`, fullPage: true });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${slug}: mobile page overflows`);
    await page.setViewportSize({ width: 1440, height: 900 });
  }
  await page.goto(`${server.url}components/`);
  assert(await page.locator('.component-card').count() === componentSlugs.length, 'Catalog is missing a component');
  await page.screenshot({ animations: 'disabled', path: `${output}/actions-catalog.png`, fullPage: true });
  assert(errors.length === 0, errors.join('\n'));
  console.log('All Actions browser checks passed.');
} finally {
  await browser.close();
  server.stop(true);
}
