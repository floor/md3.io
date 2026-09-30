// The site's icons and link preview, all from one mark (assets/brand/mark.svg, which the
// header shows too), drawn in a browser and committed: the server serves them from
// public/ and the deploy builds nothing. Run after changing the mark or the card below:
// `bun run brand-images`.
//
//   - favicon.svg: the mark as it is.
//   - favicon.ico: the mark at 16 and 32 px (PNG payloads in an ICO).
//   - apple-touch-icon.png: 180 px, the mark on the site's background with 12% padding,
//     square: iOS rounds the corners itself.
//   - og-image.png: the 1200×630 link preview, in vlist.io's card language.
import { chromium, type Page } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { componentSlugs } from '../src/shared/components';

const root = resolve(import.meta.dir, '..');
const publicDir = resolve(root, 'public');
const mark = readFileSync(resolve(root, 'assets/brand/mark.svg'), 'utf8');
const dataUrl = `data:image/svg+xml;base64,${Buffer.from(mark).toString('base64')}`;
const font = (file: string) => `url(data:font/woff2;base64,${readFileSync(resolve(root, 'fonts', file)).toString('base64')}) format("woff2")`;

/** The mark at a size, with padding on a background, or on nothing. */
async function renderMark(page: Page, size: number, padding = 0, background = 'transparent'): Promise<Buffer> {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0;background:${background}}img{display:block;box-sizing:border-box;width:${size}px;height:${size}px;padding:${padding}px}</style><img src="${dataUrl}" alt="">`);
  await page.locator('img').evaluate((img: HTMLImageElement) => img.decode());
  return page.screenshot({ omitBackground: background === 'transparent' });
}
/** An ICO of PNG images: a 6-byte header, a 16-byte entry per image, then the images. */
function ico(images: { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, png }, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(size % 256, entry);
    header.writeUInt8(size % 256, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...images.map(image => image.png)]);
}

// Every claim on the card is read from the source: the component count from the catalog.
const pills = [`${componentSlugs.length} components`, 'zero dependencies', 'React · Vue · Svelte · Solid'];
// The visual is Material 3's dark baseline scheme: primary, containers, outline.
const card = `<!doctype html><html><head><style>
  @font-face { font-family: DIN; font-weight: 400; src: ${font('DIN-Alternate-Regular.woff2')}; }
  @font-face { font-family: DIN; font-weight: 700; src: ${font('DIN-Alternate-Bold.woff2')}; }
  @font-face { font-family: Roboto; font-weight: 100 900; src: ${font('Roboto-latin-wght.woff2')}; }
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; overflow: hidden; font-family: DIN, sans-serif; color: #f3f3f7;
    background: radial-gradient(ellipse 900px 700px at 12% 0%, #1b2042 0%, #0f1020 45%, #09090c 100%); position: relative; }
  .text { position: absolute; left: 90px; top: 92px; }
  .eyebrow { font-size: 28px; letter-spacing: 4px; color: #8a8fa8; }
  .wordmark { font-size: 188px; font-weight: 700; letter-spacing: -6px; line-height: 1; margin: 30px 0 22px 0; white-space: nowrap; }
  /* About the cap height; middle centres it on the x-height (baseline + half the x-height). */
  .mark { width: 132px; height: 132px; margin-right: 26px; vertical-align: middle; }
  .dot { display: inline-block; width: 34px; height: 34px; border-radius: 50%; margin-left: 18px; background: linear-gradient(135deg, #8da0f2, #d0bcff); }
  .tagline { font-size: 44px; line-height: 1.3; color: #b4b8cc; }
  .pills { display: flex; gap: 12px; margin-top: 44px; }
  .pill { font-size: 20px; padding: 11px 18px; border-radius: 999px; border: 1.5px solid #262a3a; background: rgba(255,255,255,.03); color: #dcdde6; white-space: nowrap; }
  .panel { position: absolute; left: 830px; top: 72px; width: 310px; height: 486px; border-radius: 28px; background: #141218; border: 1.5px solid #2b2930;
    padding: 32px; display: flex; flex-direction: column; gap: 30px; font-family: Roboto, sans-serif; }
  .row { display: flex; align-items: center; gap: 14px; }
  .button { height: 52px; padding: 0 22px; border-radius: 26px; font-size: 18px; white-space: nowrap; font-weight: 500; display: flex; align-items: center; }
  .filled { background: #d0bcff; color: #381e72; }
  .tonal { background: #4a4458; color: #e8def8; }
  .switch { width: 64px; height: 38px; border-radius: 19px; position: relative; }
  .switch::after { content: ''; position: absolute; top: 50%; border-radius: 50%; transform: translateY(-50%); }
  .on { background: #d0bcff; } .on::after { right: 5px; width: 28px; height: 28px; background: #381e72; }
  .off { background: #36343b; border: 2.5px solid #938f99; } .off::after { left: 6px; width: 19px; height: 19px; background: #938f99; }
  .chip { height: 40px; padding: 0 16px; border-radius: 10px; font-size: 17px; font-weight: 500; display: flex; align-items: center; gap: 8px; }
  .selected { background: #4a4458; color: #e8def8; } .outlined { border: 1.5px solid #938f99; color: #cac4d0; }
  .slider { display: flex; align-items: center; gap: 6px; height: 44px; }
  .slider i { display: block; height: 16px; border-radius: 8px; }
  .slider .active { width: 150px; background: #d0bcff; border-radius: 8px 3px 3px 8px; }
  .slider .handle { width: 5px; height: 44px; border-radius: 3px; background: #d0bcff; }
  .slider .inactive { flex: 1; background: #4a4458; border-radius: 3px 8px 8px 3px; }
  .list { display: flex; flex-direction: column; gap: 12px; }
  .list i { display: block; height: 14px; border-radius: 7px; background: #2b2930; }
  .fab { position: absolute; right: 30px; bottom: 30px; width: 84px; height: 84px; border-radius: 24px; background: #4f378b; display: grid; place-items: center; }
  .fab::before, .fab::after { content: ''; position: absolute; background: #eaddff; border-radius: 2px; }
  .fab::before { width: 30px; height: 4px; } .fab::after { width: 4px; height: 30px; }
</style></head><body>
  <div class="text">
    <div class="eyebrow">MD3.IO</div>
    <div class="wordmark"><img class="mark" src="${dataUrl}" alt="">mtrl<span class="dot"></span></div>
    <div class="tagline">Material Design 3<br>for every framework.</div>
    <div class="pills">${pills.map(pill => `<span class="pill">${pill}</span>`).join('')}</div>
  </div>
  <div class="panel">
    <div class="row"><span class="button filled">Get started</span><span class="button tonal">Docs</span></div>
    <div class="row"><span class="switch on"></span><span class="switch off"></span></div>
    <div class="row"><span class="chip selected">✓ Filter</span><span class="chip outlined">Assist</span></div>
    <div class="slider"><i class="active"></i><i class="handle"></i><i class="inactive"></i></div>
    <div class="list"><i style="width: 80%"></i><i style="width: 56%"></i></div>
    <span class="fab"></span>
  </div>
</body></html>`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  writeFileSync(resolve(publicDir, 'favicon.svg'), mark);
  const [png16, png32] = [await renderMark(page, 16), await renderMark(page, 32)];
  writeFileSync(resolve(publicDir, 'favicon.ico'), ico([{ size: 16, png: png16 }, { size: 32, png: png32 }]));
  writeFileSync(resolve(publicDir, 'apple-touch-icon.png'), await renderMark(page, 180, Math.round(180 * 0.12), '#0c0c10'));
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(card);
  await page.evaluate(() => Promise.all([document.fonts.ready, ...[...document.images].map(img => img.decode())]));
  // The text keeps clear of the panel, and the panel of the card's edge.
  const overflow = await page.evaluate(() => {
    const [text, panel] = ['.text', '.panel'].map(selector => document.querySelector(selector)!.getBoundingClientRect());
    return text!.right > panel!.left - 30 || panel!.right > 1200 - 40;
  });
  if (overflow) throw new Error('The card\'s text runs into the panel or off the card: shorten it.');
  writeFileSync(resolve(publicDir, 'og-image.png'), await page.screenshot());
  console.log(`Wrote favicon.ico, apple-touch-icon.png and og-image.png to public/ (${pills.join(', ')}).`);
}
finally {
  await browser.close();
}
