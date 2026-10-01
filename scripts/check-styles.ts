// The Styles pages in a browser: the Color page swaps theme and mode from its JSON and
// shares the playground's appearance key, the Typography sample text updates every
// row, copy buttons copy, a Shape step edit reaches the gallery and the live preview, a
// share link and the exported CSS carry it, the expressive shapes draw and the morph
// respects reduced motion, the preview's dialog closes with Escape, and
// every page fits a 375 px phone in both site themes.
// BASE_URL checks a running server; without it the check serves the site itself.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { inflateSync } from 'node:zlib';
import { THEME_ROLES, argbFromRgba, seedsFromPixels, themeColors, type VariantName } from '../src/shared/theme-engine';
import { contrastRatio } from '../src/shared/color';

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
  const themeSelect = page.locator('.theme-app__controls .mtrl-select').first();
  const variantSelect = page.locator('.theme-app__controls .mtrl-select').nth(1);
  const themeValue = () => themeSelect.locator('input').inputValue();
  const pickTheme = async (label: string) => {
    const item = page.locator('.mtrl-menu').getByText(label, { exact: true });
    await themeSelect.click();
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
  await until(() => page.locator('.theme-app__note').textContent().then(text => !!text?.startsWith('Original colours set by hand; variants generated from #')), true, 'A hand-made theme says its colours are set by hand, and where its variants come from');
  // Ten switches: listeners and elements stay flat, and a switch paints within a frame.
  const counts = () => page.evaluate(() => ({ listeners: (window as unknown as { __listeners: number }).__listeners, nodes: document.getElementsByTagName('*').length }));
  const before = await counts();
  const names = ['Desert', 'Summer', 'Ocean', 'Brownbeige', 'Forest', 'Baseline', 'Sageivory', 'Autumn', 'Tealcaramel', 'Ocean'];
  for (const name of names) { await pickTheme(name); await until(themeValue, name, `The select shows ${name}`); }
  const after = await counts();
  console.log(`Ten theme switches: listeners ${before.listeners} → ${after.listeners}, elements ${before.nodes} → ${after.nodes}`);
  assert(after.listeners === before.listeners && after.nodes <= before.nodes, `Ten theme switches add no listener and no element: ${JSON.stringify(before)} → ${JSON.stringify(after)}`);
  const switchMs = await page.evaluate(async () => {
    const app = (window as unknown as { themeApp: { state: { set(key: string, value: unknown): void } } }).themeApp;
    // From the change to its colours computed and laid out: the work the next frame waits on.
    const work: number[] = [];
    for (const name of ['desert', 'summer', 'sageivory', 'forest', 'tealcaramel', 'ocean']) {
      const start = performance.now();
      app.state.set('theme', name);
      // The repaint runs once the scheme is worked out: microtasks, no frame.
      for (let i = 0; i < 5; i++) await Promise.resolve();
      document.body.getBoundingClientRect();
      getComputedStyle(document.querySelector('[data-role="primary"]')!).backgroundColor;
      work.push(performance.now() - start);
    }
    return { work: Math.max(...work) };
  });
  assert(switchMs.work < 16, `A theme switch's work fits in a frame: ${switchMs.work.toFixed(1)} ms`);
  console.log(`Theme switch: ${switchMs.work.toFixed(1)} ms of work (script, style, layout), worst of six`);
  await page.goto(shared);
  await until(themeValue, 'Desert', 'The ?theme= link opens desert again');
  await until(() => lightPrimary.getAttribute('data-hex'), await shown(), 'with its colours');
  await lightPrimary.click();
  await until(() => page.locator('.mtrl-snackbar').first().textContent().then(text => text?.trim()), `Copied ${await shown()}`, 'mtrl\'s snackbar says the hex was copied');
  assert(await page.evaluate(() => navigator.clipboard.readText()) === await shown(), 'The clipboard holds the hex');
  // Hover, as MTB: a copy icon on the tile and mtrl's tooltip "Copy hex color"; the
  // keyboard: a tile takes focus and Enter copies.
  const secondaryTile = page.locator('.md3-scheme-card [data-role="secondary"]');
  await secondaryTile.hover();
  await until(() => secondaryTile.locator('.md3-scheme-tile__copy').evaluate(element => getComputedStyle(element).opacity), '1', 'A hovered tile shows its copy icon');
  await until(() => page.locator('.mtrl-tooltip').filter({ hasText: 'Copy hex color' }).isVisible(), true, 'and the tooltip Copy hex color');
  await page.evaluate(() => navigator.clipboard.writeText(''));
  await page.locator('.md3-scheme-card [data-role="tertiary"]').focus();
  await page.keyboard.press('Enter');
  const tertiaryHex = await page.locator('.md3-scheme-card [data-role="tertiary"]').getAttribute('data-hex');
  await until(() => page.evaluate(() => navigator.clipboard.readText()), tertiaryHex, 'Enter on a focused tile copies its hex');
  await page.mouse.move(0, 0);
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
  // Download: desert's CSS holds every THEME_ROLES token, light and dark, as mtrl's
  // shipped desert.css has them; the SCSS is mtrl's create-theme form; the JSON parses.
  const downloadAs = async (format: string) => {
    const download = page.waitForEvent('download');
    await page.locator('.theme-app__actions [name="download"]').click();
    const item = page.locator('.mtrl-menu').getByText(format, { exact: true });
    await item.waitFor({ state: 'visible' });
    await item.click();
    const file = await download;
    await page.locator('.mtrl-menu--visible').waitFor({ state: 'detached' });
    return { name: file.suggestedFilename(), text: await Bun.file((await file.path())!).text() };
  };
  const cssFile = await downloadAs('CSS');
  assert(cssFile.name === 'mtrl-theme-desert.css', `The CSS is named for the theme: ${cssFile.name}`);
  const blockOf = (text: string, selector: string) => text.slice(text.indexOf(`${selector} {`), text.indexOf('}', text.indexOf(`${selector} {`)));
  const lightBlock = blockOf(cssFile.text, '[data-theme="desert"]');
  const darkBlock = blockOf(cssFile.text, '[data-theme="desert"][data-theme-mode="dark"]');
  for (const role of THEME_ROLES) {
    const value = (block: string) => new RegExp(`--mtrl-sys-color-${role}: (#[0-9a-f]{6});`).exec(block)?.[1];
    assert(value(lightBlock) === declared(themeCss, role), `Downloaded light ${role}: ${value(lightBlock)}, desert.css has ${declared(themeCss, role)}`);
    assert(value(darkBlock) === declaredDark(role), `Downloaded dark ${role}: ${value(darkBlock)}, desert.css has ${declaredDark(role)}`);
  }
  const scss = await downloadAs('SCSS');
  assert(scss.name === 'mtrl-theme-desert.scss' && scss.text.includes('@include create-theme("desert")') && scss.text.includes(`--#{$prefix}-sys-color-primary: ${desertPrimary};`), 'The SCSS is mtrl\'s create-theme form');
  const json = await downloadAs('JSON');
  const tokens = JSON.parse(json.text);
  assert(json.name === 'mtrl-theme-desert.json' && tokens.seed === '#9a7a3e' && tokens.variant === 'tonal-spot' && tokens.light.primary.$value === desertPrimary && Object.keys(tokens.dark).length === THEME_ROLES.length, 'The JSON has the seed, the variant and every role');
  console.log(`Download: ${cssFile.name}, ${scss.name} and ${json.name}, ${THEME_ROLES.length} roles light and dark, equal to desert.css`);

  // The axes: the theme select lists themes (seeds), not mtrl's variant themes; the
  // variant and contrast regenerate the scheme from the theme's seed.
  const roleHex = (css: string, role: string, mode: string) => {
    const at = css.indexOf('[data-theme-mode=dark]');
    const part = mode === 'light' ? css.slice(0, at) : css.slice(at);
    return [...part.matchAll(new RegExp(`--mtrl-sys-color-${role}:\\s*(#[0-9a-f]{6})`, 'gi'))].at(-1)?.[1]?.toLowerCase();
  };
  const tiles = () => page.locator('.md3-scheme-card [data-role]').evaluateAll(elements => Object.fromEntries(elements.map(element => [(element as HTMLElement).dataset.role!, (element as HTMLElement).dataset.hex!])));
  const pickVariant = async (label: string) => {
    const item = page.locator('.mtrl-menu').getByText(label, { exact: true });
    await variantSelect.click();
    await item.waitFor({ state: 'visible' });
    await item.click();
    await item.waitFor({ state: 'hidden' });
  };
  const setContrast = (label: string) => page.locator(`.theme-app__controls [aria-label="${label} contrast"]`).click();
  await themeSelect.click();
  await page.locator('.mtrl-menu--visible .mtrl-menu__item-text').first().waitFor({ state: 'visible' });
  const listed = await page.locator('.mtrl-menu--visible .mtrl-menu__item-text').allTextContents();
  await page.keyboard.press('Escape');
  await page.locator('.mtrl-menu--visible').waitFor({ state: 'detached' });
  const VARIANT_THEMES: [string, string][] = [['neutral', 'Neutral'], ['vibrant', 'Vibrant'], ['expressive', 'Expressive'], ['fidelity', 'Fidelity'], ['content', 'Content'], ['monochrome', 'Monochrome'], ['rainbow', 'Rainbow'], ['fruit-salad', 'Fruit Salad']];
  assert(listed.includes('Desert') && listed.includes('Ocean') && !VARIANT_THEMES.some(([, label]) => listed.includes(label)), `The theme select lists themes, not variants: ${listed.join(', ')}`);
  // Baseline × each variant is mtrl's shipped variant theme, every role.
  await pickTheme('Baseline');
  const mode = (await siteMode()) === 'light' ? 'light' : 'dark';
  for (const [name, label] of VARIANT_THEMES) {
    await pickVariant(label);
    const shipped = await (await fetch(`${base}/dist/mtrl/themes/${name}.css`)).text();
    await until(() => tiles().then(shown => shown.primary), roleHex(shipped, 'primary', mode), `Baseline × ${label} shows ${name}'s primary`);
    const shown = await tiles();
    for (const role of THEME_ROLES) if (shown[role] !== undefined) assert(shown[role] === roleHex(shipped, role, mode), `Baseline × ${label}: ${role} ${shown[role]}, mtrl's ${name}.css has ${roleHex(shipped, role, mode)}`);
  }
  await pickVariant('Tonal Spot');
  // Desert × High: every text pair at 7:1 or more.
  await pickTheme('Desert');
  await setContrast('High');
  const desertHigh = themeColors({ source: '#9a7a3e', variant: 'tonal-spot', contrast: 1, core: { secondary: '#4a87c4' } }).roles[mode];
  await until(() => tiles().then(shown => shown.primary), desertHigh.primary, 'High contrast regenerates desert');
  const TEXT_PAIRS = [
    ...['primary', 'secondary', 'tertiary', 'error'].flatMap(group => [[`on-${group}`, group], [`on-${group}-container`, `${group}-container`]]),
    ...['surface', 'surface-dim', 'surface-bright', 'surface-container-lowest', 'surface-container-low', 'surface-container', 'surface-container-high', 'surface-container-highest'].map(surface => ['on-surface', surface]),
    ['on-surface-variant', 'surface'], ['inverse-on-surface', 'inverse-surface'],
  ];
  const shownHigh = await tiles();
  const weak = TEXT_PAIRS.map(([ink, fill]) => [ink, fill, contrastRatio(shownHigh[ink!]!, shownHigh[fill!]!)!] as const).filter(([, , ratio]) => ratio < 7);
  assert(!weak.length, `Desert × High: text pairs under 7:1: ${weak.map(([ink, fill, ratio]) => `${ink} on ${fill} ${ratio.toFixed(2)}`).join(', ')}`);
  console.log(`Desert × High: ${TEXT_PAIRS.length} text pairs, all at 7:1 or more (lowest ${Math.min(...TEXT_PAIRS.map(([ink, fill]) => contrastRatio(shownHigh[ink!]!, shownHigh[fill!]!)!)).toFixed(2)}:1)`);
  // The address round-trips the three axes.
  await pickVariant('Vibrant');
  await until(() => page.evaluate(() => location.search), '?theme=desert&variant=vibrant&contrast=high', 'The address carries theme, variant and contrast');
  await page.reload();
  const desertVibrantHigh = themeColors({ source: '#9a7a3e', variant: 'vibrant' as VariantName, contrast: 1, core: { secondary: '#4a87c4' } }).roles[mode];
  await until(() => tiles().then(shown => shown.primary), desertVibrantHigh.primary, 'The link reopens desert × Vibrant × High');
  assert(await variantSelect.locator('input').inputValue() === 'Vibrant' && await page.locator('.theme-app__controls [aria-label="High contrast"]').getAttribute('aria-pressed') !== 'false', 'with the controls set');
  const roundTrip = await tiles();
  for (const role of THEME_ROLES) if (roundTrip[role] !== undefined) assert(roundTrip[role] === desertVibrantHigh[role], `desert × Vibrant × High ${role}: ${roundTrip[role]}, the engine gives ${desertVibrantHigh[role]}`);
  await pickVariant('Tonal Spot');
  await setContrast('Standard');
  // A hand-made theme: Original is mtrl's ocean.css; Vibrant is generated from its light primary.
  const oceanCss = await (await fetch(`${base}/dist/mtrl/themes/ocean.css`)).text();
  await pickTheme('Ocean');
  await until(() => variantSelect.locator('input').inputValue(), 'Original', 'Ocean opens on Original');
  const original = await tiles();
  // Every role ocean.css declares; the rest it inherits from mtrl's baseline, as the page does.
  const declaredRoles = THEME_ROLES.filter(role => original[role] !== undefined && roleHex(oceanCss, role, mode) !== undefined);
  assert(declaredRoles.length >= 25, `ocean.css declares its own roles: ${declaredRoles.length}`);
  for (const role of declaredRoles) assert(original[role] === roleHex(oceanCss, role, mode), `Ocean Original ${role}: ${original[role]}, ocean.css has ${roleHex(oceanCss, role, mode)}`);
  const oceanSeed = roleHex(oceanCss, 'primary', 'light')!;
  assert((await variantSelect.textContent())?.includes(`variants generated from ${oceanSeed}`), 'The variant select says where the variants come from');
  await pickVariant('Vibrant');
  const oceanVibrant = themeColors({ source: oceanSeed, variant: 'vibrant' as VariantName, contrast: 0 }).roles[mode];
  await until(() => tiles().then(shown => shown.primary), oceanVibrant.primary, 'Ocean × Vibrant is generated from ocean\'s light primary');
  const generated = await tiles();
  for (const role of THEME_ROLES) if (generated[role] !== undefined) assert(generated[role] === oceanVibrant[role], `Ocean × Vibrant ${role}: ${generated[role]}, the engine gives ${oceanVibrant[role]} from ${oceanSeed}`);
  await pickVariant('Original');
  await pickTheme('Desert');
  console.log(`Axes: 8 variant themes off the theme list; baseline × each equals mtrl's CSS; ocean Original equals ocean.css, ocean × Vibrant generated from ${oceanSeed}; ?theme=desert&variant=vibrant&contrast=high round-trips`);

  // A theme from an image: the fixture's seed, found here by the same engine from its
  // own pixels, is the one the app shows, with the engine's primary; ?seed= reproduces it.
  const fixture = resolve(import.meta.dir, '../test/fixtures/theme-image.png');
  const png = await Bun.file(fixture).bytes();
  const width = new DataView(png.buffer).getUint32(16), height = new DataView(png.buffer).getUint32(20);
  const raw = inflateSync(png.subarray(41, 41 + new DataView(png.buffer).getUint32(33)));
  const rgba: number[] = [];
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) { const i = y * (width * 3 + 1) + 1 + x * 3; rgba.push(raw[i]!, raw[i + 1]!, raw[i + 2]!, 255); }
  const imageSeed = seedsFromPixels(argbFromRgba(rgba))[0]!;
  const imageTheme = themeColors({ source: imageSeed, variant: 'tonal-spot', contrast: 0 });
  const chooser = page.waitForEvent('filechooser');
  await page.locator('.theme-app__actions [name="image"]').click();
  await (await chooser).setFiles(fixture);
  await until(() => page.evaluate(() => new URL(location.href).searchParams.get('seed')), imageSeed.slice(1), 'The address carries the image\'s seed');
  const imagePrimary = async () => imageTheme.roles[(await siteMode()) === 'light' ? 'light' : 'dark'].primary;
  await until(() => lightPrimary.getAttribute('data-hex'), await imagePrimary(), 'The card shows the engine\'s primary for the image\'s seed');
  await until(themeValue, 'From image', 'The select shows From image');
  await until(() => page.locator('.mtrl-snackbar').last().textContent().then(text => text?.trim()), `Theme generated from theme-image.png · seed ${imageSeed}`, 'The snackbar names the file and the seed');
  assert(await page.locator('.md3-palette').first().isVisible(), 'and its palettes');
  const imageFile = await downloadAs('JSON');
  assert(imageFile.name === `mtrl-theme-seed-${imageSeed.slice(1)}.json` && JSON.parse(imageFile.text).seed === imageSeed, `A theme from an image downloads under its seed: ${imageFile.name}`);
  await page.goto(`${base}/styles/themes/?seed=${imageSeed.slice(1)}`);
  await until(() => lightPrimary.getAttribute('data-hex'), await imagePrimary(), '?seed= reproduces the theme');
  await until(themeValue, 'From image', 'with From image selected');
  // material-color-utilities loads with the first image, never with the page.
  const dist = resolve(import.meta.dir, '../dist');
  const graph = (entry: string, seen = new Set<string>()): Set<string> => {
    if (seen.has(entry)) return seen;
    seen.add(entry);
    for (const [, next] of readFileSync(resolve(dist, entry), 'utf8').matchAll(/(?:from|import)\s*"\.\/([^"]+\.js)"/g)) graph(next!, seen);
    return seen;
  };
  const firstLoad = graph('theme-app.js');
  const mcuMarker = 'material-color-utilities has no';
  assert(![...firstLoad].some(file => readFileSync(resolve(dist, file), 'utf8').includes(mcuMarker)), 'The Themes app\'s first-load JS has no material-color-utilities');
  const firstKb = [...firstLoad].reduce((sum, file) => sum + Bun.gzipSync(readFileSync(resolve(dist, file))).length, 0) / 1024;
  console.log(`Image theme: seed ${imageSeed}, primary ${await imagePrimary()}; first-load JS ${firstKb.toFixed(1)} KB gzip, no material-color-utilities`);
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
