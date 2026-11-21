import assert from "node:assert/strict";
import type { Frame, Locator, Page } from "playwright";

const exact = { exact: true } as const;

export async function checkFrame(frame: Frame): Promise<void> {
  const openSearch = frame.getByRole("button", { name: "Search notes", ...exact });
  const search = frame.getByRole("combobox", { name: "Search notes" });
  await openSearch.or(search).first().waitFor();
  if (await openSearch.isVisible()) await openSearch.click();
  await search.fill("Pasta sauce");
  await frame.getByRole("status").filter({ hasText: /^Showing 1 of / }).waitFor();
  await frame.getByRole("button", { name: "Pasta sauce", ...exact }).waitFor();
  // Settle the search focus before the parent page tests footer keyboard navigation.
  await frame.getByRole("button", { name: "Go back", ...exact }).click();
  await search.and(frame.locator('[aria-expanded="false"]')).waitFor();
}

const category = (drawer: Locator, label: string) =>
  drawer.getByRole("button", { name: new RegExp(`^${label}(?: ?[0-9]+)?$`) });

async function assertBadge(drawer: Locator, label: string, count: number): Promise<void> {
  const badge = category(drawer, label).locator(".mtrl-drawer__item-badge");
  if (count === 0) await badge.waitFor({ state: "hidden" });
  else await badge.filter({ hasText: new RegExp(`^${count}$`) }).waitFor();
}

