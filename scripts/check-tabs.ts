// Every component with scenarios: for each scenario (including default), every framework tab
// (vanilla, html/web-components, react, vue, svelte, solid) is generated, bundled, mounted in
// a headless page, and checked against the preview frame's mtrl-* root classes and visible text.
// CHECK_TABS unset runs every such component. A comma list runs those slugs.
// CHECK_TABS_RECYCLE is how many components share the tab page and the preview page:
// a whole number from 1, otherwise 6.
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
import { checkTabsRecycle, checkTabsSlugs } from './check-tabs-options';

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
  const match = /Not yet exposed by the element:\s*([^\n]+)/.exec(code);
  if (!match) return [];
  // Paths contain dots (`media.aspectRatio`). The sentence ends at the last period.
  const body = match[1].replace(/\s*-->.*/, '').replace(/\.\s*$/, '').trim();
  return body.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
}

function matchesStatedGap(missingClass: string, statedGaps: string[]): boolean {
  const stripped = missingClass.replace(/^mtrl-/, '').replace(/-/g, '').toLowerCase();
  return statedGaps.some(gap => {
    const names = new Set<string>([gap.replace(/-/g, '').toLowerCase()]);
    // A dotted path used to be read only up to its first dot, which is what let
    // `media.aspectRatio` excuse `mtrl-media`. Each segment keeps that.
    for (const part of gap.split('.')) names.add(part.replace(/\[\]/g, '').replace(/-/g, '').toLowerCase());
    return names.has(stripped);
  });
}

/** String leaves of a config value: the words a preview can show for that value. */
function stringsIn(value: unknown): string[] {
  if (typeof value === 'string') return value.trim() ? [value.trim()] : [];
  if (typeof value === 'number') return [String(value)];
  if (Array.isArray(value)) return value.flatMap(stringsIn);
  if (value && typeof value === 'object') return Object.values(value).flatMap(stringsIn);
  return [];
}

/** Config strings at a stated path (`children`, `media.aspectRatio`, `suggestions[].supportingText`). */
function stringsAtPath(config: unknown, path: string): string[] {
  const segments = path.split('.').map(part => part.trim()).filter(Boolean);
  const step = (value: unknown, index: number): string[] => {
    if (index >= segments.length) return stringsIn(value);
    const segment = segments[index]!;
    const array = segment.endsWith('[]');
    const key = (array ? segment.slice(0, -2) : segment).toLowerCase();
    if (Array.isArray(value)) return value.flatMap(item => step(item, index));
    if (!value || typeof value !== 'object') return [];
    return Object.entries(value).flatMap(([name, child]) => {
      if (name.toLowerCase() !== key) return [];
      if (!array) return step(child, index + 1);
      const items = Array.isArray(child) ? child : [child];
      return items.flatMap(item => step(item, index + 1));
    });
  };
  return step(config, 0);
}

