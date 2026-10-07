// The side sheet's playground content: its named content sets and its registry entry.
import type { SideSheetConfig } from 'material/components/side-sheet';
import { type ComponentState, type Control, type Scenario, bool, choose, paragraph, pick, range, section, string, text, toggle } from './types';

/** A small group label above a block of controls, as the guidelines figures set them. */
const subhead = (label: string): string =>
  `<span style="font-size: 12px; font-weight: 500; padding: 12px 0 4px">${label}</span>`;

/** A filter checkbox; its initial state written as the attribute HTML takes. */
const filter = (label: string, checked = false): string =>
  `<label style="display: flex; align-items: center; gap: 12px; padding: 10px 0; font-size: 14px"><input type="checkbox"${checked ? ' checked="true"' : ''} /><span>${label}</span></label>`;

/** One of the density radios; the group's choice written as the attribute HTML takes. */
const density = (label: string, checked = false): string =>
  `<label style="display: flex; align-items: center; gap: 12px; padding: 10px 0; font-size: 14px"><input type="radio" name="density"${checked ? ' checked="true"' : ''} /><span>${label}</span></label>`;

/** One of figure 1's album rows: a rounded thumbnail spanning both of its lines. */
const album = (name: string, details: string, photo: number): string =>
  `<div style="display: flex; align-items: center; gap: 12px; padding: 8px 0"><img src="https://picsum.photos/id/${photo}/112/112" alt="" style="width: 56px; height: 56px; border-radius: 4px" /><div style="display: flex; flex-direction: column; gap: 2px"><span style="font-size: 16px; font-weight: 500">${name}</span><span style="font-size: 14px">${details}</span></div></div>`;

/** Figure 1's photo facts: the photo's name, then the albums it lives in. */
const photoInfo = `<div style="display: flex; flex-direction: column; padding: 4px 24px 24px">
  <span style="font-size: 20px; font-weight: 500; padding: 8px 0 16px">Festival concert</span>
  <hr style="border: none; border-top: 1px solid; margin: 0" />
  ${subhead('Albums')}
  ${album('Home space', '64 items • November 5', 312)}
  ${album('Favorite sights', '378 items • October 28', 1011)}
</div>`;

/**
 * Figure 2's filters: the label checkboxes. The figure's second group ("Format", its
 * one visible row reading "All") is cut by the sheet's edge there and is left out.
 */
const searchFilters = `<div style="display: flex; flex-direction: column; padding: 4px 24px 24px">
  ${subhead('Labels')}
  ${filter('Events')}
  ${filter('Personal')}
  ${filter('Projects', true)}
  ${filter('Reminders', true)}
  ${filter('Family')}
</div>`;

/** Figure 12's display settings: the density group, Compact chosen. */
const appearanceSettings = `<div style="display: flex; flex-direction: column; padding: 4px 24px 24px">
  ${subhead('Density')}
  ${density('Default')}
  ${density('Comfortable')}
  ${density('Compact', true)}
</div>`;

/** A named sheet: the headline its content needs, and the content whole. */
interface SideSheetSet {
  name: string;
  title: string;
  content: string;
}

/**
 * Named sheets from m3.material.io/components/side-sheets/guidelines (read 5
 * October 2026), figures 1, 2 and 12. `default` is not here: today's details
 * sheet stays exactly as it was. The content is native HTML the sheet serves
 * through `content` — it has no list, checkbox or radio templates of its own.
 * See briefs/gaps.md.
 */
const sideSheetSets: Record<string, SideSheetSet> = {
  'photo-info': { name: 'Photo info', title: 'Info', content: photoInfo },
  'search-filters': { name: 'Search filters', title: 'Filters', content: searchFilters },
  'appearance-settings': { name: 'Appearance settings', title: 'Settings', content: appearanceSettings },
};

const sheetSet = (state: ComponentState): SideSheetSet | undefined => sideSheetSets[string(state, 'sheetSet')];

const sheetSetControl: Control = {
  ...choose('sheetSet', 'Sheet', ['default', ...Object.keys(sideSheetSets)], 'default', 'select'),
  labels: { default: 'Default', ...Object.fromEntries(Object.entries(sideSheetSets).map(([id, set]) => [id, set.name])) },
};

/**
 * The sheet's scenarios, from the same page. Options name playground controls only;
 * every one opens declared, docked where its figure shows it.
 */
const sideSheetScenarios: readonly Scenario[] = [
  {
    id: 'photo-info', name: 'Photo info', source: 'https://m3.material.io/components/side-sheets/guidelines',
    description: 'Inspecting a photo: its name, Festival concert, and the albums it lives in.',
    options: { sheetSet: 'photo-info', variant: 'standard', position: 'end', open: true },
  },
  {
    id: 'search-filters', name: 'Search filters', source: 'https://m3.material.io/components/side-sheets/guidelines',
    description: 'Filtering by label: Projects and Reminders checked.',
    options: { sheetSet: 'search-filters', variant: 'modal', position: 'end', open: true },
  },
  {
    id: 'appearance-settings', name: 'Appearance settings', source: 'https://m3.material.io/components/side-sheets/guidelines',
    description: 'Choosing a display density: Compact selected.',
    options: { sheetSet: 'appearance-settings', variant: 'standard', position: 'end', open: true },
  },
];

export const sideSheetComponent = {
  group: 'Containment', name: 'Side sheet', factory: 'createSideSheet', variable: 'sheet',
  description: 'Keep supporting details close by. Explore standard and modal sheets on either edge.',
  summary: 'Supporting details beside the main content.', styles: ['progress', 'button', 'side-sheet'],
  scenarios: sideSheetScenarios,
  controls: [
    ...section('Appearance', [choose('variant', 'Variant', ['standard', 'modal'], 'modal')]),
    ...section('Layout', [choose('position', 'Position', ['start', 'end'], 'end'), { ...range('width', 'Width', '320'), min: 240, max: 400, step: 20 }]),
    ...section('Content', [sheetSetControl, { ...text('title', 'Title', 'Details'), enabledWhen: 'sheetContentDefault', replaced: 'sheetContentDefault' }, { ...text('content', 'Body', 'A place for useful context, related information, and supporting actions.'), enabledWhen: 'sheetContentDefault', replaced: 'sheetContentDefault' }]),
    ...section('Behavior', [toggle('open', 'Open'), toggle('closeButton', 'Close button', true), toggle('closeOnScrimClick', 'Dismiss on scrim', true), toggle('closeOnEscape', 'Dismiss with Escape', true)]),
  ],
  config: (state: ComponentState): SideSheetConfig => {
    const named = sheetSet(state);
    return {
      variant: pick(state, 'variant', ['standard', 'modal'], 'modal'),
      position: pick(state, 'position', ['start', 'end'], 'end'),
      width: Number(state.width),
      title: named?.title ?? string(state, 'title'),
      content: named?.content ?? paragraph(string(state, 'content')),
      open: bool(state, 'open'),
      closeButton: bool(state, 'closeButton'),
      closeOnScrimClick: bool(state, 'closeOnScrimClick'),
      closeOnEscape: bool(state, 'closeOnEscape'),
    };
  },
};
