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
import { chromium, type Locator, type Page } from "playwright";
import { handleRequest } from "../server";
import { examples, FRAMEWORKS, exampleVariantIds, exampleReferenceId } from "../examples";

const server = Bun.serve({ port: 0, hostname: "127.0.0.1", fetch: handleRequest });
const browser = await chromium.launch();
let checks = 0;

try {
  // What assistive tech gets: browsers drop `inert` and `aria-hidden` subtrees from the
  // accessibility tree. Playwright's ariaSnapshot drops `aria-hidden` but not `inert`
  // (material 3.15.2 guards its closed factory dialog and snackbar with `inert` alone
  // until first open, floor/material#427), so a raw snapshot would show Vanilla a closed
  // surface the element flavours — which render nothing until first open — never show.
  // Mirror the browser: for the take, mark every inert element `aria-hidden` too, then
  // restore. One place, used for both snapshots each variant is compared by.
  const accessibleSnapshot = async (app: Locator): Promise<string> => {
    await app.evaluate(() => {
      const marked: { el: Element; had: string | null }[] = [];
      const visit = (root: ParentNode): void => {
        for (const el of ([...root.querySelectorAll("*")] as Element[])) {
          if ((el as HTMLElement).inert) {
            marked.push({ el, had: el.getAttribute("aria-hidden") });
            el.setAttribute("aria-hidden", "true");
          }
          if (el.shadowRoot) visit(el.shadowRoot);
        }
      };
      visit(document.getElementById("app")!);
      (window as unknown as { __inertMarked?: { el: Element; had: string | null }[] }).__inertMarked = marked;
    });
    const snapshot = await app.ariaSnapshot();
    await app.evaluate(() => {
      for (const { el, had } of (window as unknown as { __inertMarked?: { el: Element; had: string | null }[] }).__inertMarked ?? []) {
        if (had === null) el.removeAttribute("aria-hidden");
        else el.setAttribute("aria-hidden", had);
      }
      delete (window as unknown as { __inertMarked?: unknown }).__inertMarked;
    });
    return snapshot;
  };

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
      await page.goto(`${server.url}showcase/${example.slug}/frame/${id}/`);
      const app = page.locator("#app");
      await page.waitForFunction(() => (document.getElementById("app")?.childElementCount ?? 0) > 0);
      await page.waitForTimeout(100); // elements upgrade and adapters mount
      const before = await accessibleSnapshot(app);
      await steps(page);
      await page.waitForTimeout(100);
      const after = await accessibleSnapshot(app);
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

    // The Showcase page's Copy code (material's xs button): for each framework it copies
    // that framework's visible source, and material's snackbar says so, as the one
    // status region with the text.
    const context = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const id of ids) {
      await page.goto(`${server.url}showcase/${example.slug}/?framework=${id}`);
      const source = page.locator(`.example-source[data-framework="${id}"]`);
      await source.waitFor();
      await source.getByRole("button", { name: "Copy code", exact: true }).click();
      await page.getByRole("status").filter({ hasText: "Code copied" }).waitFor();
      if (await page.getByRole("status").filter({ hasText: "Code copied" }).count() !== 1) throw new Error(`${example.slug}/${id}: "Code copied" is announced more than once`);
      const copied = await page.evaluate(() => navigator.clipboard.readText());
      const visible = (await source.locator("pre:not([hidden]) code").first().textContent()) ?? "";
      if (!copied || copied.trim() !== visible.trim()) throw new Error(`${example.slug}/${id}: Copy code copied something other than the visible source`);
    }
    if (errors.length) throw new Error(`${example.slug} Copy code: ${errors.join("; ")}`);
    await context.close();
    console.log(`  ok ${example.slug}: Copy code in ${ids.length} frameworks`);
  }
} finally {
  await browser.close();
  server.stop(true);
}
console.log(`examples: ${checks} variants match`);
