// The header reader that decides whether an image is resized while it decodes.
// The fixture is smaller than the 128 px sample, so it must stay on the Image path
// (withImage.ts) and its sampled colours stay the ones check-styles already asserts.
import { describe, expect, test } from 'bun:test';
import { imageSize } from '../src/client/theme-app/features/withImage';

const jpeg = (width: number, height: number, orientation?: number) => {
  const sof = [0xff, 0xc0, 0x00, 0x0b, 0x08, height >> 8, height & 0xff, width >> 8, width & 0xff, 0x01, 0x01, 0x11, 0x00];
  if (!orientation) return new Uint8Array([0xff, 0xd8, ...sof, 0xff, 0xd9]);
  // APP1 Exif, little-endian, one short: orientation.
  const exif = [
    0xff, 0xe1, 0x00, 0x22,
    0x45, 0x78, 0x69, 0x66, 0x00, 0x00,
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00,
    0x01, 0x00,
    0x12, 0x01, 0x03, 0x00, 0x01, 0x00, 0x00, 0x00, orientation, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
  ];
  return new Uint8Array([0xff, 0xd8, ...exif, ...sof, 0xff, 0xd9]);
};

describe('image size', () => {
  test('the theme fixture is 96×64, under the 128 px sample', async () => {
    const bytes = new Uint8Array(await Bun.file(new URL('./fixtures/theme-image.png', import.meta.url)).bytes());
    expect(imageSize(bytes)).toEqual({ width: 96, height: 64 });
    expect(Math.max(96, 64)).toBeLessThanOrEqual(128);
  });

  test('a JPEG reports its SOF size, and EXIF orientations 5–8 swap the axes', () => {
    expect(imageSize(jpeg(200, 100))).toEqual({ width: 200, height: 100 });
    expect(imageSize(jpeg(200, 100, 1))).toEqual({ width: 200, height: 100 });
    expect(imageSize(jpeg(200, 100, 6))).toEqual({ width: 100, height: 200 });
    expect(imageSize(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]))).toBeNull();
  });

  test('GIF and WebP report the size in their headers', () => {
    expect(imageSize(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x10, 0x00, 0x08, 0x00]))).toEqual({ width: 16, height: 8 });
    const webp = new Uint8Array(30);
    webp.set([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x58]);
    webp[24] = 0x3f; webp[25] = 0x01; // 320 − 1
    webp[27] = 0xef; // 240 − 1
    expect(imageSize(webp)).toEqual({ width: 320, height: 240 });
  });
});
