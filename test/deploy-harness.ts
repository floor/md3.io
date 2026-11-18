import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
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
  const root = mkdtempSync(join(tmpdir(), 'md3-deploy-'));
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
  writeFileSync(
    join(bin, 'bun'),
    '#!/bin/sh\nprintf \'bun %s\\n\' "$*" >> "$DEPLOY_STUB_LOG"\nif [ "${DEPLOY_FAIL_BUILD:-}" = 1 ] && [ "$1" = run ] && [ "$2" = build ]; then\n  exit 1\nfi\nexit 0\n',
    { mode: 0o755 },
  );
  writeFileSync(
    join(bin, 'pm2'),
    '#!/bin/sh\nif [ "$1" = pid ]; then\n  echo "${DEPLOY_PM2_PID:-0}"\n  exit 0\nfi\nprintf \'pm2 %s\\n\' "$*" >> "$DEPLOY_STUB_LOG"\nexit 0\n',
    { mode: 0o755 },
  );
  writeFileSync(join(bin, 'curl'), '#!/bin/sh\necho 200\n', { mode: 0o755 });
  writeFileSync(join(bin, 'ssh'), '#!/bin/sh\necho SSH_INVOKED >&2\nexit 97\n', { mode: 0o755 });
  const stubLog = join(root, 'stub.log');
  writeFileSync(stubLog, '');

  return { root, dir, bin, stubLog, site, siteLocal, siteOrigin };
}

export function trashFixture(fixture: DeployFixture): void {
  spawnSync('trash', [fixture.root]);
}

export type RemoteRun = { status: number | null; stdout: string; stderr: string };

/**
 * Dry-runs deploy.sh (so ssh is never opened), then runs that remote text with
 * bash. bun, pm2, curl, and ssh are the stubs in the fixture.
 */
export function runRemote(fixture: DeployFixture, options: { failBuild?: boolean; pm2Pid?: number } = {}): RemoteRun {
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
  const remote = dryOut.slice(dryOut.indexOf('\nset -euo pipefail\n') + 1);
  const run = spawnSync('bash', ['-s'], {
    cwd: repoRoot,
    input: remote,
    encoding: 'utf8',
    timeout: 20000,
    env: {
      ...process.env,
      HOME: fixture.root,
      PATH: path,
      DEPLOY_STUB_LOG: fixture.stubLog,
      DEPLOY_FAIL_BUILD: options.failBuild ? '1' : '0',
      DEPLOY_PM2_PID: String(options.pm2Pid ?? 0),
      GIT_TERMINAL_PROMPT: '0',
      https_proxy: 'http://127.0.0.1:9',
      http_proxy: 'http://127.0.0.1:9',
      HTTPS_PROXY: 'http://127.0.0.1:9',
      HTTP_PROXY: 'http://127.0.0.1:9',
    },
  });
  return { status: run.status, stdout: run.stdout ?? '', stderr: run.stderr ?? '' };
}
