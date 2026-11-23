import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = join(import.meta.dir, '..');

export type DeployFixture = {
  root: string;
  dir: string;
  bin: string;
  stubLog: string;
  site: string;
  /** Site HEAD before a run. Behind origin/main, so a reset is visible. */
  siteLocal: string;
  siteOrigin: string;
  pm2Home: string;
  runtime: string;
  pm2: string;
  socket: ReturnType<typeof Bun.listen>;
};

function git(cwd: string, args: string[]): string {
  const result = spawnSync('git', ['-c', 'commit.gpgsign=false', '-c', 'user.name=Deploy Test', '-c', 'user.email=deploy-test@example.com', ...args], {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 'Deploy Test',
      GIT_AUTHOR_EMAIL: 'deploy-test@example.com',
      GIT_COMMITTER_NAME: 'Deploy Test',
      GIT_COMMITTER_EMAIL: 'deploy-test@example.com',
      GIT_TERMINAL_PROMPT: '0',
    },
  });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} (${cwd}) failed:\n${result.stderr || result.stdout}`);
  }
  return (result.stdout ?? '').trim();
}

export function revision(repo: string): string {
  return git(repo, ['rev-parse', 'HEAD']);
}

export function readStubLog(fixture: DeployFixture): string {
  return readFileSync(fixture.stubLog, 'utf8');
}

export function createDeployFixture(): DeployFixture {
  const fixtures = join(repoRoot, 'analysis', 'deploy');
  mkdirSync(fixtures, { recursive: true });
  const root = mkdtempSync(join(fixtures, 'run-'));
  const siteBare = join(root, 'md3.io.git');
  git(root, ['init', '--bare', '-q', siteBare]);

  const siteSeed = join(root, 'seed-site');
  git(root, ['init', '-q', '-b', 'main', siteSeed]);
  writeFileSync(join(siteSeed, 'README'), 'site-a\n');
  git(siteSeed, ['add', 'README']);
  git(siteSeed, ['commit', '-q', '-m', 'site local']);
  const siteLocal = git(siteSeed, ['rev-parse', 'HEAD']);
  writeFileSync(join(siteSeed, 'README'), 'site-b\n');
  git(siteSeed, ['commit', '-q', '-am', 'site origin']);
  const siteOrigin = git(siteSeed, ['rev-parse', 'HEAD']);
  git(siteSeed, ['remote', 'add', 'origin', siteBare]);
  git(siteSeed, ['push', '-q', 'origin', 'HEAD:refs/heads/main']);

  const dir = join(root, 'home');
  const site = join(dir, 'md3.io');
  mkdirSync(dir);
  git(root, ['clone', '-q', siteBare, site]);
  git(site, ['reset', '-q', '--hard', siteLocal]);

  const bin = join(root, 'bin');
  mkdirSync(bin);
  const pm2Home = join(root, '.pm2');
  mkdirSync(pm2Home);
  writeFileSync(join(pm2Home, 'pm2.pid'), String(process.pid));
  const socket = Bun.listen({ unix: join(pm2Home, 'rpc.sock'), socket: { data() {} } });
  const runtime = join(bin, 'bun');
  const pm2 = join(bin, 'pm2');
  writeFileSync(
    runtime,
    '#!/bin/sh\nif [ "$1" = --bun ]; then\n  shift\n  exec "$@"\nfi\nprintf \'bun %s\\n\' "$*" >> "$DEPLOY_STUB_LOG"\nif [ "${DEPLOY_FAIL_BUILD:-}" = 1 ] && [ "$1" = run ] && [ "$2" = build ]; then\n  exit 1\nfi\nexit 0\n',
    { mode: 0o755 },
  );
  writeFileSync(
    pm2,
    `#!/bin/sh
printf 'pm2 %s\\n' "$*" >> "$DEPLOY_STUB_LOG"
printf 'pm2-home %s\\n' "\${PM2_HOME:-}" >> "$DEPLOY_STUB_LOG"
if [ "$1" = pid ]; then
  echo "\${DEPLOY_PM2_PID-4242}"
  exit "\${DEPLOY_FAIL_PID:-0}"
fi
if [ "$1" = reload ]; then
  if [ "\${DEPLOY_CHANGE_DAEMON:-0}" = 1 ]; then printf '%s' "$DEPLOY_REPLACEMENT_PID" > "$PM2_HOME/pm2.pid"; fi
  exit "\${DEPLOY_FAIL_RELOAD:-0}"
fi
exit 99
`,
    { mode: 0o755 },
  );
  writeFileSync(join(bin, 'curl'), '#!/bin/sh\necho 200\n', { mode: 0o755 });
  writeFileSync(join(bin, 'ssh'), '#!/bin/sh\necho SSH_INVOKED >&2\nexit 97\n', { mode: 0o755 });
  writeFileSync(join(bin, 'systemctl'), `#!/bin/sh
