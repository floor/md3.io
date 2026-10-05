// The dialog's playground content: its registry entry, moved from
// src/shared/components.ts.
import type { DialogConfig } from 'material/components/dialog';
import { type ComponentState, bool, choose, paragraph, section, string, text, toggle } from './types';

export const dialogComponent = {
  group: 'Containment', name: 'Dialog', factory: 'createDialog', variable: 'dialog',
  description: 'Focus on a decision. Open a dialog to try its content, actions, and dismissal behavior.',
  summary: 'A focused surface for a task or decision.', styles: ['progress', 'button', 'divider', 'dialog'],
  scenarios: [],
  controls: [
    ...section('Appearance', [choose('size', 'Size', ['small', 'medium', 'large', 'fullwidth', 'fullscreen'], 'small', 'select'), choose('animation', 'Animation', ['scale', 'slide-up', 'slide-down', 'fade'], 'scale', 'select'), toggle('divider', 'Dividers')]),
    ...section('Content', [text('title', 'Title', 'Save your changes?'), text('subtitle', 'Subtitle', ''), text('content', 'Body', 'Keep your changes before leaving this view.'), toggle('actions', 'Show actions', true), choose('footerAlignment', 'Action alignment', ['right', 'left', 'center', 'space-between'], 'right', 'select')]),
    ...section('Behavior', [toggle('open', 'Open'), toggle('closeButton', 'Close button', true), toggle('closeOnOverlayClick', 'Dismiss on scrim', true), toggle('closeOnEscape', 'Dismiss with Escape', true)]),
  ],
  config: (state: ComponentState): DialogConfig => ({ title: string(state, 'title'), subtitle: string(state, 'subtitle'), content: paragraph(string(state, 'content')), ariaLabel: string(state, 'title').trim() || 'Example dialog', size: string(state, 'size'), animation: string(state, 'animation'), divider: bool(state, 'divider'), open: bool(state, 'open'), closeButton: bool(state, 'closeButton'), closeOnOverlayClick: bool(state, 'closeOnOverlayClick'), closeOnEscape: bool(state, 'closeOnEscape'), footerAlignment: string(state, 'footerAlignment'), buttons: state.actions ? [{ text: 'Cancel', variant: 'text', closeDialog: true }, { text: 'Save', variant: 'filled', closeDialog: true }] : [] }),
};
