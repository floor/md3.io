import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Browser, Locator, Page } from 'playwright';
import * as panel from './panel-driver';

const widths = [360, 390, 412, 700, 840, 1024, 1440];
const targetSize = 48;

async function checkTargets(targets: Locator, description: string) {
  await targets.first().waitFor();
  const targetBoxes = await targets.evaluateAll(nodes => nodes.filter(node => node.getClientRects().length).map(node => {
    const { width, height } = node.getBoundingClientRect();
    return { width, height, name: node.getAttribute('aria-label') || node.textContent?.trim() || node.localName };
  }));
  assert(targetBoxes.length > 0, `${description}: no visible controls`);
  const undersized = targetBoxes.filter(({ width, height }) => width < targetSize - 0.1 || height < targetSize - 0.1);
  assert.deepEqual(undersized, [], `${description}: actual targets must be at least 48 × 48px`);
}

async function edge(page: Page, target: Locator, input: 'touch' | 'pointer', side: 'left' | 'right' | 'top' = 'top') {
  await target.evaluate(node => node.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' }));
  const box = await target.boundingBox();
  assert(box, 'The input target has no bounds');
  const x = box.x + (side === 'left' ? 2 : side === 'right' ? box.width - 2 : box.width / 2);
  const y = box.y + (side === 'top' ? 2 : box.height / 2);
  await (input === 'touch' ? page.touchscreen.tap(x, y) : page.mouse.click(x, y));
}

async function checkPickers(page: Page, base: string, width: number, captures: string) {
  for (const kind of ['date', 'time'] as const) {
    await page.goto(new URL(`components/${kind}picker/`, base).href);
    const fields = page.locator(`#configuration m-text-field[data-picker="${kind}"]:not([disabled])`);
    const triggers = fields.locator('button[part~="trailing-icon"]');
    await checkTargets(triggers, `${width}px ${kind} picker triggers`);
    const trigger = triggers.first();
    await edge(page, trigger, 'touch', 'right');
    const popup = page.locator(`m-${kind}picker[data-panel-picker]`).getByRole('dialog');
    await popup.waitFor();
    await checkTargets(popup.locator('button:visible'), `${width}px ${kind} picker buttons`);
    if (width === 360 || width === 1440) {
      await page.screenshot({ path: `${captures}/${kind}-picker-${width}.png`, animations: 'disabled' });
    }
    await page.keyboard.press('Escape');
    await popup.waitFor({ state: 'hidden' });
    assert(await trigger.evaluate(node => node.matches(':focus-visible')), `${width}px ${kind} picker did not return visible focus`);
  }
}

export async function checkInputTargets(browser: Browser, base: string, output: string) {
  const captures = resolve(output, 'input-targets');
  await mkdir(captures, { recursive: true });
  for (const width of widths) {
    console.log(`Checking input targets at ${width}px`);
    const context = await browser.newContext({ hasTouch: true, reducedMotion: 'reduce', viewport: { width, height: 900 } });
    try {
      const page = await context.newPage();
      const errors: string[] = [];
      page.setDefaultTimeout(10000);
      page.on('pageerror', error => errors.push(error.message));
      const goto = (path: string) => page.goto(new URL(path, base).href);
      const search = page.locator('#search-trigger');
      const theme = page.locator('#theme-picker button[part~="icon-button"]');
      const mode = page.locator('#theme-toggle button[part~="icon-button"]');
      const searchDialog = page.getByRole('dialog', { name: 'Search the site' });
      const nav = page.getByRole('navigation', { name: 'Primary navigation', exact: true });
      await goto('/');
      await checkTargets(search, `${width}px search trigger`);
      await checkTargets(theme, `${width}px theme trigger`);
      await checkTargets(mode, `${width}px mode trigger`);
      await edge(page, search, 'touch', 'right');
      const query = searchDialog.getByRole('combobox');
      await checkTargets(query, `${width}px search input`);
      await query.fill('dialog');
      const results = searchDialog.getByRole('option');
      await checkTargets(results, `${width}px search results`);
      const active = await query.getAttribute('aria-activedescendant');
      await query.press('ArrowDown');
      assert.notEqual(await query.getAttribute('aria-activedescendant'), active, 'ArrowDown selects the next search result');
      await page.keyboard.press('Escape');
      await searchDialog.waitFor({ state: 'hidden' });
      assert(await search.evaluate(node => node.matches(':focus-visible')), 'Search returns visible keyboard focus');

      await page.keyboard.press('Tab');
      await page.locator('#theme-picker:defined button[part~="icon-button"]:focus-visible').waitFor();
      await checkTargets(theme, `${width}px upgraded theme trigger`);
      await page.keyboard.press('Enter');
      const menu = page.locator('.header__themes m-menu [part~="menu"]');
      await checkTargets(menu.getByRole('menuitem'), `${width}px theme options`);
      await page.keyboard.press('Escape');
      await menu.waitFor({ state: 'hidden' });
      assert(await theme.evaluate(node => node.matches(':focus-visible')), 'Theme menu returns visible focus');
      await page.keyboard.press('Shift+Tab');
      assert(await search.evaluate(node => document.activeElement === node), 'Shift+Tab returns to the search button');

      await search.press('Enter');
      await query.fill('dialog');
      const result = results.nth(1);
      const resultHref = await result.getAttribute('href');
      assert(resultHref);
      await edge(page, result, 'touch');
      await page.waitForURL(new URL(resultHref, base).href);

      await checkTargets(nav.getByRole('link'), `${width}px primary destinations`);
      await edge(page, nav.getByRole('link', { name: 'Components', exact: true }), 'touch', 'right');
      await page.waitForURL(new URL('components/', base).href);
      const componentList = page.getByRole('navigation', { name: 'Component list', exact: true });
      if (width < 840) await page.locator('#component-catalog-index summary').click();
      await checkTargets(componentList.getByRole('button'), `${width}px component family disclosures`);
      await edge(page, componentList.getByRole('button', { name: 'Buttons', exact: true }), 'touch');
      const buttonLink = componentList.getByRole('link', { name: 'Button', exact: true });
      await checkTargets(componentList.getByRole('link'), `${width}px component list rows`);
      await edge(page, buttonLink, 'touch');
      await page.waitForURL(new URL('components/button/', base).href);

      const frameworks = page.getByRole('grid', { name: 'Framework', exact: true });
      const factory = frameworks.getByRole('gridcell', { name: 'Factory', exact: true });
      const web = frameworks.getByRole('gridcell', { name: 'Web Components', exact: true });
      await checkTargets(frameworks.locator('button[part~="action"]'), `${width}px framework actions`);
      await edge(page, factory, 'touch', 'right');
      assert.equal(await factory.getAttribute('aria-selected'), 'true', 'The chip edge selects Factory');
      await factory.press('ArrowRight');
      assert(await web.evaluate(node => (node.getRootNode() as ShadowRoot).activeElement === node), 'ArrowRight moves between chips');
      await web.press('Space');
      await page.waitForFunction(() => String((document.querySelector('m-chips.framework-chips') as HTMLElement & { value?: string })?.value) === 'html');

      const tabs = page.getByRole('tablist', { name: 'Playground view' });
      await checkTargets(tabs.getByRole('tab'), `${width}px preview tabs`);
      const liveTab = tabs.getByRole('tab', { name: 'Live preview', exact: true });
      await tabs.getByRole('tab', { name: 'View code', exact: true }).press('ArrowLeft');
      assert(await liveTab.evaluate(node => (node.getRootNode() as ShadowRoot).activeElement === node), 'ArrowLeft moves focus to the live tab');
      await liveTab.press('Enter');
      await page.getByRole('tabpanel', { name: 'Live preview', exact: true }).waitFor();
      await checkTargets(page.getByRole('button', { name: 'Copy code', exact: true }), `${width}px copy control`);

      const config = page.locator('#configuration');
      await checkTargets(config.getByRole('textbox', { name: 'Text', exact: true }), `${width}px text input`);
      const scenario = config.getByRole('combobox', { name: 'Scenario', exact: true });
      await checkTargets(scenario, `${width}px scenario control`);
      await scenario.press('Enter');
      await checkTargets(page.getByRole('listbox').getByRole('option'), `${width}px configuration options`);
      await page.keyboard.press('Escape');
      await page.getByRole('listbox').waitFor({ state: 'hidden' });
      assert(await scenario.evaluate(node => node.matches(':focus-visible')), 'Select returns visible focus');

      const size = config.locator('m-button-group[data-group-for="size"]');
      await checkTargets(size.getByRole('button'), `${width}px connected group buttons`);
      const medium = size.getByRole('button', { name: 'M', exact: true });
      await edge(page, medium, 'pointer', 'right');
      await panel.waitForValue(page, 'size', 'm');
      await medium.press('ArrowRight');
      await panel.waitForValue(page, 'size', 'l');
      const large = size.getByRole('button', { name: 'L', exact: true });
      await page.keyboard.press('Tab');
      assert(await page.evaluate(() => !!document.activeElement?.closest('#configuration') && !document.activeElement?.matches('m-button-group[data-group-for="size"]')),
        'Tab leaves the connected group for the next configuration control');
      await page.keyboard.press('Shift+Tab');
      assert(await large.evaluate(node => (node.getRootNode() as ShadowRoot).activeElement === node), 'Shift+Tab returns to the selected segment');
      await page.screenshot({ path: `${captures}/configuration-${width}.png`, animations: 'disabled' });
      const toggle = config.locator('m-switch[name="toggle"] label[part~="label"]');
      await checkTargets(toggle, `${width}px switch label`);
      await edge(page, toggle, 'touch', 'top');
      await panel.waitForSwitch(page, 'toggle', true);

      await goto('/components/slider/');
      const slider = page.locator('#configuration m-slider:not([disabled])').first();
      const trackTarget = slider.locator('[part~="container"]');
      await checkTargets(trackTarget, `${width}px slider pointer area`);
      const handle = slider.getByRole('slider').first();
      const before = await handle.getAttribute('aria-valuenow');
      await edge(page, trackTarget, 'touch', 'right');
      assert.notEqual(await handle.getAttribute('aria-valuenow'), before, 'An edge tap changes the slider value');
      const after = Number(await handle.getAttribute('aria-valuenow'));
      await handle.press('ArrowLeft');
      assert(Number(await handle.getAttribute('aria-valuenow')) < after, 'ArrowLeft decreases the slider value');
      await checkPickers(page, base, width, captures);

      await goto('/showcase/settings/');
      const device = page.locator('.device__bar');
      await checkTargets(device.getByRole('button'), `${width}px device choices and Rotate`);
      await edge(page, device.getByRole('button', { name: 'Mobile', exact: true }), 'touch', 'right');
      await page.locator('.device[data-device="mobile"]').waitFor();
      const rotate = device.getByRole('button', { name: 'Rotate', exact: true });
      const rotated = await rotate.getAttribute('aria-pressed');
      await edge(page, rotate, 'pointer', 'top');
      assert.notEqual(await rotate.getAttribute('aria-pressed'), rotated, 'The edge of Rotate changes orientation');
      await checkTargets(page.getByRole('button', { name: 'Copy code', exact: true }), `${width}px example copy`);
      await goto('/docs/frameworks/');
      if (width < 840) {
        const index = page.locator('#section-index summary');
        await checkTargets(index, `${width}px documentation index toggle`);
        await edge(page, index, 'touch');
      }
      await checkTargets(page.locator('.sidebar__link'), `${width}px documentation list links`);
      await goto('/styles/');
      const previewToggle = page.locator('#styles-preview-toggle');
      if (width < 840) {
        await checkTargets(previewToggle, `${width}px preview toggle`);
        await edge(page, previewToggle, 'touch');
      }
      const compare = page.locator('.styles-preview__compare');
      await checkTargets(compare, `${width}px Compare label`);
      await edge(page, compare, 'touch', 'right');
      assert(await compare.getByRole('checkbox').isChecked(), 'The edge of the Compare label toggles the field');
      await checkTargets(page.locator('#styles-preview .choice > span:visible'), `${width}px preview choices`);
      await goto('/styles/themes/');
      await checkTargets(page.locator('.theme-app__actions button'), `${width}px theme actions`);
      await checkTargets(page.locator('.theme-app__controls input:visible'), `${width}px theme fields`);
      await checkTargets(page.locator('.md3-scheme-tile'), `${width}px scheme copy tiles`);
      await goto('/styles/color-lab/');
      await page.locator('#colour-lab-stage[data-ready="true"]').waitFor();
      await checkTargets(page.locator('.lab-seed, .lab-sample, .lab-upload, #lab-contrast'), `${width}px Colour Lab controls`);
      const seed = page.locator('.lab-seed[data-seed="#0061A4"]');
      assert.equal(await seed.getAttribute('aria-pressed'), 'false');
      await edge(page, seed, 'touch', 'right');
      await seed.and(page.locator('[aria-pressed="true"]')).waitFor();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px Colour Lab overflows`);
      assert.deepEqual(errors, []);
    } finally {
      await context.close();
    }
  }

  const staticContext = await browser.newContext({ javaScriptEnabled: false });
  try {
    const staticPage = await staticContext.newPage();
    for (const width of [360, 1440]) {
      await staticPage.setViewportSize({ width, height: 900 });
      await staticPage.goto(new URL('components/datepicker/', base).href);
      await checkTargets(staticPage.locator('#theme-picker button, #theme-toggle button, m-text-field[data-picker] button'),
        `${width}px server-rendered controls`);
    }
  } finally {
    await staticContext.close();
  }
  console.log(`Input target checks passed at ${widths.join(', ')}px with touch, pointer and keyboard.`);
}
