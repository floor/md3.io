import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root } from './content';
import { isAddon } from '../shared/addons';

// What each component costs an app, measured by scripts/sizes.ts: gzip bytes of
// minified JS and CSS, for the factory and the web component.
export interface FlavourSize { alone: number; lazy: number; added: number }
export interface ComponentSize { material: string; addons?: string; factory: FlavourSize; element?: FlavourSize }
interface SizesFile { material: string; measured: string; gzip: number; core: Record<'factory' | 'element', number>; components: Record<string, Record<'factory' | 'element', FlavourSize>> }

export const sizes: SizesFile = JSON.parse(readFileSync(resolve(root, 'data/sizes.json'), 'utf8'));

/** The home page's tree-shaking figures: what a page that imports one component loads (JS + CSS, gzip). */
export function treeShaking(names: Record<string, string>, picks: readonly string[]) {
  const kb = (bytes: number) => (bytes / 1024).toFixed(1);
  const alone = Object.values(sizes.components).map(size => size.factory.alone);
  return {
    version: sizes.material, measured: sizes.measured, count: alone.length,
    min: kb(Math.min(...alone)), max: kb(Math.max(...alone)),
    rows: picks.filter(slug => sizes.components[slug]).map(slug => ({ name: names[slug] ?? slug, kb: kb(sizes.components[slug]!.factory.alone), share: sizes.components[slug]!.factory.alone / Math.max(...alone) })),
  };
}

type AddonSizesFile = Omit<SizesFile, 'components'> & {
  addons: string;
  components: Record<string, Omit<ComponentSize, 'material' | 'addons'>>;
};
const addonFile = resolve(root, 'data/addon-sizes.json');
export const addonSizes: AddonSizesFile | undefined = existsSync(addonFile) ? JSON.parse(readFileSync(addonFile, 'utf8')) : undefined;

export function componentSize(slug: string): ComponentSize | null {
  const table = isAddon(slug) ? addonSizes : sizes;
  const size = table?.components[slug];
  return table && size ? { material: table.material, ...('addons' in table ? { addons: table.addons } : {}), ...size } : null;
}
