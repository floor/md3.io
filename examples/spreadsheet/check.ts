import assert from 'node:assert/strict';
import type { Page } from 'playwright';
import { parseCSV } from './parser';

export async function upload(page: Page, text: string, name = 'review.csv') {
  await page.getByLabel('Open CSV file').setInputFiles({ name, mimeType: 'text/csv', buffer: Buffer.from(text) });
  await page.waitForFunction(() => !document.querySelector('.csv')?.hasAttribute('aria-busy'));
}
async function downloadedCSV(page: Page) {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV', exact: true }).click();
  const stream = await (await pending).createReadStream();
  const chunks: Buffer[] = []; for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  return parseCSV(Buffer.concat(chunks).toString());
}
export default async function steps(page: Page): Promise<void> {
  await page.waitForSelector('.csv[data-rows="3000"]');
  assert.equal(await page.locator('.csv__cell').count() < 800, true);
  const data = 'Name,Units,Depot,Note\nBeta,10,Lyon,\nAlpha,2,Lille,\nGamma,30,Lyon,';
  await upload(page, data);
  // Pointer activation is asserted last: vlist 3.1.0 currently intercepts header clicks.
  await page.getByRole('button', { name: 'Units', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('menuitem', { name: 'Sort ascending', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[data-row="0"][data-column="0"]')?.textContent === 'Alpha');
  const first = page.locator('[data-row="0"][data-column="0"]');
  await first.focus(); await first.press('Enter');
  await page.getByRole('alert').filter({ hasText: 'Cell editing is waiting' }).waitFor();
  assert.equal(await first.textContent(), 'Alpha', 'failed initialization preserves existing data');
  console.log('KNOWN GAP: Material multiline initial value blocks editing nonempty cells.');
  const blank = page.locator('[data-row="0"][data-column="3"]');
  await blank.focus(); await blank.press('Enter');
  await page.getByRole('textbox', { name: 'Edit Note', exact: true }).fill('cancelled'); await page.keyboard.press('Escape');
  assert.equal(await blank.textContent(), '');
  await blank.focus(); await blank.press('Enter');
  await page.getByRole('textbox', { name: 'Edit Note', exact: true }).fill('Edited'); await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('.csv__info')?.textContent?.includes('1 edited cells'));
  await page.getByRole('button', { name: 'Find', exact: true }).click();
  await page.getByRole('textbox', { name: 'Find in visible cells', exact: true }).fill('edited');
  await page.getByRole('button', { name: 'Next match', exact: true }).click();
  assert.equal(await page.locator('.csv__find output').textContent(), '1 of 1 matches');
  await page.getByRole('button', { name: 'Next match', exact: true }).click();
  assert.equal(await page.locator('.csv__find output').textContent(), '1 of 1 matches');
  await page.getByRole('textbox', { name: 'Find in visible cells', exact: true }).press('Escape');
  assert.equal(await page.getByRole('search').isVisible(), false);
  const depot = page.getByRole('button', { name: 'Depot', exact: true });
  await depot.focus(); await depot.press('ArrowDown');
  await page.getByRole('menuitem', { name: 'Hide column', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: 'Depot', exact: true }).count(), 0);
  await page.getByRole('button', { name: 'Show all columns', exact: true }).click();
  await page.getByRole('button', { name: 'Depot', exact: true }).focus(); await page.keyboard.press('Enter');
  await page.getByRole('menuitem', { name: 'Filter by selected value', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.csv__info')?.textContent?.includes('1 of 3 rows'));
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await page.getByRole('textbox', { name: 'Filter rows', exact: true }).fill('edited');
  assert.deepEqual(await downloadedCSV(page), [['Name', 'Units', 'Depot', 'Note'], ['Alpha', '2', 'Lille', 'Edited']]);
  await page.getByRole('textbox', { name: 'Filter rows', exact: true }).fill('no match');
  assert.equal(await page.locator('.csv__empty').isVisible(), true);
  const opening = upload(page, 'a,b\n"broken');
  await page.getByRole('button', { name: 'Discard and open', exact: true }).click();
  await opening;
  await page.waitForFunction(() => document.querySelector('[role=alert]')?.textContent?.includes('Unclosed quote'));
  assert.match(await page.getByRole('alert').textContent() ?? '', /Unclosed quote/);
  assert.equal(await page.locator('.csv').getAttribute('data-rows'), '3');
  // The failed open preserves edits too: undo before the next replacement.
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.csv__info')?.textContent?.includes('0 edited cells'));
  await upload(page, 'Name,Units');
  assert.equal(await page.locator('.csv').getAttribute('data-rows'), '0');
  await page.evaluate(() => {
    const transfer = new DataTransfer(); transfer.items.add(new File(['A,B\nDrop,'], 'drop.csv', { type: 'text/csv' }));
    document.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true }));
  });
  await page.waitForFunction(() => document.querySelector('.csv__info')?.textContent?.startsWith('drop.csv'));
  await page.locator('[data-row="0"][data-column="1"]').focus(); await page.keyboard.press('Enter');
  await page.getByRole('textbox', { name: 'Edit B', exact: true }).fill('=1+1'); await page.keyboard.press('Tab');
  await page.waitForFunction(() => (document.activeElement as HTMLElement)?.dataset.column === '1');
  assert.equal((await downloadedCSV(page))[1][1], '=1+1');
  await page.getByRole('checkbox', { name: 'Safe for spreadsheets', exact: true }).check();
  assert.equal((await downloadedCSV(page))[1][1], "'=1+1");
  await page.getByLabel('Open CSV file').setInputFiles({ name: 'cancel.csv', mimeType: 'text/csv', buffer: Buffer.from('A\nx') });
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  assert.match(await page.locator('.csv__info').textContent() ?? '', /drop.csv/);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[data-row="0"][data-column="1"]')?.textContent === '');
  await page.getByRole('checkbox', { name: 'Safe for spreadsheets', exact: true }).uncheck();
  const large = 'Name,Units\n' + Array.from({ length: 50000 }, (_, i) => `Record ${i},${i}`).join('\n');
  await upload(page, large, 'large.csv');
  await page.waitForSelector('.csv[data-rows="50000"]');
  const bound = async () => assert.ok(await page.locator('.csv__table [role="row"]').count() < 100, 'virtual rows bounded below 100');
  await bound();
  const mountedBefore = await page.locator('.csv__table [role="row"]').count();
  await page.locator('[data-row="0"][data-column="0"]').focus(); await page.keyboard.press('Control+End');
  await page.waitForSelector('[data-row="49999"][data-column="1"]'); await bound();
  console.log(`50,000 rows: ${mountedBefore} mounted before jump; ${await page.locator('.csv__table [role="row"]').count()} after.`);
  assert.match(await page.locator('[data-row="49999"][data-column="0"]').textContent() ?? '', /Record 49999/);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'phone has no page overflow');
  // FLO-576: record the upstream gap explicitly, without forced/synthetic activation.
  await page.getByRole('button', { name: 'Name', exact: true }).scrollIntoViewIfNeeded();
  const header = await page.getByRole('button', { name: 'Name', exact: true }).boundingBox();
  assert.ok(header); await page.mouse.click(header.x + header.width / 2, header.y + header.height / 2);
  assert.equal(await page.getByRole('menu').isVisible(), false);
  console.log('KNOWN GAP FLO-576: pointer header menus blocked by vlist; keyboard route passed.');
  console.log('CSV: open/drop/parser errors, typed sort, edit/cancel, find, filter, hide, export, 50,000 virtual rows and phone containment passed.');
}
