// The list's playground content: its named content sets and its registry entry, moved from
// src/shared/components.ts.
import type { ListConfig, ListItem, ListSlot } from 'material/components/list';
import { type ComponentState, type Control, type Scenario, choose, iconByName, landscape, pick, section, string, text, toggle } from './types';

/** A person's photo in the avatar slot's circle, as the guidelines figures show them. */
const avatarPhoto = (photo: number): ListSlot =>
  ({ type: 'avatar', content: `<img src="https://picsum.photos/id/${photo}/80/80" alt="">` });

/** A color's swatch: a filled circle the icon slot serves at its own size. */
const swatch = (color: string): ListSlot =>
  ({ type: 'icon', content: `<svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="12" fill="${color}"/></svg>` });

/** A plant's photo in the image slot's square. */
const plantPhoto = (photo: number): ListSlot =>
  ({ type: 'image', content: `<img src="https://picsum.photos/id/${photo}/112/112" alt="">` });

/**
 * Figure 17's inbox: today's three threads, a photo sender and a preview line each.
 * The figure cuts every preview at the right edge; the words past each cut are ours.
 */
const inboxThreads: ListItem[] = [
  { kind: 'subheader', headline: 'Today' },
  { id: 'tickets', headline: 'Pre-sale concert tickets', supportingText: 'I just saw there are a couple good deals left', leading: avatarPhoto(1005) },
  { id: 'lunch', headline: 'Good healthy lunch idea', supportingText: 'My coworker just sent this recipe and it looks easy', leading: avatarPhoto(1027) },
  { id: 'birthday', headline: 'Cumpleaños de mamá', supportingText: "With mamá's birthday around the corner, let's plan", leading: avatarPhoto(338) },
];

/**
 * Figure 3's color choice: swatches and names, Periwinkle the one chosen. The
 * figure's third row is cut to its dark swatch, its name unreadable: the two
 * rows whose words it shows are the ones built. The choice is the list's own
 * single selection — the trailing checkbox is a gap, see briefs/gaps.md.
 */
const colorPicker: ListItem[] = [
  { kind: 'subheader', headline: 'Color selection' },
  { id: 'periwinkle', headline: 'Periwinkle', leading: swatch('#8C9EFF'), selected: true },
  { id: 'mauve', headline: 'Mauve', leading: swatch('#B39DDB') },
];

/**
 * Figure 10's cart: the subheader counts four. The crop ends after the second
 * row, so Cactus and Succulent are the figure's (Succulent's second line is
 * cut; the words on it are ours) and the next two are catalog plants of the
 * same shape: a square photo, a name, "In stock", no price.
 */
const plantCart: ListItem[] = [
  { kind: 'subheader', headline: '4 items in your cart' },
  { id: 'cactus', headline: 'Cactus', supportingText: 'In stock', leading: plantPhoto(530) },
  { id: 'succulent', headline: 'Succulent', supportingText: 'In stock', leading: plantPhoto(958) },
  { id: 'moss', headline: 'Tropical moss', supportingText: 'In stock', leading: plantPhoto(803) },
  { id: 'frangipani', headline: 'Frangipani', supportingText: 'In stock', leading: plantPhoto(106) },
];

/** Figure 12's contacts: one line each, a photo apiece, nothing trailing. */
const addressBook: ListItem[] = [
  { id: 'alejandro', headline: 'Alejandro Ortega', leading: avatarPhoto(1005) },
  { id: 'sofia', headline: 'Sofia Sacchi', leading: avatarPhoto(1027) },
  { id: 'ana', headline: 'Ana Russo', leading: avatarPhoto(338) },
];

/** A named list: its items whole, and the accessible name its screen carries in the figure. */
interface ListSet {
  name: string;
  items: ListItem[];
  ariaLabel: string;
}

/**
 * Named lists from m3.material.io/components/lists/guidelines (read 5 October
 * 2026), figures 17, 3, 10 and 12. `default` is not here: today's ideas list
 * stays exactly as it was. The senders and contacts are the same photos the
 * share sheet's contacts use; the cart's plants are the catalog's own
 * photographs (530 and 958 the figure's, 803 and 106 the two past its crop).
 * See briefs/gaps.md.
 */
const listSets: Record<string, ListSet> = {
  'inbox-threads': { name: 'Inbox threads', items: inboxThreads, ariaLabel: 'Inbox' },
  'color-picker': { name: 'Color picker', items: colorPicker, ariaLabel: 'Color selection' },
  'plant-cart': { name: 'Plant cart', items: plantCart, ariaLabel: 'Cart' },
  'address-book': { name: 'Address book', items: addressBook, ariaLabel: 'Contacts' },
};

const listSet = (state: ComponentState): ListSet | undefined => listSets[string(state, 'listSet')];

const listSetControl: Control = {
  ...choose('listSet', 'Items', ['default', ...Object.keys(listSets)], 'default', 'select'),
  labels: { default: 'Default', ...Object.fromEntries(Object.entries(listSets).map(([id, set]) => [id, set.name])) },
};

