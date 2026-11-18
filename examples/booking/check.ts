// What a visitor does with this example; scripts/check-examples.ts runs it in every
// framework and compares what each one shows afterwards.
import type { Page } from "playwright";

export default async function steps(page: Page): Promise<void> {
  const exact = { exact: true } as const;
  await page.getByRole("textbox", { name: "Name", ...exact }).fill("Ada Lovelace");
  await page.getByRole("textbox", { name: "Email", ...exact }).fill("ada@example.com");
  await page.locator("label", { hasText: "Family room" }).click();
  await page.getByRole("checkbox", { name: /Breakfast/ }).click();
  await page.getByRole("button", { name: "Book", ...exact }).click();
  await page.getByRole("button", { name: "Confirm booking", ...exact }).click();
}
