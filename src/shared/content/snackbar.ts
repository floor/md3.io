// The snackbar's playground content: its registry entry, moved from
// src/shared/components.ts.
import type { SnackbarConfig } from 'material/components/snackbar';
import { type ComponentState, type Scenario, bool, choose, pick, section, string, text, toggle } from './types';

/**
 * The snackbar's scenarios, from m3.material.io (read 7 October 2026). Each bar
 * carries the figure's words. The close icon is off: no figure shows one. The
 * page shows the bar open.
 */
const snackbarScenarios: readonly Scenario[] = [
  {
    id: 'email-archived-undo', name: 'Email archived', source: 'https://m3.material.io/components/snackbar/guidelines',
    description: 'A brief confirmation that an email was archived, with Undo so it can be restored.',
    options: { message: 'Email archived', hasAction: true, action: 'Undo', dismissible: false, visible: true },
  },
  {
    id: 'saved-to-album', name: 'Saved to album', source: 'https://m3.material.io/components/snackbar/guidelines',
    description: 'A quiet confirmation that a photo was saved in the Vacation album, with nothing further to do.',
    options: { message: 'Saved in “Vacation” album', hasAction: false, dismissible: false, visible: true },
  },
  {
    id: 'all-changes-saved', name: 'All changes saved', source: 'https://m3.material.io/components/snackbar/guidelines',
    description: 'A confirmation that the work is already saved, so the bar offers no action.',
    options: { message: 'All changes saved', hasAction: false, dismissible: false, visible: true },
  },
  {
    id: 'photo-added', name: 'Photo added', source: 'https://m3.material.io/components/snackbar/guidelines',
    description: 'A confirmation that a photo was added to the Natural Light album, with Undo if it was a mistake.',
    options: { message: 'Photo added to “Natural Light” album', hasAction: true, action: 'Undo', dismissible: false, visible: true },
  },
];

export const snackbarComponent = {
  group: 'Communication', name: 'Snackbar', factory: 'createSnackbar', variable: 'snackbar',
  description: 'Confirm an action without interrupting. Show a message, offer an undo, and try dismissal behavior.',
  summary: 'Brief feedback with an optional action.', styles: ['progress', 'button', 'icon-button', 'snackbar'],
  scenarios: snackbarScenarios,
  controls: [
    ...section('Layout', [choose('position', 'Position', ['start', 'center', 'end'], 'center')]),
    ...section('Content', [text('message', 'Message', 'Your changes have been saved.'), toggle('hasAction', 'Show action', true), { ...text('action', 'Action text', 'Undo'), enabledWhen: 'hasAction' }, { ...text('closeLabel', 'Dismiss label', 'Dismiss'), enabledWhen: 'dismissible' }]),
    ...section('Behavior', [choose('duration', 'Duration', ['short', 'long', 'indefinite'], 'indefinite', 'select'), toggle('dismissible', 'Close button', true), toggle('visible', 'Visible')]),
  ],
  config: (state: ComponentState): SnackbarConfig => ({ message: string(state, 'message').trim() || 'Your changes have been saved.', ...(state.hasAction ? { action: string(state, 'action') } : {}), closeLabel: string(state, 'closeLabel').trim() || 'Dismiss', position: pick(state, 'position', ['start', 'center', 'end'], 'center'), duration: pick(state, 'duration', ['short', 'long', 'indefinite'], 'indefinite'), dismissible: bool(state, 'dismissible') }),
};
