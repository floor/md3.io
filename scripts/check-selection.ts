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
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  const frame = page.frameLocator('#preview');
  const calendarFits = () => frame.getByRole('dialog').evaluate(element => {
    const bounds = element.getBoundingClientRect();
    return bounds.top >= 0 && bounds.bottom <= innerHeight && bounds.left >= 0 && bounds.right <= innerWidth;
  });
  const choose = async (key: string, value: string) => {
    const select = page.locator(`#configuration select[name="${key}"]`);
    if (await select.count()) await select.selectOption(value);
    else await page.locator(`#configuration label.choice:has(input[name="${key}"][value="${value}"])`).click();
  };
  const toggle = (key: string) => page.locator(`#configuration label:has(input[type="checkbox"][name="${key}"])`).click();
  const reset = async () => {
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await page.locator('#playground-status').filter({ hasText: 'Configuration reset' }).waitFor();
  };
  const valueIs = (key: string, expected: string) => page.waitForFunction(({ key, expected }) => (document.querySelector(`#configuration [name="${key}"]:checked, #configuration [name="${key}"]:not([type="radio"]):not([type="checkbox"])`) as HTMLInputElement)?.value === expected, { key, expected });
  for (const slug of componentSlugs.filter(slug => components[slug].group === 'Selection & input' && slug !== 'checkbox' && (!process.argv[2] || slug === process.argv[2]))) {
    console.log(`Checking ${slug}`);
    await page.goto(`${server.url}components/${slug}/`);
    await frame.locator('#stage > *').first().waitFor();
    assert(errors.length === 0, errors.join('\n'));
    await page.screenshot({ path: `${output}/${slug}-desktop.png`, fullPage: true, animations: 'disabled' });

    if (slug === 'switch') {
      await frame.getByRole('switch').click();
      await page.waitForFunction(() => !document.querySelector<HTMLInputElement>('#configuration input[name="checked"]')?.checked);
      await frame.getByRole('switch').press('Space');
      await page.waitForFunction(() => document.querySelector<HTMLInputElement>('#configuration input[name="checked"]')?.checked);
    } else if (slug === 'radios') {
      await frame.getByText('Express', { exact: true }).click();
      await valueIs('value', 'express');
      await toggle('disableExpress');
      await page.waitForFunction(() => document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelector<HTMLInputElement>('input[value="express"]')?.disabled);
      await valueIs('value', 'standard');
    } else if (slug === 'chips') {
      await frame.getByText('Music', { exact: true }).click();
      await page.waitForFunction(() => document.querySelector<HTMLInputElement>('#configuration input[name="music"]')?.checked);
      await toggle('multiSelect');
      await frame.getByText('Food', { exact: true }).click();
      await page.waitForFunction(() => document.querySelector<HTMLInputElement>('#configuration input[name="food"]')?.checked && !document.querySelector<HTMLInputElement>('#configuration input[name="hiking"]')?.checked);
    } else if (slug === 'slider') {
      await frame.getByRole('slider').first().press('ArrowRight');
      await valueIs('value', '41');
      await toggle('range');
      await frame.getByRole('slider').nth(1).waitFor();
      await frame.getByRole('slider').nth(1).press('ArrowLeft');
      await valueIs('secondValue', '79');
    } else if (slug === 'textfield') {
      await frame.getByRole('textbox').fill('Ada Lovelace');
      await valueIs('value', 'Ada Lovelace');
      const input = await frame.getByRole('textbox').elementHandle();
      await page.selectOption('#preview-theme', 'ocean');
      assert(await input!.evaluate(element => element.isConnected), 'Changing the theme recreated the text input');
      await toggle('readonly');
      await page.waitForFunction(() => document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelector<HTMLInputElement>('input')?.readOnly);
    } else if (slug === 'select') {
      await frame.locator('.mtrl-select').click();
      await frame.getByText('Cherry', { exact: true }).click();
      await valueIs('value', 'cherry');
      await frame.locator('.mtrl-select').click();
      await choose('variant', 'filled');
      await frame.locator('[role="menu"]:visible, [role="listbox"]:visible').waitFor({ state: 'hidden' });
    } else if (slug === 'search') {
      await frame.locator('input').fill('Paris');
      await valueIs('value', 'Paris');
      await valueIs('initialState', 'view');
      await frame.getByText('Paris', { exact: true }).click();
      await valueIs('value', 'Paris');
    } else if (slug === 'datepicker') {
      await frame.locator('input').click();
      await frame.getByRole('dialog').waitFor();
      assert(await calendarFits(), 'Docked calendar extends outside the preview');
      await page.screenshot({ path: `${output}/datepicker-open.png`, fullPage: true, animations: 'disabled' });
      await frame.locator('.mtrl-datepicker-day:not(.outside-month):not(.disabled)').filter({ hasText: /^22$/ }).first().click();
      await valueIs('value', '2026-09-22');
      await frame.getByRole('dialog').waitFor({ state: 'hidden' });
      await choose('variant', 'modal');
      await frame.locator('input').click();
      await frame.getByRole('dialog').waitFor();
      assert(await calendarFits(), 'Modal calendar extends outside the preview');
      await reset();
      assert(await frame.getByRole('dialog').isVisible() === false, 'Reconfiguring date picker left a calendar open');
    } else if (slug === 'timepicker') {
      await choose('type', 'input');
      await choose('format', '24h');
      await frame.getByRole('button', { name: /Choose time/ }).click();
      await page.screenshot({ path: `${output}/timepicker-open.png`, fullPage: true, animations: 'disabled' });
      await frame.getByRole('spinbutton', { name: 'Hour', exact: true }).fill('14');
      await frame.getByRole('spinbutton', { name: 'Hour', exact: true }).press('Tab');
      await frame.getByRole('button', { name: 'OK', exact: true }).click();
      await page.waitForFunction(() => document.querySelector<HTMLInputElement>('#configuration input[name="value"]')?.value.startsWith('14:'));
      await frame.getByRole('button', { name: /Choose time/ }).click();
      await reset();
      assert(await frame.locator('.mtrl-time-picker-modal:visible').count() === 0, 'Reconfiguring time picker left a dialog open');
    }

    await reset();
    for (const key of ['variant', 'size', 'type', 'format', 'viewMode']) {
      const control = components[slug].controls.find(control => control.key === key);
      if (!control?.options) continue;
      for (const option of control.options) {
        await choose(key, option);
        await frame.locator('#stage > *').first().waitFor();
        assert(!(await page.locator('#playground-status').textContent())?.includes('could not load'), `${slug}: ${key}=${option} failed`);
      }
    }
    await reset();
    if (components[slug].controls.some(control => control.key === 'disabled')) {
      await toggle('disabled');
      await page.waitForFunction(() => {
        const doc = document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument;
        return !!doc?.querySelector(':disabled, [aria-disabled="true"], [class*="--disabled"]');
      });
    }
    await page.getByRole('tab', { name: 'View code', exact: true }).click();
    await page.getByRole('button', { name: 'Copy code', exact: true }).click();
    await page.locator('#playground-status').filter({ hasText: 'Code copied' }).waitFor();
    const source = await page.evaluate(() => navigator.clipboard.readText());
    assert(source.includes(components[slug].factory) && source === await page.locator('#generated-code').textContent(), `${slug}: code copy is stale`);
    assert(await page.locator('#generated-code .hljs-keyword').count() > 0, `${slug}: no syntax highlighting`);
    await page.getByRole('tab', { name: 'Live preview' }).click();
    await reset();
    await page.setViewportSize({ width: 1280, height: 640 });
    assert(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight), `${slug}: desktop page overflows vertically`);
    await page.setViewportSize({ width: 390, height: 844 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${slug}: mobile page overflows horizontally`);
    await page.screenshot({ path: `${output}/${slug}-mobile.png`, fullPage: true, animations: 'disabled' });
    if (slug === 'datepicker') {
      await frame.locator('input').click();
      await frame.getByRole('dialog').waitFor();
      assert(await calendarFits(), 'Mobile calendar extends outside the preview');
      await page.screenshot({ path: `${output}/datepicker-mobile-open.png`, fullPage: true, animations: 'disabled' });
    }
    if (slug === 'timepicker') {
      await frame.getByRole('button', { name: /Choose time/ }).click();
      await frame.locator('.mtrl-time-picker-dialog').waitFor();
      assert(await frame.locator('.mtrl-time-picker-dialog').evaluate(element => {
        const bounds = element.getBoundingClientRect();
        return bounds.top >= 0 && bounds.bottom <= innerHeight && bounds.left >= 0 && bounds.right <= innerWidth;
      }), 'Mobile clock dialog extends outside the preview');
      await page.screenshot({ path: `${output}/timepicker-mobile-open.png`, fullPage: true, animations: 'disabled' });
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    assert(errors.length === 0, errors.join('\n'));
  }
  console.log('Selection & input browser checks passed.');
} finally {
  await browser.close();
  server.stop(true);
}
