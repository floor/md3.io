// The toolbar's playground content: its named action sets, its scenarios and its
// registry entry, moved from src/shared/components.ts.
import type { IconButtonConfig } from 'material/components/icon-button';
import type { ToolbarConfig, ToolbarItem } from 'material/components/toolbar';
import type { FabConfig } from 'material/components/fab';
import { symbols } from '../icons';
import { type ComponentState, type Control, type Scenario, choose, iconByName, pick, section, string, toggle } from './types';

/** The toolbar preview's items: formatting toggles, or actions. */
const toolbarItems = (state: ComponentState): IconButtonConfig[] =>
  (state.toggles
    ? [['bold', 'Bold'], ['italic', 'Italic'], ['underline', 'Underline'], ['edit', 'Edit'], ['add', 'Add']]
    : [['heart', 'Favorite'], ['bookmark', 'Bookmark'], ['send', 'Share'], ['inbox', 'Archive'], ['edit', 'Edit']])
    .slice(0, Number(state.items))
    .map(([icon, ariaLabel], index) => ({ icon: iconByName(icon!), ariaLabel, ...(state.toggles && index < 3 ? { toggle: true, selected: index === 0 } : {}) }));
/** What a named action set adds beside the toolbar's config: the FAB some sets pair with, and the trailing overflow menu's items. */
export interface ToolbarContent {
  fab?: FabConfig;
  fabPosition?: 'start' | 'end';
  /** The items of the menu the toolbar's own trailing more button opens. */
  overflow?: { id: string; text: string }[];
  /**
   * Where that menu opens. A vertical rail's more button sits at its bottom, and the
   * menu's default below-the-opener placement lands on top of the tools; beside the
   * rail, on its inline end, is the natural side.
   */
  overflowPosition?: 'right-start';
}
/** One named action set: a real situation's items, with the FAB or overflow menu some call for. */
export interface ToolbarActionSet extends ToolbarContent {
  /** The set's name, as the Actions control shows it. */
  name: string;
  /** The toolbar's accessible name. */
  ariaLabel: string;
  items: ToolbarItem[];
}
/**
 * The toolbar playground's named action sets, the situations of m3.material.io's toolbars
 * figure (read 5 October 2026, /components/toolbars/guidelines): call controls with an
 * end-call FAB, text formatting, browser navigation, a document editing rail, step
 * navigation, and an open email's actions. Purely data — the preview and the generated
 * code build the FAB and the overflow menu from them, and the element tabs slot the
 * items and the FAB. No set is chosen (`default`) and these are all skipped: today's
 * formatting and action sets stay exactly as they were.
 */
