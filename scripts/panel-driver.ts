// Drives the playground's configuration controls by name, whichever way a row is
// rendered: material's elements (m-select, m-switch, m-text-field, m-button-group
// with its hidden input) or the native inputs the panel keeps for the kinds it does
// not render as elements yet (range, date, time, icon rows past five). The browser
// checks go through these, so they read the same on every page.
//
// Each action goes through the control's own UI — a click on the option, the switch,
// the group's button; typing into the field — so a check exercises what a person does.
import type { Locator, Page } from 'playwright';

const inPanel = (page: Page, selector: string) => page.locator(`#configuration ${selector}`);

/**
 * The playground's settings are a side sheet, closed until Settings opens it: open it before
 * reaching for a control (once open it stays so for the page).
 */
export async function openSettings(page: Page): Promise<void> {
  // After a client navigation the address changes before the page arrives: wait for its form.
  await page.locator('#configuration').waitFor({ state: 'attached' });
  const toggle = page.locator('#settings-toggle');
  if (!await toggle.count()) return;
  // After a client navigation the page's script may not have wired the button yet: press
  // again until the sheet is open.
  for (let attempt = 0; attempt < 20; attempt++) {
    if (await page.locator('.playground[data-settings-open]').count()) return;
    if (attempt % 4 === 0) await toggle.click();
    await page.waitForTimeout(100);
  }
  await page.locator('.playground[data-settings-open]').waitFor();
}

/** The select element (material or native) carrying `name`, or null. */
async function selectFor(page: Page, name: string): Promise<Locator | null> {
  for (const selector of [`m-select[name="${name}"]`, `select[name="${name}"]`]) {
    const found = inPanel(page, selector);
    if (await found.count()) return found.first();
  }
  return null;
}

/** Clicks a listbox option and waits for the list to close, as a person's next
 *  click waits: a click while the list is still closing lands on nothing. */
async function pickOption(page: Page, label: string): Promise<void> {
  const option = page.getByRole('option', { name: label, exact: true });
  await option.click();
  await option.waitFor({ state: 'hidden' });
}

/** Picks `value` in the control named `name`: a select's option or a group's button. */
export async function choose(page: Page, name: string, value: string): Promise<void> {
  await openSettings(page);
  const group = inPanel(page, `m-button-group[data-group-for="${name}"]`);
  if (await group.count()) {
    // The item's accessible name: its label, or its aria-label for an icon item.
    const label = await group.locator(`m-button-group-item[value="${value}"]`).evaluate(item => item.getAttribute('aria-label') ?? item.textContent!.trim());
    await group.getByRole('button', { name: label, exact: true }).click();
    await page.waitForFunction(([key, wanted]) => document.querySelector<HTMLInputElement>(`input[data-input-for="${key}"]`)?.value === wanted, [name, value] as const);
    return;
  }
  const select = await selectFor(page, name);
  if (select && await select.evaluate(element => element.tagName === 'M-SELECT')) {
    // Picked through the listbox even when it already shows the value: material's
    // select emits change for that pick, and a person can re-apply a value so.
    const label = await select.locator(`m-select-option[value="${value}"]`).evaluate(option => option.textContent!.trim());
    await select.click();
    await pickOption(page, label);
    await page.waitForFunction(([key, wanted]) => String((document.querySelector(`#configuration m-select[name="${key}"]`) as HTMLElement & { value?: unknown } | null)?.value) === wanted, [name, value] as const);
    return;
  }
  if (select) { await select.selectOption(value); return; }
  // A native radio row (an icon row past five).
  await inPanel(page, `label.choice:has(input[name="${name}"][value="${value}"])`).click();
}

/** The switch (material or native) named `name`: a locator to click, and its state. */
export function switchFor(page: Page, name: string): Locator {
  return inPanel(page, `m-switch[name="${name}"], label:has(> span > input[type="checkbox"][name="${name}"])`).first();
}

