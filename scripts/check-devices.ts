// The device chooser (src/client/device-frame.ts) on an example page, in Chromium:
// Mobile gives the frame a 390 px window and Rotate an 844 px one, Desktop fills the
// container, the choice survives a reload, and on a 390 px phone the Mobile frame is
// scaled to fit with no horizontal scroll.
// BASE_URL checks a running server; without it the check serves the site itself.
import { chromium } from 'playwright';
import { examples } from '../examples';

const server = process.env.BASE_URL ? null : Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: (await import('../server')).handleRequest });
const base = (process.env.BASE_URL ?? server!.url.href).replace(/\/$/, '');
const browser = await chromium.launch();
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
async function until<T>(read: () => Promise<T>, want: T, message: string) {
  let got: T | undefined;
  for (let i = 0; i < 50; i++) { got = await read(); if (got === want) return; await new Promise(resolve => setTimeout(resolve, 100)); }
  throw new Error(`${message}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
}
const url = `${base}/examples/${examples[0]!.slug}/`;
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'dark' });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  console.log(`Checking the device chooser on ${url}`);
  await page.goto(url);
  const bar = page.locator('.example-preview .device__bar');
  const group = bar.getByRole('group', { name: 'Example device' }).or(bar.locator('.mtrl-button-group'));
  await group.first().waitFor();
  const frameWidth = () => page.locator('#example-frame').evaluate(frame => (frame as HTMLIFrameElement).contentWindow!.innerWidth);
  const deviceButton = (name: string) => bar.getByRole('button', { name, exact: true });

  // Desktop (the default) fills the container.
  const fills = () => page.evaluate(() => {
    const frame = document.querySelector('#example-frame')!.getBoundingClientRect();
    const panel = document.querySelector('.example-preview')!.getBoundingClientRect();
    return Math.abs(frame.width - panel.width) <= 2;
  });
  assert(await page.locator('.device').getAttribute('data-device') === 'desktop', 'Desktop is the default');
  assert(await fills(), 'Desktop fills the container');

  await deviceButton('Mobile').click();
  await until(frameWidth, 390, 'Mobile gives the frame a 390 px window');
  assert(await bar.locator('.device__size').textContent() === '390 × 844', 'The size is shown, unscaled at 1440 px');
  await bar.getByRole('button', { name: 'Rotate' }).click();
  await until(frameWidth, 844, 'Rotate gives the frame an 844 px window');
  await bar.getByRole('button', { name: 'Rotate' }).click();
  await until(frameWidth, 390, 'Rotating back gives 390 px again');

  await deviceButton('Tablet').click();
  await until(frameWidth, 820, 'Tablet gives the frame an 820 px window');

  // The choice is remembered.
  await deviceButton('Mobile').click();
  await page.reload();
  await until(() => page.locator('.device').getAttribute('data-device'), 'mobile', 'The choice survives a reload');
  await until(frameWidth, 390, 'Mobile again after the reload');

  await deviceButton('Desktop').click();
  await until(fills, true, 'Desktop fills the container again');
  assert(!errors.length, `No errors: ${errors.join('; ')}`);

  // A phone: Mobile is scaled to fit, and the page does not scroll sideways.
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light' });
  const small = await phone.newPage();
  await small.addInitScript(() => { try { localStorage.setItem('md3-device', JSON.stringify({ device: 'mobile', landscape: false })); } catch { /* */ } });
  await small.goto(url);
  await until(() => small.locator('#example-frame').evaluate(frame => (frame as HTMLIFrameElement).contentWindow!.innerWidth), 390, 'Mobile on a phone keeps a 390 px window');
  const scaled = await small.locator('.device__size').textContent();
  assert(/· \d+%$/.test(scaled ?? ''), `Mobile on a phone is scaled, and says so: ${scaled}`);
  const overflow = await small.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert(overflow <= 0, `No horizontal scroll at 390 px, got ${overflow}px`);
  await phone.close();
  console.log(`Device chooser: Mobile 390, rotated 844, Tablet 820, Desktop fills, remembered; on a phone ${scaled}`);
} finally {
  await browser.close();
  server?.stop(true);
}
