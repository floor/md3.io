// The bottom sheet's playground content: its named content sets and its registry entry.
import type { BottomSheetConfig } from 'material/components/bottom-sheet';
import { symbols } from '../icons';
import { type ComponentState, type Control, type Scenario, bool, choose, paragraph, pick, range, section, string, text, toggle } from './types';

/** A symbol inline in content markup at a size: the sheet takes content as HTML, which serves icons itself. */
const icon = (svg: string, size: number): string =>
  svg.replace('width="24" height="24"', `width="${size}" height="${size}"`);

/** A share chip: a plain button, not the M3 pill the guidelines figure shows — see briefs/gaps.md. */
const chip = (label: string, svg: string): string =>
  `<button type="button" style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border: 1px solid; border-radius: 8px; background: none; font: inherit; cursor: pointer">${icon(svg, 18)}<span>${label}</span></button>`;

/** A contact under their photo — the products' own logos are not ours to draw. */
const target = (label: string, inner: string): string =>
  `<figure style="display: flex; flex-direction: column; align-items: center; gap: 8px; margin: 0">${inner}<figcaption style="font-size: 12px">${label}</figcaption></figure>`;

/** A contact's photo, as round as the guidelines figure shows it. */
const contact = (label: string, photo: number): string =>
  target(label, `<img src="https://picsum.photos/id/${photo}/96/96" alt="" style="width: 48px; height: 48px; border-radius: 50%" />`);

/** Figure 1's share sheet: the chips, then the contacts. The figure's second row of four
 * product logos (Files, Gmail, Meet, Drive) is left out: the site draws no product logo. */
const photoSharing = `<div style="display: flex; flex-direction: column; gap: 16px; padding: 4px 16px 24px">
  <div style="display: flex; gap: 8px">${chip('Copy', symbols.contentCopy)}${chip('Nearby', symbols.nearMe)}</div>
  <div style="display: flex; gap: 12px">${contact('Alejandro', 1005)}${contact('Ines', 1027)}${contact('Oli', 338)}${contact('Carmen', 823)}</div>
</div>`;

/** One of figure 5's action rows: an icon, then the action's words, the whole row its button. */
const songRow = (label: string, svg: string): string =>
  `<button type="button" style="display: flex; align-items: center; gap: 12px; width: 100%; padding: 14px 16px; border: none; background: none; font: inherit; text-align: left; cursor: pointer">${icon(svg, 24)}<span>${label}</span></button>`;

/** Figure 5's track actions: the queue's header with a divider under it, then its five rows — no handle, the sheet is all list. */
const songOptions = `<div style="display: flex; flex-direction: column">
  <div style="display: flex; align-items: center; gap: 12px; padding: 16px 16px 8px"><img src="https://picsum.photos/id/429/112/112" alt="" style="width: 56px; height: 56px; border-radius: 4px" /><div style="display: flex; flex-direction: column; gap: 2px"><span style="font-size: 16px; font-weight: 500">Oli's Picks</span><span style="font-size: 14px">Various artists</span></div></div>
  <hr style="border: none; border-top: 1px solid; margin: 0" />
  ${songRow('Add to Playlist...', symbols.playlistAdd)}
  ${songRow('Go to Album', symbols.album)}
  ${songRow('Go to Artist', symbols.personSearch)}
  ${songRow('Sleep timer', symbols.bedtime)}
  ${songRow('Play next in queue', symbols.playlistPlay)}
</div>`;

/** One of the player's icon buttons; its label is ours — the figure shows the glyph alone. */
const playerButton = (label: string, svg: string): string =>
  `<button type="button" aria-label="${label}" style="display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; padding: 0; border: none; background: none; cursor: pointer">${icon(svg, 24)}</button>`;

/** Figure 8's player: artwork, track and artist, then pause and skip. The bar across its top edge is a gap. */
const musicPlayer = `<div style="display: flex; align-items: center; gap: 12px; padding: 10px 16px">
  <img src="https://picsum.photos/id/445/88/88" alt="" style="width: 44px; height: 44px" />
  <div style="display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0"><span style="font-size: 14px; font-weight: 500">Cassette Futurism</span><span style="font-size: 12px">Various artists</span></div>
  ${playerButton('Pause', symbols.pause)}
  ${playerButton('Skip to next track', symbols.skipNext)}
</div>`;

/** One of figure 10's filters; the checkbox's initial state written as the attribute HTML takes. */
const filter = (label: string, checked = false): string =>
  `<label style="display: flex; align-items: center; gap: 12px; padding: 10px 0; font-size: 14px"><input type="checkbox"${checked ? ' checked="true"' : ''} /><span>${label}</span></label>`;

/** Figure 10's filters: two columns of categories, the work files on. */
const fileFilters = `<div style="display: flex; gap: 40px; padding: 8px 24px 24px">
  <div style="display: flex; flex-direction: column">${filter('Work files', true)}${filter('Personal')}${filter('Projects')}</div>
  <div style="display: flex; flex-direction: column">${filter('Priority')}${filter('Reminders')}${filter('Events')}</div>
</div>`;

