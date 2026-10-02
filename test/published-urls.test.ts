// Every URL md3.io has published must keep answering: data/published-urls.txt holds the
// sitemap's URLs at origin/main 2b9e4622 (2026-10-02, before the segmented button page was
// deleted), plus every URL published since, sorted. Each answers 200, or 301 when the page
// moved or retired.
//
// The list is append-only: add a URL when a page is published; never remove one. Retiring a
// page means adding a 301 in server.ts first (/docs/components/segmented-button/ did), so
// its URL stays here answering 301 and the redirect cannot be dropped unnoticed.
//
// The examples need the examples build (`bun run build`): /examples/settings/ is a 404
// until dist/examples/settings/sources.json exists.
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { handleRequest } from '../server';

const urls = readFileSync(resolve(import.meta.dir, '../data/published-urls.txt'), 'utf8')
  .split('\n').map(line => line.trim()).filter(Boolean);

describe('published URLs', () => {
  test('every URL answers 200, or 301 for a retired page', async () => {
    const failures: string[] = [];
    for (const path of urls) {
      const status = (await handleRequest(new Request(`http://localhost${path}`))).status;
      if (status !== 200 && status !== 301) failures.push(`${path}: ${status}`);
    }
    expect(failures).toEqual([]);
  });
});
