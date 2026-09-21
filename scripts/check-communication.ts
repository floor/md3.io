import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { handleRequest } from '../server';
import { components, componentSlugs } from '../src/shared/components';

const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: handleRequest });
const output = resolve(import.meta.dir, '../analysis/browser');
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark', permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  const frame = page.frameLocator('#preview');
  const choose = async (key: string, value: string) => {
    const select = page.locator(`#configuration select[name="${key}"]`);
    if (await select.count()) await select.selectOption(value);
    else await page.locator(`#configuration label.choice:has(input[name="${key}"][value="${value}"])`).click();
  };
  const toggle = (key: string) => page.locator(`#configuration label:has(input[type="checkbox"][name="${key}"])`).click();
  const range = async (key: string, value: string) => {
    await page.locator(`#configuration input[name="${key}"]`).fill(value);
  };
  const checked = (key: string, expected: boolean) => page.waitForFunction(({ key, expected }) => document.querySelector<HTMLInputElement>(`#configuration [name="${key}"]`)?.checked === expected, { key, expected });
  const reset = async () => {
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await page.locator('#playground-status').filter({ hasText: 'Configuration reset' }).waitFor();
  };
  const canvasPainted = async () => {
    await page.waitForFunction(() => {
      const canvas = document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelector('canvas');
      return canvas && canvas.width > 0 && canvas.height > 0 && canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height).data.some((value, index) => index % 4 === 3 && value > 0);
    });
  };
  for (const slug of componentSlugs.filter(slug => components[slug].group === 'Communication' && (!process.argv[2] || slug === process.argv[2]))) {
    console.log(`Checking ${slug}`);
    await page.goto(`${server.url}components/${slug}/`);
    await frame.locator('#stage > *').first().waitFor();
    if (slug === 'badge') {
      await frame.getByRole('status').filter({ hasText: '8' }).waitFor();
      await page.locator('#configuration [name="label"]').fill('125');
      await frame.getByRole('status').filter({ hasText: '99+' }).waitFor();
      await choose('variant', 'small');
      await frame.locator('.mtrl-badge--small').waitFor();
      assert(await frame.locator('.mtrl-badge').textContent() === '', 'Small badge must be a dot');
      assert(await page.locator('#configuration [name="max"]').first().isDisabled(), 'Dot badge count controls should be inactive');
      await choose('variant', 'large');
      await frame.getByRole('status').filter({ hasText: '99+' }).waitFor();
      await toggle('visible');
      await frame.locator('.mtrl-badge--invisible').waitFor({ state: 'attached' });
      await reset();
      await frame.getByRole('button', { name: 'Inbox' }).click();
      await page.locator('#playground-status').filter({ hasText: 'Inbox clicked' }).waitFor();
    } else if (slug === 'progress') {
      await canvasPainted();
      await range('value', '80');
      await frame.locator('[role="progressbar"][aria-valuenow="80"]').waitFor();
      await toggle('showLabel');
      await frame.getByText('80%', { exact: true }).waitFor();
      await toggle('indeterminate');
      await frame.locator('[role="progressbar"]:not([aria-valuenow])').waitFor();
      assert(await page.locator('#configuration [name="value"]').isDisabled(), 'Indeterminate value should be inactive');
      await toggle('disabled');
      await frame.locator('[role="progressbar"][aria-disabled="true"]').waitFor();
      await reset();
    } else if (slug === 'loading-indicator') {
      await canvasPainted();
      await toggle('contained');
      await frame.locator('.mtrl-loading-indicator--contained').waitFor();
      await toggle('indeterminate');
      await range('value', '75');
      await frame.locator('[role="progressbar"][aria-valuenow="75"]').waitFor();
      await range('size', '120');
      await page.waitForFunction(() => Math.round(document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelector('canvas')?.getBoundingClientRect().width || 0) === 120);
      await canvasPainted();
      await reset();
    } else if (slug === 'snackbar') {
      await page.locator('#configuration [name="message"]').fill('');
      await frame.getByRole('button', { name: 'Show snackbar' }).click();
      await frame.getByText('Your changes have been saved.', { exact: true }).waitFor();
      await checked('visible', true);
      await frame.getByRole('button', { name: 'Undo', exact: true }).click();
      await checked('visible', false);
      await page.locator('#playground-status').filter({ hasText: 'Snackbar closed: action' }).waitFor();
      await frame.getByRole('button', { name: 'Show snackbar' }).click();
      await frame.getByRole('button', { name: 'Dismiss', exact: true }).click();
      await page.locator('#playground-status').filter({ hasText: 'Snackbar closed: close-button' }).waitFor();
      await choose('duration', 'short');
      await frame.getByRole('button', { name: 'Show snackbar' }).click();
      await checked('visible', true);
      await page.locator('#playground-status').filter({ hasText: 'Snackbar closed: timeout' }).waitFor();
      await reset();
      await frame.getByRole('button', { name: 'Show snackbar' }).click();
      await checked('visible', true);
      await reset();
      await frame.locator('.mtrl-snackbar').waitFor({ state: 'detached' });
      await frame.getByRole('button', { name: 'Show snackbar' }).click();
      await frame.getByRole('button', { name: 'Undo', exact: true }).press('Escape');
      await page.locator('#playground-status').filter({ hasText: 'Snackbar closed: escape' }).waitFor();
    } else if (slug === 'tooltip') {
      const target = frame.getByRole('button', { name: 'Favorite', exact: true });
      await target.hover();
      await frame.getByRole('tooltip').waitFor();
      await checked('visible', true);
      await target.press('Escape');
      await frame.getByRole('tooltip').waitFor({ state: 'hidden' });
      await checked('visible', false);
      await page.getByRole('heading', { name: 'Tooltip', exact: true }).hover();
      await page.getByRole('button', { name: 'Reset', exact: true }).focus();
      await target.focus();
      await frame.getByRole('tooltip').waitFor();
      assert(await target.getAttribute('aria-describedby') === await frame.getByRole('tooltip').getAttribute('id'), 'Tooltip is not associated with its target');
      await reset();
      await toggle('showOnFocus');
      await toggle('showOnHover');
      await target.focus();
      await target.hover();
      // Wait beyond the configured delay to verify disabled triggers stay inactive.
      await page.waitForTimeout(450);
      assert(await frame.locator('.mtrl-tooltip').getAttribute('aria-hidden') === 'true', 'Disabled tooltip triggers still show it');
      await toggle('visible');
      await frame.getByRole('tooltip').waitFor();
      await reset();
      assert(await frame.locator('.mtrl-tooltip').count() === 1, 'Tooltip leaked after reset');
    }
    for (const key of ['variant', 'shape', 'position', 'color']) {
      const control = components[slug].controls.find(control => control.key === key);
      for (const option of control?.options || []) {
        await choose(key, option);
        await frame.locator('#stage > *').first().waitFor();
        if (slug === 'progress') await canvasPainted();
        if (slug === 'tooltip') {
          await toggle('visible');
          await frame.getByRole('tooltip').waitFor();
          const bounds = await frame.getByRole('tooltip').boundingBox();
          assert(bounds && bounds.width > 0 && bounds.height > 0, 'Tooltip has no visible size');
          await frame.getByRole('button', { name: 'Favorite', exact: true }).press('Escape');
          await checked('visible', false);
        }
        if (slug === 'snackbar') {
          await frame.getByRole('button', { name: 'Show snackbar' }).click();
          await frame.locator(`.mtrl-snackbar--${option}.mtrl-snackbar--visible`).waitFor();
          await frame.getByRole('button', { name: 'Dismiss', exact: true }).click();
          await checked('visible', false);
        }
      }
    }
    await reset();
    if (slug === 'progress') await frame.locator('.mtrl-progress--linear').waitFor();
    if (slug === 'snackbar') { await frame.getByRole('button', { name: 'Show snackbar' }).click(); await checked('visible', true); }
    if (slug === 'tooltip') { await toggle('visible'); await frame.getByRole('tooltip').waitFor(); }
    if (slug === 'progress' || slug === 'loading-indicator') await canvasPainted();
    // Appearance changes should repaint the current component without replacing it.
    await frame.locator('#stage > *').first().evaluate(element => element.setAttribute('data-appearance-check', 'retained'));
    await page.selectOption('#preview-theme', 'ocean');
    await page.locator('label.choice:has(input[name="mode"][value="dark"])').click();
    await frame.locator('html[data-theme="ocean"][data-theme-mode="dark"]').waitFor();
    assert(await frame.locator('#stage > [data-appearance-check="retained"]').count() === 1, `${slug}: appearance recreated the component`);
    if (slug === 'progress' || slug === 'loading-indicator') await canvasPainted();
    await page.screenshot({ path: `${output}/${slug}-desktop.png`, fullPage: true, animations: 'disabled' });
    await page.getByRole('tab', { name: 'View code', exact: true }).click();
    await page.getByRole('button', { name: 'Copy code', exact: true }).click();
    await page.locator('#playground-status').filter({ hasText: 'Code copied' }).waitFor();
    const source = await page.evaluate(() => navigator.clipboard.readText());
    assert(source.includes(components[slug].factory) && source === await page.locator('#generated-code').textContent(), `${slug}: copied code is stale`);
    new Bun.Transpiler({ loader: 'js' }).transformSync(source);
    assert(await page.locator('#generated-code .hljs-keyword').count() > 0, `${slug}: no syntax highlighting`);
    await page.getByRole('tab', { name: 'Live preview' }).click();
    await page.setViewportSize({ width: 1280, height: 640 });
    assert(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight), `${slug}: desktop page overflows vertically`);
    await page.setViewportSize({ width: 390, height: 844 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${slug}: mobile page overflows horizontally`);
    await page.screenshot({ path: `${output}/${slug}-mobile.png`, fullPage: true, animations: 'disabled' });
    await reset();
    assert(await page.locator('#preview-theme').inputValue() === 'ocean', 'Reset discarded the selected theme');
    await page.setViewportSize({ width: 1440, height: 900 });
    assert(errors.length === 0, errors.join('\n'));
  }
  console.log('Communication browser checks passed.');
} finally {
  await browser.close();
  server.stop(true);
}
