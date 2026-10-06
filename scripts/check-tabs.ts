// Every component with scenarios: for each scenario (including default), every framework tab
// (vanilla, html/web-components, react, vue, svelte, solid) is generated, bundled, mounted in
// a headless page, and checked against the preview frame's mtrl-* root classes and visible text.
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { BunPlugin } from 'bun';
import { transformAsync } from '@babel/core';
import { compile } from 'svelte/compiler';
import { parse, compileScript, compileTemplate } from 'vue/compiler-sfc';
import { chromium } from 'playwright';
import { handleRequest } from '../server';
import { componentSlugs, components, componentCode, initialComponentState, normalizeComponentState, elementConfig } from '../src/shared/components';
import { frameworkCode } from '../src/shared/frameworks';
import { elementMeta } from '../src/server/elements-meta';
import { currentCheckboxChildren } from '../src/shared/content/checkbox';

const root = resolve(import.meta.dir, '..');
const scratch = resolve(root, 'node_modules/.scratch-check-tabs');
await mkdir(scratch, { recursive: true });

// --- Plugins for Bun.build ---
const svelte: BunPlugin = {
  name: 'svelte',
  setup(build) {
    build.onLoad({ filter: /\.svelte$/ }, async ({ path }) => ({
      contents: compile(await Bun.file(path).text(), { filename: path, generate: 'client' }).js.code,
      loader: 'js',
    }));
  },
};

const solid: BunPlugin = {
  name: 'solid',
  setup(build) {
    build.onLoad({ filter: /[\\/]solid\.tsx$/ }, async ({ path }) => {
      const result = await transformAsync(await Bun.file(path).text(), {
        filename: path,
        presets: [['babel-preset-solid', { generate: 'dom' }], '@babel/preset-typescript'],
      });
      return { contents: result?.code ?? '', loader: 'js' };
    });
  },
};

const vueSfc: BunPlugin = {
  name: 'vue-sfc',
  setup(build) {
    build.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
      const { descriptor } = parse(await Bun.file(path).text());
      const id = 'tab';
      const script = compileScript(descriptor, { id, genDefaultAs: '__sfc__' });
      const template = compileTemplate({ id, filename: path, source: descriptor.template!.content, compilerOptions: { bindingMetadata: script.bindings } });
      return { contents: `${script.content}\n${template.code}\n__sfc__.render = render;\nexport default __sfc__;\n`, loader: 'js' };
    });
  },
};

