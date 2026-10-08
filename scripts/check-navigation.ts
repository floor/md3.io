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
    try { await page.locator('#playground-status').filter({ hasText: 'Configuration reset' }).waitFor(); }
    catch (error) { console.log('Reset status:', await page.locator('#playground-status').textContent(), errors); throw error; }
  };
  const selected = (value: string) => page.waitForFunction(value => document.querySelector<HTMLSelectElement>('#configuration [name="active"]')?.value === value, value);
  for (const slug of componentSlugs.filter(slug => components[slug].group === 'Navigation' && (!process.argv[2] || slug === process.argv[2]))) {
    console.log(`Checking ${slug}`);
    await page.goto(`${server.url}components/${slug}/`);
    await frame.locator('#stage > *').first().waitFor();
    await page.screenshot({ path: `${output}/${slug}-desktop.png`, fullPage: true, animations: 'disabled' });
    if (slug === 'navigation-rail') {
      await frame.getByRole('button', { name: 'Favorites', exact: true }).click();
      await selected('favorites');
      await frame.getByRole('button', { name: 'Expand navigation', exact: true }).click();
      await page.waitForFunction(() => document.querySelector<HTMLInputElement>('#configuration [name="expanded"]')?.checked);
      await choose('layout', 'modal');
      await frame.locator('dialog[open]').waitFor();
      await frame.locator('dialog').press('Escape');
      await page.waitForFunction(() => !document.querySelector<HTMLInputElement>('#configuration [name="expanded"]')?.checked);
      await frame.getByRole('button', { name: 'Open navigation', exact: true }).click();
      await frame.locator('dialog[open]').waitFor();
      await reset();
      await frame.locator('dialog[open]').waitFor({ state: 'hidden' });
      // The collapsed clock rail used to keep the extended FAB and clip "Add timer".
      const compactFits = async (where: string) => {
        await page.waitForFunction(() => !document.querySelector<HTMLInputElement>('#configuration [name="expanded"]')?.checked);
        await page.waitForFunction(() => {
          const rail = document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelector('.mtrl-navigation-rail');
          return !!rail && rail.getBoundingClientRect().width <= 120;
        });
        await frame.getByText('Add timer', { exact: true }).waitFor({ state: 'hidden' });
        const fit = await frame.getByRole('button', { name: 'Add timer', exact: true }).evaluate(fab => {
          const rail = fab.closest('.mtrl-navigation-rail');
          if (!(rail instanceof HTMLElement)) return null;
          const railBox = rail.getBoundingClientRect();
          const fabBox = fab.getBoundingClientRect();
          return {
            compact: fab.classList.contains('mtrl-fab') && !fab.classList.contains('mtrl-extended-fab'),
            inside: fabBox.width > 0 && fabBox.left >= railBox.left - 1 && fabBox.right <= railBox.right + 1 && fabBox.top >= railBox.top - 1 && fabBox.bottom <= railBox.bottom + 1,
          };
        });
        assert(fit?.compact && fit.inside, `${where}: the header is the compact FAB inside the rail`);
      };
      await page.locator('#scenario').selectOption('expanded-clock');
      await frame.getByText('Add timer', { exact: true }).waitFor();
      await toggle('expanded');
      await compactFits('expanded-clock, Expanded off');
      await toggle('expanded');
      await frame.getByText('Add timer', { exact: true }).waitFor();
      await frame.getByRole('button', { name: 'Collapse navigation', exact: true }).click();
      await compactFits('expanded-clock, menu button');
      await frame.getByRole('button', { name: 'Expand navigation', exact: true }).click();
      await frame.getByText('Add timer', { exact: true }).waitFor();
    } else if (slug === 'navigation-bar') {
      await frame.getByRole('button', { name: 'Favorites', exact: true }).click();
      await selected('favorites');
      const show = async (id: string) => { await page.locator('#scenario').selectOption(id); };
      await show('unread-nav-bar');
      await frame.getByRole('button', { name: 'Mail, 999+', exact: true }).waitFor();
      await frame.getByRole('button', { name: 'Chat, 10', exact: true }).waitFor();
      await frame.getByRole('button', { name: 'Rooms, New activity', exact: true }).waitFor();
      await frame.getByRole('button', { name: 'Meet, 3', exact: true }).waitFor();
      let source = await page.locator('#generated-code').textContent() ?? '';
      assert(source.includes('"999+"') && source.includes('badge: true'), 'Unread bar: the code lost a badge');
      await frame.getByRole('button', { name: 'Chat, 10', exact: true }).click();
      await selected('chat');
      await show('new-in-music');
      await frame.getByRole('button', { name: 'Home', exact: true }).waitFor();
      await frame.getByRole('button', { name: 'Music, New activity', exact: true }).waitFor();
      await frame.getByRole('button', { name: 'Explore', exact: true }).waitFor();
      await selected('music');
      await show('ten-in-music');
      await frame.getByRole('button', { name: 'Home', exact: true }).waitFor();
      await frame.getByRole('button', { name: 'Music, 10', exact: true }).waitFor();
      await selected('home');
      source = await page.locator('#generated-code').textContent() ?? '';
      assert(source.includes('"10"') && source.includes('activeIcon'), 'Ten in music: the count or the filled Home icon is not in the code');
      await choose('itemLayout', 'horizontal');
      source = await page.locator('#generated-code').textContent() ?? '';
      assert(source.includes('horizontal'), 'Horizontal layout is not in the code');
      assert(await page.locator('#configuration [name="hideOnScroll"]').count() === 0, 'Hide on scroll is a control');
    } else if (slug === 'drawer') {
      await frame.getByText('Favorites', { exact: true }).click();
      await selected('favorites');
      await choose('variant', 'modal');
      await frame.locator('.mtrl-drawer--modal.mtrl-drawer--open').waitFor();
      // Born open, the drawer marks itself open immediately, then takes the page
      // (and focus) on the next frame. Escape dismisses it only after that.
      await page.waitForFunction(() => {
        const drawer = document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelector('.mtrl-drawer--modal.mtrl-drawer--open');
        const active = drawer?.ownerDocument.activeElement;
        return !!drawer && drawer.getAttribute('aria-hidden') === 'false' && !!active && (drawer === active || drawer.contains(active));
      });
      await frame.getByText('Favorites', { exact: true }).focus();
      await frame.getByText('Favorites', { exact: true }).press('Escape');
      await page.waitForFunction(() => !document.querySelector<HTMLInputElement>('#configuration [name="open"]')?.checked);
      await frame.getByRole('button', { name: 'Open drawer' }).click();
      await page.waitForFunction(() => document.querySelector<HTMLInputElement>('#configuration [name="open"]')?.checked);
    } else if (slug === 'tabs') {
      assert(await frame.getByRole('tab').evaluateAll(tabs => tabs.every(tab => Math.abs(tab.getBoundingClientRect().top - tabs[0]!.getBoundingClientRect().top) < 1)), 'Fixed tabs should share one horizontal row');
      await frame.getByRole('tab', { name: 'Favorites', exact: true }).click();
      await selected('favorites');
      await frame.getByRole('tab', { name: 'Favorites', exact: true }).press('ArrowLeft');
      await frame.getByRole('tab', { name: 'Inbox', exact: true }).press('Enter');
      await selected('inbox');
      await choose('count', '6');
      await frame.getByRole('tab', { name: 'Archive', exact: true }).click();
      await selected('archive');
    } else if (slug === 'menu') {
      await frame.getByRole('button', { name: 'Open menu' }).click();
      await frame.getByRole('menuitem', { name: 'Save', exact: true }).click();
      await page.locator('#playground-status').filter({ hasText: /Selected: Save|Menu closed/ }).waitFor();
      await frame.locator('.mtrl-menu').first().waitFor({ state: 'hidden' });
      await toggle('submenu');
      await frame.getByRole('button', { name: 'Open menu' }).click();
      await frame.getByRole('menuitem', { name: /Share/ }).press('ArrowRight');
      await frame.getByRole('menuitem', { name: 'Copy link', exact: true }).waitFor();
      await page.screenshot({ path: `${output}/menu-submenu.png`, fullPage: true, animations: 'disabled' });
      await frame.getByRole('menuitem', { name: 'Copy link', exact: true }).click();
      await page.locator('#playground-status').filter({ hasText: /Selected: Copy link|Menu closed/ }).waitFor();
    } else if (slug === 'top-app-bar') {
      await frame.getByRole('button', { name: 'Favorite', exact: true }).click();
      await page.locator('#playground-status').filter({ hasText: 'Favorite clicked' }).waitFor();
      await choose('type', 'large');
      await toggle('scrolled');
      await frame.locator('.mtrl-top-app-bar--scrolled').waitFor();
    } else if (slug === 'bottom-app-bar') {
      await frame.getByRole('button', { name: 'Compose', exact: true }).click();
      await page.locator('#playground-status').filter({ hasText: 'Compose clicked' }).waitFor();
      await toggle('hasFab');
      await frame.getByRole('button', { name: 'Compose', exact: true }).waitFor({ state: 'hidden' });
      await toggle('visible');
      await frame.locator('.mtrl-bottom-app-bar--hidden').waitFor({ state: 'attached' });
      await toggle('visible');
      await frame.locator('.mtrl-bottom-app-bar--hidden').waitFor({ state: 'detached' });
    }
    await reset();
    if (slug === 'menu') {
      await frame.getByRole('button', { name: 'Open menu' }).click();
      await frame.locator('.mtrl-menu').first().waitFor();
      await reset();
      await frame.locator('.mtrl-menu').waitFor({ state: 'detached' });
    }
    if (components[slug].controls.some(control => control.key === 'disableSent')) {
      await choose('active', 'sent');
      await toggle('disableSent');
      await selected('inbox');
      await page.waitForFunction(() => !!document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelector(':disabled, [aria-disabled="true"]'));
    }
    for (const key of ['variant', 'layout', 'position', 'type', 'fabPosition']) {
      const control = components[slug].controls.find(control => control.key === key);
      for (const option of control?.options || []) {
        await choose(key, option);
        await frame.locator('#stage > *').first().waitFor();
        if (slug === 'menu' && key === 'variant') {
          await frame.getByRole('button', { name: 'Open menu' }).click();
          const menu = frame.locator('.mtrl-menu').first();
          await menu.waitFor();
          assert(await menu.evaluate(element => element.classList.contains('mtrl-menu--vertical')) === (option !== 'baseline'), `${option}: wrong menu layout`);
          assert(await menu.evaluate(element => element.classList.contains('mtrl-menu--vibrant')) === (option === 'vibrant'), `${option}: wrong menu color`);
          assert(await menu.locator('.mtrl-menu__group').count() === (option === 'gap' ? 2 : 0), `${option}: wrong grouping`);
          if (option === 'gap') {
            const groups = menu.locator('.mtrl-menu__group');
            const first = await groups.nth(0).boundingBox();
            const second = await groups.nth(1).boundingBox();
            assert(first && second && second.y > first.y + first.height, 'Gap groups must have visible separation');
            await page.screenshot({ path: `${output}/menu-gap.png`, fullPage: true, animations: 'disabled' });
            assert((await page.locator('#generated-code').textContent())?.includes('type: "gap"'), 'Gap missing from generated code');
          }
          await menu.press('Escape');
          await menu.waitFor({ state: 'hidden' });
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
    await page.screenshot({ path: `${output}/${slug}-mobile.png`, fullPage: true, animations: 'disabled' });
    if (slug === 'top-app-bar') {
      await choose('type', 'center');
      await choose('actions', '2');
      await frame.getByRole('button', { name: 'Bookmark' }).waitFor();
      await page.screenshot({ path: `${output}/${slug}-mobile-center.png`, fullPage: true, animations: 'disabled' });
    }
    if (slug === 'bottom-app-bar') {
      await choose('fabPosition', 'center');
      await choose('actions', '3');
      await frame.getByRole('button', { name: 'Share' }).waitFor();
      await page.screenshot({ path: `${output}/${slug}-mobile-center.png`, fullPage: true, animations: 'disabled' });
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    assert(errors.length === 0, errors.join('\n'));
  }
  console.log('Navigation browser checks passed.');
} finally {
  await browser.close();
  server.stop(true);
}
