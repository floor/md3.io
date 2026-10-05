// The bottom sheet's playground content: its registry entry, moved from
// src/shared/components.ts.
import type { BottomSheetConfig } from 'material/components/bottom-sheet';
import { type ComponentState, bool, choose, paragraph, pick, range, section, string, text, toggle } from './types';

export const bottomSheetComponent = {
  group: 'Containment', name: 'Bottom sheet', factory: 'createBottomSheet', variable: 'sheet',
  description: 'Reveal more from the bottom edge. Try partial and expanded states, or drag the handle.',
  summary: 'Supporting content from the bottom edge.', styles: ['progress', 'button', 'bottom-sheet'],
  scenarios: [],
  controls: [
    ...section('Appearance', [choose('variant', 'Variant', ['standard', 'modal'], 'modal'), toggle('dragHandle', 'Drag handle', true)]),
    ...section('Layout', [{ ...range('peekHeight', 'Peek height', '120'), min: 56, max: 240, step: 8 }, { ...range('maxWidth', 'Maximum width', '640'), min: 280, max: 640, step: 20 }]),
    ...section('Content', [text('title', 'Title', 'Plan your visit'), text('content', 'Body', 'Find a new trail, take in the view, and make time for a quiet moment.')]),
    ...section('Behavior', [choose('initialState', 'State', ['hidden', 'partial', 'expanded'], 'hidden', 'select'), toggle('closeOnScrimClick', 'Dismiss on scrim', true), toggle('closeOnEscape', 'Dismiss with Escape', true)]),
  ],
  config: (state: ComponentState): BottomSheetConfig => ({ variant: pick(state, 'variant', ['standard', 'modal'], 'modal'), initialState: pick(state, 'initialState', ['hidden', 'partial', 'expanded'], 'hidden'), dragHandle: bool(state, 'dragHandle'), peekHeight: Number(state.peekHeight), maxWidth: Number(state.maxWidth), title: string(state, 'title'), content: paragraph(string(state, 'content')), closeOnScrimClick: bool(state, 'closeOnScrimClick'), closeOnEscape: bool(state, 'closeOnEscape') }),
};
