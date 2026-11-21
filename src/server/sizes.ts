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
