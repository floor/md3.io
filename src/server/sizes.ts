import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root } from './content';
import { isAddon } from '../shared/addons';
import { materialSizes } from './material-sizes';

// What each component costs an app, measured by scripts/sizes.ts: gzip bytes of
// minified JS and CSS, for the factory and the web component.
export interface FlavourSize { alone: number; lazy: number; added: number }
export interface ComponentSize { material: string; addons?: string; factory: FlavourSize; element?: FlavourSize }
interface SizesFile { material: string; measured: string; gzip: number; core: Record<'factory' | 'element', number>; components: Record<string, Record<'factory' | 'element', FlavourSize>> }

export const sizes: SizesFile = JSON.parse(readFileSync(resolve(root, 'data/sizes.json'), 'utf8'));

/** The home page's tree-shaking figures, from material's own measurement (material-sizes.ts),
 * JavaScript, gzip: the core a page loads once, then what each component adds over it. */
export function treeShaking(names: Record<string, string>, groups: readonly (readonly [string, readonly string[]])[]) {
  const { version, date, rows } = materialSizes(sizes.material);
  const kb = (cell: string) => Math.abs(Number.parseFloat(cell));
  // The components the site shows (material also measures bottom-app-bar, which it does not).
  const measured = rows.filter(row => row.slug);
  const added = measured.map(row => kb(row.vsCore));
  const max = Math.max(...added);
  return {
    version, measured: date, count: measured.length, core: kb(rows.find(row => row.name === 'core')!.gzip).toFixed(1),
    min: Math.min(...added).toFixed(1), max: max.toFixed(1),
    // Two components per category, each bar what it adds over the core.
    groups: groups.map(([label, picks]) => ({ label, rows: picks.flatMap(slug => measured.filter(row => row.slug === slug))
      .map(row => ({ name: names[row.slug!] ?? row.name, kb: kb(row.vsCore).toFixed(1), share: kb(row.vsCore) / max })) })),
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
