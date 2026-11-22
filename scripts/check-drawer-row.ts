import assert from 'node:assert/strict';
import type { Locator } from 'playwright';

/** The full component name must remain readable in both directory drawers. */
export async function checkBottomAppBarRow(pane: Locator): Promise<void> {
  await pane.evaluate(async () => { await document.fonts.ready; });
  const context = `${await pane.getAttribute('aria-label')} at ${pane.page().viewportSize()?.width}px`;
  const row = pane.locator('a[href$="/bottom-app-bar/"]');
  const metrics = await row.evaluate(element => {
    const label = element.querySelector<HTMLElement>('[part~="item-label"]');
    const badge = element.querySelector<HTMLElement>('[part~="item-badge"]');
    if (!label) throw new Error('Bottom app bar row is missing its label');
    const range = document.createRange();
    range.selectNodeContents(label);
    const rects = [...range.getClientRects()].filter(rect => rect.width > 0 && rect.height > 0);
    return {
      label: label.textContent?.trim(), hasBadge: badge !== null,
      lines: new Set(rects.map(rect => Math.round(rect.top * 100) / 100)).size,
      fits: label.scrollWidth <= label.clientWidth + 1,
    };
  });
  assert.equal(metrics.label, 'Bottom app bar');
  assert.equal(metrics.hasBadge, false, 'Drawer rows leave the full label space without a deprecation badge');
  assert.equal(metrics.lines, 1, `${context}: Bottom app bar stays on one line`);
  assert(metrics.fits, `${context}: the complete label fits without clipping`);
}
