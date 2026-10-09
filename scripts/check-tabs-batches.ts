// One check-tabs process per batch of components. Closing the pages inside a
// process left the renderer's memory in place; the process exiting releases it.
import { resolve } from 'node:path';
import { eligibleTabComponents } from './check-tabs-eligible';
import { checkTabsBatch, checkTabsBatches, checkTabsOnlyBatch, checkTabsSlugs } from './check-tabs-options';

const root = resolve(import.meta.dir, '..');
const summaryLine = /^Tab checks passed: (\d+) mounts over (\d+) scenarios, (\d+) of (\d+) components, roots and text\.$/;

const selected = checkTabsSlugs(process.env.CHECK_TABS, eligibleTabComponents());
if (!selected.ok) {
  console.error(selected.error);
  process.exit(1);
}

const batches = checkTabsBatches(selected.slugs, checkTabsBatch(process.env.CHECK_TABS_BATCH));
if (batches.length === 0) {
  console.error('CHECK_TABS names no component');
  process.exit(1);
}
const only = checkTabsOnlyBatch(process.env.CHECK_TABS_ONLY_BATCH);
if (!only.ok) {
  console.error(only.error);
  process.exit(1);
}

let chosen = batches;
if (only.index !== undefined) {
  const batch = batches[only.index - 1];
  if (!batch) {
    console.error(`CHECK_TABS_ONLY_BATCH ${only.index} is past ${batches.length} ${batches.length === 1 ? 'batch' : 'batches'}`);
    process.exit(1);
  }
  console.log(`batch ${only.index}/${batches.length}: ${batch.join(', ')}`);
  chosen = [batch];
}

type Summary = { mounts: number; scenarios: number; ran: number; eligible: number };

function readSummary(text: string): Summary | undefined {
  let found: Summary | undefined;
  for (const line of text.split('\n')) {
    const match = summaryLine.exec(line.trim());
    if (!match) continue;
    if (found) return undefined;
    found = { mounts: Number(match[1]), scenarios: Number(match[2]), ran: Number(match[3]), eligible: Number(match[4]) };
  }
  return found;
}

async function readAndForward(stream: ReadableStream<Uint8Array<ArrayBuffer>>, write: (chunk: Uint8Array<ArrayBuffer>) => void): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let text = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    write(value);
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  return text;
}

let mounts = 0;
let scenarios = 0;
let ran = 0;
let eligible: number | undefined;

for (const batch of chosen) {
  const proc = Bun.spawn([process.execPath, 'scripts/check-tabs.ts'], {
    cwd: root,
    env: { ...process.env, CHECK_TABS: batch.join(',') },
    stdin: 'ignore',
    stdout: 'pipe',
    stderr: 'pipe',
  });
  // Forward as the bytes arrive, so the pace lines show during the batch, and
  // keep the text so the summary below can be summed.
  const [text] = await Promise.all([
    readAndForward(proc.stdout, chunk => { process.stdout.write(chunk); }),
    readAndForward(proc.stderr, chunk => { process.stderr.write(chunk); }),
  ]);
  const code = await proc.exited;
  if (code !== 0) process.exit(code);
  const summary = readSummary(text);
  if (!summary) {
    console.error('check-tabs exited 0 without its summary line');
    process.exit(1);
  }
  if (eligible === undefined) eligible = summary.eligible;
  else if (eligible !== summary.eligible) {
    console.error(`summary eligible count changed from ${eligible} to ${summary.eligible}`);
    process.exit(1);
  }
  mounts += summary.mounts;
  scenarios += summary.scenarios;
  ran += summary.ran;
}

if (eligible === undefined) {
  console.error('check-tabs exited 0 without its summary line');
  process.exit(1);
}
console.log(`Tab checks passed: ${mounts} mounts over ${scenarios} scenarios, ${ran} of ${eligible} components, roots and text.`);
