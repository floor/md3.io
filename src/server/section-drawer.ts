import { renderElement } from 'material/ssr';
import { renderStyles } from './playground-panel';

type Link = { name: string; href: string; badge?: string };
type Family = { name: string; id: string; items: readonly Link[] };
type Entry = Link | Family | { name: string };

const escape = (value: string) => value.replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]!);

export const componentDrawerEntries = (entries: readonly (Link | Family)[]): readonly Entry[] =>
  [{ name: 'Components overview', href: '/components/' }, ...entries];

/** The element uses the standard drawer when its modal attribute is absent. */
export function renderSectionDrawer(path: string, label: string, entries: readonly Entry[]): string {
  const link = ({ name, href, badge }: Link) =>
    `<m-drawer-item href="${escape(href)}" value="${escape(href)}"${badge ? ` badge="${escape(badge)}"` : ''}>${escape(name)}</m-drawer-item>`;
  const items = entries.map(entry => {
    if ('href' in entry) return link(entry);
    if ('items' in entry) {
      return `<m-drawer-item value="${escape(entry.id)}">${escape(entry.name)}${entry.items.map(link).join('')}</m-drawer-item>`;
    }
    return `<m-drawer-item type="section">${escape(entry.name)}</m-drawer-item>`;
  }).join('');
  const markup = renderElement('m-drawer', { class: 'site-drawer', open: true, dense: true, value: path, 'aria-label': label }, items, renderStyles);
  // The element builds fresh interactive rows on upgrade. Native links and buttons
  // already tab in document order. CSS hides closed groups before upgrade and
  // exposes every link when scripting is unavailable.
  return markup
    .replaceAll(/ data-(?:nav-index|parent-id)="[^"]*"| tabindex="0"/g, '')
    .replaceAll('<div part="ripple" class="mtrl-ripple"></div>', '')
    .replaceAll('part="group-items" inert=""', 'part="group-items"');
}
