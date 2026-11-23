import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'bun:test';
import { createDeployFixture, readStubLog, revision, runRemote, trashFixture, type DeployOptions } from './deploy-harness';

describe('deploy script', () => {
  const slow = (name: string, fn: () => void) => test(name, fn, 20_000);

  slow('dry run targets floor-vps, prints preflight before mutation, and never opens ssh', () => {
    const fixture = createDeployFixture();
    try {
    const result = spawnSync('bash', ['./scripts/deploy.sh'], {
      encoding: 'utf8', timeout: 15_000,
      env: { ...process.env, DRY_RUN: '1', DEPLOY_HOST: '', DEPLOY_DIR: '', PATH: `${fixture.bin}:${process.env.PATH}` },
    });
    expect(result.status).toBe(0);
    expect(result.stderr).not.toContain('SSH_INVOKED');
    const out = result.stdout;
    expect(out).toContain('host: admin@46.226.104.226');
    expect(out).toContain('directory: /home/floor');
    expect(out).toContain('/home/admin/.bun/bin/bun');
    expect(out).toContain('/home/admin/.local/share/fnm/node-versions/v18.17.1/installation/lib/node_modules/pm2/bin/pm2');
    expect(out).toContain('/home/admin/.pm2');
    expect(out.indexOf('pm2 pid md3.io')).toBeLessThan(out.indexOf('git fetch -q origin main'));
    expect(out.indexOf('git fetch -q origin main')).toBeLessThan(out.indexOf('git reset -q --hard origin/main'));
    expect(out.indexOf('install --frozen-lockfile')).toBeLessThan(out.indexOf('run build'));
    expect(out.indexOf('run build')).toBeLessThan(out.indexOf('pm2 reload md3.io'));
    expect(out).not.toMatch(/pm2 start|pm2 resurrect|pm2 restart/);
    } finally { trashFixture(fixture); }
  });

  slow('SSH receives exactly the dry-run script and the overridden host', () => {
    const fixture = createDeployFixture();
    try {
      const captured = join(fixture.root, 'ssh-input');
      writeFileSync(join(fixture.bin, 'ssh'), '#!/bin/sh\nprintf \'%s\\n\' "$*" > "$DEPLOY_SSH_ARGS"\ncat > "$DEPLOY_SSH_INPUT"\nexit 97\n', { mode: 0o755 });
      const env = { ...process.env, DRY_RUN: '', DEPLOY_HOST: 'deploy@example.test', DEPLOY_DIR: fixture.dir,
        PATH: `${fixture.bin}:${process.env.PATH}`, DEPLOY_SSH_ARGS: `${captured}.args`, DEPLOY_SSH_INPUT: captured };
      const dry = spawnSync('bash', ['./scripts/deploy.sh'], { encoding: 'utf8', env: { ...env, DRY_RUN: '1' } });
      expect(dry.status).toBe(0);
      expect(existsSync(captured)).toBe(false);
      const run = spawnSync('bash', ['./scripts/deploy.sh'], { encoding: 'utf8', env });
      expect(run.status).toBe(97);
      const remote = dry.stdout.slice(dry.stdout.indexOf('\nset -euo pipefail\n') + 1);
      expect(readFileSync(captured, 'utf8').trimEnd()).toBe(remote.trimEnd());
      expect(readFileSync(`${captured}.args`, 'utf8')).toBe('deploy@example.test bash -s\n');
      expect(readStubLog(fixture)).toBe('');
    } finally { trashFixture(fixture); }
  });

  slow('preserves host and directory overrides without opening ssh in dry run', () => {
    const result = spawnSync('bash', ['./scripts/deploy.sh'], {
      encoding: 'utf8', env: { ...process.env, DRY_RUN: '1', DEPLOY_HOST: 'deploy@example.test', DEPLOY_DIR: '/srv/sites' },
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('host: deploy@example.test');
    expect(result.stdout).toContain("cd '/srv/sites/md3.io'");
  });

  slow('rejects unsafe directory values before producing or executing a remote script', () => {
    for (const dir of ['relative', '/srv/../other', '/srv/sites\necho unsafe', '/srv/$(touch nope)']) {
      const result = spawnSync('bash', ['./scripts/deploy.sh'], { encoding: 'utf8', env: { ...process.env, DRY_RUN: '1', DEPLOY_DIR: dir } });
      expect(result.status).toBe(1);
      expect(result.stdout).not.toContain('set -euo pipefail');
      expect(result.stderr).toContain('Refusing to deploy: directory must be an absolute path');
    }
  });

  const failures: [string, DeployOptions, ((fixture: ReturnType<typeof createDeployFixture>) => void)?][] = [
    ['unreadable unit', { failUnit: true }],
    ['inactive unit', { unitState: 'inactive' }],
    ['missing MainPID', { unitPid: 0 }],
    ['stale socket with mismatched daemon pid', { unitPid: 2147483646 }],
    ['dead daemon pid', { unitPid: 2147483647 }, f => writeFileSync(join(f.pm2Home, 'pm2.pid'), '2147483647')],
    ['missing RPC socket', {}, f => f.socket.stop(true)],
    ['missing Bun runtime', { missingRuntime: true }],
    ['missing PM2 executable', { missingPM2: true }],
    ['missing app', { pm2Pid: 0 }],
    ['empty app pid', { pm2Pid: '' }],
    ['invalid app pid', { pm2Pid: 'not-a-pid' }],
    ['failed process lookup', { failPid: true }],
  ];
  for (const [name, options, setup] of failures) slow(`preflight: ${name} leaves git untouched and never reloads or starts`, () => {
    const fixture = createDeployFixture();
    try {
      setup?.(fixture);
      const result = runRemote(fixture, options);
      expect(result.status).not.toBe(0);
      expect(revision(fixture.site)).toBe(fixture.siteLocal);
      const log = readStubLog(fixture);
      expect(log).not.toContain('git ');
      expect(log).not.toContain('bun install');
      expect(log).not.toContain('pm2 reload');
      expect(log).not.toContain('pm2 start');
      expect(result.stderr).toContain('Refusing deploy:');
    } finally { trashFixture(fixture); }
  });

  slow('fetches, resets, installs, builds and reloads exactly once through the verified daemon', () => {
    const fixture = createDeployFixture();
    try {
      const result = runRemote(fixture, { pm2Pid: '4242\n4243' });
      expect(result.status).toBe(0);
      expect(revision(fixture.site)).toBe(fixture.siteOrigin);
      expect(result.stdout).toContain('md3.io answers 200.');
      const log = readStubLog(fixture);
      expect(log).toContain('git fetch -q origin main\n');
      expect(log).toContain('git reset -q --hard origin/main\n');
      expect(log).toContain('bun install --frozen-lockfile\n');
      expect(log).toContain('bun run build\n');
      expect(log.match(/^pm2 reload md3.io$/gm)).toHaveLength(1);
      expect(log.match(/^pm2 /gm)).toHaveLength(2);
      expect(log.split('\n').filter(line => line === `pm2-home ${fixture.pm2Home}`)).toHaveLength(2);
      expect(log).not.toContain('pm2 start');
      expect(log.indexOf('pm2 pid md3.io')).toBeLessThan(log.indexOf('git fetch'));
      expect(log.lastIndexOf('systemctl')).toBeGreaterThan(log.indexOf('pm2 reload'));
    } finally { trashFixture(fixture); }
  });

  slow('moves a legacy material symlink aside before installing', () => {
    const fixture = createDeployFixture();
    try {
      const mtrlDir = join(fixture.site, 'node_modules', 'material');
      mkdirSync(mtrlDir, { recursive: true });
      const targetPkg = join(fixture.root, 'legacy-material-package.json');
      writeFileSync(targetPkg, '{"name":"material","version":"3.2.6"}\n');
      symlinkSync(targetPkg, join(mtrlDir, 'package.json'));
      expect(runRemote(fixture).status).toBe(0);
      expect(existsSync(mtrlDir)).toBe(false);
    } finally {
      for (const entry of readdirSync('/tmp')) if (entry.startsWith('md3io-material-link-')) spawnSync('trash', [join('/tmp', entry)]);
      trashFixture(fixture);
    }
  });

  for (const [name, options] of [
    ['failed build', { failBuild: true }],
    ['failed reload', { failReload: true }],
    ['daemon stopped before reload', { loseDaemon: true }],
    ['daemon changed after reload', { changeDaemon: true }],
  ] satisfies [string, DeployOptions][]) slow(`${name} reports the moved checkout and exact restoration command without rollback or start`, () => {
    const fixture = createDeployFixture();
    try {
      const result = runRemote(fixture, options);
      expect(result.status).not.toBe(0);
      expect(revision(fixture.site)).toBe(fixture.siteOrigin);
      expect(result.stderr).toContain('DEPLOY FAILED AFTER CHECKOUT UPDATE');
      expect(result.stderr).toContain(`Previous commit: ${fixture.siteLocal}`);
      expect(result.stderr).toContain(`git -C '${fixture.site}' reset --hard '${fixture.siteLocal}'`);
      expect(result.stderr).toContain('Check pm2-admin');
      const log = readStubLog(fixture);
      expect(log).not.toContain('pm2 start');
      expect(log.match(/^git reset /gm)).toHaveLength(1);
      expect(log.match(/^pm2 reload /gm) ?? []).toHaveLength(options.failBuild || options.loseDaemon ? 0 : 1);
      if (options.changeDaemon) expect(result.stderr).toContain('pm2-admin daemon changed during deploy');
    } finally { trashFixture(fixture); }
  });
});
