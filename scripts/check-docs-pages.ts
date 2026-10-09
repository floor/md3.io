/** How many Chromium pages `check-docs` opens at once. Unset, empty, or anything outside 1–6 is 2. */
export function checkDocsPages(value: string | undefined): number {
  if (value !== undefined && /^[1-6]$/.test(value)) return Number(value);
  return 2;
}
