// Every component with scenarios: for each scenario (including default), every framework tab
// (vanilla, html/web-components, react, vue, svelte, solid) is generated, bundled, mounted in
// a headless page, and checked against the preview frame's mtrl-* root classes.
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
    return norm === stripped || stripped.includes(norm) || norm.includes(stripped);
  });
}

// Known differences allowlist:
// Any difference on main is recorded here with its reason to keep the suite green and visible.
interface KnownDifference {
  component: string;
  scenario: string;
  tab: string;
  reason: string;
  allowedMissing?: string[];
  allowedExtra?: string[];
}

const KNOWN_DIFFERENCES: KnownDifference[] = [];

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
page.setDefaultTimeout(10000);

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
      await page.goto(`${siteServer.url}components/${slug}/${scenarioParam}`);
      await page.getByRole('status').filter({ hasText: 'Ready to try' }).waitFor();
      await page.frameLocator('#preview').locator('#stage > *').first().waitFor();

      const previewFrame = page.frames().find(f => f !== page.mainFrame() && f.url().includes('preview')) ?? page.frames()[1]!;

      // Click "more" button if present in preview
      const previewMore = previewFrame.locator('button[aria-haspopup]');
      const hasMoreButton = (await previewMore.count()) > 0;
      if (hasMoreButton) {
        await previewMore.first().click().catch(() => {});
        await previewFrame.waitForFunction(
          () => [...document.querySelectorAll('[class*="mtrl-menu"]')].some(el => (el as HTMLElement).getClientRects().length > 0),
          undefined,
          { timeout: 2000 }
        ).catch(() => {});
      }

      // Collect root classes from preview frame
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

      // 2. Mount each tab and compare
      for (const tab of TABS) {
        const key = `${slug}/${scenarioId}/${tab}`;
        const tabInfo = tabBundles[key];
        totalMounts++;

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

        // If preview had a more button, click the more button in mounted tab too
        if (hasMoreButton) {
          const tabMore = page.locator('button[aria-haspopup], [aria-label="More options"]');
          if ((await tabMore.count()) > 0) {
            await tabMore.first().click().catch(() => {});
            await page.waitForFunction(
              () => [...document.querySelectorAll('m-menu, [class*="mtrl-menu"]')].some(
                m => m.hasAttribute('open') || (m as unknown as { open?: boolean }).open === true || (m as HTMLElement).getClientRects().length > 0
              ),
              undefined,
              { timeout: 2000 }
            ).catch(() => {});
          }
        }

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

        let missing = previewRoots.filter(c => !tabRoots.includes(c));
        let extra = tabRoots.filter(c => !previewRoots.includes(c));

        // Filter out missing classes allowed by stated gaps
        if (missing.length > 0 && tabInfo.statedGaps.length > 0) {
          missing = missing.filter(c => !matchesStatedGap(c, tabInfo.statedGaps));
        }

        // Check against known differences allowlist
        const known = KNOWN_DIFFERENCES.find(k => k.component === slug && k.scenario === scenarioId && k.tab === tab);
        if (known) {
          if (known.allowedMissing) missing = missing.filter(c => !known.allowedMissing!.includes(c));
          if (known.allowedExtra) extra = extra.filter(c => !known.allowedExtra!.includes(c));
          console.log(`Known difference noted: ${slug}/${scenarioId} [${tab}]: ${known.reason}`);
        }

        if (missing.length > 0 || extra.length > 0) {
          const parts: string[] = [];
          if (missing.length > 0) parts.push(`lacks [${missing.join(', ')}]`);
          if (extra.length > 0) parts.push(`extra [${extra.join(', ')}]`);
          differences.push(`${slug} ${scenarioId} ${tab}: ${parts.join(', ')} (preview roots: [${previewRoots.join(', ')}], tab roots: [${tabRoots.join(', ')}])`);
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

console.log(`Tab checks passed: ${totalMounts} mounts over ${totalScenarios} scenarios.`);
