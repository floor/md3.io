// What a visitor does with this example; scripts/check-examples.ts runs it in every
// framework and compares what each one shows afterwards. Every step asserts its
// outcome — counts, badges, fields, focus, layout — so a behavior that drifts fails
// here even when the final snapshot would hide it.
import assert from "node:assert/strict";
import type { Page } from "playwright";

const exact = { exact: true } as const;
const rows = (page: Page) => page.locator(".mail-row");
// Focus sits on the element host (Web Components and the adapters) or on the
// factory’s inner control (Vanilla) — either way, inside the part.
const focusWithin = (page: Page, selector: string): Promise<boolean> =>
  page.evaluate((sel) => Boolean((document.activeElement as HTMLElement | null)?.closest(sel)), selector);

export default async function steps(page: Page): Promise<void> {
  // The badges: unread in the Inbox, totals for Starred and Drafts.
  await page.getByRole("button", { name: "Inbox, 3 unread" }).waitFor();
  await page.getByRole("button", { name: "Starred, 3 starred" }).waitFor();
  await page.getByRole("button", { name: "Drafts, 2 drafts" }).waitFor();
  assert.equal(await rows(page).count(), 9, "the Inbox starts with nine messages");

  // The rail marks the current folder with aria-current.
  const currentFolder = (label: string) =>
    page.waitForFunction((l) => document.querySelector("button[aria-current='page']")?.getAttribute("aria-label")?.startsWith(l), label);

  // Starred gathers the stars; Inbox brings the full list back.
  await page.getByRole("button", { name: "Starred" }).click();
  assert.equal(await rows(page).count(), 3, "Starred shows the three starred messages");
  await currentFolder("Starred");
  await page.getByRole("button", { name: "Inbox" }).click();
  assert.equal(await rows(page).count(), 9);
  await currentFolder("Inbox");

  // Drafts offers no Archive: nothing there is an unarchived inbox message.
  await page.getByRole("button", { name: "Drafts" }).click();
  await page.getByRole("checkbox", { name: "Select Ideas for the offsite", ...exact }).click();
  await page.getByText("1 selected", exact).waitFor();
  assert.equal(await page.getByRole("button", { name: "Archive", ...exact }).count(), 0, "no Archive in Drafts");
  await page.getByRole("button", { name: "Clear selection", ...exact }).click();
  assert.equal(await page.getByText(/^\d+ selected$/).count(), 0, "the clear empties the selection");
  await page.getByRole("button", { name: "Inbox" }).click();
  assert.equal(await rows(page).count(), 9);

  // The label chips filter, and a second click clears the filter.
  await page.getByRole("gridcell", { name: "Work", ...exact }).click();
  assert.equal(await rows(page).count(), 3, "Work holds three messages");
  await page.getByRole("gridcell", { name: "Personal", ...exact }).click();
  assert.equal(await rows(page).count(), 4, "Personal holds four");
  await page.getByRole("gridcell", { name: "Personal", ...exact }).click();
  assert.equal(await rows(page).count(), 9, "the second click clears the filter");

  // The search filters by sender, subject and snippet; the clear button empties it.
  const search = page.getByRole("combobox", { name: "Search mail", ...exact });
  await search.click();
  await search.pressSequentially("budget", { delay: 20 });
  assert.equal(await rows(page).count(), 1, "only the budget message matches");
  await page.getByRole("button", { name: "Clear search", ...exact }).click();
  assert.equal(await rows(page).count(), 9);

  // Space on a row checkbox toggles it and keeps focus on it.
  await page.getByRole("checkbox", { name: "Select Flight itinerary to Lisbon", ...exact }).press(" ");
  assert.ok(await focusWithin(page, ".mail-row__check"), "Space on the checkbox keeps focus on it");
  await page.getByRole("checkbox", { name: "Select Lunch on Friday?", ...exact }).click();
  await page.getByText("2 selected", exact).waitFor();

  // Archive keeps the message: it leaves the Inbox, not the mailbox. Enter activates
  // the button, and emptying the selection bar moves focus to the list.
  await page.getByRole("button", { name: "Archive", ...exact }).press("Enter");
  assert.ok(await focusWithin(page, ".mail__rows"), "emptying the selection bar moves focus to the list");
  assert.equal(await page.getByText(/^\d+ selected$/).count(), 0, "the selection bar empties");
  await page.getByRole("button", { name: "Inbox, 2 unread" }).waitFor();
  assert.equal(await rows(page).count(), 7, "the archived rows leave the Inbox");
  await page.getByRole("button", { name: "Starred" }).click();
  await page.getByRole("button", { name: "Starred, 3 starred" }).waitFor();
  await page.getByRole("button", { name: /Flight itinerary to Lisbon/ }).waitFor();

  // The selection only holds visible rows: unstarring in Starred prunes it.
  await page.getByRole("checkbox", { name: "Select Conference talk slides", ...exact }).click();
  await page.getByText("1 selected", exact).waitFor();
  await page.getByRole("listitem").filter({ hasText: "Conference talk slides" })
    .getByRole("button", { name: "Star", ...exact }).press(" ");
  assert.equal(await rows(page).count(), 2, "the unstarred row leaves Starred");
  assert.equal(await page.getByText(/^\d+ selected$/).count(), 0, "and leaves the selection");
  assert.ok(await focusWithin(page, ".mail-row__open"), "removing the focused row moves focus to the next row");
  await page.getByRole("button", { name: "Inbox" }).click();

  // Space on a star keeps focus on the star.
  await page.getByRole("listitem").filter({ hasText: "New mockups for the kiosk app" })
    .getByRole("button", { name: "Star", ...exact }).press(" ");
  assert.ok(await focusWithin(page, ".mail-row__star"), "Space on the star keeps focus on it");

  // Opening a message moves focus to its heading in the reading pane.
  await page.getByRole("button", { name: /Quarterly budget review/ }).click();
  await page.getByRole("button", { name: "Inbox, 1 unread" }).waitFor();
  assert.ok(await focusWithin(page, ".mail-message__subject"), "opening moves focus to the heading");

  // Reply pre-fills To and Subject; Cancel clears the draft, so Compose starts blank.
  await page.getByRole("button", { name: "Reply", ...exact }).click();
  assert.equal(await page.getByRole("textbox", { name: "To", ...exact }).inputValue(), "Lena Fischer");
  assert.equal(await page.getByRole("textbox", { name: "Subject", ...exact }).inputValue(), "Re: Quarterly budget review");
  await page.getByRole("button", { name: "Cancel", ...exact }).click();
  await page.getByRole("alertdialog", { name: "New message" }).waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Compose", ...exact }).click();
  assert.equal(await page.getByRole("textbox", { name: "To", ...exact }).inputValue(), "", "Cancel cleared the draft");
  await page.getByRole("button", { name: "Cancel", ...exact }).click();
  await page.getByRole("alertdialog", { name: "New message" }).waitFor({ state: "hidden" });

  // The Showcase Tablet preset (820px) shows both panes; there is no Back there.
  await page.setViewportSize({ width: 820, height: 1180 });
  assert.ok(await page.locator(".mail__list-pane").isVisible(), "the list shows at 820px");
  assert.ok(await page.locator(".mail__detail-pane").isVisible(), "the reading pane shows at 820px");
  assert.ok(!(await page.getByRole("button", { name: "Back to list", ...exact }).isVisible()), "no Back on two panes");

  // On the phone the message takes the pane, its actions fit inside it, and Back
  // returns focus to the row the message was opened from.
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(!(await page.locator(".mail__list-pane").isVisible()), "the list hides while reading");
  // The actions sit inside the mailbox, and their centres are really tappable.
  const mailBox = await page.locator(".mail").boundingBox();
  assert.ok(mailBox, "the mailbox has a box");
  for (const name of ["Reply", "Archive", "Delete"]) {
    const action = page.getByRole("button", { name, ...exact });
    const box = await action.boundingBox();
    assert.ok(box, `${name} has a box`);
    assert.ok(
      box.x >= mailBox.x && box.y >= mailBox.y && box.x + box.width <= mailBox.x + mailBox.width && box.y + box.height <= mailBox.y + mailBox.height,
      `${name} fits inside the mailbox`,
    );
    const reachable = await action.evaluate((el, point) => {
      const root = el.getRootNode();
      const host = root instanceof ShadowRoot ? root.host : el;
      const hit = document.elementFromPoint(point.x, point.y);
      return Boolean(hit && host.contains(hit));
    }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
    assert.ok(reachable, `${name} is hit-testable at its centre`);
  }
  await page.getByRole("button", { name: "Back to list", ...exact }).click();
  assert.ok(await focusWithin(page, ".mail-row__open"), "Back returns focus to the row");

  // Delete is permanent — from the reading pane and from the selection bar.
  // (At phone width the placeholder sits in the hidden detail pane, so attach is enough.)
  await page.getByRole("button", { name: /Weekend farmers market/ }).click();
  await page.getByRole("button", { name: "Delete", ...exact }).click();
  await page.getByText("Select a message to read.", exact).waitFor({ state: "attached" });
  assert.ok(await focusWithin(page, ".mail__rows"), "focus lands on the list");
  assert.equal(await page.getByRole("button", { name: /Weekend farmers market/ }).count(), 0, "deleted from the mailbox");
  await page.getByRole("checkbox", { name: "Select Hostel booking confirmed", ...exact }).click();
  await page.getByRole("button", { name: "Delete", ...exact }).click();
  assert.equal(await rows(page).count(), 5, "the selection delete removes the row");

  // Archive from the reading pane: the message leaves the Inbox, the pane clears,
  // and focus lands on the list.
  await page.getByRole("button", { name: /Quarterly budget review/ }).click();
  await page.getByRole("button", { name: "Archive", ...exact }).click();
  await page.getByText("Select a message to read.", exact).waitFor({ state: "attached" });
  assert.ok(await focusWithin(page, ".mail__rows"), "archiving the open message moves focus to the list");
  assert.equal(await rows(page).count(), 4, "the archived message leaves the Inbox");
  assert.equal(await page.getByRole("button", { name: /Quarterly budget review/ }).count(), 0, "and the row is gone");

  // Compose, send, and the recipient is kept and shown in Sent.
  await page.getByRole("button", { name: "Compose", ...exact }).click();
  await page.getByRole("textbox", { name: "To", ...exact }).fill("robin@recipient.example");
  await page.getByRole("textbox", { name: "Subject", ...exact }).fill("Weekend plan");
  await page.getByRole("textbox", { name: "Message", ...exact }).fill("Let's go hiking on Saturday.");
  await page.getByRole("button", { name: "Send", ...exact }).click();
  await page.getByText("Message sent", exact).waitFor();
  // The dialog closes with an animation; wait for it to leave the tree before the snapshot.
  await page.getByRole("alertdialog", { name: "New message" }).waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Sent" }).click();
  await page.getByRole("button", { name: /Weekend plan/ }).click();
  await page.getByText("To robin@recipient.example", exact).waitFor();

  await page.setViewportSize({ width: 1280, height: 720 });
}
