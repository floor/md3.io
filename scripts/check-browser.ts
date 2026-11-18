import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { handleRequest } from '../server';
import * as panel from './panel-driver';

const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: handleRequest });
const base = server.url.toString();
const output = resolve(import.meta.dir, '../analysis/browser');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors: string[] = [];
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'dark', permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto(base);
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.screenshot({ animations: 'disabled', path: `${output}/home-desktop.png`, fullPage: true });
  await page.getByRole('link', { name: 'Explore components' }).click();
  const preview = page.frameLocator('#preview');
  const button = preview.getByRole('button', { name: 'Button', exact: true });
  await button.waitFor();
  await button.click();
  await page.getByRole('status').filter({ hasText: 'Button clicked' }).waitFor();
  await page.screenshot({ animations: 'disabled', path: `${output}/button-desktop.png`, fullPage: true });

  const originalButton = await button.elementHandle();
  const previewHeight = (await page.locator('.preview-panel').boundingBox())!.height;
  assert(await page.locator('.preview-heading > #copy-code').isVisible(), 'Live preview did not show Copy code in the preview heading');
  await page.getByRole('tab', { name: 'View code', exact: true }).click();
  assert(await page.getByRole('tabpanel', { name: 'View code' }).isVisible(), 'Code did not open in the playground');
  assert(await page.locator('#generated-code .hljs-keyword').count() > 0 && await page.locator('#generated-code .hljs-string').count() > 0, 'JavaScript syntax highlighting is missing');
  const darkKeywordColor = await page.locator('#generated-code .hljs-keyword').first().evaluate(element => getComputedStyle(element).color);
  // Copy code sits in the preview heading, material's xs button, in both views.
  assert(await page.locator('.preview-heading > #copy-code').isVisible(), 'Code view did not show Copy code in the preview heading');
  assert(!await page.locator('#preview').isVisible(), 'Preview remains visible in code view');
  assert(Math.abs((await page.locator('.preview-panel').boundingBox())!.height - previewHeight) < 1, 'Switching views changes playground height');
  await page.getByRole('tab', { name: 'Live preview' }).focus();
  await page.keyboard.press('Enter');
  assert(await page.getByRole('tab', { name: 'Live preview' }).getAttribute('aria-selected') === 'true', 'Keyboard tab switching failed');
  // Copy code stays in the heading in Live preview too: copying needs no view switch.
  assert(await page.locator('.preview-heading > #copy-code').isVisible(), 'Live preview lost Copy code from the heading');
  assert(await originalButton!.evaluate(node => node === node.ownerDocument.querySelector('button')), 'Switching views recreated the component');
  await page.getByRole('tab', { name: 'View code' }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('textbox', { name: 'Text', exact: true }).fill('Code view update');
  assert((await page.locator('#generated-code').textContent())?.includes('Code view update'), 'Code view does not update with the configuration');
  await page.screenshot({ animations: 'disabled', path: `${output}/button-code-desktop.png`, fullPage: true });
  await page.getByRole('tab', { name: 'Live preview' }).click();
  await preview.getByRole('button', { name: 'Code view update', exact: true }).waitFor();
  await page.getByRole('textbox', { name: 'Text', exact: true }).fill('<img src=x onerror=alert(1)>');
  assert((await page.locator('#generated-code').textContent())?.includes('<img src=x onerror=alert(1)>'), 'Highlighting changed literal code content');
  assert(await page.locator('#generated-code img').count() === 0, 'Highlighting interpreted component text as HTML');
  assert((await page.locator('#generated-code .hljs-string').allTextContents()).some(text => text.includes('<img')), 'Edited values lost syntax highlighting');
  await page.getByRole('textbox', { name: 'Text', exact: true }).fill('Button');

  for (const variant of ['filled', 'tonal', 'outlined', 'elevated', 'text']) {
    await page.locator('#control-variant').click();
    // The option labels are the values themselves, lowercase, as the native
    // panel's select wrote them.
    await page.getByRole('option', { name: variant, exact: true }).click();
    await page.waitForFunction(value => document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelector('button')?.classList.contains(`mtrl-button--${value}`), variant);
  }
  for (const size of ['xs', 's', 'm', 'l', 'xl']) {
    await page.locator('m-button-group[data-group-for="size"]').getByRole('button', { name: size.toUpperCase(), exact: true }).click();
    await page.waitForFunction(value => document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelector('button')?.classList.contains(`mtrl-button--${value}`), size);
  }
  await page.getByRole('textbox', { name: 'Text', exact: true }).fill('Save changes');
  await page.locator('m-button-group[data-group-for="icon"]').getByRole('button', { name: 'heart' }).click();
  // The switch's label is slotted inside it, and its input covers the whole
  // host: click the switch itself, by its accessible name.
  await page.getByRole('switch', { name: 'Square shape', exact: true }).click();
  await page.getByRole('switch', { name: 'Disabled', exact: true }).click();
  await page.waitForFunction(() => document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelector<HTMLButtonElement>('button')?.disabled);
  // One appearance for the whole site: the theme and mode live in the site header,
  // not the playground heading, and reach the preview and the panel together.
  assert(await page.locator('.preview-heading #preview-theme').count() === 0, 'The playground heading still has its own theme select');
  assert(await page.locator('header #theme-picker').isVisible(), 'The site header has no Themes button');
  await panel.chooseTheme(page, 'Ocean');
  await panel.chooseMode(page, 'dark');
  await page.waitForFunction(() => document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.documentElement.dataset.theme === 'ocean');
  assert(await page.locator('html').getAttribute('data-theme-mode') === 'dark', 'The site is not in the dark mode it chose');
  await page.locator('#theme-toggle').click();
  const lightKeywordColor = await page.locator('#generated-code .hljs-keyword').first().evaluate(element => getComputedStyle(element).color);
  assert(lightKeywordColor !== darkKeywordColor, 'Syntax colors did not follow the site theme');
  await page.waitForFunction(() => document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.documentElement.dataset.themeMode === 'light');
  assert(await preview.locator('html').getAttribute('data-theme-mode') === 'light', "The site's mode did not reach the preview");
  await page.locator('#theme-toggle').click();
  await page.waitForFunction(() => document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.documentElement.dataset.themeMode === 'dark');
  await page.getByRole('tab', { name: 'View code', exact: true }).click();
  await page.getByRole('button', { name: 'Copy code', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Code copied' }).waitFor();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  assert(copied === await page.locator('#generated-code').textContent(), 'Copied code differs from the highlighted source');
  assert(copied.includes('Save changes') && copied.includes('disabled: true') && copied.includes('material/themes/ocean'), 'Copied code is stale');
  // Material's component CSS stays in the frame and the elements' shadow roots. The
  // page may load the chosen theme's sheet (one appearance for the whole site): it only
  // sets roles under [data-theme], which only the material scopes carry.
  const leak = await page.evaluate(() => ({
    sheets: [...document.styleSheets].map(sheet => sheet.href ?? '').filter(href => href.includes('/dist/material/') && !href.includes('/dist/material/themes/')),
    themed: [...document.querySelectorAll('[data-theme]')].filter(element => !element.matches('.playground--material, .site-material')).map(element => element.tagName),
  }));
  assert(leak.sheets.length === 0 && leak.themed.length === 0, `Material CSS leaked into the site: ${JSON.stringify(leak)}`);
  await page.screenshot({ animations: 'disabled', path: `${output}/button-configured.png`, fullPage: true });
  await page.getByRole('tab', { name: 'Live preview' }).click();
  // The pilot has no Reset: the Scenario select's Default is the way back.
  assert(await page.getByRole('button', { name: 'Reset', exact: true }).count() === 0, 'The material panel still shows Reset');
  await page.locator('#scenario').click();
  await page.getByRole('option', { name: 'Default', exact: true }).click();
  await page.waitForFunction(() => String((document.querySelector('#button-text') as HTMLElement & { value?: string } | null)?.value) === 'Button');
  await button.waitFor();
  await page.waitForFunction(() => !document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelector<HTMLButtonElement>('button')?.disabled);
  assert(await button.isEnabled(), 'Default did not enable the button');
  const assertAppearance = async (theme: string, mode: string) => {
    await page.waitForFunction(({ theme, mode }) => {
      const root = document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.documentElement;
      return root?.dataset.theme === theme && root?.dataset.themeMode === mode;
    }, { theme, mode });
    // The site's appearance (header), and the form's copy of it in the heading.
    const now = await page.evaluate(() => ({
      site: `${document.documentElement.dataset.siteTheme}/${document.documentElement.dataset.themeMode}`,
      form: `${document.querySelector<HTMLInputElement>('input[data-appearance="theme"]')?.value}/${document.querySelector<HTMLInputElement>('input[data-appearance="mode"]')?.value}`,
    }));
    assert(now.site === `${theme}/${mode}` && now.form === `${theme}/${mode}`, `Appearance lost the saved preference: ${JSON.stringify(now)}`);
    const code = await page.locator('#generated-code').textContent();
    assert(code?.includes(`dataset.theme = '${theme}'`) && code.includes(`dataset.themeMode = '${mode}'`), 'Generated code lost the saved appearance');
  };
  await assertAppearance('ocean', 'dark');
  // Hold both the iframe document and application bundles to expose loading-time flashes.
  const loadingPage = await context.newPage();
  let releaseDocument!: () => void;
  let releaseModules!: () => void;
  const documentGate = new Promise<void>(resolve => { releaseDocument = resolve; });
  const modulesGate = new Promise<void>(resolve => { releaseModules = resolve; });
  await loadingPage.route('**/preview/**', async route => { await documentGate; await route.continue(); });
  await loadingPage.route('**/dist/*.js', async route => { await modulesGate; await route.continue(); });
  try {
    await loadingPage.goto(`${base}components/icon-button/`, { waitUntil: 'commit' });
    await loadingPage.locator('#preview').waitFor();
    await loadingPage.waitForFunction(() => getComputedStyle(document.querySelector('#preview')!).colorScheme === 'dark');
    const background = await loadingPage.locator('#preview').evaluate(element => getComputedStyle(element).backgroundColor);
    assert(background === 'rgb(29, 27, 32)', 'The empty iframe has a light loading background');
    releaseDocument();
    const loadingFrame = loadingPage.frameLocator('#preview');
    await loadingFrame.locator('#stage').waitFor({ state: 'attached' });
    assert(await loadingFrame.locator('html').getAttribute('data-theme-mode') === 'dark', 'Preview waits for a bundle to apply dark mode');
    assert(await loadingFrame.locator('html').getAttribute('data-theme') === 'ocean', 'Preview waits for a bundle to apply the saved color theme');
    await loadingPage.waitForFunction(() => {
      const doc = document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument;
      return doc?.body && getComputedStyle(doc.body).backgroundColor === 'rgb(25, 28, 30)';
    });
    await loadingFrame.locator('html').evaluate(root => {
      const modes: string[] = [];
      (window as any).__previewModes = modes;
      new MutationObserver(records => {
        for (const record of records) if (record.attributeName === 'data-theme-mode') modes.push(record.oldValue || '', root.getAttribute('data-theme-mode') || '');
      }).observe(root, { attributes: true, attributeOldValue: true });
    });
    releaseModules();
    await loadingPage.waitForLoadState('load');
    await loadingFrame.getByRole('button', { name: 'Add to favorites' }).waitFor();
    assert(await loadingFrame.locator('html').evaluate(() => !(window as any).__previewModes.includes('light')), 'Module startup reverted to light mode');
  } finally {
    releaseDocument();
    releaseModules();
    await loadingPage.close();
  }
  await page.locator('#sidebar').getByRole('link', { name: 'Icon button', exact: true }).click();
  await assertAppearance('ocean', 'dark');
  await page.reload();
  await assertAppearance('ocean', 'dark');
  // A subsequent choice must replace the previous preference on the next component.
  await panel.chooseTheme(page, 'Forest');
  await panel.chooseMode(page, 'light');
  await page.locator('#sidebar').getByRole('link', { name: 'Button group', exact: true }).click();
  await assertAppearance('forest', 'light');
  assert(await page.locator('html').getAttribute('data-theme-mode') === 'light', 'The site mode and the preview mode moved apart');
  await page.evaluate(() => localStorage.setItem('md3-preview-appearance', '{invalid json'));
  await page.reload();
  await assertAppearance('baseline', 'light');

  await page.goto(`${base}docs/components/button/`);
  await page.locator('.md h1').waitFor();
  await page.screenshot({ animations: 'disabled', path: `${output}/docs-desktop.png`, fullPage: false });
  const tocHref = await page.locator('.doc-toc a').first().getAttribute('href');
  assert(tocHref && await page.locator(tocHref).count() === 1, 'TOC target is missing');
  // The header (logo, navigation, search, Themes and mode buttons; no section crumb any
  // more) and the document do not overflow at 360, 599 or 600 px.
  const breadcrumb = () => page.evaluate(() => {
    const header = document.querySelector('.header') as HTMLElement;
    const root = document.documentElement;
    return {
      headerFits: header.scrollWidth === header.clientWidth,
      documentFits: root.scrollWidth === root.clientWidth,
    };
  });
  const fits = (width: number, reading: { headerFits: boolean; documentFits: boolean }) =>
    assert(reading.headerFits && reading.documentFits, `At ${width} px the header or the document overflows horizontally`);
  await page.setViewportSize({ width: 360, height: 844 });
  fits(360, await breadcrumb());
  await page.setViewportSize({ width: 599, height: 844 });
  fits(599, await breadcrumb());
  await page.setViewportSize({ width: 600, height: 844 });
  fits(600, await breadcrumb());
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}components/button/`);
  await preview.getByRole('button', { name: 'Button', exact: true }).waitFor();
  await page.screenshot({ animations: 'disabled', path: `${output}/button-mobile.png`, fullPage: true });
  const overflow = await page.evaluate(() => [...document.querySelectorAll('body *')].map(element => ({ tag: element.tagName, class: element.className, width: element.getBoundingClientRect().width, right: element.getBoundingClientRect().right })).filter(item => item.right > innerWidth + 1));
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Mobile page overflows horizontally: ${JSON.stringify(overflow)}`);
  await page.getByRole('tab', { name: 'View code', exact: true }).click();
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile code view overflows the page');
  await page.screenshot({ animations: 'disabled', path: `${output}/button-code-mobile.png`, fullPage: true });
  await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Documentation', exact: true }).click();
  await page.getByRole('heading', { name: 'Documentation', exact: true }).waitFor();
  await page.goto(base);
  await page.screenshot({ animations: 'disabled', path: `${output}/home-mobile.png`, fullPage: true });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile landing overflows');
  // The privacy page: the footer link reaches it from the home page and from a component page.
  await page.locator('.site-footer').getByRole('link', { name: 'Privacy', exact: true }).click();
  await page.waitForURL(`${base}privacy/`);
  await page.getByRole('heading', { level: 1, name: 'Privacy', exact: true }).waitFor();
  await page.goto(`${base}components/button/`);
  await page.locator('.site-footer').getByRole('link', { name: 'Privacy', exact: true }).click();
  await page.waitForURL(`${base}privacy/`);
  await page.getByRole('heading', { level: 1, name: 'Privacy', exact: true }).waitFor();
  assert(errors.length === 0, `Browser errors: ${errors.join('\n')}`);
  console.log(`Browser checks passed. Screenshots: ${output}`);
} finally {
  await browser.close();
  server.stop(true);
}
