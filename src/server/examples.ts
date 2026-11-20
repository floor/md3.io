// The Showcase section (formerly Examples): what the pages need from examples/ and from the examples build.
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import hljs from 'highlight.js';
import { renderElement } from 'material/ssr';
import { root, componentName } from './content';
import { renderStyles } from './playground-panel';
import { examples, FRAMEWORKS, exampleVariantIds, type ExampleMeta, type FrameworkId } from '../../examples';

export { examples, FRAMEWORKS };

interface Built { files: { name: string; code: string }[]; gzip: number }

const language = (name: string): string => (name.endsWith('.svelte') ? 'xml' : 'typescript');

export interface ExampleVariant {
  id: FrameworkId;
  label: string;
  gzip: number;
  files: { name: string; html: string; code: string }[];
}

export function exampleBySlug(slug: string): ExampleMeta | undefined {
  return examples.find(example => example.slug === slug);
}

/** Every component any registered example uses, in the order examples first use them. */
export const exampleComponents: string[] = [...new Set(examples.flatMap(example => example.components))];

/** Every tag any registered example carries, in the order examples first use them. */
export const exampleTags: string[] = [...new Set(examples.flatMap(example => example.tags ?? []))];

/** The registered examples that use a component ("Used in" on its component page). */
export function examplesUsingComponent(slug: string): ExampleMeta[] {
  return examples.filter(example => example.components.includes(slug));
}

const escapeChip = (value: string): string => value.replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]!);

/**
 * A server-rendered material filter-chip set for the overview gallery: one "All"
 * chip plus a chip per value. Single-select; picking the selected chip again (or
 * All) clears it, which the client treats as no filter in that group.
 */
export function filterChips(label: string, group: string, values: string[]): string {
  const chips = ['<m-chip value="all">All</m-chip>', ...values.map(value => `<m-chip value="${escapeChip(value)}">${escapeChip(componentName(value))}</m-chip>`)].join('');
  return renderElement('m-chips', { class: 'showcase-filters__chips', selection: 'single', value: 'all', scrollable: true, 'aria-label': label, 'data-filter-group': group }, chips, renderStyles);
}

/** Each framework's files, highlighted, and its bundle size. Null before the examples build ran, or for a stale build. */
export function exampleVariants(slug: string): ExampleVariant[] | null {
  const example = exampleBySlug(slug);
  // A stale folder is one that exists in `dist/` from a previous build, but the example has since been removed or renamed in code.
  if (!example) return null;
  const path = resolve(root, 'dist/examples', slug, 'sources.json');
  if (!existsSync(path)) return null;
  const built = JSON.parse(readFileSync(path, 'utf8')) as Record<string, Built>;
  const ids = exampleVariantIds(example);
  return FRAMEWORKS.filter(({ id }) => ids.includes(id) && built[id]).map(({ id, label }) => ({
    id, label, gzip: built[id]!.gzip,
    files: built[id]!.files.map(file => ({
      name: file.name, code: file.code,
      html: hljs.highlight(file.code, { language: language(file.name) }).value,
    })),
  }));
}
