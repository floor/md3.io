// What the Settings app must do, once, in a browser: the steps
// scripts/check-examples.ts runs per variant. Written for the Vanilla reference — the
// other five variants still run the previous small screen, so this check cannot pass on
// them until their ports exist (see the design note, section 6).
//
// The 10-second snackbar timeout is not waited out here; the Undo path is asserted
// instead, and the timeout itself belongs to the component's own behaviour.
import assert from "node:assert/strict";
import type { Page } from "playwright";

export default async (page: Page): Promise<void> => {
  const viewport = page.viewportSize();
  const row = (name: RegExp) => page.getByRole("button", { name }).first();

  // 1. Wide: the first category is open beside the list, its row selected.
  await page.setViewportSize({ width: 1280, height: 800 });
  assert.equal(await row(/Network & internet/).getAttribute("aria-pressed"), "true", "Network & internet is selected on load");
  await page.getByRole("heading", { level: 2, name: "Network & internet" }).waitFor();
  assert.equal(await page.getByRole("switch", { name: "Wi-Fi" }).isChecked(), true, "Wi-Fi starts on");
  assert.equal(await page.getByRole("switch", { name: "Mobile data" }).isChecked(), true, "Mobile data starts on");

  // 2. A row opens its detail, one selection at a time.
  await row(/Display/).click();
  await page.getByRole("heading", { level: 2, name: "Display" }).waitFor();
  assert.equal(await row(/Network & internet/).getAttribute("aria-pressed"), "false", "the row that was open is no longer selected");
  assert.equal(await page.getByRole("heading", { level: 2, name: "Network & internet" }).isVisible(), false, "the previous detail is gone");
  const brightness = page.getByRole("slider", { name: "Brightness" });
  assert.equal(await brightness.getAttribute("aria-valuenow"), "60", "Brightness starts at its default");

  // The slider takes the keyboard and applies at once — no button to press.
  await brightness.focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await brightness.getAttribute("aria-valuenow"), "61", "ArrowRight moves Brightness by one step");

  // 3. On a phone the detail replaces the list; Back returns to it, focused.
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await row(/Display/).isVisible(), false, "on a phone the list gives way to the detail");
  await page.getByRole("button", { name: "Back" }).click();
  assert.equal(await row(/Display/).isVisible(), true, "Back returns to the list");
  assert.equal(await row(/Display/).evaluate((el) => el === document.activeElement), true, "focus lands on the row it came from");

  await page.setViewportSize({ width: 1280, height: 800 });

  // 4. Airplane mode reaches into Wi-Fi and Bluetooth, and only those.
  await row(/Network & internet/).click();
  assert.equal(await row(/Network & internet/).getAttribute("aria-pressed"), "true", "clicking the open row changes nothing");
  const wifi = page.getByRole("switch", { name: "Wi-Fi" });
  const bluetooth = page.getByRole("switch", { name: "Bluetooth" });
  const mobileData = page.getByRole("switch", { name: "Mobile data" });
  const airplane = page.getByRole("switch", { name: "Airplane mode" });
  await airplane.click();
  assert.equal(await wifi.isChecked(), false, "airplane mode turns Wi-Fi off");
  assert.equal(await wifi.isDisabled(), true, "and disables it while it is on");
  assert.equal(await bluetooth.isChecked(), false, "and Bluetooth off");
  assert.equal(await bluetooth.isDisabled(), true, "and disables that too");
  assert.equal(await mobileData.isEnabled(), true, "Mobile data is left alone");
  await airplane.click();
  assert.equal(await wifi.isEnabled(), true, "turning airplane mode off enables Wi-Fi again");
  assert.equal(await wifi.isChecked(), false, "it stays off");

  // 5. Reset asks first, then resets, then offers the undo.
  await row(/Display/).click();
  const darkTheme = page.getByRole("switch", { name: "Dark theme" });
  await darkTheme.click();
  assert.equal(await darkTheme.isChecked(), true, "Dark theme is on before the reset");

  const dialog = page.getByRole("alertdialog", { name: "Reset all settings?" });
  await page.getByRole("button", { name: "Reset all settings" }).click();
  await dialog.waitFor();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  assert.equal(await darkTheme.isChecked(), true, "Cancel changes nothing");

  await page.getByRole("button", { name: "Reset all settings" }).click();
  await dialog.waitFor();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  const snackbar = page.getByText("Settings reset");
  await snackbar.waitFor();
  assert.equal(await darkTheme.isChecked(), false, "Reset puts Dark theme back to its default");
  assert.equal(await brightness.getAttribute("aria-valuenow"), "60", "and Brightness too");
  await page.getByRole("button", { name: "Undo" }).click();
  await snackbar.waitFor({ state: "hidden" });
  assert.equal(await darkTheme.isChecked(), true, "Undo restores what was there");
  assert.equal(await brightness.getAttribute("aria-valuenow"), "61", "including the Brightness");
  assert.equal(await page.getByRole("heading", { level: 2, name: "Display" }).isVisible(), true, "the open category stays open");

  // 6. A fresh phone load opens on the list, nothing preselected (after the steps above,
  // so the reload cannot hide a change they were about to assert).
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.waitForFunction(() => (document.getElementById("app")?.childElementCount ?? 0) > 0);
  assert.equal(await page.getByRole("heading", { level: 2, name: "Display" }).isVisible(), false, "a phone opens on the list");
  assert.equal(await page.getByRole("button", { name: "Back" }).count(), 0, "with no Back button in sight");

  await page.setViewportSize(viewport ?? { width: 1280, height: 720 });
};
