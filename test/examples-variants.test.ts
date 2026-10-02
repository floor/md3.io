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
  test("an empty array rejected", () => {
    const meta: ExampleMeta = { ...baseMeta, variants: [] };
    expect(() => exampleVariantIds(meta)).toThrow("Example test declares an empty variants array");
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

import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterAll } from "bun:test";

describe("fixture example", () => {
  let fixtureDir: string;

  afterAll(async () => {
    if (fixtureDir) {
      await rm(fixtureDir, { recursive: true, force: true });
    }
  });

  test("proves the feature with a tiny fixture example inside the tests", async () => {
    fixtureDir = await mkdtemp(join(tmpdir(), "md3io-example-fixture-"));
    await writeFile(join(fixtureDir, "meta.ts"), "export default { slug: 'temp-fixture', title: 'Temp', description: '', components: [], about: [], how: [], variants: ['vanilla'] };");
    
    const fixtureMeta = (await import(join(fixtureDir, "meta.ts"))).default;
    
    expect(exampleVariantIds(fixtureMeta)).toEqual(["vanilla"]);
    expect(exampleReferenceId(fixtureMeta)).toBe("vanilla");
  });
});
