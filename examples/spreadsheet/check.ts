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
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.waitForSelector('.csv[data-rows="3000"]');
  assert.equal(await page.locator('.csv__cell').count() < 800, true);
  const data = 'Name,Units,Depot,Note\nBeta,10,Lyon,\nAlpha,2,Lille,\nGamma,30,Lyon,';
  await upload(page, data);
  const units = page.getByRole('columnheader', { name: 'Units', exact: true });
  await units.click();
  assert.equal(await units.getAttribute('aria-sort'), 'ascending', 'pointer header sort shows ascending');
  await page.waitForFunction(() => document.querySelector('[data-row="0"][data-column="0"]')?.textContent === 'Alpha');
  const first = page.locator('[data-row="0"][data-column="0"]');
  await first.focus(); await first.press('Enter');
  const nameEditor = page.getByRole('textbox', { name: 'Edit Name', exact: true });
  assert.equal(await nameEditor.inputValue(), 'Alpha', 'FLO-577: existing value initializes');
  await page.getByRole('button', { name: 'Find', exact: true }).focus();
  await nameEditor.waitFor({ state: 'detached' });
  assert.equal(await first.textContent(), 'Alpha', 'blur without change preserves the cell');
  assert.match(await page.locator('.csv__info').textContent() ?? '', /0 edited cells/);
  await first.focus(); await first.press('Enter');
  await nameEditor.fill('Alpha revised'); await nameEditor.press('Enter');
  await page.waitForFunction(() => document.querySelector('[data-row="0"][data-column="0"]')?.textContent === 'Alpha revised');
  assert.equal((await downloadedCSV(page))[1][0], 'Alpha revised', 'existing-cell edit commits to export');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[data-row="0"][data-column="0"]')?.textContent === 'Alpha');
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
  await page.waitForFunction(() => (document.activeElement as HTMLElement)?.dataset.column === '3');
  await page.getByRole('button', { name: 'Next match', exact: true }).click();
  assert.equal(await page.locator('.csv__find output').textContent(), '1 of 1 matches');
  await page.waitForFunction(() => (document.activeElement as HTMLElement)?.dataset.column === '3');
  await page.getByRole('textbox', { name: 'Find in visible cells', exact: true }).press('Escape');
  assert.equal(await page.getByRole('search').isVisible(), false);
  await page.getByRole('button', { name: 'Tools', exact: true }).click();
  await page.getByRole('switch', { name: 'Depot', exact: true }).click();
  assert.equal(await page.getByRole('columnheader', { name: 'Depot', exact: true }).count(), 0, 'Tools hides Depot by pointer');
  await page.getByRole('switch', { name: 'Depot', exact: true }).click();
  assert.equal(await page.getByRole('columnheader', { name: 'Depot', exact: true }).count(), 1, 'Tools shows Depot again');
  await page.locator('.csv__filter-column').click();
  await page.getByRole('option', { name: 'Depot', exact: true }).click();
  await page.getByRole('textbox', { name: 'Exact value', exact: true }).fill('Lille');
  await page.getByRole('button', { name: 'Apply value filter', exact: true }).click();
  assert.match(await page.locator('.csv__info').textContent() ?? '', /1 of 3 rows/, 'Tools applies exact value filter');
  await page.getByRole('button', { name: 'Clear value filter', exact: true }).click();
  assert.match(await page.locator('.csv__info').textContent() ?? '', /3 of 3 rows/, 'Tools clears value filter');
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
    document.querySelector('.csv')!.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true }));
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
  await page.waitForFunction(() => (document.activeElement as HTMLElement)?.dataset.row === '49999');
  assert.deepEqual(pageErrors, [], 'FLO-578: focused-row jump has no page error');
  console.log(`50,000 rows: ${mountedBefore} mounted before jump; ${await page.locator('.csv__table [role="row"]').count()} after.`);
  assert.match(await page.locator('[data-row="49999"][data-column="0"]').textContent() ?? '', /Record 49999/);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'phone has no page overflow');
  await page.getByRole('button', { name: 'Tools', exact: true }).click();
  await page.getByRole('switch', { name: 'Units', exact: true }).click();
  assert.equal(await page.getByRole('columnheader', { name: 'Units', exact: true }).count(), 0, 'compact Tools hides a column');
  await page.getByRole('switch', { name: 'Units', exact: true }).click();
  assert.equal(await page.getByRole('columnheader', { name: 'Units', exact: true }).count(), 1, 'compact Tools restores a column');
  await page.locator('.csv__filter-column').click();
  await page.getByRole('option', { name: 'Units', exact: true }).click();
  await page.getByRole('textbox', { name: 'Exact value', exact: true }).fill('42');
  await page.getByRole('button', { name: 'Apply value filter', exact: true }).click();
  assert.match(await page.locator('.csv__info').textContent() ?? '', /1 of 50,000 rows/, 'compact Tools filters by value');
  await page.getByRole('button', { name: 'Clear value filter', exact: true }).click();
  assert.match(await page.locator('.csv__info').textContent() ?? '', /50,000 of 50,000 rows/, 'compact Tools clears the filter');
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('columnheader', { name: 'Units', exact: true }).click();
  assert.equal(await page.getByRole('columnheader', { name: 'Units', exact: true }).getAttribute('aria-sort'), 'ascending', 'compact pointer sorts a non-first column');
  await page.getByRole('columnheader', { name: 'Units', exact: true }).click();
  assert.equal(await page.getByRole('columnheader', { name: 'Units', exact: true }).getAttribute('aria-sort'), 'descending');
  assert.equal(await page.locator('[data-row="0"][data-column="0"]').textContent(), 'Record 49999', 'pointer sort changes row order');
  // Enter/Space use vlist's same sort event and update the same rows and indicator.
  const header = page.getByRole('columnheader', { name: 'Name', exact: true });
  await header.focus(); await header.press('ArrowRight');
  await page.keyboard.press('Enter'); // descending -> original order
  assert.equal(await page.getByRole('columnheader', { name: 'Units', exact: true }).getAttribute('aria-sort'), null);
  await page.keyboard.press('Space');
  assert.equal(await page.getByRole('columnheader', { name: 'Units', exact: true }).getAttribute('aria-sort'), 'ascending', 'keyboard sort shares pointer state');
  assert.equal(await page.locator('[data-row="0"][data-column="0"]').textContent(), 'Record 0');

  const grid = page.getByRole('grid', { name: 'CSV data', exact: true });
  assert.equal(await grid.count(), 1, 'the grid itself has an accessible name');
  const tabStops = () => grid.evaluate(root => [...root.querySelectorAll<HTMLElement>('a,button,input,select,textarea,[tabindex]'), root as HTMLElement].filter(el => el.tabIndex >= 0).length);
  assert.equal(await tabStops(), 1, 'one sequential table tab stop');
  const traversal = await grid.evaluate(root => {
    const before = document.createElement('button'), after = document.createElement('button');
    before.id = 'before-grid'; after.id = 'after-grid';
    before.textContent = 'Before table'; after.textContent = 'After table';
    root.before(before); root.after(after); before.focus();
    return true;
  });
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('role')), 'columnheader', 'Tab enters the roving headers');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'after-grid', 'the next Tab leaves the table');
  if (traversal) await page.evaluate(() => { document.getElementById('before-grid')?.remove(); document.getElementById('after-grid')?.remove(); });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.locator('[data-row="2"][data-column="0"]').focus();
  const beforeArrow = await page.evaluate(() => {
    const grid = document.querySelector('[role=grid]')!;
    (window as any).__csvFocusChanges = 0;
    grid.addEventListener('focusin', () => (window as any).__csvFocusChanges++);
    return document.querySelector('.vlist-viewport')!.scrollTop;
  });
  await page.keyboard.press('ArrowDown');
  assert.equal(await page.evaluate(() => (document.activeElement as HTMLElement)?.dataset.row), '3');
  assert.equal(await page.evaluate(() => (window as any).__csvFocusChanges), 1, 'visible ArrowDown focuses once');
  assert.equal(await page.locator('.vlist-viewport').evaluate(el => el.scrollTop), beforeArrow, 'visible ArrowDown does not scroll');
  assert.equal(await tabStops(), 1, 'cell navigation adds no tab stops');
  console.log('CSV round 3: pointer/keyboard header sort, desktop/compact Tools, named grid, one tab stop and one-focus/no-scroll ArrowDown passed.');

  const lifecycle = await page.evaluate(async () => {
    const primary = document.querySelector('.csv')!;
    const stylesBefore = document.head.querySelectorAll('link[rel=stylesheet]').length;
    const second = window.spreadsheetExample.createSpreadsheetApp();
    document.getElementById('app')!.append(second.element);
    const transfer = new DataTransfer(); transfer.items.add(new File(['A,B\nSecond,7'], 'second.csv', { type: 'text/csv' }));
    second.element.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true }));
    for (let i = 0; i < 100 && second.element.dataset.rows !== '1'; i++) await new Promise(resolve => setTimeout(resolve, 20));
    const ownState = second.element.dataset.rows === '1' && primary.getAttribute('data-rows') === '50000';
    const ownedSheets = [...second.element.querySelectorAll('.mtrl-side-sheet, .mtrl-bottom-sheet')];
    second.destroy(); second.destroy();
    window.dispatchEvent(new Event('resize'));
    return { ownState, connected: second.element.isConnected, mounts: document.querySelectorAll('.csv').length,
      stylesRestored: document.head.querySelectorAll('link[rel=stylesheet]').length === stylesBefore,
      sheetsRemoved: ownedSheets.length > 0 && ownedSheets.every(sheet => !sheet.isConnected),
      primaryRows: primary.getAttribute('data-rows') };
  });
  assert.deepEqual(lifecycle, { ownState: true, connected: false, mounts: 1, stylesRestored: true, sheetsRemoved: true, primaryRows: '50000' }, 'second mount owns its state and tears down without changing the first');
  assert.equal(await grid.count(), 1, 'first table remains after second mount teardown');
  assert.deepEqual(pageErrors, [], 'every Spreadsheet action has no page error');
  console.log('CSV round 3: independent second mount, idempotent teardown, stylesheet and sheet cleanup passed.');
  console.log('CSV: open/drop/parser errors, typed sort, edit/cancel, find, filter, hide, export, 50,000 virtual rows and phone containment passed.');
}
