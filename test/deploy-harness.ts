import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Origin the deploy script accepts. Fetch is rewritten to the local bare repo. */
export const FLOOR_MATERIAL = 'https://github.com/floor/material.git';

const repoRoot = join(import.meta.dir, '..');

export type DeployFixture = {
  root: string;
  dir: string;
  bin: string;
  materialBare: string;
  /** Tag v1. Not local main, and not origin/main. */
  materialTag: string;
  /** refs/heads/main in the server checkout. Behind origin. */
  materialLocal: string;
  /** refs/remotes/origin/main. */
  materialOrigin: string;
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

export function createDeployFixture(): DeployFixture {
  const root = mkdtempSync(join(tmpdir(), 'md3-deploy-'));
  const materialBare = join(root, 'material.git');
  const siteBare = join(root, 'md3.io.git');
  git(root, ['init', '--bare', '-q', materialBare]);
  git(root, ['init', '--bare', '-q', siteBare]);

  const materialSeed = join(root, 'seed-material');
  git(root, ['init', '-q', '-b', 'main', materialSeed]);
  writeFileSync(join(materialSeed, 'README'), 'a\n');
  writeFileSync(join(materialSeed, 'shared.txt'), 'same\n');
  git(materialSeed, ['add', 'README', 'shared.txt']);
  git(materialSeed, ['commit', '-q', '-m', 'tag']);
  const materialTag = git(materialSeed, ['rev-parse', 'HEAD']);
  git(materialSeed, ['tag', 'v1']);
  writeFileSync(join(materialSeed, 'README'), 'b\n');
  git(materialSeed, ['commit', '-q', '-am', 'local']);
  const materialLocal = git(materialSeed, ['rev-parse', 'HEAD']);
  writeFileSync(join(materialSeed, 'README'), 'c\n');
  git(materialSeed, ['commit', '-q', '-am', 'origin']);
  const materialOrigin = git(materialSeed, ['rev-parse', 'HEAD']);
  git(materialSeed, ['remote', 'add', 'origin', materialBare]);
  git(materialSeed, ['push', '-q', 'origin', 'HEAD:refs/heads/main']);
  git(materialSeed, ['push', '-q', 'origin', 'tag', 'v1']);

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
  writeFileSync(join(bin, 'bun'), '#!/bin/sh\nprintf \'bun %s\\n\' "$*" >> "$DEPLOY_STUB_LOG"\nexit 0\n');
  writeFileSync(join(bin, 'pm2'), '#!/bin/sh\nif [ "$1" = pid ]; then\n  echo 0\n  exit 0\nfi\nprintf \'pm2 %s\\n\' "$*" >> "$DEPLOY_STUB_LOG"\nexit 0\n');
  writeFileSync(join(bin, 'curl'), '#!/bin/sh\necho 200\n');
  writeFileSync(join(bin, 'ssh'), '#!/bin/sh\necho SSH_INVOKED >&2\nexit 97\n');
  for (const name of ['bun', 'pm2', 'curl', 'ssh']) chmodSync(join(bin, name), 0o755);
  writeFileSync(join(root, 'stub.log'), '');

  return { root, dir, bin, materialBare, materialTag, materialLocal, materialOrigin, site, siteLocal, siteOrigin };
}

/** An existing library checkout: local main behind origin/main. `null` removes origin. */
export function placeMaterial(fixture: DeployFixture, origin: string | null): string {
  const material = join(fixture.dir, 'material');
  git(fixture.root, ['clone', '-q', fixture.materialBare, material]);
  git(material, ['reset', '-q', '--hard', fixture.materialLocal]);
  if (git(material, ['rev-parse', 'refs/heads/main']) !== fixture.materialLocal) {
    throw new Error('fixture local main is not behind origin');
  }
  if (git(material, ['rev-parse', 'refs/remotes/origin/main']) !== fixture.materialOrigin) {
    throw new Error('fixture origin/main is not the newer commit');
  }
  if (origin === null) git(material, ['remote', 'remove', 'origin']);
  else git(material, ['remote', 'set-url', 'origin', origin]);
  return material;
}

export function trashFixture(fixture: DeployFixture): void {
  spawnSync('trash', [fixture.root]);
}

export type RemoteRun = { status: number | null; stdout: string; stderr: string };

/**
 * Dry-runs deploy.sh (so ssh is never opened), then runs that remote text with
 * bash. bun, pm2, curl, and ssh are the stubs in the fixture. Fetch of
 * floor/material is rewritten to the local bare repository.
 */
export function runRemote(fixture: DeployFixture, options: { ref: string; url?: string }): RemoteRun {
  const url = options.url ?? FLOOR_MATERIAL;
  const path = `${fixture.bin}:${process.env.PATH ?? ''}`;
  const dryEnv: Record<string, string | undefined> = {
    ...process.env,
    DRY_RUN: '1',
    DEPLOY_DIR: fixture.dir,
    LIBRARY_URL: url,
    LIBRARY_REF: options.ref,
    PATH: path,
    GIT_TERMINAL_PROMPT: '0',
  };
  delete dryEnv.DEPLOY_HOST;
  const dry = spawnSync('./scripts/deploy.sh', [], { cwd: repoRoot, encoding: 'utf8', env: dryEnv, timeout: 15000 });
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
      DEPLOY_STUB_LOG: join(fixture.root, 'stub.log'),
      GIT_TERMINAL_PROMPT: '0',
      GIT_CONFIG_COUNT: '1',
      GIT_CONFIG_KEY_0: `url.${fixture.materialBare}.insteadOf`,
      GIT_CONFIG_VALUE_0: FLOOR_MATERIAL,
      https_proxy: 'http://127.0.0.1:9',
      http_proxy: 'http://127.0.0.1:9',
      HTTPS_PROXY: 'http://127.0.0.1:9',
      HTTP_PROXY: 'http://127.0.0.1:9',
    },
  });
  return { status: run.status, stdout: run.stdout ?? '', stderr: run.stderr ?? '' };
}
