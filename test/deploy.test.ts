import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'bun:test';
import { createDeployFixture, readStubLog, revision, runRemote, trashFixture } from './deploy-harness';

describe('deploy script', () => {
  // Local bare repositories, under a busy suite. The default five seconds is tight.
  const slow = (name: string, fn: () => void) => test(name, fn, 20_000);

  slow('a dry run prints the steps in order and does not open ssh', () => {
    const bin = mkdtempSync(join(tmpdir(), 'md3-deploy-dry-'));
    writeFileSync(join(bin, 'ssh'), '#!/bin/sh\necho SSH_INVOKED\nexit 97\n', { mode: 0o755 });
    const env: Record<string, string | undefined> = { ...process.env, DRY_RUN: '1', PATH: `${bin}:${process.env.PATH ?? ''}` };
    delete env.DEPLOY_HOST;
    delete env.DEPLOY_DIR;
    const result = spawnSync('bash', ['./scripts/deploy.sh'], { encoding: 'utf8', env, timeout: 15000 });
    spawnSync('trash', [bin]);
    const out = result.stdout ?? '';
    expect(result.status).toBe(0);
    expect(out).not.toContain('SSH_INVOKED');
    expect(out).toContain('host: floor.io');
    expect(out).toContain('directory: /home/floor');
    expect(out).not.toContain('/home/floor/material');
    const steps = [
      "cd '/home/floor/md3.io'",
      'git fetch -q origin main',
      'git reset -q --hard origin/main',
      'git log --oneline -1',
      'if [ -L node_modules/material ] || [ -L node_modules/material/package.json ]; then',
      'mv node_modules/material "/tmp/md3io-material-link-$$"',
      'bun install --frozen-lockfile',
      'bun run build',
      'md3.io is at origin/main but the build did not succeed; the running process is unchanged.',
      'pm2 reload md3.io',
      'pm2 start ecosystem.production.config.cjs',
      "curl -s -o /dev/null -w '%{http_code}'",
    ];
    let cursor = -1;
    for (const step of steps) {
      const index = out.indexOf(step, cursor + 1);
      expect(index).toBeGreaterThan(cursor);
      cursor = index;
    }
  });

  slow('a directory that is relative, has a .. segment, or has a line break is refused and nothing is generated', () => {
    for (const dir of ['home/floor', '/home/../floor', '/home/floor\nx']) {
      const env: Record<string, string | undefined> = { ...process.env, DRY_RUN: '1', DEPLOY_DIR: dir };
      const result = spawnSync('bash', ['./scripts/deploy.sh'], { encoding: 'utf8', env, timeout: 15000 });
      expect(result.status).toBe(1);
      expect(result.stdout ?? '').not.toContain('set -euo pipefail');
      expect(result.stderr ?? '').toContain(
        'Refusing to deploy: directory must be an absolute path of [A-Za-z0-9._/-] with no .. segment.',
      );
    }
  });

  slow('fetches and resets md3.io to origin/main, installs from bun.lock, builds, and reloads or starts pm2', () => {
    const fixture = createDeployFixture();
    try {
      expect(revision(fixture.site)).toBe(fixture.siteLocal);
      const result = runRemote(fixture, { pm2Pid: 4242 });
      expect(result.status).toBe(0);
      expect(revision(fixture.site)).toBe(fixture.siteOrigin);
      expect(result.stdout).toContain('md3.io answers 200.');
      const log = readStubLog(fixture);
      expect(log).toContain('bun install --frozen-lockfile\n');
      expect(log).toContain('bun run build\n');
      expect(log).toContain('pm2 reload md3.io\n');
    } finally {
      trashFixture(fixture);
    }
  });

  slow('moves a legacy symlinked node_modules/material/package.json aside before bun install --frozen-lockfile', () => {
    const fixture = createDeployFixture();
    try {
      const mtrlDir = join(fixture.site, 'node_modules', 'material');
      mkdirSync(mtrlDir, { recursive: true });
      const targetPkg = join(fixture.root, 'legacy-material-package.json');
      writeFileSync(targetPkg, '{"name":"material","version":"3.2.6"}\n');
      symlinkSync(targetPkg, join(mtrlDir, 'package.json'));

      const result = runRemote(fixture);
      expect(result.status).toBe(0);
      expect(existsSync(mtrlDir)).toBe(false);
      expect(readStubLog(fixture)).toContain('bun install --frozen-lockfile\n');
    } finally {
      for (const entry of readdirSync('/tmp')) {
        if (entry.startsWith('md3io-material-link-')) spawnSync('trash', [join('/tmp', entry)]);
      }
      trashFixture(fixture);
    }
  });

  slow('exits 1 with the unchanged-process message and does not reload or start pm2 when bun run build fails', () => {
    const fixture = createDeployFixture();
    try {
      const result = runRemote(fixture, { failBuild: true, pm2Pid: 4242 });
      expect(result.status).toBe(1);
      expect(revision(fixture.site)).toBe(fixture.siteOrigin);
      expect(result.stderr).toContain(
        'md3.io is at origin/main but the build did not succeed; the running process is unchanged.',
      );
      const log = readStubLog(fixture);
      expect(log).toContain('bun install --frozen-lockfile\n');
      expect(log).toContain('bun run build\n');
      expect(log).not.toContain('pm2 ');
    } finally {
      trashFixture(fixture);
    }
  });
});
