import { spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'bun:test';

describe('deploy script', () => {
  test('a dry run prints the steps in order and the refusal, and does not open ssh', () => {
    const bin = mkdtempSync(join(tmpdir(), 'md3-deploy-dry-'));
    writeFileSync(join(bin, 'ssh'), '#!/bin/sh\necho SSH_INVOKED\nexit 97\n');
    chmodSync(join(bin, 'ssh'), 0o755);
    const env: Record<string, string | undefined> = { ...process.env, DRY_RUN: '1', PATH: `${bin}:${process.env.PATH ?? ''}` };
    delete env.LIBRARY_REF;
    delete env.LIBRARY_URL;
    delete env.DEPLOY_HOST;
    delete env.DEPLOY_DIR;
    const result = spawnSync('./scripts/deploy.sh', [], { encoding: 'utf8', env, timeout: 15000 });
    spawnSync('trash', [bin]);
    const out = result.stdout ?? '';
    expect(result.status).toBe(0);
    expect(out).not.toContain('SSH_INVOKED');
    expect(out).toContain('host: floor.io');
    expect(out).toContain('directory: /home/floor');
    expect(out).toContain('library: https://github.com/floor/material.git');
    expect(out).toContain('library ref: origin/main');
    const steps = [
      'git clone -q "https://github.com/floor/material.git"',
      'config --get remote.origin.url',
      'Refusing to deploy: /home/floor/material origin is $origin, not floor/material.',
      'git fetch -q origin --tags',
      'git rev-parse --verify "origin/main^{commit}"',
      'git checkout -q --detach',
      'bun install --frozen-lockfile',
      'bun run build',
      'git fetch -q origin main',
      'git reset -q --hard origin/main',
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
});
