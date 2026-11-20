// What a visitor does with this example; scripts/check-examples.ts runs it in every
// framework and compares what each one shows afterwards. The assertions here pin
// the behaviour itself, so breaking one variant's rule fails this check even
// before the snapshots are compared.
import assert from "node:assert/strict";
import type { Frame, Locator, Page } from "playwright";

export async function checkFrame(frame: Frame): Promise<void> {
  await frame.getByRole("heading", { name: "Step 1 of 4 · Dates and arrival", exact: true }).waitFor();
  await frame.getByRole("button", { name: "Next", exact: true }).click();
  await frame.getByRole("heading", { name: "Step 2 of 4 · Guests and room", exact: true }).waitFor();
}

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
    // The one current header is this step's; its text is the indicator's number
    // (a check icon in place of it once completed), the label, and — once
    // completed — a ", Completed, Editable" suffix.
    const header = page.locator('[aria-current="step"]');
    assert.match((await header.textContent()) ?? "", new RegExp(`^\\d*${title}(?:, .*)?$`), `step ${n}'s header is the current step`);
    // Vertical headers expand their panel; horizontal ones are tabs and carry no aria-expanded.
    const expanded = await header.getAttribute("aria-expanded");
    assert.ok(expanded === "true" || expanded === null, `step ${n}'s header expands its panel`);
  };
  const stepIs = async (n: number, title: string) => {
    await stepShows(n, title);
    assert.ok(await isFocused(heading()), `focus moves to the step ${n} heading`);
  };

  // Orientation follows the frame: horizontal on Desktop and Tablet, vertical
  // on Mobile, and no step label is clipped on Tablet.
  const headerBox = async (title: string) => {
    const box = await page.getByRole("button", { name: new RegExp(title) }).first().boundingBox();
    assert.ok(box, `no header box for ${title}`);
    return box;
  };
  const orientationIs = async (want: "horizontal" | "vertical") => {
    const boxes = await Promise.all(["Dates and arrival", "Guests and room", "Extras", "Your details and review"].map(headerBox));
    if (want === "horizontal") assert.ok(boxes.every((b) => Math.abs(b.y - boxes[0]!.y) <= 4), `step headers are not across the top: ${JSON.stringify(boxes)}`);
    else assert.ok(boxes.every((b) => Math.abs(b.x - boxes[0]!.x) <= 4), `step headers are not down the side: ${JSON.stringify(boxes)}`);
  };
  const labelsFit = async () => {
    for (const title of ["Dates and arrival", "Guests and room", "Extras", "Your details and review"]) {
      const header = page.getByRole("button", { name: new RegExp(title) }).first();
      assert.ok(await header.evaluate((el) => el.scrollWidth <= el.clientWidth), `step label is clipped: ${title}`);
    }
  };
  // The check page is the frame itself: its viewport is the frame's width.
  await orientationIs("horizontal");
  await page.setViewportSize({ width: 820, height: 900 });
  await page.waitForTimeout(400);
  await orientationIs("horizontal");
  await labelsFit();
  await page.setViewportSize({ width: 390, height: 900 });
  await page.waitForTimeout(400);
  await orientationIs("vertical");
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(400);
  await orientationIs("horizontal");

  // Step 1: one range picker takes the stay. Picking 20th to 22nd is 2 nights;
  // a same-day range is 0 nights and Next is blocked at the field.
  await stepShows(1, "Dates and arrival");
  const stay = page.getByRole("textbox", { name: "Check-in → Check-out", ...exact });
  const pickRange = async (start: string, end: string) => {
    await page.getByRole("button", { name: /Change date/ }).click();
    await page.getByRole("gridcell", { name: start }).click();
    await page.getByRole("gridcell", { name: end }).click();
    await page.getByRole("button", { name: "OK", ...exact }).click();
  };
  await pickRange("Tuesday, April 20, 2027", "Thursday, April 22, 2027");
  assert.equal(await stay.inputValue(), "2027-04-20 - 2027-04-22");
  await includes("Check-in 2027-04-20 → Check-out 2027-04-22 · 2 nights");
  await includes("Double room · $120 × 2 nights");
  await includes("Estimated total $284 for 2 nights");
  await pickRange("Tuesday, April 20, 2027", "Tuesday, April 20, 2027");
  await includes("Check-in 2027-04-20 → Check-out 2027-04-20 · 0 nights");
  await includes("Choose at least 1 night");
  await next.click();
  await includes("Step 1 of 4");
  assert.ok(await isFocused(stay), "an invalid range focuses the stay field");
  await pickRange("Tuesday, April 20, 2027", "Thursday, April 22, 2027");
  await includes("Estimated total $284 for 2 nights");

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

  // The rooms are selectable cards in a radio group. The arrows move the choice,
  // Home and End jump to the ends, and Space selects the focused card; a click
  // chooses too. The summary panel follows every move.
  const checkedRoom = (name: string) => includes(`radio "${name}" [checked]`);
  await checkedRoom("Double room, 1 king bed, 24 m², $120 a night, Sea view · Balcony");
  const doubleCard = page.locator('[data-room="double"]');
  const focusedRoomIs = (value: string) =>
    page.waitForFunction((v) => (document.activeElement as HTMLElement | null)?.dataset?.room === v, value);
  await doubleCard.focus();
  await page.keyboard.press("ArrowRight");
  await focusedRoomIs("family");
  await checkedRoom("Family room, King + 2 single beds, 32 m², $155 a night, Sea view · Kitchenette");
  await includes("Estimated total $361 for 2 nights");
  await page.keyboard.press("ArrowLeft");
  await focusedRoomIs("double");
  await checkedRoom("Double room, 1 king bed, 24 m², $120 a night, Sea view · Balcony");
  await page.keyboard.press("Home");
  await focusedRoomIs("standard");
  await checkedRoom("Standard room, 1 queen bed, 19 m², $95 a night, Garden view · Rain shower");
  await includes("Estimated total $229 for 2 nights");
  await page.keyboard.press("Space");
  await checkedRoom("Standard room, 1 queen bed, 19 m², $95 a night, Garden view · Rain shower");
  await page.keyboard.press("End");
  await focusedRoomIs("suite");
  await checkedRoom("Suite, 1 king bed, 41 m², $210 a night, Private terrace · Soaking tub");
  await page.locator('[data-room="suite"]').click();
  await checkedRoom("Suite, 1 king bed, 41 m², $210 a night, Private terrace · Soaking tub");
  await includes("Estimated total $482 for 2 nights");
  await next.click();
  await stepIs(3, "Extras");
  // The Suite the second step chose carries onto the third.
  await includes("Estimated total $482 for 2 nights");

  // Every extra in the named group, and the total follows onto the third step.
  assert.equal(await page.getByRole("group", { name: "Extras", ...exact }).getByRole("checkbox").count(), 3);
  for (const extra of ["Breakfast", "Parking", "Late checkout"]) {
    await page.getByRole("checkbox", { name: new RegExp(extra) }).click();
  }
  await includes("Extras");
  await includes("Estimated total $576 for 2 nights");
  await next.click();
  await stepIs(4, "Your details and review");
  await includes("Estimated total $576 for 2 nights");

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
  const summaryText = "Suite, 2 nights · Check-in 2027-04-20, check-out 2027-04-22 · Arrival 17:30 · 3 adults, 1 child · Breakfast, Parking, Late checkout · Estimated total $576 for 2 nights";
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
  await includes("Estimated total $576 for 2 nights");
}
