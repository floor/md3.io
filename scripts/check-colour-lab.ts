// The public runtime API wired to a scoped UI, exercised through its controls.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { applyScheme } from 'material/theme';
import { createSchemeByName } from 'material/theme/variants';
import { LAB_DEFAULT, LAB_ROLES, LAB_SEEDS, LAB_VARIANTS, labJavaScript, type LabState } from '../src/shared/colour-lab';
import { handleRequest } from '../server';

const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: handleRequest });
const browser = await chromium.launch();
const output = 'analysis/colour-lab-page/after';
await mkdir(output, { recursive: true });
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
const expected = (state: LabState) => {
  const tokens: Record<string, string> = {};
  applyScheme(createSchemeByName(state.seed, state), { style: { setProperty: (name: string, value: string) => { tokens[name.replace('--mtrl-sys-color-', '')] = value; } } } as unknown as Element);
  return tokens;
};
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'dark', reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  const errors: string[] = [];
  const scripts = new Set<string>();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(response.status() + ' ' + response.url()); if (response.url().endsWith('.js')) scripts.add(response.url()); });
  await page.goto(server.url.origin + '/styles/color-lab/');
  const stage = page.locator('#colour-lab-stage');
  await stage.locator('.mtrl-card').first().waitFor();
  await page.waitForFunction(() => document.querySelector('#colour-lab-stage')?.getAttribute('data-ready') === 'true');
  await page.evaluate(() => document.fonts.ready);
  const chrome = await page.evaluate(() => ({ rootStyle: document.documentElement.style.cssText, rootPrimary: getComputedStyle(document.documentElement).getPropertyValue('--mtrl-sys-color-primary'), header: getComputedStyle(document.querySelector('.header')!).backgroundColor, store: localStorage.getItem('md3-styles-theme'), appearance: localStorage.getItem('md3-preview-appearance') }));
  const state: LabState = { ...LAB_DEFAULT };
  const checkScheme = async () => {
    await page.waitForFunction(({ seed, variant, mode, contrast }) => {
      const stage = document.querySelector<HTMLElement>('#colour-lab-stage');
      return stage?.dataset.seed === seed && stage.dataset.variant === variant && stage.dataset.mode === mode && stage.dataset.contrast === String(contrast);
    }, state);
    const values = await stage.evaluate((node, roles) => Object.fromEntries(roles.map(role => [role, (node as HTMLElement).style.getPropertyValue('--mtrl-sys-color-' + role).trim()])), LAB_ROLES);
    const want = expected(state);
    const differences = LAB_ROLES.filter(role => values[role] !== want[role]);
    assert(differences.length === 0, 'Every scoped role matches the public API at ' + JSON.stringify(state) + ': ' + differences.join(', '));
  };
  await checkScheme();
  assert(await stage.locator('.mtrl-card').count() === 2, 'Two real material cards');
  assert(await page.locator('[data-role-copy]').count() === 40, '40 inspectable roles');
  await page.screenshot({ path: output + '/colour-lab-default-1440.png', fullPage: true });
  const field = page.getByRole('textbox', { name: 'Project name', exact: true });
  await field.fill('Colour studies');
  const originalField = await field.elementHandle();
  for (const [seed] of LAB_SEEDS) {
    await page.locator('[data-seed="' + seed + '"]').click();
    state.seed = seed.toLowerCase();
    await checkScheme();
  }
  await page.locator('#lab-hex').fill('#006A6A'); state.seed = '#006a6a'; await checkScheme();
  for (const [variant] of LAB_VARIANTS) { await page.selectOption('#lab-variant', variant); state.variant = variant; await checkScheme(); }
  const beforeInvalid = await stage.getAttribute('style');
  await page.locator('#lab-hex').fill('#NOPE');
  assert(await page.locator('#lab-hex').getAttribute('aria-invalid') === 'true', 'Invalid hex is explained');
  assert(await stage.getAttribute('style') === beforeInvalid, 'Invalid hex keeps the last valid preview');
  await page.locator('#lab-picker').evaluate(node => { (node as HTMLInputElement).value = '#8f4c38'; node.dispatchEvent(new Event('input', { bubbles: true })); });
  state.seed = '#8f4c38'; await checkScheme();
  assert(await page.locator('#lab-hex').inputValue() === '#8F4C38', 'Picker updates the hex field');
  await page.locator('label:has(input[name="lab-mode"][value="dark"])').click(); state.mode = 'dark'; await checkScheme();
  for (const contrast of [0.5, 1, 0]) {
    await page.locator('label:has(input[name="lab-contrast-preset"][value="' + contrast + '"])').click();
    state.contrast = contrast; await checkScheme();
    assert(await page.locator('#lab-contrast').inputValue() === String(contrast), 'Preset synchronizes the slider');
  }
  const slider = page.locator('#lab-contrast');
  await slider.focus(); await slider.press('Home'); state.contrast = -1; await checkScheme();
  for (let i = 0; i < 13; i++) await slider.press('ArrowRight');
  state.contrast = -0.35; await checkScheme();
  assert(await page.locator('input[name="lab-contrast-preset"]:checked').count() === 0, 'Custom contrast does not claim a preset');
  await page.locator('label:has(input[name="lab-contrast-preset"][value="1"])').click(); state.contrast = 1; await checkScheme();
  for (const [variant] of LAB_VARIANTS) {
    await page.selectOption('#lab-variant', variant); state.variant = variant; await checkScheme();
    for (const mode of ['light', 'dark'] as const) {
      await page.locator('label:has(input[name="lab-mode"][value="' + mode + '"])').click(); state.mode = mode; await checkScheme();
      const ratios = await page.locator('[data-status]').evaluateAll(nodes => nodes.map(node => Number((node as HTMLElement).dataset.ratio)));
      assert(ratios.length === 4 && ratios.every(ratio => ratio >= 7), 'High contrast status pairs meet 7:1 in ' + variant + '/' + mode);
    }
  }
  assert(await field.inputValue() === 'Colour studies', 'Palette updates preserve field contents');
  assert(await originalField!.evaluate(node => node === document.querySelector('#lab-form input')), 'Palette updates preserve component identity');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  assert((await page.locator('.lab-preview-feedback').textContent())?.includes('Project created'), 'The preview is interactive');
  const currentChrome = await page.evaluate(() => ({ rootStyle: document.documentElement.style.cssText, rootPrimary: getComputedStyle(document.documentElement).getPropertyValue('--mtrl-sys-color-primary'), header: getComputedStyle(document.querySelector('.header')!).backgroundColor, store: localStorage.getItem('md3-styles-theme'), appearance: localStorage.getItem('md3-preview-appearance') }));
  assert(JSON.stringify(chrome) === JSON.stringify(currentChrome), 'Experiments do not change the documentation chrome or shared theme store');

  await page.locator('#lab-inspector > summary').click();
  await page.locator('[data-role-copy="primary"]').click();
  assert(await page.evaluate(() => navigator.clipboard.readText()) === 'var(--mtrl-sys-color-primary)', 'Token copies its variable');
  await page.locator('label:has(input[name="lab-copy-mode"][value="hex"])').click();
  await page.getByRole('button', { name: /^Copy primary hex/ }).click();
  assert(await page.evaluate(() => navigator.clipboard.readText()) === expected(state).primary, 'Token copies its resolved hex');
  await page.locator('#lab-inspector > summary').click();
  await page.locator('#lab-get-code').click();
  await page.getByRole('button', { name: 'Copy JavaScript', exact: true }).click();
  assert(await page.evaluate(() => navigator.clipboard.readText()) === labJavaScript(state), 'JS export follows all current controls');
  await page.getByRole('tab', { name: 'JavaScript', exact: true }).press('ArrowRight');
  assert(await page.getByRole('tab', { name: 'CSS', exact: true }).getAttribute('aria-selected') === 'true', 'Tabs support the keyboard');
  await page.getByRole('button', { name: 'Copy CSS', exact: true }).click();
  const css = await page.evaluate(() => navigator.clipboard.readText());
  assert(css.startsWith(':root {') && (css.match(/--mtrl-sys-color-/g) ?? []).length === 40, 'CSS export contains all 40 roles');
  for (const [role, value] of Object.entries(expected(state))) assert(css.includes('--mtrl-sys-color-' + role + ': ' + value), 'CSS export matches ' + role);
  await page.waitForFunction(() => !document.querySelector('#lab-announcement')?.textContent);
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: output + '/colour-lab-code-1440.png', fullPage: true });

  await page.waitForLoadState('networkidle');
  const scriptsBeforeImage = scripts.size;
  for (const name of ['Alpine', 'Lagoon', 'Canyon']) {
    await page.getByRole('button', { name: 'Use ' + name + ' image', exact: true }).click();
    await page.waitForFunction(name => document.querySelector('#lab-image-note')?.textContent === name && !document.querySelector('#colour-lab')?.hasAttribute('aria-busy'), name);
    state.seed = (await stage.getAttribute('data-seed'))!;
    await checkScheme();
    assert(await page.locator('#lab-source-image').isVisible(), 'Image thumbnail is shown');
    assert((await page.locator('#lab-hct').textContent())?.match(/^H \d+ · C \d+ · T \d+$/), 'HCT coordinates are shown');
  }
  assert(scripts.size > scriptsBeforeImage, 'The image quantizer is lazy-loaded');
  const image = await page.evaluate(() => { const canvas = document.createElement('canvas'); canvas.width = canvas.height = 32; const context = canvas.getContext('2d')!; context.fillStyle = '#206e4a'; context.fillRect(0, 0, 32, 32); return canvas.toDataURL('image/png').split(',')[1]!; });
  await page.locator('#lab-image').setInputFiles({ name: 'green.png', mimeType: 'image/png', buffer: Buffer.from(image, 'base64') });
  await page.waitForFunction(() => document.querySelector('#lab-image-note')?.textContent === 'green.png');
  state.seed = '#206e4a'; await checkScheme();
  await page.locator('#lab-image').setInputFiles({ name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from('not a png') });
  await page.waitForFunction(() => document.querySelector('#lab-image-note')?.textContent?.includes('Could not read'));
  await checkScheme();
  const transfer = await page.evaluateHandle(base64 => { const data = new DataTransfer(); const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0)); data.items.add(new File([bytes], 'dropped.png', { type: 'image/png' })); return data; }, image);
  await page.locator('#lab-dropzone').dispatchEvent('drop', { dataTransfer: transfer });
  await transfer.dispose();
  await page.waitForFunction(() => document.querySelector('#lab-image-note')?.textContent === 'dropped.png');
  await checkScheme();
  // An older extraction must not replace a seed chosen while it was pending.
  await page.route('**/assets/playground/landscape-1.svg', async route => { await new Promise(resolve => setTimeout(resolve, 150)); await route.continue(); });
  await page.getByRole('button', { name: 'Use Alpine image', exact: true }).click();
  await page.locator('[data-seed="#0061A4"]').click(); state.seed = '#0061a4'; await checkScheme();
  await page.waitForLoadState('networkidle');
  await checkScheme();
  await page.waitForFunction(() => !document.querySelector('#lab-announcement')?.textContent);
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.locator('#lab-inspector').evaluate(node => { (node as HTMLDetailsElement).open = true; });
    await page.evaluate(() => scrollTo(0, 0));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    assert(!overflow, 'No horizontal overflow at ' + width + 'px with code and tokens open');
    await page.screenshot({ path: output + '/colour-lab-inspector-' + width + '.png', fullPage: true });
  }
  const isolatedStyle = await stage.getAttribute('style');
  await page.locator('#theme-toggle').click();
  assert(await stage.getAttribute('style') === isolatedStyle, 'Site appearance does not overwrite the experimental scheme');
  await page.goto(server.url.origin + '/styles/color/');
  await page.goBack();
  await page.locator('#colour-lab-stage[data-ready="true"]').waitFor();
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  assert((await page.locator('.lab-preview-feedback').textContent())?.includes('Project created'), 'Back navigation leaves a working preview');
  assert(errors.length === 0, 'No page/console/network errors: ' + errors.join('\n'));
  await context.close();
  console.log('Colour Lab checks passed: 40 scoped roles, six seeds, seven variants, modes, presets/continuous contrast, component state, status ratios, token/code clipboard, lazy image samples/upload/drop, stale/error handling, keyboard tabs and 1440/390px layouts.');
} finally { await browser.close(); server.stop(true); }
