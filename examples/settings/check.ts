// What the Settings app must do, once, in a browser: the steps
// scripts/check-examples.ts runs per variant. Written for the Vanilla reference, which
// is the only variant this example declares today (`variants: ["vanilla"]`).
//
// The size classes are read on the app's own box, not the window (the example frame adds
// 24 px of page padding around it), so the pane switches sit at 648, 888 and 1248 px
// windows: 390 is compact (one pane), 700 medium (two panes at 50% each), 1024 expanded
// (fixed list pane 360 px), 1280 large (412 px).
//
// The snackbar is not expected to go away on its own: it has an action, and an
// actionable snackbar stays until the user acts on it or dismisses it — both are
// checked, with a wait past the 4-10 s bound that only applies without an action.
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

  // 1. Expanded: the app bar titles the screen, the first category is open beside the
  // list with its row selected, and the list is the fixed pane at M3's expanded width.
  await page.setViewportSize({ width: 1024, height: 800 });
  assert.equal(await page.getByRole("heading", { level: 1, name: "Settings" }).isVisible(), true, "the app bar carries the screen's only h1");
  assert.equal(await row(/Network & internet/).getAttribute("aria-pressed"), "true", "Network & internet is selected on load");
  await page.getByRole("heading", { level: 2, name: "Network & internet" }).waitFor();
  assert.equal(await page.getByRole("switch", { name: "Wi-Fi" }).isChecked(), true, "Wi-Fi starts on");
  assert.equal(await page.getByRole("switch", { name: "Mobile data" }).isChecked(), true, "Mobile data starts on");
  assert.ok(Math.abs((await paneWidth(listPane)) - 360) <= 1, "at expanded the list pane is 360 px");
  assert.ok(Math.abs((await spacer()) - 24) <= 1, "and the spacer is 24 px");

  // The settings are list rows, their controls in the trailing slot.
  const wifiRow = page.locator('[data-id="wifi"]');
  assert.equal(await wifiRow.getAttribute("role"), "listitem", "a setting is a list item");
  assert.equal(await wifiRow.getByRole("switch").count(), 1, "whose control is the trailing switch");
  assert.equal(await wifiRow.locator(".mtrl-list__headline").textContent(), "Wi-Fi", "and the row's headline names it");

  // A trailing control is the app's to name (list.md), and the app names it through the
  // switch's public ariaLabel; the row's supporting text stays the row's — the list
  // exposes no public handle on it (FLO-590), and the switch's own `supportingText`
  // renders a visible helper, not a description. So a switch row has a name and no
  // description, and the row keeps showing its text.
  const airplaneSwitch = page.getByRole("switch", { name: "Airplane mode" });
  assert.equal(await airplaneSwitch.getAttribute("aria-label"), "Airplane mode", "the row's text is the switch's accessible name");
  assert.equal(await airplaneSwitch.getAttribute("aria-describedby"), null, "no description is wired to it (FLO-590)");
  assert.equal(await page.locator('[data-id="airplane"]').getByText("Turns off Wi-Fi and Bluetooth").isVisible(), true, "while the row still shows its supporting text");

  // 2. Medium: two panes, 50% of the window each.
  await page.setViewportSize({ width: 700, height: 800 });
  assert.ok(Math.abs((await paneWidth(listPane)) - (await paneWidth(detailPane))) <= 1, "at medium the panes are 50% each");
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
  // A slider cannot be a list row: the trailing slot is content-sized, and a slider there
  // collapses to its own label. It is a full-width control under its group's heading.
  assert.equal(await page.locator('[data-id="brightness"]').count(), 0, "the slider is not a list row");
  assert.equal(await page.getByRole("heading", { level: 3, name: "Screen" }).isVisible(), true, "its group's title is a heading over it");
  const sliderBlock = page.locator('[data-setting="brightness"]');
  assert.equal(await sliderBlock.getByRole("slider").count(), 1, "the slider sits in a block of its own");
  assert.ok((await sliderBlock.boundingBox())!.width > 300, "that spans the pane, not a trailing slot");

  // Not checked here, because it is not built: a radio group in a list is one radio per
  // row, the row selecting it (the lists page: "Use radio buttons to allow a single
  // selection in a list", "The selected state applies to the entire list item"), and the
  // library cannot draw that. Display's "Text size" and Network & internet's "Preferred
  // network type" wait on the radio finding in the note.

  // The slider takes the keyboard and applies at once — no button to press.
  await brightness.focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await brightness.getAttribute("aria-valuenow"), "61", "ArrowRight moves Brightness by one step");

  // 5. Compact: the detail replaces the list under the app bar, which takes the
  // category's title and Back. There is no selected state to come back to; Back returns
  // to the list, focused; widening reopens the category the user was last in.
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await row(/Display/).isVisible(), false, "in the single pane the list gives way to the detail");
  // The pane swap is CSS, but the title comes from the app's resize observer, a tick
  // later: wait for the bar to take the category's title rather than race it.
  await page.getByRole("heading", { level: 1, name: "Display" }).waitFor();
  assert.equal(await page.getByRole("heading", { level: 1, name: "Display" }).isVisible(), true, "the app bar titles the category");
  assert.equal(await page.getByRole("heading", { level: 2, name: "Display" }).isVisible(), false, "the pane's own title gives way to it");
  await page.getByRole("button", { name: "Back" }).click();
  assert.equal(await row(/Display/).isVisible(), true, "Back returns to the list");
  assert.equal(await page.getByRole("heading", { level: 1, name: "Settings" }).isVisible(), true, "with the app bar back to the screen's title");
  assert.equal(await row(/Display/).evaluate((el) => el === document.activeElement), true, "focus lands on the row it came from");
  assert.equal(await page.locator('.settings-app__list-pane [aria-pressed="true"]').count(), 0, "and the single pane keeps no selected row");
  await page.setViewportSize({ width: 700, height: 800 });
  // The app reacts to the crossing through the resize observer on its own box: wait for
  // it rather than race it.
  await page.getByRole("heading", { level: 2, name: "Display" }).waitFor();
  assert.equal(await detailPane.isVisible(), true, "widening shows both panes");
  assert.equal(await row(/Display/).getAttribute("aria-pressed"), "true", "and reopens the category the user was last in");

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
  // The rule as written (state.ts): turning it off leaves them off — both of them.
  assert.equal(await bluetooth.isEnabled(), true, "Bluetooth is enabled again");
  assert.equal(await bluetooth.isChecked(), false, "and stays off too");

  // 7. Reset asks first — focus inside the dialog — then resets and offers the undo.
  await row(/Display/).click();
  const darkTheme = page.getByRole("switch", { name: "Dark theme" });
  // Dark theme is a setting that acts: the app paints the dark roles for its own subtree
  // (data-theme + data-theme-mode on the app, the documented per-subtree theme), so the
  // app's surface role flips while the page around it keeps its appearance.
  const appSurface = () => page.locator(".settings-app").evaluate((el) => getComputedStyle(el).backgroundColor);
  assert.equal(await appSurface(), "rgb(254, 247, 255)", "the app starts on the light surface role");
  await darkTheme.click();
  assert.equal(await darkTheme.isChecked(), true, "Dark theme is on before the reset");
  assert.equal(await appSurface(), "rgb(20, 18, 24)", "and on, the app itself goes dark");

  const dialog = page.getByRole("alertdialog", { name: "Reset all settings?" });
  await page.getByRole("button", { name: "Reset all settings" }).click();
  await dialog.waitFor();
  assert.equal(await dialog.evaluate((el) => el.contains(document.activeElement)), true, "focus lands inside the dialog");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  assert.equal(await darkTheme.isChecked(), true, "Cancel changes nothing");

  // Rule 6's other two ways out: Escape, and a click on the scrim — neither changing
  // anything. The dialog is mounted in the app's own element (its `container`), so the
  // overlay covers the app's box; the click goes beside the surface, inside that box.
  await page.getByRole("button", { name: "Reset all settings" }).click();
  await dialog.waitFor();
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  assert.equal(await darkTheme.isChecked(), true, "Escape closes the dialog and changes nothing");

  await page.getByRole("button", { name: "Reset all settings" }).click();
  await dialog.waitFor();
  const surface = (await dialog.boundingBox())!;
  await page.mouse.click(Math.max(surface.x - 40, 28), surface.y + surface.height / 2);
  await dialog.waitFor({ state: "hidden" });
  assert.equal(await darkTheme.isChecked(), true, "a click on the scrim closes it and changes nothing");

  await page.getByRole("button", { name: "Reset all settings" }).click();
  await dialog.waitFor();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  const snackbar = page.getByRole("status");
  await snackbar.waitFor();
  assert.equal(await darkTheme.isChecked(), false, "Reset puts Dark theme back to its default");
  assert.equal(await appSurface(), "rgb(254, 247, 255)", "and the app is back on the light surface role");
  assert.equal(await brightness.getAttribute("aria-valuenow"), "60", "and Brightness too");
  // An actionable snackbar does not close itself: the guidelines' 4-10 s bound is for
  // the ones without an action. Five seconds in, this one is still there.
  await page.waitForTimeout(5000);
  assert.equal(await snackbar.isVisible(), true, "the snackbar with its action is still on screen after 5 s");
  // The snackbar is reachable by keyboard, as the note claims and the component's missing
  // shortcut (finding 9) leaves as the only way: Tab to Undo, Enter to take it.
  const undoButton = page.getByRole("button", { name: "Undo" });
  let onUndo = false;
  for (let presses = 0; presses < 30 && !onUndo; presses += 1) {
    await page.keyboard.press("Tab");
    onUndo = await undoButton.evaluate((el) => el === document.activeElement);
  }
  assert.equal(onUndo, true, "Tab reaches the snackbar's Undo");
  await page.keyboard.press("Enter");
  await snackbar.waitFor({ state: "hidden" });
  assert.equal(await darkTheme.isChecked(), true, "Undo restores what was there");
  assert.equal(await appSurface(), "rgb(20, 18, 24)", "the dark app with it");
  assert.equal(await brightness.getAttribute("aria-valuenow"), "61", "including the Brightness");
  assert.equal(await page.getByRole("heading", { level: 2, name: "Display" }).isVisible(), true, "the open category stays open");

  // A second reset while its snackbar is still up: still the one snackbar, and its Undo
  // is the second reset's — `show()` on a visible snackbar is a no-op in the library, so
  // the app's `undoState` (re-snapshotted on every reset) is what the action uses. A
  // change made between the two resets comes back, not the state before the first.
  await page.getByRole("button", { name: "Reset all settings" }).click();
  await dialog.waitFor();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  await snackbar.waitFor();
  await darkTheme.click();
  assert.equal(await darkTheme.isChecked(), true, "a change between the two resets");
  await page.getByRole("button", { name: "Reset all settings" }).click();
  await dialog.waitFor();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  assert.equal(await page.getByRole("status").count(), 1, "the second reset's snackbar replaces the first, one at a time");
  await page.getByRole("button", { name: "Undo" }).click();
  await snackbar.waitFor({ state: "hidden" });
  assert.equal(await darkTheme.isChecked(), true, "Undo after the second reset restores the state before it");
  assert.equal(await brightness.getAttribute("aria-valuenow"), "60", "the second reset's snapshot, not the first's (61)");

  // Its close button dismisses it, and the reset stands.
  await page.getByRole("button", { name: "Reset all settings" }).click();
  await dialog.waitFor();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  await snackbar.waitFor();
  await page.getByRole("button", { name: "Dismiss" }).click();
  await snackbar.waitFor({ state: "hidden" });
  assert.equal(await darkTheme.isChecked(), false, "dismissing the snackbar keeps the reset, with no Undo taken");

  // 8. A fresh compact load opens on the list, nothing preselected and no Back (after
  // the steps above, so the reload cannot hide a change they were about to assert).
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.waitForFunction(() => (document.getElementById("app")?.childElementCount ?? 0) > 0);
  assert.equal(await page.getByRole("heading", { level: 1, name: "Settings" }).isVisible(), true, "a compact window opens under the app bar's Settings");
  assert.equal(await page.getByRole("heading", { level: 2, name: "Display" }).isVisible(), false, "with no detail open");
  assert.equal(await page.getByRole("button", { name: "Back" }).count(), 0, "and no Back button in sight");

  // 9. The app's state is per mount, and one mount can be torn down: a second mount made
  // while the page is two-pane opens its own first category (the module-level pane mode
  // this replaced would have left it blank), and destroy() takes that mount back out —
  // element, observer, listeners and components — leaving the first app as it was. The
  // example exposes the factory and the live app on `window.settingsExample`, the way the
  // site's theme app exposes itself (src/client/theme-app/index.ts).
  await page.setViewportSize({ width: 700, height: 800 });
  await row(/Display/).click();
  const mounted = await page.evaluate(async () => {
    type Mount = { element: HTMLElement; destroy: () => void };
    const check = window as unknown as { settingsExample: { createSettingsApp: () => Mount }; settingsSecond?: Mount };
    const second = check.settingsExample.createSettingsApp();
    const host = document.createElement("div");
    // Off the page's flow, 800 px wide: the app reads its own box, lays itself out as two
    // panes and opens its first category — with no module state to inherit.
    host.style.cssText = "position:fixed;top:0;left:-10000px;width:800px;";
    host.append(second.element);
    document.body.append(host);
    check.settingsSecond = second;
    // The pressed element is the row's button; the id is the row container's (as in
    // step 1, where the checks locate rows by [data-id="…"]).
    const open = (root: ParentNode | null): string | null => root?.querySelector('[aria-pressed="true"]')?.closest("[data-id]")?.getAttribute("data-id") ?? null;
    // The app's first layout comes from its ResizeObserver, a task after the mount: wait
    // for the row it opens, bounded, so a mount that never opens one fails here.
    const deadline = performance.now() + 1000;
    while (open(second.element) === null && performance.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 10));
    return {
      apps: document.querySelectorAll(".settings-app").length,
      second: open(second.element),
      first: open(document.querySelector(".settings-app")),
    };
  });
  assert.equal(mounted.apps, 2, "a second mount stands beside the first");
  assert.equal(mounted.second, "network", "and opens its own first category, not the first app's");
  assert.equal(mounted.first, "display", "while the first app keeps its own state");

  const torn = await page.evaluate(() => {
    type Mount = { element: HTMLElement; destroy: () => void };
    const second = (window as unknown as { settingsSecond?: Mount }).settingsSecond!;
    const host = second.element.parentElement;
    second.destroy();
    host?.remove();
    return {
      apps: document.querySelectorAll(".settings-app").length,
      connected: second.element.isConnected,
      first: document.querySelector(".settings-app")?.querySelectorAll('[aria-pressed="true"]').length ?? 0,
    };
  });
  assert.equal(torn.apps, 1, "destroy() takes the second mount, element and all, back out");
  assert.equal(torn.connected, false, "its element off the page");
  assert.equal(torn.first, 1, "and the first app untouched");

  await page.setViewportSize(viewport ?? { width: 1280, height: 720 });
};
