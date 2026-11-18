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
  const field = inPanel(page, `m-text-field[name="${name}"]`);
  if (await field.count()) await field.locator('input, textarea').first().fill(text);
  else await inPanel(page, `input[name="${name}"]:not([type="hidden"])`).fill(text);
}

/** The value the control named `name` carries: what the form reads. */
export function value_(page: Page, name: string): Promise<string> {
  return page.evaluate(key => {
    const host = document.querySelector<HTMLElement & { value?: unknown }>(`#configuration m-select[name="${key}"], #configuration m-text-field[name="${key}"]`);
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
    const host = document.querySelector(`#configuration m-select[name="${key}"], #configuration m-switch[name="${key}"], #configuration m-text-field[name="${key}"], #configuration m-button-group[data-group-for="${key}"]`);
    if (host) return host.hasAttribute('disabled');
    const inputs = [...document.querySelectorAll<HTMLInputElement>(`#configuration [name="${key}"]`)];
    return inputs.length > 0 && inputs.every(input => input.disabled);
  }, name);
}

/** Picks the preview's theme (the heading's select, material or native). */
export async function chooseTheme(page: Page, label: string): Promise<void> {
  const host = page.locator('m-select#preview-theme');
  if (await host.count()) { await host.click(); await pickOption(page, label); return; }
  await page.locator('#preview-theme').selectOption({ label });
}

/** Picks the preview's mode, light or dark. */
export async function chooseMode(page: Page, mode: 'light' | 'dark'): Promise<void> {
  const group = page.locator('m-button-group[data-group-for="mode"]');
  if (await group.count()) { await group.getByRole('button', { name: mode === 'light' ? 'Light' : 'Dark', exact: true }).click(); return; }
  await page.locator(`input[name="mode"][value="${mode}"]`).check({ force: true });
}

/** Picks a framework in the picker above the heading (Factory is the vanilla entry). */
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
    const host = document.querySelector<HTMLElement & { value?: unknown }>(`#configuration m-select[name="${key}"], #configuration m-text-field[name="${key}"]`);
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
