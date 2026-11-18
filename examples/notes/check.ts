// What a visitor does with this example; scripts/check-examples.ts runs it in every
// framework and compares what each one shows afterwards.
//
// Locators stay with roles and names, as Settings' check does. Two of them lean on
// DOM order, which is the same in every variant: the label filter sits above the
// cards, and the editor's chips come after them, so the first "Work" gridcell is
// the filter's and the last "Travel" one is the editor's. The editor's fields are
// the only textboxes on the page, so they need no scoping.
import type { Page } from "playwright";

export default async function steps(page: Page): Promise<void> {
  const exact = { exact: true } as const;

  // Filter by Work, then clear the filter.
  await page.getByRole("gridcell", { name: "Work", ...exact }).first().click();
  await page.getByRole("gridcell", { name: "Work", ...exact }).first().click();

  // Search narrows the grid, down to nothing, and back.
  await page.getByRole("combobox", { name: "Search notes" }).fill("pasta");
  await page.getByRole("combobox", { name: "Search notes" }).fill("");
  await page.getByRole("combobox", { name: "Search notes" }).fill("xylophone");
  await page.getByRole("combobox", { name: "Search notes" }).fill("");

  // Pin a note: it moves to the Pinned section.
  await page.getByRole("button", { name: "Pin Pasta sauce", ...exact }).click();

  // Edit a note: rename it and add a label in the editor.
  await page.getByRole("button", { name: "Open Pasta sauce", ...exact }).click();
  await page.getByRole("textbox", { name: "Title", ...exact }).fill("Pasta sauce v2");
  await page.getByRole("gridcell", { name: "Travel", ...exact }).last().click();
  await page.getByRole("button", { name: "Save", ...exact }).click();

  // Switch to the list view.
  await page.getByRole("button", { name: "List view", ...exact }).click();

  // Create a note from the FAB.
  await page.getByRole("button", { name: "New note", ...exact }).click();
  await page.getByRole("textbox", { name: "Title", ...exact }).fill("Spare keys");
  await page.getByRole("textbox", { name: "Note", ...exact }).fill("Hide a set with the neighbour.");
  await page.getByRole("gridcell", { name: "Travel", ...exact }).last().click();
  await page.getByRole("button", { name: "Save", ...exact }).click();

  // Delete it from its card, then undo.
  await page.getByRole("button", { name: "Delete Spare keys", ...exact }).click();
  await page.getByRole("button", { name: "Undo", ...exact }).click();

  // Delete from the editor, then dismiss the snackbar it shows.
  await page.getByRole("button", { name: "Open Story prompts", ...exact }).click();
  await page.getByRole("button", { name: "Delete", ...exact }).click();
  await page.getByRole("button", { name: "Dismiss", ...exact }).click();
}
