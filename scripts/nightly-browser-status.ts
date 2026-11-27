// The last nightly browser suite's result, which a material bump reads (scripts/bump-material.ts).
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export interface NightlyStatus { ok: boolean; at: string; commit: string; seconds: number; log: string }

/** The main checkout, which every worktree shares: the nightly's result lives there, whichever worktree bumps. */
export function mainCheckout(root: string): string {
  const common = Bun.spawnSync(['git', 'rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd: root, stdout: 'pipe' }).stdout.toString().trim();
  return common ? dirname(common) : root;
}

export const nightlyFile = (root: string) => resolve(mainCheckout(root), 'analysis/nightly-browser.json');

export function nightlyStatus(root: string): NightlyStatus | null {
  const file = nightlyFile(root);
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) as NightlyStatus : null;
}
