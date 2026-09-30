// Measures what each component costs an app and writes data/sizes.json, which the
// component pages show. Every number is minified JS plus CSS, gzip level 9, as
// Bun's bundler builds it:
//
// - alone: the initial load of a page that uses only this component, with the
//   base stylesheet. Chunks it loads on demand (the button's progress) are `lazy`.
// - added: what it adds on top of mtrl's shared core, which a page pays once
//   whatever it uses: the base stylesheet and mtrl/core, plus for web components
//   defineElement and the shadow ripple styles. It is the core with this component
//   minus the core alone, so a component another one contains (select contains
//   textfield and menu) still shows its own cost.
//
// For both flavours: the factory (Vanilla) and the web component (the element,
// which the React, Vue, Svelte and Solid adapters render).
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { components } from "../src/shared/components";

const root = resolve(import.meta.dir, "..");
const work = resolve(root, "dist/sizes");
const mtrl = resolve(root, "node_modules/mtrl");
const slugs = Object.keys(components);

type Flavour = "factory" | "element";
const pascal = (slug: string): string => slug.replace(/(^|-)(\w)/g, (_, __, c: string) => c.toUpperCase());

// The import a page writes: the factory's creator, or the element's define function.
function imports(slug: string, flavour: Flavour, id: string): string {
  if (flavour === "element") return `import "mtrl/elements/css/${slug}";\nimport { define${pascal(slug)} as ${id} } from "mtrl/elements";\n${id}();\n`;
  const index = readFileSync(resolve(mtrl, "dist/components", slug, "index.js"), "utf8");
  const creator = /export default|as default\b|export \{ default(?: \}|,)/.test(index) ? `import ${id} from` : `import { create${pascal(slug)} as ${id} } from`;
  return `import "mtrl/styles/${slug}";\n${creator} "mtrl/components/${slug}";\nglobalThis.${id} = ${id};\n`;
}
const entry = (list: string[], flavour: Flavour): string =>
  `import "mtrl/styles/base";\n${list.map((slug, i) => imports(slug, flavour, `c${i}`)).join("")}`;
const core = (flavour: Flavour): string =>
  `import * as core from "mtrl/core";\nglobalThis.core = core;\n` +
  (flavour === "element" ? `import "mtrl/elements/css/ripple";\nimport { defineElement } from "mtrl/elements";\nglobalThis.defineElement = defineElement;\n` : "");

interface Size { initial: number; lazy: number }

// Builds an entry with code splitting; the initial load is the entry, the chunks it
// imports statically and the CSS. Chunks reached only through import() are lazy.
async function measure(name: string, source: string): Promise<Size> {
  const file = resolve(work, `${name}.ts`);
  await writeFile(file, source);
  const result = await Bun.build({ entrypoints: [file], target: "browser", minify: true, splitting: true, format: "esm" });
  if (!result.success) throw new AggregateError(result.logs, `${name}: build failed`);
  const texts = new Map<string, string>();
  for (const output of result.outputs) texts.set(output.path.replace(/^\.\//, ""), await output.text());
  const entryPath = result.outputs.find(o => o.kind === "entry-point")!.path.replace(/^\.\//, "");
  const initial = new Set<string>();
  const visit = (path: string): void => {
    if (initial.has(path)) return;
    initial.add(path);
    for (const [, dep] of texts.get(path)!.matchAll(/(?:from|import)\s*["']\.\/([^"']+)["']/g)) if (texts.has(dep!)) visit(dep!);
  };
  visit(entryPath);
  for (const path of texts.keys()) if (path.endsWith(".css")) initial.add(path);
  const size = { initial: 0, lazy: 0 };
  for (const [path, text] of texts) size[initial.has(path) ? "initial" : "lazy"] += gzipSync(text, { level: 9 }).length;
  return size;
}

await mkdir(work, { recursive: true });
const sizes: Record<string, Record<Flavour, { alone: number; lazy: number; added: number }>> = {};
const shared: Record<Flavour, number> = { factory: 0, element: 0 };
for (const flavour of ["factory", "element"] as const) {
  shared[flavour] = (await measure(`${flavour}-core`, core(flavour) + entry([], flavour))).initial;
  for (const slug of slugs) {
    const alone = await measure(`${flavour}-${slug}`, entry([slug], flavour));
    const withCore = await measure(`${flavour}-core-${slug}`, core(flavour) + entry([slug], flavour));
    (sizes[slug] ??= {} as never)[flavour] = { alone: alone.initial, lazy: alone.lazy, added: withCore.initial - shared[flavour] };
  }
  console.log(`${flavour}: core ${(shared[flavour] / 1024).toFixed(1)} KB`);
}

const { version } = JSON.parse(await readFile(resolve(mtrl, "package.json"), "utf8")) as { version: string };
await mkdir(resolve(root, "data"), { recursive: true });
await writeFile(resolve(root, "data/sizes.json"), `${JSON.stringify({ mtrl: version, measured: new Date().toISOString().slice(0, 10), gzip: 9, core: shared, components: sizes }, null, 2)}\n`);
for (const slug of slugs) {
  const { factory, element } = sizes[slug]!;
  const kb = (n: number): string => `${(n / 1024).toFixed(1)}`;
  console.log(`${slug.padEnd(18)} factory ${kb(factory.alone)} (+${kb(factory.added)})  element ${kb(element.alone)} (+${kb(element.added)})${factory.lazy ? `  lazy ${kb(factory.lazy)}` : ""}`);
}
