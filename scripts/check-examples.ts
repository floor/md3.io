// Every example in every framework, in Chromium: no errors, and the same interface.
//
// For each variant it loads the example's frame, takes an accessibility snapshot of
// the app (roles, names, checked, disabled, selected), runs the example's steps
// (examples/<slug>/check.ts) and snapshots again. Every framework must match the
// web components (HTML) exactly, before and after: the tabs of an example are the
// same interface, not five pages that drift apart.
//
//   bun scripts/build.ts && bun scripts/check-examples.ts
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { chromium, type Page } from "playwright";
import { handleRequest } from "../server";
import { examples, FRAMEWORKS, exampleVariantIds, exampleReferenceId } from "../examples";

const server = Bun.serve({ port: 0, hostname: "127.0.0.1", fetch: handleRequest });
const browser = await chromium.launch();
let checks = 0;

try {
  for (const example of examples) {
    const steps = (await import(resolve(import.meta.dir, "../examples", example.slug, "check.ts"))).default as (page: Page) => Promise<void>;
    const ids = exampleVariantIds(example);
    const referenceId = exampleReferenceId(example);
    const reference: Record<string, string> = {};

    async function runVariant(id: string, label: string, isReference: boolean) {
      const page = await browser.newPage();
      const problems: string[] = [];
      page.on("pageerror", (error) => problems.push(error.message));
      page.on("console", (message) => { if (message.type() === "error" || message.type() === "warning") problems.push(message.text()); });
      await page.goto(`${server.url}examples/${example.slug}/frame/${id}/`);
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
        assert.equal(before, reference.before, `${example.slug}/${label} renders what the web components render`);
        assert.equal(after, reference.after, `${example.slug}/${label} behaves as the web components do`);
      }
      checks++;
      console.log(`  ok ${example.slug}: ${label}`);
    }

    const refFramework = FRAMEWORKS.find(f => f.id === referenceId)!;
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
