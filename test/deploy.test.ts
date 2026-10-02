import { spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'bun:test';
import { createDeployFixture, FLOOR_MATERIAL, placeMaterial, revision, runRemote, trashFixture } from './deploy-harness';

describe('deploy script', () => {
  // Local bare repositories, under a busy suite. The default five seconds is tight.
  const slow = (name: string, fn: () => void) => test(name, fn, 20_000);

  slow('a dry run prints the steps in order and the refusal, and does not open ssh', () => {
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
      "git clone -q 'https://github.com/floor/material.git'",
      'config --get remote.origin.url',
      'Refusing to deploy: /home/floor/material origin is $origin, not floor/material.',
      'git fetch -q origin --tags',
      'refs/remotes/origin/$ref',
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

  slow('LIBRARY_REF=main checks out origin/main when the local branch is behind', () => {
    const fixture = createDeployFixture();
    try {
      const material = placeMaterial(fixture, FLOOR_MATERIAL);
      const result = runRemote(fixture, { ref: 'main' });
      expect(revision(material)).toBe(fixture.materialOrigin);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain(`remote branch refs/remotes/origin/main ${fixture.materialOrigin}`);
    } finally {
      trashFixture(fixture);
    }
  });

  slow('an existing library checkout with no origin is refused before the site is touched', () => {
    const fixture = createDeployFixture();
    try {
      const material = placeMaterial(fixture, null);
      const result = runRemote(fixture, { ref: 'main' });
      expect(result.stderr).toContain('no origin');
      expect(result.status).toBe(1);
      expect(revision(fixture.site)).toBe(fixture.siteLocal);
      expect(revision(material)).toBe(fixture.materialLocal);
    } finally {
      trashFixture(fixture);
    }
  });

  slow('a library ref containing a semicolon or a space is refused and nothing is generated', () => {
    for (const ref of ['main;id', 'main id']) {
      const env: Record<string, string | undefined> = { ...process.env, DRY_RUN: '1', LIBRARY_REF: ref };
      const result = spawnSync('./scripts/deploy.sh', [], { encoding: 'utf8', env, timeout: 15000 });
      expect(result.status).toBe(1);
      expect(result.stdout ?? '').not.toContain('set -euo pipefail');
      expect(result.stdout ?? '').not.toContain('git clone');
      expect(result.stderr ?? '').toContain('Refusing to deploy');
    }
  });

  // The first line of each value matches. The check has to see the whole value.
  const refuseBrokenLine = (name: string, extra: Record<string, string>, sentence: string) => {
    slow(`a ${name} with a line break is refused and nothing is generated`, () => {
      const env: Record<string, string | undefined> = { ...process.env, DRY_RUN: '1', ...extra };
      const result = spawnSync('./scripts/deploy.sh', [], { encoding: 'utf8', env, timeout: 15000 });
      expect(result.status).toBe(1);
      expect(result.stdout ?? '').not.toContain('set -euo pipefail');
      expect(result.stdout ?? '').not.toContain('git clone');
      expect(result.stderr ?? '').toContain(sentence);
    });
  };
  refuseBrokenLine(
    'library ref',
    { LIBRARY_REF: 'origin/main\nx' },
    'Refusing to deploy: library ref must match [A-Za-z0-9._/-]+ and must not start with -.',
  );
  refuseBrokenLine(
    'library URL',
    { LIBRARY_URL: 'https://github.com/floor/material.git\nx' },
    'Refusing to deploy: library URL must be https://, git@host:path, ssh://, file://, or an absolute path, with no .. segment.',
  );
  refuseBrokenLine(
    'directory',
    { DEPLOY_DIR: '/home/floor\nx' },
    'Refusing to deploy: directory must be an absolute path of [A-Za-z0-9._/-] with no .. segment.',
  );

  slow('a dirty library checkout is refused, listing the files, before anything changes', () => {
    const fixture = createDeployFixture();
    try {
      const material = placeMaterial(fixture, FLOOR_MATERIAL);
      writeFileSync(join(material, 'shared.txt'), 'local edit\n');
      const result = runRemote(fixture, { ref: 'main' });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('shared.txt');
      expect(revision(material)).toBe(fixture.materialLocal);
      expect(revision(fixture.site)).toBe(fixture.siteLocal);
      expect(readFileSync(join(material, 'shared.txt'), 'utf8')).toBe('local edit\n');
    } finally {
      trashFixture(fixture);
    }
  });

  slow('a missing library checkout is cloned', () => {
    const fixture = createDeployFixture();
    try {
      const result = runRemote(fixture, { ref: 'main', url: fixture.materialBare });
      expect(result.status).toBe(0);
      expect(revision(join(fixture.dir, 'material'))).toBe(fixture.materialOrigin);
      expect(revision(fixture.site)).toBe(fixture.siteOrigin);
    } finally {
      trashFixture(fixture);
    }
  });

  slow('a library checkout whose origin is not floor/material is refused and the site is untouched', () => {
    const fixture = createDeployFixture();
    try {
      const material = placeMaterial(fixture, 'https://github.com/floor/mtrl.git');
      const result = runRemote(fixture, { ref: 'main' });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('https://github.com/floor/mtrl.git');
      expect(result.stderr).toContain('not floor/material');
      expect(revision(material)).toBe(fixture.materialLocal);
      expect(revision(fixture.site)).toBe(fixture.siteLocal);
    } finally {
      trashFixture(fixture);
    }
  });

  slow('a tag that is not main is checked out', () => {
    const fixture = createDeployFixture();
    try {
      const material = placeMaterial(fixture, FLOOR_MATERIAL);
      const result = runRemote(fixture, { ref: 'v1' });
      expect(fixture.materialTag).not.toBe(fixture.materialOrigin);
      expect(result.status).toBe(0);
      expect(revision(material)).toBe(fixture.materialTag);
      expect(result.stdout).toContain(`tag refs/tags/v1 ${fixture.materialTag}`);
    } finally {
      trashFixture(fixture);
    }
  });

  slow('an unknown library ref is refused before the site is touched', () => {
    const fixture = createDeployFixture();
    try {
      const material = placeMaterial(fixture, FLOOR_MATERIAL);
      const result = runRemote(fixture, { ref: 'no-such-ref' });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('no-such-ref');
      expect(revision(material)).toBe(fixture.materialLocal);
      expect(revision(fixture.site)).toBe(fixture.siteLocal);
    } finally {
      trashFixture(fixture);
    }
  });

  slow('a ref beginning with refs/heads/ is refused', () => {
    const fixture = createDeployFixture();
    try {
      const material = placeMaterial(fixture, FLOOR_MATERIAL);
      const result = runRemote(fixture, { ref: 'refs/heads/main' });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('refs/heads/');
      expect(revision(material)).toBe(fixture.materialLocal);
      expect(revision(fixture.site)).toBe(fixture.siteLocal);
    } finally {
      trashFixture(fixture);
    }
  });
});