// A tab's `Not yet exposed by the element: <path>.` excuses only the preview text
// that comes from the config values at that path.
function textAllowedByStatedGaps(config: unknown, statedGaps: string[]): string[] {
  return statedGaps.flatMap(gap => stringsAtPath(config, gap));
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

// One unit is one element's own words: its direct text nodes and the words inside
// inline emphasis (`strong`, `em`, `b`, `i`, `mark`, …) joined into a single string.
// A child that is not emphasis — another suggestion, a supporting line, a second
// control — stays its own unit. The two units are compared as a multiset: two words
// in two elements stay two entries, so one missing is still a difference. Document
// order is not compared; the side sheet's opener and title already disagree on it.
const collectVisibleText = (selectors: string[]) => {
  const normalise = (value: string) => value.replace(/\s+/g, ' ').trim();
  const emphasis = new Set(['strong', 'em', 'b', 'i', 'mark', 'small', 'abbr', 'sub', 'sup', 'u', 's', 'code']);
  const isPreviewOnly = (element: Element) => selectors.some(selector => element.matches(selector));
  const opacityResting = (element: Element) => !element.getAnimations().some(animation => {
    if (animation.playState !== 'running') return false;
    const effect = animation.effect;
    if (!(effect instanceof KeyframeEffect)) return false;
    return effect.getKeyframes().some(frame => Object.prototype.hasOwnProperty.call(frame, 'opacity'));
  });
  const isVisible = (start: Element) => {
    let element: Element | null = start;
    while (element) {
      const style = getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return false;
      // Opacity 0 is hidden, on this element or an ancestor. A transition that
      // is still running is not that rest state: the check waits it out first.
      if (Number(style.opacity) === 0 && opacityResting(element)) return false;
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
  const ownWords = (element: Element): Text[] => {
    const nodes: Text[] = [];
    const take = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) { nodes.push(node as Text); return; }
      if (node instanceof Element && emphasis.has(node.localName)) node.childNodes.forEach(take);
    };
    element.childNodes.forEach(take);
    return nodes;
  };
  const text: string[] = [];
  const visit = (node: Node) => {
    if (!(node instanceof Element) || node.matches('script, style') || isPreviewOnly(node)) return;
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
    // Split buttons render their light-DOM primary label through a shadow-tree label.
    const skipOwn = node.localName === 'm-split-button' && !!node.shadowRoot;
    if (!skipOwn && isVisible(node)) {
      const nodes = ownWords(node);
      const value = normalise(nodes.map(part => part.textContent ?? '').join(''));
      if (value && nodes.some(textHasRect)) text.push(value);
    }
    for (const child of node.children) if (!emphasis.has(child.localName)) visit(child);
    node.shadowRoot && [...node.shadowRoot.children].forEach(visit);
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

const hasOpenDialog = () => {
  const visit = (node: Element): boolean => {
    if (node instanceof HTMLDialogElement && node.open) return true;
    if (node.shadowRoot && [...node.shadowRoot.children].some(visit)) return true;
    return [...node.children].some(visit);
  };
  return visit(document.body);
};

const hasMenuSurfaceThatCouldOpen = () => {
  const visit = (node: Element): boolean => {
    if (node.classList.contains('mtrl-menu')) {
      // An opening surface starts hidden at scaleY(0): only display tells a
      // surface that is on its way from one that is not rendered at all.
      if (getComputedStyle(node).display !== 'none') return true;
    }
    if (node.shadowRoot && [...node.shadowRoot.children].some(visit)) return true;
    return [...node.children].some(visit);
  };
  return visit(document.body);
};

// True when some opener already shows the popup it controls. A menu that is
// still settling is not yet shown; the caller waits for that surface. The
// read stays inside this function: the page evaluates the function alone.
const hasShownControlledPopup = () => {
  const read = (opener: Element): boolean | null => {
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
    const menuSettled = (element: Element) => {
      if (!element.classList.contains('mtrl-menu') || !isVisible(element)) return false;
      const rect = element.getBoundingClientRect();
      return rect.height > 0 && element.getAnimations().every(animation => animation.playState !== 'running');
    };
    const id = opener.getAttribute('aria-controls');
    const root = opener.getRootNode();
    const named = id
      ? ((root instanceof Document || root instanceof ShadowRoot) ? root.getElementById(id) : null) ?? opener.ownerDocument.getElementById(id)
      : null;
    if (named?.classList.contains('mtrl-menu')) return menuSettled(named);
    if (named) return isVisible(named);
    const visit = (node: Element): boolean => {
      if (menuSettled(node)) return true;
      if (node.shadowRoot) for (const child of node.shadowRoot.children) if (visit(child)) return true;
      for (const child of node.children) if (visit(child)) return true;
      return false;
    };
    return visit(opener.ownerDocument.body) ? true : null;
  };
  let open = false;
  const walk = (node: Element) => {
    if (node.getAttribute('aria-haspopup') && node.getAttribute('aria-haspopup') !== 'dialog' && read(node) === true) open = true;
    if (node.shadowRoot) [...node.shadowRoot.children].forEach(walk);
    [...node.children].forEach(walk);
  };
  walk(document.body);
  return open;
};

// The open state once the frame has painted. A named popup that is already
// shown counts, including one that is not a menu. A menu surface that can
// still open is given time to finish. Otherwise the page loaded closed.
const settledMenuState = async (target: import('playwright').Page | import('playwright').Frame): Promise<boolean> => {
  await target.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  if (await target.evaluate(hasShownControlledPopup)) return true;
  if (!await target.evaluate(hasMenuSurfaceThatCouldOpen)) return false;
  return target.waitForFunction(hasVisibleMenu, undefined, { timeout: 2000 })
    .then(() => true)
    .catch(() => false);
};

// An entrance that starts at opacity 0 has to finish before text and roots
// are read. A resting opacity of 0 has no running animation, so it stays hidden.
const opacityMotionSettled = () => {
  const fading = (animation: Animation) => {
    if (animation.playState !== 'running') return false;
    const effect = animation.effect;
    if (!(effect instanceof KeyframeEffect)) return false;
    return effect.getKeyframes().some(frame => Object.prototype.hasOwnProperty.call(frame, 'opacity'));
  };
  const visit = (node: Element): boolean => {
    if (node.getAnimations().some(fading)) return false;
    if (node.shadowRoot) for (const child of node.shadowRoot.children) if (!visit(child)) return false;
    for (const child of node.children) if (!visit(child)) return false;
    return true;
  };
  return visit(document.body);
};

const waitForOpacity = (target: import('playwright').Page | import('playwright').Frame) =>
  target.waitForFunction(opacityMotionSettled, undefined, { timeout: 2000 }).catch(() => {});

// After a click, the popup is the one that opener controls.
const popupShownAfterClick = (opener: import('playwright').Locator): Promise<boolean> =>
  opener.evaluate(button => new Promise<boolean>(resolve => {
    const read = (opener: Element): boolean | null => {
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
      const menuSettled = (element: Element) => {
        if (!element.classList.contains('mtrl-menu') || !isVisible(element)) return false;
        const rect = element.getBoundingClientRect();
        return rect.height > 0 && element.getAnimations().every(animation => animation.playState !== 'running');
      };
      const id = opener.getAttribute('aria-controls');
      const root = opener.getRootNode();
      const named = id
        ? ((root instanceof Document || root instanceof ShadowRoot) ? root.getElementById(id) : null) ?? opener.ownerDocument.getElementById(id)
        : null;
      if (named?.classList.contains('mtrl-menu')) return menuSettled(named);
      if (named) return isVisible(named);
      const visit = (node: Element): boolean => {
        if (menuSettled(node)) return true;
        if (node.shadowRoot) for (const child of node.shadowRoot.children) if (visit(child)) return true;
        for (const child of node.children) if (visit(child)) return true;
        return false;
      };
      return visit(opener.ownerDocument.body) ? true : null;
    };
    const start = performance.now();
    const tick = () => {
      if (read(button) === true) return resolve(true);
      if (performance.now() - start > 2000) return resolve(false);
      requestAnimationFrame(tick);
    };
    tick();
  })).catch(() => false);

// --- Generate and bundle every tab ---
const eligibleSlugs = componentSlugs.filter(slug => components[slug].scenarios && components[slug].scenarios.length > 0);
const selected = checkTabsSlugs(process.env.CHECK_TABS, eligibleSlugs);
if (!selected.ok) {
  console.error(selected.error);
  await rm(scratch, { recursive: true, force: true });
  process.exit(1);
}
const targetSlugs = selected.slugs;

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
const startedAt = performance.now();
const secondsSinceStart = () => ((performance.now() - startedAt) / 1000).toFixed(1);

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
        allowedMissingText: textAllowedByStatedGaps(config, getStatedGaps(code)),
      };
    }
  }
}

