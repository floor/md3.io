// Local dev: one loop that owns every rebuild and the server.
//
//   mtrl/src changes         → build mtrl, link any new dist files, build md3.io, then
//                              restart the server
//   src/client, src/shared,
//   icons change             → build md3.io, then restart the server
//   server.ts, src/server    → restart the server
//
// Steps run one at a time, and the server restarts only after its builds succeed. It
// used to run under `bun --watch`, which restarted it in the middle of mtrl's build --
// mtrl deletes dist and renames the new one in -- so it died on a missing module and,
// its watched files gone, never came back.
import { existsSync, readdirSync, realpathSync, watch } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { Subprocess } from 'bun';

const root = resolve(import.meta.dir, '..');
// node_modules/mtrl links its files one by one into the mtrl checkout; follow one link
// to find that checkout.
const mtrlRoot = dirname(realpathSync(resolve(root, 'node_modules/mtrl/package.json')));

type Step = 'mtrl' | 'link' | 'site' | 'server';
const order: Step[] = ['mtrl', 'link', 'site', 'server'];
const pending = new Set<Step>();
let running = false;
let server: Subprocess | null = null;

const build = async (label: string, cmd: string[], cwd: string) => {
  const started = performance.now();
  const code = await Bun.spawn(cmd, { cwd, stdout: 'inherit', stderr: 'inherit' }).exited;
  console.log(code === 0
    ? `${label} built in ${Math.round(performance.now() - started)} ms.`
    : `${label} build failed (exit ${code}); the server keeps the last good build.`);
  return code === 0;
};

const restart = async () => {
  if (server) {
    server.kill();
    await server.exited;
  }
  server = Bun.spawn(['bun', 'server.ts'], { cwd: root, stdout: 'inherit', stderr: 'inherit' });
  return true;
};

// Bun links file:../mtrl file by file at install time, so a file mtrl's build adds (a new
// component, a new chunk) is missing from node_modules/mtrl until the next install.
const link = async () => {
  const dist = resolve(mtrlRoot, 'dist');
  const missing = readdirSync(dist, { recursive: true, withFileTypes: true })
    .some(entry => entry.isFile() && !existsSync(resolve(root, 'node_modules/mtrl', entry.parentPath.slice(mtrlRoot.length + 1), entry.name)));
  return !missing || build('mtrl link', ['bun', 'install'], root);
};

async function drain() {
  if (running) return;
  running = true;
  while (pending.size) {
    const step = order.find(s => pending.has(s))!;
    pending.delete(step);
    const ok = step === 'mtrl' ? await build('mtrl', ['bun', 'run', 'build'], mtrlRoot)
      : step === 'link' ? await link()
      : step === 'site' ? await build('md3.io', ['bun', 'scripts/build.ts'], root)
      : await restart();
    // Nothing downstream of a failed build should pick up its result.
    if (!ok) pending.clear();
  }
  running = false;
}

// Queue a step and every step after it; a burst of changes collapses into one pass.
let timer: ReturnType<typeof setTimeout> | undefined;
const schedule = (from: Step) => {
  for (const step of order.slice(order.indexOf(from))) pending.add(step);
  clearTimeout(timer);
  timer = setTimeout(drain, 200);
};

const on = (path: string, step: Step) => watch(path, { recursive: true }, () => schedule(step));
on(resolve(mtrlRoot, 'src'), 'mtrl');
for (const dir of ['src/client', 'src/shared', 'icons']) on(resolve(root, dir), 'site');
on(resolve(root, 'src/server'), 'server');
on(resolve(root, 'server.ts'), 'server');
console.log(`Watching ${mtrlRoot}/src, src/client, src/shared, src/server, server.ts and icons.`);

schedule('site');

for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => { server?.kill(); process.exit(0); });
