// Fetch the official Material Symbols used by the examples into icons/.
// `bun run icons` after adding a name below; the SVGs are committed, so the site never
// fetches at build time. Source: the Google Fonts icon CDN (Apache 2.0), the same files
// fonts.google.com/icons downloads.
import { mkdir, readdir, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';

// Symbol names exactly as fonts.google.com/icons spells them.
const names = [
  'account_circle', 'add', 'bookmark', 'check', 'close', 'download', 'edit', 'favorite', 'format_bold', 'format_italic',
  'format_underlined', 'inbox', 'menu', 'send', 'volume_off', 'volume_up',
  // The device chooser (src/client/device-frame.ts).
  'smartphone', 'tablet', 'desktop_windows', 'screen_rotation',
  // The Themes app's bar (src/client/theme-app/).
  'share',
];
// Rounded, weight 400, grade 0, optical size 24: the Google Fonts defaults for the
// Rounded style. Each symbol comes outlined (`name.svg`) and filled (`name-fill.svg`),
// the second for selected states.
const style = 'materialsymbolsrounded';
const variants = { '': 'default', '-fill': 'fill1' } as const;

const outdir = resolve(import.meta.dir, '../icons');
await mkdir(outdir, { recursive: true });

// The CDN serves `<svg xmlns height width viewBox>`; give every icon the same root so it
// takes the text colour and stays out of the accessibility tree.
const normalize = (svg: string) => svg.trim().replace(/^<svg[^>]*>/, '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true">');

const wanted = new Set<string>();
await Promise.all(names.flatMap(name => Object.entries(variants).map(async ([suffix, variant]) => {
  const url = `https://fonts.gstatic.com/s/i/short-term/release/${style}/${name}/${variant}/24px.svg`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${name} (${variant}): ${response.status} from ${url}`);
  const file = `${name}${suffix}.svg`;
  wanted.add(file);
  await Bun.write(resolve(outdir, file), normalize(await response.text()) + '\n');
})));

for (const file of await readdir(outdir)) {
  if (file.endsWith('.svg') && !wanted.has(file)) await unlink(resolve(outdir, file));
}
console.log(`Fetched ${wanted.size} Material Symbols into icons/.`);