export default async function steps(page: Page): Promise<void> {
  const button = (name: string) => page.getByRole("button", { name, ...exact });
  const article = (name: string) => page.getByRole("article", { name, ...exact });
  const textbox = (name: string) => page.getByRole("textbox", { name, ...exact });
  const labelChip = (name: string) => page.getByRole("gridcell", { name, ...exact });
  const search = page.getByRole("combobox", { name: "Search notes" });
  const fab = button("New note");
  const inline = page.getByRole("navigation", { name: "Categories" });
  const modal = page.getByRole("dialog", { name: "Categories" });
  const notesStatus = page.getByRole("status").filter({ hasText: /^Showing / });
  const count = (shown: number, total: number) =>
    notesStatus.filter({ hasText: `Showing ${shown} of ${total} notes.` }).waitFor();
  const action = async (title: string, command: string) => {
    await button(`More actions for ${title}`).click();
    await page.getByRole("menuitem", { name: command, ...exact }).click();
  };

  await page.getByText("Notes", exact).waitFor();
  await inline.waitFor();
  await inline.getByText("Labels", exact).waitFor();
  await assertBadge(inline, "All notes", 11);
  await assertBadge(inline, "Pinned", 2);
  await assertBadge(inline, "Ideas", 4);
  await assertBadge(inline, "Shopping", 3);
  await assertBadge(inline, "Work", 3);
  await assertBadge(inline, "Travel", 2);
  await category(inline, "All notes").and(page.locator('[aria-current="page"]')).waitFor();
  assert.ok(((await fab.boundingBox())?.width ?? 0) > 100, "The extended FAB shows its label");

  assert.deepEqual(await page.locator(".notes__section h2").allTextContents(), [
    "Pinned", "Today", "Yesterday", "Earlier this week", "Older",
  ]);
  const sectionTimes = await page.locator(".notes__section").evaluateAll(sections => sections.map(section =>
    [...section.querySelectorAll("article")].map(card => card.querySelector("time")?.getAttribute("datetime") ?? ""),
  ));
  for (const dates of sectionTimes) {
    assert.ok(dates.every(value => Number.isFinite(Date.parse(value))), "Every card has a valid edit date");
    assert.deepEqual(dates, [...dates].sort().reverse(), "Cards in each section are sorted newest first");
  }
  await article("Pasta sauce").getByText("Edited 2 hours ago", exact).waitFor();
  await article("Books to borrow").getByText("12 Nov", exact).waitFor();

  await category(inline, "Pinned").click();
  await count(2, 11);
  await category(inline, "Work").click();
  await category(inline, "Work").and(page.locator('[aria-current="page"]')).waitFor();
  await count(3, 11);
  await article("Meeting points").waitFor();
  await article("Pasta sauce").waitFor({ state: "hidden" });
  await category(inline, "All notes").click();
  await search.fill("pasta");
  await count(1, 11);
  await search.fill("meeting");
  await count(1, 11);
  await article("Meeting points").waitFor();
  await search.fill("xylophone");
  await page.getByText("No notes match your search.", exact).waitFor();
  await search.fill("");
  await button("Go back").click();
  await search.and(page.locator('[aria-expanded="false"]')).waitFor();

  const sauce = article("Pasta sauce");
  const preview = sauce.getByText(/^Fry garlic/);
  await preview.scrollIntoViewIfNeeded();
  const box = await preview.boundingBox();
  assert.ok(box);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  assert.equal(await textbox("Title").inputValue(), "Pasta sauce");
  await button("Cancel").click();

  await action("Pasta sauce", "Pin");
  await assertBadge(inline, "Pinned", 3);
  await page.locator(".notes__section").filter({ has: page.getByRole("heading", { name: "Pinned", ...exact }) })
    .getByRole("article", { name: "Pasta sauce", ...exact }).waitFor();

  await action("Pasta sauce", "Labels");
  await textbox("Title").fill("Pasta sauce v2");
  await labelChip("Travel").click();
  await button("Save").click();
  await assertBadge(inline, "Travel", 3);
  await article("Pasta sauce v2").getByText("Edited just now", exact).waitFor();

  await button("List view").click();
  await page.locator(".notes__grid.list").first().waitFor();
  await fab.click();
  await textbox("Title").fill("Spare keys");
  await textbox("Note").fill("Hide a set with the neighbour.");
  await labelChip("Travel").click();
  await button("Save").click();
  await assertBadge(inline, "Travel", 4);
  await action("Spare keys", "Delete");
  await assertBadge(inline, "Travel", 3);
  await button("Undo").click();
  await assertBadge(inline, "Travel", 4);
  await article("Spare keys").waitFor();

  await category(inline, "Travel").click();
  await count(4, 12);
  for (const title of ["Pasta sauce v2", "Packing list", "Spare keys", "City walk route"]) {
    await action(title, "Labels");
    await labelChip("Travel").click();
    await button("Save").click();
    await article(title).waitFor({ state: "hidden" });
  }
  await assertBadge(inline, "Travel", 0);
  await page.getByText("No notes in Travel yet", exact).waitFor();
  await button("Create note").click();
  await textbox("Title").fill("Never saved");
  await button("Delete").click();
  await textbox("Title").waitFor({ state: "hidden" });
  await count(0, 12);

  // Shrink the app inside a wide viewport to exercise the container breakpoint.
  // An edit in progress stays open in the other surface, with what was typed.
  const app = page.locator("#app");
  await button("Create note").click();
  await textbox("Title").fill("Kept across the breakpoint");
  await app.evaluate(node => { node.style.width = "390px"; });
  await textbox("Title").waitFor();
  assert.equal(await textbox("Title").inputValue(), "Kept across the breakpoint");
  await app.evaluate(node => { node.style.removeProperty("width"); });
  await textbox("Title").waitFor();
  assert.equal(await textbox("Title").inputValue(), "Kept across the breakpoint");
  await button("Cancel").click();
  await textbox("Title").waitFor({ state: "hidden" });

  const opener = button("Open categories");
  await app.evaluate(node => { node.style.width = "390px"; });
  await opener.waitFor();
  await inline.waitFor({ state: "hidden" });
  await app.evaluate(node => { node.style.removeProperty("width"); });
  await inline.waitFor();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await opener.click();
  await modal.waitFor();
  await category(modal, "Travel").click();
  await modal.waitFor({ state: "hidden" });
  await page.locator(".notes__menu").evaluate(node => {
    if (document.activeElement === node || node.contains(document.activeElement)) return;
    throw new Error("Closing the category drawer did not return focus to the menu button");
  });
  await count(2, 11);
  await opener.click();
  await category(modal, "Travel").and(page.locator('[aria-current="page"]')).waitFor();
  await category(modal, "All notes").click();
  await modal.waitFor({ state: "hidden" });
  await search.waitFor({ state: "hidden" });
  await button("Search notes").click();
  await search.fill("pasta");
  await count(1, 11);
  await button("Go back").click();
  await button("Close search").click();
  await search.waitFor({ state: "hidden" });

  await fab.click();
  await textbox("Title").fill("Narrow note");
  await textbox("Note").fill("Written on a phone.");
  await labelChip("Travel").click();
  await button("Save").click();
  await article("Narrow note").waitFor();

  const fabHeight = (await fab.boundingBox())?.height ?? 0;
  const padding = await page.locator(".notes").evaluate(node => parseFloat(getComputedStyle(node).paddingBottom));
  assert.equal(padding, fabHeight + 24, "Mobile leaves the FAB height and margin beneath the last card");

  const barClears = async (width: number) => {
    await page.setViewportSize({ width, height: 900 });
    const bar = page.locator(".notes .mtrl-top-app-bar").first();
    const note = page.locator(".notes article").first();
    await note.waitFor();
    const barBox = await bar.boundingBox();
    const noteBox = await note.boundingBox();
    assert.ok(barBox && noteBox, `The app bar and the first note are on screen at ${width}`);
    assert.ok(barBox.y + barBox.height <= noteBox.y + 1, `The app bar overlaps the first note at ${width}`);
    const fabBox = await fab.boundingBox();
    const clearance = await page.locator(".notes").evaluate(node => parseFloat(getComputedStyle(node).paddingBottom));
    assert.equal(clearance, (fabBox?.height ?? 0) + 24, `The FAB covers the last card at ${width}`);
  };
  for (const width of [390, 820, 1440]) await barClears(width);
  await page.setViewportSize({ width: 390, height: 844 });
  await button("Open categories").waitFor();
}
