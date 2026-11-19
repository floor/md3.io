import type { ComponentSlug } from '../shared/components';

// The component families follow the directory specified in the components A–Z brief.
const families = [
  { id: 'buttons', name: 'Buttons', slugs: ['button', 'button-group', 'extended-fab', 'fab', 'fab-menu', 'icon-button', 'split-button'] },
  { id: 'date-time-pickers', name: 'Date & time pickers', slugs: ['datepicker', 'timepicker'] },
  { id: 'loading-progress', name: 'Loading & progress', slugs: ['loading-indicator', 'progress'] },
  { id: 'navigation', name: 'Navigation', slugs: ['drawer', 'navigation-bar', 'navigation-rail'] },
  { id: 'sheets', name: 'Sheets', slugs: ['bottom-sheet', 'side-sheet'] },
] as const satisfies readonly { id: string; name: string; slugs: readonly ComponentSlug[] }[];

const familyBySlug = new Map<string, (typeof families)[number]>(
  families.flatMap(family => family.slugs.map(slug => [slug, family] as const)),
);
export const componentFamilyOf = (slug: string) => familyBySlug.get(slug);

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'en');
export function componentDirectory<T extends { slug: string; name: string; href: string }>(items: readonly T[]) {
  const sorted = [...items].sort(byName);
  const sections = families.map(({ id, name }) => ({
    id, name, items: sorted.filter(item => componentFamilyOf(item.slug)?.id === id),
  })).filter(section => section.items.length);
  const others = sorted.filter(item => !componentFamilyOf(item.slug));
  return {
    entries: [...sections, ...others].sort(byName),
    sections: [...sections, { id: 'other', name: 'All other components', items: others }],
  };
}
