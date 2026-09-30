// The site search dialog in a browser: the shortcut and the header button open
// it, results are grouped and marked, the keyboard moves and opens, Escape and
// a click outside close it and give focus back, and it fits a phone.
// BASE_URL checks a running server; without it the check serves the site itself.
import { chromium, type Page } from 'playwright';

const server = process.env.BASE_URL ? null : Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: (await import('../server')).handleRequest });
const base = (process.env.BASE_URL ?? server!.url.href).replace(/\/$/, '');
const browser = await chromium.launch();
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark', reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const dialog = page.locator('#search-dialog');
  const input = page.locator('#search-input');
  const isOpen = () => dialog.evaluate((element: HTMLDialogElement) => element.open);
  const focused = () => page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName);

  const typeQuery = async (query: string, first: string) => {
    await input.fill(query);
    await page.locator('.search-dialog__result').first().filter({ hasText: first }).waitFor();
  };

  for (const path of ['/components/dialog/', '/docs/components/dialog/', '/examples/settings/']) {
    console.log(`Checking ${path}`);
    await page.goto(`${base}${path}`);
    await page.waitForLoadState('networkidle');
    for (const modifier of ['Meta', 'Control']) {
      await page.locator('#theme-toggle').focus();
      await page.keyboard.press(`${modifier}+k`);
      assert(await isOpen(), `${modifier}+K opens the dialog on ${path}`);
      assert(await focused() === 'search-input', `${modifier}+K focuses the input`);
      await page.keyboard.press('Escape');
      assert(!await isOpen(), 'Escape closes the dialog');
      assert(await focused() === 'theme-toggle', `focus returns after Escape, got ${await focused()}`);
    }
  }

  // Names and roles.
  await page.locator('#search-trigger').click();
  assert(await isOpen(), 'the header button opens the dialog');
  assert(await page.getByRole('dialog', { name: 'Search the site' }).isVisible(), 'the dialog is named');
  assert(await page.getByRole('combobox', { name: 'Search components, docs and examples' }).isVisible(), 'the input is a labelled combobox');

  // Results: Bottom sheet under Components, the match marked.
  await typeQuery('peek', 'Bottom sheet');
  const groups = await page.locator('.search-dialog__group-label').allTextContents();
  assert(groups[0] === 'Components', `Components comes first, got ${groups.join(', ')}`);
  const first = page.locator('.search-dialog__group').first().getByRole('option').first();
  assert((await first.locator('.search-dialog__result-title').textContent()) === 'Bottom sheet', 'Bottom sheet is the first component');
  assert((await first.locator('mark').allTextContents()).includes('peek'), 'the match is marked');
  assert(await page.getByRole('listbox', { name: 'Search results' }).isVisible(), 'results are a named listbox');
  assert(await first.getAttribute('aria-selected') === 'true', 'the first result is active');
  assert(await input.getAttribute('aria-activedescendant') === await first.getAttribute('id'), 'the input points at the active result');

  // Arrows move, Enter opens.
  await typeQuery('dialog', 'Dialog');
  const options = page.locator('#search-listbox').getByRole('option');
  const count = await options.count();
  assert(count > 2, 'dialog has several results');
  await page.keyboard.press('ArrowDown');
  assert(await options.nth(1).getAttribute('aria-selected') === 'true', 'ArrowDown moves to the second result');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  assert(await options.nth(count - 1).getAttribute('aria-selected') === 'true', 'ArrowUp wraps to the last result');
  await page.keyboard.press('ArrowDown');
  const target = await options.nth(0).getAttribute('href');
  await Promise.all([page.waitForURL(`${base}${target}`), page.keyboard.press('Enter')]);
  console.log(`Enter opened ${target}`);

  // A click outside the panel closes it.
  await page.waitForLoadState('networkidle');
  await page.locator('#search-trigger').click();
  await page.mouse.click(20, 880);
  assert(!await isOpen(), 'a click outside closes the dialog');
  assert(await focused() === 'search-trigger', 'focus returns to the header button');

  // A phone: the button is in the header, the panel fits.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/docs/components/bottom-sheet/`);
  const button = await page.locator('#search-trigger').boundingBox();
  assert(button && button.x + button.width <= 390, 'the search button fits the header at 390px');
  await page.locator('#search-trigger').click();
  await typeQuery('no-close-on-escape', '');
  const panel = await page.locator('.search-dialog').boundingBox();
  assert(panel && panel.x >= 0 && panel.width <= 390, `the panel fits at 390px, got ${JSON.stringify(panel)}`);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= 390), 'no horizontal scroll at 390px');
  await page.keyboard.press('Escape');

  // /?q= opens the search on its term (the home page's SearchAction), and leaves the address.
  await page.goto(`${base}/?q=dialog`);
  await page.locator('.search-dialog__result').first().filter({ hasText: 'Dialog' }).waitFor();
  assert(await isOpen() && await input.inputValue() === 'dialog', '/?q=dialog opens the search on "dialog"');
  assert(new URL(page.url()).search === '', `the query leaves the address, got ${page.url()}`);
  await page.keyboard.press('Escape');

  assert(!errors.length, `no console errors: ${errors.join('\n')}`);
  console.log('Search dialog checks passed.');
}
finally {
  await browser.close();
  server?.stop(true);
}
