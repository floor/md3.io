// The Themes app's download, unit-tested: the menu's items and the files it writes.
// scripts/check-styles.ts runs the same flows in a browser.
import { describe, expect, test } from 'bun:test';
import { FORMAT_ITEMS } from '../src/client/theme-app/features/withDownload';

describe('theme download', () => {
  test('the menu offers the files as CSS and JSON: the SCSS item is gone', () => {
    expect(FORMAT_ITEMS).toEqual([{ id: 'css', text: 'CSS' }, { id: 'json', text: 'JSON' }]);
  });
});
