import type { Page } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { upload } from './check';
export default async function screenshots(page: Page, directory: string, states?: Set<string>) {
  await mkdir(directory, { recursive: true });
  const evidence: unknown[] = [];
  for (const width of [390, 720, 1024, 1280]) for (const theme of ['light', 'dark']) {
    await page.setViewportSize({ width, height: 900 });
    await page.reload(); await page.waitForSelector('.csv[data-rows="3000"]');
    await page.evaluate(theme => { document.documentElement.dataset.themeMode = theme; }, theme);
    await page.evaluate(() => document.fonts.ready);
    const shot = async (state: string) => {
      if (states && !states.has(state)) return;
      // Component springs use JS timing as well as CSS; let the surface settle.
      await page.waitForTimeout(650);
      await page.screenshot({ path: `${directory}/${width}-${theme}-${state}.png`, fullPage: false, animations: 'disabled' });
    };
    await shot('loaded');
    await page.getByRole('button', { name: 'Tools', exact: true }).click(); await shot('tools');
    evidence.push(await page.evaluate(({ width, theme }) => ({ width, theme,
      pageOverflow: document.documentElement.scrollWidth > innerWidth,
      controls: [...document.querySelectorAll<HTMLButtonElement>('button')].filter(b => b.getBoundingClientRect().height > 0).map(b => ({
        name: b.textContent, width: b.getBoundingClientRect().width, height: b.getBoundingClientRect().height,
      })),
      cell: (() => { const s = getComputedStyle(document.querySelector('.csv__cell')!); return { color: s.color, font: s.font, lineHeight: s.lineHeight }; })(),
      surface: getComputedStyle(document.querySelector('.csv__table')!).getPropertyValue('--vlist-bg'),
    }), { width, theme }));
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await page.getByRole('button', { name: 'Find', exact: true }).click();
    await page.getByRole('textbox', { name: 'Find in visible cells', exact: true }).fill('Lyon'); await shot('find');
    await page.getByRole('button', { name: 'Close find', exact: true }).click();
    await page.getByRole('button', { name: 'Dispatch', exact: true }).focus(); await page.keyboard.press('Enter');
    await page.getByRole('menuitem', { name: 'Sort ascending', exact: true }).waitFor();
    await shot('menu'); await page.keyboard.press('Escape');
    await page.locator('[data-row="0"][data-column="0"]').dblclick();
    await page.getByRole('alert').filter({ hasText: 'Cell editing is waiting' }).waitFor(); await shot('editing-blocked');
    await page.locator('[data-row="1"][data-column="7"]').dblclick();
    const editor = page.getByRole('textbox', { name: 'Edit Notes', exact: true });
    await editor.waitFor(); await editor.fill('Added note'); await shot('editing'); await editor.press('Enter');
    await page.getByRole('button', { name: 'Undo', exact: true }).waitFor(); await shot('undo');
    await page.getByLabel('Open CSV file').setInputFiles({ name: 'next.csv', mimeType: 'text/csv', buffer: Buffer.from('A\nx') });
    await page.getByRole('button', { name: 'Cancel', exact: true }).waitFor(); await shot('discard');
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await page.getByRole('button', { name: 'Export CSV', exact: true }).click(); await shot('export');
    await upload(page, 'a,b\n"unclosed'); await shot('error');
    await upload(page, 'Name,Units'); await shot('empty');
    // Delay the native file read to capture the genuine pending-open state.
    await page.evaluate(() => {
      const original = File.prototype.text;
      File.prototype.text = async function () { await new Promise(resolve => setTimeout(resolve, 1200)); return original.call(this); };
    });
    await page.getByLabel('Open CSV file').setInputFiles({ name: 'loading.csv', mimeType: 'text/csv', buffer: Buffer.from('A,B\nx,1') });
    await page.waitForSelector('.csv[aria-busy="true"]'); await shot('loading');
    await page.waitForFunction(() => !document.querySelector('.csv')?.hasAttribute('aria-busy'));
  }
  await writeFile(`${directory}/layout-evidence.json`, JSON.stringify(evidence, null, 2));
}
