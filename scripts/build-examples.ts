// Builds every example in every framework: dist/examples/<slug>/<framework>.js, and
// dist/examples/<slug>/sources.json with the files each variant runs (the code panel
// shows exactly these) and its gzipped size.
//
// Each variant gets its own bundle, with its framework's own compiler: Svelte's for
// .svelte files, babel-preset-solid for Solid's JSX, Vue's runtime template compiler
// for the Vue template, Bun's JSX for React.
import { mkdir, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";
import type { BunPlugin } from "bun";
import { transformAsync } from "@babel/core";
import { compile } from "svelte/compiler";
import { examples, FRAMEWORKS, type FrameworkId } from "../examples";

const root = resolve(import.meta.dir, "..");
const outdir = resolve(root, "dist/examples");

// How each variant is mounted in its frame. Not shown in the code panel: it is the
// framework's own boilerplate, the same for every example.
const mount: Record<FrameworkId, (file: string) => string> = {
  html: (file) => `import "./${file}";`,
  vanilla: (file) => `import "./${file}";`,
  react: (file) => `import { createElement } from "react";
import { createRoot } from "react-dom/client";
import App from "./${file}";
createRoot(document.getElementById("app")).render(createElement(App));`,
  vue: (file) => `import { createApp } from "vue";
import App from "./${file}";
createApp(App).mount("#app");`,
  svelte: (file) => `import { mount } from "svelte";
import App from "./${file}";
mount(App, { target: document.getElementById("app") });`,
  solid: (file) => `import { createComponent } from "solid-js";
import { render } from "solid-js/web";
import App from "./${file}";
render(() => createComponent(App, {}), document.getElementById("app"));`,
};

const svelte: BunPlugin = {
  name: "svelte",
  setup(build) {
    build.onLoad({ filter: /\.svelte$/ }, async ({ path }) => ({
      contents: compile(await Bun.file(path).text(), { filename: path, generate: "client" }).js.code,
      loader: "js",
    }));
  },
};

const solid: BunPlugin = {
  name: "solid",
  setup(build) {
    build.onLoad({ filter: /[\\/]solid\.tsx$/ }, async ({ path }) => {
      const result = await transformAsync(await Bun.file(path).text(), {
        filename: path,
        presets: [["babel-preset-solid", { generate: "dom" }], "@babel/preset-typescript"],
      });
      return { contents: result?.code ?? "", loader: "js" };
    });
  },
};

// One copy of each framework. node_modules/material links to a local material checkout that
// has its own react, vue, svelte and solid-js (its dev dependencies), so material/react
// would otherwise import a second React, whose hooks fail; the same goes for the
// others. Every framework import resolves from md3.io's node_modules instead. Vue
// resolves to its full build, which carries the template compiler the example uses.
const FRAMEWORK_IMPORT = /^(react|react-dom|vue|svelte|solid-js)(\/.*)?$/;

// Bun.resolveSync resolves as a server would, which hands Svelte and Solid their
// server builds; this reads the package's exports with the browser's conditions.
const BROWSER_CONDITIONS = ["browser", "import", "module", "default"];
const pickCondition = (target: unknown): string | undefined => {
  if (typeof target === "string") return target;
  if (!target || typeof target !== "object") return undefined;
  for (const condition of BROWSER_CONDITIONS) {
    const found = pickCondition((target as Record<string, unknown>)[condition]);
    if (found) return found;
  }
  return undefined;
};
const resolveForBrowser = (specifier: string): string => {
  const [, name, subpath = ""] = FRAMEWORK_IMPORT.exec(specifier)!;
  const dir = resolve(root, "node_modules", name!);
  const pkg = JSON.parse(readFileSync(resolve(dir, "package.json"), "utf8")) as { exports?: Record<string, unknown> };
  const target = pkg.exports ? pickCondition(pkg.exports[`.${subpath}`]) : undefined;
  return target ? resolve(dir, target) : Bun.resolveSync(specifier, root);
};

const oneCopy: BunPlugin = {
  name: "one-copy",
  setup(build) {
    build.onResolve({ filter: FRAMEWORK_IMPORT }, ({ path }) => ({
      path: path === "vue" ? resolve(root, "node_modules/vue/dist/vue.esm-bundler.js") : resolveForBrowser(path),
    }));
  },
};

// The entry of a variant is its mount code, next to the example's files.
const entryPlugin = (dir: string, framework: FrameworkId, file: string): BunPlugin => ({
  name: "entry",
  setup(build) {
    build.onResolve({ filter: /^example-entry$/ }, () => ({ path: resolve(dir, `__${framework}.entry.ts`), namespace: "entry" }));
    build.onLoad({ filter: /.*/, namespace: "entry" }, () => ({ contents: mount[framework](file), loader: "ts", resolveDir: dir }));
  },
});

let failed = false;
for (const example of examples) {
  const dir = resolve(root, "examples", example.slug);
  const sources: Record<string, { files: { name: string; code: string }[]; gzip: number }> = {};
  await mkdir(resolve(outdir, example.slug), { recursive: true });
  for (const { id, file } of FRAMEWORKS) {
    const result = await Bun.build({
      entrypoints: ["example-entry"],
      target: "browser",
      minify: true,
      plugins: [entryPlugin(dir, id, file), oneCopy, svelte, solid],
      define: {
        "process.env.NODE_ENV": '"production"',
        __VUE_OPTIONS_API__: "true",
        __VUE_PROD_DEVTOOLS__: "false",
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: "false",
      },
    });
    if (!result.success) {
      failed = true;
      console.error(`${example.slug}/${id}:`, ...result.logs);
      continue;
    }
    const js = await result.outputs[0].text();
    await writeFile(resolve(outdir, example.slug, `${id}.js`), js);
    sources[id] = {
      files: [
        { name: file, code: await Bun.file(resolve(dir, file)).text() },
        { name: "shared.ts", code: await Bun.file(resolve(dir, "shared.ts")).text() },
      ],
      gzip: gzipSync(js).length,
    };
  }
  await writeFile(resolve(outdir, example.slug, "sources.json"), JSON.stringify(sources));
  console.log(`${example.slug}: ${Object.entries(sources).map(([id, s]) => `${id} ${(s.gzip / 1024).toFixed(1)} KB`).join(", ")}`);
}
if (failed) process.exit(1);
