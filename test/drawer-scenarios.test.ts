import { describe, expect, test } from 'bun:test';
import { components, initialComponentState, normalizeComponentState } from '../src/shared/components';

const scenarioState = (id: string) => {
  const scenario = components.drawer.scenarios.find(item => item.id === id);
  if (!scenario) throw new Error(`missing drawer scenario ${id}`);
  return normalizeComponentState('drawer', { ...initialComponentState('drawer'), ...scenario.options });
};

describe('drawer scenarios', () => {
  test('mailbox pins Inbox at eight unread under Your mailbox', () => {
    const state = scenarioState('mailbox');
    const config = components.drawer.config(state);
    const items = config.items ?? [];
    const row = (id: string) => items.find(item => item.id === id);
    expect(items.flatMap(item => item.sectionLabel ? [item.sectionLabel] : [])).toEqual(['Your mailbox']);
    expect(row('inbox')?.badge).toBe('8');
    expect(row('inbox')?.label).toBe('Inbox');
    expect(row('favorites')?.badge).toBeUndefined();
    expect(row('sent')?.badge).toBeUndefined();
  });

  test('badges and section labels are enabled only for a named destination set', () => {
    const control = (key: string) => components.drawer.controls.find(item => item.key === key);
    expect(control('badges')?.enabledWhen).toBe('namedDestinations');
    expect(control('sections')?.enabledWhen).toBe('namedDestinations');
    const photos = normalizeComponentState('drawer', initialComponentState('drawer'));
    expect(photos.destinations).toBe('default');
    expect(photos.namedDestinations).toBe(false);
    expect(photos.badges).toBe(true);
    expect(photos.sections).toBe(true);
    const mailbox = scenarioState('mailbox');
    expect(mailbox.namedDestinations).toBe(true);
    const files = scenarioState('files');
    expect(files.namedDestinations).toBe(true);
  });
});