const rawSvg: BunPlugin = {
  name: 'svg-raw',
  setup(build) {
    build.onResolve({ filter: /\.svg\?raw$/ }, ({ path }) => ({
      path: resolve(root, 'icons', path.replace(/\?.*$/, '').replace(/^.*icons\//, '')),
    }));
    build.onLoad({ filter: /\.svg$/ }, async ({ path }) => ({ contents: await Bun.file(path).text(), loader: 'text' }));
  },
};

const FRAMEWORK_IMPORT = /^(react|react-dom|vue|svelte|solid-js)(\/.*)?$/;
const BROWSER_CONDITIONS = ['browser', 'import', 'module', 'default'];
const pickCondition = (target: unknown): string | undefined => {
  if (typeof target === 'string') return target;
  if (!target || typeof target !== 'object') return undefined;
  for (const condition of BROWSER_CONDITIONS) {
    const found = pickCondition((target as Record<string, unknown>)[condition]);
    if (found) return found;
  }
  return undefined;
};

const oneCopy: BunPlugin = {
  name: 'one-copy',
  setup(build) {
    build.onResolve({ filter: FRAMEWORK_IMPORT }, ({ path }) => ({
      path: path === 'vue' ? resolve(root, 'node_modules/vue/dist/vue.esm-bundler.js') : (() => {
        const [, name, subpath = ''] = FRAMEWORK_IMPORT.exec(path)!;
        const dir = resolve(root, 'node_modules', name!);
        const pkg = JSON.parse(readFileSync(resolve(dir, 'package.json'), 'utf8')) as { exports?: Record<string, unknown> };
        const target = pkg.exports ? pickCondition(pkg.exports[`.${subpath}`]) : undefined;
        return target ? resolve(dir, target) : Bun.resolveSync(path, root);
      })(),
    }));
  },
};

type Tab = 'vanilla' | 'html' | 'react' | 'vue' | 'svelte' | 'solid';
const TABS: Tab[] = ['vanilla', 'html', 'react', 'vue', 'svelte', 'solid'];

const entryFor = (tab: Tab): string => ({
  vanilla: `import './tab.ts';`,
  html: `import './tab.ts';`,
  react: `import { createElement } from 'react';\nimport { createRoot } from 'react-dom/client';\nimport { Example } from './react.tsx';\ncreateRoot(document.getElementById('app')!).render(createElement(Example));`,
  vue: `import { createApp } from 'vue';\nimport App from './tab.vue';\ncreateApp(App).mount('#app');`,
  svelte: `import { mount } from 'svelte';\nimport App from './tab.svelte';\nmount(App, { target: document.getElementById('app')! });`,
  solid: `import { createComponent } from 'solid-js';\nimport { render } from 'solid-js/web';\nimport { Example } from './solid.tsx';\nrender(() => createComponent(Example, {}), document.getElementById('app')!);`,
}[tab]);

const fileName = (tab: Tab): string => ({
  vanilla: 'tab.ts',
  html: 'tab.ts',
  react: 'react.tsx',
  vue: 'tab.vue',
  svelte: 'tab.svelte',
  solid: 'solid.tsx',
})[tab];

const ROOT_NAMES = new Set([
  'badge',
  'bottom-app-bar',
  'bottom-sheet',
  'button',
  'button-group',
  'card',
  'carousel',
  'checkbox',
  'chip',
  'chips',
  'datepicker',
  'dialog',
  'divider',
  'drawer',
  'extended-fab',
  'fab',
  'fab-menu',
  'icon-button',
  'list',
  'loading-indicator',
  'menu',
  'navigation-bar',
  'navigation-rail',
  'progress',
  'radio',
  'radios',
  'search',
  'select',
  'side-sheet',
  'slider',
  'snackbar',
  'split-button',
  'switch',
  'tab',
  'tabs',
  'text-field',
  'timepicker',
  'toolbar',
  'tooltip',
  'top-app-bar',
]);

function isRootClass(className: string): boolean {
  if (!className.startsWith('mtrl-')) return false;
  if (className.includes('--') || className.includes('__')) return false;
  const name = className.slice(5);
  return ROOT_NAMES.has(name);
}

function getStatedGaps(code: string): string[] {
  const match = /Not yet exposed by the element:\s*([^.\n]+)/.exec(code);
  if (!match) return [];
  return match[1].split(',').map(s => s.trim().toLowerCase());
}

function matchesStatedGap(missingClass: string, statedGaps: string[]): boolean {
  const stripped = missingClass.replace(/^mtrl-/, '').replace(/-/g, '').toLowerCase();
  return statedGaps.some(gap => {
    const norm = gap.replace(/-/g, '').toLowerCase();
    return norm === stripped;
  });
}

// Text carried by element options which framework tabs can explicitly say they do not expose.
// `undefined` means that the option affects no visible text, and therefore excuses nothing.
const STATED_GAP_TEXT: Record<string, (slug: string, state: Parameters<typeof currentCheckboxChildren>[0]) => string[] | undefined> = {
  // A checkbox family renders one child label for every child option.
  children: (slug, state) => slug === 'checkbox'
    ? currentCheckboxChildren(state).map(child => child.label)
    : undefined,
};

function textAllowedByStatedGaps(slug: string, state: Parameters<typeof currentCheckboxChildren>[0], statedGaps: string[]): string[] {
  return statedGaps.flatMap(gap => STATED_GAP_TEXT[gap]?.(slug, state) ?? []);
}

function multisetDifference(left: string[], right: string[]): string[] {
  const remaining = new Map<string, number>();
  for (const item of right) remaining.set(item, (remaining.get(item) ?? 0) + 1);
  return left.filter(item => {
    const count = remaining.get(item) ?? 0;
    if (count === 0) return true;
    remaining.set(item, count - 1);
    return false;
  });
}

const collectVisibleText = () => {
  const normalise = (value: string) => value.replace(/\s+/g, ' ').trim();
  const isVisible = (start: Element) => {
    let element: Element | null = start;
    while (element) {
      const style = getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return false;
      // A contents element has no box of its own, but it does not hide its children.
      if (style.display !== 'contents' && element.getClientRects().length === 0) return false;
      const root = element.getRootNode();
      element = element.parentElement ?? (root instanceof ShadowRoot ? root.host : null);
    }
    return true;
  };
  const textHasRect = (node: Text) => {
    const range = document.createRange();
    range.selectNode(node);
    return range.getClientRects().length > 0;
  };
  const text: string[] = [];
  const visit = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const textNode = node as Text;
      const parent = textNode.parentElement;
      // Split buttons render their light-DOM primary label through a shadow-tree label.
      if (!parent || (parent.localName === 'm-split-button' && parent.shadowRoot) || parent.closest('script, style') || !isVisible(parent) || !textHasRect(textNode)) return;
      const value = normalise(node.textContent ?? '');
      if (value) text.push(value);
      return;
    }
    if (!(node instanceof Element) || node.matches('script, style')) return;
    if ((node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) && isVisible(node)) {
      if (node instanceof HTMLInputElement) {
        const ariaLabel = normalise(node.getAttribute('aria-label') ?? '');
        if (ariaLabel) text.push(ariaLabel);
      }
      // Checkbox/radio values identify form submissions; they are not user-visible values.
      if (!(node instanceof HTMLInputElement) || !['checkbox', 'radio', 'hidden', 'button', 'submit', 'reset', 'file', 'image'].includes(node.type)) {
        const value = normalise(node.value);
        if (value) text.push(value);
      }
      // Textarea fallback content is its default value, not a second visible label.
      return;
    }
    node.childNodes.forEach(visit);
    node.shadowRoot?.childNodes.forEach(visit);
  };
  visit(document.body);
  return text;
};

