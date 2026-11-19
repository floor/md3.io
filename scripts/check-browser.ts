import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { handleRequest } from '../server';
import * as panel from './panel-driver';
import { checkPlaygroundLayout } from './check-playground-layout';
import { checkInputTargets } from './check-input-targets';
import { checkPageLayout } from './check-page-layout';

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
  // page may load the chosen theme's sheet (one appearance for the whole site): its
  // roles land on <html data-theme> itself (layout step 8: the site's own colours
  // follow the theme) and on the material scopes, and nowhere else.
  const leak = await page.evaluate(() => ({
    sheets: [...document.styleSheets].map(sheet => sheet.href ?? '').filter(href => href.includes('/dist/material/') && !href.includes('/dist/material/themes/')),
    themed: [...document.querySelectorAll('[data-theme]')].filter(element => element !== document.documentElement && !element.matches('.playground--material, .site-material')).map(element => element.tagName),
  }));
  assert(leak.sheets.length === 0 && leak.themed.length === 0, `Material CSS leaked into the site: ${JSON.stringify(leak)}`);
  // Layout step 8: the site's own surfaces take the chosen theme's roles at the root.
  await page.waitForFunction(() => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--mtrl-sys-color-surface)';
    document.body.append(probe);
    const surface = getComputedStyle(probe).color;
    probe.remove();
    return document.documentElement.dataset.theme === 'ocean' && getComputedStyle(document.body).backgroundColor === surface;
  });
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
  // Filled controls and accent-tinted surfaces keep AA contrast in a dark theme
  // and a light one: text on a role fill is that role's on-pair (white on a dark
  // theme's light primary was 1.7:1). Covers the Styles toggles (checked and
  // not), the primary buttons, and every surface the primary-container fill
  // paints — the search dialog's active result, blockquotes, the Colour Lab's
  // checked segments — plus the accent-glow wash behind the Styles "Aa".
  for (const [theme, mode] of [['ocean', 'dark'], ['baseline', 'dark'], ['forest', 'dark'], ['forest', 'light']] as const) {
    const themedContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await themedContext.addInitScript(([t, m]) => {
      localStorage.setItem('md3-preview-appearance', JSON.stringify({ theme: t, mode: m }));
      localStorage.setItem('md3-site-mode', m!);
    }, [theme, mode]);
    const themedPage = await themedContext.newPage();
    for (const route of ['styles/', 'styles/color-lab/', 'docs/components/menu/', '']) {
      await themedPage.goto(`${base}${route}`);
      await themedPage.waitForTimeout(400);
      if (route.startsWith('docs/')) {
        // The search dialog's active result is an accent-dim surface too.
        await themedPage.locator('#search-trigger').click();
        await themedPage.locator('#search-input').fill('button');
        await themedPage.locator('.search-dialog__result').first().waitFor();
        await themedPage.keyboard.press('ArrowDown');
        await themedPage.waitForTimeout(200);
      }
      const rows = await themedPage.evaluate(() => {
        const luminance = (rgb: string) => {
          const [r, g, b] = rgb.match(/[\d.]+/g)!.slice(0, 3).map(part => {
            const value = Number(part) / 255;
            return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
          });
          return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
        };
        const backgroundOf = (element: Element): string => {
          // Alpha backgrounds (the accent-glow wash) composite over what is under them.
          const composite = (node: Element | null): [number, number, number] => {
            if (!node) return [255, 255, 255];
            const parts = getComputedStyle(node).backgroundColor.match(/[\d.]+/g)?.map(Number) ?? [];
            const alpha = parts[3] ?? 1;
            if (alpha >= 1) return [parts[0]!, parts[1]!, parts[2]!];
            if (alpha <= 0) return composite(node.parentElement);
            const under = composite(node.parentElement);
            return [0, 1, 2].map(i => Math.round(parts[i]! * alpha + under[i]! * (1 - alpha))) as [number, number, number];
          };
          return `rgb(${composite(element).join(', ')})`;
        };
        const roleColor = (role: string) => {
          const probe = document.createElement('span');
          probe.style.color = `var(${role})`;
          document.body.append(probe);
          const color = getComputedStyle(probe).color;
          probe.remove();
          return color;
        };
        const container = roleColor('--mtrl-sys-color-primary-container');
        // The filled controls named above, every surface painted with the
        // primary-container fill (search's active result, blockquotes, the lab's
        // checked segments), and the text inside those surfaces.
        const tinted = [...document.querySelectorAll<HTMLElement>('*')].filter(element => getComputedStyle(element).backgroundColor === container);
        const inside = tinted.flatMap(element => [element, ...element.querySelectorAll<HTMLElement>('*')]);
        const candidates = [...new Set([...document.querySelectorAll<HTMLElement>('.choice input + span, .btn--primary, .styles-card__visual--type span'), ...inside])];
        return candidates.filter(element => element.getBoundingClientRect().width > 0
          && ([...element.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) || element instanceof SVGElement)).map(element => {
          const style = getComputedStyle(element);
          const ratio = (Math.max(luminance(style.color), luminance(backgroundOf(element))) + 0.05) / (Math.min(luminance(style.color), luminance(backgroundOf(element))) + 0.05);
          const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && Number(style.fontWeight) >= 700);
          return { text: element.textContent?.trim().slice(0, 24), ratio, large, iconOnly: !element.textContent?.trim(), who: `${element.tagName.toLowerCase()}.${element.className}` };
        });
      });
      assert(rows.length >= 1, `${theme}/${mode} ${route || 'home'}: no filled controls found for the contrast check`);
      for (const row of rows) {
        const needed = row.large || row.iconOnly ? 3 : 4.5;
        assert(row.ratio >= needed, `${theme}/${mode} ${route || 'home'}: "${row.text}" (${row.who}) is ${row.ratio.toFixed(2)}:1 (want ${needed}:1)`);
      }
    }
    await themedContext.close();
  }
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
    // The loading backdrop is the chosen theme's surface (ocean, dark, here), not a fixed colour.
    const surface = await loadingPage.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--mtrl-sys-color-surface)';
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    });
    assert(background === surface, `The empty iframe has a light loading background (${background} vs the theme surface ${surface})`);
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
  const componentList = page.getByRole('navigation', { name: 'Component list', exact: true });
  await componentList.getByRole('link', { name: 'Icon button', exact: true }).click();
  await assertAppearance('ocean', 'dark');
  await page.reload();
  await assertAppearance('ocean', 'dark');
  // A subsequent choice must replace the previous preference on the next component.
  await panel.chooseTheme(page, 'Forest');
  await panel.chooseMode(page, 'light');
  await componentList.getByRole('link', { name: 'Button group', exact: true }).click();
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

  // Each served CSS bundle can override the shared shell. Check computed styles
  // across the boundaries on one route from every bundle.
  const routes = [
    { name: 'home', path: '' },
    { name: 'playground', path: 'components/button/' },
    { name: 'catalog', path: 'components/' },
    { name: 'docs', path: 'docs/frameworks/' },
    // This route redirects to Showcase once the rename lands.
    { name: 'example', path: 'examples/settings/' },
    { name: 'styles', path: 'styles/' },
    { name: 'colour-lab', path: 'styles/color-lab/' },
    { name: 'themes', path: 'styles/themes/' },
  ];
  const bar = page.locator('#site-primary-bar');
  const rail = page.locator('#site-primary-rail');
  const primary = page.getByRole('navigation', { name: 'Primary navigation', exact: true });
  const capture = resolve(output, 'breakpoints');
  await mkdir(capture, { recursive: true });
  for (const { name, path } of routes) {
    await page.goto(`${base}${path}`);
    for (const width of [360, 390, 412, 599, 600, 700, 839, 840, 1024, 1199, 1200, 1440, 1599, 1600]) {
      await page.setViewportSize({ width, height: 900 });
      const compact = width < 600;
      const tier = `${name} at ${width}px`;
      const inactive = compact ? rail : bar;
      await page.waitForFunction(compact => {
        const bar = document.querySelector<HTMLElement>('#site-primary-bar')!;
        const rail = document.querySelector<HTMLElement>('#site-primary-rail')!;
        return bar.hidden === !compact && rail.hidden === compact;
      }, compact);
      const geometry = await page.evaluate(() => {
        const header = document.querySelector<HTMLElement>('.header')!;
        const layout = document.querySelector<HTMLElement>('.layout')!;
        const root = document.documentElement;
        return {
          headerWidth: header.clientWidth,
          headerScroll: header.scrollWidth,
          layoutWidth: layout.getBoundingClientRect().width,
          viewportWidth: root.clientWidth,
          documentScroll: root.scrollWidth,
          logoSize: getComputedStyle(document.querySelector('.header__logo')!).fontSize,
          padding: getComputedStyle(root).getPropertyValue('--page-padding').trim(),
        };
      });
      assert(geometry.headerScroll <= geometry.headerWidth && geometry.documentScroll <= width,
        `${tier}: horizontal overflow ${JSON.stringify(geometry)}`);
      assert(geometry.logoSize === (width < 600 ? '20px' : '23px'), `${tier}: wrong shell sizing`);
      const padding = width < 600 ? '28px 18px 40px' : width < 1200 ? '32px 28px 48px' : '8px 40px 64px';
      assert(geometry.padding === padding, `${tier}: wrong page spacing`);
      const expectedLayout = width < 1600 ? Math.min(1472, geometry.viewportWidth) : Math.min(1840, geometry.viewportWidth - 128);
      assert(Math.abs(geometry.layoutWidth - expectedLayout) < 1, `${tier}: wrong shell gutter or width cap`);
      assert(await bar.isVisible() === compact && await rail.isVisible() === !compact
        && await primary.count() === 1, `${tier}: wrong primary navigation`);
      if (!compact) {
        assert(Math.abs((await rail.boundingBox())!.width - 96) < 1, `${tier}: wrong rail width`);
      }
      if ([390, 599, 600, 700].includes(width)) {
        const focused = await inactive.locator('a').first().evaluate(node => {
          node.focus();
          return document.activeElement === node;
        });
        assert(!focused, `${tier}: hidden navigation accepted keyboard focus`);
      }
      if ((name === 'home' || name === 'docs') && [390, 599, 600].includes(width)) {
        await page.locator('#search-trigger').click();
        const search = page.getByRole('dialog', { name: 'Search the site' });
        const searchPanel = search.locator('.search-dialog');
        const bounds = await searchPanel.boundingBox();
        assert(bounds && bounds.x >= 0 && bounds.x + bounds.width <= width,
          `${tier}: search exceeds the viewport`);
        // The opening animation scales the bounds. The computed width tests the layout.
        const panelWidth = await searchPanel.evaluate(node => parseFloat(getComputedStyle(node).width));
        assert(width < 600 ? panelWidth === width : panelWidth < width, `${tier}: wrong search presentation`);
        await page.keyboard.press('Escape');
        assert(await page.locator('#search-trigger').evaluate(node => document.activeElement === node),
          `${tier}: search lost focus on close`);
      }
      if ((name === 'home' && [390, 600, 839, 840, 1200, 1600].includes(width))
        || (name === 'playground' && [700, 1024, 1440].includes(width))) {
        await page.screenshot({ path: `${capture}/${name}-${width}.png`, animations: 'disabled' });
      }
    }
  }

  await page.goto(`${base}components/button/`);
  await page.setViewportSize({ width: 599, height: 900 });
  await bar.getByRole('link', { name: 'Styles', exact: true }).focus();
  await page.setViewportSize({ width: 600, height: 900 });
  await page.waitForFunction(() => document.activeElement === document.querySelector('#site-primary-rail a[href="/styles/"]'));
  await page.setViewportSize({ width: 599, height: 900 });
  await page.waitForFunction(() => document.activeElement === document.querySelector('#site-primary-bar a[href="/styles/"]'));

  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto(`${base}docs/frameworks/`);
  const tocLink = page.locator('.doc-toc a:visible').first();
  const headingId = (await tocLink.getAttribute('href'))!.slice(1);
  await tocLink.focus();
  await page.screenshot({ path: `${capture}/toc-focus-1200.png`, animations: 'disabled' });
  await page.setViewportSize({ width: 1199, height: 900 });
  await page.waitForFunction(id => document.activeElement?.id === id, headingId);
  await page.screenshot({ path: `${capture}/toc-focus-1199.png`, animations: 'disabled' });
  await page.setViewportSize({ width: 1200, height: 900 });
  assert(await page.evaluate(id => document.activeElement?.id === id, headingId), 'The heading keeps focus as the TOC returns');

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
  await checkPlaygroundLayout(context, base, output);
  await checkInputTargets(browser, base, output);
  await checkPageLayout(browser, base, output);
  console.log(`Browser checks passed. Screenshots: ${output}`);
} finally {
  await browser.close();
  server.stop(true);
}
