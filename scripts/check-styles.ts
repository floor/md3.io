// The Styles pages in a browser: the Color page swaps theme and mode from its JSON and
// shares the playground's appearance key, the Typography sample text updates every
// row, copy buttons copy, a Shape step edit reaches the gallery and the live preview, a
// share link and the exported CSS carry it, the expressive shapes draw and the morph
// respects reduced motion, the preview's dialog closes with Escape, and
// every page fits a 375 px phone in both site themes.
// BASE_URL checks a running server; without it the check serves the site itself.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const server = process.env.BASE_URL ? null : Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: (await import('../server')).handleRequest });
const base = (process.env.BASE_URL ?? server!.url.href).replace(/\/$/, '');
const output = resolve(import.meta.dir, '../analysis/browser');
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
const PAGES = ['/styles/', '/styles/color/', '/styles/typography/', '/styles/shape/'];
/** Polls until `read` returns `want` (storage writes are throttled, corners transition). */
async function until<T>(read: () => Promise<T>, want: T, message: string) {
  let got: T | undefined;
  for (let i = 0; i < 50; i++) { got = await read(); if (got === want) return; await new Promise(resolve => setTimeout(resolve, 100)); }
  throw new Error(`${message}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
}
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark', reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] });
  // A count of live event listeners, for the Themes app's leak check.
  await context.addInitScript(() => {
    const scope = window as unknown as { __listeners: number };
    scope.__listeners = 0;
    const add = EventTarget.prototype.addEventListener;
    const remove = EventTarget.prototype.removeEventListener;
    const live = new WeakMap<object, Set<unknown>>();
    EventTarget.prototype.addEventListener = function (this: EventTarget, type: string, listener: unknown, options?: unknown) {
      const key = `${type}`;
      const set = live.get(this) ?? new Set();
      live.set(this, set);
      const id = [key, listener, typeof options === 'object' && options ? !!(options as { capture?: boolean }).capture : !!options];
      const tag = JSON.stringify([id[0], id[2]]);
      const entry = [...set].find(e => (e as unknown[])[0] === tag && (e as unknown[])[1] === listener);
      if (!entry && listener) { set.add([tag, listener]); scope.__listeners++; }
      return add.call(this, type, listener as EventListener, options as boolean);
    };
    EventTarget.prototype.removeEventListener = function (this: EventTarget, type: string, listener: unknown, options?: unknown) {
      const set = live.get(this);
      const tag = JSON.stringify([type, typeof options === 'object' && options ? !!(options as { capture?: boolean }).capture : !!options]);
      const entry = set && [...set].find(e => (e as unknown[])[0] === tag && (e as unknown[])[1] === listener);
      if (entry) { set!.delete(entry); scope.__listeners--; }
      return remove.call(this, type, listener as EventListener, options as boolean);
    };
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });

  // Color: theme and mode swap values client-side, and are remembered under the playground's key.
  console.log('Checking /styles/color/');
  await page.goto(`${base}/styles/color/`);
  const primary = page.locator('.swatch[data-role="primary"]');
  const hex = () => primary.locator('.swatch__hex').textContent();
  const background = () => primary.locator('.swatch__chip').evaluate(element => getComputedStyle(element).backgroundColor);
  const baselineLight = await hex();
  await page.getByLabel('Theme', { exact: true }).selectOption('ocean');
  const oceanLight = await hex();
  assert(oceanLight !== baselineLight, 'Choosing a theme changes the swatches');
  await page.locator('label.choice:has(input[value="dark"])').click();
  const oceanDark = await hex();
  assert(oceanDark !== oceanLight, 'Dark mode changes the swatches');
  const [r, g, b] = oceanDark!.slice(1).match(/../g)!.map(part => parseInt(part, 16));
  assert(await background() === `rgb(${r}, ${g}, ${b})`, 'The chip is painted with the hex it shows');
  assert(await page.locator('.color-group:has(.swatch[data-role="success"])').isVisible(), 'Ocean shows its extra roles');
  await until(() => page.evaluate(() => { const saved = JSON.parse(localStorage.getItem('md3-preview-appearance') || '{}'); return `${saved.theme} ${saved.mode}`; }), 'ocean dark', 'The choice is saved under the playground key');
  await page.reload();
  assert(await hex() === oceanDark, 'The saved theme and mode come back on reload');
  // The playground reads the same key.
  await page.goto(`${base}/components/button/`);
  assert(await page.locator('#preview-theme').inputValue() === 'ocean', 'The playground opens with the theme chosen on the Color page');
  await page.goto(`${base}/styles/color/`);
  await page.getByLabel('Theme', { exact: true }).selectOption('baseline');
  assert(await page.locator('.color-group:has(.swatch[data-role="success"])').isVisible(), 'Baseline shows the status roles (mtrl#291)');
  await page.locator('label.choice:has(input[value="light"])').click();
  // Keyboard: the theme select, then the mode radios, are reachable by Tab.
  await page.getByLabel('Theme', { exact: true }).focus();
  await page.keyboard.press('Tab');
  assert(await page.evaluate(() => (document.activeElement as HTMLInputElement | null)?.name) === 'color-mode', 'Tab reaches the mode control');
  await page.keyboard.press('ArrowRight');
  assert(await page.locator('input[name="color-mode"][value="dark"]').isChecked(), 'Arrow keys switch the mode');
  await page.locator('label.choice:has(input[value="light"])').click();
  // Copy.
  await primary.getByRole('button', { name: 'Copy var(--mtrl-sys-color-primary)' }).click();
  assert(await page.evaluate(() => navigator.clipboard.readText()) === 'var(--mtrl-sys-color-primary)', 'Copy copies the CSS variable');
  await page.getByRole('status').filter({ hasText: 'Copied' }).waitFor();

  // Typography: the sample text updates the body samples.
  console.log('Checking /styles/typography/');
  await page.goto(`${base}/styles/typography/`);
  await page.getByLabel('Sample text').fill('Hamburgefonstiv');
  const samples = await page.locator('.type-sample').allTextContents();
  assert(samples.length === 3 && samples.every(text => text === 'Hamburgefonstiv'), 'Every body sample shows the typed text');
  const size = await page.locator('.type-card[data-role="display-large"] .type-card__aa').evaluate(element => getComputedStyle(element).fontSize);
  assert(size === '57px', `Display large renders at mtrl's size, got ${size}`);
  await page.locator('.type-card[data-role="body-medium"]').getByRole('button', { name: 'Copy class mtrl-body-medium' }).click();
  assert(await page.evaluate(() => navigator.clipboard.readText()) === 'mtrl-body-medium', 'Copy copies the utility class');

  // Shape: editing a step reaches the components gallery and the live preview.
  console.log('Checking /styles/shape/');
  await page.goto(`${base}/styles/shape/`);
  await page.waitForLoadState('networkidle');
  const radiusOf = (frame: string, selector: string) => () => page.frameLocator(frame).locator(selector).first().evaluate(element => getComputedStyle(element).borderTopLeftRadius);
  const galleryCard = radiusOf('iframe.shape-gallery', '.gallery__step[data-step="medium"] .mtrl-card');
  const previewCard = radiusOf('[data-frame="theme"] iframe', '.screen__body > .mtrl-card');
  await until(galleryCard, '12px', 'The gallery card starts at mtrl\'s medium corner');
  assert(await page.locator('#styles-preview-toggle').getAttribute('aria-expanded') === 'false', 'The preview starts closed on the Shape page');
  const medium = page.locator('.shape-tile[data-step="medium"]');
  await medium.getByRole('button', { name: /^Edit medium/ }).click();
  await medium.getByLabel('Medium corner radius in px').fill('24');
  await until(galleryCard, '24px', 'Editing medium to 24px changes the gallery card');
  await until(previewCard, '24px', 'Editing medium to 24px changes the preview card');
  assert(await medium.locator('output').textContent() === '24px', 'The tile shows the new value');
  // Selecting a step outlines its components in the gallery.
  await medium.locator('.shape-tile__select').click();
  await until(() => page.frameLocator('iframe.shape-gallery').locator('.gallery__step--active').getAttribute('data-step'), 'medium', 'Selecting a step highlights its components');
  // The expressive shapes: all 35 of M3's drawn, and a morph that stays still under reduced motion.
  const paths = await page.locator('.shape-library__item path').evaluateAll(elements => elements.map(element => (element as SVGPathElement).getTotalLength()));
  assert(paths.length === 35 && paths.every(length => length > 50), `The shape gallery draws 35 non-empty paths, got ${paths.map(Math.round).join(', ')}`);
  assert(await page.locator('#shape-morph-toggle').getAttribute('aria-pressed') === 'false', 'The morph starts paused under reduced motion');
  const still = await page.locator('#shape-morph-path').getAttribute('d');
  await page.waitForTimeout(800);
  assert(await page.locator('#shape-morph-path').getAttribute('d') === still, 'The paused morph does not move');
  await page.locator('#shape-morph-toggle').click();
  await page.waitForTimeout(800);
  assert(await page.locator('#shape-morph-path').getAttribute('d') !== still, 'Play morphs the shape');
  await page.locator('#shape-morph-toggle').click();
  // Export: the CSS has the override; the share link restores it elsewhere.
  await page.getByRole('button', { name: 'Export theme' }).click();
  const css = await page.locator('#styles-export-css').textContent();
  assert(css!.includes('--mtrl-sys-shape-corner-medium: 24px;'), `The exported CSS overrides the medium corner:\n${css}`);
  assert(!css!.includes('--mtrl-sys-shape-corner-full'), 'The exported CSS leaves unchanged tokens out');
  const link = await page.locator('#styles-export-link').inputValue();
  assert(link.startsWith(`${base}/styles/?theme=`), `The share link points at the Styles overview, got ${link}`);
  await page.keyboard.press('Escape');
  assert(!await page.locator('#styles-export').isVisible(), 'Escape closes the export panel');
  const fresh = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const other = await fresh.newPage();
  await other.goto(link.replace('/styles/?', '/styles/shape/?'));
  await other.waitForLoadState('networkidle');
  assert(!other.url().includes('theme='), `The share link leaves the address bar, got ${other.url()}`);
  assert(await other.locator('.shape-tile[data-step="medium"] output').textContent() === '24px', 'A share link opened in a fresh browser restores medium');
  await until(() => other.frameLocator('iframe.shape-gallery').locator('.gallery__step[data-step="medium"] .mtrl-card').evaluate(element => getComputedStyle(element).borderTopLeftRadius), '24px', 'The shared theme reaches the gallery');
  await fresh.close();
  // The preview's dialog, preview opened: Book opens it, Escape closes it, focus goes back.
  await page.locator('#styles-preview-toggle').click();
  const preview = page.frameLocator('[data-frame="theme"] iframe');
  const book = preview.locator('.mtrl-card').getByRole('button', { name: 'Book' });
  await book.click();
  const dialog = preview.getByRole('alertdialog', { name: 'Book Lakeside cabin?' });
  await dialog.waitFor();
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  assert(await book.evaluate(element => element.ownerDocument.activeElement === element), 'Closing the preview dialog returns focus to Book');
  await page.locator('#styles-preview-toggle').click();
  await page.getByRole('button', { name: 'Reset shape' }).click();
  await until(galleryCard, '12px', 'Reset shape brings mtrl\'s corners back');

  // Themes: the app. mtrl's select picks a theme and the Scheme card shows the hex
  // mtrl's CSS has, ?theme=<name> follows and opens it again, a tile copies its hex with
  // mtrl's snackbar, a theme without a seed says why it has no palettes, ten switches
  // leave the listener count flat, a switch paints within a frame, and a phone does not
  // scroll sideways.
  console.log('Checking /styles/themes/');
  await page.goto(`${base}/styles/themes/`);
  const themeCss = await (await fetch(`${base}/dist/mtrl/themes/desert.css`)).text();
  const declared = (css: string, role: string) => [...css.slice(0, css.indexOf('[data-theme-mode=dark]')).matchAll(new RegExp(`--mtrl-sys-color-${role}:\\s*(#[0-9a-f]{6})`, 'gi'))].at(-1)?.[1]?.toLowerCase();
  const desertPrimary = declared(themeCss, 'primary')!;
  const darkCss = themeCss.slice(themeCss.indexOf('[data-theme-mode=dark]'));
  const declaredDark = (role: string) => [...darkCss.matchAll(new RegExp(`--mtrl-sys-color-${role}:\\s*(#[0-9a-f]{6})`, 'gi'))].at(-1)?.[1]?.toLowerCase();
  const desertDarkPrimary = declaredDark('primary')!;
  assert(desertDarkPrimary && desertDarkPrimary !== desertPrimary, 'desert has its own dark primary');
  // The card is in the site's mode: desert's primary for that mode.
  const shown = async () => (await page.evaluate(() => document.documentElement.dataset.themeMode)) === 'light' ? desertPrimary : desertDarkPrimary;
  // As a person does: open the select, wait for its menu, pick, and let the menu close.
  const pickTheme = async (label: string) => {
    const item = page.locator('.mtrl-menu').getByText(label, { exact: true });
    await page.locator('.theme-app .mtrl-select').click();
    await item.waitFor({ state: 'visible' });
    await item.click();
    await item.waitFor({ state: 'hidden' });
  };
  await pickTheme('Desert');
  assert(await page.locator('.md3-scheme-card').count() === 1, 'One Scheme card');
  const lightPrimary = page.locator('.md3-scheme-card [data-role="primary"]');
  await until(() => lightPrimary.getAttribute('data-hex'), await shown(), 'The card shows desert\'s primary, in the site\'s mode, from mtrl\'s CSS');
  const [pr, pg, pb] = (await shown()).slice(1).match(/../g)!.map(part => parseInt(part, 16));
  assert(await lightPrimary.evaluate(element => getComputedStyle(element).backgroundColor) === `rgb(${pr}, ${pg}, ${pb})`, 'The tile is painted with the hex it names');
  assert(await page.locator('.md3-scheme-card').first().locator('[data-role]').count() === 33, 'A scheme card has MTB\'s 33 tiles');
  assert(new URL(page.url()).searchParams.get('theme') === 'desert', 'The address carries ?theme=desert');
  assert(await page.locator('.theme-app__note').textContent().then(text => text?.includes('#9a7a3e')), 'Desert\'s palettes name its seed');
  assert(await page.locator('.md3-palette').count() === 6 && await page.locator('.md3-palette__tone').count() === 6 * 18, 'Six palettes of 18 tones');
  // Scrim and shadow, both black, stay apart.
  const scrim = (await page.locator('.md3-scheme-card [data-role="scrim"]').boundingBox())!;
  const shadow = (await page.locator('.md3-scheme-card [data-role="shadow"]').boundingBox())!;
  assert(shadow.x - (scrim.x + scrim.width) >= 4, 'A gap between scrim and shadow');
  // Share: the link opens the same theme, whatever this browser saved since.
  const shared = page.url();
  await pickTheme('Ocean');
  await until(() => page.locator('.theme-app__note').textContent().then(text => !!text?.includes('set by hand')), true, 'A theme without a seed says why it has no palettes');
  assert(!await page.locator('.theme-app__palette-list').isVisible(), 'and shows none');
  // Ten switches: listeners and elements stay flat, and a switch paints within a frame.
  const counts = () => page.evaluate(() => ({ listeners: (window as unknown as { __listeners: number }).__listeners, nodes: document.getElementsByTagName('*').length }));
  const before = await counts();
  const names = ['Desert', 'Summer', 'Ocean', 'Vibrant', 'Forest', 'Baseline', 'Rainbow', 'Autumn', 'Monochrome', 'Ocean'];
  for (const name of names) { await pickTheme(name); await until(() => page.locator('.mtrl-select input').inputValue(), name, `The select shows ${name}`); }
  const after = await counts();
  console.log(`Ten theme switches: listeners ${before.listeners} → ${after.listeners}, elements ${before.nodes} → ${after.nodes}`);
  assert(after.listeners === before.listeners && after.nodes <= before.nodes, `Ten theme switches add no listener and no element: ${JSON.stringify(before)} → ${JSON.stringify(after)}`);
  const switchMs = await page.evaluate(async () => {
    const app = (window as unknown as { themeApp: { state: { set(key: string, value: unknown): void } } }).themeApp;
    // From the change to its colours computed and laid out: the work the next frame waits on.
    const work: number[] = [];
    for (const name of ['desert', 'summer', 'vibrant', 'forest', 'rainbow', 'ocean']) {
      const start = performance.now();
      app.state.set('theme', name);
      document.body.getBoundingClientRect();
      getComputedStyle(document.querySelector('[data-role="primary"]')!).backgroundColor;
      work.push(performance.now() - start);
    }
    return { work: Math.max(...work) };
  });
  assert(switchMs.work < 16, `A theme switch's work fits in a frame: ${switchMs.work.toFixed(1)} ms`);
  console.log(`Theme switch: ${switchMs.work.toFixed(1)} ms of work (script, style, layout), worst of six`);
  await page.goto(shared);
  await until(() => page.locator('.mtrl-select input').inputValue(), 'Desert', 'The ?theme= link opens desert again');
  await until(() => lightPrimary.getAttribute('data-hex'), await shown(), 'with its colours');
  await lightPrimary.click();
  await until(() => page.locator('.mtrl-snackbar').first().textContent().then(text => text?.trim()), `Copied ${await shown()}`, 'mtrl\'s snackbar says the hex was copied');
  assert(await page.evaluate(() => navigator.clipboard.readText()) === await shown(), 'The clipboard holds the hex');
  // The site's mode: the app and its Scheme card follow the header's light/dark toggle,
  // repainting the card in place.
  const appBackground = () => page.locator('.theme-app').evaluate(element => getComputedStyle(element).backgroundColor);
  const siteMode = () => page.evaluate(() => document.documentElement.dataset.themeMode);
  const primaryFor = (mode: string | undefined) => (mode === 'light' ? desertPrimary : desertDarkPrimary);
  const toggleSite = () => page.locator('#theme-toggle').click();
  const card = page.locator('.md3-scheme-card');
  const cardBefore = await card.elementHandle();
  await until(() => lightPrimary.getAttribute('data-hex'), primaryFor(await siteMode()), 'The card is in the site\'s mode');
  const startBackground = await appBackground();
  await toggleSite();
  await until(() => lightPrimary.getAttribute('data-hex'), primaryFor(await siteMode()), 'Toggling the site\'s mode flips the card to desert\'s other primary from mtrl\'s CSS');
  await until(() => appBackground().then(value => value !== startBackground), true, 'and repaints the app');
  const [dr, dg, db] = primaryFor(await siteMode()).slice(1).match(/../g)!.map(part => parseInt(part, 16));
  assert(await lightPrimary.evaluate(element => getComputedStyle(element).backgroundColor) === `rgb(${dr}, ${dg}, ${db})`, 'and paints the tile with it');
  const darkNow = await siteMode() === 'dark';
  assert(await card.evaluate((element, dark) => element.classList.contains(dark ? 'md3-scheme-card--dark' : 'md3-scheme-card--light') && (getComputedStyle(element).boxShadow !== 'none') === dark, darkNow), 'The dark card is outlined, the light one filled');
  assert(await cardBefore!.evaluate(element => element.isConnected), 'The mode repaints the card in place');
  assert(!await page.locator('.theme-app__actions [name="mode"]').count(), 'The app has no mode button of its own');
  // Ten site toggles: listeners and elements stay flat.
  const beforeModes = await counts();
  for (let i = 0; i < 10; i++) {
    await toggleSite();
    await until(() => lightPrimary.getAttribute('data-hex'), primaryFor(await siteMode()), `Toggle ${i + 1} paints the ${await siteMode()} primary`);
  }
  await until(() => page.locator('.mtrl-ripple-wave').count(), 0, 'Ripple waves end');
  const afterModes = await counts();
  console.log(`Ten site mode toggles: listeners ${beforeModes.listeners} → ${afterModes.listeners}, elements ${beforeModes.nodes} → ${afterModes.nodes}`);
  assert(afterModes.listeners === beforeModes.listeners && afterModes.nodes <= beforeModes.nodes, `Ten site mode toggles add no listener and no element: ${JSON.stringify(beforeModes)} → ${JSON.stringify(afterModes)}`);
  await toggleSite();
  await page.setViewportSize({ width: 390, height: 844 });
  const themesOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert(themesOverflow <= 0, `/styles/themes/ scrolls sideways at 390 px by ${themesOverflow} px`);
  const errorTile = await page.locator('.md3-scheme-card [data-role="error"]').boundingBox();
  const surfaceTile = await page.locator('.md3-scheme-card [data-role="surface-dim"]').boundingBox();
  assert(errorTile!.y > surfaceTile!.y, 'At 390 px the Error column wraps under the main block');
  await page.screenshot({ animations: 'disabled', path: `${output}/styles-themes-390.png`, fullPage: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  // The app can be destroyed: its element empties and its popups go.
  await page.evaluate(() => (window as unknown as { themeApp: { destroy(): void } }).themeApp.destroy());
  assert(await page.locator('#theme-app').evaluate(element => element.childElementCount) === 0, 'destroy empties the app');
  await page.goto(`${base}/styles/color/`);
  await page.getByLabel('Theme', { exact: true }).selectOption('baseline');

  // Every page, 375 px wide, dark and light: no horizontal scroll, one swatch column.
  await page.setViewportSize({ width: 375, height: 800 });
  for (const mode of ['dark', 'light']) {
    await page.evaluate(value => localStorage.setItem('md3-site-mode', value), mode);
    for (const path of PAGES) {
      await page.goto(`${base}${path}`);
      await page.waitForLoadState('networkidle');
      assert(await page.evaluate(() => document.documentElement.dataset.themeMode) === mode, `${path} is in site ${mode} mode`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert(overflow <= 0, `${path} scrolls sideways at 375 px (${mode}) by ${overflow} px`);
      // The preview opens as a panel at the bottom, still without sideways scroll.
      const toggle = page.locator('#styles-preview-toggle');
      assert(await toggle.isVisible(), `${path} has a Preview toggle at 375 px`);
      if (await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
      assert(await page.locator('[data-frame="theme"] iframe').isVisible(), `${path}: the toggle opens the preview`);
      const openOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert(openOverflow <= 0, `${path} scrolls sideways at 375 px with the preview open (${mode}) by ${openOverflow} px`);
      await toggle.click();
      if (path === '/styles/color/') {
        const lefts = await page.locator('.color-group:first-of-type .swatch').evaluateAll(elements => elements.map(element => Math.round(element.getBoundingClientRect().left)));
        assert(new Set(lefts).size === 1, `Swatches collapse to one column at 375 px, got lefts ${lefts.join(', ')}`);
      }
      await page.screenshot({ animations: 'disabled', path: `${output}/styles-${path.split('/').filter(Boolean).join('-')}-375-${mode}.png`, fullPage: false });
    }
  }
  assert(!errors.length, `Browser errors:\n${errors.join('\n')}`);
  console.log('Styles pages: Themes app (mtrl select, cards from mtrl CSS, ?theme= link, snackbar copy, palettes, one Scheme card that follows the site mode in place, flat listeners over 10 switches and 10 site mode toggles, a switch within a frame, destroy, 390 px), theme and mode swap, shared appearance key, sample text, copy, shape step edits in the gallery and preview, shape library and morph, export CSS, share link, preview dialog, 375 px in both site themes.');
} finally {
  await browser.close();
  server?.stop();
}
