// md3.io/conformance/matrix (src/server/conformance.ts): the search field, the filter chips (status, reference,
// aspect), each row's disclosure, and the tray that counts what the filters select and copies it as CSV.
// Without this script every row shows with its detail open.
import 'material/elements/css/card';
import 'material/elements/css/progress';
import 'material/elements/css/chips';
import 'material/elements/css/text-field';
import 'material/elements/css/icon-button';
import 'material/elements/css/button';
import { defineButton, defineCard, defineChips, defineIconButton, defineProgress, defineTextField } from 'material/elements';
import { registerPage } from './page-lifecycle';

registerPage('conformance', (content, life) => {
  const page = content.querySelector<HTMLElement>('.matrix');
  if (!page) return;
  defineCard(); defineProgress(); defineChips(); defineTextField(); defineIconButton(); defineButton();
  page.classList.add('matrix--scripted');
  const allRefs = (page.dataset.refs ?? 'spec compose').split(' ');
  const rows = [...page.querySelectorAll<HTMLElement>('.matrix-row')];
  const search = page.querySelector<HTMLElement & { value?: string }>('.matrix-search');
  const count = page.querySelector<HTMLElement>('[data-matrix-count]');
  const selected = (group: string): string[] => {
    const chips = page.querySelector<HTMLElement & { value?: string | string[] }>(`.matrix-chips[data-group="${group}"]`);
    const value = chips?.value;
    const values = Array.isArray(value) ? value : value ? [value] : [];
    return values.map(v => v.replace(`${group}:`, ''));
  };

  const apply = () => {
    const query = (search?.value ?? '').trim().toLowerCase();
    const statuses = selected('status');
    const aspects = selected('aspect');
    const refs = selected('ref').length ? selected('ref') : allRefs;
    let shown = 0;
    for (const row of rows) {
      const visible = (!query || (row.dataset.text ?? '').includes(query))
        && (!aspects.length || aspects.includes(row.dataset.aspect ?? ''))
        && (!statuses.length || refs.some(ref => statuses.includes(row.dataset[ref] ?? '')));
      row.hidden = !visible;
      if (visible) shown++;
    }
    for (const section of page.querySelectorAll<HTMLElement>('.matrix-section')) {
      const any = [...section.querySelectorAll<HTMLElement>('.matrix-row')].some(row => !row.hidden);
      section.querySelector<HTMLElement>('.matrix-empty')!.hidden = any;
      section.classList.toggle('matrix-section--empty', !any);
    }
    // One reference chosen: its column alone.
    page.dataset.only = refs.length === 1 ? refs[0] : '';
    if (count) count.textContent = String(shown);
  };
  life.events(search)?.addEventListener('input', apply);
  for (const chips of page.querySelectorAll('.matrix-chips')) life.events(chips)?.addEventListener('change', apply);

  // A row's disclosure: its detail opens below it.
  life.events(page)?.addEventListener('click', event => {
    const toggle = (event.target as Element).closest<HTMLElement>('.matrix-row__toggle');
    if (!toggle) return;
    const row = toggle.closest<HTMLElement>('.matrix-row')!;
    const open = row.classList.toggle('matrix-row--open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  // The tray's copy: the rows the filters select, as CSV.
  life.events(page.querySelector('.matrix-copy'))?.addEventListener('click', async () => {
    const cell = (text: string) => `"${text.replace(/"/g, '""')}"`;
    const lines = [['component', 'property', 'aspect', ...allRefs.map(ref => `vs ${ref}`)].join(',')];
    for (const row of rows.filter(r => !r.hidden)) {
      const component = row.closest('.matrix-section')?.querySelector('h2')?.textContent ?? '';
      const property = row.querySelector('.matrix-row__anchor')?.textContent ?? '';
      lines.push([cell(component), cell(property), cell(row.dataset.aspect ?? ''), ...allRefs.map(ref => cell(row.dataset[ref] ?? ''))].join(','));
    }
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      if (count) count.parentElement!.dataset.copied = 'true';
      life.timeout(() => { if (count) delete count.parentElement!.dataset.copied; }, 2000);
    } catch { /* the clipboard can be refused; nothing to undo */ }
  });
  apply();
});