printf 'systemctl %s\\n' "$*" >> "$DEPLOY_STUB_LOG"
if [ "\${DEPLOY_FAIL_UNIT:-0}" = 1 ]; then exit 1; fi
state="\${DEPLOY_UNIT_STATE:-active}"
if [ "\${DEPLOY_LOSE_DAEMON:-0}" = 1 ] && grep -q '^bun run build$' "$DEPLOY_STUB_LOG"; then state=inactive; fi
echo "ActiveState=$state"
pid="\${DEPLOY_UNIT_PID}"
if [ "\${DEPLOY_CHANGE_DAEMON:-0}" = 1 ] && grep -q '^pm2 reload ' "$DEPLOY_STUB_LOG"; then pid="$DEPLOY_REPLACEMENT_PID"; fi
echo "MainPID=$pid"
`, { mode: 0o755 });
  writeFileSync(join(bin, 'git'), '#!/bin/sh\nprintf \'git %s\\n\' "$*" >> "$DEPLOY_STUB_LOG"\nexec "$DEPLOY_REAL_GIT" "$@"\n', { mode: 0o755 });
  const stubLog = join(root, 'stub.log');
  writeFileSync(stubLog, '');

  return { root, dir, bin, stubLog, site, siteLocal, siteOrigin, pm2Home, runtime, pm2, socket };
}

export function trashFixture(fixture: DeployFixture): void {
  fixture.socket.stop(true);
  spawnSync('trash', [fixture.root]);
}

export type RemoteRun = { status: number | null; stdout: string; stderr: string };

/**
 * Dry-runs deploy.sh (so ssh is never opened), then runs that remote text with
 * bash. bun, pm2, curl, and ssh are the stubs in the fixture.
 */
export type DeployOptions = {
  failBuild?: boolean; pm2Pid?: string | number; failPid?: boolean; failReload?: boolean;
  unitState?: string; failUnit?: boolean; unitPid?: number; changeDaemon?: boolean;
  missingRuntime?: boolean; missingPM2?: boolean; loseDaemon?: boolean;
};
export function runRemote(fixture: DeployFixture, options: DeployOptions = {}): RemoteRun {
  const path = `${fixture.bin}:${process.env.PATH ?? ''}`;
  const dryEnv: Record<string, string | undefined> = {
    ...process.env,
    DRY_RUN: '1',
    DEPLOY_DIR: fixture.dir,
    PATH: path,
    GIT_TERMINAL_PROMPT: '0',
  };
  delete dryEnv.DEPLOY_HOST;
  const dry = spawnSync('bash', ['./scripts/deploy.sh'], { cwd: repoRoot, encoding: 'utf8', env: dryEnv, timeout: 15000 });
  const dryOut = dry.stdout ?? '';
  const dryErr = dry.stderr ?? '';
  if ((dry.status ?? 1) !== 0 || !dryOut.includes('\nset -euo pipefail\n')) {
    return { status: dry.status, stdout: dryOut, stderr: dryErr };
  }
  // Substitute machine-specific paths, including the old script's HOME prefix,
  // so regression checks against that script cannot escape the command stubs.
  // Leave control flow intact. Never contact a server.
  const remote = dryOut.slice(dryOut.indexOf('\nset -euo pipefail\n') + 1)
    .replaceAll('export PATH="$HOME/.bun/bin:$PATH"', '')
    .replaceAll('/home/admin/.bun/bin/bun', options.missingRuntime ? join(fixture.bin, 'absent-bun') : fixture.runtime)
    .replaceAll('/home/admin/.local/share/fnm/node-versions/v18.17.1/installation/lib/node_modules/pm2/bin/pm2', options.missingPM2 ? join(fixture.bin, 'absent-pm2') : fixture.pm2)
    .replaceAll('/home/admin/.pm2', fixture.pm2Home);
  const run = spawnSync('bash', ['-s'], {
    cwd: repoRoot,
    input: remote,
    encoding: 'utf8',
    timeout: 20000,
    env: {
      ...process.env,
      PATH: path,
      DEPLOY_STUB_LOG: fixture.stubLog,
      DEPLOY_FAIL_BUILD: options.failBuild ? '1' : '0',
      DEPLOY_PM2_PID: String(options.pm2Pid ?? 4242),
      DEPLOY_FAIL_PID: options.failPid ? '1' : '0',
      DEPLOY_FAIL_RELOAD: options.failReload ? '1' : '0',
      DEPLOY_UNIT_STATE: options.unitState ?? 'active',
      DEPLOY_FAIL_UNIT: options.failUnit ? '1' : '0',
      DEPLOY_UNIT_PID: String(options.unitPid ?? process.pid),
      DEPLOY_CHANGE_DAEMON: options.changeDaemon ? '1' : '0',
      DEPLOY_REPLACEMENT_PID: String(process.ppid),
      DEPLOY_LOSE_DAEMON: options.loseDaemon ? '1' : '0',
      DEPLOY_REAL_GIT: Bun.which('git')!,
      GIT_TERMINAL_PROMPT: '0',
      https_proxy: 'http://127.0.0.1:9',
      http_proxy: 'http://127.0.0.1:9',
      HTTPS_PROXY: 'http://127.0.0.1:9',
      HTTP_PROXY: 'http://127.0.0.1:9',
    },
  });
  return { status: run.status, stdout: run.stdout ?? '', stderr: run.stderr ?? '' };
}
