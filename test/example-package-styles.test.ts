import { expect, test } from "bun:test";
import { resolve } from "node:path";
import fixture from "./fixtures/package-styles/meta";
import settings from "../examples/settings/meta";

const dir = resolve(import.meta.dir, "fixtures/package-styles");
const output = resolve(import.meta.dir, "../dist/examples", fixture.slug);

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

test("declared stylesheets are linked and applied on the first frame even with a delayed response", async () => {
  const { buildPackageStyles } = await import("../scripts/example-package-styles");
  const { preparePackageStylesCheck } = await import("../scripts/check-example-styles");
  const { chromium } = await import("playwright");
  const { examples } = await import("../examples");
  const { handleRequest } = await import("../server");
  await buildPackageStyles(fixture, dir, output);
  const code = await Bun.file(resolve(dir, "vanilla.ts")).text();
  const bundle = await Bun.build({ entrypoints: [resolve(dir, "vanilla.ts")], outdir: output, target: "browser" });
  expect(bundle.success).toBe(true);
  await Bun.write(resolve(output, "sources.json"), JSON.stringify({ vanilla: { files: [{ name: "vanilla.ts", code }], gzip: 1 } }));
  examples.push(fixture);
  const server = Bun.serve({ port: 0, hostname: "127.0.0.1", fetch: request => {
    if (new URL(request.url).pathname === `/examples-styles/${fixture.slug}.css`) {
      return new Response(Bun.file(resolve(dir, "styles.css")));
    }
    return handleRequest(request);
  } });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    const check = await preparePackageStylesCheck(page, fixture);
    await page.addInitScript(() => {
      (window as any).__firstPackageRules = new Promise(resolve => {
        const measure = () => {
          if (!document.body) return requestAnimationFrame(measure);
          const style = getComputedStyle(document.documentElement);
          resolve(["--package-style-first", "--package-style-import", "--package-style-second", "--package-style-order"]
            .map(name => style.getPropertyValue(name).trim()));
        };
        requestAnimationFrame(measure);
      });
    });
    let delayed = false;
    await page.route("**/package-1.css*", async route => {
      delayed = true;
      await new Promise(resolve => setTimeout(resolve, 200));
      await route.continue();
    });
    const response = await page.goto(`${server.url}examples/${fixture.slug}/frame/vanilla/`);
    expect(response!.status()).toBe(200);
    await check();
    expect(delayed).toBe(true);
    expect(await page.evaluate(() => (window as any).__firstPackageRules)).toEqual(["ready", "imported", "ready", "second"]);
    expect(await page.locator("head link[rel=stylesheet][href*='/dist/examples/package-style-fixture/package-']").count()).toBe(2);
    expect(await page.locator("#app").textContent()).toBe("Package stylesheet fixture");
    expect(errors).toEqual([]);
  } finally {
    await browser.close();
    server.stop(true);
    examples.splice(examples.indexOf(fixture), 1);
  }
}, 15000);
