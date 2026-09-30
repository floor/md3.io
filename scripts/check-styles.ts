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
  // The expressive shapes: 8 drawn paths, and a morph that stays still under reduced motion.
  const paths = await page.locator('.shape-library__item path').evaluateAll(elements => elements.map(element => (element as SVGPathElement).getTotalLength()));
  assert(paths.length === 8 && paths.every(length => length > 50), `The shape gallery draws 8 non-empty paths, got ${paths.map(Math.round).join(', ')}`);
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
  console.log('Styles pages: theme and mode swap, shared appearance key, sample text, copy, shape step edits in the gallery and preview, shape library and morph, export CSS, share link, preview dialog, 375 px in both site themes.');
} finally {
  await browser.close();
  server?.stop();
}
