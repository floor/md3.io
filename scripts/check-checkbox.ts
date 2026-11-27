import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { handleRequest } from '../server';
import { checkboxChildren } from '../src/shared/content/checkbox';
import * as panel from './panel-driver';
import { playgroundPublic } from '../src/shared/visibility';

// The checkbox playground: by default a parent ("Additions") over M3's four
// children, mixed with Tomato alone checked. `family` off gives a single checkbox.
const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: handleRequest });
const output = resolve(import.meta.dir, '../analysis/browser');
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
type State = 'unchecked' | 'checked' | 'indeterminate';
const names = checkboxChildren.map(child => child.label);
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto(`${server.url}components/button/playground/`);
  // The panel is material's elements: the theme select opens a listbox, and the
  // mode group's buttons live in its shadow root (scripts/panel-driver.ts).
  await panel.chooseTheme(page, 'Forest');
  await panel.chooseMode(page, 'dark');
  // At 1440px the component list is the rail's drawer: it opens on resting on Components.
  await page.locator('m-navigation-rail a[href="/components/"]').hover();
  await page.getByRole('navigation', { name: 'Component list', exact: true }).getByRole('link', { name: 'Checkbox', exact: true }).click();
  // The list opens a component's Overview; its Playground tab holds the preview.
  await page.waitForURL(url => url.pathname === '/components/checkbox/');
  // While the playground is hidden (playgroundPublic) it has no tab: open it by its address.
  if (playgroundPublic) await page.locator('.component-tabs a[href="/components/checkbox/playground/"]').click();
  else await page.goto(new URL('/components/checkbox/playground/', page.url()).href);
  await page.waitForURL(url => url.pathname === '/components/checkbox/playground/');
  const frame = page.frameLocator('#preview');
  const boxes = frame.getByRole('checkbox');
  const parentBox = frame.getByRole('checkbox', { name: 'Additions', exact: true });
  const child = (name: string) => frame.getByRole('checkbox', { name, exact: true });
  // The panel's controls, by name (scripts/panel-driver.ts).
  const chooseState = (state: string) => panel.choose(page, 'state', state);
  const toggle = (name: string) => panel.toggle(page, name);
  const choose = (name: string, value: string) => panel.choose(page, name, value);
  const code = () => page.locator('#generated-code').textContent().then(text => text ?? '');

  // Every checkbox in the preview, in document order, as `state:mixedClass`. The mixed
  // class must follow the input: a click clears `indeterminate`, and the styling with it.
  const readPreview = () => page.evaluate(() => {
    const inputs = [...document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelectorAll<HTMLInputElement>('input[type="checkbox"]') ?? []];
    return {
      boxes: inputs.map(input => {
        const state = input.indeterminate ? 'indeterminate' : input.checked ? 'checked' : 'unchecked';
        const styled = input.closest('.mtrl-checkbox')?.classList.contains('mtrl-checkbox--indeterminate') === input.indeterminate;
        return `${state}${styled ? '' : ':stale-class'}`;
      }),
      select: String((document.querySelector('#configuration m-select[name="state"]') as HTMLElement & { value?: unknown } | null)?.value ?? ''),
    };
  });
  const waitForPreview = async (expected: string[], select: State, what: string) => {
    const want = JSON.stringify({ boxes: expected, select });
    try {
      await page.waitForFunction(want => {
        const inputs = [...document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelectorAll<HTMLInputElement>('input[type="checkbox"]') ?? []];
        const boxes = inputs.map(input => {
          const state = input.indeterminate ? 'indeterminate' : input.checked ? 'checked' : 'unchecked';
          const styled = input.closest('.mtrl-checkbox')?.classList.contains('mtrl-checkbox--indeterminate') === input.indeterminate;
          return `${state}${styled ? '' : ':stale-class'}`;
        });
        return JSON.stringify({ boxes, select: String((document.querySelector('#configuration m-select[name="state"]') as HTMLElement & { value?: unknown } | null)?.value ?? '') }) === want;
      }, want, { timeout: 5000 });
    } catch {
      throw new Error(`${what}: expected ${want}, got ${JSON.stringify(await readPreview())}`);
    }
  };

  // The parent and children: the parent's state, then which children are checked.
  const assertFamily = async (parent: State, checkedChildren: string[], what: string) => {
    await waitForPreview([parent, ...names.map(name => checkedChildren.includes(name) ? 'checked' : 'unchecked')], parent, what);
    const source = await code();
    const parentLine = source.split('\n').find(line => line.startsWith('const parent = createCheckbox('));
    assert(parentLine, `${what}: generated code has no parent checkbox`);
    assert(parentLine.includes('checked: true') === (parent === 'checked') && parentLine.includes('indeterminate: true') === (parent === 'indeterminate'), `${what}: generated parent does not match ${parent}: ${parentLine}`);
  };
  // The generated children: every one when the parent is checked, none when it is not,
  // Tomato alone when it is mixed (checkboxChildChecked).
  const assertFamilyCode = async (parent: State) => {
    const source = await code();
    for (const { label, value } of checkboxChildren) {
      const on = parent === 'checked' || (parent === 'indeterminate' && value === 'tomato');
      assert(source.includes(`{ label: '${label}', value: '${value}'${on ? ', checked: true' : ''} }`), `Generated code does not list ${label} as ${on ? 'checked' : 'unchecked'} for a ${parent} parent`);
    }
  };
  const assertSingle = async (state: State, what: string) => {
    await waitForPreview([state], state, what);
    const source = await code();
    assert(source.includes(`checked: ${state === 'checked'}`) && source.includes(`indeterminate: ${state === 'indeterminate'}`), `${what}: generated code does not match ${state}`);
  };
  const copyCode = async () => {
    await page.getByRole('tab', { name: 'Code', exact: true }).click();
    await page.evaluate(() => navigator.clipboard.writeText(''));
    await page.getByRole('button', { name: 'Copy code', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Code copied' }).waitFor();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    assert(copied && copied === await code(), 'Copied checkbox code differs from displayed code');
    await page.getByRole('tab', { name: 'Preview', exact: true }).click();
    return copied;
  };

  // Defaults: M3's parent and children, mixed, in the saved preview appearance.
  await parentBox.waitFor();
  assert(await boxes.count() === 5, 'The playground does not start with a parent and four children');
  await assertFamily('indeterminate', ['Tomato'], 'Default');
  await assertFamilyCode('indeterminate');
  const controls = await parentBox.getAttribute('aria-controls');
  const childIds = await Promise.all(names.map(name => child(name).getAttribute('id')));
  assert(controls === childIds.join(' '), 'The parent does not name its children in aria-controls');
  assert(!await parentBox.evaluate((element: HTMLInputElement) => element.required), 'Checkbox starts required');
  await page.waitForFunction(() => document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.documentElement.dataset.themeMode === 'dark');
  assert(await frame.locator('html').getAttribute('data-theme') === 'forest', 'Checkbox lost saved preview appearance');
  // The tabbed page's hero names the component (its family is in the drawer).
  assert((await page.locator('.component-hero h1').textContent())?.trim() === 'Checkbox', 'Checkbox hero has the wrong title');
  await page.screenshot({ path: `${output}/checkbox-desktop.png`, fullPage: true, animations: 'disabled' });

  // A theme or tab change restyles the preview without recreating it.
  const originalParent = await parentBox.elementHandle();
  await page.getByRole('tab', { name: 'Code', exact: true }).click();
  assert(await page.locator('#generated-code .hljs-keyword').count() > 0, 'Checkbox code is not highlighted');
  await page.getByRole('tab', { name: 'Preview', exact: true }).click();
  await panel.chooseTheme(page, 'Ocean');
  await page.waitForFunction(() => document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.documentElement.dataset.theme === 'ocean');
  assert(await originalParent!.evaluate(element => element.isConnected), 'Theme or tab change recreated the checkboxes');
  await assertFamily('indeterminate', ['Tomato'], 'After a theme change');

  // The parent: checking a mixed parent checks every child, unchecking it unchecks them.
  await parentBox.click();
  await assertFamily('checked', names, 'Clicking the mixed parent');
  await assertFamilyCode('checked');
  await parentBox.click();
  await assertFamily('unchecked', [], 'Clicking the checked parent');
  await assertFamilyCode('unchecked');
  await parentBox.press('Space');
  await assertFamily('checked', names, 'Space on the unchecked parent');

  // The children: a mix makes the parent indeterminate, all or none settles it.
  await child('Pickles').click();
  await assertFamily('indeterminate', ['Tomato', 'Lettuce', 'Cheese'], 'Unchecking one child');
  for (const name of ['Tomato', 'Lettuce']) await child(name).click();
  await assertFamily('indeterminate', ['Cheese'], 'Unchecking three children');
  await child('Cheese').press('Space');
  await assertFamily('unchecked', [], 'Unchecking the last child');
  await child('Lettuce').click();
  await assertFamily('indeterminate', ['Lettuce'], 'Checking one child');
  let childSource = await code();
  assert(childSource.includes("{ label: 'Lettuce', value: 'lettuce', checked: true }"), 'Checking one child: generated code does not check Lettuce');
  assert(childSource.includes("{ label: 'Pickles', value: 'pickles' }") && !childSource.includes("{ label: 'Pickles', value: 'pickles', checked: true }"), 'Checking one child: generated code checks Pickles');
  assert(childSource.includes("{ label: 'Tomato', value: 'tomato' }") && !childSource.includes("{ label: 'Tomato', value: 'tomato', checked: true }"), 'Checking one child: generated code checks Tomato');
  assert(childSource.includes("{ label: 'Cheese', value: 'cheese' }") && !childSource.includes("{ label: 'Cheese', value: 'cheese', checked: true }"), 'Checking one child: generated code checks Cheese');
  await choose('labelPosition', 'start');
  await assertFamily('indeterminate', ['Lettuce'], 'Label position after a child was checked');
  childSource = await code();
  assert(childSource.includes("{ label: 'Lettuce', value: 'lettuce', checked: true }"), 'Label position: generated code does not check Lettuce');
  assert(childSource.includes("{ label: 'Pickles', value: 'pickles' }") && !childSource.includes("{ label: 'Pickles', value: 'pickles', checked: true }"), 'Label position: generated code checks Pickles');
  assert(childSource.includes("{ label: 'Tomato', value: 'tomato' }") && !childSource.includes("{ label: 'Tomato', value: 'tomato', checked: true }"), 'Label position: generated code checks Tomato');
  assert(childSource.includes("{ label: 'Cheese', value: 'cheese' }") && !childSource.includes("{ label: 'Cheese', value: 'cheese', checked: true }"), 'Label position: generated code checks Cheese');
  await choose('labelPosition', 'end');
  for (const name of ['Pickles', 'Tomato', 'Cheese']) await child(name).click();
  await assertFamily('checked', names, 'Checking every child');
  await child('Tomato').click();
  await assertFamily('indeterminate', ['Pickles', 'Lettuce', 'Cheese'], 'Unchecking a child of a checked parent');
  await parentBox.press('Space');
  await assertFamily('checked', names, 'Space on a parent mixed by its children');

  // The state select drives the parent and the children with it. The select still
  // reads indeterminate after the preview's own edits above, and re-picking the value
  // a select shows is no change (the playground drops it, as a native select fires
  // none), so the loop starts on another state: each pick is a real change.
  for (const state of ['unchecked', 'checked', 'indeterminate'] as const) {
    await chooseState(state);
    await assertFamily(state, state === 'checked' ? names : state === 'indeterminate' ? ['Tomato'] : [], `Selecting ${state}`);
    await assertFamilyCode(state);
  }
  await page.screenshot({ path: `${output}/checkbox-mixed.png`, fullPage: true, animations: 'disabled' });

  // Content and appearance reach every box of the family.
  await panel.fill(page, 'label', 'Toppings');
  await frame.getByRole('checkbox', { name: 'Toppings', exact: true }).waitFor();
  assert(await boxes.count() === 5, 'Renaming the parent changed the family');
  await panel.fill(page, 'name', 'toppings');
  await page.waitForFunction(() => {
    const inputs = [...document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelectorAll<HTMLInputElement>('input[type="checkbox"]') ?? []];
    return inputs.length === 5 && inputs.slice(1).every(input => input.name === 'toppings');
  });
  assert(JSON.stringify(await Promise.all(names.map(name => child(name).inputValue()))) === JSON.stringify(checkboxChildren.map(({ value }) => value)), 'Children lost their own values');
  let source = await code();
  assert(source.includes("label: 'Toppings'") && source.includes("name: 'toppings'"), 'Generated family code does not follow label and name');
  await choose('labelPosition', 'start');
  await page.waitForFunction(() => document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelectorAll('.mtrl-checkbox--label-start').length === 5);
  await toggle('disabled');
  await page.waitForFunction(() => [...document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelectorAll<HTMLInputElement>('input[type="checkbox"]') ?? []].every(input => input.disabled));
  source = await code();
  assert(source.includes("labelPosition: 'start'") && source.includes('disabled: true'), 'Generated family code does not follow label position and disabled');
  const familyCopy = await copyCode();
  assert(familyCopy.includes('parent.on(') && familyCopy.includes("'material/styles/checkbox'") && familyCopy.includes("import 'material/themes/ocean'"), 'Copied family code is incomplete');
  await toggle('disabled');
  await choose('labelPosition', 'end');
  await panel.fill(page, 'label', 'Additions');
  await panel.fill(page, 'name', 'additions');
  await assertFamily('indeterminate', ['Tomato'], 'After restoring the family content');

  // `family` off: a single checkbox, which the state select, click and Space drive.
  await toggle('family');
  await page.waitForFunction(() => document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelectorAll('input[type="checkbox"]').length === 1);
  const input = frame.getByRole('checkbox');
  assert(await input.getAttribute('name') === 'additions' && await input.inputValue() === 'on', 'The single checkbox did not take name and value');
  await parentBox.waitFor();
  await assertSingle('indeterminate', 'A single mixed checkbox');
  assert(!(await code()).includes('const parent'), 'Single checkbox code still describes the family');
  for (const state of ['unchecked', 'checked', 'indeterminate'] as const) {
    await chooseState(state);
    await assertSingle(state, `Selecting ${state} on a single checkbox`);
  }
  await input.click();
  await assertSingle('checked', 'Clicking a mixed checkbox');
  await chooseState('indeterminate');
  await assertSingle('indeterminate', 'Selecting indeterminate again');
  await input.press('Space');
  await assertSingle('checked', 'Space on a mixed checkbox');
  await input.press('Space');
  await assertSingle('unchecked', 'Space on a checked checkbox');

  // The controls reach the single checkbox.
  await choose('labelPosition', 'start');
  await frame.locator('.mtrl-checkbox--label-start').waitFor();
  const labelBox = await frame.locator('.mtrl-checkbox__label').boundingBox();
  const iconBox = await frame.locator('.mtrl-checkbox__icon').boundingBox();
  assert(labelBox && iconBox && labelBox.x < iconBox.x, 'Start label is not before the checkbox');
  await panel.fill(page, 'label', 'Receive updates');
  await frame.getByRole('checkbox', { name: 'Receive updates' }).waitFor();
  await panel.fill(page, 'name', 'updates');
  await panel.fill(page, 'value', 'yes');
  await page.waitForFunction(() => document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelector<HTMLInputElement>('input')?.value === 'yes');
  assert(await input.getAttribute('name') === 'updates', 'Form name was not applied');
  await toggle('required');
  await page.waitForFunction(() => document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelector<HTMLInputElement>('input')?.required);
  assert(await input.evaluate((element: HTMLInputElement) => element.validity.valueMissing), 'Required unchecked input should be invalid');
  await toggle('required');
  await page.waitForFunction(() => !document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelector<HTMLInputElement>('input')?.required);
  await toggle('error');
  await frame.locator('.mtrl-checkbox--error').waitFor();
  assert(await input.getAttribute('aria-invalid') === 'true', 'Error is not exposed as aria-invalid');
  await toggle('error');
  await page.waitForFunction(() => document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelectorAll('.mtrl-checkbox--error').length === 0);
  assert(await input.getAttribute('aria-invalid') === null, 'Clearing the error left aria-invalid');
  await toggle('disabled');
  await page.waitForFunction(() => document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelector<HTMLInputElement>('input')?.disabled);
  await input.evaluate((element: HTMLInputElement) => element.click());
  await assertSingle('unchecked', 'Clicking a disabled checkbox');
  await panel.fill(page, 'label', '');
  await frame.getByRole('checkbox', { name: 'Checkbox', exact: true }).waitFor();

  const copied = await copyCode();
  assert(copied.includes('createCheckbox') && copied.includes('material/styles/checkbox') && copied.includes("setAttribute('aria-label', 'Checkbox')") &&
    copied.includes('disabled: true') && copied.includes('labelPosition: "start"') && copied.includes('name: "updates"') && copied.includes('value: "yes"') &&
    !copied.includes('required') && !copied.includes('error'), 'Copied checkbox code is incomplete');

  // Reset: back to the parent and children, in the viewer's preview appearance.
  await page.getByRole('tab', { name: 'Code', exact: true }).click();
  // The material panel's way back is the Scenario select's Default (it has no Reset).
  await panel.backToDefault(page);
  await page.getByRole('tab', { name: 'Preview', exact: true }).click();
  await parentBox.waitFor();
  await assertFamily('indeterminate', ['Tomato'], 'Reset');
  await assertFamilyCode('indeterminate');
  assert(await panel.isOn(page, 'family'), 'Reset did not turn the family back on');
  assert(await parentBox.isEnabled() && await frame.locator('.mtrl-checkbox--label-start').count() === 0, 'Reset did not restore the defaults');
  assert(await page.evaluate(() => document.documentElement.dataset.siteTheme) === 'ocean', 'Reset cleared preview preference');
  assert(await frame.locator('html').getAttribute('data-theme-mode') === 'dark', 'Reset cleared preview mode');

  for (const viewport of [{ width: 1440, height: 1000 }, { width: 1366, height: 768 }, { width: 1280, height: 640 }]) {
    await page.setViewportSize(viewport);
    await panel.checkPlaygroundScroll(page, 'checkbox', viewport.height === 1000 ? 'fit' : 'page');
  }
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Checkbox mobile layout overflows');
  await page.screenshot({ path: `${output}/checkbox-mobile.png`, fullPage: true, animations: 'disabled' });
  await page.goto(`${server.url}components/checkbox/develop/`);
  assert(await page.locator('.component-tabs a', { hasText: 'Overview' }).getAttribute('href') === '/components/checkbox/', 'Checkbox Develop tab links to the wrong playground');
  assert(errors.length === 0, errors.join('\n'));
  console.log('Checkbox browser checks passed.');
} finally {
  await browser.close();
  server.stop(true);
}