const toolbarActionSets: Record<string, ToolbarActionSet> = {
  'video-call': {
    name: 'Video call',
    ariaLabel: 'Call controls',
    items: [
      { icon: symbols.videocamOff, ariaLabel: 'Camera off' },
      { icon: symbols.mic, ariaLabel: 'Microphone' },
      { icon: symbols.frontHand, ariaLabel: 'Raise hand', toggle: true, selected: true },
    ],
    // The figure's end-call button reads red; the FAB has no error colour, so it pairs as tertiary-container.
    fab: { icon: symbols.callEnd, ariaLabel: 'End call', variant: 'tertiary-container' },
    fabPosition: 'end',
    overflow: [
      { id: 'chat', text: 'Chat' },
      { id: 'participants', text: 'Participants' },
      { id: 'settings', text: 'Settings' },
    ],
  },
  'text-formatting': {
    name: 'Text formatting',
    ariaLabel: 'Formatting',
    items: [
      { icon: symbols.bold, ariaLabel: 'Bold', toggle: true, selected: true },
      { icon: symbols.italic, ariaLabel: 'Italic', toggle: true },
      { icon: symbols.underline, ariaLabel: 'Underline', toggle: true },
      { icon: symbols.formatColorText, ariaLabel: 'Text colour' },
      { icon: symbols.formatColorFill, ariaLabel: 'Fill colour' },
    ],
  },
  browser: {
    name: 'Browser',
    ariaLabel: 'Page navigation',
    items: [
      { icon: symbols.arrowBack, ariaLabel: 'Back' },
      { icon: symbols.arrowForward, ariaLabel: 'Forward' },
      // The guidelines' one emphasized action: filled and wide, mid-bar by item order.
      { icon: symbols.add, ariaLabel: 'New tab', variant: 'filled', width: 'wide' },
      { icon: symbols.tab, ariaLabel: 'Tabs' },
    ],
    overflow: [
      { id: 'bookmarks', text: 'Bookmarks' },
      { id: 'downloads', text: 'Downloads' },
      { id: 'history', text: 'History' },
    ],
  },
  'document-editing': {
    name: 'Document editing',
    ariaLabel: 'Editing tools',
    items: [
      { icon: symbols.undo, ariaLabel: 'Undo' },
      { icon: symbols.redo, ariaLabel: 'Redo' },
      { icon: symbols.add, ariaLabel: 'Add' },
      { icon: symbols.formatColorText, ariaLabel: 'Text colour' },
    ],
    overflow: [
      { id: 'link', text: 'Insert link' },
      { id: 'image', text: 'Insert image' },
      { id: 'find', text: 'Find and replace' },
    ],
    // The rail's tools sit under the more button; its menu opens beside the rail
    // instead (the menu's position, inline end of a vertical bar) — read in the
    // menu's MENU_POSITION: 'right-start' places it right of the opener, top-aligned.
    overflowPosition: 'right-start',
  },
  'step-navigation': {
    name: 'Step navigation',
    ariaLabel: 'Step navigation',
    items: [{ text: 'Back', variant: 'text' }, { text: 'Next', variant: 'filled' }],
  },
  'email-actions': {
    name: 'Email actions',
    ariaLabel: 'Email actions',
    items: [
      { icon: symbols.archive, ariaLabel: 'Archive' },
      { icon: symbols.delete, ariaLabel: 'Delete' },
      { icon: symbols.markEmailUnread, ariaLabel: 'Mark as unread' },
      { icon: symbols.snooze, ariaLabel: 'Snooze' },
      { icon: symbols.star, ariaLabel: 'Star' },
    ],
  },
};
const toolbarSet = (state: ComponentState): ToolbarActionSet | undefined => toolbarActionSets[string(state, 'actions')];
/** What a toolbar preview adds beside its config: the chosen set's FAB and overflow menu, if it has them. */
export function toolbarContent(state: ComponentState): ToolbarContent {
  const set = toolbarSet(state);
  return set
    ? { ...(set.fab ? { fab: set.fab, ...(set.fabPosition === 'start' ? { fabPosition: set.fabPosition } : {}) } : {}), ...(set.overflow ? { overflow: set.overflow } : {}), ...(set.overflowPosition ? { overflowPosition: set.overflowPosition } : {}) }
    : {};
}
const toolbarActions: Control = {
  ...choose('actions', 'Actions', ['default', ...Object.keys(toolbarActionSets)], 'default', 'select'),
  labels: { default: 'Default', ...Object.fromEntries(Object.entries(toolbarActionSets).map(([id, set]) => [id, set.name])) },
};
/**
 * The toolbar's scenarios, from m3.material.io (read 5 October 2026). Each pairs one
 * named action set with the placement its situation calls for; options name playground
 * controls only. The video call's end-call FAB is a tertiary container — the FAB has no
 * error colour for the figure's red — and step navigation's Back and Next reach the
 * edges through the spread arrangement, the closest the toolbar offers.
 */
