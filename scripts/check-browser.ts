import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { handleRequest } from '../server';

const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: handleRequest });
const base = server.url.toString();
const output = resolve(import.meta.dir, '../analysis/browser');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors: string[] = [];
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'dark', permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto(base);
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.screenshot({ animations: 'disabled', path: `${output}/home-desktop.png`, fullPage: true });
  await page.getByRole('link', { name: 'Explore components' }).click();
  const preview = page.frameLocator('#preview');
  const button = preview.getByRole('button', { name: 'Button', exact: true });
  await button.waitFor();
  await button.click();
  await page.getByRole('status').filter({ hasText: 'Button clicked' }).waitFor();
  await page.screenshot({ animations: 'disabled', path: `${output}/button-desktop.png`, fullPage: true });

  for (const variant of ['filled', 'tonal', 'outlined', 'elevated', 'text']) {
    await page.locator(`label.choice:has(input[name="variant"][value="${variant}"])`).click();
    await page.waitForFunction(value => document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelector('button')?.classList.contains(`mtrl-button--${value}`), variant);
  }
  for (const size of ['xs', 's', 'm', 'l', 'xl']) {
    await page.locator(`label.choice:has(input[name="size"][value="${size}"])`).click();
    await page.waitForFunction(value => document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelector('button')?.classList.contains(`mtrl-button--${value}`), size);
  }
  await page.getByLabel('Text', { exact: true }).fill('Save changes');
  await page.locator('label.choice:has(input[name="icon"][value="heart"])').click();
  await page.getByText('Square shape', { exact: true }).click();
  await page.getByText('Disabled', { exact: true }).click();
  await page.waitForFunction(() => document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelector<HTMLButtonElement>('button')?.disabled);
  await page.selectOption('#preview-theme', 'ocean');
  await page.locator('label.choice:has(input[name="mode"][value="dark"])').click();
  await page.waitForFunction(() => document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.documentElement.dataset.theme === 'ocean');
  assert(await page.locator('html').getAttribute('data-theme-mode') === 'dark', 'Preview changed site mode');
  await page.locator('#theme-toggle').click();
  assert(await preview.locator('html').getAttribute('data-theme-mode') === 'dark', 'Site theme changed preview mode');
  await page.getByRole('button', { name: 'Copy code', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Code copied' }).waitFor();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  assert(copied.includes('Save changes') && copied.includes('disabled: true') && copied.includes('mtrl/themes/ocean'), 'Copied code is stale');
  const parentHasMaterial = await page.evaluate(() => [...document.styleSheets].some(sheet => sheet.href?.includes('/mtrl/')));
  assert(!parentHasMaterial, 'Material CSS leaked into the site');
  await page.screenshot({ animations: 'disabled', path: `${output}/button-configured.png`, fullPage: true });
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Configuration reset' }).waitFor();
  assert(await page.locator('#button-text').inputValue() === 'Button', 'Reset did not restore text');
  await button.waitFor();
  assert(await button.isEnabled(), 'Reset did not enable the button');

  await page.goto(`${base}docs/components/button/`);
  await page.locator('.md h1').waitFor();
  await page.screenshot({ animations: 'disabled', path: `${output}/docs-desktop.png`, fullPage: false });
  const tocHref = await page.locator('.doc-toc a').first().getAttribute('href');
  assert(tocHref && await page.locator(tocHref).count() === 1, 'TOC target is missing');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}components/button/`);
  await preview.getByRole('button', { name: 'Button', exact: true }).waitFor();
  await page.screenshot({ animations: 'disabled', path: `${output}/button-mobile.png`, fullPage: true });
  const overflow = await page.evaluate(() => [...document.querySelectorAll('body *')].map(element => ({ tag: element.tagName, class: element.className, width: element.getBoundingClientRect().width, right: element.getBoundingClientRect().right })).filter(item => item.right > innerWidth + 1));
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Mobile page overflows horizontally: ${JSON.stringify(overflow)}`);
  await page.locator('#hamburger').click();
  assert(await page.locator('#hamburger').getAttribute('aria-expanded') === 'true', 'Mobile menu did not open');
  await page.locator('#sidebar .mobile-navigation').getByRole('link', { name: 'Documentation', exact: true }).click();
  await page.getByRole('heading', { name: 'Documentation', exact: true }).waitFor();
  await page.goto(base);
  await page.screenshot({ animations: 'disabled', path: `${output}/home-mobile.png`, fullPage: true });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile landing overflows');
  assert(errors.length === 0, `Browser errors: ${errors.join('\n')}`);
  console.log(`Browser checks passed. Screenshots: ${output}`);
} finally {
  await browser.close();
  server.stop(true);
}
