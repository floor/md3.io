import type { Page } from 'playwright';
import { writeFile } from 'node:fs/promises';
export default async function audit(page: Page, directory: string) {
  await page.waitForSelector('.csv[data-rows="3000"]');
  const initial = await page.locator('.csv__table').ariaSnapshot();
  const tabbableCells = await page.locator('.csv__cell[tabindex="0"]').count();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.locator('[data-row="0"][data-column="0"]').dblclick();
  await page.getByRole('alert').filter({ hasText: 'Cell editing is waiting' }).waitFor();
  await page.locator('[data-row="1"][data-column="7"]').dblclick();
  const editor = page.getByRole('textbox', { name: 'Edit Notes', exact: true });
  await editor.waitFor();
  const editing = await editor.evaluate(input => {
    const s = getComputedStyle(input), rect = input.getBoundingClientRect();
    return { value: (input as HTMLTextAreaElement).value, tag: input.tagName, rect: rect.toJSON(),
      color: s.color, background: s.backgroundColor, opacity: s.opacity, fontSize: s.fontSize, lineHeight: s.lineHeight,
      visibility: s.visibility, scrollHeight: input.scrollHeight, outer: input.parentElement!.outerHTML };
  });
  await page.screenshot({ path: `${directory}/audit-current-editor.png`, animations: 'disabled' });
  await editor.press('Escape');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Tools', exact: true }).click();
  const controls = await page.evaluate(() => [...document.querySelectorAll('button, input, textarea')].filter(e => e.getBoundingClientRect().height).map(e => {
    const s = getComputedStyle(e), before = getComputedStyle(e, '::before'), after = getComputedStyle(e, '::after');
    return { label: e.getAttribute('aria-label') ?? e.textContent, rect: e.getBoundingClientRect().toJSON(),
      before: { width: before.width, height: before.height }, after: { width: after.width, height: after.height },
      transition: s.transitionDuration, animation: s.animationDuration, color: s.color, background: s.backgroundColor };
  }));
  const reducedMotion = await page.evaluate(() => [...document.querySelectorAll('[class*="mtrl-side-sheet"], [class*="mtrl-menu"], .csv__cell')].map(e => ({
    className: e.className, transition: getComputedStyle(e).transitionDuration, animation: getComputedStyle(e).animationDuration,
  })));
  const result = { initial, tabbableCells, editing, controls, reducedMotion };
  await writeFile(`${directory}/accessibility-current.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ tabbableCells, editing }, null, 2));
}