/** Flips the switch named `name`. */
export async function toggle(page: Page, name: string): Promise<void> {
  await openSettings(page);
  const before = await isOn(page, name);
  await switchFor(page, name).click();
  await page.waitForFunction(([key, was]) => {
    const host = document.querySelector<HTMLElement & { checked?: boolean }>(`#configuration m-switch[name="${key}"]`);
    const input = document.querySelector<HTMLInputElement>(`#configuration input[type="checkbox"][name="${key}"]`);
    return (host ? host.checked : input?.checked) !== was;
  }, [name, before] as const);
}

/** Sets the switch named `name` on or off. */
export async function setSwitch(page: Page, name: string, on: boolean): Promise<void> {
  await openSettings(page);
  if (await isOn(page, name) !== on) await toggle(page, name);
}

/** Whether the switch named `name` is on. */
export function isOn(page: Page, name: string): Promise<boolean> {
  return page.evaluate(key => {
    const host = document.querySelector<HTMLElement & { checked?: boolean }>(`#configuration m-switch[name="${key}"]`);
    if (host) return host.checked === true;
    return document.querySelector<HTMLInputElement>(`#configuration input[type="checkbox"][name="${key}"]`)?.checked === true;
  }, name);
}

/** Types `text` into the field named `name`, replacing what it held. */
export async function fill(page: Page, name: string, text: string): Promise<void> {
  await openSettings(page);
  const field = inPanel(page, `m-text-field[name="${name}"]`);
  if (await field.count()) await field.locator('input, textarea').first().fill(text);
  else await inPanel(page, `input[name="${name}"]:not([type="hidden"])`).fill(text);
}

/** The value the control named `name` carries: what the form reads. */
export function value_(page: Page, name: string): Promise<string> {
  return page.evaluate(key => {
    const host = document.querySelector<HTMLElement & { value?: unknown }>(`#configuration m-select[name="${key}"], #configuration m-text-field[name="${key}"], #configuration m-slider[name="${key}"]`);
    if (host) return String(host.value ?? '');
    const groupInput = document.querySelector<HTMLInputElement>(`input[data-input-for="${key}"]`);
    if (groupInput) return groupInput.value;
    const radio = document.querySelector<HTMLInputElement>(`#configuration input[type="radio"][name="${key}"]:checked`);
    if (radio) return radio.value;
    return document.querySelector<HTMLInputElement | HTMLSelectElement>(`#configuration [name="${key}"]`)?.value ?? '';
  }, name);
}
export { value_ as valueOf };

/** Whether the control named `name` is disabled (an element's attribute, a native input's property). */
export function isDisabled(page: Page, name: string): Promise<boolean> {
  return page.evaluate(key => {
    const host = document.querySelector(`#configuration m-select[name="${key}"], #configuration m-switch[name="${key}"], #configuration m-text-field[name="${key}"], #configuration m-slider[name="${key}"], #configuration m-button-group[data-group-for="${key}"]`);
    if (host) return host.hasAttribute('disabled');
    const inputs = [...document.querySelectorAll<HTMLInputElement>(`#configuration [name="${key}"]`)];
    return inputs.length > 0 && inputs.every(input => input.disabled);
  }, name);
}

/** Picks the preview's theme (the heading's select, material or native). */
export async function chooseTheme(page: Page, label: string): Promise<void> {
  // The site header's Themes control: material's icon button and menu (one theme for
  // the whole site, preview and panel). The button toggles the menu: open it only if
  // its items are not showing, then pick.
  const value = await page.locator('#theme-menu-template').evaluate((template, wanted) =>
    [...(template as HTMLTemplateElement).content.querySelectorAll('m-menu-item')].find(item => item.textContent?.trim() === wanted)?.getAttribute('value') ?? '', label);
  await clickUntil(page, async () => {
    const item = page.getByRole('menuitem', { name: label, exact: true });
    if (!await item.isVisible().catch(() => false)) await page.locator('#theme-picker').click();
    await item.click();
  }, () => page.evaluate(wanted => document.documentElement.dataset.siteTheme === wanted, value), `theme ${label}`);
}

/**
 * Clicks, then confirms the click took, and fails saying what it reads if not.
 * (A second click here once hid a real bug: material's single-selection group
 * cleared on a click on its selected segment, so a remembered Dark clicked again
 * went back to light. The groups are `required` now.)
 */
