// What a visitor does with this example; scripts/check-examples.ts runs it in every
// framework and compares what each one shows afterwards.
//
// Locators stay with roles and names, as Settings' check does. Three of them lean on
// DOM order, which is the same in every variant: the label filter sits above the
// cards, and the editor's chips come after them, so the first "Work" gridcell is the
// filter's and the last "Travel" one is the editor's. The editor's fields are the
// only textboxes on the page, so they need no scoping.
import type { Frame, Page } from "playwright";

export async function checkFrame(frame: Frame): Promise<void> {
  await frame.getByRole("combobox", { name: "Search notes" }).fill("Pasta sauce");
  await frame.getByRole("status").filter({ hasText: /^Showing 1 of / }).waitFor();
  await frame.getByRole("button", { name: "Open Pasta sauce", exact: true }).waitFor();
}

export default async function steps(page: Page): Promise<void> {
  const exact = { exact: true } as const;
  // A closed snackbar fades to opacity 0 but keeps its box (the component's own
  // display rule beats the closed-popover one), so Playwright's visibility never
  // turns — wait for the toast to settle instead. The element keeps its toast in
  // a shadow root; the factory's toast is the root itself.
  const snackbarSettled = () =>
    page.waitForFunction(() => {
      const hosts = [...document.querySelectorAll("m-snackbar, .mtrl-snackbar")];
      return hosts.every((host) => {
        const root = host.shadowRoot ?? host;
        const toast = root.querySelector("[popover]") ?? host;
        return Number.parseFloat(getComputedStyle(toast).opacity) < 0.1;
      });
    });

  // The New note FAB is the extended one in every variant: its label is visible,
  // not only an accessible name (the Vue and Svelte adapters once drew it
  // icon-only, and the aria snapshots could not see the difference — a rendered
  // label is about twice an icon-only FAB's 56px). Its text sits in the host, so
  // neither textContent nor innerText reaches it through the role query; the box
  // is the honest measure.
  const fab = page.getByRole("button", { name: "New note", ...exact });
  if (((await fab.boundingBox())?.width ?? 0) < 100) throw new Error("The New note FAB lost its visible label");

  // Filter by Work from the row above the grid, then clear it.
  await page.getByRole("gridcell", { name: "Work", ...exact }).first().click();
  await page.getByRole("gridcell", { name: "Work", ...exact }).first().click();

  // A card's own chips filter too: isolate the Packing list card with the search,
  // click its Shopping chip (with only the filter row besides it, the card's is
  // the last "Shopping"), then clear both.
  await page.getByRole("combobox", { name: "Search notes" }).fill("packing");
  await page.getByRole("gridcell", { name: "Shopping", ...exact }).last().click();
  await page.getByRole("gridcell", { name: "Shopping", ...exact }).last().click();
  await page.getByRole("combobox", { name: "Search notes" }).fill("");

  // Search narrows the grid: a hit, a pinned-only hit (no empty message while a
  // pinned note shows), nothing at all, and back.
  await page.getByRole("combobox", { name: "Search notes" }).fill("pasta");
  await page.getByRole("combobox", { name: "Search notes" }).fill("meeting");
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

  // Delete a note from the editor. The snackbar dismisses itself on its timer;
  // the pointer moves away first, because a hover or focus inside it pauses that
  // timer. The toast is waited OPEN before it is waited out: a re-show can land
  // a tick after the click (the Undo click before it closed the previous toast),
  // and settling alone would pass on that dying toast.
  await page.getByRole("button", { name: "Open Story prompts", ...exact }).click();
  await page.getByRole("button", { name: "Delete", ...exact }).click();
  await page.mouse.move(8, 8);
  await page.waitForFunction(() =>
    [...document.querySelectorAll("m-snackbar, .mtrl-snackbar")].some((host) => {
      const root = host.shadowRoot ?? host;
      const toast = root.querySelector("[popover]") ?? host;
      return Number.parseFloat(getComputedStyle(toast).opacity) >= 0.9;
    }),
  );
  await snackbarSettled();

  // Delete in the editor of a note that was never saved discards the draft: the
  // editor closes, no snackbar opens for it, and the grid loses nothing. The
  // toast is checked the moment the editor closes — a deletion that was forged
  // here would have it at full opacity for its whole timer, and a check made
  // after a fade would let that bug through.
  const shown = page.getByRole("status").filter({ hasText: "Showing" });
  await page.getByRole("button", { name: "New note", ...exact }).click();
  await page.getByRole("textbox", { name: "Title", ...exact }).fill("Never saved");
  const shownBefore = await shown.textContent();
  await page.getByRole("button", { name: "Delete", ...exact }).click();
  await page.getByRole("textbox", { name: "Title", ...exact }).waitFor({ state: "hidden" });
  const toastOpen = await page.evaluate(() =>
    [...document.querySelectorAll("m-snackbar, .mtrl-snackbar")].some((host) => {
      const root = host.shadowRoot ?? host;
      const toast = root.querySelector("[popover]") ?? host;
      return Number.parseFloat(getComputedStyle(toast).opacity) >= 0.1;
    }),
  );
  if (toastOpen) throw new Error("Delete of a never-saved note opened the deletion snackbar");
  if ((await shown.textContent()) !== shownBefore) throw new Error("Delete of a never-saved note changed the note count");
  if ((await page.getByRole("article", { name: "Never saved", ...exact }).count()) !== 0) throw new Error("A never-saved note reached the grid");

  // On a narrow frame the editor is the bottom sheet: reload narrow (the variant
  // picks its container when it loads), create a note there, and save it.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.waitForFunction(() => (document.getElementById("app")?.childElementCount ?? 0) > 0);
  await page.getByRole("button", { name: "New note", ...exact }).click();
  await page.getByRole("textbox", { name: "Title", ...exact }).fill("Narrow note");
  await page.getByRole("textbox", { name: "Note", ...exact }).fill("Written on a phone.");
  await page.getByRole("gridcell", { name: "Travel", ...exact }).last().click();
  await page.getByRole("button", { name: "Save", ...exact }).click();
  await page.getByRole("button", { name: "Delete Narrow note", ...exact }).waitFor();
}
