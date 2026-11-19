// What a visitor does with this example; scripts/check-examples.ts runs it in every
// framework and compares what each one shows afterwards. The assertions here pin
// the behaviour itself, so breaking one variant's rule fails this check even
// before the snapshots are compared.
import assert from "node:assert/strict";
import type { Locator, Page } from "playwright";

export default async function steps(page: Page): Promise<void> {
  const exact = { exact: true } as const;
  const snap = () => page.locator("#app").ariaSnapshot();
  const includes = async (text: string) => assert.ok((await snap()).includes(text), `snapshot includes: ${text}`);
  const excludes = async (text: string) => assert.ok(!(await snap()).includes(text), `snapshot excludes: ${text}`);
  const isFocused = (locator: Locator) =>
    locator.evaluate((el) => (el.getRootNode() as ShadowRoot).activeElement === el || document.activeElement === el);
  const next = page.getByRole("button", { name: "Next", ...exact });
  const back = page.getByRole("button", { name: "Back", ...exact });
  const book = page.getByRole("button", { name: "Book", ...exact });
  const arrival = page.getByRole("textbox", { name: "Arrival time", ...exact });
  const chooseTime = page.getByRole("button", { name: "Choose time", ...exact });
  const heading = () => page.getByRole("heading", { name: /^Step \d of 4/ });
  // A step change puts focus on the new step's heading. The stepper's own header
  // for the step is the current one: its button carries aria-current and expands
  // the panel that is showing.
  const stepShows = async (n: number, title: string) => {
    await page.getByRole("heading", { name: `Step ${n} of 4 · ${title}`, ...exact }).waitFor();
    await includes(`Step ${n} of 4`);
    // The one current header is this step's; its text is the indicator's number,
    // the label, and — once completed — a ", Completed, Editable" suffix.
    const header = page.locator('[aria-current="step"]');
    assert.match((await header.textContent()) ?? "", new RegExp(`^\\d+${title}(,.*)?$`), `step ${n}'s header is the current step`);
    assert.equal(await header.getAttribute("aria-expanded"), "true", `step ${n}'s header expands its panel`);
  };
  const stepIs = async (n: number, title: string) => {
    await stepShows(n, title);
    assert.ok(await isFocused(heading()), `focus moves to the step ${n} heading`);
  };

  // Step 1: dates. Check-in moving past check-out pulls check-out with it.
  await stepShows(1, "Dates and arrival");
  await page.getByRole("button", { name: "Change date, 2027-04-10", ...exact }).click();
  await page.getByRole("gridcell", { name: "Tuesday, April 20, 2027" }).click();
  assert.equal(await page.getByRole("textbox", { name: "Check-out", ...exact }).inputValue(), "2027-04-20");
  await includes("Estimated total $120 for 1 night");
  await page.getByRole("textbox", { name: "Check-out", ...exact }).click();
  await page.getByRole("gridcell", { name: "Thursday, April 22, 2027" }).click();
  await includes("Estimated total $240 for 2 nights");

  // Step 1: the time picker writes back, a typed time is where it reopens, Cancel keeps it.
  await chooseTime.click();
  await page.getByRole("button", { name: "Toggle input picker", ...exact }).click();
  await page.getByRole("spinbutton", { name: "Hour", ...exact }).fill("17");
  await page.getByRole("spinbutton", { name: "Minute", ...exact }).fill("30");
  await page.getByRole("button", { name: "OK", ...exact }).click();
  assert.equal(await arrival.inputValue(), "17:30");
  await arrival.fill("18:25");
  await chooseTime.click();
  assert.equal(await page.getByRole("spinbutton", { name: "Hour", ...exact }).inputValue(), "18");
  assert.equal(await page.getByRole("spinbutton", { name: "Minute", ...exact }).inputValue(), "25");
  await page.getByRole("button", { name: "Cancel", ...exact }).click();
  assert.equal(await arrival.inputValue(), "18:25");

  // Next is blocked by an invalid step: the message shows, focus moves to the field,
  // and the step does not change.
  await arrival.fill("not a time");
  await next.click();
  await page.getByText("Enter a valid time", exact).waitFor();
  assert.ok(await isFocused(arrival), "an invalid step focuses its first field");
  await includes("Step 1 of 4");
  await arrival.fill("17:30");
  await next.click();
  await stepIs(2, "Guests and room");

  // Back keeps the data and never validates.
  await back.click();
  await stepIs(1, "Dates and arrival");
  assert.equal(await arrival.inputValue(), "17:30", "Back lost the arrival time");
  await next.click();
  await stepIs(2, "Guests and room");

  // Guests: both selects move.
  const choose = async (name: string, moves: number) => {
    const select = page.getByRole("combobox", { name, ...exact });
    await select.focus();
    await page.keyboard.press("ArrowDown");
    for (let i = 0; i < moves; i++) await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
  };
  await choose("Adults", 1);
  await choose("Children", 1);
  await includes('combobox "Adults": "3"');
  await includes('combobox "Children": "1"');

  // The price range decides which rooms can be chosen; an empty range blocks Next
  // with focus on the range and its message at the field, and restoring it
  // unlocks the step.
  const minHandle = page.getByRole("slider", { name: "Price range minimum", ...exact });
  const maxHandle = page.getByRole("slider", { name: "Price range maximum", ...exact });
  const roomError = page.locator(".booking__field-error");
  await minHandle.focus();
  await page.keyboard.press("ArrowRight");
  await includes("$90–$240 a night");
  await maxHandle.focus();
  await page.keyboard.press("Home");
  await includes("No rooms in this price range");
  await next.click();
  await includes("Step 2 of 4");
  assert.ok(await isFocused(minHandle), "an empty price range focuses the range");
  await roomError.waitFor();
  assert.equal((await roomError.textContent())?.trim(), "No rooms in this price range", "the empty range shows its message at the field");
  await maxHandle.focus();
  await page.keyboard.press("End");
  await roomError.waitFor({ state: "hidden" });
  await includes("$90–$300 a night");
  // The live region leaves the accessibility tree for a beat while it announces;
  // read the total itself rather than the snapshot here.
  await page.getByText("Estimated total $190 for 2 nights", exact).waitFor();

  // Every room, then the chosen one; Next moves on with the total in step.
  for (const room of ["Standard room", "Double room", "Family room", "Suite"]) {
    await page.locator("label", { hasText: room }).click();
  }
  await includes('radio "Suite — $210 a night" [checked]');
  await next.click();
  await stepIs(3, "Extras");
  // The Suite the second step chose carries onto the third.
  await page.getByText("Estimated total $420 for 2 nights", exact).waitFor();

  // Every extra in the named group, and the total follows onto the third step.
  assert.equal(await page.getByRole("group", { name: "Extras", ...exact }).getByRole("checkbox").count(), 3);
  for (const extra of ["Breakfast", "Parking", "Late checkout"]) {
    await page.getByRole("checkbox", { name: new RegExp(extra) }).click();
  }
  await includes("Estimated total $505 for 2 nights");
  await next.click();
  await stepIs(4, "Your details and review");
  await includes("Estimated total $505 for 2 nights");

  // The review shows the first three steps, each row labelled with its Edit;
  // Edit jumps back to its step.
  await includes("Check-in 2027-04-20, check-out 2027-04-22 · Arrival 17:30");
  for (const label of ["Dates", "Guests and room", "Extras"]) {
    await includes(label);
    await page.getByRole("button", { name: `Edit ${label}`, ...exact }).waitFor();
  }
  await page.getByRole("button", { name: "Edit Guests and room", ...exact }).click();
  await stepIs(2, "Guests and room");
  await next.click();
  await stepIs(3, "Extras");
  await next.click();
  await stepIs(4, "Your details and review");

  // Book is blocked by invalid details: the message shows under the first field,
  // and focus follows it.
  await book.click();
  await page.getByText("Enter your name", exact).waitFor();
  await page.getByText("Enter a valid email address", exact).waitFor();
  assert.ok(await isFocused(page.getByRole("textbox", { name: "Name", ...exact })), "Book focuses the name field");
  await page.getByRole("textbox", { name: "Name", ...exact }).fill("Ada Lovelace");
  await book.click();
  assert.ok(await isFocused(page.getByRole("textbox", { name: "Email", ...exact })), "Book focuses the email field");
  await page.getByRole("textbox", { name: "Email", ...exact }).fill("ada@example.com");

  // Cancel leaves no snackbar; Book again and Confirm shows it, with the dialog gone first.
  await book.click();
  const dialog = page.getByRole("alertdialog", { name: "Confirm booking", ...exact });
  await dialog.waitFor();
  const summaryText = "Suite, 2 nights · Check-in 2027-04-20, check-out 2027-04-22 · Arrival 17:30 · 3 adults, 1 child · Breakfast, Parking, Late checkout · Estimated total $505 for 2 nights";
  await includes(summaryText);
  // The dialog's accessible description is that summary, in every variant.
  const description = await dialog.evaluate((el) => {
    const id = el.getAttribute("aria-describedby");
    if (!id) return "";
    const target = (el.getRootNode() as Document | ShadowRoot).querySelector(`#${CSS.escape(id)}`);
    if (!target) return "";
    const text = target.textContent?.trim() ?? "";
    if (text) return text;
    return [...target.querySelectorAll("slot")].flatMap((slot) => slot.assignedNodes()).map((node) => node.textContent ?? "").join("").trim();
  });
  assert.equal(description, summaryText, "dialog description is the summary");
  assert.ok(await isFocused(page.getByRole("button", { name: "Cancel", ...exact })), "focus enters the dialog");
  await page.getByRole("button", { name: "Cancel", ...exact }).click();
  await dialog.waitFor({ state: "hidden" });
  assert.ok(await isFocused(book), "focus returns to Book");
  await excludes("Booking confirmed");
  await book.click();
  await page.getByRole("button", { name: "Confirm booking", ...exact }).click();
  await dialog.waitFor({ state: "hidden" });
  await page.getByText("Booking confirmed", exact).waitFor();
  await includes("Estimated total $505 for 2 nights");
}
