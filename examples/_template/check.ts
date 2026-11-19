// What a visitor does with this example; scripts/check-examples.ts runs it in every
// framework and compares what each one shows afterwards.
import type { Page } from "playwright";

export default async function steps(page: Page): Promise<void> {
  const exact = { exact: true } as const;
  await page.getByRole("switch", { name: "Notify me", ...exact }).click();
  await page.getByRole("button", { name: "Save", ...exact }).click();
}