const hasVisibleMenu = () => {
  const isVisible = (element: Element) => {
    let current: Element | null = element;
    while (current) {
      const style = getComputedStyle(current);
      if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return false;
      if (style.display !== 'contents' && current.getClientRects().length === 0) return false;
      const root = current.getRootNode();
      current = current.parentElement ?? (root instanceof ShadowRoot ? root.host : null);
    }
    return true;
  };
  const visit = (node: Element): boolean => {
    // Only the surface paints a menu.  Its height and animations distinguish a
    // finished opening transition from a contents host or a scaleY(0) surface.
    if (node.classList.contains('mtrl-menu') && isVisible(node)) {
      const rect = node.getBoundingClientRect();
      if (rect.height > 0 && node.getAnimations().every(animation => animation.playState !== 'running')) return true;
    }
    if (node.shadowRoot && [...node.shadowRoot.children].some(visit)) return true;
    return [...node.children].some(visit);
  };
  return visit(document.body);
};

const hasMenuSurfaceThatCouldOpen = () => {
  const visit = (node: Element): boolean => {
    if (node.classList.contains('mtrl-menu')) {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      if (style.display !== 'none' && style.visibility !== 'hidden' && style.visibility !== 'collapse'
        && (rect.height > 0 || node.getAnimations().some(animation => animation.playState === 'running'))) return true;
    }
    if (node.shadowRoot && [...node.shadowRoot.children].some(visit)) return true;
    return [...node.children].some(visit);
  };
  return visit(document.body);
};

// Give a newly mounted page the same chance to finish its initial render on
// either side, then treat a menu as open only once its painted surface shows.
const settledMenuState = async (target: import('playwright').Page | import('playwright').Frame): Promise<boolean> => {
  await target.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  if (!await target.evaluate(hasMenuSurfaceThatCouldOpen)) return false;
  return target.waitForFunction(hasVisibleMenu, undefined, { timeout: 2000 })
    .then(() => true)
    .catch(() => false);
};

// --- Generate and bundle every tab ---
const targetSlugs = componentSlugs.filter(slug => components[slug].scenarios && components[slug].scenarios.length > 0);

interface TabInfo {
  slug: string;
  scenarioId: string;
  tab: Tab;
  rawCode: string;
  markup: string;
  js: string;
  css?: string;
  statedGaps: string[];
  allowedMissingText: string[];
}

const tabBundles: Record<string, TabInfo> = {};

for (const slug of targetSlugs) {
  const meta = elementMeta(slug);
  if (!meta) continue;
  const scenarios = [null, ...components[slug].scenarios];
  for (const scenario of scenarios) {
    const scenarioId = scenario?.id ?? 'default';
    const state = normalizeComponentState(slug, { ...initialComponentState(slug), ...(scenario?.options ?? {}) });
    const config = elementConfig(slug, state);
    const context = { theme: String(state.theme), mode: String(state.mode) };

    for (const tab of TABS) {
      const code = tab === 'vanilla' ? componentCode(slug, state) : frameworkCode(tab, meta, config, context);
      let scriptCode = code;
      let markup = '';
      if (tab === 'html') {
        const scriptMatch = /<script type="module">\n([\s\S]*?)<\/script>/.exec(code);
        scriptCode = scriptMatch ? scriptMatch[1] : '';
        markup = code.replace(/<script type="module">[\s\S]*?<\/script>\n?/, '').trim();
      }

      const key = `${slug}/${scenarioId}/${tab}`;
      const dir = resolve(scratch, `${slug}-${scenarioId}-${tab}`);
      await mkdir(dir, { recursive: true });
      await writeFile(resolve(dir, fileName(tab)), scriptCode);
      await writeFile(resolve(dir, 'entry.ts'), entryFor(tab));

      const buildResult = await Bun.build({
        entrypoints: [resolve(dir, 'entry.ts')],
        target: 'browser',
        plugins: [oneCopy, rawSvg, svelte, solid, vueSfc],
        define: {
          'process.env.NODE_ENV': '"production"',
          __VUE_OPTIONS_API__: 'true',
          __VUE_PROD_DEVTOOLS__: 'false',
          __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
        },
      });

      if (!buildResult.success) {
        console.error(`Build failed for ${key}:`, ...buildResult.logs);
        process.exit(1);
      }

      const jsOutput = buildResult.outputs.find(o => o.kind === 'entry-point')!;
      const cssOutput = buildResult.outputs.find(o => o.path.endsWith('.css'));
      const js = await jsOutput.text();
      const css = cssOutput ? await cssOutput.text() : undefined;

      tabBundles[key] = {
        slug,
        scenarioId,
        tab,
        rawCode: code,
        markup,
        js,
        css,
        statedGaps: getStatedGaps(code),
        allowedMissingText: textAllowedByStatedGaps(slug, state, getStatedGaps(code)),
      };
    }
  }
}