const toolbarScenarios: readonly Scenario[] = [
  {
    id: 'video-call', name: 'Video call', source: 'https://m3.material.io/components/toolbars/guidelines',
    description: 'A video call\'s controls — camera, microphone, raise hand — floating beside an end-call FAB.',
    options: { actions: 'video-call', variant: 'floating', color: 'standard', orientation: 'horizontal', elevated: true },
  },
  {
    id: 'text-formatting', name: 'Text formatting', source: 'https://m3.material.io/components/toolbars/guidelines',
    description: 'Formatting a text selection: bold on, with italic, underline and colour picks, in the vibrant colour that signals an edit mode.',
    options: { actions: 'text-formatting', variant: 'floating', color: 'vibrant', orientation: 'horizontal', elevated: true },
  },
  {
    id: 'browser', name: 'Browser', source: 'https://m3.material.io/components/toolbars/guidelines',
    description: 'Page navigation in a browser: back, forward and tabs, with a filled, wide new-tab action standing out mid-bar.',
    options: { actions: 'browser', variant: 'floating', color: 'standard', orientation: 'horizontal', elevated: true },
  },
  {
    id: 'document-editing', name: 'Document editing', source: 'https://m3.material.io/components/toolbars/guidelines',
    description: 'Editing a document on a large screen: undo, redo and insert tools in a vertical rail beside the text.',
    options: { actions: 'document-editing', variant: 'floating', color: 'standard', orientation: 'vertical', elevated: true },
  },
  {
    id: 'step-navigation', name: 'Step navigation', source: 'https://m3.material.io/components/toolbars/guidelines',
    description: 'A step-by-step flow: Back at the start and Next at the end of a full-width bar.',
    options: { actions: 'step-navigation', variant: 'docked', color: 'standard', arrangement: 'spread' },
  },
  {
    id: 'email-actions', name: 'Email actions', source: 'https://m3.material.io/components/toolbars/guidelines',
    description: 'Acting on an open email — archive, delete, mark unread, snooze, star — in the vibrant bar that marks the temporary mode.',
    options: { actions: 'email-actions', variant: 'docked', color: 'vibrant', arrangement: 'spread' },
  },
];

export const toolbarComponent = {
  group: 'Navigation', name: 'Toolbar', factory: 'createToolbar', variable: 'toolbar',
  description: 'Keep the page\'s actions, or a selection\'s tools, in reach. Try the docked and floating toolbars, the vibrant colour and a vertical layout.',
  summary: 'Docked or floating actions, standard or vibrant.', styles: ['toolbar', 'icon-button', 'button', 'fab', 'menu', 'progress'],
  scenarios: toolbarScenarios,
  controls: [
    ...section('Appearance', [choose('variant', 'Variant', ['docked', 'floating'], 'floating'), choose('color', 'Color', ['standard', 'vibrant'], 'standard'), toggle('elevated', 'Elevated', true)]),
    ...section('Layout', [choose('orientation', 'Orientation', ['horizontal', 'vertical'], 'horizontal'), choose('arrangement', 'Docked items', ['spread', 'center'], 'spread')]),
    // The item count and the toggles configure the default sets; a named set fixes the whole list.
    ...section('Content', [toolbarActions, { ...choose('items', 'Item count', ['2', '3', '4', '5'], '4'), enabledWhen: 'actionsDefault', replaced: 'actionsDefault' }, { ...toggle('toggles', 'Formatting toggles', true), enabledWhen: 'actionsDefault', replaced: 'actionsDefault' }]),
  ],
  config: (state: ComponentState): ToolbarConfig => {
    const set = toolbarSet(state);
    return {
      variant: pick(state, 'variant', ['docked', 'floating'], 'floating'),
      color: pick(state, 'color', ['standard', 'vibrant'], 'standard'),
      orientation: pick(state, 'orientation', ['horizontal', 'vertical'], 'horizontal'),
      arrangement: pick(state, 'arrangement', ['spread', 'center'], 'spread'),
      ...(state.elevated ? {} : { elevated: false }),
      ariaLabel: set ? set.ariaLabel : state.toggles ? 'Formatting' : 'Actions',
      items: set ? set.items : toolbarItems(state),
    };
  },
};
