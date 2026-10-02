// What the Settings app must do, once, in a browser: the steps
// scripts/check-examples.ts runs per variant. Written for the Vanilla reference — the
// other five variants still run the previous small screen, so this check cannot pass on
// them until their ports exist (see the design note, section 6).
//
// The window widths are M3's size classes: 390 is compact (one pane), 700 medium (two
// panes at 50% each), 1024 expanded (fixed list pane 360 px), 1280 large (412 px).
//
// The 10-second snackbar timeout is not waited out here; the Undo path is asserted
// instead, and the timeout itself belongs to the component's own behaviour.
import assert from "node:assert/strict";
import type { Page } from "playwright";

export default async (page: Page): Promise<void> => {
  const viewport = page.viewportSize();
  const row = (name: RegExp) => page.getByRole("button", { name }).first();
  const listPane = page.locator(".settings-app__list-pane");
  const detailPane = page.locator(".settings-app__detail-pane");
  const paneWidth = async (pane: typeof listPane) => (await pane.boundingBox())!.width;
  const spacer = async () => {
    const list = (await listPane.boundingBox())!;
    const detail = (await detailPane.boundingBox())!;
    return detail.x - (list.x + list.width);
  };

  // 1. Expanded: the first category is open beside the list, its row selected, and the
  // list is the fixed pane at M3's expanded width.
  await page.setViewportSize({ width: 1024, height: 800 });
  assert.equal(await row(/Network & internet/).getAttribute("aria-pressed"), "true", "Network & internet is selected on load");
  await page.getByRole("heading", { level: 2, name: "Network & internet" }).waitFor();
  assert.equal(await page.getByRole("switch", { name: "Wi-Fi" }).isChecked(), true, "Wi-Fi starts on");
  assert.equal(await page.getByRole("switch", { name: "Mobile data" }).isChecked(), true, "Mobile data starts on");
  assert.ok(Math.abs((await paneWidth(listPane)) - 360) <= 1, "at expanded the list pane is 360 px");
  assert.ok(Math.abs((await spacer()) - 24) <= 1, "and the spacer is 24 px");

  // 2. Medium: two panes, 50% of the window each.
  await page.setViewportSize({ width: 700, height: 800 });
  const wide = (await paneWidth(listPane));
  assert.ok(Math.abs(wide - (await paneWidth(detailPane))) <= 1, "at medium the panes are 50% each");
  assert.ok(Math.abs((await spacer()) - 24) <= 1, "with a 24 px spacer");

  // 3. Large: the fixed pane grows to its large-breakpoint width.
  await page.setViewportSize({ width: 1280, height: 800 });
  assert.ok(Math.abs((await paneWidth(listPane)) - 412) <= 1, "at large the list pane is 412 px");

  // 4. A row opens its detail, one selection at a time.
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

  // 5. Compact: the detail replaces the list, with no selected state to come back to;
  // Back returns to the list, focused. Widening again shows both panes.
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await row(/Display/).isVisible(), false, "in the single pane the list gives way to the detail");
  await page.getByRole("button", { name: "Back" }).click();
  assert.equal(await row(/Display/).isVisible(), true, "Back returns to the list");
  assert.equal(await row(/Display/).evaluate((el) => el === document.activeElement), true, "focus lands on the row it came from");
  assert.equal(await page.locator('.settings-app__list-pane [aria-pressed="true"]').count(), 0, "and the single pane keeps no selected row");
  await page.setViewportSize({ width: 700, height: 800 });
  // The app reacts to the breakpoint through a media-query listener, so give it the event.
  await page.getByRole("heading", { level: 2, name: "Network & internet" }).waitFor();
  assert.equal(await detailPane.isVisible(), true, "widening shows both panes");
  assert.equal(await row(/Network & internet/).getAttribute("aria-pressed"), "true", "and opens the first category, nothing being selected");

  // 6. Airplane mode reaches into Wi-Fi and Bluetooth, and only those.
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

  // 7. Reset asks first — focus inside the dialog — then resets, then offers the undo.
  await row(/Display/).click();
  const darkTheme = page.getByRole("switch", { name: "Dark theme" });
  await darkTheme.click();
  assert.equal(await darkTheme.isChecked(), true, "Dark theme is on before the reset");

  const dialog = page.getByRole("alertdialog", { name: "Reset all settings?" });
  await page.getByRole("button", { name: "Reset all settings" }).click();
  await dialog.waitFor();
  assert.equal(await dialog.evaluate((el) => el.contains(document.activeElement)), true, "focus lands inside the dialog");
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

  // 8. A fresh compact load opens on the list, nothing preselected (after the steps above,
  // so the reload cannot hide a change they were about to assert).
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.waitForFunction(() => (document.getElementById("app")?.childElementCount ?? 0) > 0);
  assert.equal(await page.getByRole("heading", { level: 2, name: "Display" }).isVisible(), false, "a compact window opens on the list");
  assert.equal(await page.getByRole("button", { name: "Back" }).count(), 0, "with no Back button in sight");

  await page.setViewportSize(viewport ?? { width: 1280, height: 720 });
};