/** A named sheet: the headline its content needs (none, when the content is its own), and the content whole. */
interface BottomSheetSet {
  name: string;
  title: string;
  content: string;
}

/**
 * Named sheets from m3.material.io/components/bottom-sheets/guidelines (read 5
 * October 2026), figures 1, 5, 8 and 10. `default` is not here: today's plan-a-visit
 * sheet stays exactly as it was. The content is native HTML the sheet serves through
 * `content` — it has no list, chip or progress templates of its own, and the figure's
 * row of product logos is left out: the site draws no product logo. See briefs/gaps.md.
 */
const bottomSheetSets: Record<string, BottomSheetSet> = {
  'photo-sharing': { name: 'Photo sharing', title: '', content: photoSharing },
  'song-options': { name: 'Song options', title: '', content: songOptions },
  'music-player': { name: 'Music player', title: '', content: musicPlayer },
  'file-filters': { name: 'File filters', title: 'Filters', content: fileFilters },
};

const sheetSet = (state: ComponentState): BottomSheetSet | undefined => bottomSheetSets[string(state, 'sheetSet')];

const sheetSetControl: Control = {
  ...choose('sheetSet', 'Sheet', ['default', ...Object.keys(bottomSheetSets)], 'default', 'select'),
  labels: { default: 'Default', ...Object.fromEntries(Object.entries(bottomSheetSets).map(([id, set]) => [id, set.name])) },
};

/**
 * The sheet's scenarios, from the same page. Options name playground controls only;
 * every one opens declared, its state and handle set as its figure shows them.
 */
const bottomSheetScenarios: readonly Scenario[] = [
  {
    id: 'photo-sharing', name: 'Photo sharing', source: 'https://m3.material.io/components/bottom-sheets/guidelines',
    description: 'Sharing a photo: copy it, or hand it to a contact.',
    options: { sheetSet: 'photo-sharing', variant: 'modal', dragHandle: true, initialState: 'expanded' },
  },
  {
    id: 'song-options', name: 'Song options', source: 'https://m3.material.io/components/bottom-sheets/guidelines',
    description: "A track's menu from the queue: playlist, album, artist, a sleep timer, or play it next.",
    options: { sheetSet: 'song-options', variant: 'modal', dragHandle: false, initialState: 'expanded' },
  },
  {
    id: 'music-player', name: 'Music player', source: 'https://m3.material.io/components/bottom-sheets/guidelines',
    description: 'Playback docked at the bottom edge: Cassette Futurism, with pause and skip.',
    options: { sheetSet: 'music-player', variant: 'standard', dragHandle: false, initialState: 'partial', peekHeight: '64' },
  },
  {
    id: 'file-filters', name: 'File filters', source: 'https://m3.material.io/components/bottom-sheets/guidelines',
    description: 'Narrowing a file listing by category, the work files already on.',
    options: { sheetSet: 'file-filters', variant: 'modal', dragHandle: true, initialState: 'expanded' },
  },
];

export const bottomSheetComponent = {
  group: 'Containment', name: 'Bottom sheet', factory: 'createBottomSheet', variable: 'sheet',
  description: 'Reveal more from the bottom edge. Try partial and expanded states, or drag the handle.',
  summary: 'Supporting content from the bottom edge.', styles: ['progress', 'button', 'bottom-sheet'],
  scenarios: bottomSheetScenarios,
  controls: [
    ...section('Appearance', [choose('variant', 'Variant', ['standard', 'modal'], 'modal'), toggle('dragHandle', 'Drag handle', true)]),
    ...section('Layout', [{ ...range('peekHeight', 'Peek height', '120'), min: 56, max: 240, step: 8 }, { ...range('maxWidth', 'Maximum width', '640'), min: 280, max: 640, step: 20 }]),
    ...section('Content', [sheetSetControl, { ...text('title', 'Title', 'Plan your visit'), enabledWhen: 'sheetContentDefault', replaced: true }, { ...text('content', 'Body', 'Find a new trail, take in the view, and make time for a quiet moment.'), enabledWhen: 'sheetContentDefault', replaced: true }]),
    ...section('Behavior', [choose('initialState', 'State', ['hidden', 'partial', 'expanded'], 'hidden', 'select'), toggle('closeOnScrimClick', 'Dismiss on scrim', true), toggle('closeOnEscape', 'Dismiss with Escape', true)]),
  ],
  config: (state: ComponentState): BottomSheetConfig => {
    const named = sheetSet(state);
    return {
      variant: pick(state, 'variant', ['standard', 'modal'], 'modal'),
      initialState: pick(state, 'initialState', ['hidden', 'partial', 'expanded'], 'hidden'),
      dragHandle: bool(state, 'dragHandle'),
      peekHeight: Number(state.peekHeight),
      maxWidth: Number(state.maxWidth),
      title: named?.title ?? string(state, 'title'),
      content: named?.content ?? paragraph(string(state, 'content')),
      closeOnScrimClick: bool(state, 'closeOnScrimClick'),
      closeOnEscape: bool(state, 'closeOnEscape'),
    };
  },
};
