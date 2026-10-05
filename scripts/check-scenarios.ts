// Every component's playground, once at Default and once per named scenario. Each load
// must report ready, show the normalized state on every control, and put that same
// state's snippet in the code panel, with no console error and no failed response.
// Custom and an unknown id are not part of this loop.
import { chromium } from 'playwright';
import { handleRequest } from '../server';
import { componentCode, componentSlugs, components, initialComponentState, normalizeComponentState } from '../src/shared/components';

const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: handleRequest });
const base = server.url.toString();
const browser = await chromium.launch({ headless: true });
let loads = 0;
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
try {
  // A fresh context: theme baseline, mode light, vanilla code.
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors: string[] = [];
  // The page hears the preview frame too: Playwright reports a same-origin frame's uncaught
  // errors on the page that owns it, so one listener covers what the spec asks for.
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  const frame = page.frameLocator('#preview');
  /** What every named control shows on the page, read the way a person sees it. */
  function readShown(keys: readonly string[]) {
    return page.evaluate(names => Object.fromEntries(names.map(key => {
      const elements = [...document.querySelectorAll<HTMLInputElement | HTMLSelectElement>(`[name="${key}"]`)];
      const checkboxes = elements.filter((element): element is HTMLInputElement => element instanceof HTMLInputElement && element.type === 'checkbox');
      if (checkboxes.length) return [key, checkboxes[0]!.checked];
      const radio = elements.find(element => element instanceof HTMLInputElement && element.type === 'radio' && element.checked);
      if (radio) return [key, (radio as HTMLInputElement).value];
      const first = elements[0];
      return [key, first instanceof HTMLSelectElement ? first.value : (first as HTMLInputElement | undefined)?.value ?? ''];
    })), [...keys]);
  }
  for (const slug of componentSlugs) {
    for (const scenario of [null, ...components[slug].scenarios]) {
      const where = `${slug}${scenario ? `/?scenario=${scenario.id}` : ''}`;
      errors.length = 0;
      await page.goto(`${base}components/${slug}/${scenario ? `?scenario=${scenario.id}` : ''}`);
      await page.getByRole('status').filter({ hasText: 'Ready to try' }).waitFor();
      await frame.locator('#stage > *').first().waitFor();
      assert(errors.length === 0, `${where}: ${errors.join('\n')}`);
      const state = normalizeComponentState(slug, { ...initialComponentState(slug), ...(scenario?.options ?? {}) });
      if (components[slug].scenarios.length) {
        // (a) A component with scenarios has the section: select and description from it.
        const selected = await page.locator('#scenario').inputValue();
        assert(selected === (scenario?.id ?? 'default'), `${where}: the Scenario select shows "${selected}"`);
        const description = await page.locator('#scenario-description').textContent();
        assert(description === (scenario?.description ?? 'The options this playground starts with.'), `${where}: the scenario description reads ${JSON.stringify(description)}`);
      } else {
        // (b) A component without scenarios has no Scenario section in the DOM at all.
        assert((await page.locator('.scenario-setup').count()) === 0, `${where}: a component without scenarios shows the Scenario section`);
        assert((await page.locator('#scenario').count()) === 0, `${where}: a component without scenarios shows a scenario select`);
      }
      const shown = await readShown([...components[slug].controls.map(control => control.key), 'theme', 'mode']);
      for (const control of components[slug].controls) {
        const expected = control.kind === 'toggle' ? state[control.key] === true : String(state[control.key]);
        assert(shown[control.key] === expected, `${where}: ${control.key} shows ${JSON.stringify(shown[control.key])}, expected ${JSON.stringify(expected)}`);
      }
      assert(shown.theme === state.theme && shown.mode === state.mode, `${where}: the appearance is not baseline, light`);
      const code = await page.locator('#generated-code').textContent();
      assert(code === componentCode(slug, state), `${where}: the code panel does not match the state`);
      loads++;
    }
  }
  // The search scenario's clear button (spec section 6): it shows only while the field has
  // a value, and an empty field must not keep a button to focus.
  await page.goto(`${base}components/text-field/?scenario=search`);
  await page.getByRole('status').filter({ hasText: 'Ready to try' }).waitFor();
  // A CSS locator, not a role one: a hidden button leaves the accessibility tree, and a
  // role locator would wait for it to come back instead of reporting it hidden.
  const field = frame.locator('input.mtrl-text-field__input');
  const clear = frame.locator('button.mtrl-text-field__trailing-icon');
  assert(await clear.isVisible(), 'text-field/search: the clear button is hidden while the field has a value');
  await clear.click();
  assert((await field.inputValue()) === '', 'text-field/search: the clear button did not empty the field');
  assert((await clear.evaluate(element => getComputedStyle(element).display)) === 'none', 'text-field/search: the empty field still displays the clear button');
  assert((await clear.boundingBox()) === null, 'text-field/search: the clear button still takes space on an empty field');
  await field.fill('Trail');
  assert(await clear.isVisible(), 'text-field/search: the clear button did not come back with a value');
  // (c) `?scenario=` on a page with no Scenario section is ignored quietly: the load reports
  // ready with the plain status line, the address keeps the parameter, and the controls are
  // the Default ones, with no console error.
  // Divider is used because it has nothing to vary and stays without scenarios by design.
  errors.length = 0;
  await page.goto(`${base}components/divider/?scenario=x`);
  // Wait for the ready round-trip without matching a status text: a scenario message would
  // pass a "not loading" wait and must fail the assertion below, not the wait.
  await page.waitForFunction(() => document.querySelector('#playground-status')?.textContent !== 'Loading preview…');
  const dividerStatus = await page.locator('#playground-status').textContent();
  assert(dividerStatus === 'Ready to try', `divider/?scenario=x: the status reads ${JSON.stringify(dividerStatus)}`);
  assert(new URL(page.url()).searchParams.get('scenario') === 'x', 'divider/?scenario=x: the load rewrote the address');
  const dividerInitial = initialComponentState('divider');
  const dividerShown = await readShown(components.divider.controls.map(control => control.key));
  for (const control of components.divider.controls) {
    const expected = control.kind === 'toggle' ? dividerInitial[control.key] === true : String(dividerInitial[control.key]);
    assert(dividerShown[control.key] === expected, `divider/?scenario=x: ${control.key} shows ${JSON.stringify(dividerShown[control.key])}, expected ${JSON.stringify(expected)}`);
  }
  assert(errors.length === 0, `divider/?scenario=x: ${errors.join('\n')}`);
  // The button's toggle controls: the selected state reaches the preview, the vanilla
  // panel, and the element panel. The element has no toggle attribute, so that panel
  // names toggle and selected as not yet exposed.
  errors.length = 0;
  await page.goto(`${base}components/button/?scenario=favorite`);
  await page.getByRole('status').filter({ hasText: 'Ready to try' }).waitFor();
  const favorite = frame.locator('#stage button');
  assert(await favorite.getAttribute('aria-pressed') === 'true', 'button/favorite: the preview is not pressed');
  assert((await favorite.getAttribute('class'))?.includes('mtrl-button--selected') === true, 'button/favorite: the preview is not selected');
  const vanilla = await page.locator('#generated-code').textContent();
  assert(vanilla?.includes('toggle: true') === true && vanilla.includes('selected: true'), 'button/favorite: the vanilla panel does not show the selected toggle');
  await page.locator('.framework-tab[data-framework="html"]').click();
  const html = await page.locator('#generated-code').textContent();
  assert(html?.includes('Not yet exposed by the element: toggle, selected.') === true, `button/favorite: the element panel reads ${JSON.stringify(html)}`);
  // The framework tab opens the code view. The click is on the live preview, and the
  // code it checks is the vanilla panel.
  await page.locator('.framework-tab[data-framework="vanilla"]').click();
  await page.getByRole('tab', { name: 'Live preview' }).click();
  await favorite.click();
  await page.waitForFunction(() => {
    const selected = document.querySelector<HTMLInputElement>('input[name="selected"]');
    return selected?.checked === false && document.querySelector<HTMLSelectElement>('#scenario')?.value === 'custom';
  });
  assert(await page.locator('input[name="selected"]').isChecked() === false, 'button/favorite: the Selected control stayed checked after a click');
  assert(await page.locator('#scenario').inputValue() === 'custom', 'button/favorite: the scenario stayed on Favorite after a click');
  const afterClick = await page.locator('#generated-code').textContent();
  assert(afterClick?.includes('selected: true') !== true, 'button/favorite: the code still says selected: true after a click');
  assert(await favorite.getAttribute('aria-pressed') === 'false', 'button/favorite: the preview stayed pressed after a click');
  await page.locator('select[name="variant"]').selectOption('text');
  await page.waitForFunction(() => {
    const toggle = document.querySelector<HTMLInputElement>('input[name="toggle"]');
    const button = document.querySelector<HTMLIFrameElement>('#preview')?.contentDocument?.querySelector('#stage button');
    return toggle?.disabled === true && toggle.checked === false && !!button && !button.hasAttribute('aria-pressed');
  });
  assert(await favorite.getAttribute('aria-pressed') === null, 'button/favorite: a text button is still a toggle');
  assert(errors.length === 0, `button/favorite: ${errors.join('\n')}`);
  // Old state keys (e.g. ?hiking=true) must load quietly with no error and no unknown banner.
  errors.length = 0;
  await page.goto(`${base}components/chips/?hiking=true`);
  await page.getByRole('status').filter({ hasText: 'Ready to try' }).waitFor();
  assert(await page.locator('#playground-status').textContent() === 'Ready to try', 'chips/?hiking=true: status is not Ready to try');
  assert(errors.length === 0, `chips/?hiking=true: ${errors.join('\n')}`);
  console.log(`Scenario checks passed: ${loads} loads over ${componentSlugs.length} components.`);
} finally {
  await browser.close();
  server.stop(true);
}
