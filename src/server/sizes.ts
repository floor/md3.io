import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root } from './content';

// What each component costs an app, measured by scripts/sizes.ts: gzip bytes of
// minified JS and CSS, for the factory and the web component.
export interface FlavourSize { alone: number; lazy: number; added: number }
export interface ComponentSize { mtrl: string; factory: FlavourSize; element: FlavourSize }
interface SizesFile { mtrl: string; measured: string; gzip: number; core: Record<'factory' | 'element', number>; components: Record<string, Record<'factory' | 'element', FlavourSize>> }

export const sizes: SizesFile = JSON.parse(readFileSync(resolve(root, 'data/sizes.json'), 'utf8'));

export function componentSize(slug: string): ComponentSize | null {
  const size = sizes.components[slug];
  return size ? { mtrl: sizes.mtrl, ...size } : null;
}
