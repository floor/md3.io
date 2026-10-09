// Element stage against the factory stage. Runs from test:browser only when
// STAGE_ELEMENTS is set (1, or a comma-separated slug list), so a draft does
// not change main's gate.
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, type Page } from 'playwright';
import { handleRequest } from '../server';
import { components, isComponent } from '../src/shared/components';
import { elementStage, type ElementStageSlug } from '../src/shared/stage-elements';

const requested = process.env.STAGE_ELEMENTS ?? '';
if (!requested) {
  console.log('Stage elements check skipped (set STAGE_ELEMENTS to run it).');
  process.exit(0);
}

const tier = (Object.keys(elementStage) as ElementStageSlug[]).filter(slug => slug !== 'slider'
  ? true
  : requested === '1' || requested.split(',').includes('slider'));
const slugs = (requested === '1' ? tier.filter(slug => slug !== 'slider') : requested.split(',')).filter(isComponent);
const unknown = slugs.filter(slug => !(slug in elementStage));
if (unknown.length) throw new Error(`not an element-stage page: ${unknown.join(', ')}`);

const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: handleRequest });
const browser = await chromium.launch({ headless: true });
const dir = await mkdtemp(join(tmpdir(), 'stage-elements-'));
const lines: string[] = [];
let failed = 0;

const fail = (message: string) => { failed++; lines.push(`FAIL ${message}`); console.error(message); };

async function differ(a: string, b: string): Promise<string> {
  const proc = Bun.spawn(['magick', 'compare', '-metric', 'AE', a, b, 'null:'], { stderr: 'pipe', stdout: 'ignore' });
  const err = await new Response(proc.stderr).text();
  await proc.exited;
  const count = err.trim().split(/\s+/)[0] ?? 'unknown';
  return count;
}

async function open(page: Page, slug: string, scenario: string, elements: boolean) {
  const query = new URLSearchParams();
  if (elements) query.set('stage', 'elements');
  if (scenario !== 'default') query.set('scenario', scenario);
  const search = query.size ? `?${query}` : '';
  const errors: string[] = [];
  const onError = (error: Error) => errors.push(error.message);
  page.on('pageerror', onError);
  await page.goto(`${server.url}components/${slug}/${search}`, { waitUntil: 'networkidle' });
  await page.getByRole('status').filter({ hasText: 'Ready to try' }).waitFor();
  page.off('pageerror', onError);
  const frame = page.frame({ url: /\/preview\// });
  if (!frame) throw new Error(`no preview frame for ${slug}`);
  const root = frame.locator('#stage > *');
  await root.waitFor();
  const box = await root.boundingBox();
  const select = await page.locator('#scenario').count() ? await page.locator('#scenario').inputValue() : 'default';
  return { errors, box, select, root, frame };
}

try {
  for (const mode of ['light', 'dark'] as const) {
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    await context.addInitScript(appearance => {
      localStorage.setItem('md3-preview-appearance', appearance);
      const watch = () => {
        const stage = document.querySelector('#stage');
        if (!stage || stage.hasAttribute('data-watched')) return;
        stage.setAttribute('data-watched', '');
        (window as unknown as { __stageReplaced: number }).__stageReplaced = 0;
        new MutationObserver(() => { (window as unknown as { __stageReplaced: number }).__stageReplaced++; }).observe(stage, { childList: true });
      };
      new MutationObserver(watch).observe(document, { childList: true, subtree: true });
    }, JSON.stringify({ theme: 'baseline', mode }));
    const factory = await context.newPage();
    const element = await context.newPage();
    factory.setDefaultTimeout(20000);
    element.setDefaultTimeout(20000);
    for (const slug of slugs) {
      const scenarios = ['default', ...components[slug].scenarios.map(item => item.id)];
      for (const scenario of scenarios) {
        const left = await open(factory, slug, scenario, false);
        const right = await open(element, slug, scenario, true);
        if (left.errors.length || right.errors.length) fail(`${slug} ${scenario} ${mode} console ${JSON.stringify([...left.errors, ...right.errors])}`);
        if (left.select !== scenario || right.select !== scenario) fail(`${slug} ${scenario} ${mode} scenario select factory=${left.select} element=${right.select}`);
        const lb = left.box ? `${Math.round(left.box.width)}×${Math.round(left.box.height)}` : 'none';
        const rb = right.box ? `${Math.round(right.box.width)}×${Math.round(right.box.height)}` : 'none';
        const sameBox = left.box && right.box && Math.abs(left.box.width - right.box.width) < 1 && Math.abs(left.box.height - right.box.height) < 1;
        if (!sameBox) fail(`${slug} ${scenario} ${mode} box factory ${lb} element ${rb}`);
        const a = join(dir, `${slug}-${scenario}-${mode}-factory.png`);
        const b = join(dir, `${slug}-${scenario}-${mode}-element.png`);
        await left.root.screenshot({ path: a, animations: 'disabled' });
        await right.root.screenshot({ path: b, animations: 'disabled' });
        const count = await differ(a, b);
        const replaced = await right.frame.evaluate(() => (window as unknown as { __stageReplaced?: number }).__stageReplaced ?? -1);
        const note = Number(count) === 0 ? 'ok' : `${count} pixels`;
        lines.push(`${slug} ${scenario} ${mode} box ${lb} diff ${note} replaced ${replaced}`);
        console.log(lines.at(-1));
        const listen = elementStage[slug as ElementStageSlug].listen as readonly string[];
        if (mode === 'light' && (listen.includes('click') || listen.includes('checked'))) {
          if (scenario === 'default' && (slug === 'button' || slug === 'switch')) {
            const key = slug === 'switch' ? 'Space' : 'Enter';
            await left.root.press(key);
            await right.root.press(key);
            await factory.waitForTimeout(150);
            const factoryKey = await factory.locator('#playground-status').innerText();
            const elementKey = await element.locator('#playground-status').innerText();
            if (factoryKey !== elementKey) fail(`${slug} ${key} factory "${factoryKey}" element "${elementKey}"`);
            else lines.push(`${slug} ${key} ${factoryKey}`);
          }
          await left.root.click();
          await right.root.click();
          await factory.waitForTimeout(150);
          const factoryStatus = await factory.locator('#playground-status').innerText();
          const elementStatus = await element.locator('#playground-status').innerText();
          const factorySelect = await factory.locator('#scenario').count() ? await factory.locator('#scenario').inputValue() : '';
          const elementSelect = await element.locator('#scenario').count() ? await element.locator('#scenario').inputValue() : '';
          if (slug === 'button' && scenario === 'favorite') {
            // The element has no toggle attribute, so this click cannot select it.
            lines.push(`${slug} favorite click factory "${factoryStatus}" / ${factorySelect} element "${elementStatus}" / ${elementSelect}`);
          } else if (factoryStatus !== elementStatus || factorySelect !== elementSelect) {
            fail(`${slug} ${scenario} click factory "${factoryStatus}" / ${factorySelect} element "${elementStatus}" / ${elementSelect}`);
          } else lines.push(`${slug} ${scenario} click ${factoryStatus} scenario ${factorySelect}`);
        }
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
  server.stop(true);
  await rm(dir, { recursive: true, force: true });
}

console.log(lines.join('\n'));
if (failed) {
  console.error(`${failed} stage element checks failed`);
  process.exit(1);
}
console.log('Stage elements check passed.');