async function clickUntil(page: Page, act: () => Promise<void>, took: () => Promise<boolean>, what: string): Promise<void> {
  await act();
  for (let i = 0; i < 20 && !await took(); i++) await page.waitForTimeout(50);
  if (!await took()) throw new Error(`panel-driver: the click on ${what} did not take`);
}

/** Sets the site's mode, light or dark (the header's moon): site, preview and panel together. */
export async function chooseMode(page: Page, mode: 'light' | 'dark'): Promise<void> {
  if (await page.evaluate(() => document.documentElement.dataset.themeMode) === mode) return;
  await clickUntil(page, () => page.locator('#theme-toggle').click(),
    () => page.evaluate(wanted => document.documentElement.dataset.themeMode === wanted, mode), `mode ${mode}`);
}

/** Picks a framework with the preview controls (Factory is the vanilla entry). */
export async function chooseFramework(page: Page, id: string): Promise<void> {
  const chips = page.locator('m-chips.framework-chips');
  if (await chips.count()) {
    const label = await chips.locator(`m-chip[value="${id}"]`).evaluate(chip => chip.textContent!.trim());
    await chips.getByRole('gridcell', { name: label, exact: true }).click();
    return;
  }
  await page.locator(`.framework-tab[data-framework="${id}"]`).click();
}

/** Back to the playground's starting options: the Scenario select's Default, the
 *  material panel's way back (it has no Reset), or Reset on a native panel. */
export async function backToDefault(page: Page): Promise<void> {
  await openSettings(page);
  const scenario = page.locator('m-select#scenario');
  if (await scenario.count()) {
    const current = await scenario.evaluate(host => String((host as HTMLElement & { value?: unknown }).value ?? ''));
    if (current !== 'default') {
      await scenario.click();
      await pickOption(page, 'Default');
    }
    await page.waitForFunction(() => String((document.querySelector('m-select#scenario') as HTMLElement & { value?: unknown } | null)?.value) === 'default');
    // Reset waited for the preview's own "Configuration reset" reply; the Default pick
    // has none, so wait until the preview's stage stops being replaced.
    await previewSettled(page);
    return;
  }
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Configuration reset' }).waitFor();
}

/** Waits until the control named `name` carries `expected` (valueOf's reading). */
export async function waitForValue(page: Page, name: string, expected: string): Promise<void> {
  try { await waitForValueOnce(page, name, expected); }
  catch (error) { throw new Error(`${name} never read ${JSON.stringify(expected)}; it reads ${JSON.stringify(await value_(page, name))}`, { cause: error }); }
}
async function waitForValueOnce(page: Page, name: string, expected: string): Promise<void> {
  await page.waitForFunction(([key, wanted]) => {
    const host = document.querySelector<HTMLElement & { value?: unknown }>(`#configuration m-select[name="${key}"], #configuration m-text-field[name="${key}"], #configuration m-slider[name="${key}"]`);
    if (host) return String(host.value ?? '') === wanted;
    const groupInput = document.querySelector<HTMLInputElement>(`input[data-input-for="${key}"]`);
    if (groupInput) return groupInput.value === wanted;
    const radio = document.querySelector<HTMLInputElement>(`#configuration input[type="radio"][name="${key}"]:checked`);
    if (radio) return radio.value === wanted;
    return document.querySelector<HTMLInputElement | HTMLSelectElement>(`#configuration [name="${key}"]`)?.value === wanted;
  }, [name, expected] as const);
}

/** Waits until the switch named `name` is on (or off). */
export async function waitForSwitch(page: Page, name: string, on: boolean): Promise<void> {
  await page.waitForFunction(([key, wanted]) => {
    const host = document.querySelector<HTMLElement & { checked?: boolean }>(`#configuration m-switch[name="${key}"]`);
    const checked = host ? host.checked === true : document.querySelector<HTMLInputElement>(`#configuration input[type="checkbox"][name="${key}"]`)?.checked === true;
    return checked === wanted;
  }, [name, on] as const);
}

/** The Scenario select's value (material or native). */
export function scenarioValue(page: Page): Promise<string> {
  return page.locator('#scenario').evaluate(element => String((element as HTMLElement & { value?: unknown }).value ?? ''));
}