function listConfig(state: ComponentState): ListConfig<ListItem> {
  // Only a segmented list writes the variant: standard is the factory's own default.
  const variant = pick(state, 'variant', ['standard', 'segmented'], 'standard');
  const named = listSet(state);
  const items: ListItem[] = [];
  if (named) {
    items.push(...named.items);
  } else {
    const labels = ['Morning walk', 'Read a chapter', 'Try a new recipe', 'Call a friend', 'Plan a weekend'].slice(0, Number(state.count));
    if (state.subheader) items.push({ kind: 'subheader', headline: 'Ideas for today' });
    labels.forEach((headline, index) => {
      if (index && state.dividers !== 'none') items.push({ kind: 'divider', ...(state.dividers === 'inset' ? { inset: true } : {}) });
      let leading: ListSlot | undefined;
      if (state.leading === 'icon') leading = { type: 'icon', content: iconByName(['heart', 'bookmark', 'download'][index % 3]!) };
      if (state.leading === 'avatar') leading = { type: 'avatar', content: headline.split(' ').map(word => word[0]).slice(0, 2).join('').toUpperCase() };
      if (state.leading === 'image' || state.leading === 'video') leading = { type: state.leading, content: `<img src="${landscape(index)}" alt="">` };
      let trailing: ListSlot | undefined;
      if (state.trailing === 'text') trailing = { type: 'text', content: `${(index + 1) * 5} min` };
      if (state.trailing === 'icon') trailing = { type: 'icon', content: iconByName('bookmark') };
      if (state.trailing === 'control') trailing = { type: 'control', content: `<button type="button" data-list-action="${headline}" aria-label="Save ${headline}" style="color:inherit;font:inherit;min-width:48px;min-height:48px;background:transparent;border:0;cursor:pointer">Save</button>` };
      items.push({ id: String(index + 1), headline, lines: Number(state.lines) as 1 | 2 | 3,
        ...(state.lines !== '1' ? { supportingText: string(state, 'supportingText') } : {}),
        ...(state.lines === '3' && state.overline ? { overline: 'Daily inspiration' } : {}),
        ...(leading ? { leading } : {}), ...(trailing ? { trailing } : {}),
        ...(state.disableLast && index === labels.length - 1 ? { disabled: true } : {}),
      });
    });
  }
  return { ...(variant === 'standard' ? {} : { variant }), items, ariaLabel: named?.ariaLabel ?? (string(state, 'ariaLabel').trim() || 'Ideas for today'),
    trackSelection: state.selection !== 'none', multiSelect: state.selection === 'multi',
    // A named list's selection is its items' own; the positional toggles are for the default's.
    initialSelection: named ? [] : ['first', 'second', 'third', 'fourth', 'fifth'].flatMap((key, index) => state[key] && index < Number(state.count) && state.selection !== 'none' ? [String(index + 1)] : []) };
}

/**
 * The list's scenarios, from the same page. Options name playground controls only;
 * each row's items, senders and words come from its set.
 */
const listScenarios: readonly Scenario[] = [
  {
    id: 'inbox-threads', name: 'Inbox threads', source: 'https://m3.material.io/components/lists/guidelines',
    description: "Today's mail at a glance: who wrote, and the first line of what they said.",
    options: { listSet: 'inbox-threads', variant: 'segmented', selection: 'none' },
  },
  {
    id: 'color-picker', name: 'Color picker', source: 'https://m3.material.io/components/lists/guidelines',
    description: 'Choosing a color by its swatch and name, one of them already picked.',
    options: { listSet: 'color-picker', selection: 'single' },
  },
  {
    id: 'plant-cart', name: 'Plant cart', source: 'https://m3.material.io/components/lists/guidelines',
    description: 'The plants headed for checkout, each one still in stock.',
    options: { listSet: 'plant-cart', selection: 'none' },
  },
  {
    id: 'address-book', name: 'Address book', source: 'https://m3.material.io/components/lists/guidelines',
    description: 'Contacts to call: a face and a name, one line each.',
    options: { listSet: 'address-book', selection: 'none' },
  },
];

export const listComponent = {
  group: 'Containment', name: 'List', factory: 'createList', variable: 'list',
  description: 'Explore Material list anatomy. Configure text lines, media, supporting actions, and selection.',
  summary: 'One, two, or three lines with flexible content slots.', styles: ['list'],
  scenarios: listScenarios,
  controls: [
    ...section('Appearance', [choose('variant', 'Variant', ['standard', 'segmented'], 'standard')]),
    ...section('Layout', [
      { ...choose('lines', 'Text lines', ['1', '2', '3'], '2'), enabledWhen: 'listContentDefault', replaced: true },
      { ...choose('leading', 'Leading', ['none', 'icon', 'avatar', 'image', 'video'], 'icon', 'select'), enabledWhen: 'listContentDefault', replaced: true },
      { ...choose('trailing', 'Trailing', ['none', 'text', 'icon', 'control'], 'text', 'select'), enabledWhen: 'listContentDefault', replaced: true },
      { ...choose('dividers', 'Dividers', ['none', 'full-width', 'inset'], 'none', 'select'), enabledWhen: 'listContentDefault', replaced: true },
      { ...toggle('subheader', 'Subheader'), enabledWhen: 'listContentDefault', replaced: true },
    ]),
    ...section('Content', [
      listSetControl,
      { ...choose('count', 'Item count', ['3', '5'], '3'), enabledWhen: 'listContentDefault', replaced: true },
      { ...text('supportingText', 'Supporting text', 'Make a little time for yourself'), enabledWhen: 'hasSupporting' },
      { ...toggle('overline', 'Overline', false, 'threeLines') },
      { ...text('ariaLabel', 'Accessible label', 'Ideas for today'), enabledWhen: 'listContentDefault', replaced: true },
    ]),
    ...section('Behavior', [
      choose('selection', 'Selection', ['none', 'single', 'multi'], 'single'),
      { ...toggle('disableLast', 'Disable last item'), enabledWhen: 'listContentDefault', replaced: true },
      toggle('first', 'First selected', true, 'selectable'),
      toggle('second', 'Second selected', false, 'selectable'),
      toggle('third', 'Third selected', false, 'selectable'),
      toggle('fourth', 'Fourth selected', false, 'extraSelectable'),
      toggle('fifth', 'Fifth selected', false, 'extraSelectable'),
    ]),
  ],
  config: (state: ComponentState): ListConfig<ListItem> => listConfig(state),
};
