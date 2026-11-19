// What a visitor does with this example; scripts/check-examples.ts runs it in every
// framework and compares what each one shows afterwards.
import type { Page } from "playwright";

export default async function steps(page: Page): Promise<void> {
  const exact = { exact: true } as const;
  // The rail: Starred gathers the starred messages, Inbox brings the full list back.
  await page.getByRole("button", { name: "Starred" }).click();
  await page.getByRole("button", { name: "Inbox" }).click();
  // The label chips filter, and a second click clears the filter.
  await page.getByRole("gridcell", { name: "Work", ...exact }).click();
  await page.getByRole("gridcell", { name: "Personal", ...exact }).click();
  await page.getByRole("gridcell", { name: "Personal", ...exact }).click();
  // The search filters by sender, subject and snippet; the clear button empties it.
  const search = page.getByRole("combobox", { name: "Search mail", ...exact });
  await search.click();
  await search.pressSequentially("budget", { delay: 20 });
  await page.getByRole("button", { name: "Clear search", ...exact }).click();
  // Selecting rows shows the selection bar; Archive applies to the selection.
  await page.getByRole("checkbox", { name: "Select Flight itinerary to Lisbon", ...exact }).click();
  await page.getByRole("checkbox", { name: "Select Lunch on Friday?", ...exact }).click();
  await page.getByRole("button", { name: "Archive", ...exact }).click();
  // A row's star toggle.
  await page.getByRole("listitem").filter({ hasText: "New mockups for the kiosk app" })
    .getByRole("button", { name: "Star", ...exact }).click();
  // Opening a message, and Reply pre-filling the compose dialog; Cancel closes it.
  await page.getByRole("button", { name: /Quarterly budget review/ }).click();
  await page.getByRole("button", { name: "Reply", ...exact }).click();
  await page.getByRole("button", { name: "Cancel", ...exact }).click();
  // On a narrow frame the open message takes the pane; the back action returns to the list.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Back to list", ...exact }).click();
  await page.getByRole("button", { name: /New mockups for the kiosk app/ }).click();
  await page.getByRole("button", { name: "Back to list", ...exact }).click();
  await page.setViewportSize({ width: 1280, height: 720 });
  // Compose, send, and the new message in Sent, confirmed by the snackbar.
  await page.getByRole("button", { name: "Compose", ...exact }).click();
  await page.getByRole("textbox", { name: "To", ...exact }).fill("Robin");
  await page.getByRole("textbox", { name: "Subject", ...exact }).fill("Weekend plan");
  await page.getByRole("textbox", { name: "Message", ...exact }).fill("Let's go hiking on Saturday.");
  await page.getByRole("button", { name: "Send", ...exact }).click();
  await page.getByRole("button", { name: "Sent" }).click();
  // The dialog closes with an animation; wait for it to leave the tree before the snapshot.
  await page.getByRole("alertdialog", { name: "New message" }).waitFor({ state: "hidden" });
}