console.log(`builds: ${Object.keys(tabBundles).length} in ${secondsSinceStart()}s`);

// --- Serve bundled tabs ---
let currentTabKey = '';
// `width` is the preview stage measured for this run. The tab mounts in a box
// of that width, so a component is read at the same width on both sides.
const harnessHtml = (key: string, width: number): string => {
  const info = tabBundles[key];
  if (!info) return '<!doctype html><html><body>Not found</body></html>';
  const box = width > 0 ? `width:${width}px;max-width:${width}px;` : '';
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  ${info.css ? '<link rel="stylesheet" href="/tab.css">' : ''}
</head>
<body style="margin:0;${box}">
  ${info.markup ? `${info.markup}\n` : ''}
  <div id="app" style="${width > 0 ? 'width:100%' : 'padding:16px'}"></div>
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
      const width = Number(url.searchParams.get('width'));
      return new Response(harnessHtml(currentTabKey, Number.isFinite(width) ? width : 0), { headers: { 'content-type': 'text/html' } });
    }
    if (path === '/tab.js' && tabBundles[currentTabKey]) {
      return new Response(tabBundles[currentTabKey].js, { headers: { 'content-type': 'text/javascript' } });
    }
    if (path === '/tab.css' && tabBundles[currentTabKey]?.css) {
      return new Response(tabBundles[currentTabKey].css!, { headers: { 'content-type': 'text/css' } });
    }
    // The tab page is this origin, so a snippet's `/assets/...` image asks here.
    // The site server answers the files it has; a path that does not exist still 404s.
    return handleRequest(req);
  },
});

const siteServer = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: handleRequest });

// --- Browser check ---
const browser = await chromium.launch({ headless: true });
const pageErrors: string[] = [];
const recycleEvery = checkTabsRecycle(process.env.CHECK_TABS_RECYCLE);

