import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { BrowserContext, Locator, Page } from 'playwright';
import * as panel from './panel-driver';

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }

async function checkPopup(popup: Locator, label: string) {
  await popup.waitFor();
  const metrics = await popup.evaluate(element => {
    const box = element.getBoundingClientRect();
    return {
      bounds: [box.left, box.top, box.right, box.bottom],
      viewport: [innerWidth, innerHeight],
      surface: [element.clientWidth, element.scrollWidth],
      documentWidth: document.documentElement.scrollWidth,
    };
  });
  const { bounds: [left, top, right, bottom], viewport: [width, height], surface: [client, scroll], documentWidth } = metrics;
  assert(left! >= -1 && top! >= -1 && right! <= width! + 1 && bottom! <= height! + 1 && scroll! <= client! + 1 && documentWidth <= width! + 1,
    `${label}: popup is clipped in the preview frame: ${JSON.stringify(metrics)}`);
}

export async function checkPlaygroundLayout(context: BrowserContext, base: string, output: string) {
  const captures = resolve(output, 'playground-reflow');
  await mkdir(captures, { recursive: true });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  const frame = page.frameLocator('#preview');
  const revealFrame = () => page.locator('#preview').evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  const form = page.locator('#configuration');
  const live = page.getByRole('tab', { name: 'Preview', exact: true });
  const codeTab = page.getByRole('tab', { name: 'Code', exact: true });
  const copy = page.getByRole('button', { name: 'Copy code', exact: true });
  const code = page.locator('#generated-code');
  const longText = 'A longer button label to check keyboard focus and horizontally scrollable code';

  try {
    for (const width of [360, 390, 412, 700, 840, 1024, 1440]) {
      const height = width <= 1024 ? 620 : 1080;
      for (const slug of ['button', 'datepicker', 'dialog'] as const) {
        const label = `${slug} at ${width} × ${height}px`;
        console.log(`Checking playground reflow for ${label}`);
        await page.setViewportSize({ width, height });
        await page.goto(new URL(`components/${slug}/`, base).href);
        if (width >= 600) {
          const rail = await page.locator('#site-primary-rail').boundingBox();
          assert(rail && Math.abs(rail.width - 96) < 1, `${label}: the collapsed rail must reserve 96px`);
        }
        await live.click();
        const preview = page.locator('.preview-panel');
        const previewBox = await preview.boundingBox();
        const formBox = await form.boundingBox();
        assert(previewBox && formBox, `${label}: missing preview or configuration`);
        // The panes stack below 1040px (styles/playground-material.css): two columns there
        // would leave the preview too narrow to show a component.
        if (width < 1040) {
          assert(previewBox.y + previewBox.height <= formBox.y && Math.abs(formBox.width - previewBox.width) < 1, `${label}: preview and configuration must stack`);
        } else {
          assert(previewBox.x + previewBox.width <= formBox.x && Math.abs(formBox.y - previewBox.y) < 1, `${label}: the panes must sit side by side`);
          assert(previewBox.width >= 239 && formBox.width >= 288, `${label}: the panes are too narrow (${previewBox.width}/${formBox.width})`);
        }
        assert(await page.locator('.framework-chips-row').count() === 1 && await page.locator('.preview-panel .framework-chips-row').count() === 0, `${label}: framework chips are not the one row under the heading`);
        if (width === 840) {
          // The component list is the rail's drawer, over the page: nothing reserves room for it.
          assert(!await page.locator('main .component-list').isVisible(), `${label}: the page's own list takes room`);
          const used = await preview.evaluate(element => element.getBoundingClientRect().left);
          assert(Math.abs(used - 116) < 1, `${label}: expected the 96px rail and 20px padding before the preview, got ${used}px`);
        }
        await panel.checkPlaygroundScroll(page, label, height < 860 ? 'page' : 'fit');

        await panel.chooseFramework(page, 'vanilla');
        await panel.chooseFramework(page, 'react');
        await live.click();
        const scenario = slug === 'button' ? 'save' : slug === 'datepicker' ? 'profile-form' : 'location-permission';
        await panel.chooseScenario(page, scenario);
        if (slug === 'button') {
          await panel.waitForValue(page, 'text', 'Save');
          const field = page.getByRole('textbox', { name: 'Text', exact: true });
          await field.fill('Updated label');
          await field.press('Tab');
          const safeFocus = await page.evaluate(() => {
            const target = document.activeElement;
            const box = target?.getBoundingClientRect();
            const header = document.querySelector('.header')!.getBoundingClientRect();
            const bar = document.querySelector('.site-primary-bar')?.getBoundingClientRect();
            return !!target?.closest('#configuration') && !!box && box.top >= header.bottom && box.bottom <= (bar?.height ? bar.top : innerHeight) + 1;
          });
          assert(safeFocus, `${label}: keyboard focus is obscured in configuration`);
          if ([360, 390, 1024].includes(width)) {
            await page.screenshot({ animations: 'disabled', path: `${captures}/button-configuration-${width}.png` });
          }
          if (width === 840) {
            const group = form.locator('m-button-group[data-group-for="icon"]');
            const fits = await group.evaluate(element => {
              const row = element.closest('.control-row')!.getBoundingClientRect();
              const boxes = [...element.shadowRoot!.querySelectorAll('button')].map(button => button.getBoundingClientRect());
              return boxes.length === 5 && boxes.every(box => box.width >= 48 && box.left >= row.left - 1 && box.right <= row.right + 1);
            });
            assert(fits, '840px: the widest configuration group clips a target');
            await panel.choose(page, 'icon', 'heart');
          }
          await frame.getByRole('button', { name: 'Updated label', exact: true }).click();
          await page.getByRole('status').filter({ hasText: /clicked/i }).waitFor();
          if (width === 840) await field.fill(longText);
        } else if (slug === 'datepicker') {
          await panel.choose(page, 'variant', 'modal');
          await panel.waitForValue(page, 'variant', 'modal');
          const calendar = frame.getByRole('dialog');
          await checkPopup(calendar, label);
          await revealFrame();
          await frame.getByRole('button', { name: 'Next month', exact: true }).click();
          if (width === 840) {
            await page.screenshot({ animations: 'disabled', path: `${captures}/datepicker-modal-840.png` });
            await panel.backToDefault(page);
            await frame.locator('[data-action="open"]').click();
            await checkPopup(calendar, 'Docked calendar at 840px');
            await revealFrame();
            await frame.getByRole('button', { name: 'Next month', exact: true }).click();
            await page.screenshot({ animations: 'disabled', path: `${captures}/datepicker-docked-840.png` });
          }
        } else {
          await panel.choose(page, 'animation', 'fade');
          const dialog = frame.getByRole('dialog').or(frame.getByRole('alertdialog'));
          await checkPopup(dialog, label);
          await revealFrame();
          if (width === 840) await page.screenshot({ animations: 'disabled', path: `${captures}/dialog-open-840.png` });
          await frame.getByRole('button', { name: 'Agree', exact: true }).click();
          await dialog.waitFor({ state: 'hidden' });
          await panel.waitForSwitch(page, 'open', false);
        }

        const iframe = await page.locator('#preview').elementHandle();
        const originalForm = await form.elementHandle();
        const state = await form.evaluate(element => JSON.stringify([...new FormData(element as HTMLFormElement)]));
        await codeTab.click();
        await copy.click();
        await page.getByRole('status').filter({ hasText: 'Code copied' }).waitFor();
        const copied = await page.evaluate(() => navigator.clipboard.readText());
        assert(copied === await code.textContent(), `${label}: the copied code differs from the highlighted code`);
        if (slug === 'button' && width === 840) {
          const scrollable = await page.locator('#code-panel').evaluate(element => element.scrollWidth > element.clientWidth);
          assert(scrollable, '840px: long code does not scroll inside the code panel');
          await page.screenshot({ animations: 'disabled', path: `${captures}/button-code-840.png` });
        }
        await page.setViewportSize({ width: width < 840 ? 1024 : 390, height: 620 });
        assert(await iframe?.evaluate(node => document.querySelector('#preview') === node)
          && await originalForm?.evaluate(node => document.querySelector('#configuration') === node), `${label}: resize replaced the preview iframe or form`);
        assert(await form.evaluate(element => JSON.stringify([...new FormData(element as HTMLFormElement)])) === state, `${label}: resize lost configuration`);
        assert(await page.locator('#code-panel').isVisible() && await code.textContent() === copied, `${label}: resize lost the selected view or framework`);
        await page.setViewportSize({ width, height });
        await live.click();
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ animations: 'disabled', path: `${captures}/${slug}-${width}.png` });
      }
    }
    // One framework chips row per page, never in the preview card. On a component's tabs it
    // heads the content (beside the Overview's presentation, at the top right of Develop);
    // on a Showcase example it sits under the title and description, 20px and 18px apart.
    for (const [label, path] of [['component', 'components/button/'], ['develop', 'components/button/develop/'], ['showcase', 'showcase/settings/']] as const) {
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(new URL(path, base).href);
        await page.locator('#content h1').waitFor();
        const place = await page.evaluate(() => {
          const rows = [...document.querySelectorAll('.framework-chips-row')];
          const h1 = document.querySelector('h1')!.getBoundingClientRect();
          const rowEl = rows[0]!;
          const row = rowEl.getBoundingClientRect();
          const intro = [...document.querySelectorAll('p')].find(p => p.getBoundingClientRect().bottom <= row.top + 1 && p.getBoundingClientRect().top > h1.top);
          let next = rowEl.nextElementSibling;
          while (next && next.getBoundingClientRect().height === 0) next = next.nextElementSibling;
          return { count: rows.length, afterTitle: row.top >= h1.bottom, gap: intro ? Math.round(row.top - intro.getBoundingClientRect().bottom) : -1, below: next ? Math.round(next.getBoundingClientRect().top - row.bottom) : -1, inPreview: !!rowEl.closest('.preview-panel') };
        });
        assert(place.count === 1 && place.afterTitle && !place.inPreview, `${label} at ${width}px: not one chips row after the title, outside the preview (${JSON.stringify(place)})`);
        if (label === 'showcase') assert(place.gap === 20 && place.below === 18, `showcase at ${width}px: the chips row does not keep its 20px/18px gaps (${JSON.stringify(place)})`);
      }
    }
    // Keyboard: on a component's tabs the chips come right after the tab bar.
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const path of ['components/button/', 'components/button/develop/']) {
      await page.goto(new URL(path, base).href);
      await page.locator('.component-tabs a').last().focus();
      for (let i = 0; i < 4; i++) {
        await page.keyboard.press('Tab');
        if (await page.evaluate(() => document.activeElement?.closest('.framework-chips-row') !== null)) break;
      }
      assert(await page.evaluate(() => document.activeElement?.closest('.framework-chips-row') !== null), `${path}: the framework chips are not reachable right after the tabs`);
    }
    await page.goto(new URL('showcase/settings/', base).href);
    await page.evaluate(() => (document.querySelector('h1') as HTMLElement).setAttribute('tabindex', '-1'));
    await page.locator('#content h1').focus();
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      if (await page.evaluate(() => document.activeElement?.closest('.framework-chips-row') !== null)) break;
    }
    assert(await page.evaluate(() => document.activeElement?.closest('.framework-chips-row') !== null), 'showcase: the framework chips are not reachable right after the heading');
    assert(errors.length === 0, errors.join('\n'));
    console.log('Playground reflow checks passed at 360, 390, 412, 700, 840, 1024 and 1440px.');
  } finally {
    await page.close();
  }
}
