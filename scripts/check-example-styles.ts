import assert from "node:assert/strict";
import type { Page } from "playwright";
import type { ExampleMeta } from "../examples/types";

/** Start before navigation; inspect render-blocking links on the first measured frame. */
export async function preparePackageStylesCheck(page: Page, example: ExampleMeta): Promise<() => Promise<void>> {
  const paths = (example.packageStyles ?? []).map((_, index) => `/dist/examples/${example.slug}/package-${index}.css`);
  if (!paths.length) return async () => {};
  await page.addInitScript(paths => {
    (window as any).__examplePackageStyles = new Promise(resolve => {
      const measure = () => {
        if (!document.body) return requestAnimationFrame(measure);
        resolve(paths.map(path => {
          const link = [...document.querySelectorAll<HTMLLinkElement>('head link[rel="stylesheet"]')]
            .find(link => new URL(link.href).pathname === path);
          return { path, loaded: !!link?.sheet };
        }));
      };
      requestAnimationFrame(measure);
    });
  }, paths);
  return async () => {
    const sheets = await page.evaluate(() => (window as any).__examplePackageStyles) as { path: string; loaded: boolean }[];
    assert.equal(sheets.length, paths.length);
    for (const sheet of sheets) {
      assert(sheet.loaded, `${example.slug}: ${sheet.path} is loaded on the first measured frame`);
    }
    console.log(`  ok ${example.slug}: package stylesheets loaded on the first measured frame`);
  };
}
