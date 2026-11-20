// Every visible row and all preference rules, run in every framework and device frame.
import assert from "node:assert/strict";
import type { Frame, Page } from "playwright";

export default async function steps(page: Page | Frame): Promise<void> {
  const button = (name: string) => page.getByRole("button", { name, exact: true });
  const row = (name: string) => page.getByText(name, { exact: true });
  const toggle = (name: string) => page.getByRole("switch", { name, exact: true });
  // Framework adapters commit controlled properties after the event handler returns.
  const equal = async <T>(read: () => Promise<T>, expected: T, message = "The setting reaches the expected state") => {
    for (let attempt = 0; attempt < 40; attempt++) {
      if (await read() === expected) return;
      await page.waitForTimeout(50);
    }
    assert.equal(await read(), expected, message);
  };
  const assertRowStops = async () => {
    const rows = await page.locator(".settings__row").evaluateAll(wrappers => wrappers.map(wrapper => {
      const list = wrapper.querySelector("m-list, [role='list']");
      if (!list) return { name: wrapper.outerHTML, count: 0, expected: 1, nested: false };
      const item = (list.shadowRoot ?? list).querySelector('[role="listitem"]');
      const controls: HTMLElement[] = [];
      const visit = (root: ParentNode) => {
        for (const element of root.querySelectorAll<HTMLElement>("*")) {
          if (element.tabIndex >= 0 && !(element as HTMLInputElement).disabled && element.getClientRects().length && getComputedStyle(element).visibility !== "hidden") controls.push(element);
          if (element.shadowRoot) visit(element.shadowRoot);
        }
      };
      if (item) visit(item);
      const toggleRow = wrapper.classList.contains("settings__row--toggle");
      const host = item?.querySelector("m-switch, .mtrl-switch");
      const input = host ? (host.shadowRoot ?? host).querySelector<HTMLInputElement>('[role="switch"]') : null;
      return { name: item?.textContent, count: controls.length, expected: input?.disabled || item?.getAttribute("aria-disabled") === "true" ? 0 : 1, nested: !toggleRow || !!input };
    }));
    assert.ok(rows.length > 0);
    for (const row of rows) {
      assert.equal(row.nested, true, `${row.name}: switch belongs inside its list item`);
      assert.equal(row.count, row.expected, `${row.name}: one Tab stop per enabled settings row`);
    }
  };
  await assertRowStops();
  if (await button("Device information").isVisible()) {
    await button("Device information").click();
    await page.getByRole("alertdialog").waitFor();
    await button("Done").click();
    await page.getByRole("alertdialog").waitFor({ state: "hidden" });
  }
  for (const label of ["Mira Vale", "Storage", "Battery", "Version"]) {
    await button(label).click();
    await page.getByRole("alertdialog").waitFor();
    await button("Done").click();
    await page.getByRole("alertdialog").waitFor({ state: "hidden" });
  }
  for (const label of ["Adaptive brightness", "Use location", "Notification sounds"]) {
    const initial = await toggle(label).isChecked();
    await row(label).click();
    await equal(() => toggle(label).isChecked(), !initial, `${label}: the row applies immediately`);
    await toggle(label).click();
    await equal(() => toggle(label).isChecked(), initial, `${label}: the switch applies immediately`);
  }
  await row("Allow notifications").click();
  await equal(() => toggle("Notification sounds").isDisabled(), true);
  await toggle("Allow notifications").click();
  await equal(() => toggle("Notification sounds").isDisabled(), false);
  await row("Bluetooth").click();
  await equal(() => toggle("Bluetooth").isChecked(), true);
  await toggle("Airplane mode").click();
  await equal(() => toggle("Bluetooth").isChecked(), false);
  await equal(() => toggle("Bluetooth").isDisabled(), true);
  await button("Wi-Fi").click();
  await equal(() => toggle("Use Wi-Fi").isChecked(), false);
  await equal(() => toggle("Use Wi-Fi").isDisabled(), true);
  await assertRowStops();
  assert.equal(await page.getByRole("button", { name: "Willow Loft", exact: true }).count(), 0);
  await button("Back").click();
  await row("Airplane mode").click();
  await equal(() => toggle("Bluetooth").isChecked(), false, "Airplane mode does not silently re-enable Bluetooth");
  await button("Wi-Fi").click();
  await equal(() => toggle("Use Wi-Fi").isChecked(), false, "Airplane mode does not silently re-enable Wi-Fi");
  await toggle("Use Wi-Fi").click();
  await assertRowStops();
  for (const name of ["Willow Loft", "Courtyard Guest", "Fern House", "Willow Studio"]) {
    await button(name).click();
    await button("Connect").click();
    await page.getByRole("alertdialog").waitFor({ state: "hidden" });
    assert.equal(await button(name).getAttribute("aria-describedby").then(async id => id ? await button(name).evaluate((el, id) => (el.getRootNode() as ParentNode).querySelector(`#${id}`)?.textContent, id) : null), "Connected");
  }
  await button("Add network").click();
  assert.equal(await button("Connect").isDisabled(), true);
  await page.getByRole("textbox", { name: "Network name", exact: true }).fill("Garden Room");
  await page.getByLabel("Password (optional)", { exact: true }).fill("invented-passphrase");
  await button("Connect").click();
  await page.getByRole("alertdialog").waitFor({ state: "hidden" });
  await button("Garden Room").waitFor();
  await row("Use Wi-Fi").click();
  await equal(() => toggle("Use Wi-Fi").isChecked(), false);
  await toggle("Use Wi-Fi").click();
  await button("Back").click();
  await button("Search settings").click();
  const search = page.getByRole("searchbox", { name: "Search settings", exact: true });
  await search.fill("no-such-setting");
  await page.getByText("No settings found.", { exact: true }).waitFor();
  await search.fill("storage");
  await button("Storage").click();
  await button("Done").click();
  await page.getByRole("alertdialog").waitFor({ state: "hidden" });
  await button("Search settings").click();
  await row("Airplane mode").click();
  const feedback = page.getByRole("status").filter({ hasText: "Airplane mode on" });
  await feedback.waitFor();
  await button("Dismiss").click();
  await feedback.waitFor({ state: "hidden" });
}
export const checkFrame = steps;