const openPages = async () => {
  const tab = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const preview = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  tab.setDefaultTimeout(10000);
  preview.setDefaultTimeout(10000);
  tab.on('pageerror', err => pageErrors.push(err.message));
  tab.on('console', msg => {
    if (msg.type() === 'error') pageErrors.push(msg.text());
  });
  return { page: tab, previewPage: preview };
};

let { page, previewPage } = await openPages();

const differences: string[] = [];
let totalMounts = 0;
let totalScenarios = 0;
let componentIndex = 0;

try {
  for (const slug of targetSlugs) {
    componentIndex++;
    const scenarios = [null, ...components[slug].scenarios];
    let componentScenarios = 0;
    let componentMounts = 0;
    for (const scenario of scenarios) {
      const scenarioId = scenario?.id ?? 'default';
      totalScenarios++;
      componentScenarios++;

      // 1. Load the preview frame for this scenario
      const scenarioParam = scenario ? `?scenario=${scenario.id}` : '';
      await previewPage.goto(`${siteServer.url}components/${slug}/${scenarioParam}`);
      await previewPage.frameLocator('#preview').locator('#stage > *').first().waitFor();

      const previewFrame = previewPage.frames().find(f => f !== previewPage.mainFrame() && f.url().includes('preview')) ?? previewPage.frames()[1]!;
      // The stage's width on this run, not a width written into the check.
      // Every tab of this scenario mounts in a box that wide.
      const stageWidth = Math.round(await previewFrame.evaluate(() => document.querySelector('#stage')?.getBoundingClientRect().width ?? 0));
      if (!(stageWidth > 0)) {
        differences.push(`${slug} ${scenarioId}: the preview stage has no width`);
        continue;
      }
      await page.setViewportSize({ width: stageWidth, height: 900 });
      // This is deliberately read once: opening a menu for one tab must not
      // turn into evidence that it was open on load for later tabs.
      const previewMenuOnLoad = await settledMenuState(previewFrame);

      // 2. Mount each tab and compare
      for (const tab of TABS) {
        const key = `${slug}/${scenarioId}/${tab}`;
        const tabInfo = tabBundles[key];
        totalMounts++;
        componentMounts++;
        pageErrors.length = 0;

        try {
          await page.goto(`${tabServer.url}/?tab=${encodeURIComponent(key)}&width=${stageWidth}`);
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

        // A dialog popup is not a menu. Compare the dialog's own open state and
        // leave its words to the text comparison below. Only a trigger that says
        // its popup is a dialog: a side sheet's own dialog is not that trigger.
        const dialogPopup = '[aria-haspopup="dialog"]';
        if ((await previewFrame.locator(dialogPopup).count()) > 0 || (await page.locator(dialogPopup).count()) > 0) {
          const previewDialogOpen = await previewFrame.evaluate(hasOpenDialog);
          const tabDialogOpen = await page.evaluate(hasOpenDialog);
          if (previewDialogOpen !== tabDialogOpen) {
            differences.push(`${slug} ${scenarioId} ${tab}: dialog open state differs (preview ${previewDialogOpen ? 'open' : 'closed'}, tab ${tabDialogOpen ? 'open' : 'closed'})`);
          }
        }

        if (!previewMenuOnLoad) {
          const menuPopup = 'button[aria-haspopup="menu"], button[aria-haspopup="true"], button[aria-haspopup="listbox"]';
          const previewMore = previewFrame.locator(menuPopup);
          if ((await previewMore.count()) > 0) {
            // An element tab's trigger is a host (m-button), not a button: the
            // element that says it opens a popup is the one a user would press.
            const tabMore = page.locator('[aria-haspopup="menu"], [aria-haspopup="true"], [aria-haspopup="listbox"], [aria-label="More options"]');
            // The trigger is a toggle and the preview page is shared by the six
            // tabs. An opener that already says expanded is not clicked, and one
            // whose popup is already shown is not clicked again.
            const clickUnlessShown = async (opener: import('playwright').Locator) => {
              if ((await opener.count()) === 0) return;
              const first = opener.first();
              if ((await first.getAttribute('aria-expanded')) === 'true') return;
              const shown = await first.evaluate(button => {
                const id = button.getAttribute('aria-controls');
                const root = button.getRootNode();
                const named = id
                  ? ((root instanceof Document || root instanceof ShadowRoot) ? root.getElementById(id) : null) ?? button.ownerDocument.getElementById(id)
                  : null;
                if (!named) return false;
                let current: Element | null = named;
                while (current) {
                  const style = getComputedStyle(current);
                  if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return false;
                  if (style.display !== 'contents' && current.getClientRects().length === 0) return false;
                  const parent = current.getRootNode();
                  current = current.parentElement ?? (parent instanceof ShadowRoot ? parent.host : null);
                }
                return true;
              });
              if (!shown) await first.click().catch(() => {});
            };
            await clickUnlessShown(previewMore);
            await clickUnlessShown(tabMore);
            const previewMenuOpened = (await previewMore.count()) > 0 && await popupShownAfterClick(previewMore.first());
            const tabMenuOpened = (await tabMore.count()) > 0 && await popupShownAfterClick(tabMore.first());
            if (!previewMenuOpened || !tabMenuOpened) {
              differences.push(`${slug} ${scenarioId} ${tab}: menu surface after opening differs (preview ${previewMenuOpened ? 'shown' : 'not shown'}, tab ${tabMenuOpened ? 'shown' : 'not shown'})`);
              continue;
            }
          }
        }

        // Collect preview contents after its menu state has been settled.
        // Declared preview-only chrome (a component's `previewOnly` selectors)
        // is the playground's, not the copied code's, so its roots and text do not count.
        // Opacity 0 hides a root the same way it hides a word, once any opacity
        // transition has finished. The same rule runs on both sides.
        await waitForOpacity(previewFrame);
        await waitForOpacity(page);
        const component = components[slug];
        const previewOnly = 'previewOnly' in component && component.previewOnly ? [...component.previewOnly] : [];
        const previewClasses = await previewFrame.evaluate((selectors: string[]) => {
          const found = new Set<string>();
          const hiddenByOpacity = (start: Element) => {
            let element: Element | null = start;
            while (element) {
              const style = getComputedStyle(element);
              const fading = element.getAnimations().some(animation => {
                if (animation.playState !== 'running') return false;
                const effect = animation.effect;
                return effect instanceof KeyframeEffect && effect.getKeyframes().some(frame => Object.prototype.hasOwnProperty.call(frame, 'opacity'));
              });
              if (Number(style.opacity) === 0 && !fading) return true;
              const root = element.getRootNode();
              element = element.parentElement ?? (root instanceof ShadowRoot ? root.host : null);
            }
            return false;
          };
          const visit = (node: Element) => {
            if (selectors.some(selector => node.matches(selector))) return;
            if (!hiddenByOpacity(node)) for (const cls of node.classList) if (cls.startsWith('mtrl-')) found.add(cls);
            if (node.shadowRoot) [...node.shadowRoot.children].forEach(visit);
            [...node.children].forEach(visit);
          };
          visit(document.body);
          return [...found];
        }, previewOnly);
        const previewRoots = previewClasses.filter(isRootClass);
        const previewText = await previewFrame.evaluate(collectVisibleText, previewOnly);

        // Collect root classes from mounted tab
        const tabClasses = await page.evaluate(() => {
          const found = new Set<string>();
          const hiddenByOpacity = (start: Element) => {
            let element: Element | null = start;
            while (element) {
              const style = getComputedStyle(element);
              const fading = element.getAnimations().some(animation => {
                if (animation.playState !== 'running') return false;
                const effect = animation.effect;
                return effect instanceof KeyframeEffect && effect.getKeyframes().some(frame => Object.prototype.hasOwnProperty.call(frame, 'opacity'));
              });
              if (Number(style.opacity) === 0 && !fading) return true;
              const root = element.getRootNode();
              element = element.parentElement ?? (root instanceof ShadowRoot ? root.host : null);
            }
            return false;
          };
          const visit = (node: Element) => {
            if (!hiddenByOpacity(node)) for (const cls of node.classList) if (cls.startsWith('mtrl-')) found.add(cls);
            if (node.shadowRoot) [...node.shadowRoot.children].forEach(visit);
            [...node.children].forEach(visit);
          };
          visit(document.body);
          return [...found];
        });
        const tabRoots = tabClasses.filter(isRootClass);
        const tabText = await page.evaluate(collectVisibleText, [] as string[]);

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
    // Closing the context releases that renderer's documents. The next component
    // reads the stage width on the new preview page.
    const recycled = componentIndex % recycleEvery === 0 && componentIndex < targetSlugs.length;
    if (recycled) {
      await page.context().close();
      await previewPage.context().close();
      ({ page, previewPage } = await openPages());
    }
    console.log(`pace: ${slug} scenarios ${componentScenarios} mounts ${componentMounts} at ${secondsSinceStart()}s${recycled ? ', pages recycled' : ''}`);
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

console.log(`Tab checks passed: ${totalMounts} mounts over ${totalScenarios} scenarios, ${targetSlugs.length} of ${eligibleSlugs.length} components, roots and text.`);
