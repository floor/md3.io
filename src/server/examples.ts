// The Examples section: what the pages need from examples/ and from the examples build.
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import hljs from 'highlight.js';
import { root } from './content';
import { examples, FRAMEWORKS, type ExampleMeta, type FrameworkId } from '../../examples';

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

/** Each framework's files, highlighted, and its bundle size. Null before the examples build ran. */
export function exampleVariants(slug: string): ExampleVariant[] | null {
  const path = resolve(root, 'dist/examples', slug, 'sources.json');
  if (!existsSync(path)) return null;
  const built = JSON.parse(readFileSync(path, 'utf8')) as Record<string, Built>;
  return FRAMEWORKS.filter(({ id }) => built[id]).map(({ id, label }) => ({
    id, label, gzip: built[id]!.gzip,
    files: built[id]!.files.map(file => ({
      name: file.name, code: file.code,
      html: hljs.highlight(file.code, { language: language(file.name) }).value,
    })),
  }));
}
