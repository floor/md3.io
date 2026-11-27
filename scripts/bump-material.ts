// A material bump, start to push-ready (decided 2026-11-27): bun run bump:material [version]
//
//   1. refuses while the last nightly browser suite failed (scripts/nightly-browser.ts)
//   2. installs material at the version (npm's latest when none is given)
//   3. resyncs the sizes and pins the theme generator fixture from that version's tag
//   4. builds, then runs typecheck, the unit tests, docs:check and the targeted browser checks
//
// The full browser suite runs nightly instead of on each bump. It stops at the first failure and commits nothing.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { nightlyStatus } from './nightly-browser-status';

const root = resolve(import.meta.dir, '..');
const REPOSITORY = 'https://github.com/floor/material';

const run = (...cmd: string[]) => {
  console.log(`$ ${cmd.join(' ')}`);
  const { exitCode } = Bun.spawnSync(cmd, { cwd: root, stdout: 'inherit', stderr: 'inherit' });
  if (exitCode !== 0) { console.error(`bump: stopped, ${cmd.join(' ')} exited ${exitCode}`); process.exit(exitCode ?? 1); }
};
const text = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response.text();
};

const nightly = nightlyStatus(root);
if (nightly && !nightly.ok) {
  console.error(`bump: the nightly browser suite failed on ${nightly.at} (main ${nightly.commit.slice(0, 8)}); fix it first. Log: ${nightly.log}`);
  process.exit(1);
}
if (!nightly) console.warn('bump: no nightly browser result yet; going on.');

const version = process.argv[2] ?? (JSON.parse(await text('https://registry.npmjs.org/material/latest')) as { version: string }).version;
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error(`bump: ${version} is not a version`);
console.log(`bump: material ${version}`);

run('bun', 'add', `material@${version}`);
run('bun', 'run', 'sizes:sync');
run('bun', 'run', 'sizes');

// The theme generator fixture, from the version's tag in material's public repository.
const fixtures = resolve(root, 'test/fixtures');
const metadataFile = resolve(fixtures, `material-${version}-generator.json`);
if (!existsSync(metadataFile)) {
  const tag = `v${version}`;
  const listed = Bun.spawnSync(['git', 'ls-remote', REPOSITORY, `refs/tags/${tag}^{}`, `refs/tags/${tag}`], { stdout: 'pipe' }).stdout.toString().trim().split('\n');
  const commit = (listed.find(line => line.endsWith('^{}')) ?? listed[0] ?? '').split('\t')[0];
  if (!/^[0-9a-f]{40}$/.test(commit)) throw new Error(`bump: no tag ${tag} in ${REPOSITORY}`);
  const raw = (path: string) => text(`https://raw.githubusercontent.com/floor/material/${commit}/${path}`);
  const source = await raw('scripts/generate-themes.ts');
  writeFileSync(resolve(fixtures, `material-${version}-generate-themes.ts.txt`), source);
  writeFileSync(resolve(fixtures, `material-${version}-LICENSE.txt`), await raw('LICENSE'));
  writeFileSync(metadataFile, `${JSON.stringify({
    version, repository: REPOSITORY, commit, path: 'scripts/generate-themes.ts',
    sha256: createHash('sha256').update(source).digest('hex'), license: `material-${version}-LICENSE.txt`,
  }, null, 2)}\n`);
  console.log(`bump: pinned the theme generator fixture at ${commit.slice(0, 8)}`);
}

run('bun', 'run', 'build');
run('bun', 'run', 'typecheck');
run('bun', 'test', './test/');
run('bun', 'run', 'docs:check');
run('bun', 'run', 'test:browser:bump');
console.log(`bump: material ${version} is ready to commit (${readFileSync(resolve(root, 'package.json'), 'utf8').includes(`"material": "${version}"`) ? 'package.json updated' : 'check package.json'}).`);
