// Isolated review harness until shared variant registration is approved.
// uptime; bun examples/spreadsheet/review.ts build <mktemp directory>
// uptime; bun examples/spreadsheet/review.ts check <same directory>
// uptime; bun examples/spreadsheet/review.ts screens <same directory> <screens directory>
import { resolve, basename } from 'node:path';
import { mkdir, readdir } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { chromium } from 'playwright';
import { handleRequest } from '../../server';
import steps from './check';
import screenshots from './screens';

const [mode, scratch, screenDir] = process.argv.slice(2);
if (!scratch?.startsWith('/tmp/')) throw new Error('Pass the absolute mktemp directory under /tmp.');
const output = resolve(scratch, 'bundle');
if (mode === 'build') {
  await mkdir(output, { recursive: true });
  const result = await Bun.build({ entrypoints: [resolve(import.meta.dir, 'vanilla.ts')], outdir: output, target: 'browser', minify: true, splitting: true });
  if (!result.success) throw new AggregateError(result.logs, 'CSV review build failed');
  for (const file of result.outputs) {
    const bytes = await file.arrayBuffer();
    console.log(`${basename(file.path)}: ${bytes.byteLength} bytes; ${gzipSync(bytes).length} gzip`);
  }
  console.log('CSV review build passed.');
} else {
  const assets = await readdir(output);
  const css = assets.filter(name => name.endsWith('.css')).map(name => `<link rel="stylesheet" href="/csv-assets/${name}">`).join('');
  const html = `<!doctype html><html lang="en" data-theme="baseline" data-theme-mode="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Spreadsheet review</title>
  ${['base', 'typography', 'button', 'text-field', 'menu', 'snackbar', 'checkbox', 'top-app-bar', 'side-sheet', 'bottom-sheet', 'dialog', 'icon-button'].map(name => `<link rel="stylesheet" href="/csv-material/${name}.css">`).join('')}
  <link rel="stylesheet" href="/styles/roboto.css"><link rel="stylesheet" href="/styles/example-frame.css"><link rel="stylesheet" href="/csv-layout.css">${css}</head><body><main id="app"></main><script type="module" src="/csv-assets/vanilla.js"></script></body></html>`;
  const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch(request) {
    const path = new URL(request.url).pathname;
    if (path === '/csv-review/') return new Response(html, { headers: { 'content-type': 'text/html' } });
    if (path === '/csv-layout.css') return new Response(Bun.file(resolve(import.meta.dir, 'styles.css')));
    if (path.startsWith('/csv-assets/')) return new Response(Bun.file(resolve(output, basename(path))));
    if (path.startsWith('/csv-material/')) return new Response(Bun.file(resolve(import.meta.dir, '../../node_modules/material/dist/styles', basename(path))));
    return handleRequest(request);
  } });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const problems: string[] = [];
    page.on('pageerror', error => problems.push(error.message));
    page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') problems.push(message.text()); });
    await page.goto(`${server.url}csv-review/`);
    page.setDefaultTimeout(8000);
    if (mode === 'screens') await screenshots(page, screenDir!);
    else await steps(page);
    if (problems.length) throw new Error(problems.join('\n'));
    console.log(`CSV review ${mode} passed.`);
  } catch (error) {
    await mkdir('/Users/jvial/Code/floor/worktrees/mtrl/briefs/flo398-screens/spreadsheet', { recursive: true });
    const page = browser.contexts()[0]?.pages()[0];
    await page?.screenshot({ path: '/Users/jvial/Code/floor/worktrees/mtrl/briefs/flo398-screens/spreadsheet/check-failure.png', fullPage: true });
    throw error;
  } finally { await browser.close(); server.stop(true); }
}
