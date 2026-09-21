import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { handleRequest } from '../server';

const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: handleRequest });
const output = resolve(import.meta.dir, '../analysis/browser');
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto(`${server.url}components/button/`);
  await page.selectOption('#preview-theme', 'forest');
  await page.locator('label.choice:has(input[name="mode"][value="dark"])').click();
  await page.locator('#sidebar').getByRole('link', { name: 'Checkbox', exact: true }).click();
  const frame = page.frameLocator('#preview');
  const input = frame.getByRole('checkbox');
  const stateControl = page.getByLabel('State', { exact: true });
  const toggle = (name: string) => page.locator(`label:has(input[type="checkbox"][name="${name}"])`);
  const choose = (name: string, value: string) => page.locator(`label.choice:has(input[name="${name}"][value="${value}"])`).click();
  const assertState = async (state: string) => {
    await page.waitForFunction(state => {
      const input = document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelector<HTMLInputElement>('input[type="checkbox"]');
      const actual = input?.indeterminate ? 'indeterminate' : input?.checked ? 'checked' : 'unchecked';
      return !!input && actual === state && document.querySelector<HTMLSelectElement>('select[name="state"]')?.value === state;
    }, state);
    const source = await page.locator('#generated-code').textContent();
    assert(source?.includes(`checked: ${state === 'checked'}`) && source.includes(`indeterminate: ${state === 'indeterminate'}`), 'Generated code does not match checkbox state');
  };
  await frame.getByRole('checkbox', { name: 'Remember me' }).waitFor();
  await assertState('unchecked');
  assert(!await input.evaluate((element: HTMLInputElement) => element.required), 'Checkbox starts required');
  await page.waitForFunction(() => document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.documentElement.dataset.themeMode === 'dark');
  assert(await frame.locator('html').getAttribute('data-theme') === 'forest', 'Checkbox lost saved preview appearance');
  assert((await page.locator('.eyebrow').textContent())?.includes('SELECTION & INPUT'), 'Checkbox has the wrong category');
  await page.screenshot({ path: `${output}/checkbox-desktop.png`, fullPage: true, animations: 'disabled' });

  await input.click();
  await assertState('checked');
  const originalInput = await input.elementHandle();
  await page.getByRole('tab', { name: 'View code', exact: true }).click();
  assert(await page.locator('#generated-code .hljs-keyword').count() > 0, 'Checkbox code is not highlighted');
  await page.getByRole('tab', { name: 'Live preview' }).click();
  await page.selectOption('#preview-theme', 'ocean');
  assert(await originalInput!.evaluate(element => element === element.ownerDocument.querySelector('input')), 'Theme or tab change recreated the checkbox');
  await assertState('checked');

  await choose('variant', 'outlined');
  await frame.locator('.mtrl-checkbox--outlined').waitFor();
  assert(await frame.locator('.mtrl-checkbox-icon').evaluate(element => getComputedStyle(element).backgroundColor) === 'rgba(0, 0, 0, 0)', 'Outlined variant is not visually applied');
  for (const state of ['indeterminate', 'unchecked', 'checked']) {
    await stateControl.selectOption(state);
    await assertState(state);
  }
  await stateControl.selectOption('indeterminate');
  await frame.locator('.mtrl-checkbox--indeterminate').waitFor();
  await page.screenshot({ path: `${output}/checkbox-mixed.png`, fullPage: true, animations: 'disabled' });
  await input.click();
  await assertState('checked');
  assert(await frame.locator('.mtrl-checkbox--indeterminate').count() === 0, 'Click left mixed styling behind');
  await stateControl.selectOption('indeterminate');
  await assertState('indeterminate');
  await input.press('Space');
  await assertState('checked');
  assert(await frame.locator('.mtrl-checkbox--indeterminate').count() === 0, 'Keyboard change left mixed styling behind');
  await input.press('Space');
  await assertState('unchecked');

  await choose('labelPosition', 'start');
  await frame.locator('.mtrl-checkbox--label-start').waitFor();
  const labelBox = await frame.locator('.mtrl-checkbox-label').boundingBox();
  const iconBox = await frame.locator('.mtrl-checkbox-icon').boundingBox();
  assert(labelBox && iconBox && labelBox.x < iconBox.x, 'Start label is not before the checkbox');
  await page.getByLabel('Label', { exact: true }).fill('Receive updates');
  await frame.getByRole('checkbox', { name: 'Receive updates' }).waitFor();
  await page.getByLabel('Name', { exact: true }).fill('updates');
  await page.getByLabel('Value', { exact: true }).fill('yes');
  await page.waitForFunction(() => document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelector<HTMLInputElement>('input')?.value === 'yes');
  assert(await input.getAttribute('name') === 'updates', 'Form name was not applied');
  await toggle('required').click();
  await page.waitForFunction(() => document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelector<HTMLInputElement>('input')?.required);
  assert(await input.evaluate((element: HTMLInputElement) => element.validity.valueMissing), 'Required unchecked input should be invalid');
  await toggle('required').click();
  await page.waitForFunction(() => !document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelector<HTMLInputElement>('input')?.required);
  await toggle('disabled').click();
  await page.waitForFunction(() => document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelector<HTMLInputElement>('input')?.disabled);
  await input.evaluate((element: HTMLInputElement) => element.click());
  await assertState('unchecked');
  await page.getByLabel('Label', { exact: true }).fill('');
  await frame.getByRole('checkbox', { name: 'Checkbox', exact: true }).waitFor();

  await page.getByRole('tab', { name: 'View code', exact: true }).click();
  await page.getByRole('button', { name: 'Copy code', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Code copied' }).waitFor();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  assert(copied === await page.locator('#generated-code').textContent(), 'Copied checkbox code differs from displayed code');
  assert(copied.includes('createCheckbox') && copied.includes('mtrl/styles/checkbox') && copied.includes('mtrl-checkbox--outlined') && copied.includes("setAttribute('aria-label', 'Checkbox')") && copied.includes('disabled: true'), 'Copied checkbox code is incomplete');
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Configuration reset' }).waitFor();
  await page.getByRole('tab', { name: 'Live preview' }).click();
  await frame.getByRole('checkbox', { name: 'Remember me' }).waitFor();
  await assertState('unchecked');
  assert(await input.isEnabled(), 'Reset did not enable checkbox');
  assert(await page.locator('#preview-theme').inputValue() === 'ocean', 'Reset cleared preview preference');
  for (const viewport of [{ width: 1366, height: 768 }, { width: 1280, height: 640 }]) {
    await page.setViewportSize(viewport);
    assert(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight), 'Checkbox playground scrolls the whole desktop page');
  }
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Checkbox mobile layout overflows');
  await page.screenshot({ path: `${output}/checkbox-mobile.png`, fullPage: true, animations: 'disabled' });
  await page.goto(`${server.url}docs/components/checkbox/`);
  assert(await page.getByRole('link', { name: 'Open playground' }).getAttribute('href') === '/components/checkbox/', 'Checkbox docs link to the wrong playground');
  assert(errors.length === 0, errors.join('\n'));
  console.log('Checkbox browser checks passed.');
} finally {
  await browser.close();
  server.stop(true);
}
