// The bottom app bar's playground content: its named action sets, its scenarios
// and its registry entry.
import type { BottomAppBarConfig } from 'material/components/bottom-app-bar';
import type { IconButtonConfig } from 'material/components/icon-button';
import { symbols } from '../icons';
import { type ComponentState, type Control, type Scenario, bool, choose, pick, section, string, text, toggle } from './types';

/** One named action set: the icon buttons a situation puts in the bar, and the FAB's glyph. */
export interface BottomAppBarActionSet {
  /** The set's name, as the Actions control shows it. */
  name: string;
  actions: readonly IconButtonConfig[];
  /** The FAB's icon. Its accessible name is the FAB label control. */
  fabIcon: string;
}

/**
 * Named bars from m3.material.io/components/toolbars (read 8 October 2026). The
 * bottom app bar has no page of its own: the toolbars page says it is still
 * supported and no longer recommended. `default` is not here: today's two
 * actions and the Compose FAB stay exactly as they were. The specs figures
 * ma25qmnu-12-3P and ma25xkg5-15-3P draw a checkbox, a brush, a microphone and
 * an image, with a "+" FAB at the end. The overview figure m0e7mh6v-3 draws
 * download, bookmark and delete, with a pencil FAB.
 */
const bottomAppBarActionSets: Record<string, BottomAppBarActionSet> = {
  notes: {
    name: 'Notes',
    actions: [
      { icon: symbols.checkBox, ariaLabel: 'New list' },
      { icon: symbols.brush, ariaLabel: 'New drawing' },
      { icon: symbols.mic, ariaLabel: 'New voice note' },
      { icon: symbols.image, ariaLabel: 'New image note' },
    ],
    fabIcon: symbols.add,
  },
  document: {
    name: 'Document',
    actions: [
      { icon: symbols.download, ariaLabel: 'Download' },
      { icon: symbols.bookmark, ariaLabel: 'Bookmark' },
      { icon: symbols.delete, ariaLabel: 'Delete' },
    ],
    fabIcon: symbols.edit,
  },
};

export const bottomAppBarSet = (state: ComponentState): BottomAppBarActionSet | undefined => bottomAppBarActionSets[string(state, 'actionSet')];

const actionSetControl: Control = {
  ...choose('actionSet', 'Actions', ['default', ...Object.keys(bottomAppBarActionSets)], 'default', 'select'),
  labels: { default: 'Default', ...Object.fromEntries(Object.entries(bottomAppBarActionSets).map(([id, set]) => [id, set.name])) },
};

/**
 * The bottom app bar's scenarios, from the toolbars page read 8 October 2026.
 * Options name playground controls only. Notes is the specs bar. Document is
 * the overview comparison's four icons: the pencil is the FAB, so the job is
 * editing a document rather than reading one.
 */
const bottomAppBarScenarios: readonly Scenario[] = [
  {
    id: 'notes', name: 'Notes', source: 'https://m3.material.io/components/toolbars/specs',
    description: 'A notes app\'s bar for starting a list, a drawing, a voice note or an image note, with a button at the end to begin a note.',
    options: { actionSet: 'notes', hasFab: true, fabPosition: 'end', fabLabel: 'New note' },
  },
  {
    id: 'document', name: 'Document', source: 'https://m3.material.io/components/toolbars/overview',
    description: 'A document\'s bar for downloading a copy, bookmarking it or deleting it, with a pencil to edit it.',
    options: { actionSet: 'document', hasFab: true, fabPosition: 'end', fabLabel: 'Edit' },
  },
];

export const bottomAppBarComponent = {
  group: 'Navigation', name: 'Bottom app bar', factory: 'createBottomAppBar', variable: 'bottomBar',
  description: 'Keep frequent actions within reach. Try a floating action button and different placements.',
  summary: 'Frequent actions with an optional FAB.', styles: ['bottom-app-bar', 'icon-button', 'fab'],
  scenarios: bottomAppBarScenarios,
  controls: [
    ...section('Layout', [toggle('hasFab', 'Show FAB', true), choose('fabPosition', 'FAB position', ['center', 'end'], 'end')]),
    ...section('Content', [
      actionSetControl,
      { ...choose('actions', 'Action count', ['1', '2', '3'], '2'), enabledWhen: 'actionSetDefault', replaced: 'actionSetDefault' },
      text('fabLabel', 'FAB label', 'Compose'),
    ]),
    ...section('Behavior', [toggle('visible', 'Visible', true)]),
  ],
  config: (state: ComponentState): BottomAppBarConfig => ({ hasFab: bool(state, 'hasFab'), fabPosition: pick(state, 'fabPosition', ['center', 'end'], 'end'), autoHide: false }),
};
