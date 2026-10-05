// The snackbar's playground content: its registry entry, moved from
// src/shared/components.ts.
import type { SnackbarConfig } from 'material/components/snackbar';
import { type ComponentState, bool, choose, pick, section, string, text, toggle } from './types';

export const snackbarComponent = {
  group: 'Communication', name: 'Snackbar', factory: 'createSnackbar', variable: 'snackbar',
  description: 'Confirm an action without interrupting. Show a message, offer an undo, and try dismissal behavior.',
  summary: 'Brief feedback with an optional action.', styles: ['progress', 'button', 'icon-button', 'snackbar'],
  scenarios: [],
  controls: [
    ...section('Layout', [choose('position', 'Position', ['start', 'center', 'end'], 'center')]),
    ...section('Content', [text('message', 'Message', 'Your changes have been saved.'), toggle('hasAction', 'Show action', true), { ...text('action', 'Action text', 'Undo'), enabledWhen: 'hasAction' }, { ...text('closeLabel', 'Dismiss label', 'Dismiss'), enabledWhen: 'dismissible' }]),
    ...section('Behavior', [choose('duration', 'Duration', ['short', 'long', 'indefinite'], 'indefinite', 'select'), toggle('dismissible', 'Close button', true), toggle('visible', 'Visible')]),
  ],
  config: (state: ComponentState): SnackbarConfig => ({ message: string(state, 'message').trim() || 'Your changes have been saved.', ...(state.hasAction ? { action: string(state, 'action') } : {}), closeLabel: string(state, 'closeLabel').trim() || 'Dismiss', position: pick(state, 'position', ['start', 'center', 'end'], 'center'), duration: pick(state, 'duration', ['short', 'long', 'indefinite'], 'indefinite'), dismissible: bool(state, 'dismissible') }),
};
