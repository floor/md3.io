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
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  const frame = page.frameLocator('#preview');
  for (const slug of componentSlugs) {
    for (const scenario of [null, ...components[slug].scenarios]) {
      const where = `${slug}${scenario ? `/?scenario=${scenario.id}` : ''}`;
      errors.length = 0;
      await page.goto(`${base}components/${slug}/${scenario ? `?scenario=${scenario.id}` : ''}`);
      await page.getByRole('status').filter({ hasText: 'Ready to try' }).waitFor();
      await frame.locator('#stage > *').first().waitFor();
      assert(errors.length === 0, `${where}: ${errors.join('\n')}`);
      const state = normalizeComponentState(slug, { ...initialComponentState(slug), ...(scenario?.options ?? {}) });
      const selected = await page.locator('#scenario').inputValue();
      assert(selected === (scenario?.id ?? 'default'), `${where}: the Scenario select shows "${selected}"`);
      const description = await page.locator('#scenario-description').textContent();
      assert(description === (scenario?.description ?? 'The options this playground starts with.'), `${where}: the scenario description reads ${JSON.stringify(description)}`);
      const shown = await page.evaluate(keys => Object.fromEntries(keys.map(key => {
        const elements = [...document.querySelectorAll<HTMLInputElement | HTMLSelectElement>(`[name="${key}"]`)];
        const checkboxes = elements.filter((element): element is HTMLInputElement => element instanceof HTMLInputElement && element.type === 'checkbox');
        if (checkboxes.length) return [key, checkboxes[0]!.checked];
        const radio = elements.find(element => element instanceof HTMLInputElement && element.type === 'radio' && element.checked);
        if (radio) return [key, (radio as HTMLInputElement).value];
        const first = elements[0];
        return [key, first instanceof HTMLSelectElement ? first.value : (first as HTMLInputElement | undefined)?.value ?? ''];
      })), [...components[slug].controls.map(control => control.key), 'theme', 'mode']);
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
  console.log(`Scenario checks passed: ${loads} loads over ${componentSlugs.length} components.`);
} finally {
  await browser.close();
  server.stop(true);
}
