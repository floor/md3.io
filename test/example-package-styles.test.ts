import { afterAll, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import fixture from "./fixtures/package-styles/meta";
import settings from "../examples/settings/meta";

const dir = resolve(import.meta.dir, "fixtures/package-styles");
// Bundled stylesheets are build output: the suite writes them to a temp directory,
// never into dist.
const output = await mkdtemp(join(tmpdir(), "md3io-package-styles-"));

afterAll(async () => {
  await rm(output, { recursive: true, force: true });
});

test("package styles resolve public exports and bundle CSS imports in declaration order", async () => {
  const { buildPackageStyles } = await import("../scripts/example-package-styles");
  await buildPackageStyles(fixture, dir, output);
  const first = await Bun.file(resolve(output, "package-0.css")).text();
  expect(first).toContain("--package-style-first");
  expect(first).toContain("--package-style-import");
  expect(await Bun.file(resolve(output, "package-1.css")).text()).toContain("--package-style-second");
});

test("an invalid or private stylesheet export names its example and specifier", async () => {
  const { buildPackageStyles } = await import("../scripts/example-package-styles");
  for (const specifier of ["missing-package/styles", "example-style-fixture/theme/tokens.css", "example-style-fixture/script", "./theme/base.css"]) {
    await expect(buildPackageStyles({ ...fixture, packageStyles: [specifier] }, dir, output))
      .rejects.toThrow(`Example ${fixture.slug}: cannot build package stylesheet "${specifier}"`);
  }
});

test("Settings declares no package sheets and does not need stylesheet resolution", async () => {
  const { buildPackageStyles } = await import("../scripts/example-package-styles");
  await expect(buildPackageStyles(settings, "/nonexistent-example", "/nonexistent-output")).resolves.toBeUndefined();
});
