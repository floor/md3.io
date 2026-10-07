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
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark', reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] });
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
  const reset = async () => {
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await page.locator('#playground-status').filter({ hasText: 'Configuration reset' }).waitFor();
  };
  const valueIs = (key: string, expected: string) => page.waitForFunction(({ key, expected }) => (document.querySelector(`#configuration [name="${key}"]:checked, #configuration [name="${key}"]:not([type="radio"]):not([type="checkbox"])`) as HTMLInputElement)?.value === expected, { key, expected });
  // A change re-renders the stage: the element a read lands on may be the new one, a frame
  // before it is laid out. Polls, bounded, until the box has a width and a height; the
  // caller asserts, so one that never gets a box fails with its own message.
  const untilBox = async (read: () => Promise<{ width: number; height: number } | null>) => {
    let box = await read();
    for (let i = 0; i < 50 && (!box || box.width === 0 || box.height === 0); i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      box = await read();
    }
    return box;
  };
  for (const slug of componentSlugs.filter(slug => components[slug].group === 'Containment' && (!process.argv[2] || slug === process.argv[2]))) {
    console.log(`Checking ${slug}`);
    await page.goto(`${server.url}components/${slug}/`);
    await frame.locator('#stage > *').first().waitFor();
    await page.screenshot({ path: `${output}/${slug}-desktop.png`, fullPage: true, animations: 'disabled' });
    assert(errors.length === 0, errors.join('\n'));
    if (slug === 'card') {
      await frame.getByRole('button', { name: 'Explore', exact: true }).click();
      await page.locator('#playground-status').filter({ hasText: 'Explore clicked' }).waitFor();
      assert(await frame.locator('img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0), 'Card artwork failed to load');
      await toggle('clickable');
      await frame.getByText('A little time outside').click();
      await page.locator('#playground-status').filter({ hasText: 'Card clicked' }).waitFor();
    } else if (slug === 'list') {
      for (const [lines, height] of [['1', 56], ['2', 72], ['3', 88]] as const) {
        await choose('lines', lines);
        await frame.locator(`.mtrl-list__item[data-lines="${lines}"]`).first().waitFor();
        assert(await frame.locator('.mtrl-list__item').first().evaluate(el => el.getBoundingClientRect().height) === height, `Wrong ${lines}-line height`);
      }
      for (const leading of ['none', 'icon', 'avatar', 'image', 'video']) {
        await choose('leading', leading);
        if (leading === 'none') await frame.locator('.mtrl-list__leading').waitFor({ state: 'hidden' });
        else await frame.locator(`.mtrl-list__leading--${leading}`).first().waitFor();
      }
      await choose('leading', 'avatar');
      await toggle('overline');
      await frame.locator('.mtrl-list__overline').first().waitFor();
      await toggle('subheader');
      await frame.locator('.mtrl-list__subheader').waitFor();
      await choose('dividers', 'inset');
      await frame.locator('.mtrl-list__divider--inset').first().waitFor();
      await choose('trailing', 'control');
      await frame.getByRole('button', { name: 'Save Morning walk', exact: true }).click();
      await page.locator('#playground-status').filter({ hasText: 'Saved: Morning walk' }).waitFor();
      assert(await frame.getByRole('button', { name: 'Morning walk', exact: true }).getAttribute('aria-pressed') === 'true', 'Save changed selection');
      await toggle('third');
      assert(await page.locator('#configuration [name="overline"]').isChecked() && await page.locator('#configuration [name="subheader"]').isChecked(), 'Selecting a row cleared anatomy toggles');
      await page.waitForFunction(() => document.querySelector<HTMLInputElement>('#configuration [name="third"]')?.checked && !document.querySelector<HTMLInputElement>('#configuration [name="first"]')?.checked);
      await frame.locator('.mtrl-list__item--selected[data-id="3"]').waitFor();
      await frame.getByRole('button', { name: 'Read a chapter', exact: true }).click();
      await page.waitForFunction(() => document.querySelector<HTMLInputElement>('#configuration [name="second"]')?.checked && !document.querySelector<HTMLInputElement>('#configuration [name="first"]')?.checked);
      await choose('selection', 'multi');
      await frame.getByRole('button', { name: 'Try a new recipe', exact: true }).click();
      await page.waitForFunction(() => document.querySelector<HTMLInputElement>('#configuration [name="second"]')?.checked && document.querySelector<HTMLInputElement>('#configuration [name="third"]')?.checked);
      await choose('selection', 'none');
      await page.locator('#configuration [name="first"]:disabled').waitFor({ state: 'attached' });
      await frame.getByText('Morning walk', { exact: true }).click();
      assert(await frame.locator('[aria-pressed="true"]').count() === 0, 'Selection stayed active in non-selectable list');
      await choose('selection', 'single');
      await toggle('disableLast');
      await frame.locator('[data-id="3"] .mtrl-list__action:disabled').waitFor();
      await page.locator('.configuration-body').evaluate(el => { el.scrollTop = 0; });
      await page.screenshot({ path: `${output}/list-anatomy-desktop.png`, fullPage: true, animations: 'disabled' });
      await page.locator('.preview-appearance label:has(input[name="mode"][value="dark"])').click();
      await frame.locator('html[data-theme-mode="dark"]').waitFor({ state: 'attached' });
      await page.screenshot({ path: `${output}/list-anatomy-dark.png`, fullPage: true, animations: 'disabled' });
      await page.getByRole('tab', { name: 'View code', exact: true }).click();
      const configuredCode = await page.locator('#generated-code').textContent();
      assert(configuredCode?.includes('headline:') && configuredCode.includes('supportingText:') && configuredCode.includes('overline:') && configuredCode.includes('onListAction') && configuredCode.includes('kind: "divider"'), 'Code is missing configured list anatomy');
      await page.getByRole('tab', { name: 'Live preview' }).click();
      // The Variant control: two values, standard by default; segmented reaches the config,
      // the rendered class and both code panels, while standard keeps it out of the code.
      const variantInput = (value: string) => page.locator(`#configuration input[name="variant"][value="${value}"]`);
      assert(await page.locator('#configuration input[name="variant"]').count() === 2, 'The list Variant control does not offer two values');
      assert(await variantInput('standard').isChecked(), 'The list does not start at the standard variant');
      await choose('variant', 'segmented');
      await frame.locator('.mtrl-list--segmented').waitFor();
      await page.getByRole('tab', { name: 'View code', exact: true }).click();
      assert((await page.locator('#generated-code').textContent())?.includes('variant: "segmented"') === true, 'The list code misses variant: "segmented"');
      await page.getByRole('tab', { name: 'Web Components', exact: true }).click();
      assert((await page.locator('#generated-code').textContent())?.includes('variant="segmented"') === true, 'The list element snippet misses variant="segmented"');
      await page.getByRole('tab', { name: 'Vanilla', exact: true }).click();
      await page.getByRole('tab', { name: 'Live preview' }).click();
      await choose('variant', 'standard');
      await frame.locator('.mtrl-list--standard').waitFor();
      await page.getByRole('tab', { name: 'View code', exact: true }).click();
      const standardCode = await page.locator('#generated-code').textContent();
      assert(standardCode !== null && !standardCode.includes('variant:'), 'The standard list code carries a variant');
      await page.getByRole('tab', { name: 'Web Components', exact: true }).click();
      const standardElement = await page.locator('#generated-code').textContent();
      assert(standardElement !== null && !standardElement.includes('variant='), 'The standard list element snippet carries a variant');
      await page.getByRole('tab', { name: 'Vanilla', exact: true }).click();
      await page.getByRole('tab', { name: 'Live preview' }).click();
    } else if (slug === 'carousel') {
      // The keyboard drives the carousel (the docs: Left and Right, Up and Down full
      // screen, Home and End to the ends); the Current slide control follows every
      // move. Keys land on the focal item: an item scrolled out of view takes none.
      await valueIs('initialSlide', '0');
      await frame.locator('.mtrl-carousel__item').first().press('ArrowRight');
      await valueIs('initialSlide', '1');
      await frame.locator('.mtrl-carousel__item').nth(23).press('End');
      await valueIs('initialSlide', '23');
      await frame.locator('.mtrl-carousel__item').nth(23).press('Home');
      await valueIs('initialSlide', '0');
      await choose('variant', 'full-screen');
      await frame.locator('.mtrl-carousel--vertical').waitFor();
      await frame.locator('.mtrl-carousel__item').nth(1).press('ArrowDown');
      await valueIs('initialSlide', '2');
      // A variant change recreates the carousel: one stage, no stale carousel left.
      assert(await frame.locator('.mtrl-carousel').count() === 1, 'A stale carousel survived a variant change');
      await choose('variant', 'multi-browse');
      await frame.locator('.mtrl-carousel__item').nth(2).waitFor();
      // The new carousel starts where the last one stood, its focal item third.
      await frame.locator('.mtrl-carousel__item').nth(2).press('ArrowRight');
      await valueIs('initialSlide', '3');
    } else if (slug === 'divider') {
      await choose('orientation', 'vertical');
      await frame.getByRole('separator').waitFor();
      await page.waitForFunction(() => document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelector('hr')?.getAttribute('aria-orientation') === 'vertical');
    } else if (slug === 'dialog') {
      await frame.getByRole('button', { name: 'Open dialog' }).click();
      await frame.getByRole('dialog').or(frame.getByRole('alertdialog')).waitFor();
      await page.screenshot({ path: `${output}/dialog-open.png`, fullPage: true, animations: 'disabled' });
      await frame.getByRole('button', { name: 'Save', exact: true }).click();
      await page.waitForFunction(() => !document.querySelector<HTMLInputElement>('#configuration [name="open"]')?.checked);
      await frame.getByRole('dialog').or(frame.getByRole('alertdialog')).waitFor({ state: 'hidden' });
      await frame.getByRole('button', { name: 'Open dialog' }).click();
      await frame.getByRole('dialog').or(frame.getByRole('alertdialog')).press('Escape');
      await frame.getByRole('dialog').or(frame.getByRole('alertdialog')).waitFor({ state: 'hidden' });
    } else if (slug === 'bottom-sheet') {
      await frame.getByRole('button', { name: 'Open bottom sheet' }).click();
      await valueIs('initialState', 'expanded');
      await frame.getByRole('dialog').or(frame.getByRole('alertdialog')).waitFor();
      await page.screenshot({ path: `${output}/bottom-sheet-open.png`, fullPage: true, animations: 'disabled' });
      await frame.getByRole('dialog').or(frame.getByRole('alertdialog')).press('Escape');
      await valueIs('initialState', 'hidden');
      await choose('initialState', 'partial');
      await frame.locator('.mtrl-bottom-sheet--partial').waitFor();
    } else if (slug === 'side-sheet') {
      await frame.getByRole('button', { name: 'Open side sheet' }).click();
      await frame.getByRole('dialog').or(frame.getByRole('alertdialog')).waitFor();
      await page.screenshot({ path: `${output}/side-sheet-open.png`, fullPage: true, animations: 'disabled' });
      await frame.getByRole('button', { name: /Close/ }).click();
      await page.waitForFunction(() => !document.querySelector<HTMLInputElement>('#configuration [name="open"]')?.checked);
      await frame.getByRole('button', { name: 'Open side sheet' }).click();
      await frame.getByRole('dialog').or(frame.getByRole('alertdialog')).press('Escape');
      await frame.getByRole('dialog').or(frame.getByRole('alertdialog')).waitFor({ state: 'hidden' });
    }
    await reset();
    for (const key of ['variant', 'size', 'orientation', 'position', 'mediaPosition']) {
      const control = components[slug].controls.find(control => control.key === key);
      for (const option of control?.options || []) {
        await choose(key, option);
        await frame.locator('#stage > *').first().waitFor();
        if (slug === 'divider') {
          await frame.getByRole('separator').waitFor();
          const bounds = await untilBox(() => frame.getByRole('separator').boundingBox());
          assert(bounds && bounds.width > 0 && bounds.height > 0, 'Divider has no visible length');
        }
        if (slug === 'dialog' && key === 'size') {
          await frame.getByRole('button', { name: 'Open dialog' }).click();
          const dialog = frame.getByRole('dialog').or(frame.getByRole('alertdialog'));
          await dialog.waitFor();
          await dialog.press('Escape');
          await dialog.waitFor({ state: 'hidden' });
        }
        if ((slug === 'bottom-sheet' || slug === 'side-sheet') && key === 'variant') {
          await frame.getByRole('button', { name: `Open ${components[slug].name.toLowerCase()}` }).click();
          const sheet = frame.locator(`.mtrl-${slug}__container`);
          await sheet.waitFor();
          assert(await sheet.getAttribute('role') === (option === 'modal' ? 'dialog' : slug === 'bottom-sheet' ? 'region' : 'complementary'), 'Wrong sheet semantics');
          await page.screenshot({ path: `${output}/${slug}-${option}.png`, fullPage: true, animations: 'disabled' });
          await sheet.press('Escape');
          await page.waitForFunction(slug => document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelector(`.mtrl-${slug}`)?.getAttribute('aria-hidden') === 'true', slug);
        }
      }
    }
    await reset();
    await page.getByRole('tab', { name: 'View code', exact: true }).click();
    await page.getByRole('button', { name: 'Copy code', exact: true }).click();
    await page.locator('#playground-status').filter({ hasText: 'Code copied' }).waitFor();
    const source = await page.evaluate(() => navigator.clipboard.readText());
    assert(source.includes(components[slug].factory) && source === await page.locator('#generated-code').textContent(), `${slug}: copied code is stale`);
    assert(await page.locator('#generated-code .hljs-keyword').count() > 0, `${slug}: no syntax highlighting`);
    await page.getByRole('tab', { name: 'Live preview' }).click();
    await page.setViewportSize({ width: 1280, height: 640 });
    assert(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight), `${slug}: desktop page overflows vertically`);
    await page.setViewportSize({ width: 390, height: 844 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${slug}: mobile page overflows horizontally`);
    if (['dialog', 'bottom-sheet', 'side-sheet'].includes(slug)) {
      await frame.getByRole('button', { name: `Open ${components[slug].name.toLowerCase()}` }).click();
      await frame.getByRole('dialog').or(frame.getByRole('alertdialog')).waitFor();
    }
    await page.screenshot({ path: `${output}/${slug}-mobile.png`, fullPage: true, animations: 'disabled' });
    await reset();
    await page.setViewportSize({ width: 1440, height: 900 });
    assert(errors.length === 0, errors.join('\n'));
  }
  console.log('Containment browser checks passed.');
} finally {
  await browser.close();
  server.stop(true);
}
