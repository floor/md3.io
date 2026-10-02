// A theme from an image, made in the browser: the image is never uploaded. It is drawn
// at most 128 px on a side, quantised (Celebi, then Score, as M3's wallpaper theming
// does), and its best seed becomes a Tonal Spot theme through the same engine and
// mtrl's schemeToTokens (src/shared/theme-engine.ts). The engine and
// material-color-utilities load on the first image or `?seed=`, never with the page.
import type { App } from '../core/foundation';
import type { ThemeData } from './withThemeSource';

const SIDE = 128;
const engine = () => import('../../../shared/theme-engine');

/** Width and height as the browser will draw them. JPEG's SOF is before EXIF rotation, so orientations 5–8 swap the two. */
export const imageSize = (bytes: Uint8Array): { width: number; height: number } | null =>
  pngSize(bytes) ?? gifSize(bytes) ?? bmpSize(bytes) ?? webpSize(bytes) ?? jpegSize(bytes);

const u16 = (bytes: Uint8Array, offset: number, little: boolean) =>
  little ? bytes[offset]! | (bytes[offset + 1]! << 8) : (bytes[offset]! << 8) | bytes[offset + 1]!;
const u32 = (bytes: Uint8Array, offset: number, little: boolean) => little
  ? (bytes[offset]! | (bytes[offset + 1]! << 8) | (bytes[offset + 2]! << 16) | (bytes[offset + 3]! << 24)) >>> 0
  : ((bytes[offset]! << 24) | (bytes[offset + 1]! << 16) | (bytes[offset + 2]! << 8) | bytes[offset + 3]!) >>> 0;

const pngSize = (bytes: Uint8Array) => {
  if (bytes.length < 24 || bytes[0] !== 0x89 || bytes[1] !== 0x50 || bytes[2] !== 0x4e || bytes[3] !== 0x47) return null;
  const width = u32(bytes, 16, false), height = u32(bytes, 20, false);
  return width && height ? { width, height } : null;
};
const gifSize = (bytes: Uint8Array) => {
  if (bytes.length < 10 || bytes[0] !== 0x47 || bytes[1] !== 0x49 || bytes[2] !== 0x46) return null;
  const width = u16(bytes, 6, true), height = u16(bytes, 8, true);
  return width && height ? { width, height } : null;
};
const bmpSize = (bytes: Uint8Array) => {
  if (bytes.length < 26 || bytes[0] !== 0x42 || bytes[1] !== 0x4d || u32(bytes, 14, true) < 40) return null;
  const width = u32(bytes, 18, true);
  const height = Math.abs(u32(bytes, 22, true) > 0x7fffffff ? u32(bytes, 22, true) - 0x100000000 : u32(bytes, 22, true));
  return width && height ? { width, height } : null;
};
const webpSize = (bytes: Uint8Array) => {
  if (bytes.length < 30 || bytes[0] !== 0x52 || bytes[1] !== 0x49 || bytes[2] !== 0x46 || bytes[3] !== 0x46 || bytes[8] !== 0x57 || bytes[9] !== 0x45 || bytes[10] !== 0x42 || bytes[11] !== 0x50) return null;
  const kind = String.fromCharCode(bytes[12]!, bytes[13]!, bytes[14]!, bytes[15]!);
  if (kind === 'VP8X') return { width: 1 + (bytes[24]! | (bytes[25]! << 8) | (bytes[26]! << 16)), height: 1 + (bytes[27]! | (bytes[28]! << 8) | (bytes[29]! << 16)) };
  if (kind === 'VP8 ' && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a)
    return { width: u16(bytes, 26, true) & 0x3fff, height: u16(bytes, 28, true) & 0x3fff };
  if (kind === 'VP8L' && bytes[20] === 0x2f) {
    const bits = u32(bytes, 21, true);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  return null;
};
/** EXIF orientation in an APP1 payload, or null when this segment isn't Exif. */
const exifOrientation = (bytes: Uint8Array, start: number, length: number): number | null => {
  if (length < 16 || bytes[start] !== 0x45 || bytes[start + 1] !== 0x78 || bytes[start + 2] !== 0x69 || bytes[start + 3] !== 0x66 || bytes[start + 4] !== 0 || bytes[start + 5] !== 0) return null;
  const tiff = start + 6;
  const little = bytes[tiff] === 0x49 && bytes[tiff + 1] === 0x49;
  if (!little && !(bytes[tiff] === 0x4d && bytes[tiff + 1] === 0x4d)) return null;
  if (u16(bytes, tiff + 2, little) !== 42) return null;
  const ifd = tiff + u32(bytes, tiff + 4, little);
  if (ifd < start || ifd + 2 > start + length) return null;
  const count = u16(bytes, ifd, little);
  for (let n = 0; n < count; n++) {
    const entry = ifd + 2 + n * 12;
    if (entry + 12 > start + length) return null;
    if (u16(bytes, entry, little) === 0x0112) return u16(bytes, entry + 8, little);
  }
  return null;
};
const jpegSize = (bytes: Uint8Array) => {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let orientation = 1;
  let size: { width: number; height: number } | null = null;
  for (let i = 2; i + 3 < bytes.length;) {
    if (bytes[i] !== 0xff) break;
    const marker = bytes[i + 1]!;
    if (marker === 0xff) { i++; continue; }
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) { i += 2; continue; }
    const length = u16(bytes, i + 2, false);
    if (length < 2 || i + 2 + length > bytes.length) break;
    if (marker === 0xe1) orientation = exifOrientation(bytes, i + 4, length - 2) ?? orientation;
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc && length >= 7) {
      const height = u16(bytes, i + 5, false), width = u16(bytes, i + 7, false);
      if (width && height) size = { width, height };
    }
    i += 2 + length;
  }
  if (!size) return null;
  return orientation >= 5 && orientation <= 8 ? { width: size.height, height: size.width } : size;
};

