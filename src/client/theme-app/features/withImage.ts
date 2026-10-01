// A theme from an image, made in the browser: the image is never uploaded. It is drawn
// at most 128 px on a side, quantised (Celebi, then Score, as M3's wallpaper theming
// does), and its best seed becomes a Tonal Spot theme through the same engine and
// mtrl's schemeToTokens (src/shared/theme-engine.ts). The engine and
// material-color-utilities load on the first image or `?seed=`, never with the page.
import type { App } from '../core/foundation';
import type { ThemeData } from './withThemeSource';

const SIDE = 128;
const engine = () => import('../../../shared/theme-engine');

/** The image's pixels, at most SIDE px on a side, as RGBA bytes. */
async function pixelsOf(file: Blob): Promise<Uint8ClampedArray> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, SIDE / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d', { willReadFrequently: true })!;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return context.getImageData(0, 0, canvas.width, canvas.height).data;
  } finally { URL.revokeObjectURL(url); }
}

/** The select's entry for a theme made here: its seed as a swatch. */
const entry = (seed: string) => ({ id: 'image', text: 'From image', icon: `<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="${seed}"/></svg>` });

export const withImage = () => (app: App) => {
  const { roles, ui, source, copy } = app;
  /** A Tonal Spot theme from a seed, in the shape the built-in themes have. */
  const fromSeed = async (seed: string): Promise<ThemeData> => {
    const { themeColors } = await engine();
    const colors = themeColors({ source: seed, variant: 'tonal-spot', contrast: 0 });
    return {
      name: 'image', label: 'From image', seed,
      light: (roles as string[]).map(role => colors.roles.light[role]!),
      dark: (roles as string[]).map(role => colors.roles.dark[role]!),
      origin: `seed ${seed}, Tonal Spot`, palettes: colors.palettes,
    };
  };
  /** Shows the theme of a seed, with "From image" in the select. */
  const show = async (seed: string) => {
    const theme = await fromSeed(seed);
    ui.theme.setOptions([...source.themes.map((t: ThemeData) => ({ id: t.name, text: t.label })), entry(seed)]);
    source.add(theme);
  };
  return {
    ...app,
    image: {
      show,
      /** An image file: its best seed, shown, and said. */
      load: async (file: File) => {
        if (!file.type.startsWith('image/')) return copy.tell(`${file.name} is not an image`);
        try {
          const [pixels, { argbFromRgba, seedsFromPixels }] = await Promise.all([pixelsOf(file), engine()]);
          const seed = seedsFromPixels(argbFromRgba(pixels), 4)[0]!;
          await show(seed);
          copy.tell(`Theme generated from ${file.name} · seed ${seed}`);
        } catch { copy.tell(`Could not read ${file.name}`); }
      },
    },
  };
};
