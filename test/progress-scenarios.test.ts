import { describe, expect, test } from 'bun:test';
import { components, initialComponentState, normalizeComponentState } from '../src/shared/components';

const scenario = (id: string) => {
  const found = components.progress.scenarios.find(item => item.id === id);
  if (!found) throw new Error(`missing progress scenario ${id}`);
  return found;
};
const stateFor = (id: string) => normalizeComponentState('progress', { ...initialComponentState('progress'), ...scenario(id).options });

describe('progress scenarios', () => {
  test('five jobs, and each option is a control the page already has', () => {
    expect(components.progress.scenarios.map(item => item.name)).toEqual([
      'Loading episodes', 'Loading the article', 'Copying files', 'More photos', 'Download',
    ]);
    const keys = new Set(components.progress.controls.map(control => control.key));
    for (const item of components.progress.scenarios) {
      expect(item.source).toBe('https://m3.material.io/components/progress-indicators/guidelines');
      for (const key of Object.keys(item.options)) expect(keys.has(key)).toBe(true);
    }
  });

  test('loading episodes is an indeterminate bar, with the label from the figure', () => {
    expect(scenario('loading-episodes').description).toBe('My episodes are still loading, and there is no amount to show yet, so the bar slides along its track. This page draws that bar by itself.');
    expect(scenario('loading-episodes').options.value).toBeUndefined();
    expect(scenario('loading-episodes').options.buffer).toBeUndefined();
    expect(scenario('loading-episodes').options.variant).toBeUndefined();
    expect(scenario('loading-episodes').options.shape).toBeUndefined();
    const config = components.progress.config(stateFor('loading-episodes'));
    expect(config.indeterminate).toBe(true);
    expect(config.ariaLabel).toBe('Loading my episodes');
    expect(config.variant).toBe('linear');
    expect(config.shape).toBe('flat');
    expect(config.thickness).toBe('thin');
  });

  test('loading the article leaves value at 45 and clears the buffer band', () => {
    expect(scenario('loading-article').description).toBe('A news article is opening, and the bar shows how far it has come. This page draws that bar by itself.');
    expect(scenario('loading-article').options.value).toBeUndefined();
    expect(scenario('loading-article').options.showStopIndicator).toBeUndefined();
    expect(scenario('loading-article').options.indeterminate).toBeUndefined();
    const config = components.progress.config(stateFor('loading-article'));
    expect(config.indeterminate).toBe(false);
    expect(config.ariaLabel).toBe('Loading news article');
    expect(config.value).toBe(45);
    expect(config.buffer).toBe(0);
    expect(config.showStopIndicator).toBe(true);
    expect(config.showLabel).toBe(false);
    expect(config.variant).toBe('linear');
    expect(config.shape).toBe('flat');
  });

  test('copying files is 76.8 GB of 128 GB, which is 60', () => {
    expect(scenario('copying-files').description).toBe('Files are copying, 76.8 GB of 128 GB, so the bar is past halfway and ends in a stop. This page draws that bar by itself.');
    expect(scenario('copying-files').options.showStopIndicator).toBeUndefined();
    expect(scenario('copying-files').options.showLabel).toBeUndefined();
    const config = components.progress.config(stateFor('copying-files'));
    expect(config.indeterminate).toBe(false);
    expect(config.value).toBe(60);
    expect(config.buffer).toBe(0);
    expect(config.ariaLabel).toBe('Copying files');
    expect(config.showStopIndicator).toBe(true);
    expect(config.showLabel).toBe(false);
    expect(config.variant).toBe('linear');
  });

  test('more photos is a wavy circle at the default size', () => {
    expect(scenario('more-photos').description).toBe('More photos are on the way, and a wavy circle waits where they will appear. This page draws that circle by itself.');
    expect(scenario('more-photos').options.size).toBeUndefined();
    const config = components.progress.config(stateFor('more-photos'));
    expect(config.variant).toBe('circular');
    expect(config.shape).toBe('wavy');
    expect(config.indeterminate).toBe(true);
    expect(config.ariaLabel).toBe('Loading photos');
    expect(config.size).toBe(48);
    expect(config.buffer).toBe(0);
  });

  test('download is a flat circle, and size and shape stay at the defaults', () => {
    expect(scenario('download').description).toBe('Downloading an episode is a short wait, so a flat circle stands in for the Download label. This page draws that circle by itself.');
    expect(scenario('download').options.shape).toBeUndefined();
    expect(scenario('download').options.size).toBeUndefined();
    const config = components.progress.config(stateFor('download'));
    expect(config.variant).toBe('circular');
    expect(config.shape).toBe('flat');
    expect(config.indeterminate).toBe(true);
    expect(config.ariaLabel).toBe('Downloading episode');
    expect(config.size).toBe(48);
  });
});
