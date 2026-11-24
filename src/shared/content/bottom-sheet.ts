// The bottom sheet's playground content: its named content sets and its registry entry.
import type { BottomSheetConfig } from 'material/components/bottom-sheet';
import { symbols } from '../icons';
import { type ComponentState, type Control, type Scenario, bool, choose, paragraph, pick, range, section, string, text, toggle } from './types';

/** An attribute's value inside content markup: icons are SVG, full of quotes. */
const attr = (value: string): string => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const photo = (id: number, size: number): string => `https://picsum.photos/id/${id}/${size}/${size}`;
const iconButton = (label: string, svg: string, variant = 'standard'): string =>
  `<m-icon-button variant="${variant}" icon="${attr(svg)}" aria-label="${label}"></m-icon-button>`;
const actionRow = (label: string, svg: string): string =>
  `<m-list-item value="${label.toLowerCase().replaceAll(' ', '-')}" leading-icon="${attr(svg)}">${label}</m-list-item>`;
const sectionLabel = (label: string): string =>
  `<p style="margin: 0; font-size: 14px; line-height: 20px; font-weight: 500">${label}</p>`;

/** Share a photo: quick actions as assist chips, then the people shared with most. */
const person = (name: string, detail: string, id: number): string =>
  `<m-list-item value="${name.toLowerCase()}" leading-avatar="${attr(`<img src="${photo(id, 80)}" alt="">`)}" supporting-text="${detail}" trailing-icon="${attr(symbols.send)}">${name}</m-list-item>`;
const photoSharing = `<div style="display: flex; flex-direction: column; gap: 8px; padding: 0 0 16px">
  <div><m-chips aria-label="Share actions"><m-chip variant="assist" value="copy" icon="${attr(symbols.contentCopy)}">Copy link</m-chip><m-chip variant="assist" value="nearby" icon="${attr(symbols.nearMe)}">Nearby</m-chip><m-chip variant="assist" value="save" icon="${attr(symbols.download)}">Save</m-chip></m-chips></div>
  <m-list style="--mtrl-sys-color-surface: transparent; margin-inline: -8px" aria-label="Share with">${person('Alejandro Ortega', 'Shared yesterday', 1005)}${person('Ines Moreau', 'Shared last week', 1027)}${person('Oli Berg', 'In your Trips album', 338)}</m-list>
</div>`;

/** A track's actions: which track, a divider, then one list of what can be done with it. */
const songOptions = `<div style="display: flex; flex-direction: column; padding-bottom: 8px">
  <m-list style="--mtrl-sys-color-surface: transparent; margin-inline: -8px" aria-label="Track"><m-list-item value="track" leading-image="${photo(429, 112)}" supporting-text="Various artists">Oli's Picks</m-list-item></m-list>
  <m-divider></m-divider>
  <m-list style="--mtrl-sys-color-surface: transparent; margin-inline: -8px" aria-label="Track actions">${actionRow('Play next', symbols.playlistPlay)}${actionRow('Add to playlist', symbols.playlistAdd)}${actionRow('Go to album', symbols.album)}${actionRow('Go to artist', symbols.personSearch)}${actionRow('Sleep timer', symbols.bedtime)}</m-list>
</div>`;

/** A docked player: the track and its controls in the peek, the seek bar and what's next when dragged up. */
const musicPlayer = `<div style="display: flex; flex-direction: column">
  <div style="display: flex; align-items: center; gap: 12px; padding-bottom: 8px">
    <img src="${photo(445, 88)}" alt="" style="width: 44px; height: 44px; border-radius: 8px" />
    <div style="display: flex; flex-direction: column; flex: 1; min-width: 0"><span style="font-size: 14px; line-height: 20px; font-weight: 500">Cassette Futurism</span><span style="font-size: 12px; line-height: 16px">Various artists</span></div>
    ${iconButton('Pause', symbols.pause, 'tonal')}${iconButton('Skip to next track', symbols.skipNext)}
  </div>
  <div style="padding-top: 8px"><m-slider value="38" min="0" max="100" label="Seek" aria-label="Seek"></m-slider></div>
  <div style="padding-top: 12px">${sectionLabel('Up next')}</div>
  <m-list style="--mtrl-sys-color-surface: transparent; margin-inline: -8px" aria-label="Up next"><m-list-item value="neon" leading-image="${photo(453, 112)}" supporting-text="Night Drive">Neon Harbor</m-list-item><m-list-item value="static" leading-image="${photo(482, 112)}" supporting-text="The Long Wave">Static Bloom</m-list-item></m-list>
</div>`;

/** One of the filters: the library's checkbox, its label in the attribute the element reads. */
const filter = (label: string, checked = false): string =>
  `<m-checkbox label="${label}"${checked ? ' checked="true"' : ''}></m-checkbox>`;

/** Filtering files: type as filter chips, categories as checkboxes, and a way to apply or clear. */
const fileFilters = `<div style="display: flex; flex-direction: column; gap: 12px; padding-bottom: 16px">
  ${sectionLabel('Type')}
  <m-chips selection="multi" aria-label="File type"><m-chip variant="filter" value="documents" selected="true">Documents</m-chip><m-chip variant="filter" value="images">Images</m-chip><m-chip variant="filter" value="video">Video</m-chip></m-chips>
  <m-divider></m-divider>
  ${sectionLabel('Category')}
  <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr))">${filter('Work files', true)}${filter('Personal')}${filter('Projects')}${filter('Priority')}</div>
  <div style="display: flex; justify-content: flex-end; gap: 8px"><m-button variant="text">Clear all</m-button><m-button>Show 24 files</m-button></div>
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
 * sheet stays exactly as it was. The content is markup the sheet serves through
 * `content`, built from material's own elements (src/shared/embedded-elements.ts).
 */
const bottomSheetSets: Record<string, BottomSheetSet> = {
  'photo-sharing': { name: 'Photo sharing', title: 'Share photo', content: photoSharing },
  'song-options': { name: 'Song options', title: '', content: songOptions },
  'music-player': { name: 'Music player', title: '', content: musicPlayer },
  'file-filters': { name: 'File filters', title: 'Filter files', content: fileFilters },
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
    description: 'Share a photo: quick actions, then the people you share with most.',
    options: { sheetSet: 'photo-sharing', variant: 'modal', dragHandle: true, initialState: 'expanded' },
  },
  {
    id: 'song-options', name: 'Song options', source: 'https://m3.material.io/components/bottom-sheets/guidelines',
    description: "A track's actions: play it next, add it to a playlist, or go to its album or artist.",
    options: { sheetSet: 'song-options', variant: 'modal', dragHandle: false, initialState: 'expanded' },
  },
  {
    id: 'music-player', name: 'Music player', source: 'https://m3.material.io/components/bottom-sheets/guidelines',
    description: 'A docked player: pause or skip from the peek, drag up to seek and see what is next.',
    options: { sheetSet: 'music-player', variant: 'standard', dragHandle: true, initialState: 'partial', peekHeight: '112' },
  },
  {
    id: 'file-filters', name: 'File filters', source: 'https://m3.material.io/components/bottom-sheets/guidelines',
    description: 'Narrow a file list by type and category, then apply or clear.',
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
    ...section('Content', [sheetSetControl, { ...text('title', 'Title', 'Plan your visit'), enabledWhen: 'sheetContentDefault', replaced: 'sheetContentDefault' }, { ...text('content', 'Body', 'Find a new trail, take in the view, and make time for a quiet moment.'), enabledWhen: 'sheetContentDefault', replaced: 'sheetContentDefault' }]),
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
