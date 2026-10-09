import { describe, expect, test } from 'bun:test';
import { checkDocsPages } from '../scripts/check-docs-pages';

describe('CHECK_DOCS_PAGES', () => {
  test('unset gives 2', () => {
    expect(checkDocsPages(undefined)).toBe(2);
  });

  test('an empty value gives 2', () => {
    expect(checkDocsPages('')).toBe(2);
  });

  test('"1" gives 1', () => {
    expect(checkDocsPages('1')).toBe(1);
  });

  test('"6" gives 6', () => {
    expect(checkDocsPages('6')).toBe(6);
  });

  test.each(['0', '7', 'x'])('%s gives 2', value => {
    expect(checkDocsPages(value)).toBe(2);
  });
});