const fitted = (width: number, height: number) => {
  const scale = Math.min(1, SIDE / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
};
const readPixels = (source: CanvasImageSource, width: number, height: number): Uint8ClampedArray => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true })!;
  context.drawImage(source, 0, 0, width, height);
  return context.getImageData(0, 0, width, height).data;
};
/** The previous decode: the image element, then a canvas of at most SIDE px. A small image stays here, so its samples do not change. */
async function pixelsFromImage(file: Blob): Promise<Uint8ClampedArray> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const size = fitted(image.naturalWidth, image.naturalHeight);
    return readPixels(image, size.width, size.height);
  } finally { URL.revokeObjectURL(url); }
}

/** The image's pixels, at most SIDE px on a side, as RGBA bytes. A large photo is resized while it decodes. */
async function pixelsOf(file: Blob): Promise<Uint8ClampedArray> {
  const head = new Uint8Array(await file.slice(0, 65536).arrayBuffer());
  const size = imageSize(head) ?? (head.length < file.size ? imageSize(new Uint8Array(await file.arrayBuffer())) : null);
  const target = size ? fitted(size.width, size.height) : null;
  if (size && target && (target.width < size.width || target.height < size.height) && typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { resizeWidth: target.width, resizeHeight: target.height, resizeQuality: 'high', imageOrientation: 'from-image' });
      try { return readPixels(bitmap, target.width, target.height); }
      finally { bitmap.close(); }
    } catch { /* no createImageBitmap, or it rejected the resize: decode as before */ }
  }
  return pixelsFromImage(file);
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
      origin: `seed ${seed}, Tonal Spot`, spec: { seed, variant: 'tonal-spot', contrast: 0 }, palettes: colors.palettes, handSeed: null,
    };
  };
  let request = 0;
  /** Shows the theme of a seed, with "From image" in the select, unless a newer image came first.
   *  `ticket` belongs to a load already counted; a call without one takes the next. */
  const show = async (seed: string, ticket?: number) => {
    const mine = ticket ?? ++request;
    const theme = await fromSeed(seed);
    if (mine !== request) return;
    ui.theme.setOptions([...source.listed.map((t: ThemeData) => ({ id: t.name, text: t.label })), entry(seed)]);
    source.add(theme);
  };
  return {
    ...app,
    image: {
      show,
      /** An image file: its best seed, shown, and said. A newer file wins, even if this one finishes last. */
      load: async (file: File) => {
        if (!file.type.startsWith('image/')) return copy.tell(`${file.name} is not an image`);
        const ticket = ++request;
        try {
          const [pixels, { argbFromRgba, seedsFromPixels }] = await Promise.all([pixelsOf(file), engine()]);
          if (ticket !== request) return;
          const seed = seedsFromPixels(argbFromRgba(pixels), 4)[0]!;
          await show(seed, ticket);
          if (ticket !== request) return;
          copy.tell(`Theme generated from ${file.name} · seed ${seed}`);
        } catch { if (ticket === request) copy.tell(`Could not read ${file.name}`); }
      },
    },
  };
};
