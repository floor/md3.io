import { test, expect, describe } from "bun:test";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { exampleVariantIds, exampleReferenceId, type ExampleMeta, type FrameworkId } from "../examples/types";

describe("exampleVariantIds", () => {
  const baseMeta = { slug: "test", title: "Test", description: "", components: [], about: [], how: [] };

  test("default", () => {
    const ids = exampleVariantIds(baseMeta);
    expect(ids).toEqual(["vanilla", "html", "react", "vue", "svelte", "solid"]);
  });

  test("subset with html", () => {
    const meta: ExampleMeta = { ...baseMeta, variants: ["vanilla", "html", "react"] };
    const ids = exampleVariantIds(meta);
    expect(ids).toEqual(["vanilla", "html", "react"]);
  });

  test("subset without html", () => {
    const meta: ExampleMeta = { ...baseMeta, variants: ["vanilla", "react"] };
    const ids = exampleVariantIds(meta);
    expect(ids).toEqual(["vanilla", "react"]);
  });

  test("an unknown id rejected", () => {
    const meta: ExampleMeta = { ...baseMeta, variants: ["vanilla", "unknown" as FrameworkId] };
    expect(() => exampleVariantIds(meta)).toThrow("Unknown framework id: unknown");
  });
});

describe("exampleReferenceId", () => {
  const baseMeta = { slug: "test", title: "Test", description: "", components: [], about: [], how: [] };

  test("default", () => {
    const ref = exampleReferenceId(baseMeta);
    expect(ref).toBe("html");
  });

  test("subset with html", () => {
    const meta: ExampleMeta = { ...baseMeta, variants: ["vanilla", "react", "html"] };
    const ref = exampleReferenceId(meta);
    expect(ref).toBe("html");
  });

  test("subset without html", () => {
    const meta: ExampleMeta = { ...baseMeta, variants: ["vanilla", "react"] };
    const ref = exampleReferenceId(meta);
    expect(ref).toBe("vanilla");
  });
});

describe("fixture example", () => {
  test("proves the feature with a tiny fixture example inside the tests", async () => {
    const fixtureDir = resolve(import.meta.dir, "temp-fixture");
    await mkdir(fixtureDir, { recursive: true });
    
    await writeFile(resolve(fixtureDir, "meta.ts"), "export default { slug: 'temp-fixture', title: 'Temp', description: '', components: [], about: [], how: [], variants: ['vanilla'] };");
    
    // dynamically import the created fixture meta
    const fixtureMeta = (await import(resolve(fixtureDir, "meta.ts"))).default;
    
    expect(exampleVariantIds(fixtureMeta)).toEqual(["vanilla"]);
    expect(exampleReferenceId(fixtureMeta)).toBe("vanilla");

    await rm(fixtureDir, { recursive: true, force: true });
  });
});
