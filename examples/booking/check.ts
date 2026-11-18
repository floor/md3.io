// What a visitor does with this example; scripts/check-examples.ts runs it in every
// framework and compares what each one shows afterwards. The assertions here pin
// the behaviour itself, so breaking one variant's rule fails this check even
// before the snapshots are compared.
import assert from "node:assert/strict";
import type { Page } from "playwright";

export default async function steps(page: Page): Promise<void> {
  const exact = { exact: true } as const;
  const snap = () => page.locator("#app").ariaSnapshot();
  const includes = async (text: string) => assert.ok((await snap()).includes(text), `snapshot includes: ${text}`);
  const excludes = async (text: string) => assert.ok(!(await snap()).includes(text), `snapshot excludes: ${text}`);
  const book = page.getByRole("button", { name: "Book", ...exact });
  const arrival = page.getByRole("textbox", { name: "Arrival time", ...exact });
  const chooseTime = page.getByRole("button", { name: "Choose time", ...exact });

  // Validation: an empty form shows its messages and opens nothing.
  await book.click();
  await page.getByText("Enter your name", exact).waitFor();
  await page.getByText("Enter a valid email address", exact).waitFor();
  await excludes("alertdialog");
  await page.getByRole("textbox", { name: "Name", ...exact }).fill("Ada Lovelace");
  await page.getByRole("textbox", { name: "Email", ...exact }).fill("ada@example.com");

  // Dates: check-in moving past check-out pulls check-out with it, then check-out extends the stay.
  await page.getByRole("button", { name: "Change date, 2027-04-10", ...exact }).click();
  await page.getByRole("gridcell", { name: "Tuesday, April 20, 2027" }).click();
  assert.equal(await page.getByRole("textbox", { name: "Check-out", ...exact }).inputValue(), "2027-04-20");
  await includes("Estimated total $120 for 1 night");
  await page.getByRole("textbox", { name: "Check-out", ...exact }).click();
  await page.getByRole("gridcell", { name: "Thursday, April 22, 2027" }).click();
  assert.equal(await page.getByRole("textbox", { name: "Check-out", ...exact }).inputValue(), "2027-04-22");
  await includes("Estimated total $240 for 2 nights");

  // Time: the picker writes back, a typed time is where it reopens, Cancel keeps it.
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
  await chooseTime.click();
  await page.getByRole("button", { name: "OK", ...exact }).click();
  assert.equal(await arrival.inputValue(), "18:25");

  // An invalid time is rejected at Book and shown under the field; a valid one restores it.
  await arrival.fill("not a time");
  await book.click();
  await page.getByText("Enter a valid time", exact).waitFor();
  await excludes("alertdialog");
  await arrival.fill("17:30");

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

  // The price range decides which rooms can be chosen.
  const minHandle = page.getByRole("slider", { name: "Price range minimum", ...exact });
  const maxHandle = page.getByRole("slider", { name: "Price range maximum", ...exact });
  await minHandle.focus();
  await page.keyboard.press("ArrowRight");
  await includes("$90–$240 a night");
  await maxHandle.focus();
  await page.keyboard.press("Home");
  await includes("No rooms in this price range");
  await includes('radio "Suite — $210 a night" [disabled]');
  await book.click();
  await excludes("alertdialog");
  await maxHandle.focus();
  await page.keyboard.press("End");
  await includes("$90–$300 a night");
  await includes("Estimated total $190 for 2 nights");

  // Every room and every extra, in the named Extras group.
  assert.equal(await page.getByRole("group", { name: "Extras", ...exact }).getByRole("checkbox").count(), 3);
  for (const room of ["Standard room", "Double room", "Family room", "Suite"]) {
    await page.locator("label", { hasText: room }).click();
  }
  await includes('radio "Suite — $210 a night" [checked]');
  for (const extra of ["Breakfast", "Parking", "Late checkout"]) {
    await page.getByRole("checkbox", { name: new RegExp(extra) }).click();
  }
  await includes("Estimated total $505 for 2 nights");

  // Cancel leaves no snackbar; Book again and Confirm shows it, with the dialog gone first.
  await book.click();
  const dialog = page.getByRole("alertdialog", { name: "Confirm booking", ...exact });
  await dialog.waitFor();
  await includes("Suite, 2 nights · Check-in 2027-04-20, check-out 2027-04-22 · Arrival 17:30 · 3 adults, 1 child · Breakfast, Parking, Late checkout · Estimated total $505 for 2 nights");
  await page.getByRole("button", { name: "Cancel", ...exact }).click();
  await dialog.waitFor({ state: "hidden" });
  await excludes("Booking confirmed");
  await book.click();
  await page.getByRole("button", { name: "Confirm booking", ...exact }).click();
  await dialog.waitFor({ state: "hidden" });
  await page.getByText("Booking confirmed", exact).waitFor();
  await includes("Estimated total $505 for 2 nights");
}
