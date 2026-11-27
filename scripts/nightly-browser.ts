// The full browser suite on main, once a night (decided 2026-11-27): bun run nightly:browser
// It runs in its own worktree (worktrees/nightly, created on the first run) at origin/main, so it never touches
// the checkout someone is working in, and writes its result to analysis/nightly-browser.json in the main checkout,
// where a bump in any worktree reads it.
// A failed nightly stops the next material bump (scripts/bump-material.ts). pm2 starts it each night
// (ecosystem.config.cjs, md3.io-nightly).
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mainCheckout, nightlyFile, type NightlyStatus } from './nightly-browser-status';

const root = mainCheckout(resolve(import.meta.dir, '..'));
const tree = resolve(root, 'worktrees/nightly');
const sh = (cwd: string, ...cmd: string[]) => {
  const result = Bun.spawnSync(cmd, { cwd, stdout: 'pipe', stderr: 'pipe' });
  if (result.exitCode !== 0) throw new Error(`${cmd.join(' ')}: ${result.stderr.toString().trim()}`);
  return result.stdout.toString().trim();
};

sh(root, 'git', 'fetch', '-q', 'origin', 'main');
if (!existsSync(tree)) sh(root, 'git', 'worktree', 'add', '-q', '--detach', tree, 'origin/main');
else sh(tree, 'git', 'checkout', '-q', '--detach', 'origin/main');
const commit = sh(tree, 'git', 'rev-parse', 'HEAD');

mkdirSync(resolve(root, 'analysis'), { recursive: true });
const log = resolve(root, 'analysis/nightly-browser.log');
const started = Date.now();
const steps = [['bun', 'install', '--frozen-lockfile'], ['bun', 'run', 'build'], ['bun', 'run', 'test:browser']];
let ok = true;
const out = Bun.file(log).writer();
for (const step of steps) {
  out.write(`$ ${step.join(' ')}\n`);
  const result = Bun.spawnSync(step, { cwd: tree, stdout: 'pipe', stderr: 'pipe' });
  out.write(result.stdout); out.write(result.stderr);
  if (result.exitCode !== 0) { ok = false; out.write(`exit ${result.exitCode}\n`); break; }
}
await out.end();

const status: NightlyStatus = { ok, at: new Date().toISOString(), commit, seconds: Math.round((Date.now() - started) / 1000), log };
writeFileSync(nightlyFile(root), `${JSON.stringify(status, null, 2)}\n`);
console.log(`nightly browser suite ${ok ? 'passed' : 'FAILED'} on main ${commit.slice(0, 8)} in ${status.seconds}s`);
process.exit(ok ? 0 : 1);