// --- Serve bundled tabs ---
let currentTabKey = '';
const harnessHtml = (key: string): string => {
  const info = tabBundles[key];
  if (!info) return '<!doctype html><html><body>Not found</body></html>';
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  ${info.css ? '<link rel="stylesheet" href="/tab.css">' : ''}
</head>
<body style="margin:0">
  ${info.markup ? `${info.markup}\n` : ''}
  <div id="app" style="padding:16px"></div>
  <script type="module" src="/tab.js"></script>
</body>
</html>`;
};

const tabServer = Bun.serve({
  port: 0,
  hostname: '127.0.0.1',
  fetch(req) {
    const url = new URL(req.url);
    currentTabKey = url.searchParams.get('tab') ?? currentTabKey;
    const path = url.pathname.replace(/\/+$/, '') || '/';
    if (path === '/') {
      return new Response(harnessHtml(currentTabKey), { headers: { 'content-type': 'text/html' } });
    }
    if (path === '/tab.js' && tabBundles[currentTabKey]) {
      return new Response(tabBundles[currentTabKey].js, { headers: { 'content-type': 'text/javascript' } });
    }
    if (path === '/tab.css' && tabBundles[currentTabKey]?.css) {
      return new Response(tabBundles[currentTabKey].css!, { headers: { 'content-type': 'text/css' } });
    }
    return new Response('Not found', { status: 404 });
  },
});

const siteServer = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: handleRequest });

// --- Browser check ---
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const previewPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.setDefaultTimeout(10000);
previewPage.setDefaultTimeout(10000);

const pageErrors: string[] = [];
page.on('pageerror', err => pageErrors.push(err.message));
page.on('console', msg => {
  if (msg.type() === 'error') pageErrors.push(msg.text());
});

const differences: string[] = [];
let totalMounts = 0;
let totalScenarios = 0;

try {
  for (const slug of targetSlugs) {
    const scenarios = [null, ...components[slug].scenarios];
    for (const scenario of scenarios) {
      const scenarioId = scenario?.id ?? 'default';
      totalScenarios++;

      // 1. Load the preview frame for this scenario
      const scenarioParam = scenario ? `?scenario=${scenario.id}` : '';
      await previewPage.goto(`${siteServer.url}components/${slug}/${scenarioParam}`);
      await previewPage.frameLocator('#preview').locator('#stage > *').first().waitFor();

      const previewFrame = previewPage.frames().find(f => f !== previewPage.mainFrame() && f.url().includes('preview')) ?? previewPage.frames()[1]!;
      // This is deliberately read once: opening a menu for one tab must not
      // turn into evidence that it was open on load for later tabs.
      const previewMenuOnLoad = await settledMenuState(previewFrame);

      // 2. Mount each tab and compare
      for (const tab of TABS) {
        const key = `${slug}/${scenarioId}/${tab}`;
        const tabInfo = tabBundles[key];
        totalMounts++;
        pageErrors.length = 0;

        try {
          await page.goto(`${tabServer.url}/?tab=${encodeURIComponent(key)}`);
          // Wait for element upgrade / mount
          await page.waitForFunction(() => {
            const visit = (node: Element): boolean => {
              for (const cls of node.classList) if (cls.startsWith('mtrl-')) return true;
              if (node.shadowRoot) {
                for (const child of node.shadowRoot.children) if (visit(child)) return true;
              }
              for (const child of node.children) if (visit(child)) return true;
              return false;
            };
            return visit(document.body);
          }, undefined, { timeout: 8000 });
        } catch (err) {
          const detail = pageErrors.length > 0
            ? pageErrors.join('; ')
            : 'mount timed out — no mtrl-* class painted';
          differences.push(`${slug} ${scenarioId} ${tab}: ${detail}`);
          continue;
        }

        if (pageErrors.length > 0) {
          differences.push(`${slug} ${scenarioId} ${tab}: ${pageErrors.join('; ')}`);
          continue;
        }

        const tabMenuOnLoad = await settledMenuState(page);
        if (previewMenuOnLoad !== tabMenuOnLoad) {
          differences.push(`${slug} ${scenarioId} ${tab}: menu surface on load differs (preview ${previewMenuOnLoad ? 'open' : 'closed'}, tab ${tabMenuOnLoad ? 'open' : 'closed'})`);
          continue;
        }

        if (!previewMenuOnLoad) {
          const previewMore = previewFrame.locator('button[aria-haspopup]');
          if ((await previewMore.count()) > 0) {
            const tabMore = page.locator('button[aria-haspopup], [aria-label="More options"]');
            await Promise.all([
              previewMore.first().click().catch(() => {}),
              tabMore.first().click().catch(() => {}),
            ]);
            const [previewMenuOpened, tabMenuOpened] = await Promise.all([
              settledMenuState(previewFrame),
              settledMenuState(page),
            ]);
            if (!previewMenuOpened || !tabMenuOpened) {
              differences.push(`${slug} ${scenarioId} ${tab}: menu surface after opening differs (preview ${previewMenuOpened ? 'shown' : 'not shown'}, tab ${tabMenuOpened ? 'shown' : 'not shown'})`);
              continue;
            }
          }
        }

        // Collect preview contents after its menu state has been settled.
        const previewClasses = await previewFrame.evaluate(() => {
          const found = new Set<string>();
          const visit = (node: Element) => {
            for (const cls of node.classList) if (cls.startsWith('mtrl-')) found.add(cls);
            if (node.shadowRoot) [...node.shadowRoot.children].forEach(visit);
            [...node.children].forEach(visit);
          };
          visit(document.body);
          return [...found];
        });
        const previewRoots = previewClasses.filter(isRootClass);
        const previewText = await previewFrame.evaluate(collectVisibleText);

        // Collect root classes from mounted tab
        const tabClasses = await page.evaluate(() => {
          const found = new Set<string>();
          const visit = (node: Element) => {
            for (const cls of node.classList) if (cls.startsWith('mtrl-')) found.add(cls);
            if (node.shadowRoot) [...node.shadowRoot.children].forEach(visit);
            [...node.children].forEach(visit);
          };
          visit(document.body);
          return [...found];
        });
        const tabRoots = tabClasses.filter(isRootClass);
        const tabText = await page.evaluate(collectVisibleText);

        let missing = previewRoots.filter(c => !tabRoots.includes(c));
        let extra = tabRoots.filter(c => !previewRoots.includes(c));

        // Filter out missing classes allowed by stated gaps
        if (missing.length > 0 && tabInfo.statedGaps.length > 0) {
          missing = missing.filter(c => !matchesStatedGap(c, tabInfo.statedGaps));
        }

        if (missing.length > 0 || extra.length > 0) {
          const parts: string[] = [];
          if (missing.length > 0) parts.push(`lacks [${missing.join(', ')}]`);
          if (extra.length > 0) parts.push(`extra [${extra.join(', ')}]`);
          differences.push(`${slug} ${scenarioId} ${tab}: ${parts.join(', ')} (preview roots: [${previewRoots.join(', ')}], tab roots: [${tabRoots.join(', ')}])`);
        }

        let missingText = multisetDifference(previewText, tabText);
        let extraText = multisetDifference(tabText, previewText);
        const statedText = tabInfo.allowedMissingText;
        if (statedText.length > 0) missingText = multisetDifference(missingText, statedText);
        if (missingText.length > 0 || extraText.length > 0) {
          differences.push(`${slug} ${scenarioId} ${tab}: text preview-only ${JSON.stringify(missingText)}, tab-only ${JSON.stringify(extraText)}`);
        }
      }
    }
  }
} finally {
  await browser.close();
  tabServer.stop(true);
  siteServer.stop(true);
  await rm(scratch, { recursive: true, force: true });
}

if (differences.length > 0) {
  for (const diff of differences) {
    console.error(diff);
  }
  process.exit(1);
}

console.log(`Tab checks passed: ${totalMounts} mounts over ${totalScenarios} scenarios, roots and text.`);
