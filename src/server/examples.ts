// The Examples section: what the pages need from examples/ and from the examples build.
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import hljs from 'highlight.js';
import { root } from './content';
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
