/** Which components `check-tabs` runs.
 * Unset or empty runs `known`, in that order. A comma list runs those slugs,
 * trimmed, in the order written, with duplicates dropped. A name outside
 * `known`, or a list that names nothing, is an error. */
export function checkTabsSlugs<T extends string>(value: string | undefined, known: readonly T[]):
  { ok: true; slugs: T[] } | { ok: false; error: string } {
  if (value === undefined || value.trim() === '') return { ok: true, slugs: [...known] };
  const seen = new Set<string>();
  const slugs: T[] = [];
  const unknown: string[] = [];
  for (const part of value.split(',')) {
    const slug = part.trim();
    if (slug === '' || seen.has(slug)) continue;
    seen.add(slug);
    const match = known.find(item => item === slug);
    if (match) slugs.push(match);
    else unknown.push(slug);
  }
  if (unknown.length > 0) return { ok: false, error: `CHECK_TABS: unknown component: ${unknown.join(', ')}` };
  if (slugs.length === 0) return { ok: false, error: 'CHECK_TABS names no component' };
  return { ok: true, slugs };
}

/** A whole number written from 1. Anything else, including unset and empty, is `fallback`. */
function countFromOne(value: string | undefined, fallback: number): number {
  if (value !== undefined && /^[1-9]\d*$/.test(value)) return Number(value);
  return fallback;
}

/** How many components share a tab page and a preview page.
 * A whole number from 1. Unset, empty, or anything else is 6. */
export function checkTabsRecycle(value: string | undefined): number {
  return countFromOne(value, 6);
}

/** How many components one `check-tabs` process runs.
 * A whole number from 1. Unset, empty, or anything else is 6. */
export function checkTabsBatch(value: string | undefined): number {
  return countFromOne(value, 6);
}

/** `slugs` in order, cut into groups of `size`. The last group may be shorter. */
export function checkTabsBatches<T>(slugs: readonly T[], size: number): T[][] {
  if (size < 1) throw new Error('batch size starts at 1');
  const batches: T[][] = [];
  for (let i = 0; i < slugs.length; i += size) batches.push(slugs.slice(i, i + size));
  return batches;
}

/** Which batch to run, counting from 1. Unset or empty runs every batch. */
export function checkTabsOnlyBatch(value: string | undefined):
  { ok: true; index?: number } | { ok: false; error: string } {
  if (value === undefined || value.trim() === '') return { ok: true };
  if (/^[1-9]\d*$/.test(value)) return { ok: true, index: Number(value) };
  return { ok: false, error: 'CHECK_TABS_ONLY_BATCH must be a whole number from 1' };
}
