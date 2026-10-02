import { expect, test } from "bun:test";
import { resolve } from "node:path";

const settingsDir = resolve(import.meta.dir, "../examples/settings");
const names = ["vanilla.ts", "app.ts", "controls.ts", "data.ts", "details.ts", "icons.ts", "state.ts"];

test("built Settings sources list the variant and its six helpers in order", async () => {
  const sources = await Bun.file(resolve(import.meta.dir, "../dist/examples/settings/sources.json")).json();
  expect(Object.keys(sources)).toEqual(["vanilla"]);
  expect(sources.vanilla.files.map((file: { name: string }) => file.name)).toEqual(names);
  for (const file of sources.vanilla.files) {
    expect(file.code).toBe(await Bun.file(resolve(settingsDir, file.name)).text());
  }
  expect(sources.vanilla.gzip).toBeGreaterThan(0);
});

test("source generation keeps a no-helper variant as one unchanged source file", async () => {
  const { exampleSources } = await import("../scripts/example-sources");
  const dir = resolve(import.meta.dir, "fixtures/example-sources/plain");
  for (const name of ["vanilla.ts", "html.ts"]) {
    expect(await exampleSources(dir, name)).toEqual([{ name, code: await Bun.file(resolve(dir, name)).text() }]);
  }
});

test("source generation follows shared, cyclic, type and dynamic imports without including stray files", async () => {
  const { exampleSources } = await import("../scripts/example-sources");
  const dir = resolve(import.meta.dir, "fixtures/example-sources/graph");
  for (const name of ["vanilla.ts", "html.ts", "svelte.svelte"]) {
    expect((await exampleSources(dir, name)).map(file => file.name)).toEqual([
      name, "nested/index.ts", "shared.ts", "types.ts",
    ]);
  }
});

test("source generation lists code files only, not imported data files", async () => {
  const { exampleSources } = await import("../scripts/example-sources");
  const dir = resolve(import.meta.dir, "fixtures/example-sources/assets");
  expect((await exampleSources(dir, "vanilla.ts")).map(file => file.name)).toEqual([
    "vanilla.ts", "Card.vue", "card-styles.ts", "helper.ts", "nested/deep.ts",
  ]);
});
