// The side sheet's playground content: its registry entry, moved from
// src/shared/components.ts.
import type { SideSheetConfig } from 'material/components/side-sheet';
import { type ComponentState, bool, choose, paragraph, pick, range, section, string, text, toggle } from './types';

export const sideSheetComponent = {
  group: 'Containment', name: 'Side sheet', factory: 'createSideSheet', variable: 'sheet',
  description: 'Keep supporting details close by. Explore standard and modal sheets on either edge.',
  summary: 'Supporting details beside the main content.', styles: ['progress', 'button', 'side-sheet'],
  scenarios: [],
  controls: [
    ...section('Appearance', [choose('variant', 'Variant', ['standard', 'modal'], 'modal')]),
    ...section('Layout', [choose('position', 'Position', ['start', 'end'], 'end'), { ...range('width', 'Width', '320'), min: 240, max: 400, step: 20 }]),
    ...section('Content', [text('title', 'Title', 'Details'), text('content', 'Body', 'A place for useful context, related information, and supporting actions.')]),
    ...section('Behavior', [toggle('open', 'Open'), toggle('closeButton', 'Close button', true), toggle('closeOnScrimClick', 'Dismiss on scrim', true), toggle('closeOnEscape', 'Dismiss with Escape', true)]),
  ],
  config: (state: ComponentState): SideSheetConfig => ({ variant: pick(state, 'variant', ['standard', 'modal'], 'modal'), position: pick(state, 'position', ['start', 'end'], 'end'), width: Number(state.width), title: string(state, 'title'), content: paragraph(string(state, 'content')), open: bool(state, 'open'), closeButton: bool(state, 'closeButton'), closeOnScrimClick: bool(state, 'closeOnScrimClick'), closeOnEscape: bool(state, 'closeOnEscape') }),
};