/** Picks a scenario by id in the Scenario select. */
export async function chooseScenario(page: Page, id: string): Promise<void> {
  await openSettings(page);
  const host = page.locator('m-select#scenario');
  if (await host.count()) {
    if (await scenarioValue(page) === id) return;
    const label = await host.locator(`m-select-option[value="${id}"]`).evaluate(option => option.textContent!.trim());
    await host.click();
    await pickOption(page, label);
    await page.waitForFunction(wanted => String((document.querySelector('m-select#scenario') as HTMLElement & { value?: unknown } | null)?.value) === wanted, id);
    return;
  }
  await page.locator('#scenario').selectOption(id);
}

/** Waits until the preview's stage element survives 250 ms without being replaced. */
export async function previewSettled(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 40; attempt++) {
    const marked = await page.evaluate(mark => {
      const element = document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelector('#stage > *');
      element?.setAttribute('data-settle-mark', mark);
      return !!element;
    }, String(attempt));
    await page.waitForTimeout(250);
    const kept = marked && await page.evaluate(mark => {
      const element = document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelector(`#stage > [data-settle-mark="${mark}"]`);
      element?.removeAttribute('data-settle-mark');
      return !!element;
    }, String(attempt));
    if (kept) return;
  }
  throw new Error('The preview kept re-rendering');
}

/** Moves the slider named `name` to `value`, through its handle with the arrow
 *  keys (material's slider), or by typing into a native range input. */
export async function slide(page: Page, name: string, value: string): Promise<void> {
  await openSettings(page);
  const host = inPanel(page, `m-slider[name="${name}"]`);
  if (await host.count()) {
    const { current, step } = await host.evaluate(element => ({
      current: Number((element as HTMLElement & { value?: unknown }).value),
      step: Number(element.getAttribute('step')) || 1,
    }));
    const presses = Math.round((Number(value) - current) / step);
    await host.getByRole('slider').first().focus();
    for (let i = 0; i < Math.abs(presses); i++) await page.keyboard.press(presses > 0 ? 'ArrowRight' : 'ArrowLeft');
    await waitForValue(page, name, value);
    return;
  }
  await inPanel(page, `input[name="${name}"]`).fill(value);
}

/** A wide, tall playground fits the window. A short window uses document scrolling. */
export async function checkPlaygroundScroll(page: Page, label: string, scroll: 'fit' | 'page'): Promise<void> {
  const metrics = await page.evaluate(() => {
    const root = document.documentElement;
    const form = document.querySelector('#configuration')!;
    const body = form.querySelector('.configuration-body')!;
    return {
      // The playground itself fits the window; the page may continue below it (previous and next).
      width: innerWidth, height: innerHeight, scrollWidth: root.scrollWidth, playgroundHeight: Math.round(document.querySelector('.playground')!.getBoundingClientRect().height),
      formOverflow: getComputedStyle(form).overflowY, bodyOverflow: getComputedStyle(body).overflowY,
    };
  });
  if (metrics.scrollWidth > metrics.width + 1) throw new Error(`${label}: playground overflows horizontally: ${JSON.stringify(metrics)}`);
  if (scroll === 'fit') {
    // The playground starts below the page's hero and tabs: scrolled to, it is seen whole.
    if (metrics.playgroundHeight > metrics.height + 1) throw new Error(`${label}: playground does not fit the tall window: ${JSON.stringify(metrics)}`);
    return;
  }
  if (metrics.formOverflow !== 'visible' || metrics.bodyOverflow !== 'visible') {
    throw new Error(`${label}: configuration has its own scroll in a short or narrow window: ${JSON.stringify(metrics)}`);
  }
  const last = inPanel(page, '.ui-row:visible').last();
  const reachable = await last.evaluate(element => {
    element.scrollIntoView({ block: 'center', behavior: 'instant' });
    const header = document.querySelector('.header')!.getBoundingClientRect();
    const bar = document.querySelector('.site-primary-bar')?.getBoundingClientRect();
    const bottom = bar?.height ? bar.top : innerHeight;
    const row = element.getBoundingClientRect();
    return row.top >= header.bottom && row.bottom <= bottom + 1;
  });
  if (!reachable) throw new Error(`${label}: the final configuration row is obscured`);
}
