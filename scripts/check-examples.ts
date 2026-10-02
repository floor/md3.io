// Every example in every framework, in Chromium: no errors, and the same interface.
//
// For each variant it loads the example's frame, takes an accessibility snapshot of
// the app (roles, names, checked, disabled, selected), runs the example's steps
// (examples/<slug>/check.ts) and snapshots again. Every framework must match the
// reference variant exactly, before and after: the tabs of an example are the
// same interface, not five pages that drift apart.
//
//   bun scripts/build.ts && bun scripts/check-examples.ts
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { mkdir } from "node:fs/promises";
import { chromium, type Page } from "playwright";
import { preparePackageStylesCheck } from "./check-example-styles";
import { handleRequest } from "../server";
import { examples, FRAMEWORKS, exampleVariantIds, exampleReferenceId } from "../examples";

const server = Bun.serve({ port: 0, hostname: "127.0.0.1", fetch: handleRequest });
const browser = await chromium.launch();
let checks = 0;

try {
  const sourcePage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await sourcePage.goto(`${server.url}examples/settings/?framework=vanilla`);
  const source = sourcePage.locator('.example-source[data-framework="vanilla"]');
  const expectedFiles = ["vanilla.ts", "app.ts", "controls.ts", "data.ts", "details.ts", "icons.ts", "state.ts"];
  const listedFiles = await source.getByRole("tab").allTextContents();
  assert.deepEqual(listedFiles, expectedFiles, "Settings code panel lists the variant and all six helpers");
  console.log(`  ok Settings code panel files: ${listedFiles.join(", ")}`);
  await source.getByRole("tab", { name: "data.ts", exact: true }).click();
  assert.equal(await source.locator("pre:visible code").textContent(),
    await Bun.file(resolve(import.meta.dir, "../examples/settings/data.ts")).text(),
    "choosing data.ts shows its complete source");
  assert.equal(await source.getByRole("tab", { name: "data.ts", exact: true }).getAttribute("aria-selected"), "true");
  console.log("  ok Settings code panel: choosing data.ts shows its complete source");
  await mkdir(resolve(import.meta.dir, "../analysis/examples"), { recursive: true });
  await source.scrollIntoViewIfNeeded();
  await sourcePage.screenshot({ path: resolve(import.meta.dir, "../analysis/examples/settings-source.png") });
  await sourcePage.close();

  for (const example of examples) {
    const steps = (await import(resolve(import.meta.dir, "../examples", example.slug, "check.ts"))).default as (page: Page) => Promise<void>;
    const ids = exampleVariantIds(example);
    const referenceId = exampleReferenceId(example);
    const reference: Record<string, string> = {};
    const refFramework = FRAMEWORKS.find(f => f.id === referenceId)!;

    async function runVariant(id: string, label: string, isReference: boolean) {
      const page = await browser.newPage();
      const problems: string[] = [];
      page.on("pageerror", (error) => problems.push(error.message));
      page.on("console", (message) => { if (message.type() === "error" || message.type() === "warning") problems.push(message.text()); });
      const checkStyles = await preparePackageStylesCheck(page, example);
      await page.goto(`${server.url}examples/${example.slug}/frame/${id}/`);
      await checkStyles();
      const app = page.locator("#app");
      await page.waitForFunction(() => (document.getElementById("app")?.childElementCount ?? 0) > 0);
      await page.waitForTimeout(100); // elements upgrade and adapters mount
      const before = await app.ariaSnapshot();
      await steps(page);
      await page.waitForTimeout(100);
      const after = await app.ariaSnapshot();
      await page.close();
      assert.deepEqual(problems, [], `${example.slug}/${label}: no errors or warnings`);
      if (isReference) {
        reference.before = before;
        reference.after = after;
      } else {
        assert.equal(before, reference.before, `${example.slug}/${label} renders what ${refFramework.label} renders`);
        assert.equal(after, reference.after, `${example.slug}/${label} behaves as ${refFramework.label} does`);
      }
      checks++;
      console.log(`  ok ${example.slug}: ${label}`);
    }

    await runVariant(refFramework.id, refFramework.label, true);
    for (const f of FRAMEWORKS) {
      if (ids.includes(f.id) && f.id !== referenceId) {
        await runVariant(f.id, f.label, false);
      }
    }
  }
} finally {
  await browser.close();
  server.stop(true);
}
console.log(`examples: ${checks} variants match`);
